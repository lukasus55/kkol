import postgres from 'postgres';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import sharp from 'sharp';

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

        const sql = postgres(process.env.DATABASE_URL);

        // Cooldown check
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

        // Strip the frontend prefix
        const base64Data = image_base64.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');

        const processedBuffer = await sharp(imageBuffer)
            .resize(256, 256, { fit: 'cover' })
            .webp({ quality: 80 })
            .toBuffer();

        // Convert the compressed WebP buffer back to a Base64 string for the database
        const finalBase64 = processedBuffer.toString('base64');

        await sql`
            UPDATE players 
            SET last_pfp_change = NOW(), pfp_base64 = ${finalBase64} 
            WHERE id = ${userId}
        `;

        return response.status(200).json({ message: "Zdjęcie profilowe zaktualizowane." });

    } catch (error) {
        console.error("PFP Upload Error:", error);
        return response.status(500).json({ error: "Wystąpił błąd podczas zapisywania zdjęcia." });
    }
}