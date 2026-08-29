import type { NextApiRequest, NextApiResponse } from 'next';
import type { Poll, Player } from '../../types/db';
import sql from '../../db.js';
import jwt from 'jsonwebtoken';
import { uuidv7 } from "uuidv7";
import { parse } from 'cookie';
import { escapeHTML } from '../../public/js/utils/helpers.js';
import { hasTournamentPermission, isPartOfTournament } from '../../public/js/utils/permissionChecks.js';

type QuestionOption = {
    id?: string;
    name: string;
};

type IncomingQuestion = {
    id?: string;
    name: string;
    page_url?: string;
    multiple_choice: boolean;
    sort_order: number;
    options: QuestionOption[];
    label_ids?: number[];
    labels?: { id: number }[];
};

type ProcessedQuestion = {
    id: string;
    name: string;
    page_url: string | null;
    multiple_choice: boolean;
    sort_order: number;
    options: { id: string | undefined; name: string }[];
    label_ids: number[];
};

interface PollQuestionUpdateRequest extends NextApiRequest {
    body: {
        poll_id: string;
        questions: IncomingQuestion[];
    };
}

/**
 * @swagger
 * /api/poll_question_update:
 *   post:
 *     summary: Update poll questions
 *     description: Upserts questions and options for a poll. Requires permissions based on rights_level or roles.
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
 *               - questions
 *             properties:
 *               poll_id:
 *                 type: string
 *                 format: uuid
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     page_url:
 *                       type: string
 *                     multiple_choice:
 *                       type: boolean
 *                     sort_order:
 *                       type: integer
 *                     options:
 *                       type: array
 *                       items:
 *                         type: object
 *                     label_ids:
 *                       type: array
 *                       items:
 *                         type: integer
 *                     labels:
 *                       type: array
 *                       items:
 *                         type: object
 *     responses:
 *       200:
 *         description: Questions updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Missing permissions
 *       404:
 *         description: Poll not found
 *       409:
 *         description: Conflict (e.g. duplicate IDs or order)
 *       500:
 *         description: Internal server error
 */
export default async function handler(request: PollQuestionUpdateRequest, response: NextApiResponse) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const cookies = parse(request.headers.cookie || '');
        const token = cookies.auth_token;

        if (!token) return response.status(401).json({ error: "Brak autoryzacji." });

        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET as string) as Pick<Player, 'id'> & { role?: string };
        const requesterId = decodedPayload.id;

        const { poll_id, questions } = request.body;

        if (!poll_id || !Array.isArray(questions)) {
            return response.status(400).json({ error: "Brakujące dane (Id ankiety lub lista pytań)." });
        }

        const pollCheck = await sql<Pick<Poll, 'tournament_id' | 'rights_level'>[]>`
            SELECT tournament_id, rights_level FROM polls WHERE id = ${poll_id}
        `;
        
        if (pollCheck.length === 0) {
            return response.status(404).json({ error: "Ankieta nie istnieje." });
        }
        
        const tournamentId = pollCheck[0].tournament_id;
        const rightsLevel = pollCheck[0].rights_level;

        const allowedByRules = rightsLevel >= 2 && await isPartOfTournament(requesterId, tournamentId);
        const hasPermission = allowedByRules || await hasTournamentPermission(requesterId, tournamentId);
        
        if (!hasPermission) {
            return response.status(403).json({ error: "Brak uprawnień do edycji pytań. Musisz być administratorem, zarządcą turnieju lub posiadać odpowiednie uprawnienia." });
        }

        const incomingValidIds: string[] = []; 
        const toInsert: ProcessedQuestion[] = [];
        const toUpdate: ProcessedQuestion[] = [];

        for (const q of questions) {
            const clean_name = escapeHTML(q.name || '');
            
            if (clean_name.trim().length < 3) {
                return response.status(400).json({ error: `Pytanie "${clean_name}" musi mieć co najmniej 3 znaki.` });
            }
            if (clean_name.trim().length > 100) {
                return response.status(400).json({ error: `Pytanie "${clean_name}" może mieć maksymalnie 100 znaków.` });
            }

            const processedQuestion: ProcessedQuestion = {
                id: q.id || '',
                name: clean_name,
                page_url: q.page_url || null,
                multiple_choice: Boolean(q.multiple_choice),
                sort_order: Number(q.sort_order) || 0,
                options: [],
                label_ids: []
            };

            if (Array.isArray(q.options)) {
                for (const opt of q.options) {
                    const clean_opt_name = escapeHTML(opt.name || '');
                    if (clean_opt_name.trim().length === 0) continue;
                    
                    processedQuestion.options.push({
                        id: opt.id,
                        name: clean_opt_name
                    });
                }
            }

            if (Array.isArray(q.label_ids)) {
                for (const lblId of q.label_ids) {
                    if (lblId !== undefined && lblId !== null) processedQuestion.label_ids.push(lblId);
                }
            } else if (Array.isArray(q.labels)) {
                for (const lbl of q.labels) {
                    if (lbl.id !== undefined && lbl.id !== null) processedQuestion.label_ids.push(lbl.id);
                }
            }

            if (!q.id || String(q.id).startsWith('temp-') || String(q.id).startsWith('new-')) {
                processedQuestion.id = uuidv7(); 
                toInsert.push(processedQuestion);
            } else {
                incomingValidIds.push(q.id);
                toUpdate.push(processedQuestion);
            }
        }

        await sql.begin(async (sqlTransaction: any) => {

            if (incomingValidIds.length > 0) {
                await sqlTransaction`
                    DELETE FROM questions_poll_labels 
                    WHERE question_id IN (
                        SELECT id FROM questions WHERE poll_id = ${poll_id} AND id NOT IN ${sql(incomingValidIds)}
                    )
                `;
                await sqlTransaction`
                    DELETE FROM options 
                    WHERE question_id IN (
                        SELECT id FROM questions WHERE poll_id = ${poll_id} AND id NOT IN ${sql(incomingValidIds)}
                    )
                `;
                await sqlTransaction`
                    DELETE FROM questions 
                    WHERE poll_id = ${poll_id} AND id NOT IN ${sql(incomingValidIds)}
                `;
            } else {
                await sqlTransaction`
                    DELETE FROM questions_poll_labels WHERE question_id IN (SELECT id FROM questions WHERE poll_id = ${poll_id})
                `;
                await sqlTransaction`
                    DELETE FROM options WHERE question_id IN (SELECT id FROM questions WHERE poll_id = ${poll_id})
                `;
                await sqlTransaction`
                    DELETE FROM questions WHERE poll_id = ${poll_id}
                `;
            }

            if (toUpdate.length > 0) {
                for (let i = 0; i < toUpdate.length; i++) {
                    const tempOrder = -1000 - i;
                    await sqlTransaction`
                        UPDATE questions 
                        SET sort_order = ${tempOrder} 
                        WHERE id = ${toUpdate[i].id} AND poll_id = ${poll_id}
                    `;
                }

                for (const q of toUpdate) {
                    await sqlTransaction`
                        UPDATE questions 
                        SET 
                            name = ${q.name},
                            multiple_choice = ${q.multiple_choice},
                            sort_order = ${q.sort_order},
                            page_url = ${q.page_url}
                        WHERE id = ${q.id} AND poll_id = ${poll_id}
                    `;
                }
            }

            if (toInsert.length > 0) {
                for (const q of toInsert) {
                    await sqlTransaction`
                        INSERT INTO questions (id, poll_id, name, creator_id, sort_order, multiple_choice, page_url)
                        VALUES (
                            ${q.id}, 
                            ${poll_id}, 
                            ${q.name}, 
                            ${requesterId}, 
                            ${q.sort_order}, 
                            ${q.multiple_choice},
                            ${q.page_url}
                        )
                    `;
                }
            }

            const allProcessedQuestions = [...toUpdate, ...toInsert];

            for (const q of allProcessedQuestions) {
                
                const incomingOptIds = q.options
                    .filter((o: { id?: string; name: string }) => o.id && !String(o.id).startsWith('temp-') && !String(o.id).startsWith('new-'))
                    .map((o: { id?: string; name: string }) => o.id as string);

                if (incomingOptIds.length > 0) {
                    await sqlTransaction`
                        DELETE FROM "options" 
                        WHERE question_id = ${q.id} 
                        AND id NOT IN ${sql(incomingOptIds)}
                    `;
                } else {
                    await sqlTransaction`
                        DELETE FROM "options" WHERE question_id = ${q.id}
                    `;
                }

                for (const opt of q.options) {
                    if (!opt.id || String(opt.id).startsWith('temp-') || String(opt.id).startsWith('new-')) {
                        await sqlTransaction`
                            INSERT INTO "options" (question_id, name)
                            VALUES (${q.id}, ${opt.name})
                        `;
                    } else {
                        await sqlTransaction`
                            UPDATE "options" 
                            SET name = ${opt.name}
                            WHERE id = ${opt.id} AND question_id = ${q.id}
                        `;
                    }
                }

                await sqlTransaction`
                    DELETE FROM questions_poll_labels WHERE question_id = ${q.id}
                `;

                const labelIds = q.label_ids;
                for (const labelId of labelIds) {
                    await sqlTransaction`
                        INSERT INTO questions_poll_labels (question_id, label_id, poll_id)
                        VALUES (${q.id}, ${labelId}, ${poll_id})
                    `;
                }
            }
        });

        return response.status(200).json({ success: true, message: "Pytania, opcje i etykiety zostały zaktualizowane." });

    } catch (error: any) {
        console.error("Update Questions Error:", error);
        
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return response.status(401).json({ error: "Sesja wygasła. Zaloguj się ponownie." });
        }
        
        if (error.code === '23505') {
            return response.status(409).json({ error: "Konflikt danych (np. w kolejności). Spróbuj zapisać ponownie." });
        }

        return response.status(500).json({ error: "Wystąpił błąd podczas zapisywania pytań." });
    }
}
