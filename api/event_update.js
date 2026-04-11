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

        const { id, tournament_id, name, is_major, start_date, end_date } = request.body;

        if (!id || !tournament_id || !name || !start_date) {
            return response.status(400).json({ error: "Brakujące dane do edycji." });
        }

        const [userCheck, eventCheck] = await Promise.all([
            sql`SELECT role FROM players WHERE id = ${requesterId}`,
            sql`SELECT creator_id FROM events WHERE id = ${id}`
        ]);

        if (eventCheck.length === 0) {
            return response.status(404).json({ error: "Wydarzenie nie istnieje." });
        }

        const userRole = userCheck.length > 0 ? userCheck[0].role : 'user';
        const eventCreatorId = eventCheck[0].creator_id;

        // Only allow if they are an admin, OR if they are the original creator
        if (userRole !== 'admin' && requesterId !== eventCreatorId) {
            return response.status(403).json({ error: "Możesz edytować tylko własne wydarzenia." });
        }

        await sql`
            UPDATE events 
            SET name = ${name}, 
                is_major = ${is_major}, 
                event_date = ${start_date}, 
                end_date = ${end_date || null}
            WHERE id = ${id}
        `;

        return response.status(200).json({ success: true });

    } catch (error) {
        console.error("Update Event Error:", error);
        return response.status(500).json({ error: "Wystąpił błąd podczas edycji wydarzenia." });
    }
}