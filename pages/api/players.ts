import type { NextApiRequest, NextApiResponse } from 'next';
import type { Player, Result } from '../../types/db';
import sql from '../../db.js';

interface PlayersRequest extends NextApiRequest {
    query: {
        id?: string;
        tournament?: string;
        limit?: string;
    };
}

type PlayerRow = Pick<Player, 'id' | 'displayed_name' | 'pfp_base64'>;

/**
 * @swagger
 * /api/players:
 *   get:
 *     summary: Get players list or details
 *     description: Retrieves a list of players. Can be filtered by a specific ID or tournament ID.
 *     tags: [Auth & Player]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: Specific player ID
 *       - in: query
 *         name: tournament
 *         schema:
 *           type: string
 *         description: Filter players by tournament ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           maximum: 100
 *         description: Limit the number of returned players (default 100)
 *     responses:
 *       200:
 *         description: A dictionary of players mapped by ID
 *       500:
 *         description: Internal server error
 */
export default async function handler(request: PlayersRequest, response: NextApiResponse) {
    try {
        const { id, tournament, limit } = request.query;
        const actualLimit = limit ? Math.min(Number(limit), 100) : 100;

        let players: PlayerRow[];
        let results: Result[];

        if (id) {
            [players, results] = await Promise.all([
                sql<PlayerRow[]>`SELECT id, displayed_name, pfp_base64 FROM players WHERE id = ${id}`,
                sql<Result[]>`SELECT * FROM results WHERE player_id = ${id}`
            ]);
        } 
        else if (tournament) {
            [players, results] = await Promise.all([
                sql<PlayerRow[]>`
                    SELECT id, displayed_name, pfp_base64 
                    FROM players 
                    WHERE id IN (
                        SELECT player_id 
                        FROM results 
                        WHERE tournament_id = ${tournament}
                    )`,
                sql<Result[]>`SELECT * FROM results WHERE tournament_id = ${tournament}`
            ]);
        }
        else {
            [players, results] = await Promise.all([
                sql<PlayerRow[]>`SELECT id, displayed_name, pfp_base64 FROM players LIMIT ${actualLimit}`,
                sql<Result[]>`SELECT * FROM results LIMIT ${actualLimit}`
            ]);
        }

        const dataMap: Record<string, any> = {};

        players.forEach((p) => {
            dataMap[p.id] = {
                id: p.id,
                displayed_name: p.displayed_name,
                pfp_base64: p.pfp_base64,
                tournaments: {} 
            };
        });

        results.forEach((r) => {
            const player = dataMap[r.player_id];
            
            if (player && r.attended) {
                player.tournaments[r.tournament_id] = {
                    id: r.tournament_id,
                    finished: r.finished,
                    position: r.position,
                    total_points: r.total_points
                };
            }
        });

        return response.status(200).json(dataMap);

    } catch (error: any) {
        console.error("Transformer Error:", error);
        return response.status(500).json({ error: "Failed to load complete players" });
    }
}
