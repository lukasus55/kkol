import postgres from 'postgres';
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

        const { tournament_id, target_player_id } = request.body;

        if (!tournament_id || !target_player_id) {
            return response.status(400).json({ error: "Invalid payload" });
        }

        const sql = postgres(process.env.DATABASE_URL);

        // Is the requester an owner or manager
        const authCheck = await sql`
            SELECT role 
            FROM tournament_organizers 
            WHERE tournament_id = ${tournament_id} AND player_id = ${requesterId}
        `;

        if (authCheck.length === 0 || !['owner', 'manager'].includes(authCheck[0].role)) {
            return response.status(403).json({ error: "Brak uprawnień do wyrzucania graczy." });
        }

        // Ensure the target is NOT the owner
        const targetCheck = await sql`
            SELECT role 
            FROM tournament_organizers 
            WHERE tournament_id = ${tournament_id} AND player_id = ${target_player_id}
        `;

        if (targetCheck.length > 0 && targetCheck[0].role === 'owner') {
            return response.status(403).json({ error: "Nie można wyrzucić właściciela turnieju." });
        }

        // Note: It's totally fine to run DELETE on organizers even if they aren't a manager; it just won't do anything.
        await sql`
            DELETE FROM tournament_organizers 
            WHERE tournament_id = ${tournament_id} AND player_id = ${target_player_id}
        `;

        await sql`
            DELETE FROM results 
            WHERE tournament_id = ${tournament_id} AND player_id = ${target_player_id}
        `;

        return response.status(200).json({ message: "Gracz został wyrzucony." });

    } catch (error) {
        console.error("Kick Player Error:", error);
        return response.status(500).json({ error: "Wystąpił błąd podczas wyrzucania gracza." });
    }
}