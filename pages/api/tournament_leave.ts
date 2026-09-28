import type { NextApiRequest, NextApiResponse } from 'next';
import type { Player, Tournament, TournamentOrganizer } from '../../types/db';
import sql from '../../db.js';
import { verifySession } from '../../lib/auth';

interface TournamentLeaveRequest extends NextApiRequest {
    body: {
        tournamentId: string;
    };
}

/**
 * @swagger
 * /api/tournament_leave:
 *   post:
 *     summary: Leave a tournament
 *     description: Allows the authenticated user to leave a tournament. Cannot leave S-Tier tournaments or if they are the owner.
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
 *               - tournamentId
 *             properties:
 *               tournamentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully left the tournament
 *       400:
 *         description: Missing tournament ID
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Cannot leave S-Tier tournament or owner restriction
 *       404:
 *         description: Tournament not found
 *       500:
 *         description: Internal server error
 */
export default async function handler(request: TournamentLeaveRequest, response: NextApiResponse) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const auth = await verifySession(request);
        if (!auth) {
            return response.status(401).json({ error: "Not authenticated" });
        }
        const userId = auth.user.id;

        const { tournamentId } = request.body;

        if (!tournamentId) {
            return response.status(400).json({ error: "Tournament ID is required" });
        }

        const checkData = await sql<(Pick<Tournament, 'tier'> & Pick<TournamentOrganizer, 'role'>)[]>`
            SELECT t.tier, o.role
            FROM tournaments t
            LEFT JOIN tournament_organizers o 
            ON t.id = o.tournament_id AND o.player_id = ${userId}
            WHERE t.id = ${tournamentId}
        `;

        if (checkData.length === 0) {
            return response.status(404).json({ error: "Tournament not found" });
        }

        const tournamentTier = checkData[0].tier;
        const userRole = checkData[0].role;

        if (tournamentTier === 'S') {
            return response.status(403).json({ error: "Players are not allowed to leave S-Tier tournaments." });
        }

        if (userRole === 'owner') {
            return response.status(403).json({ error: "The owner cannot leave the tournament. You must delete it instead." });
        }

        await sql`
            DELETE FROM tournament_organizers 
            WHERE tournament_id = ${tournamentId} AND player_id = ${userId}
        `;

        await sql`
            DELETE FROM results 
            WHERE tournament_id = ${tournamentId} AND player_id = ${userId}
        `;

        return response.status(200).json({ message: "Successfully left the tournament" });

    } catch (error: any) {
        console.error("Leave Tournament Error:", error);
        return response.status(500).json({ error: "Failed to leave tournament" });
    }
}