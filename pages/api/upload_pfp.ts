import type { NextApiRequest, NextApiResponse } from 'next';
import type { Player } from '../../types/db';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import sharp from 'sharp';
import sql from '../../db.js';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '5mb',
        },
    },
};

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
 *     description: Uploads and processes a new profile picture (Base64) for the authenticated user. Cooldown is 12 hours.
 *     tags: [Auth & Player]
 *     security:
 *       - cookieAuth: []
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
 *                 description: Base64 encoded image string (e.g. data:image/png;base64,...)
 *     responses:
 *       200:
 *         description: Profile picture updated
 *       400:
 *         description: Missing image
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 *       405:
 *         description: Method not allowed
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
        const cookies = parse(request.headers.cookie || '');
        const token = cookies.auth_token;

        if (!token) return response.status(401).json({ error: "Not authenticated" });

        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET as string) as Pick<Player, 'id'> & { role?: string };
        const userId = decodedPayload.id;

        const { image_base64 } = request.body;

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