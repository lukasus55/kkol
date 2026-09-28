import type { NextApiRequest, NextApiResponse } from 'next';
import type { Player } from '../../types/db';
import sql from '../../db.js';
import { verifySession, revokeAllUserSessions } from '../../lib/auth';
import { validatePassword } from '../../public/js/utils/validatePassword.js';
import bcrypt from 'bcrypt';

interface ChangePasswordRequest extends NextApiRequest {
    body: {
        old_password?: string;
        new_password?: string;
    };
}

/**
 * @swagger
 * /api/change_password:
 *   post:
 *     summary: Change user password
 *     description: Updates the password for the authenticated user and revokes other sessions. Requires current password validation.
 *     tags: [Auth & Player]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - old_password
 *               - new_password
 *             properties:
 *               old_password:
 *                 type: string
 *                 format: password
 *               new_password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password successfully updated
 *       400:
 *         description: Validation failed (length, weak password, missing fields)
 *       401:
 *         description: Not authenticated or incorrect old password
 *       403:
 *         description: Account inactive
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
export default async function handler(request: ChangePasswordRequest, response: NextApiResponse) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const auth = await verifySession(request);
        if (!auth) {
            return response.status(401).json({ error: "Not authenticated" });
        }

        const { old_password, new_password } = request.body || {};
        if (!new_password || !old_password) return response.status(400).json({ error: "Wypełnij wszystkie wymagane pola." });

        const userId = auth.user.id;
        const users = await sql<Pick<Player, 'id' | 'password_hash' | 'role' | 'is_active'>[]>`
            SELECT id, password_hash, role, is_active 
            FROM players 
            WHERE id = ${userId}
        `;
        const user = users[0];
        if (!user) return response.status(404).json({ error: "Nie znaleziono użytkownika." });
        if (!user.is_active) return response.status(403).json({ error: "Konto jest nieaktywne." });

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

        // Optional best practice: revoke all other sessions when password is changed
        await revokeAllUserSessions(userId, auth.session.id).catch(() => {});

        return response.status(200).json({ message: "Hasło zostało pomyślnie zaktualizowane." });

    } catch (error: any) {
        console.error("Change Password Error:", error);
        return response.status(500).json({ error: "Wystąpił błąd podczas zmiany hasła." });
    }
}