import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const cookies = parse(request.headers.cookie || '');
        const token = cookies.auth_token;

        if (!token) return response.status(401).json({ error: "Not authenticated" });

        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
        const requesterId = decodedPayload.id;

        const { tournament_id, new_player_id } = request.body;

        if (!tournament_id || !new_player_id || new_player_id.trim() === '') {
            return response.status(400).json({ error: "Musisz podać ID gracza." });
        }

        const cleanPlayerId = new_player_id.trim();
        const sql = neon(process.env.DATABASE_URL);

        // Is the requester an owner or manager
        const authCheck = await sql`
            SELECT role 
            FROM tournament_organizers 
            WHERE tournament_id = ${tournament_id} AND player_id = ${requesterId}
        `;

        if (authCheck.length === 0 || !['owner', 'manager'].includes(authCheck[0].role)) {
            return response.status(403).json({ error: "Brak uprawnień do dodawania graczy." });
        }

        // Existance check
        const playerCheck = await sql`
            SELECT id FROM players WHERE id = ${cleanPlayerId}
        `;

        if (playerCheck.length === 0) {
            return response.status(404).json({ error: `Gracz o ID "${cleanPlayerId}" nie istnieje.` });
        }

        // Duplicate check
        const duplicateCheck = await sql`
            SELECT player_id FROM results 
            WHERE tournament_id = ${tournament_id} AND player_id = ${cleanPlayerId}
        `;

        if (duplicateCheck.length > 0) {
            return response.status(400).json({ error: "Ten gracz jest już zapisany do tego turnieju." });
        }

        await sql`
            INSERT INTO results (tournament_id, player_id)
            VALUES (${tournament_id}, ${cleanPlayerId})
        `;

        return response.status(200).json({ message: "Gracz został dodany." });

    } catch (error) {
        console.error("Add Player Error:", error);
        return response.status(500).json({ error: "Wystąpił błąd podczas dodawania gracza." });
    }
}