import sql from '../db.js';
import { isUUIDv7 } from '../js/utils/helpers.js';

export default async function handler(request, response) {
    try {
        const {poll, limit, offset} = request.query;
        const actualLimit = limit ? Math.min(limit, 100) : 100;
        const actualOffset = offset ? Math.max(offset, 0) : 0;

        if (!poll) return response.status(400).json({ error: "Brakujące dane (Id ankiety)." });
        
        if (!isUUIDv7(poll)) {return response.status(400).json({ error: "Id ankiety musi być typu uuidv7" });}

        const questions = await sql`
        SELECT 
            q.id, 
            q.poll_id, 
            q."name", 
            q.added_on, 
            q.creator_id,
            q.multiple_choice, 
            q.page_url, 
            q.sort_order,
            
                -- Subquery to gather labels into a JSON array
                (
                    SELECT COALESCE(json_agg(
                        json_build_object(
                            'id', pl.id,
                            'name', pl."name",
                            'description', pl.description,
                            'hex', pl.hex
                        )
                    ), '[]'::json)
                    FROM questions_poll_labels qpl
                    JOIN poll_labels pl ON qpl.label_id = pl.id
                    WHERE qpl.question_id = q.id
                ) AS labels,

                -- Subquery to gather options into a JSON array
                (
                    SELECT COALESCE(json_agg(
                        json_build_object(
                            'id', o.id,
                            'name', o."name"
                        )
                    ), '[]'::json)
                    FROM "options" o
                    WHERE o.question_id = q.id
                ) AS options

            FROM questions q
            WHERE q.poll_id = ${poll}
            ORDER BY q.sort_order ASC
            LIMIT ${actualLimit}
            OFFSET ${actualOffset};
        `;

        return response.status(200).json(questions);

    } catch (error) {
        console.error("Failed to load poll questions:", error);
        return response.status(500).json({ error: "Failed to load poll questions" });
    }
}