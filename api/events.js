import sql from '../db.js';

export default async function handler(request, response) {
    if (request.method !== 'GET') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { tournament, player } = request.query;
        let dbEvents;

        if (tournament) {
            dbEvents = await sql`
                SELECT id, tournament_id, event_date, end_date, name, is_major 
                FROM events 
                WHERE tournament_id = ${tournament}
                ORDER BY event_date ASC
            `;
        } 
        else if (player) {
            dbEvents = await sql`
                SELECT id, tournament_id, event_date, end_date, name, is_major 
                FROM events 
                WHERE tournament_id IN (
                    SELECT tournament_id FROM results WHERE player_id = ${player}
                )
                ORDER BY event_date ASC
            `;
        } 
        else {
            dbEvents = await sql`
                SELECT id, tournament_id, event_date, end_date, name, is_major 
                FROM events 
                ORDER BY event_date ASC
            `;
        }

        // Format it into FullCalendar's exact structure
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
                is_major: event.is_major
            }
        }));

        return response.status(200).json(calendarEvents);

    } catch (error) {
        console.error("Events Fetch Error:", error);
        return response.status(500).json({ error: "Wystąpił błąd podczas pobierania wydarzeń." });
    }
}