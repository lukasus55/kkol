import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import sql from '../../db.js';

/**
 * @swagger
 * /api/availability_defaults_update:
 *   post:
 *     summary: Update default availability
 *     description: Creates or updates a default weekly availability block.
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

        const { id, day_of_week, start_time, end_time, status } = request.body;

        if (day_of_week === undefined || !start_time || !end_time || !status) {
            return response.status(400).json({ error: "Missing required fields" });
        }

        if (id) {
            // Update existing
            await sql`
                UPDATE availability_defaults
                SET day_of_week = ${day_of_week}, start_time = ${start_time}, end_time = ${end_time}, status = ${status}
                WHERE id = ${id} AND player_id = ${playerId}
            `;
            return response.status(200).json({ message: "Default availability updated" });
        } else {
            // Insert new
            const newId = crypto.randomUUID();
            await sql`
                INSERT INTO availability_defaults (id, player_id, day_of_week, start_time, end_time, status)
                VALUES (${newId}, ${playerId}, ${day_of_week}, ${start_time}, ${end_time}, ${status})
            `;
            return response.status(200).json({ message: "Default availability created", id: newId });
        }
    } catch (error: any) {
        console.error("Failed to update default availability:", error.message);
        return response.status(500).json({ error: "Internal server error" });
    }
}
