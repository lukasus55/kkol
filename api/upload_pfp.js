import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Disable default body parser limit if images are slightly larger
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '5mb',
        },
    },
};

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

        const { image_base64 } = request.body;

        if (!image_base64) {
            return response.status(400).json({ error: "Brak pliku obrazu." });
        }

        const sql = neon(process.env.DATABASE_URL);

        // cooldown check - 12 Hours
        const userCheck = await sql`SELECT last_pfp_change FROM players WHERE id = ${userId}`;
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

        // Strip the data URL prefix (e.g., "data:image/png;base64,") to get raw base64.
        const base64Data = image_base64.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // Ensure the directory exists just in case
        const dirPath = path.join(process.cwd(), 'img', 'players', 'pfp');
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        const filePath = path.join(dirPath, `${userId}.webp`);

        // Sharp converts ANY supported image (jpg, png, gif) into a compressed webp
        await sharp(imageBuffer)
            .resize(256, 256, { fit: 'cover' }) // Force a perfect square!
            .webp({ quality: 80 })
            .toFile(filePath);

        await sql`
            UPDATE players 
            SET last_pfp_change = NOW() 
            WHERE id = ${userId}
        `;

        return response.status(200).json({ message: "Zdjęcie profilowe zaktualizowane." });

    } catch (error) {
        console.error("PFP Upload Error:", error);
        return response.status(500).json({ error: "Wystąpił błąd podczas zapisywania zdjęcia." });
    }
}