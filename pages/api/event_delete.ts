import type { NextApiRequest, NextApiResponse } from 'next';
import type { Event, Player, TournamentOrganizer } from '../../types/db';
import sql from '../../db.js';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

interface EventDeleteRequest extends NextApiRequest {
    body: {
        event_id?: number;
    };
}

/**
 * @swagger
 * /api/event_delete:
 *   post:
 *     summary: Delete an event
 *     description: Deletes an existing event. Requires owner/manager or admin role.
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
 *             properties:
 *               event_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       400:
 *         description: Missing event ID
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Missing permissions
 *       404:
 *         description: Event not found
 *       500:
 *         description: Internal server error
 */
export default async function handler(request: EventDeleteRequest, response: NextApiResponse) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const cookies = parse(request.headers.cookie || '');
        const token = cookies.auth_token;

        if (!token) return response.status(401).json({ error: "Brak autoryzacji." });

        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET as string) as Pick<Player, 'id'> & { role?: string };
        const requesterId = decodedPayload.id;

        const { event_id } = request.body;

        if (event_id === undefined || event_id === null) {
            return response.status(400).json({ error: "Brak ID wydarzenia." });
        }

        const eventCheck = await sql<Pick<Event, 'tournament_id'>[]>`
            SELECT tournament_id FROM events WHERE id = ${event_id}
        `;

        if (eventCheck.length === 0) {
            return response.status(404).json({ error: "Nie znaleziono wydarzenia." });
        }

        const tournament_id = eventCheck[0].tournament_id;

        const [globalRoleCheck, tournamentRoleCheckQuery] = await Promise.all([
            sql<Pick<Player, 'role'>[]>`SELECT role FROM players WHERE id = ${requesterId}`,
            sql<Pick<TournamentOrganizer, 'role'>[]>`SELECT role FROM tournament_organizers WHERE tournament_id = ${tournament_id || null} AND player_id = ${requesterId}`
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

        await sql`
            DELETE FROM events WHERE id = ${event_id}
        `;

        return response.status(200).json({ success: true, message: "Wydarzenie usunięte pomyślnie." });

    } catch (error: any) {
        console.error("Delete Event Error:", error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return response.status(401).json({ error: "Sesja wygasła. Zaloguj się ponownie." });
        }
        return response.status(500).json({ error: "Wystąpił błąd podczas usuwania wydarzenia." });
    }
}