import type { NextApiRequest, NextApiResponse } from 'next';
import sql from '../../db.js';
import { 
    verifySession, 
    revokeSession, 
    revokeAllUserSessions, 
    clearSessionCookie 
} from '../../lib/auth';
import type { Session } from '../../types/db';

export type PublicSessionItem = {
    id: string;
    player_id: string;
    ip_address: string | null;
    device_info: string | null;
    app_id: string;
    created_at: string;
    last_active_at: string;
    expires_at: string;
    is_current: boolean;
};

/**
 * @swagger
 * /api/sessions:
 *   get:
 *     summary: Pobierz aktywne sesje użytkownika
 *     description: Zwraca listę wszystkich aktywnych sesji zalogowanego gracza wraz z oznaczeniem bieżącego urządzenia.
 *     tags: [Account]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista aktywnych sesji
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       player_id:
 *                         type: string
 *                       ip_address:
 *                         type: string
 *                         nullable: true
 *                       device_info:
 *                         type: string
 *                         nullable: true
 *                       app_id:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                       last_active_at:
 *                         type: string
 *                       expires_at:
 *                         type: string
 *                       is_current:
 *                         type: boolean
 *       401:
 *         description: Brak autoryzacji
 *       500:
 *         description: Błąd serwera
 *   delete:
 *     summary: Unieważnij sesję lub sesje
 *     description: Pozwala unieważnić pojedynczą sesję (poprzez parametr `id`) lub wszystkie pozostałe sesje gracza (poprzez `others=true`).
 *     tags: [Account]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: Identyfikator sesji do unieważnienia
 *       - in: query
 *         name: others
 *         schema:
 *           type: boolean
 *         description: Ustawienie na true unieważnia wszystkie sesje poza bieżącą
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               others:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Sesja(e) pomyślnie unieważniona
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 revokedCount:
 *                   type: integer
 *                 message:
 *                   type: string
 *       400:
 *         description: Brakujące lub nieprawidłowe parametry
 *       401:
 *         description: Brak autoryzacji
 *       404:
 *         description: Sesja nie istnieje lub nie należy do użytkownika
 *       500:
 *         description: Błąd serwera
 */
export default async function handler(request: NextApiRequest, response: NextApiResponse) {
    if (request.method === 'GET') {
        try {
            const auth = await verifySession(request);
            if (!auth) {
                return response.status(401).json({ error: "Not authenticated" });
            }

            const sessions = await sql<Pick<Session, 'id' | 'player_id' | 'ip_address' | 'device_info' | 'app_id' | 'created_at' | 'last_active_at' | 'expires_at'>[]>`
                SELECT id, player_id, ip_address, device_info, app_id, created_at, last_active_at, expires_at
                FROM sessions
                WHERE player_id = ${auth.user.id}
                  AND expires_at > CURRENT_TIMESTAMP
                ORDER BY last_active_at DESC
            `;

            const currentSessionId = auth.session.id;

            const sessionList: PublicSessionItem[] = sessions.map(s => ({
                id: s.id,
                player_id: s.player_id,
                ip_address: s.ip_address ?? null,
                device_info: s.device_info ?? null,
                app_id: s.app_id || 'kkol_main',
                created_at: String(s.created_at),
                last_active_at: String(s.last_active_at),
                expires_at: String(s.expires_at),
                is_current: s.id === currentSessionId,
            }));

            return response.status(200).json({ sessions: sessionList });
        } catch (error: any) {
            console.error('Failed to fetch user sessions:', error);
            return response.status(500).json({ error: "Wystąpił błąd podczas pobierania sesji." });
        }
    }

    if (request.method === 'DELETE') {
        try {
            const auth = await verifySession(request);
            if (!auth) {
                return response.status(401).json({ error: "Not authenticated" });
            }

            const id = (request.query.id as string) || request.body?.id;
            const othersParam = request.query.others ?? request.query.all_others ?? request.body?.others ?? request.body?.all_others;
            const revokeOthers = othersParam === true || othersParam === 'true';

            if (!id && !revokeOthers) {
                return response.status(400).json({ error: "Brakujące parametry: podaj id lub others=true." });
            }

            if (revokeOthers) {
                const count = await revokeAllUserSessions(auth.user.id, auth.session.id);
                return response.status(200).json({ 
                    success: true, 
                    revokedCount: count, 
                    message: "Wylogowano ze wszystkich pozostałych urządzeń." 
                });
            }

            const targetId = String(id);
            const revoked = await revokeSession(targetId, auth.user.id);
            if (!revoked) {
                return response.status(404).json({ error: "Sesja nie istnieje lub nie należy do Ciebie." });
            }

            // If user explicitly revoked their current session, also clear the cookie
            if (targetId === auth.session.id) {
                clearSessionCookie(response);
            }

            return response.status(200).json({ 
                success: true, 
                message: "Sesja została unieważniona." 
            });
        } catch (error: any) {
            console.error('Failed to revoke session:', error);
            return response.status(500).json({ error: "Wystąpił błąd podczas usuwania sesji." });
        }
    }

    return response.status(405).json({ error: "Method not allowed" });
}
