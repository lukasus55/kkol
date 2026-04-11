import sql from '../db.js';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

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

        const { id } = request.body;

        if (!id) {
            return response.status(400).json({ error: "Brak ID wydarzenia do usunięcia." });
        }

        // FETCH THE EVENT
        const eventCheck = await sql`SELECT tournament_id FROM events WHERE id = ${id}`;
        
        if (eventCheck.length === 0) {
            return response.status(404).json({ error: "Wydarzenie nie istnieje." });
        }
        
        const eventTournamentId = eventCheck[0].tournament_id;

        // FETCH ROLES
        const [globalRoleCheck, tournamentRoleCheck] = await Promise.all([
            sql`SELECT role FROM players WHERE id = ${requesterId}`,
            sql`SELECT role FROM tournament_organizers WHERE tournament_id = ${eventTournamentId} AND player_id = ${requesterId}`
        ]);

        const globalRole = globalRoleCheck.length > 0 ? globalRoleCheck[0].role : 'user';
        
        // PERMISSION CHECK
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
            return response.status(403).json({ error: "Brak uprawnień do usunięcia tego wydarzenia. Musisz być administratorem lub zarządcą tego turnieju." });
        }

        // EXECUTE
        await sql`DELETE FROM events WHERE id = ${id}`;

        return response.status(200).json({ success: true });

    } catch (error) {
        console.error("Delete Event Error:", error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return response.status(401).json({ error: "Sesja wygasła. Zaloguj się ponownie." });
        }
        return response.status(500).json({ error: "Wystąpił błąd podczas usuwania wydarzenia." });
    }
}