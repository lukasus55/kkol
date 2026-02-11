import { neon } from '@neondatabase/serverless';

export default async function handler(request, response) {
    try {
        const sql = neon(process.env.DATABASE_URL);

        const [players, results] = await Promise.all([
            sql`SELECT * FROM players`,
            sql`SELECT * FROM results`
        ]);

        const dataMap = {};

        // Create the player objects (Keyed by ID)
        players.forEach((p) => {
            dataMap[p.id] = {
                // key = column name (Direct mapping)
                id: p.id,
                displayed_name: p.displayed_name,
                profile_picture: p.profile_picture, 
                
                tournaments: {} 
            };
        });

        // ill in the tournaments/results
        results.forEach((r) => {
            const player = dataMap[r.player_id];
            
            if (player) {
                // use the ID as the key ("kostys")
                player.tournaments[r.tournament_id] = {
                    id: r.tournament_id,
                    attended: r.attended,
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