import type { NextApiRequest, NextApiResponse } from 'next';
import type { Player, Tournament } from '../../types/db';
import sql from '../../db.js';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

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
 *     description: Retrieves a list of active (unfinished) tournaments the authenticated user has organizer permissions for.
 *     tags: [Tournaments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Max number of returned tournaments
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
        const { limit } = request.query;
        const actualLimit = limit ? Math.min(Number(limit), 100) : 100;

        const cookies = parse(request.headers.cookie || '');
        const token = cookies.auth_token;

        if (!token) return response.status(401).json({ error: "Brak autoryzacji." });

        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET as string) as Pick<Player, 'id'> & { role?: string };
        const requesterId = decodedPayload.id;

        const userCheck = await sql<Pick<Player, 'role'>[]>`SELECT role FROM players WHERE id = ${requesterId}`;
        const globalRole = userCheck.length > 0 ? userCheck[0].role : 'user';

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