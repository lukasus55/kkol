import type { NextApiRequest, NextApiResponse } from 'next';
import type { Poll, PollLabel, Player } from '../../types/db';
import sql from '../../db.js';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import { escapeHTML } from '../../public/js/utils/helpers.js';
import { hasTournamentPermission, isPartOfTournament } from '../../public/js/utils/permissionChecks.js';

interface PollLabelUpdateRequest extends NextApiRequest {
    body: {
        id: number;
        name: string;
        hex: string;
        description?: string;
    };
}

/**
 * @swagger
 * /api/poll_label_update:
 *   post:
 *     summary: Update poll label
 *     description: Modifies an existing poll label. Permissions depend on poll's rights_level or tournament roles.
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
 *               - hex
 *             properties:
 *               id:
 *                 type: integer
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *               hex:
 *                 type: string
 *               description:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Label updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Missing permissions
 *       404:
 *         description: Label or Poll not found
 *       500:
 *         description: Internal server error
 */
export default async function handler(request: PollLabelUpdateRequest, response: NextApiResponse) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const cookies = parse(request.headers.cookie || '');
        const token = cookies.auth_token;

        if (!token) return response.status(401).json({ error: "Brak autoryzacji." });

        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET as string) as Pick<Player, 'id'> & { role?: string };
        const requesterId = decodedPayload.id;

        const { id, name, hex, description } = request.body;

        if (id === undefined || id === null || !name || !hex) {
            return response.status(400).json({ error: "Brakujące dane (Id etykiety, Nazwa lub Hex)." });
        }

        const clean_name = escapeHTML(name);
        
        if (clean_name.trim().length < 3) {
            return response.status(400).json({ error: "Nazwa etykiety musi mieć co najmniej 3 znaki." });
        }
        
        if (clean_name.trim().length > 30) {
            return response.status(400).json({ error: "Nazwa etykiety może mieć maksymalnie 30 znaków." });
        }

        const clean_description = description ? escapeHTML(description) : '';
        
        if (clean_description.trim().length > 500) {
            return response.status(400).json({ error: "Opis etykiety może mieć maksymalnie 500 znaków." });
        }

        const labelCheck = await sql<Pick<PollLabel, 'poll_id'>[]>`
            SELECT poll_id FROM poll_labels WHERE id = ${id}
        `;

        if (labelCheck.length === 0) {
            return response.status(404).json({ error: "Nie możesz edytować etykiety która nie istnieje." });
        }

        const pollId = labelCheck[0].poll_id;

        const pollCheck = await sql<Pick<Poll, 'tournament_id' | 'rights_level'>[]>`
            SELECT tournament_id, rights_level FROM polls WHERE id = ${pollId}
        `;
        
        if (pollCheck.length === 0) {
            return response.status(404).json({ error: "Nie możesz dodać etykiety do ankiety która nie istnieje." });
        }
        
        const tournamentId = pollCheck[0].tournament_id;
        const rightsLevel = pollCheck[0].rights_level;

        const allowedByRules = rightsLevel >= 3 && await isPartOfTournament(requesterId, tournamentId);

        const hasPermission = allowedByRules || await hasTournamentPermission(requesterId, tournamentId)
        if (!hasPermission) {
            return response.status(403).json({ error: "Brak uprawnień do edycji etykiety. Musisz być administratorem, być zarządcą tego turnieju lub ustawienia tej ankiety muszą ci na to pozwalać." });
        }

        await sql`
            UPDATE poll_labels
            SET name = ${clean_name},  
                description = ${clean_description || null}, 
                hex = ${hex}
            WHERE id = ${id}
        `;

        return response.status(200).json({ success: true });

    } catch (error: any) {
        console.error("Update Label Error:", error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return response.status(401).json({ error: "Sesja wygasła. Zaloguj się ponownie." });
        }
        return response.status(500).json({ error: "Wystąpił błąd podczas edycji etykiety." });
    }
}