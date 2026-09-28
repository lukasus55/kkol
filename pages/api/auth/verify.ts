import type { NextApiRequest, NextApiResponse } from 'next';
import { verifySession } from '../../../lib/auth';

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Weryfikacja sesji dla ekosystemu KKOL (SSO)
 *     description: Endpoint dla zewnętrznych aplikacji do walidacji tokenu sesji i pobrania tożsamości użytkownika.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Sesja jest ważna i aktywna
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: true
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
 *                     is_active:
 *                       type: boolean
 *                 session:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     app_id:
 *                       type: string
 *                     expires_at:
 *                       type: string
 *       401:
 *         description: Sesja jest nieprawidłowa, wygasła lub unieważniona
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *       500:
 *         description: Błąd serwera
 */
export default async function handler(request: NextApiRequest, response: NextApiResponse) {
    if (request.method !== 'GET') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const auth = await verifySession(request);

        if (!auth) {
            return response.status(401).json({ 
                valid: false, 
                error: "Invalid or expired session" 
            });
        }

        return response.status(200).json({
            valid: true,
            user: {
                id: auth.user.id,
                role: auth.user.role,
                displayed_name: auth.user.displayed_name,
                is_active: auth.user.is_active
            },
            session: {
                id: auth.session.id,
                app_id: auth.session.app_id,
                expires_at: auth.session.expires_at
            }
        });
    } catch (error: any) {
        console.error("Auth verification error:", error);
        return response.status(500).json({ error: "Internal server error" });
    }
}
