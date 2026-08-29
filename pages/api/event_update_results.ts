import type { NextApiRequest, NextApiResponse } from 'next';
import type { Event, Tournament, Player, TournamentOrganizer } from '../../types/db';
import sql from '../../db.js';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

interface EventUpdateResultsRequest extends NextApiRequest {
    body: { 
        event_id: number; 
        results: { 
            player_id: string; 
            position: number | null; 
            points: number | null; 
        }[]; 
    };
}

/**
 * @swagger
 * /api/event_update_results:
 *   post:
 *     summary: Update event results
 *     description: Upserts player results for an event. Requires owner/manager or admin role.
 *     tags: [Events]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - event_id
 *               - results
 *             properties:
 *               event_id:
 *                 type: integer
 *               results:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     player_id:
 *                       type: string
 *                     position:
 *                       type: integer
 *                       nullable: true
 *                     points:
 *                       type: number
 *                       nullable: true
 *     responses:
 *       200:
 *         description: Results updated successfully
 *       400:
 *         description: Invalid payload or tournament finished
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Missing permissions
 *       404:
 *         description: Event not found
 *       500:
 *         description: Internal server error
 */
export default async function handler(request: EventUpdateResultsRequest, response: NextApiResponse) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const cookies = parse(request.headers.cookie || '');
        const token = cookies.auth_token;

        if (!token) return response.status(401).json({ error: "Brak autoryzacji." });

        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET as string) as Pick<Player, 'id'> & { role?: string };
        const requesterId = decodedPayload.id;

        const { event_id, results } = request.body || {};

        if (!event_id || !Array.isArray(results)) {
            return response.status(400).json({ error: "Brakujące lub nieprawidłowe dane wyników." });
        }

        const eventCheck = await sql<(Pick<Event, 'tournament_id'> & Pick<Tournament, 'finished'>)[]>`
            SELECT e.tournament_id, t.finished 
            FROM events e
            JOIN tournaments t ON e.tournament_id = t.id
            WHERE e.id = ${event_id}
        `;

        if (eventCheck.length === 0) {
            return response.status(404).json({ error: "Wydarzenie nie istnieje." });
        }

        if (eventCheck[0].finished === true) {
            return response.status(400).json({ error: "Nie możesz edytować wydarzeń w zakończonym turnieju." });
        }

        const eventTournamentId = eventCheck[0].tournament_id;

        const [globalRoleCheck, tournamentRoleCheckQuery] = await Promise.all([
            sql<Pick<Player, 'role'>[]>`SELECT role FROM players WHERE id = ${requesterId}`,
            sql<Pick<TournamentOrganizer, 'role'>[]>`SELECT role FROM tournament_organizers WHERE tournament_id = ${eventTournamentId || null} AND player_id = ${requesterId}`
        ]);

        const globalRole = globalRoleCheck.length > 0 ? globalRoleCheck[0].role : 'user';

        let hasPermission = false;

        if (globalRole === 'admin') {
            hasPermission = true;
        } else if (tournamentRoleCheckQuery.length > 0) {
            const tournamentRole = tournamentRoleCheckQuery[0].role;
            if (tournamentRole && ['owner', 'manager'].includes(tournamentRole)) {
                hasPermission = true;
            }
        }

        if (!hasPermission) {
            return response.status(403).json({ error: "Brak uprawnień. Musisz być administratorem lub zarządcą tego turnieju." });
        }

        await sql.begin(async (t: any) => {
            for (const res of results) {
                const { player_id, position, points } = res;

                if (!player_id) continue;

                const finalPosition = position !== undefined ? position : null;
                const finalPoints = points !== undefined ? points : null;

                const existingRecord = await t<{ '?column?': number }[]>`
                    SELECT 1 FROM event_results 
                    WHERE event_id = ${event_id} AND player_id = ${player_id}
                `;

                if (existingRecord.length > 0) {
                    await t`
                        UPDATE event_results 
                        SET position = ${finalPosition}, points = ${finalPoints}
                        WHERE event_id = ${event_id} AND player_id = ${player_id}
                    `;
                } else {
                    await t`
                        INSERT INTO event_results (event_id, player_id, position, points)
                        VALUES (${event_id}, ${player_id}, ${finalPosition}, ${finalPoints})
                    `;
                }
            }
        });

        return response.status(200).json({ success: true });

    } catch (error: any) {
        console.error("Update Event Results Error:", error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return response.status(401).json({ error: "Sesja wygasła. Zaloguj się ponownie." });
        }
        return response.status(500).json({ error: "Wystąpił błąd podczas zapisywania wyników." });
    }
}
