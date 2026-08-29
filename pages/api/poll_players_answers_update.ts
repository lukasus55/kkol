import type { NextApiRequest, NextApiResponse } from 'next';
import sql from '../../db.js';
import jwt from 'jsonwebtoken';
import { uuidv7 } from "uuidv7";
import { parse } from 'cookie';
import { isUUIDv7 } from '../../public/js/utils/helpers.js';

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
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

        const decodedPayload: any = jwt.verify(token, process.env.JWT_SECRET as string);
        const requesterId = decodedPayload.id; 

        // ------------------------------------------------------------------
        // PAYLOAD VALIDATION
        // ------------------------------------------------------------------
        const { poll_id, answers } = request.body;

        if (!poll_id || !answers || typeof answers !== 'object') {
            return response.status(400).json({ error: "Brakujące lub nieprawidłowe dane." });
        }

        if (!isUUIDv7(poll_id)) {
            return response.status(400).json({ error: "Id ankiety musi być typu uuidv7." });
        }

        // Extract all selected option IDs into a single flat array
        const optionIdsToInsert: any[] = [];
        for (const [questionId, optionIds] of Object.entries(answers)) {
            if (Array.isArray(optionIds) && optionIds.length > 0) {
                optionIdsToInsert.push(...optionIds);
            }
        }

        const tournamentRes = await sql`SELECT tournament_id, start_date, end_date FROM polls WHERE id = ${poll_id}`;
        if (tournamentRes.length === 0) return response.status(404).json({ error: "Ankieta nie istnieje." });
        const { tournament_id, start_date, end_date } = tournamentRes[0];

        const now = new Date();
        if (start_date && new Date(start_date) > now) {
            return response.status(403).json({ error: "Głosowanie jeszcze się nie rozpoczęło." });
        }
        if (end_date && new Date(end_date) < now) {
            return response.status(403).json({ error: "Głosowanie zostało już zakończone." });
        }

        const permissions = await sql`
            SELECT
                (SELECT role FROM players WHERE id = ${requesterId}) as global_role,
                EXISTS(SELECT 1 FROM tournament_organizers WHERE tournament_id = ${tournament_id} AND player_id = ${requesterId}) as is_organizer,
                EXISTS(SELECT 1 FROM results WHERE tournament_id = ${tournament_id} AND player_id = ${requesterId}) as is_player
        `;
        const p = permissions[0];
        if (p.global_role !== 'admin' && !p.is_organizer && !p.is_player) {
            return response.status(403).json({ error: "Brak dostępu. Musisz być przypisany do turnieju, aby głosować." });
        }

        // ------------------------------------------------------------------
        // SECURITY & DB TRANSACTION
        // ------------------------------------------------------------------
        await sql.begin(async (sqlTransaction: any) => {
            
            // Verify all submitted options actually belong to this poll
            if (optionIdsToInsert.length > 0) {
                const validOptions = await sqlTransaction`
                    SELECT o.id 
                    FROM "options" o
                    JOIN questions q ON o.question_id = q.id
                    WHERE q.poll_id = ${poll_id}
                    AND o.id IN ${sql(optionIdsToInsert)}
                `;

                // If the counts don't match, the user injected an option from another poll
                if (validOptions.length !== optionIdsToInsert.length) {
                    throw new Error("SECURITY_VIOLATION");
                }
            }

            // Wipe existing answers for this player in this poll
            // Using subquery here because checked_answers doesn't have poll_id
            await sqlTransaction`
                DELETE FROM checked_answers 
                WHERE player_id = ${requesterId} 
                AND option_id IN (
                    SELECT o.id FROM "options" o
                    JOIN questions q ON o.question_id = q.id
                    WHERE q.poll_id = ${poll_id}
                )
            `;

            // Insert the new answers
            if (optionIdsToInsert.length > 0) {
                const insertData = optionIdsToInsert.map(optId => ({
                    option_id: optId,
                    player_id: requesterId
                }));

                // postgres.js bulk insert syntax
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
