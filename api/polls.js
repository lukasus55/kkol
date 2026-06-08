import sql from '../db.js';

export default async function handler(request, response) {
    try {
        const { id, player, tournament, limit } = request.query;
        const actualLimit = limit ? Math.min(limit, 100) : 100;

        let polls;

        if (id) {polls = await sql`SELECT * FROM "polls" WHERE id = ${id} LIMIT ${actualLimit}`;}
        else if (tournament) {polls = await sql`SELECT * FROM "polls" WHERE tournament_id = ${tournament} LIMIT ${actualLimit}`;}
        else if (player) {polls = await sql`
                SELECT p.id, p.create_default_options, p.name, p.end_date, p.rights_level, p.start_date, p.tournament_id, r.player_id 
                FROM "polls" p 
                INNER JOIN "results" r ON p.tournament_id = r.tournament_id
                WHERE r.player_id = ${player}
                LIMIT ${actualLimit}
            `;}
        else {polls = await sql`SELECT * FROM "polls" LIMIT ${actualLimit}`};

        return response.status(200).json(polls);

    } catch (error) {
        console.error("Failed to load polls:", error);
        return response.status(500).json({ error: "Failed to load polls" });
    }
}