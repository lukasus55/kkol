import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import sql from '../db.js';
import { escapeHTML } from '../js/utils/helpers.js';

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

        const { old_password, new_password, repeated_password } = request.body;

        if (!new_password || new_password.length < 14) {
            return response.status(400).json({ error: "Hasło musi mieć co najmniej 14 znaków." });
        }
        
        if (new_password.length > 128) {
            return response.status(400).json({ error: "Hasło musi mieć maksymalnie 128 znaków." });
        }
        
        const userCheck = await sql`
            SELECT password_hash FROM players WHERE id = ${userId}
        `;

        if (userCheck.length === 0) {
            return response.status(404).json({ error: "Nie znaleziono użytkownika." });
        }

        const current_password = userCheck[0].password_hash;

        // await sql`
        //     UPDATE players 
        //     SET displayed_name = ${cleanName}, last_name_change = NOW() 
        //     WHERE id = ${userId}
        // `;

        return response.status(200).json({ message: "Hasło zostało pomyślnie zaktualizowane." });

    } catch (error) {
        console.error("Change Password Error:", error);
        return response.status(500).json({ error: "Wystąpił błąd podczas zmiany hasła." });
    }
}