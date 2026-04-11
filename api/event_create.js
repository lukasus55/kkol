import sql from '../db.js';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const cookies = parse(request.headers.cookie || '');
        const token = cookies.auth_token;

        if (!token) return response.status(401).json({ error: "Brak autoryzacji." });

        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
        const requesterId = decodedPayload.id;
        const userCheck = await sql`SELECT role FROM players WHERE id = ${requesterId}`;
        if (userCheck.length === 0 || !['admin', 'organizer'].includes(userCheck[0].role)) {
            return response.status(403).json({ error: "Brak uprawnień do tworzenia wydarzeń." });
        }

        const { tournament_id, name, is_major, start_date, end_date } = request.body;

        if (!tournament_id || !name || !start_date) {
            return response.status(400).json({ error: "Brakujące dane (Turniej, Nazwa lub Data)." });
        }

        // If they are not an admin, verify they are actually participating in this specific tournament
        if (decodedPayload.role !== 'admin') {
            const tournamentParticipationCheck = await sql`
                SELECT 1 FROM results 
                WHERE tournament_id = ${tournament_id} AND player_id = ${requesterId}
            `;
            
            if (tournamentParticipationCheck.length === 0) {
                return response.status(403).json({ error: "Nie możesz dodać wydarzenia do turnieju, w którym nie uczestniczysz." });
            }
        }

        const tournamentExistingCheck = await sql`
            SELECT 1 FROM tournaments WHERE id = ${tournament_id}
        `;

        if (tournamentExistingCheck.length === 0) {
            return response.status(400).json({ error: "Nie możesz dodać wydarzenia do turnieju który nie istnieje." });
        }

        const result = await sql`
            INSERT INTO events (tournament_id, creator_id, event_date, end_date, name, is_major)
            VALUES (${tournament_id}, ${requesterId}, ${start_date}, ${end_date || null}, ${name}, ${is_major})
            RETURNING id
        `;

        return response.status(200).json({ success: true, id: result[0].id });

    } catch (error) {
        console.error("Create Event Error:", error);
        return response.status(500).json({ error: "Wystąpił błąd podczas tworzenia wydarzenia." });
    }
}