import type { NextApiRequest, NextApiResponse } from 'next';
import sql from '../../db.js';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import { escapeHTML } from '../../public/js/utils/helpers.js';
import { hasTournamentPermission } from '../../public/js/utils/permissionChecks.js';

/**
 * @swagger
 * /api/poll_default_options:
 *   get:
 *     summary: Pobierz domyślne opcje dla ankiety
 *     tags: [Polls]
 *     parameters:
 *       - in: query
 *         name: poll_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista domyślnych opcji
 *   post:
 *     summary: Zaktualizuj domyślne opcje dla ankiety
 *     tags: [Polls]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               poll_id:
 *                 type: string
 *               options:
 *                 type: array
 *     responses:
 *       200:
 *         description: Zapisano pomyślnie
 */
export default async function handler(request: NextApiRequest, response: NextApiResponse) {
    if (request.method === 'GET') {
        const { poll_id } = request.query;
        if (!poll_id || typeof poll_id !== 'string') {
            return response.status(400).json({ error: 'Nieprawidłowe ID ankiety' });
        }
        try {
            const options = await sql`
                SELECT id, poll_id, name, sort_order
                FROM poll_default_options
                WHERE poll_id = ${poll_id}
                ORDER BY sort_order ASC
            `;
            return response.status(200).json(options);
        } catch (error) {
            console.error(error);
            return response.status(500).json({ error: 'Błąd podczas pobierania opcji domyślnych' });
        }
    }

    if (request.method === 'POST') {
        const cookies = parse(request.headers.cookie || '');
        const token = cookies.auth_token;

        if (!token) return response.status(401).json({ error: "Brak autoryzacji." });

        try {
            const decodedPayload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
            const requesterId = decodedPayload.id;

            const { poll_id, options } = request.body;
            if (!poll_id || typeof poll_id !== 'string') {
                return response.status(400).json({ error: 'Nieprawidłowe ID ankiety' });
            }

            if (!Array.isArray(options)) {
                return response.status(400).json({ error: 'Opcje muszą być tablicą' });
            }

            const pollData = await sql`SELECT tournament_id FROM polls WHERE id = ${poll_id}`;
            if (pollData.length === 0) return response.status(404).json({ error: 'Ankieta nie istnieje' });
            const tournamentId = pollData[0].tournament_id;

            const hasPermission = await hasTournamentPermission(requesterId, tournamentId);
            if (!hasPermission) {
                return response.status(403).json({ error: 'Brak uprawnień do edycji ustawień ankiety' });
            }

            // transaction via begin/commit manually as they do in this project
            await sql.begin(async (tx: any) => {
                await tx`DELETE FROM poll_default_options WHERE poll_id = ${poll_id}`;
                
                for (let i = 0; i < options.length; i++) {
                    const optName = escapeHTML(options[i].name || '');
                    if (!optName.trim()) continue;
                    
                    await tx`
                        INSERT INTO poll_default_options (poll_id, name, sort_order)
                        VALUES (${poll_id}, ${optName.trim()}, ${i})
                    `;
                }
            });

            return response.status(200).json({ message: 'Zapisano pomyślnie' });
        } catch (error: any) {
            console.error(error);
            if (error.code === '23505') {
                return response.status(409).json({ error: 'Nazwy domyślnych opcji nie mogą się powtarzać' });
            }
            if (error.name === 'JsonWebTokenError') {
                return response.status(401).json({ error: "Nieprawidłowy token." });
            }
            return response.status(500).json({ error: 'Błąd podczas zapisywania opcji domyślnych' });
        }
    }

    return response.status(405).json({ error: 'Method not allowed' });
}
