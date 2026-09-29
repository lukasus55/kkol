import type { NextApiRequest, NextApiResponse } from 'next';
import { verifySession, createSession } from '../../../lib/auth';

interface AuthorizeRequest extends NextApiRequest {
    body: {
        appId?: string;
    };
}

/**
 * @swagger
 * /api/auth/authorize:
 *   post:
 *     summary: Autoryzacja SSO dla aktywnej sesji
 *     description: Wydaje nowy token sesji dla zewnętrznej aplikacji ekosystemu KKOL na podstawie istniejącej autoryzacji użytkownika.
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               appId:
 *                 type: string
 *                 description: Identyfikator aplikacji żądającej autoryzacji
 *     responses:
 *       200:
 *         description: Sukces - wygenerowano token dla aplikacji
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Nowy token sesji dla aplikacji
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     role:
 *                       type: string
 *                       nullable: true
 *                     displayed_name:
 *                       type: string
 *       401:
 *         description: Brak uwierzytelnienia lub nieważna sesja
 *       403:
 *         description: Konto użytkownika jest zablokowane
 *       405:
 *         description: Niedozwolona metoda HTTP
 *       500:
 *         description: Błąd wewnętrzny serwera
 */
export default async function handler(request: AuthorizeRequest, response: NextApiResponse) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const auth = await verifySession(request);

        if (!auth) {
            return response.status(401).json({ error: "Not authenticated" });
        }

        if (auth.user.is_active === false) {
            return response.status(403).json({ error: "This account has been disabled." });
        }

        const { appId } = request.body || {};

        const { token } = await createSession(auth.user.id, request, {
            appId: appId || 'kkol_main',
            role: auth.user.role
        });

        return response.status(200).json({
            token,
            user: {
                id: auth.user.id,
                role: auth.user.role,
                displayed_name: auth.user.displayed_name
            }
        });
    } catch (error: any) {
        console.error("SSO Authorization Error:", error);
        return response.status(500).json({ error: "Internal server error during authorization" });
    }
}
