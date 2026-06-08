import sql from '../db.js';
import jwt from 'jsonwebtoken';
import { uuidv7 } from "uuidv7";
import { parse } from 'cookie';
import { escapeHTML } from '../js/utils/helpers.js';

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

        const { tournament_id, name } = request.body;

        if (!tournament_id || !name) {
            return response.status(400).json({ error: "Brakujące dane (Nazwa lub Id turnieju)." });
        }

        const clean_name = escapeHTML(name);
        
        if (clean_name.trim().length < 3) {
            return response.status(400).json({ error: "Nazwa ankiety musi mieć co najmniej 3 znaki." });
        }
        
        if (clean_name.trim().length > 70) {
            return response.status(400).json({ error: "Nazwa ankiety może mieć maksymalnie 70 znaków." });
        }

        // tournament VALIDATION
        const tournamentCheck = await sql`
            SELECT finished FROM tournaments WHERE id = ${tournament_id}
        `;

        if (tournamentCheck.length === 0) {
            return response.status(400).json({ error: "Nie możesz dodać ankiety do turnieju, który nie istnieje." });
        }

        if (tournamentCheck[0].finished === true) {
            return response.status(400).json({ error: "Nie możesz dodać ankiety do zakończonego turnieju." });
        }

        // PERMISSION CHECK
        const [globalRoleCheck, tournamentRoleCheck] = await Promise.all([
            sql`SELECT role FROM players WHERE id = ${requesterId}`,
            sql`SELECT role FROM tournament_organizers WHERE tournament_id = ${tournament_id} AND player_id = ${requesterId}`
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

        const id = uuidv7()

        // EXECUTE
        const result = await sql`
            INSERT INTO polls (id, tournament_id, creator_id, name)
            VALUES (${id}, ${tournament_id}, ${requesterId}, ${clean_name})
        `;

        return response.status(200).json({ success: true, id: id });

    } catch (error) {
        console.error("Create Event Error:", error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return response.status(401).json({ error: "Sesja wygasła. Zaloguj się ponownie." });
        }
        return response.status(500).json({ error: "Wystąpił błąd podczas tworzenia wydarzenia." });
    }
}