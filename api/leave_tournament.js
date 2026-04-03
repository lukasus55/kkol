// /api/leave_tournament.js
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

        if (!token) {
            return response.status(401).json({ error: "Not authenticated" });
        }

        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decodedPayload.id; // verified ID

        // Grab the tournament ID sent from the popup
        const { tournamentId } = request.body;

        if (!tournamentId) {
            return response.status(400).json({ error: "Tournament ID is required" });
        }
        const sql = neon(process.env.DATABASE_URL);
        
        const tournamentCheck = await sql`
            SELECT tier FROM tournaments WHERE id = ${tournamentId}
        `;

        if (tournamentCheck.length === 0) {
            return response.status(404).json({ error: "Tournament not found" });
        }

        if (tournamentCheck[0].tier === 'S') {
            return response.status(403).json({ error: "Players are not allowed to leave S-Tier tournaments." });
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