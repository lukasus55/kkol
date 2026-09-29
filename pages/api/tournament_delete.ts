import type { NextApiRequest, NextApiResponse } from 'next';
import type { TournamentOrganizer } from '../../types/db';
import sql from '../../db.js';
import { verifySession } from '../../lib/auth';

interface TournamentDeleteRequest extends NextApiRequest {
    body: {
        tournament_id: string;
    };
}

/**
 * @swagger
 * /api/tournament_delete:
 *   post:
 *     summary: Delete tournament
 *     description: Deletes a tournament and its associated results and organizer roles. Only the owner can delete. Verifies server session.
 *     tags: [Tournaments]
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
 *               - tournament_id
 *             properties:
 *               tournament_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tournament deleted successfully
 *       400:
 *         description: Missing tournament ID
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Missing permissions
 *       500:
 *         description: Internal server error
 */
export default async function handler(request: TournamentDeleteRequest, response: NextApiResponse) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const auth = await verifySession(request);
        if (!auth) {
            return response.status(401).json({ error: "Not authenticated" });
        }

        const requesterId = auth.user.id;
        const { tournament_id } = request.body || {};

        if (!tournament_id) {
            return response.status(400).json({ error: "Brak ID turnieju." });
        }

        const authCheck = await sql<Pick<TournamentOrganizer, 'role'>[]>`
            SELECT role 
            FROM tournament_organizers 
            WHERE tournament_id = ${tournament_id} AND player_id = ${requesterId}
        `;

        if (authCheck.length === 0 || authCheck[0].role !== 'owner') {
            return response.status(403).json({ error: "Tylko właściciel może usunąć turniej." });
        }

        await sql`DELETE FROM results WHERE tournament_id = ${tournament_id}`;
        await sql`DELETE FROM tournament_organizers WHERE tournament_id = ${tournament_id}`;
        await sql`DELETE FROM tournaments WHERE id = ${tournament_id}`;

        return response.status(200).json({ message: "Turniej został usunięty." });

    } catch (error: any) {
        console.error("Delete Tournament Error:", error);
        return response.status(500).json({ error: "Wystąpił błąd podczas usuwania turnieju." });
    }
}