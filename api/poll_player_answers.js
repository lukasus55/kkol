import sql from '../db.js';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import { isUUIDv7 } from '../js/utils/helpers.js';
import { hasTournamentPermission, isPartOfTournament } from '../js/utils/permissionChecks.js';

export default async function handler(request, response) {
    if (request.method !== 'GET') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { poll, player } = request.query;

        // PARAM VALIDATION
        if (!poll || !player) {
            return response.status(400).json({ error: "Brakujące dane (Id ankiety lub Id gracza)." });
        }

        if (!isUUIDv7(poll)) {
            return response.status(400).json({ error: "Id ankiety musi być typu uuidv7." });
        }

        // AUTHENTICATION
        const cookies = parse(request.headers.cookie || '');
        const token = cookies.auth_token;

        if (!token) return response.status(401).json({ error: "Brak autoryzacji." });

        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
        const requesterId = decodedPayload.id;

        if (requesterId !== player) {
            const pollCheck = await sql`
                SELECT tournament_id, rights_level FROM polls WHERE id = ${poll}
            `;
            
            if (pollCheck.length === 0) {
                return response.status(404).json({ error: "Ankieta nie istnieje." });
            }

            const tournamentId = pollCheck[0].tournament_id;
            const rightsLevel = pollCheck[0].rights_level;

            const allowedByRules = rightsLevel >= 2 && await isPartOfTournament(requesterId, tournamentId);
            const hasPermission = allowedByRules || await hasTournamentPermission(requesterId, tournamentId);
            
            if (!hasPermission) {
                return response.status(403).json({ error: "Brak uprawnień do przeglądania odpowiedzi innych graczy." });
            }
        }

        // FETCH DATA (Using JSON Aggregation for Dictionary Map)
        const result = await sql`
            WITH grouped_answers AS (
                -- Group the options into an array for each question
                SELECT 
                    o.question_id,
                    array_agg(ca.option_id::text) AS selected_options
                FROM checked_answers ca
                JOIN "options" o ON ca.option_id = o.id
                JOIN questions q ON o.question_id = q.id
                WHERE q.poll_id = ${poll} AND ca.player_id = ${player}
                GROUP BY o.question_id
            )
            -- Turn rows into a single JSON object where question_id is the key
            SELECT COALESCE(
                json_object_agg(question_id, selected_options), 
                '{}'::json
            ) AS answers_map
            FROM grouped_answers
        `;

        const answersMap = result[0].answers_map;

        return response.status(200).json(answersMap);

    } catch (error) {
        console.error("Fetch Player Answers Error:", error);
        
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return response.status(401).json({ error: "Sesja wygasła. Zaloguj się ponownie." });
        }

        return response.status(500).json({ error: "Wystąpił błąd podczas pobierania odpowiedzi gracza." });
    }
}