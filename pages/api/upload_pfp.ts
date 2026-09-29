import type { NextApiRequest, NextApiResponse } from 'next';
import type { Player } from '../../types/db';
import sql from '../../db.js';
import sharp from 'sharp';
import { verifySession } from '../../lib/auth';

interface UploadPfpRequest extends NextApiRequest {
    body: {
        image_base64: string;
    };
}

/**
 * @swagger
 * /api/upload_pfp:
 *   post:
 *     summary: Upload profile picture
 *     description: Uploads, resizes (256x256), and converts the user profile image to WebP base64. Cooldown is 12 hours. Verifies server session.
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
 *               - image_base64
 *             properties:
 *               image_base64:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile picture updated
 *       400:
 *         description: Missing image
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 *       429:
 *         description: Cooldown active
 *       500:
 *         description: Internal server error
 */
export default async function handler(request: UploadPfpRequest, response: NextApiResponse) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const auth = await verifySession(request);
        if (!auth) {
            return response.status(401).json({ error: "Not authenticated" });
        }

        const userId = auth.user.id;
        const { image_base64 } = request.body || {};

        if (!image_base64) {
            return response.status(400).json({ error: "Brak pliku obrazu." });
        }

        const userCheck = await sql<Pick<Player, 'last_pfp_change'>[]>`SELECT last_pfp_change FROM players WHERE id = ${userId}`;
        if (userCheck.length === 0) return response.status(404).json({ error: "Użytkownik nie istnieje." });

        const lastChange = userCheck[0].last_pfp_change;

        if (lastChange) {
            const twelveHoursInMs = 12 * 60 * 60 * 1000;
            const timeSinceLastChange = Date.now() - new Date(lastChange).getTime();

            if (timeSinceLastChange < twelveHoursInMs) {
                const remainingMs = twelveHoursInMs - timeSinceLastChange;
                const remainingHours = Math.floor(remainingMs / (60 * 60 * 1000));
                const remainingMinutes = Math.ceil((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
                
                return response.status(429).json({ 
                    error: `Musisz odczekać jeszcze ${remainingHours}h ${remainingMinutes}m przed kolejną zmianą zdjęcia.` 
                });
            }
        }

        const base64Data = image_base64.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');

        const processedBuffer = await sharp(imageBuffer)
            .resize(256, 256, { fit: 'cover' })
            .webp({ quality: 80 })
            .toBuffer();

        const finalBase64 = processedBuffer.toString('base64');

        await sql`
            UPDATE players 
            SET last_pfp_change = NOW(), pfp_base64 = ${finalBase64} 
            WHERE id = ${userId}
        `;

        return response.status(200).json({ message: "Zdjęcie profilowe zaktualizowane." });

    } catch (error: any) {
        console.error("PFP Upload Error:", error);
        return response.status(500).json({ error: "Wystąpił błąd podczas zapisywania zdjęcia." });
    }
}