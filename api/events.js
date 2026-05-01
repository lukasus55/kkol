import sql from '../db.js';

export default async function handler(request, response) {
    if (request.method !== 'GET') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { tournament, player, format, limit, upcoming } = request.query;
        const outputFormat = format || 'calendar';
        const actualLimit = limit ? Math.min(limit, 100) : 100;
        
        // Convert the string parameter to a boolean
        const isUpcoming = upcoming === 'true';
        
        let dbEvents;

        if (tournament) {
            if (isUpcoming) {
                dbEvents = await sql`
                    SELECT id, tournament_id, creator_id, event_date, end_date, name, is_major 
                    FROM events 
                    WHERE tournament_id = ${tournament} AND event_date > NOW()
                    ORDER BY event_date ASC
                    LIMIT ${actualLimit}
                `;
            } else {
                dbEvents = await sql`
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
                dbEvents = await sql`
                    SELECT id, tournament_id, creator_id, event_date, end_date, name, is_major 
                    FROM events 
                    WHERE tournament_id IN (
                        SELECT tournament_id FROM results WHERE player_id = ${player}
                    ) AND event_date > NOW()
                    ORDER BY event_date ASC
                    LIMIT ${actualLimit}
                `;
            } else {
                dbEvents = await sql`
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
                dbEvents = await sql`
                    SELECT id, tournament_id, creator_id, event_date, end_date, name, is_major 
                    FROM events 
                    WHERE event_date > NOW()
                    ORDER BY event_date ASC
                    LIMIT ${actualLimit}
                `;
            } else {
                dbEvents = await sql`
                    SELECT id, tournament_id, creator_id, event_date, end_date, name, is_major 
                    FROM events 
                    ORDER BY event_date DESC
                    LIMIT ${actualLimit}
                `;
            }
        }

        // Format output based on format parameter
        if (outputFormat === 'list') {
            const listEvents = dbEvents.map(event => ({
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

        // Default: Calendar format for FullCalendar
        const calendarEvents = dbEvents.map(event => ({
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

    } catch (error) {
        console.error("Events Fetch Error:", error);
        return response.status(500).json({ error: "Wystąpił błąd podczas pobierania wydarzeń." });
    }
}