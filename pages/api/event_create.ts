import type { NextApiRequest, NextApiResponse } from 'next';
import type { Event, Tournament, Player, TournamentOrganizer } from '../../types/db';
import sql from '../../db.js';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import { escapeHTML } from '../../public/js/utils/helpers.js';

interface EventCreateRequest extends NextApiRequest {
    body: {
        tournament_id: string;
        name: string;
        is_major: boolean;
        start_date: string;
        end_date?: string;
    };
}

/**
 * @swagger
 * /api/event_create:
 *   post:
 *     summary: Create new event
 *     description: Creates a new event for a tournament. Requires owner/manager or admin role.
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
 *               - tournament_id
 *               - name
 *               - is_major
 *               - start_date
 *             properties:
 *               tournament_id:
 *                 type: string
 *               name:
 *                 type: string
 *               is_major:
 *                 type: boolean
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Event created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Missing permissions
 *       500:
 *         description: Internal server error
 */
export default async function handler(request: EventCreateRequest, response: NextApiResponse) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const cookies = parse(request.headers.cookie || '');
        const token = cookies.auth_token;

        if (!token) return response.status(401).json({ error: "Brak autoryzacji." });

        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET as string) as Pick<Player, 'id'> & { role?: string };
        const requesterId = decodedPayload.id;

        const { tournament_id, name, is_major, start_date, end_date } = request.body;

        if (!tournament_id || !name || !start_date) {
            return response.status(400).json({ error: "Brakujące dane (Turniej, Nazwa lub Data)." });
        }

        const clean_name = escapeHTML(name);
        
        if (clean_name.trim().length < 3) {
            return response.status(400).json({ error: "Nazwa wydarzenia musi mieć co najmniej 3 znaki." });
        }
        
        if (clean_name.trim().length > 70) {
            return response.status(400).json({ error: "Nazwa wydarzenia może mieć maksymalnie 70 znaków." });
        }

        const parsedStart = new Date(start_date);
        const minDate = new Date('2024-01-01T00:00:00');
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 500);

        if (isNaN(parsedStart.getTime())) {
            return response.status(400).json({ error: "Nieprawidłowy format daty początkowej." });
        }

        if (parsedStart < minDate || parsedStart > maxDate) {
            return response.status(400).json({ error: "Data wydarzenia musi zawierać się między 2024 rokiem a okresem 500 dni w przód." });
        }

        if (end_date) {
            const parsedEnd = new Date(end_date);
            if (isNaN(parsedEnd.getTime())) {
                return response.status(400).json({ error: "Nieprawidłowy format daty końcowej." });
            }
            if (parsedEnd < minDate || parsedEnd > maxDate) {
                return response.status(400).json({ error: "Data końcowa musi zawierać się między 2024 rokiem a okresem 500 dni w przód." });
            }
            if (parsedEnd < parsedStart) {
                return response.status(400).json({ error: "Data końcowa nie może być wcześniejsza niż data początkowa." });
            }
        }

        const tournamentCheck = await sql<Pick<Tournament, 'finished'>[]>`
            SELECT finished FROM tournaments WHERE id = ${tournament_id}
        `;

        if (tournamentCheck.length === 0) {
            return response.status(400).json({ error: "Nie możesz dodać wydarzenia do turnieju, który nie istnieje." });
        }

        if (tournamentCheck[0].finished === true) {
            return response.status(400).json({ error: "Nie możesz dodać wydarzenia do zakończonego turnieju." });
        }

        const [globalRoleCheck, tournamentRoleCheck] = await Promise.all([
            sql<Pick<Player, 'role'>[]>`SELECT role FROM players WHERE id = ${requesterId}`,
            sql<Pick<TournamentOrganizer, 'role'>[]>`SELECT role FROM tournament_organizers WHERE tournament_id = ${tournament_id} AND player_id = ${requesterId}`
        ]);

        const globalRole = globalRoleCheck.length > 0 ? globalRoleCheck[0].role : 'user';

        let hasPermission = false;
        
        if (globalRole === 'admin') {
            hasPermission = true;
        } else if (tournamentRoleCheck.length > 0) {
            const tournamentRole = tournamentRoleCheck[0].role;
            if (tournamentRole && ['owner', 'manager'].includes(tournamentRole)) {
                hasPermission = true;
            }
        }

        if (!hasPermission) {
            return response.status(403).json({ error: "Brak uprawnień. Musisz być administratorem lub zarządcą tego turnieju." });
        }

        const result = await sql<Pick<Event, 'id'>[]>`
            INSERT INTO events (tournament_id, creator_id, event_date, end_date, name, is_major)
            VALUES (${tournament_id}, ${requesterId}, ${start_date}, ${end_date || null}, ${clean_name}, ${is_major})
            RETURNING id
        `;

        return response.status(200).json({ success: true, id: result[0].id });

    } catch (error: any) {
        console.error("Create Event Error:", error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return response.status(401).json({ error: "Sesja wygasła. Zaloguj się ponownie." });
        }
        return response.status(500).json({ error: "Wystąpił błąd podczas tworzenia wydarzenia." });
    }
}