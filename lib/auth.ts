import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { uuidv7 } from 'uuidv7';
import { parse, serialize } from 'cookie';
import type { NextApiRequest, NextApiResponse } from 'next';
import sql from '../db.js';
import type { Session, Player } from '../types/db';

export const AUTH_COOKIE_NAME = 'auth_token';
export const DEFAULT_SESSION_DURATION_DAYS = 30;

export interface SessionUser {
    id: string;
    role: string | null;
    displayed_name: string;
    is_active: boolean | null;
}

export interface AuthContext {
    session: Session;
    user: SessionUser;
}

/**
 * Hashes a raw token with SHA-256 for secure storage in database.
 */
export function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generates a cryptographically strong 32-byte (64 hex characters) random token.
 */
export function generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Extracts a readable device/browser description from User-Agent.
 */
export function parseDeviceInfo(userAgent?: string | null): string {
    if (!userAgent) return 'Nieznane urządzenie';

    let os = 'Nieznany system';
    if (/windows phone/i.test(userAgent)) os = 'Windows Phone';
    else if (/win/i.test(userAgent)) os = 'Windows';
    else if (/android/i.test(userAgent)) os = 'Android';
    else if (/iphone|ipad|ipod/i.test(userAgent)) os = 'iOS';
    else if (/mac/i.test(userAgent)) os = 'macOS';
    else if (/linux/i.test(userAgent)) os = 'Linux';

    let browser = 'Przeglądarka';
    if (/edg/i.test(userAgent)) browser = 'Edge';
    else if (/opr|opera/i.test(userAgent)) browser = 'Opera';
    else if (/chrome|crios/i.test(userAgent)) browser = 'Chrome';
    else if (/firefox|fxios/i.test(userAgent)) browser = 'Firefox';
    else if (/safari/i.test(userAgent)) browser = 'Safari';

    return `${browser} (${os})`;
}

/**
 * Extracts client IP from request headers or socket.
 */
export function getClientIp(req: NextApiRequest): string | null {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
        const firstIp = forwarded.split(',')[0].trim();
        if (firstIp) return firstIp;
    }
    return req.socket?.remoteAddress || null;
}

/**
 * Extracts auth token from Authorization header or cookie.
 */
export function getAuthTokenFromRequest(req: NextApiRequest): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const bearerToken = authHeader.substring(7).trim();
        if (bearerToken) return bearerToken;
    }

    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
        const parsed = parse(cookieHeader);
        if (parsed[AUTH_COOKIE_NAME]) {
            return parsed[AUTH_COOKIE_NAME];
        }
    }

    return null;
}

/**
 * Creates and stores a new session in the database.
 * Token is formatted as a signed JWT containing { id, role, sessionId } to provide
 * 100% backward-compatibility with existing routes calling jwt.verify while binding to PostgreSQL sessions.
 */
export async function createSession(
    playerId: string,
    req: NextApiRequest,
    options?: { appId?: string; durationDays?: number; role?: string | null }
): Promise<{ token: string; session: Session }> {
    const sessionId = uuidv7();
    const durationDays = options?.durationDays ?? DEFAULT_SESSION_DURATION_DAYS;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    const secret = process.env.JWT_SECRET || 'kkol_jwt_secret_fallback';
    const token = jwt.sign(
        { id: playerId, role: options?.role ?? null, sessionId },
        secret,
        { expiresIn: `${durationDays}d` }
    );
    const tokenHash = hashToken(token);

    const rawUa = req.headers['user-agent'] || null;
    const ip = getClientIp(req);
    const deviceInfo = parseDeviceInfo(rawUa);
    const appId = options?.appId || 'kkol_main';

    const [session] = await sql<Session[]>`
        INSERT INTO sessions (
            id, player_id, token_hash, ip_address, user_agent, device_info, app_id, expires_at
        ) VALUES (
            ${sessionId}, ${playerId}, ${tokenHash}, ${ip}, ${rawUa}, ${deviceInfo}, ${appId}, ${expiresAt.toISOString()}
        )
        RETURNING *
    `;

    return { token, session };
}

/**
 * Verifies the session token and fetches the associated active user.
 * Supports both JWTs with sessionId and opaque API tokens.
 */
export async function verifySession(req: NextApiRequest): Promise<AuthContext | null> {
    const token = getAuthTokenFromRequest(req);
    if (!token) return null;

    let sessionId: string | null = null;
    try {
        const secret = process.env.JWT_SECRET || 'kkol_jwt_secret_fallback';
        const decoded = jwt.verify(token, secret) as any;
        if (decoded && decoded.sessionId) {
            sessionId = decoded.sessionId;
        }
    } catch {
        // Fall back to searching by raw token hash (for non-JWT tokens or legacy)
    }

    type JoinResult = Session & {
        user_role: string | null;
        user_displayed_name: string;
        user_is_active: boolean | null;
    };

    let rows: JoinResult[];
    if (sessionId) {
        rows = await sql<JoinResult[]>`
            SELECT 
                s.*,
                p.role AS user_role,
                p.displayed_name AS user_displayed_name,
                p.is_active AS user_is_active
            FROM sessions s
            JOIN players p ON s.player_id = p.id
            WHERE s.id = ${sessionId}
              AND s.expires_at > CURRENT_TIMESTAMP
        `;
    } else {
        const tokenHash = hashToken(token);
        rows = await sql<JoinResult[]>`
            SELECT 
                s.*,
                p.role AS user_role,
                p.displayed_name AS user_displayed_name,
                p.is_active AS user_is_active
            FROM sessions s
            JOIN players p ON s.player_id = p.id
            WHERE s.token_hash = ${tokenHash}
              AND s.expires_at > CURRENT_TIMESTAMP
        `;
    }

    const row = rows[0];
    if (!row) return null;

    if (row.user_is_active === false) {
        return null;
    }

    // Throttle updating last_active_at (only update if > 5 minutes passed)
    const lastActive = new Date(row.last_active_at).getTime();
    const now = Date.now();
    if (now - lastActive > 5 * 60 * 1000) {
        sql`UPDATE sessions SET last_active_at = CURRENT_TIMESTAMP WHERE id = ${row.id}`.catch(err => {
            console.error('Failed to update session last_active_at:', err);
        });
    }

    const { user_role, user_displayed_name, user_is_active, ...session } = row;

    return {
        session,
        user: {
            id: session.player_id,
            role: user_role,
            displayed_name: user_displayed_name,
            is_active: user_is_active,
        }
    };
}

/**
 * Revokes (deletes) a specific session.
 */
export async function revokeSession(sessionId: string, playerId?: string): Promise<boolean> {
    const result = playerId
        ? await sql`DELETE FROM sessions WHERE id = ${sessionId} AND player_id = ${playerId} RETURNING id`
        : await sql`DELETE FROM sessions WHERE id = ${sessionId} RETURNING id`;

    return result.length > 0;
}

/**
 * Revokes all sessions for a user, optionally exempting the current one.
 */
export async function revokeAllUserSessions(playerId: string, exceptSessionId?: string): Promise<number> {
    const result = exceptSessionId
        ? await sql`DELETE FROM sessions WHERE player_id = ${playerId} AND id != ${exceptSessionId} RETURNING id`
        : await sql`DELETE FROM sessions WHERE player_id = ${playerId} RETURNING id`;

    return result.length;
}

/**
 * Sets session cookie on response.
 */
export function setSessionCookie(res: NextApiResponse, token: string, expiresAt: Date | string): void {
    const cookieHeader = serialize(AUTH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(expiresAt),
        path: '/'
    });
    res.setHeader('Set-Cookie', cookieHeader);
}

/**
 * Clears session cookie on response.
 */
export function clearSessionCookie(res: NextApiResponse): void {
    const cookieHeader = serialize(AUTH_COOKIE_NAME, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: -1,
        path: '/'
    });
    res.setHeader('Set-Cookie', cookieHeader);
}
