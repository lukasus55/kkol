import sql from '../db.js';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import { escapeHTML } from '../js/helpers.js';

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        // AUTHENTICATION
        const cookies = parse(request.headers.cookie || '');
        const token = cookies.auth_token;

        if (!token) return response.status(401).json({ error: "Brak autoryzacji." });

        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
        const requesterId = decodedPayload.id;

        const { id, name, is_major, start_date, end_date } = request.body || {};

        if (!id || !name || !start_date) {
            return response.status(400).json({ error: "Brakujące dane do edycji." });
        }

        const clean_name = escapeHTML(name);

        if (clean_name.trim().length < 3) {
            return response.status(400).json({ error: "Nazwa wydarzenia musi mieć co najmniej 3 znaki." });
        }
        
        if (clean_name.trim().length > 70) {
            return response.status(400).json({ error: "Nazwa wydarzenia może mieć maksymalnie 70 znaków." });
        }

        // DATE VALIDATION
        const parsedStart = new Date(start_date);
        const minDate = new Date('2024-01-01T00:00:00');
        
        // Calculate max date: exactly 500 days from this exact moment
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

        const eventCheck = await sql`
            SELECT e.tournament_id, t.finished 
            FROM events e
            JOIN tournaments t ON e.tournament_id = t.id
            WHERE e.id = ${id}
        `;

        if (eventCheck.length === 0) {
            return response.status(404).json({ error: "Wydarzenie nie istnieje." });
        }

        if (eventCheck[0].finished === true) {
            return response.status(400).json({ error: "Nie możesz edytować wydarzeń w zakończonym turnieju." });
        }

        const eventTournamentId = eventCheck[0].tournament_id;

        // PERMISSION CHECK
        const [globalRoleCheck, tournamentRoleCheck] = await Promise.all([
            sql`SELECT role FROM players WHERE id = ${requesterId}`,
            sql`SELECT role FROM tournament_organizers WHERE tournament_id = ${eventTournamentId} AND player_id = ${requesterId}`
        ]);

        const globalRole = globalRoleCheck.length > 0 ? globalRoleCheck[0].role : 'user';

        let hasPermission = false;

        if (globalRole === 'admin') {
            hasPermission = true;
        } else if (tournamentRoleCheck.length > 0) {
            const tournamentRole = tournamentRoleCheck[0].role;
            if (['owner', 'manager'].includes(tournamentRole)) {
                hasPermission = true;
            }
        }

        if (!hasPermission) {
            return response.status(403).json({ error: "Brak uprawnień. Musisz być administratorem lub zarządcą tego turnieju." });
        }

        // EXECUTE
        await sql`
            UPDATE events 
            SET name = ${clean_name}, 
                is_major = ${is_major}, 
                event_date = ${start_date}, 
                end_date = ${end_date || null}
            WHERE id = ${id}
        `;

        return response.status(200).json({ success: true });

    } catch (error) {
        console.error("Update Event Error:", error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return response.status(401).json({ error: "Sesja wygasła. Zaloguj się ponownie." });
        }
        return response.status(500).json({ error: "Wystąpił błąd podczas edycji wydarzenia." });
    }
}