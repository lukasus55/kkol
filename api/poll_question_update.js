import sql from '../db.js';
import jwt from 'jsonwebtoken';
import { uuidv7 } from "uuidv7";
import { parse } from 'cookie';
import { escapeHTML } from '../js/utils/helpers.js';
import { hasTournamentPermission, isPartOfTournament } from '../js/utils/permissionChecks.js';

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        // ------------------------------------------------------------------
        // AUTHENTICATION
        // ------------------------------------------------------------------
        const cookies = parse(request.headers.cookie || '');
        const token = cookies.auth_token;

        if (!token) return response.status(401).json({ error: "Brak autoryzacji." });

        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
        const requesterId = decodedPayload.id;

        const { poll_id, questions } = request.body;

        if (!poll_id || !Array.isArray(questions)) {
            return response.status(400).json({ error: "Brakujące dane (Id ankiety lub lista pytań)." });
        }

        // ------------------------------------------------------------------
        // PERMISSION CHECKS
        // ------------------------------------------------------------------
        const pollCheck = await sql`
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

        // ------------------------------------------------------------------
        // PAYLOAD PARSING & SANITIZATION
        // ------------------------------------------------------------------
        const incomingValidIds = []; // To track which existing questions were kept
        const toInsert = [];
        const toUpdate = [];

        for (const q of questions) {
            const clean_name = escapeHTML(q.name || '');
            
            if (clean_name.trim().length < 3) {
                return response.status(400).json({ error: `Pytanie "${clean_name}" musi mieć co najmniej 3 znaki.` });
            }
            if (clean_name.trim().length > 100) {
                return response.status(400).json({ error: `Pytanie "${clean_name}" może mieć maksymalnie 100 znaków.` });
            }

            const processedQuestion = {
                id: q.id,
                name: clean_name,
                page_url: q.page_url || null,
                multiple_choice: Boolean(q.multiple_choice),
                sort_order: Number(q.sort_order) || 0
            };

            if (!q.id || String(q.id).startsWith('temp-')) {
                processedQuestion.id = uuidv7(); // Generate a real UUID for DB insertion
                toInsert.push(processedQuestion);
            } else {
                incomingValidIds.push(q.id);
                toUpdate.push(processedQuestion);
            }
        }

        // ------------------------------------------------------------------
        // DATABASE TRANSACTION
        // ------------------------------------------------------------------
        await sql.begin(async (sqlTransaction) => {

            // DELETE MISSING QUESTIONS
            if (incomingValidIds.length > 0) {
                await sqlTransaction`
                    DELETE FROM questions 
                    WHERE poll_id = ${poll_id} 
                    AND id NOT IN ${sqlTransaction(incomingValidIds)}
                `;
            } else {
                await sqlTransaction`
                    DELETE FROM questions WHERE poll_id = ${poll_id}
                `;
            }

            // UPDATE EXISTING QUESTIONS
            if (toUpdate.length > 0) {
                // To avoid UNIQUE(poll_id, sort_order) constraint collisions when swapping positions
                // (e.g., swapping 1 and 2), first shift all updating rows to a negative temporary order.
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
                            page_url = ${q.page_url || null}
                        WHERE id = ${q.id} AND poll_id = ${poll_id}
                    `;
                }
            }

            // INSERT NEW QUESTIONS
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
                            ${q.page_url || null}
                        )
                    `;
                }
            }
        });

        return response.status(200).json({ success: true, message: "Pytania zostały zaktualizowane." });

    } catch (error) {
        console.error("Update Questions Error:", error);
        
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return response.status(401).json({ error: "Sesja wygasła. Zaloguj się ponownie." });
        }
        
        // postgres.js error code 23505 is unique_violation
        if (error.code === '23505') {
            return response.status(409).json({ error: "Konflikt w kolejności (sort_order). Spróbuj zapisać ponownie." });
        }

        return response.status(500).json({ error: "Wystąpił błąd podczas zapisywania pytań." });
    }
}