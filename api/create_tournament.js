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

        const { tournament_id } = request.body;

        if (!tournament_id || tournament_id.trim() === '') {
            return response.status(400).json({ error: "ID turnieju jest wymagane." });
        }

        const cleanTournamentId = tournament_id.trim();
        const sql = neon(process.env.DATABASE_URL);

        // Only admins and organizers can create tournaments
        const userCheck = await sql`SELECT role FROM players WHERE id = ${requesterId}`;
        if (userCheck.length === 0 || !['admin', 'organizer'].includes(userCheck[0].role)) {
            return response.status(403).json({ error: "Brak uprawnień do tworzenia turniejów." });
        }

        // duplicate check
        const existCheck = await sql`SELECT id FROM tournaments WHERE id = ${cleanTournamentId}`;
        if (existCheck.length > 0) {
            return response.status(400).json({ error: "Turniej o takim ID już istnieje!" });
        }

        await sql`
            INSERT INTO tournaments (id, displayed_name)
            VALUES (${cleanTournamentId}, ${cleanTournamentId})
        `;

        // asign to tournament
        await sql`
            INSERT INTO results (tournament_id, player_id)
            VALUES (${cleanTournamentId}, ${requesterId})
        `;

        // assign owner role
        await sql`
            INSERT INTO tournament_organizers (tournament_id, player_id, role)
            VALUES (${cleanTournamentId}, ${requesterId}, 'owner')
        `;

        return response.status(200).json({ message: "Turniej utworzony." });

    } catch (error) {
        console.error("Create Tournament Error:", error);
        return response.status(500).json({ error: "Wystąpił błąd podczas tworzenia turnieju." });
    }
}