import type { NextApiRequest, NextApiResponse } from 'next';
import type { Poll, Player } from '../../types/db';
import sql from '../../db.js';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import { isUUIDv7 } from '../../public/js/utils/helpers.js';

interface PollPlayersAnswersUpdateRequest extends NextApiRequest {
    body: {
        poll_id: string;
        answers: Record<string, string[]>;
    };
}

/**
 * @swagger
 * /api/poll_players_answers_update:
 *   post:
 *     summary: Update player answers
 *     description: Records or updates a player's votes for a poll. Only allowed when the poll is active.
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
 *               - poll_id
 *               - answers
 *             properties:
 *               poll_id:
 *                 type: string
 *                 format: uuid
 *               answers:
 *                 type: object
 *                 additionalProperties:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: uuid
 *     responses:
 *       200:
 *         description: Answers saved successfully
 *       400:
 *         description: Missing or invalid parameters
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Voting hasn't started, has ended, or missing permissions
 *       404:
 *         description: Poll not found
 *       500:
 *         description: Internal server error
 */
export default async function handler(request: PollPlayersAnswersUpdateRequest, response: NextApiResponse) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const cookies = parse(request.headers.cookie || '');
        const token = cookies.auth_token;

        if (!token) return response.status(401).json({ error: "Brak autoryzacji." });

        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET as string) as Pick<Player, 'id'> & { role?: string };
        const requesterId = decodedPayload.id; 

        const { poll_id, answers } = request.body;

        if (!poll_id || !answers || typeof answers !== 'object') {
            return response.status(400).json({ error: "Brakujące lub nieprawidłowe dane." });
        }

        if (!isUUIDv7(poll_id)) {
            return response.status(400).json({ error: "Id ankiety musi być typu uuidv7." });
        }

        const optionIdsToInsert: string[] = [];
        for (const optionIds of Object.values(answers)) {
            if (Array.isArray(optionIds) && optionIds.length > 0) {
                optionIdsToInsert.push(...optionIds);
            }
        }

        const tournamentRes = await sql<Pick<Poll, 'tournament_id' | 'start_date' | 'end_date'>[]>`SELECT tournament_id, start_date, end_date FROM polls WHERE id = ${poll_id}`;
        if (tournamentRes.length === 0) return response.status(404).json({ error: "Ankieta nie istnieje." });
        const { tournament_id, start_date, end_date } = tournamentRes[0];

        const now = new Date();
        if (start_date && new Date(start_date) > now) {
            return response.status(403).json({ error: "Głosowanie jeszcze się nie rozpoczęło." });
        }
        if (end_date && new Date(end_date) < now) {
            return response.status(403).json({ error: "Głosowanie zostało już zakończone." });
        }

        const permissions = await sql<{ global_role: string, is_organizer: boolean, is_player: boolean }[]>`
            SELECT
                (SELECT role FROM players WHERE id = ${requesterId}) as global_role,
                EXISTS(SELECT 1 FROM tournament_organizers WHERE tournament_id = ${tournament_id} AND player_id = ${requesterId}) as is_organizer,
                EXISTS(SELECT 1 FROM results WHERE tournament_id = ${tournament_id} AND player_id = ${requesterId}) as is_player
        `;
        const p = permissions[0];
        if (p.global_role !== 'admin' && !p.is_organizer && !p.is_player) {
            return response.status(403).json({ error: "Brak dostępu. Musisz być przypisany do turnieju, aby głosować." });
        }

        await sql.begin(async (sqlTransaction: any) => {
            if (optionIdsToInsert.length > 0) {
                const validOptions = await sqlTransaction<{ id: string }[]>`
                    SELECT o.id 
                    FROM "options" o
                    JOIN questions q ON o.question_id = q.id
                    WHERE q.poll_id = ${poll_id}
                    AND o.id IN ${sql(optionIdsToInsert)}
                `;

                if (validOptions.length !== optionIdsToInsert.length) {
                    throw new Error("SECURITY_VIOLATION");
                }
            }

            await sqlTransaction`
                DELETE FROM checked_answers 
                WHERE player_id = ${requesterId} 
                AND option_id IN (
                    SELECT o.id FROM "options" o
                    JOIN questions q ON o.question_id = q.id
                    WHERE q.poll_id = ${poll_id}
                )
            `;

            if (optionIdsToInsert.length > 0) {
                const insertData = optionIdsToInsert.map(optId => ({
                    option_id: optId,
                    player_id: requesterId
                }));

                await sqlTransaction`
                    INSERT INTO checked_answers ${sql(insertData, 'option_id', 'player_id')}
                `;
            }
        });

        return response.status(200).json({ success: true, message: "Odpowiedzi zostały zapisane." });

    } catch (error: any) {
        console.error("Update Player Answers Error:", error);
        
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return response.status(401).json({ error: "Sesja wygasła. Zaloguj się ponownie." });
        }

        if (error.message === "SECURITY_VIOLATION") {
            return response.status(400).json({ error: "Przesłano nieprawidłowe opcje dla tej ankiety." });
        }

        return response.status(500).json({ error: "Wystąpił błąd podczas zapisywania odpowiedzi." });
    }
}
