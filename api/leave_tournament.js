import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        // identify the user
        const cookies = parse(request.headers.cookie || '');
        const token = cookies.auth_token;

        if (!token) {
            return response.status(401).json({ error: "Not authenticated" });
        }

        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decodedPayload.id;

        const { tournamentId } = request.body;

        if (!tournamentId) {
            return response.status(400).json({ error: "Tournament ID is required" });
        }

        const sql = neon(process.env.DATABASE_URL);

        const checkData = await sql`
            SELECT t.tier, o.role
            FROM tournaments t
            LEFT JOIN tournament_organizers o 
            ON t.id = o.tournament_id AND o.player_id = ${userId}
            WHERE t.id = ${tournamentId}
        `;

        // If the tournament doesn't exist, stop
        if (checkData.length === 0) {
            return response.status(404).json({ error: "Tournament not found" });
        }

        const tournamentTier = checkData[0].tier;
        const userRole = checkData[0].role;

        // Block 1: S-Tier tournaments
        if (tournamentTier === 'S') {
            return response.status(403).json({ error: "Players are not allowed to leave S-Tier tournaments." });
        }

        // Block 2: Tournament Owners
        if (userRole === 'owner') {
            return response.status(403).json({ error: "The owner cannot leave the tournament. You must delete it instead." });
        }

        await sql`
            UPDATE results 
            SET attended = false 
            WHERE tournament_id = ${tournamentId} AND player_id = ${userId}
        `;

        return response.status(200).json({ message: "Successfully left the tournament" });

    } catch (error) {
        console.error("Leave Tournament Error:", error);
        return response.status(500).json({ error: "Failed to leave tournament" });
    }
}