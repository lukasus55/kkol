import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import sql from '../../db.js';

/**
 * @swagger
 * /api/availability_bulk_defaults:
 *   post:
 *     summary: Bulk update default availability
 *     description: Replaces all default weekly availability blocks for the user.
 *     tags: [Availability]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Success message
 *       401:
 *         description: Not authenticated
 */
export default async function handler(request: NextApiRequest, response: NextApiResponse) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const cookies = parse(request.headers.cookie || '');
        const token = cookies.auth_token;

        if (!token) {
            return response.status(401).json({ error: "Not authenticated" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as { id: string };
        const playerId = decoded.id;

        const { blocks } = request.body;
        if (!Array.isArray(blocks)) {
            return response.status(400).json({ error: "blocks must be an array" });
        }

        // Delete existing defaults
        await sql`DELETE FROM availability_defaults WHERE player_id = ${playerId}`;

        // Insert new blocks
        for (const block of blocks) {
            if (block.day_of_week && block.start_time && block.end_time && block.status) {
                await sql`
                    INSERT INTO availability_defaults (id, player_id, day_of_week, start_time, end_time, status)
                    VALUES (gen_random_uuid(), ${playerId}, ${block.day_of_week}, ${block.start_time}, ${block.end_time}, ${block.status})
                `;
            }
        }

        return response.status(200).json({ message: "Defaults updated successfully" });
    } catch (error) {
        console.error("Availability bulk defaults update error:", error);
        return response.status(500).json({ error: "Internal server error" });
    }
}
