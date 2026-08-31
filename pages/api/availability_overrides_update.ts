import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import sql from '../../db.js';

/**
 * @swagger
 * /api/availability_overrides_update:
 *   post:
 *     summary: Update availability override
 *     description: Creates or updates an availability exception for a specific date.
 *     tags: [Availability]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Success message
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Not authenticated
 */
export default async function handler(request: NextApiRequest, response: NextApiResponse) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    const cookies = parse(request.headers.cookie || '');
    const token = cookies.auth_token;

    if (!token) {
        return response.status(401).json({ error: "Not authenticated" });
    }

    try {
        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
        const playerId = decodedPayload.id;

        const { id, specific_date, start_time, end_time, status } = request.body;

        if (!specific_date || !start_time || !end_time || !status) {
            return response.status(400).json({ error: "Missing required fields" });
        }

        if (id) {
            // Update existing
            await sql`
                UPDATE availability_overrides
                SET specific_date = ${specific_date}, start_time = ${start_time}, end_time = ${end_time}, status = ${status}
                WHERE id = ${id} AND player_id = ${playerId}
            `;
            return response.status(200).json({ message: "Availability override updated" });
        } else {
            // Insert new
            const newId = crypto.randomUUID();
            await sql`
                INSERT INTO availability_overrides (id, player_id, specific_date, start_time, end_time, status)
                VALUES (${newId}, ${playerId}, ${specific_date}, ${start_time}, ${end_time}, ${status})
            `;
            return response.status(200).json({ message: "Availability override created", id: newId });
        }
    } catch (error: any) {
        console.error("Failed to update availability override:", error.message);
        return response.status(500).json({ error: "Internal server error" });
    }
}
