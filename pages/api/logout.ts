import type { NextApiRequest, NextApiResponse } from 'next';
import sql from '../../db.js';
import { getAuthTokenFromRequest, hashToken, clearSessionCookie } from '../../lib/auth';

/**
 * @swagger
 * /api/logout:
 *   post:
 *     summary: User logout
 *     description: Revokes the server-side session in PostgreSQL and clears the authentication cookie.
 *     tags: [Auth & Player]
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       405:
 *         description: Method not allowed
 *       500:
 *         description: Internal server error
 */
export default async function handler(request: NextApiRequest, response: NextApiResponse) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const token = getAuthTokenFromRequest(request);

        if (token) {
            const tokenHash = hashToken(token);
            await sql`DELETE FROM sessions WHERE token_hash = ${tokenHash}`;
        }

        clearSessionCookie(response);

        return response.status(200).json({ message: "Logged out successfully" });

    } catch (error: any) {
        console.error("Logout Error:", error);
        return response.status(500).json({ error: "Internal server error during logout" });
    }
}