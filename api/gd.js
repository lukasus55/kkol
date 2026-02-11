import { neon } from '@neondatabase/serverless';

export default async function handler(request, response) {
    try {
        const sql = neon(process.env.DATABASE_URL);

        const [levels, scores] = await Promise.all([
            sql`SELECT * FROM gd_levels ORDER BY id ASC`,
            sql`SELECT * FROM gd_scores`
        ]);

        const result = {
            levels: levels.map((level) => {
                const levelScores = scores.filter(s => s.level_id === level.id);

                const players = levelScores.map(s => ({
                    id: s.player_id,     
                    position: s.position, 
                    score: s.score       
                }));

                return {
                    id: level.id,
                    name: level.name,
                    difficulty: level.difficulty,
                    finished: level.finished,
                    players: players
                };
            })
        };

        return response.status(200).json(result);

    } catch (error) {
        console.error("GD API Error:", error);
        return response.status(500).json({ error: "Failed to fetch GD data" });
    }
}