import sql from '../db.js';
import { isUUIDv7 } from '../js/utils/helpers.js';

export default async function handler(request, response) {
    try {
        const {poll, limit} = request.query;
        const actualLimit = limit ? Math.min(limit, 100) : 100;

        if (!poll) return response.status(400).json({ error: "Brakujące dane (Id ankiety)." });
        
        if (!isUUIDv7(poll)) {return response.status(400).json({ error: "Id ankiety musi być typu uuidv7" });}

        const questions = await sql`
            SELECT * FROM questions 
            WHERE poll_id = ${poll} 
            ORDER BY "sort_order" ASC
            LIMIT ${actualLimit}
        `;

        return response.status(200).json(questions);

    } catch (error) {
        console.error("Failed to load poll questions:", error);
        return response.status(500).json({ error: "Failed to load poll questions" });
    }
}