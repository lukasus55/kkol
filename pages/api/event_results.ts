import type { NextApiRequest, NextApiResponse } from 'next';
import type { EventResult, Event, Player } from '../../types/db';
import sql from '../../db.js';

interface EventResultsRequest extends NextApiRequest {
    query: {
        id?: string;
        tournament?: string;
        player?: string;
        major?: string;
    };
}

export type EventResultRow = {
    player_id: string;
    displayed_name: string;
    position: number | null;
    points: number | string | null;
    event_id: number;
    event_name: string;
    is_major_event: boolean;
    tournament_id: string;
};

/**
 * @swagger
 * /api/event_results:
 *   get:
 *     summary: Get event results
 *     description: Retrieves results of players in events. Must provide either id, tournament, or player.
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         description: Specific event ID
 *       - in: query
 *         name: tournament
 *         schema:
 *           type: string
 *         description: Filter by tournament ID
 *       - in: query
 *         name: player
 *         schema:
 *           type: string
 *         description: Filter by player ID
 *       - in: query
 *         name: major
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *         description: Filter by major/minor events
 *     responses:
 *       200:
 *         description: Array of event results grouped by event ID
 *       422:
 *         description: Missing required parameters
 *       500:
 *         description: Internal server error
 */
export default async function handler(request: EventResultsRequest, response: NextApiResponse) {
    if (request.method !== 'GET') {
        return response.status(405).json({ error: "Method not allowed." });
    }

    try {
        const { id, tournament, player, major } = request.query;

        if (!id && !tournament && !player) {
            return response.status(422).json({ error: "ID, tournament or player parameter is mandatory." });
        }

        let flatResults: EventResultRow[] = [];

        // DATABASE FETCHING
        if (id) {
            flatResults = await sql<EventResultRow[]>`
                SELECT r.player_id, p.displayed_name, er.position, er.points, e.id AS event_id, e.name AS event_name, e.is_major AS is_major_event, e.tournament_id 
                FROM events e 
                INNER JOIN results r 
                    ON r.tournament_id = e.tournament_id 
                INNER JOIN players p
                    ON p.id = r.player_id
                LEFT JOIN event_results er 
                    ON er.event_id = e.id AND er.player_id = r.player_id 
                WHERE e.id = ${id}
                ORDER BY e.event_date;`;
        }
        else if (tournament) {
            flatResults = await sql<EventResultRow[]>`
                SELECT r.player_id, p.displayed_name, er.position, er.points, e.id AS event_id, e.name AS event_name, e.is_major AS is_major_event, e.tournament_id
                FROM events e 
                INNER JOIN results r 
                    ON r.tournament_id = e.tournament_id 
                INNER JOIN players p
                    ON p.id = r.player_id
                LEFT JOIN event_results er 
                    ON er.event_id = e.id AND er.player_id = r.player_id 
                WHERE e.tournament_id = ${tournament}
                ORDER BY e.event_date;`;
        }
        else if (player) {
            flatResults = await sql<EventResultRow[]>`
                SELECT r.player_id, p.displayed_name, er.position, er.points, e.id AS event_id, e.name AS event_name, e.is_major AS is_major_event, e.tournament_id
                FROM events e 
                INNER JOIN results r 
                    ON r.tournament_id = e.tournament_id 
                INNER JOIN players p
                    ON p.id = r.player_id
                LEFT JOIN event_results er 
                    ON er.event_id = e.id AND er.player_id = r.player_id 
                WHERE r.player_id = ${player}
                ORDER BY e.event_date;`;
        }

        if (major === 'true') {
            flatResults = flatResults.filter((row: EventResultRow) => row.is_major_event === true);
        } else if (major === 'false') {
            flatResults = flatResults.filter((row: EventResultRow) => row.is_major_event === false);
        }

        const groupedMap = new Map<number, any>();

        flatResults.forEach((row: EventResultRow) => {
            if (!groupedMap.has(row.event_id)) {
                groupedMap.set(row.event_id, {
                    event_id: row.event_id,
                    event_name: row.event_name,
                    is_major_event: row.is_major_event,
                    tournament_id: row.tournament_id,
                    results: [] 
                });
            }

            groupedMap.get(row.event_id).results.push({
                player_id: row.player_id,
                displayed_name: row.displayed_name,
                position: row.position,
                points: row.points
            });
        });

        const finalPayload = Array.from(groupedMap.values());
        return response.status(200).json(finalPayload);
        
    } catch (error: any) {
        console.error("Event Results Load Error:", error);
        return response.status(500).json({ error: "Failed to load Event Results." });
    }
}
