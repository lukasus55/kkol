import sql from '../db.js';

export default async function handler(request, response) {
    try {
        
        
        // Check for the optional 'id' parameter
        const { id, player } = request.query;

        let tournaments, results;

        if (id) {
            [tournaments, results] = await Promise.all([
                sql`SELECT * FROM tournaments WHERE id = ${id}`,

                sql`SELECT r.tournament_id, r.player_id, r.attended, r.finished, r."position", r.total_points, p.displayed_name AS player_name FROM results r
                    INNER JOIN players p ON r.player_id = p.id 
                    WHERE tournament_id = ${id}`
            ]);
        } 
        else if (player) {
            [tournaments, results] = await Promise.all([
                sql`SELECT t.id, t.displayed_name, t.page_exists, t.page_url, t.finished, t.event_timestamp, t.displayed_date, t.tier, r.player_id FROM tournaments t 
                    inner join results r on r.tournament_id = t.id  
                    where r.player_id = ${player}`,

                sql`SELECT r.tournament_id, r.player_id, r.attended, r.finished, r."position", r.total_points, p.displayed_name AS player_name FROM results r
                    INNER JOIN players p ON r.player_id = p.id
                    WHERE player_id = ${player};`
            ]);
        }
        else {
            // Fetch All
            [tournaments, results] = await Promise.all([
                sql`SELECT * FROM tournaments`,

                sql`SELECT r.tournament_id, r.player_id, r.attended, r.finished, r."position", r.total_points, p.displayed_name AS player_name FROM results r
                    INNER JOIN players p ON r.player_id = p.id`
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

            if (tournament && r.position && r.attended) {
                tournament.standings.push({
                    id: r.player_id,
                    displayed_name: r.player_name,
                    position: r.position,
                    total_points: r.total_points
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