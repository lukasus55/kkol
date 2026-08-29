import type { NextApiRequest, NextApiResponse } from 'next';
import type { Event, Player } from '../../types/db';
import sql from '../../db.js';

interface EventsRequest extends NextApiRequest {
    query: { 
        tournament?: string; 
        player?: string; 
        format?: string; 
        limit?: string; 
        upcoming?: string; 
    };
}

type EventRow = Pick<Event, 'id' | 'tournament_id' | 'creator_id' | 'event_date' | 'end_date' | 'name' | 'is_major'>;

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: List events
 *     description: Retrieves a list of events. Can be formatted for fullcalendar or as a standard list.
 *     tags: [Events]
 *     parameters:
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
 *         name: format
 *         schema:
 *           type: string
 *           enum: ['calendar', 'list']
 *         description: Output format (default 'calendar')
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Max number of events (default 100)
 *       - in: query
 *         name: upcoming
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *         description: Only show future events
 *     responses:
 *       200:
 *         description: Array of events
 *       500:
 *         description: Internal server error
 */
export default async function handler(request: EventsRequest, response: NextApiResponse) {
    if (request.method !== 'GET') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { tournament, player, format, limit, upcoming } = request.query;
        const outputFormat = format || 'calendar';
        const actualLimit = limit ? Math.min(Number(limit), 100) : 100;
        
        const isUpcoming = upcoming === 'true';
        
        let dbEvents: EventRow[];

        if (tournament) {
            if (isUpcoming) {
                dbEvents = await sql<EventRow[]>`
                    SELECT id, tournament_id, creator_id, event_date, end_date, name, is_major 
                    FROM events 
                    WHERE tournament_id = ${tournament} AND event_date > NOW()
                    ORDER BY event_date ASC
                    LIMIT ${actualLimit}
                `;
            } else {
                dbEvents = await sql<EventRow[]>`
                    SELECT id, tournament_id, creator_id, event_date, end_date, name, is_major 
                    FROM events 
                    WHERE tournament_id = ${tournament}
                    ORDER BY event_date DESC
                    LIMIT ${actualLimit}
                `;
            }
        } 
        else if (player) {
            if (isUpcoming) {
                dbEvents = await sql<EventRow[]>`
                    SELECT id, tournament_id, creator_id, event_date, end_date, name, is_major 
                    FROM events 
                    WHERE tournament_id IN (
                        SELECT tournament_id FROM results WHERE player_id = ${player}
                    ) AND event_date > NOW()
                    ORDER BY event_date ASC
                    LIMIT ${actualLimit}
                `;
            } else {
                dbEvents = await sql<EventRow[]>`
                    SELECT id, tournament_id, creator_id, event_date, end_date, name, is_major 
                    FROM events 
                    WHERE tournament_id IN (
                        SELECT tournament_id FROM results WHERE player_id = ${player}
                    )
                    ORDER BY event_date DESC
                    LIMIT ${actualLimit}
                `;
            }
        } 
        else {
            if (isUpcoming) {
                dbEvents = await sql<EventRow[]>`
                    SELECT id, tournament_id, creator_id, event_date, end_date, name, is_major 
                    FROM events 
                    WHERE event_date > NOW()
                    ORDER BY event_date ASC
                    LIMIT ${actualLimit}
                `;
            } else {
                dbEvents = await sql<EventRow[]>`
                    SELECT id, tournament_id, creator_id, event_date, end_date, name, is_major 
                    FROM events 
                    ORDER BY event_date DESC
                    LIMIT ${actualLimit}
                `;
            }
        }

        if (outputFormat === 'list') {
            const listEvents = dbEvents.map((event: EventRow) => ({
                id: event.id,
                tournament_id: event.tournament_id,
                creator_id: event.creator_id,
                event_date: event.event_date,
                end_date: event.end_date,
                name: event.name,
                is_major: event.is_major
            }));

            return response.status(200).json(listEvents);
        }

        const calendarEvents = dbEvents.map((event: EventRow) => ({
            id: event.id,
            title: event.name,
            start: event.event_date,
            end: event.end_date || null,
            
            backgroundColor: event.is_major ? 'var(--color-lime-moss)' : 'var(--color-dark-green)',
            borderColor: event.is_major ? 'var(--color-lime-moss)' : 'var(--color-dark-green)',
            textColor: 'var(--color-lavender-mist)',
            
            extendedProps: {
                tournament_id: event.tournament_id,
                creator_id: event.creator_id,
                is_major: event.is_major
            }
        }));

        return response.status(200).json(calendarEvents);

    } catch (error: any) {
        console.error("Events Fetch Error:", error);
        return response.status(500).json({ error: "Wystąpił błąd podczas pobierania wydarzeń." });
    }
}