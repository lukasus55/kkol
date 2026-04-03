import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export default async function handler(request, response) {
    // Use GET since we are only fetching data, not modifying it yet
    if (request.method !== 'GET') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        // Securely identify the user making the request
        const cookies = parse(request.headers.cookie || '');
        const token = cookies.auth_token;

        if (!token) {
            return response.status(401).json({ error: "Not authenticated" });
        }

        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decodedPayload.id;

        // In a GET request, data is passed in the URL query string (e.g., ?tournamentId=kol2024)
        const { tournamentId } = request.query;

        if (!tournamentId) {
            return response.status(400).json({ error: "Tournament ID is required" });
        }

        const sql = neon(process.env.DATABASE_URL);

        // Is this an owner or manager of this specific tournament?
        const authCheck = await sql`
            SELECT role 
            FROM tournament_organizers 
            WHERE tournament_id = ${tournamentId} AND player_id = ${userId}
        `;

        if (authCheck.length === 0 || (authCheck[0].role !== 'owner' && authCheck[0].role !== 'manager')) {
            return response.status(403).json({ error: "Brak uprawnień do edycji tego turnieju." });
        }

        const membersData = await sql`
            SELECT 
                r.player_id as id,
                p.displayed_name,
                r.attended,
                r.finished,
                r.position,
                r.total_points,
                r.games_positions,
                r.games_points,
                o.role as organizer_role
            FROM results r
            LEFT JOIN players p 
                ON r.player_id = p.id
            LEFT JOIN tournament_organizers o 
                ON r.tournament_id = o.tournament_id AND r.player_id = o.player_id
            WHERE r.tournament_id = ${tournamentId}
            ORDER BY r.position ASC
        `;

        // Send the data back to the frontend popup!
        return response.status(200).json({ 
            tournament_id: tournamentId,
            current_user_role: authCheck[0].role,
            members: membersData 
        });

    } catch (error) {
        console.error("Fetch Tournament Details Error:", error);
        return response.status(500).json({ error: "Failed to load tournament data" });
    }
}