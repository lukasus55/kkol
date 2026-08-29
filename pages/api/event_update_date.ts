import type { NextApiRequest, NextApiResponse } from 'next';
import type { Event, Tournament, Player, TournamentOrganizer } from '../../types/db';
import sql from '../../db.js';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

interface EventUpdateDateRequest extends NextApiRequest {
    body: { 
        event_id: number; 
        event_date: string; 
        end_date?: string; 
    };
}

export default async function handler(request: EventUpdateDateRequest, response: NextApiResponse) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const cookies = parse(request.headers.cookie || '');
        const token = cookies.auth_token;

        if (!token) return response.status(401).json({ error: "Brak autoryzacji." });

        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET as string) as Pick<Player, 'id'> & { role?: string };
        const requesterId = decodedPayload.id;

        const { event_id, event_date, end_date } = request.body || {};

        if (!event_id || !event_date) {
            return response.status(400).json({ error: "Brakujące dane do edycji." });
        }

        const parsedStart = new Date(event_date);
        const minDate = new Date('2024-01-01T00:00:00');
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 500);

        if (isNaN(parsedStart.getTime())) {
            return response.status(400).json({ error: "Nieprawidłowy format daty początkowej." });
        }

        if (parsedStart < minDate || parsedStart > maxDate) {
            return response.status(400).json({ error: "Data wydarzenia musi zawierać się między 2024 rokiem a okresem 500 dni w przód." });
        }

        if (end_date) {
            const parsedEnd = new Date(end_date);
            if (isNaN(parsedEnd.getTime())) {
                return response.status(400).json({ error: "Nieprawidłowy format daty końcowej." });
            }
            if (parsedEnd < minDate || parsedEnd > maxDate) {
                return response.status(400).json({ error: "Data końcowa musi zawierać się między 2024 rokiem a okresem 500 dni w przód." });
            }
            if (parsedEnd < parsedStart) {
                return response.status(400).json({ error: "Data końcowa nie może być wcześniejsza niż data początkowa." });
            }
        }

        const eventCheck = await sql<(Pick<Event, 'tournament_id'> & Pick<Tournament, 'finished'>)[]>`
            SELECT e.tournament_id, t.finished 
            FROM events e
            JOIN tournaments t ON e.tournament_id = t.id
            WHERE e.id = ${event_id}
        `;

        if (eventCheck.length === 0) {
            return response.status(404).json({ error: "Wydarzenie nie istnieje." });
        }

        if (eventCheck[0].finished === true) {
            return response.status(400).json({ error: "Nie możesz edytować wydarzeń w zakończonym turnieju." });
        }

        const eventTournamentId = eventCheck[0].tournament_id;

        const [globalRoleCheck, tournamentRoleCheckQuery] = await Promise.all([
            sql<Pick<Player, 'role'>[]>`SELECT role FROM players WHERE id = ${requesterId}`,
            sql<Pick<TournamentOrganizer, 'role'>[]>`SELECT role FROM tournament_organizers WHERE tournament_id = ${eventTournamentId || null} AND player_id = ${requesterId}`
        ]);

        const globalRole = globalRoleCheck.length > 0 ? globalRoleCheck[0].role : 'user';

        let hasPermission = false;

        if (globalRole === 'admin') {
            hasPermission = true;
        } else if (tournamentRoleCheckQuery.length > 0) {
            const tournamentRole = tournamentRoleCheckQuery[0].role;
            if (tournamentRole && ['owner', 'manager'].includes(tournamentRole)) {
                hasPermission = true;
            }
        }

        if (!hasPermission) {
            return response.status(403).json({ error: "Brak uprawnień. Musisz być administratorem lub zarządcą tego turnieju." });
        }

        await sql`
            UPDATE events 
            SET event_date = ${event_date}, 
                end_date = ${end_date || null}
            WHERE id = ${event_id}
        `;

        return response.status(200).json({ success: true });

    } catch (error: any) {
        console.error("Update Event Date Error:", error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return response.status(401).json({ error: "Sesja wygasła. Zaloguj się ponownie." });
        }
        return response.status(500).json({ error: "Wystąpił błąd podczas edycji daty wydarzenia." });
    }
}