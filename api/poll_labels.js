import sql from '../db.js';
import { isUUIDv7 } from '../js/utils/helpers.js';

export default async function handler(request, response) {
    try {
        const {poll, limit, offset} = request.query;
        const actualLimit = limit ? Math.min(limit, 100) : 100;
        const actualOffset = offset ? Math.max(offset, 0) : 0;

        if (!poll) return response.status(400).json({ error: "Brakujące dane (Id ankiety)." });
        
        if (!isUUIDv7(poll)) {
            return response.status(400).json({ error: "Id ankiety musi być typu uuidv7" });
        }

        // Using ::int cast to the COUNT() function. In PostgreSQL by default, COUNT() returns a bigint, 
        // which the Node.js driver will return as a string to prevent JavaScript precision loss. 
        // Casting it to ::int guarantees frontend receives a standard, easy-to-use JavaScript Number.
        const labels = await sql`
            SELECT 
                pl.id,
                pl.poll_id,
                pl.name,
                pl.hex,
                pl.description,
                COUNT(qpl.question_id)::int AS questions_count
            FROM poll_labels pl
            LEFT JOIN questions_poll_labels qpl 
                ON pl.id = qpl.label_id 
                AND qpl.poll_id = ${poll}
            WHERE pl.poll_id = ${poll} 
            GROUP BY pl.id
            ORDER BY pl.name ASC
            LIMIT ${actualLimit}
            OFFSET ${actualOffset}
        `;

        return response.status(200).json(labels);

    } catch (error) {
        console.error("Failed to load poll labels:", error);
        return response.status(500).json({ error: "Failed to load poll labels" });
    }
}