import type { NextApiRequest, NextApiResponse } from 'next';
import type { Poll } from '../../types/db';
import sql from '../../db.js';
import { isUUIDv7 } from '../../public/js/utils/helpers.js';

interface PollsRequest extends NextApiRequest {
    query: {
        id?: string;
        player?: string;
        tournament?: string;
        limit?: string;
        order?: string;
    };
}

export default async function handler(request: PollsRequest, response: NextApiResponse) {
    try {
        const { id, player, tournament, limit, order } = request.query;
        const actualLimit = limit ? Math.min(Number(limit), 100) : 100;
        const orderClause = sql.unsafe(order === 'reversed' ? 'ORDER BY "end_date" ASC' : 'ORDER BY "end_date" DESC');

        let polls: Poll[];

        if (id) {
            if (!isUUIDv7(id)) {return response.status(400).json({ error: "Id ankiety musi być typu uuidv7" });}
            polls = await sql<Poll[]>`SELECT * FROM "polls" WHERE id = ${id} ${orderClause} LIMIT ${actualLimit}`;
        }
        else if (tournament) {
            polls = await sql<Poll[]>`SELECT * FROM "polls" WHERE tournament_id = ${tournament} ${orderClause} LIMIT ${actualLimit}`;
        }
        else if (player) {
            polls = await sql<Poll[]>`
                SELECT p.*
                FROM "polls" p 
                INNER JOIN "results" r ON p.tournament_id = r.tournament_id
                WHERE r.player_id = ${player}
                ${orderClause}
                LIMIT ${actualLimit}
            `;
        }
        else {
            polls = await sql<Poll[]>`SELECT * FROM "polls" ${orderClause} LIMIT ${actualLimit}`;
        }

        return response.status(200).json(polls);

    } catch (error: any) {
        console.error("Failed to load polls:", error);
        return response.status(500).json({ error: "Failed to load polls" });
    }
}