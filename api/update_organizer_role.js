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

        const { tournament_id, target_player_id, action } = request.body;

        if (!tournament_id || !target_player_id || !['promote', 'demote'].includes(action)) {
            return response.status(400).json({ error: "Invalid payload" });
        }

        const sql = neon(process.env.DATABASE_URL);

        // SECURITY CHECK: Is the requester the actual OWNER?
        const authCheck = await sql`
            SELECT role 
            FROM tournament_organizers 
            WHERE tournament_id = ${tournament_id} AND player_id = ${requesterId}
        `;

        if (authCheck.length === 0 || authCheck[0].role !== 'owner') {
            return response.status(403).json({ error: "Tylko właściciel turnieju może zarządzać uprawnieniami." });
        }

        // EXECUTE ACTION
        if (action === 'promote') {
            // Add them as a manager (ON CONFLICT prevents crashing if they somehow already are one)
            await sql`
                INSERT INTO tournament_organizers (tournament_id, player_id, role)
                VALUES (${tournament_id}, ${target_player_id}, 'manager')
                ON CONFLICT (tournament_id, player_id) DO UPDATE SET role = 'manager'
            `;
        } else if (action === 'demote') {
            // Demoting just means deleting their row from the organizers table
            await sql`
                DELETE FROM tournament_organizers 
                WHERE tournament_id = ${tournament_id} AND player_id = ${target_player_id} AND role = 'manager'
            `;
        }

        return response.status(200).json({ message: "Uprawnienia zostały zaktualizowane." });

    } catch (error) {
        console.error("Role Update Error:", error);
        return response.status(500).json({ error: "Wystąpił błąd podczas zmiany uprawnień." });
    }
}