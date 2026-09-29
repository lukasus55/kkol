import type { NextApiRequest, NextApiResponse } from 'next';
import sql from '../../../db.js';
import { verifySession, revokeSession, revokeAllUserSessions } from '../../../lib/auth';
import type { Session, Player } from '../../../types/db';

/**
 * @swagger
 * /api/admin/sessions:
 *   get:
 *     summary: Get active sessions for a user
 *     description: Returns a list of active sessions for the specified player ID. Only administrators are allowed. Cannot view other admins.
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: player_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Player ID to retrieve sessions for
 *     responses:
 *       200:
 *         description: List of active sessions
 *       400:
 *         description: Missing player_id parameter
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - admin privileges required or target is another admin
 *       404:
 *         description: Player not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Revoke session(s) for a user
 *     description: Allows administrator to revoke a specific session or all sessions for a user. Cannot revoke other admins.
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - player_id
 *             properties:
 *               player_id:
 *                 type: string
 *               session_id:
 *                 type: string
 *               all:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Session(s) successfully revoked
 *       400:
 *         description: Missing required parameters
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - target is another admin
 *       404:
 *         description: Player not found
 *       500:
 *         description: Internal server error
 */
export default async function handler(request: NextApiRequest, response: NextApiResponse) {
    if (!['GET', 'DELETE'].includes(request.method || '')) {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const auth = await verifySession(request);
        if (!auth) {
            return response.status(401).json({ error: "Not authenticated" });
        }

        if (auth.user.role !== 'admin') {
            return response.status(403).json({ error: "Tylko administrator ma dostęp." });
        }

        if (request.method === 'GET') {
            const playerId = typeof request.query.player_id === 'string' ? request.query.player_id.trim() : null;

            if (!playerId) {
                return response.status(400).json({ error: "ID użytkownika jest wymagane." });
            }

            const target = await sql<Pick<Player, 'id' | 'role'>[]>`
                SELECT id, role FROM players WHERE id = ${playerId}
            `;

            if (target.length === 0) {
                return response.status(404).json({ error: "Użytkownik nie istnieje." });
            }

            if (target[0].role === 'admin' && target[0].id !== auth.user.id) {
                return response.status(403).json({ error: "Nie można zarządzać sesjami innego administratora." });
            }

            const sessions = await sql<Pick<Session, 'id' | 'player_id' | 'ip_address' | 'device_info' | 'app_id' | 'created_at' | 'last_active_at' | 'expires_at'>[]>`
                SELECT id, player_id, ip_address, device_info, app_id, created_at, last_active_at, expires_at
                FROM sessions
                WHERE player_id = ${playerId}
                  AND expires_at > CURRENT_TIMESTAMP
                ORDER BY last_active_at DESC
            `;

            return response.status(200).json({ sessions });
        }

        if (request.method === 'DELETE') {
            const { player_id, session_id, all } = request.body || {};
            const cleanPlayerId = typeof player_id === 'string' ? player_id.trim() : null;

            if (!cleanPlayerId) {
                return response.status(400).json({ error: "ID użytkownika jest wymagane." });
            }

            const target = await sql<Pick<Player, 'id' | 'role'>[]>`
                SELECT id, role FROM players WHERE id = ${cleanPlayerId}
            `;

            if (target.length === 0) {
                return response.status(404).json({ error: "Użytkownik nie istnieje." });
            }

            if (target[0].role === 'admin' && target[0].id !== auth.user.id) {
                return response.status(403).json({ error: "Nie można zarządzać sesjami innego administratora." });
            }

            if (all === true) {
                await revokeAllUserSessions(cleanPlayerId);
                return response.status(200).json({ message: "Wszystkie sesje użytkownika zostały pomyślnie unieważnione." });
            }

            if (session_id && typeof session_id === 'string') {
                await revokeSession(session_id.trim());
                return response.status(200).json({ message: "Sesja została unieważniona." });
            }

            return response.status(400).json({ error: "Określ session_id lub ustaw all: true." });
        }
    } catch (error) {
        console.error("Admin sessions API error:", error);
        return response.status(500).json({ error: "Błąd serwera." });
    }
}
