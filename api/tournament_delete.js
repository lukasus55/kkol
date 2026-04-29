import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import sql from '../db.js';

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

        if (!tournament_id) {
            return response.status(400).json({ error: "Brak ID turnieju." });
        }

        

        // Is the requester owner of this tournament
        const authCheck = await sql`
            SELECT role 
            FROM tournament_organizers 
            WHERE tournament_id = ${tournament_id} AND player_id = ${requesterId}
        `;

        if (authCheck.length === 0 || authCheck[0].role !== 'owner') {
            return response.status(403).json({ error: "Tylko właściciel może usunąć turniej." });
        }

        // Remove all results
        await sql`DELETE FROM results WHERE tournament_id = ${tournament_id}`;
        
        // Remove all organizers
        await sql`DELETE FROM tournament_organizers WHERE tournament_id = ${tournament_id}`;
        
        // Delete the actual tournament
        await sql`DELETE FROM tournaments WHERE id = ${tournament_id}`;

        return response.status(200).json({ message: "Turniej został usunięty." });

    } catch (error) {
        console.error("Delete Tournament Error:", error);
        return response.status(500).json({ error: "Wystąpił błąd podczas usuwania turnieju." });
    }
}