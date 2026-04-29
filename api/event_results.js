import sql from '../db.js';

export default async function handler(request, response) {
    if (request.method !== 'GET') {
        return response.status(405).json({ error: "Method not allowed." });
    }

    try {
        const { id, tournament, player, major } = request.query;

        if (!id && !tournament && !player) {
            return response.status(422).json({ error: "ID, tournament or player parameter is mandatory." });
        }

        let flatResults;

        // DATABASE FETCHING
        if (id) {
            flatResults = await sql`
                SELECT r.player_id, p.displayed_name, er.position, er.points, e.id AS event_id, e.name AS event_name, e.is_major AS is_major_event, e.tournament_id 
                FROM events e 
                INNER JOIN results r 
                    ON r.tournament_id = e.tournament_id 
                INNER JOIN players p
                    ON p.id = r.player_id
                LEFT JOIN event_results er 
                    ON er.event_id = e.id AND er.player_id = r.player_id 
                WHERE e.id = ${id}
                ORDER BY e.event_date;`;
        }
        else if (tournament) {
            flatResults = await sql`
                SELECT r.player_id, p.displayed_name, er.position, er.points, e.id AS event_id, e.name AS event_name, e.is_major AS is_major_event, e.tournament_id
                FROM events e 
                INNER JOIN results r 
                    ON r.tournament_id = e.tournament_id 
                INNER JOIN players p
                    ON p.id = r.player_id
                LEFT JOIN event_results er 
                    ON er.event_id = e.id AND er.player_id = r.player_id 
                WHERE e.tournament_id = ${tournament}
                ORDER BY e.event_date;`;
        }
        else if (player) {
            flatResults = await sql`
                SELECT r.player_id, p.displayed_name, er.position, er.points, e.id AS event_id, e.name AS event_name, e.is_major AS is_major_event, e.tournament_id
                FROM events e 
                INNER JOIN results r 
                    ON r.tournament_id = e.tournament_id 
                INNER JOIN players p
                    ON p.id = r.player_id
                LEFT JOIN event_results er 
                    ON er.event_id = e.id AND er.player_id = r.player_id 
                WHERE r.player_id = ${player}
                ORDER BY e.event_date;`;
        }

        // OPTIONAL FILTERING
        // Could use 6 separate sql queries to save memory instead of this filtering method but the scale of the db is too small to care about that and this way code looks cleaner.
        if (major === 'true') {
            flatResults = flatResults.filter(row => row.is_major_event === true);
        } else if (major === 'false') {
            flatResults = flatResults.filter(row => row.is_major_event === false);
        }

        const groupedMap = new Map();

        flatResults.forEach(row => {
            if (!groupedMap.has(row.event_id)) {
                groupedMap.set(row.event_id, {
                    event_id: row.event_id,
                    event_name: row.event_name,
                    is_major_event: row.is_major_event,
                    tournament_id: row.tournament_id,
                    results: [] 
                });
            }

            groupedMap.get(row.event_id).results.push({
                player_id: row.player_id,
                displayed_name: row.displayed_name,
                position: row.position,
                points: row.points
            });
        });

        // Sorted by event_date (ORDER BY e.event_date sql query)
        const finalPayload = Array.from(groupedMap.values());

        return response.status(200).json(finalPayload);
        
    } catch (error) {
        console.error("Event Results Load Error:", error);
        return response.status(500).json({ error: "Failed to load Event Results." });
    }
}