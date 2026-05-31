import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import sql from '../db.js';
import { escapeHTML } from '../js/utils/helpers.js';
import { validatePassword } from '../js/utils/validatePassword.js';
import bcrypt from 'bcrypt';

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
        const users = await sql`
            SELECT id, password_hash, role, is_active 
            FROM players 
            WHERE id = ${userId}
        `;
        const user = users[0];
        if (user.length === 0) return response.status(404).json({ error: "Nie znaleziono użytkownika." });


        const { old_password, new_password } = request.body;
        if (!new_password || !old_password) return response.status(404).json({ error: "Wypełnij wszystkie wymagane pola." });

        const old_password_hash = user.password_hash;
        const passwordsMatch = await bcrypt.compare(old_password, old_password_hash);
        const passInfo = await validatePassword(new_password);
        
        if (!passwordsMatch) return response.status(401).json({ error: "Niepoprawne hasło." });
        if (new_password === old_password) return response.status(400).json({ error: "Nowe hasło nie może być takie samo jak stare." });
        if (new_password.length < 14) return response.status(400).json({ error: "Hasło musi mieć co najmniej 14 znaków." });
        if (new_password.length > 128) return response.status(400).json({ error: "Hasło musi mieć maksymalnie 128 znaków." });
        if (!passInfo.requirements.notOnList) return response.status(400).json({ error: "Hasło nie może być na liście słabych i wykradzionych haseł." });
        if (!passInfo.requirements.notNumbersOnly) return response.status(400).json({ error: "Hasło nie może składać się wyłącznie z cyfr." });

        const saltRounds = 12;
        const new_hash = await bcrypt.hash(new_password, saltRounds);
        
        await sql`
            UPDATE players 
            SET password_hash = ${new_hash}
            WHERE id = ${userId}
        `;

        return response.status(200).json({ message: "Hasło zostało pomyślnie zaktualizowane." });

    } catch (error) {
        console.error("Change Password Error:", error);
        return response.status(500).json({ error: "Wystąpił błąd podczas zmiany hasła." });
    }
}