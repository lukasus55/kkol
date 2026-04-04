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

        const { tournament_id, new_tier } = request.body;

        if (!tournament_id || !['S', 'A', 'B', 'C'].includes(new_tier)) {
            return response.status(400).json({ error: "Nieprawidłowe dane." });
        }

        const sql = neon(process.env.DATABASE_URL);

        const userCheck = await sql`SELECT role FROM players WHERE id = ${requesterId}`;
        if (userCheck.length === 0) return response.status(401).json({ error: "Użytkownik nie istnieje." });
        
        const globalRole = userCheck[0].role; 

        const tournamentCheck = await sql`SELECT tier FROM tournaments WHERE id = ${tournament_id}`;
        if (tournamentCheck.length === 0) {
            return response.status(404).json({ error: "Turniej nie został znaleziony." });
        }
        const currentTier = tournamentCheck[0].tier;


        // Block non-admins from assigning a tournament TO S-Tier
        if (new_tier === 'S' && globalRole !== 'admin') {
            return response.status(403).json({ error: "Tylko administrator może przypisać rangę S-Tier." });
        }

        // Block non-admins from changing a tournament FROM S-Tier
        if (currentTier === 'S' && globalRole !== 'admin') {
            return response.status(403).json({ error: "Tylko administrator może zmienić rangę turnieju o randze S-Tier." });
        }

        // Standard check for A, B, C tiers
        if (['A', 'B', 'C'].includes(new_tier) && globalRole !== 'admin' && globalRole !== 'organizer') {
            return response.status(403).json({ error: "Tylko organizatorzy i administratorzy mogą zmieniać tier." });
        }
        if (globalRole !== 'admin') {
            const authCheck = await sql`
                SELECT role 
                FROM tournament_organizers 
                WHERE tournament_id = ${tournament_id} AND player_id = ${requesterId}
            `;

            if (authCheck.length === 0 || !['owner', 'manager'].includes(authCheck[0].role)) {
                return response.status(403).json({ error: "Brak uprawnień do edycji tego turnieju." });
            }
        }

        await sql`
            UPDATE tournaments 
            SET tier = ${new_tier} 
            WHERE id = ${tournament_id}
        `;

        return response.status(200).json({ message: "Tier został pomyślnie zmieniony." });

    } catch (error) {
        console.error("Change Tier Error:", error);
        return response.status(500).json({ error: "Wystąpił błąd podczas zmiany tieru." });
    }
}