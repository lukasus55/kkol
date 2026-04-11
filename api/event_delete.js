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

        const { id } = request.body;

        if (!id) {
            return response.status(400).json({ error: "Brak ID wydarzenia do usunięcia." });
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

        if (userRole !== 'admin' && requesterId !== eventCreatorId) {
            return response.status(403).json({ error: "Możesz usunąć tylko własne wydarzenia." });
        }

        await sql`DELETE FROM events WHERE id = ${id}`;

        return response.status(200).json({ success: true });

    } catch (error) {
        console.error("Delete Event Error:", error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return response.status(401).json({ error: "Sesja wygasła. Zaloguj się ponownie." });
        }
        return response.status(500).json({ error: "Wystąpił błąd podczas usuwania wydarzenia." });
    }
}