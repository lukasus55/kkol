import { neon } from '@neondatabase/serverless';

export default async function handler(request, response) {
    try {
        const sql = neon(process.env.DATABASE_URL);

        const [tournaments, results] = await Promise.all([
            sql`SELECT * FROM tournaments`,
            sql`SELECT * FROM results`
        ]);

        const dataMap = {};

        // Creates the skeleton for each tournament
        tournaments.forEach((t) => {
            // use the ID as the key ("kol2024")
            dataMap[t.id] = {
                id: t.id,
                displayed_name: t.displayed_name,
                page_exists: t.page_exists,
                page_url: t.page_url,
                type: t.type,
                finished: t.finished,
                standings: {}, 
                details: {
                    timestamp: t.event_timestamp, // Database column -> JSON key
                    displayed_date: t.displayed_date,
                    players: t.player_count,
                    tier: t.tier
                }
            };
        });

        // Fill in the standings
        results.forEach((r) => {
            // Find the tournament this result belongs to
            const tournament = dataMap[r.tournament_id];

            if (tournament) {
                if (r.position) {
                    tournament.standings[r.position] = r.player_id;
                }
            }
        });

        return response.status(200).json(dataMap);

    } catch (error) {
        console.error("Transformer Error:", error);
        return response.status(500).json({ error: "Failed to load complete tournaments" });
    }
}