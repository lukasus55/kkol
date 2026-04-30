import sql from '../db.js';

export default async function handler(request, response) {
    if (request.method !== 'GET') {
        return response.status(405).json({ error: "Method not allowed." });
    }

    try {
        const { q } = request.query;

        if (!q || q.trim().length < 1) {
            return response.status(200).json([]);
        }

        const searchQuery = q.trim();

        // The Trigram Search Query
        // displayed_name % ${searchQuery}: This is the trigram fuzzy match. If they type "kukila", it will mathematically realize it's very similar to "kukula" and return it.
        // ILIKE ${'%' + searchQuery + '%'}: Including the standard wildcard search as a fallback just in case user type a very short exact substring that the fuzzy matcher might score lower on.
        // ORDER BY GREATEST(...) DESC: Checking the similarity score of both the id and the displayed_name, take whichever score is higher, and put the highest scoring players at the top of the list.

        const players = await sql`
            SELECT id, displayed_name, pfp_base64
            FROM players
            WHERE displayed_name % ${searchQuery} 
                OR id % ${searchQuery} 
                OR displayed_name ILIKE ${'%' + searchQuery + '%'}
                OR id ILIKE ${'%' + searchQuery + '%'}
            ORDER BY GREATEST(
                similarity(displayed_name, ${searchQuery}), 
                similarity(id, ${searchQuery})
            ) DESC
            LIMIT 5;
        `;

        return response.status(200).json(players);

    } catch (error) {
        console.error("Search API Error:", error);
        return response.status(500).json({ error: "Failed to search players." });
    }
}