import type { NextApiRequest, NextApiResponse } from 'next';
import type { Poll, PollLabel, Player } from '../../types/db';
import sql from '../../db.js';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import { hasTournamentPermission, isPartOfTournament } from '../../public/js/utils/permissionChecks.js';

interface PollLabelDeleteRequest extends NextApiRequest {
    body: {
        id: number;
    };
}

/**
 * @swagger
 * /api/poll_label_delete:
 *   post:
 *     summary: Delete poll label
 *     description: Removes a label from a poll. Permissions depend on poll's rights_level or tournament roles.
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
 *             properties:
 *               id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Label deleted successfully
 *       400:
 *         description: Missing label ID
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Missing permissions
 *       404:
 *         description: Label or Poll not found
 *       500:
 *         description: Internal server error
 */
export default async function handler(request: PollLabelDeleteRequest, response: NextApiResponse) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const cookies = parse(request.headers.cookie || '');
        const token = cookies.auth_token;

        if (!token) return response.status(401).json({ error: "Brak autoryzacji." });

        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET as string) as Pick<Player, 'id'> & { role?: string };
        const requesterId = decodedPayload.id;

        const { id } = request.body;

        if (id === undefined || id === null) {
            return response.status(400).json({ error: "Brakujące dane (Id etykiety)." });
        }

        const labelCheck = await sql<Pick<PollLabel, 'poll_id'>[]>`
            SELECT poll_id FROM poll_labels WHERE id = ${id}
        `;

        if (labelCheck.length === 0) {
            return response.status(404).json({ error: "Nie możesz usunąć etykiety która nie istnieje." });
        }

        const pollId = labelCheck[0].poll_id;

        const pollCheck = await sql<Pick<Poll, 'tournament_id' | 'rights_level'>[]>`
            SELECT tournament_id, rights_level FROM polls WHERE id = ${pollId}
        `;
        
        if (pollCheck.length === 0) {
            return response.status(404).json({ error: "Nie możesz usunąć etykiety do ankiety która nie istnieje." });
        }
        
        const tournamentId = pollCheck[0].tournament_id;
        const rightsLevel = pollCheck[0].rights_level;

        const allowedByRules = rightsLevel >= 3 && await isPartOfTournament(requesterId, tournamentId); 

        const hasPermission = allowedByRules || await hasTournamentPermission(requesterId, tournamentId);
        if (!hasPermission) {
            return response.status(403).json({ error: "Brak uprawnień do usunięcia etykiety. Musisz być administratorem, być zarządcą tego turnieju lub ustawienia tej ankiety muszą ci na to pozwalać." });
        }

        await sql`DELETE FROM poll_labels WHERE id = ${id}`;

        return response.status(200).json({ success: true });

    } catch (error: any) {
        console.error("Delete Label Error:", error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return response.status(401).json({ error: "Sesja wygasła. Zaloguj się ponownie." });
        }
        return response.status(500).json({ error: "Wystąpił błąd podczas usuwania etykiety." });
    }
}