import type { NextApiRequest, NextApiResponse } from 'next';
import type { Poll, Tournament, Player } from '../../types/db';
import sql from '../../db.js';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import { escapeHTML } from '../../public/js/utils/helpers.js';
import { hasTournamentPermission } from '../../public/js/utils/permissionChecks.js';

interface PollUpdateRequest extends NextApiRequest {
    body: {
        id: string;
        name: string;
        start_date: string;
        end_date: string;
        rights_level: number;
    };
}

/**
 * @swagger
 * /api/poll_update:
 *   post:
 *     summary: Update poll details
 *     description: Updates the metadata of an existing poll. Requires owner/manager or admin role.
 *     tags: [Polls]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - name
 *               - start_date
 *               - end_date
 *               - rights_level
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *               rights_level:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Poll updated successfully
 *       400:
 *         description: Invalid payload or dates
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Missing permissions
 *       404:
 *         description: Poll not found
 *       500:
 *         description: Internal server error
 */
export default async function handler(request: PollUpdateRequest, response: NextApiResponse) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const cookies = parse(request.headers.cookie || '');
        const token = cookies.auth_token;

        if (!token) return response.status(401).json({ error: "Brak autoryzacji." });

        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET as string) as Pick<Player, 'id'> & { role?: string };
        const requesterId = decodedPayload.id;

        const { id, name, start_date, end_date, rights_level } = request.body;

        if (!id || !name || !start_date || !end_date || rights_level === undefined) {
            return response.status(400).json({ error: "Brakujące dane." });
        }

        const clean_name = escapeHTML(name);
        
        if (clean_name.trim().length < 3) {
            return response.status(400).json({ error: "Nazwa ankiety musi mieć co najmniej 3 znaki." });
        }
        
        if (clean_name.trim().length > 70) {
            return response.status(400).json({ error: "Nazwa ankiety może mieć maksymalnie 70 znaków." });
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

        const pollCheck = await sql<Pick<Poll, 'tournament_id'>[]>`
            SELECT tournament_id FROM polls WHERE id = ${id}
        `;
        
        if (pollCheck.length === 0) {
            return response.status(404).json({ error: "Nie możesz edytować ankiety która nie istnieje." });
        }

        const tournamentId = pollCheck[0].tournament_id;

        const tournamentCheck = await sql<Pick<Tournament, 'finished'>[]>`
            SELECT finished FROM tournaments WHERE id = ${tournamentId}
        `;

        if (tournamentCheck.length === 0) {
            return response.status(400).json({ error: "Nie możesz edytować ankiety w turnieju, który nie istnieje." });
        }

        const hasPermission = await hasTournamentPermission(requesterId, tournamentId);
        if (!hasPermission) {
            return response.status(403).json({ error: "Brak uprawnień. Musisz być administratorem lub zarządcą turnieju do którego przypisana jest ta ankieta." });
        }

        await sql`
            UPDATE polls
            SET name = ${clean_name},  
                rights_level = ${rights_level}, 
                start_date = ${start_date},
                end_date = ${end_date}
            WHERE id = ${id}
        `;

        return response.status(200).json({ success: true });

    } catch (error: any) {
        console.error("Update Poll Error:", error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return response.status(401).json({ error: "Sesja wygasła. Zaloguj się ponownie." });
        }
        return response.status(500).json({ error: "Wystąpił błąd podczas tworzenia wydarzenia." });
    }
}