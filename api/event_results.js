import sql from '../db.js';

export default async function handler(request, response) {
    if (request.method !== 'GET') {
        return response.status(405).json({ error: "Method not allowed." });
    }

    try {

        const { id } = request.query;

        if (!id) {
            return response.status(422).json({ error: "ID paramater is mandatory." });
        }

        const results = await sql`
            SELECT r.player_id, er.position, er.points, e.id AS event_id 
            FROM events e 
            INNER JOIN results r 
                ON r.tournament_id = e.tournament_id 
            LEFT JOIN event_results er 
                ON er.event_id = e.id AND er.player_id = r.player_id 
            WHERE e.id = ${id};`;

        return response.status(200).json(results);
    } 
    catch (error) {
        return response.status(500).json({ error: "Failed to load Event Results." });
    }
}