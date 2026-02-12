import { neon } from '@neondatabase/serverless';

export default async function handler(request, response) {
    try {
        const sql = neon(process.env.DATABASE_URL);
        
        // Check for the optional 'id' parameter
        const { id } = request.query;

        let tournaments, results;

        if (id) {
            [tournaments, results] = await Promise.all([
                sql`SELECT * FROM tournaments WHERE id = ${id}`,
                sql`SELECT * FROM results WHERE tournament_id = ${id}`
            ]);
        } else {
            // Fetch All
            [tournaments, results] = await Promise.all([
                sql`SELECT * FROM tournaments`,
                sql`SELECT * FROM results`
            ]);
        }

        const dataMap = {};

        // Create the skeleton
        tournaments.forEach((t) => {
            dataMap[t.id] = {
                id: t.id,
                displayed_name: t.displayed_name,
                page_exists: t.page_exists,
                page_url: t.page_url,
                type: t.type,
                finished: t.finished,
                standings: [],
                details: {
                    timestamp: t.event_timestamp,
                    displayed_date: t.displayed_date,
                    players: t.player_count,
                    tier: t.tier
                }
            };
        });

        // Fill in the standings
        results.forEach((r) => {
            const tournament = dataMap[r.tournament_id];

            if (tournament && r.position) {
                tournament.standings.push({
                    position: r.position,
                    id: r.player_id
                });
            }
        });

        // Sorting (Primary: Pos Ascending, Secondary: ID Alphabetical)
        Object.values(dataMap).forEach(tournament => {
            tournament.standings.sort((a, b) => {
                if (a.position !== b.position) {
                    return a.position - b.position;
                }
                return a.id.localeCompare(b.id);
            });
        });

        return response.status(200).json(dataMap);

    } catch (error) {
        console.error("Tournament API Error:", error);
        return response.status(500).json({ error: "Failed to load tournaments" });
    }
}