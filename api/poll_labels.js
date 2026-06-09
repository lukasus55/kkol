import sql from '../db.js';

export default async function handler(request, response) {
    try {
        const {poll, limit} = request.query;
        const actualLimit = limit ? Math.min(limit, 100) : 100;

        if (!poll) return response.status(400).json({ error: "Brakujące dane (Id ankiety)." });

        const labels = await sql`
            SELECT * FROM poll_labels 
            WHERE poll_id = ${poll} 
            ORDER BY "name" ASC
            LIMIT ${actualLimit}
        `;

        return response.status(200).json(labels);

    } catch (error) {
        console.error("Failed to load polls:", error);
        return response.status(500).json({ error: "Failed to load polls" });
    }
}