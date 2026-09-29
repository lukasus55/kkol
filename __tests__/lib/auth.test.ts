import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import {
    hashToken,
    generateToken,
    parseDeviceInfo,
    getClientIp,
    getAuthTokenFromRequest,
    setSessionCookie,
    clearSessionCookie,
    createSession,
    verifySession,
    revokeSession,
    revokeAllUserSessions,
    AUTH_COOKIE_NAME
} from '../../lib/auth';

const { mockSql } = vi.hoisted(() => {
    return { mockSql: vi.fn() };
});

vi.mock('../../db.js', () => ({
    default: mockSql
}));

describe('Auth Library (lib/auth.ts)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('hashToken and generateToken', () => {
        test('generateToken produces a 64-character hex string', () => {
            const token = generateToken();
            expect(token).toHaveLength(64);
            expect(typeof token).toBe('string');
        });

        test('hashToken produces consistent sha256 output', () => {
            const token = 'sample-token-12345';
            const hash1 = hashToken(token);
            const hash2 = hashToken(token);
            expect(hash1).toBe(hash2);
            expect(hash1).toHaveLength(64);
        });
    });

    describe('parseDeviceInfo', () => {
        test('detects Windows and Chrome', () => {
            const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
            expect(parseDeviceInfo(ua)).toBe('Chrome (Windows)');
        });

        test('detects iOS and Safari', () => {
            const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
            expect(parseDeviceInfo(ua)).toBe('Safari (iOS)');
        });

        test('detects Android and Firefox', () => {
            const ua = 'Mozilla/5.0 (Android 14; Mobile; rv:120.0) Gecko/120.0 Firefox/120.0';
            expect(parseDeviceInfo(ua)).toBe('Firefox (Android)');
        });

        test('returns fallback for empty user agent', () => {
            expect(parseDeviceInfo(null)).toBe('Nieznane urządzenie');
            expect(parseDeviceInfo('')).toBe('Nieznane urządzenie');
        });
    });

    describe('getClientIp', () => {
        test('extracts first IP from x-forwarded-for header', () => {
            const { req } = createMocks({
                headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18' }
            });
            expect(getClientIp(req as any)).toBe('203.0.113.195');
        });

        test('falls back to socket remoteAddress if x-forwarded-for is missing', () => {
            const { req } = createMocks();
            (req.socket as any).remoteAddress = '127.0.0.1';
            expect(getClientIp(req as any)).toBe('127.0.0.1');
        });
    });

    describe('getAuthTokenFromRequest', () => {
        test('extracts token from Bearer Authorization header', () => {
            const { req } = createMocks({
                headers: { authorization: 'Bearer my-bearer-token-123' }
            });
            expect(getAuthTokenFromRequest(req as any)).toBe('my-bearer-token-123');
        });

        test('extracts token from auth_token cookie', () => {
            const { req } = createMocks({
                headers: { cookie: `${AUTH_COOKIE_NAME}=my-cookie-token-456; other=1` }
            });
            expect(getAuthTokenFromRequest(req as any)).toBe('my-cookie-token-456');
        });

        test('returns null when neither header nor cookie is present', () => {
            const { req } = createMocks();
            expect(getAuthTokenFromRequest(req as any)).toBeNull();
        });
    });

    describe('setSessionCookie and clearSessionCookie', () => {
        test('setSessionCookie sets Set-Cookie header with token', () => {
            const { res } = createMocks();
            const expires = new Date(Date.now() + 10000);
            setSessionCookie(res as any, 'sample_token', expires);
            const header = res._getHeaders()['set-cookie'];
            expect(header).toBeDefined();
            expect(header).toContain(`${AUTH_COOKIE_NAME}=sample_token`);
            expect(header).toContain('HttpOnly');
            expect(header).toContain('SameSite=Lax');
        });

        test('clearSessionCookie sets Set-Cookie header to expire immediately', () => {
            const { res } = createMocks();
            clearSessionCookie(res as any);
            const header = res._getHeaders()['set-cookie'];
            expect(header).toBeDefined();
            expect(header).toContain('Max-Age=-1');
        });
    });

    describe('createSession', () => {
        test('inserts session into database and returns raw token and session', async () => {
            const mockCreatedSession = {
                id: '018f-uuid',
                player_id: 'player1',
                token_hash: 'somehash',
                ip_address: '127.0.0.1',
                device_info: 'Chrome (Windows)',
                app_id: 'kkol_main',
                created_at: new Date(),
                last_active_at: new Date(),
                expires_at: new Date()
            };

            mockSql.mockResolvedValueOnce([mockCreatedSession]);

            const { req } = createMocks({
                headers: {
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
                    'x-forwarded-for': '127.0.0.1'
                }
            });

            const result = await createSession('player1', req as any, { role: 'player' });
            expect(result.token).toBeDefined();
            expect(typeof result.token).toBe('string');
            expect(result.session).toEqual(mockCreatedSession);
            expect(mockSql).toHaveBeenCalledTimes(1);
        });
    });

    describe('verifySession', () => {
        test('returns null if request has no token', async () => {
            const { req } = createMocks();
            const result = await verifySession(req as any);
            expect(result).toBeNull();
        });

        test('returns null if token does not match any active session in database', async () => {
            const { req } = createMocks({
                headers: { authorization: 'Bearer invalid_token' }
            });
            mockSql.mockResolvedValueOnce([]);

            const result = await verifySession(req as any);
            expect(result).toBeNull();
        });

        test('returns null if user is inactive', async () => {
            const { req } = createMocks({
                headers: { authorization: 'Bearer valid_token' }
            });
            mockSql.mockResolvedValueOnce([{
                id: 'sess1',
                player_id: 'player1',
                user_is_active: false,
                user_role: 'player',
                user_displayed_name: 'Player One',
                last_active_at: new Date()
            }]);

            const result = await verifySession(req as any);
            expect(result).toBeNull();
        });

        test('returns session and user for valid active session', async () => {
            const { req } = createMocks({
                headers: { authorization: 'Bearer valid_token' }
            });
            mockSql.mockResolvedValueOnce([{
                id: 'sess1',
                player_id: 'player1',
                user_is_active: true,
                user_role: 'admin',
                user_displayed_name: 'Admin Player',
                last_active_at: new Date()
            }]);

            const result = await verifySession(req as any);
            expect(result).not.toBeNull();
            expect(result?.user.id).toBe('player1');
            expect(result?.user.role).toBe('admin');
            expect(result?.session.id).toBe('sess1');
        });
    });

    describe('revokeSession and revokeAllUserSessions', () => {
        test('revokeSession deletes session and returns true when found', async () => {
            mockSql.mockResolvedValueOnce([{ id: 'sess1' }]);
            const deleted = await revokeSession('sess1', 'player1');
            expect(deleted).toBe(true);
        });

        test('revokeAllUserSessions deletes all other sessions', async () => {
            mockSql.mockResolvedValueOnce([{ id: 'sess2' }, { id: 'sess3' }]);
            const count = await revokeAllUserSessions('player1', 'sess1');
            expect(count).toBe(2);
        });
    });
});
