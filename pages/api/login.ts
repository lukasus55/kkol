import type { NextApiRequest, NextApiResponse } from 'next';
import type { Player } from '../../types/db';
import bcrypt from 'bcrypt';
import sql from '../../db.js';
import { createSession, setSessionCookie } from '../../lib/auth';

interface LoginRequest extends NextApiRequest {
    body: {
        username?: string;
        password?: string;
        appId?: string;
    };
}

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: User login
 *     description: Authenticates a user, creates a server-side session in PostgreSQL, and sets an HTTP-only cookie.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *               appId:
 *                 type: string
 *                 description: Optional ecosystem application identifier (defaults to kkol_main)
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                   description: Raw session token for SSO callbacks or authorization header
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     role:
 *                       type: string
 *       400:
 *         description: Missing credentials
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account disabled
 *       405:
 *         description: Method not allowed
 *       500:
 *         description: Internal server error
 */
export default async function handler(request: LoginRequest, response: NextApiResponse) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { username, password, appId } = request.body || {};

        if (!username || !password) {
            return response.status(400).json({ error: "Username and password are required" });
        }

        const users = await sql<Pick<Player, 'id' | 'password_hash' | 'role' | 'is_active'>[]>`
            SELECT id, password_hash, role, is_active 
            FROM players 
            WHERE id = ${username}
        `;

        const user = users[0];
        if (!user) {
            return response.status(401).json({ error: "Invalid username or password" }); 
        }

        if (user.is_active === false) {
            return response.status(403).json({ error: "This account has been disabled." });
        }

        const passwordsMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordsMatch) {
            return response.status(401).json({ error: "Invalid username or password" });
        }

        await sql`UPDATE players SET last_login = CURRENT_TIMESTAMP WHERE id = ${user.id}`;

        const { token, session } = await createSession(user.id, request, {
            appId: appId || 'kkol_main',
            role: user.role
        });

        setSessionCookie(response, token, session.expires_at);

        return response.status(200).json({ 
            message: "Login successful!",
            token,
            user: {
                id: user.id,
                role: user.role
            }
        });

    } catch (error: any) {
        console.error("Login Error:", error);
        return response.status(500).json({ error: "Internal server error during login" });
    }
}