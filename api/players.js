import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

export default async function handler(request, response) {
    try {
        const sql = neon(process.env.DATABASE_URL);

        const [players, results] = await Promise.all([
            sql`SELECT id, displayed_name FROM players`,
            sql`SELECT * FROM results`
        ]);



        const dataMap = {};

        // Create the player objects (Keyed by ID)
        players.forEach((p) => {
            let pfpPath = `/img/players/pfp/default.webp`;
                
            const browserUrl = `/img/players/pfp/${p.id}.webp`;

            const serverFilePath = path.join(process.cwd(), 'img', 'players', 'pfp', `${p.id}.webp`);

            if (fs.existsSync(serverFilePath)) { 
                pfpPath = browserUrl; 
            }

            dataMap[p.id] = {
                // key = column name (Direct mapping)
                id: p.id,
                displayed_name: p.displayed_name,
                pfp_url: pfpPath,
                
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