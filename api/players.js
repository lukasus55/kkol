import sql from '../db.js';

export default async function handler(request, response) {
    try {

        // Check for the optional parameters
        const { id, tournament, limit } = request.query;
        const actualLimit = limit ? Math.min(limit, 100) : 100;

        let players, results;

        if (id) {
            [players, results] = await Promise.all([
                sql`SELECT id, displayed_name, pfp_base64 FROM players WHERE id = ${id}`,
                sql`SELECT * FROM results  WHERE player_id = ${id}`
            ]);
        } 
        else if (tournament)
        {
            [players, results] = await Promise.all([
                sql`SELECT id, displayed_name, pfp_base64 
                    FROM players 
                    WHERE id IN (
                        SELECT player_id 
                        FROM results 
                        WHERE tournament_id = ${tournament}
                    )`,
                sql`SELECT * FROM results WHERE tournament_id = ${tournament}`
            ]);
        }
        else {
            [players, results] = await Promise.all([
                sql`SELECT id, displayed_name, pfp_base64 FROM players LIMIT ${actualLimit}`,
                sql`SELECT * FROM results LIMIT ${actualLimit}`
            ]);
        }
        const dataMap = {};

        // Create the player objects (Keyed by ID)
        players.forEach((p) => {

            dataMap[p.id] = {
                // key = column name (Direct mapping)
                id: p.id,
                displayed_name: p.displayed_name,
                pfp_base64: p.pfp_base64,
                
                tournaments: {} 
            };
        });

        // ill in the tournaments/results
        results.forEach((r) => {
            const player = dataMap[r.player_id];
            
            if (player && r.attended) {
                // use the ID as the key ("kostys")
                player.tournaments[r.tournament_id] = {
                    id: r.tournament_id,
                    finished: r.finished,
                    position: r.position,
                    total_points: r.total_points,
                    games_positions: r.games_positions,
                    games_points: r.games_points
                };
            }
        });

        return response.status(200).json(dataMap);

    } catch (error) {
        console.error("Transformer Error:", error);
        return response.status(500).json({ error: "Failed to load complete players" });
    }
}