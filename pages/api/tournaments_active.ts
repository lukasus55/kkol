import type { NextApiRequest, NextApiResponse } from 'next';
import type { Tournament } from '../../types/db';
import sql from '../../db.js';
import { verifySession } from '../../lib/auth';

interface TournamentsActiveRequest extends NextApiRequest {
    query: {
        limit?: string;
    };
}

/**
 * @swagger
 * /api/tournaments_active:
 *   get:
 *     summary: Get active tournaments
 *     description: Retrieves a list of ongoing tournaments. Admins see all; users see only assigned tournaments. Verifies server session.
 *     tags: [Tournaments]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Max number of tournaments to return
 *     responses:
 *       200:
 *         description: Array of active tournaments
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Internal server error
 */
export default async function handler(request: TournamentsActiveRequest, response: NextApiResponse) {
    if (request.method !== 'GET') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const auth = await verifySession(request);
        if (!auth) {
            return response.status(401).json({ error: "Not authenticated" });
        }

        const requesterId = auth.user.id;
        const globalRole = auth.user.role || 'user';

        const { limit } = request.query;
        const actualLimit = limit ? Math.min(Number(limit), 100) : 100;

        let activeTournaments: Pick<Tournament, 'id' | 'displayed_name'>[];

        if (globalRole === 'admin') {
            activeTournaments = await sql<Pick<Tournament, 'id' | 'displayed_name'>[]>`
                SELECT id, displayed_name 
                FROM tournaments 
                WHERE finished = false OR finished IS NULL
                ORDER BY displayed_name ASC
                LIMIT ${actualLimit}
            `;
        } else {
            activeTournaments = await sql<Pick<Tournament, 'id' | 'displayed_name'>[]>`
                SELECT t.id, t.displayed_name 
                FROM tournaments t
                INNER JOIN tournament_organizers o ON t.id = o.tournament_id
                WHERE o.player_id = ${requesterId} 
                    AND o.role IN ('owner', 'manager', 'organizer')
                    AND (t.finished = false OR t.finished IS NULL)
                ORDER BY t.displayed_name ASC
                LIMIT ${actualLimit}
            `;
        }

        return response.status(200).json(activeTournaments);

    } catch (error: any) {
        console.error("Fetch Active Tournaments Error:", error);
        return response.status(500).json({ error: "Nie udało się pobrać listy turniejów." });
    }
}