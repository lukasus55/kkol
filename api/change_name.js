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
        const userId = decodedPayload.id;

        const { new_name } = request.body;

        if (!new_name || new_name.trim().length < 3) {
            return response.status(400).json({ error: "Nazwa musi mieć co najmniej 3 znaki." });
        }
        
        if (new_name.trim().length > 30) {
            return response.status(400).json({ error: "Nazwa może mieć maksymalnie 30 znaków." });
        }

        const cleanName = new_name.trim();
        const sql = neon(process.env.DATABASE_URL);

        const userCheck = await sql`
            SELECT last_name_change FROM players WHERE id = ${userId}
        `;

        if (userCheck.length === 0) {
            return response.status(404).json({ error: "Nie znaleziono użytkownika." });
        }

        const lastChange = userCheck[0].last_name_change;

        // cooldown - 2 hours
        if (lastChange) {
            const twoHoursInMs = 2 * 60 * 60 * 1000;
            const timeSinceLastChange = Date.now() - new Date(lastChange).getTime();

            if (timeSinceLastChange < twoHoursInMs) {
                const remainingMs = twoHoursInMs - timeSinceLastChange;
                const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
                
                return response.status(429).json({ 
                    error: `Musisz odczekać jeszcze ${remainingMinutes} minut przed kolejną zmianą nazwy.` 
                });
            }
        }

        await sql`
            UPDATE players 
            SET displayed_name = ${cleanName}, last_name_change = NOW() 
            WHERE id = ${userId}
        `;

        return response.status(200).json({ message: "Nazwa została zaktualizowana." });

    } catch (error) {
        console.error("Change Name Error:", error);
        return response.status(500).json({ error: "Wystąpił błąd podczas zmiany nazwy." });
    }
}