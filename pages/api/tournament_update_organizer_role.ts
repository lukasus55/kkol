import type { NextApiRequest, NextApiResponse } from 'next';
import type { Player, TournamentOrganizer } from '../../types/db';
import sql from '../../db.js';
import { verifySession } from '../../lib/auth';

interface TournamentUpdateOrganizerRoleRequest extends NextApiRequest {
    body: {
        tournament_id: string;
        target_player_id: string;
        action: 'promote' | 'demote';
    };
}

/**
 * @swagger
 * /api/tournament_update_organizer_role:
 *   post:
 *     summary: Update tournament organizer role
 *     description: Promotes a player to manager or demotes them. Accessible by tournament owner or global administrator.
 *     tags: [Tournaments]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tournament_id
 *               - target_player_id
 *               - action
 *             properties:
 *               tournament_id:
 *                 type: string
 *               target_player_id:
 *                 type: string
 *               action:
 *                 type: string
 *                 enum: ['promote', 'demote']
 *     responses:
 *       200:
 *         description: Permissions updated successfully
 *       400:
 *         description: Invalid payload
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Only owner can manage permissions
 *       500:
 *         description: Internal server error
 */
export default async function handler(request: TournamentUpdateOrganizerRoleRequest, response: NextApiResponse) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const auth = await verifySession(request);
        if (!auth) return response.status(401).json({ error: "Not authenticated" });
        const requesterId = auth.user.id;

        const { tournament_id, target_player_id, action } = request.body;

        if (!tournament_id || !target_player_id || !['promote', 'demote'].includes(action)) {
            return response.status(400).json({ error: "Invalid payload" });
        }

        const isAdmin = auth.user.role === 'admin';
        if (!isAdmin) {
            const authCheck = await sql<Pick<TournamentOrganizer, 'role'>[]>`
                SELECT role 
                FROM tournament_organizers 
                WHERE tournament_id = ${tournament_id} AND player_id = ${requesterId}
            `;

            if (authCheck.length === 0 || authCheck[0].role !== 'owner') {
                return response.status(403).json({ error: "Tylko właściciel turnieju może zarządzać uprawnieniami." });
            }
        }

        if (action === 'promote') {
            await sql`
                INSERT INTO tournament_organizers (tournament_id, player_id, role)
                VALUES (${tournament_id}, ${target_player_id}, 'manager')
                ON CONFLICT (tournament_id, player_id) DO UPDATE SET role = 'manager'
            `;
        } else if (action === 'demote') {
            await sql`
                DELETE FROM tournament_organizers 
                WHERE tournament_id = ${tournament_id} AND player_id = ${target_player_id} AND role = 'manager'
            `;
        }

        return response.status(200).json({ message: "Uprawnienia zostały zaktualizowane." });

    } catch (error: any) {
        console.error("Role Update Error:", error);
        return response.status(500).json({ error: "Wystąpił błąd podczas zmiany uprawnień." });
    }
}