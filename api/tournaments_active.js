import sql from '../db.js';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export default async function handler(request, response) {
    if (request.method !== 'GET') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { limit } = request.query;
        const actualLimit = limit ? Math.min(limit, 100) : 100;

        const cookies = parse(request.headers.cookie || '');
        const token = cookies.auth_token;

        if (!token) return response.status(401).json({ error: "Brak autoryzacji." });

        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
        const requesterId = decodedPayload.id;

        // Check global role
        const userCheck = await sql`SELECT role FROM players WHERE id = ${requesterId}`;
        const globalRole = userCheck.length > 0 ? userCheck[0].role : 'user';

        let activeTournaments;

        if (globalRole === 'admin') {
            // Admins get ALL unfinished tournaments
            activeTournaments = await sql`
                SELECT id, displayed_name 
                FROM tournaments 
                WHERE finished = false OR finished IS NULL
                ORDER BY displayed_name ASC
                LIMIT ${actualLimit}
            `;
        } else {
            // Organizers/Managers only get unfinished tournaments they are explicitly assigned to
            activeTournaments = await sql`
                SELECT t.id, t.displayed_name 
                FROM tournaments t
                INNER JOIN tournament_organizers o ON t.id = o.tournament_id
                WHERE o.player_id = ${requesterId} 
                    AND o.role IN ('owner', 'manager', 'organizer')
                    AND (t.finished = false OR t.finished IS NULL)
                ORDER BY t.displayed_name ASC
                LIMIT ${actualLimit}
            `;
        }

        return response.status(200).json(activeTournaments);

    } catch (error) {
        console.error("Fetch Active Tournaments Error:", error);
        return response.status(500).json({ error: "Nie udało się pobrać listy turniejów." });
    }
}