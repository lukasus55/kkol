import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import sql from '../../db.js';

/**
 * @swagger
 * /api/availability_bulk_overrides:
 *   post:
 *     summary: Bulk update overrides for a specific date
 *     description: Replaces all availability overrides for the user on a specific date. If blocks is empty, it means the user is explicitly setting 0 availability for that day (unlike reverting to routine, which requires DELETE).
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

        const { date, blocks, revertToRoutine } = request.body;

        if (!date) {
            return response.status(400).json({ error: "date is required" });
        }

        // Always delete existing overrides for this date
        await sql`DELETE FROM availability_overrides WHERE player_id = ${playerId} AND specific_date = ${date}`;

        // If not reverting to routine, insert the provided blocks
        if (!revertToRoutine && Array.isArray(blocks)) {
            for (const block of blocks) {
                if (block.start_time && block.end_time && block.status) {
                    const newId = crypto.randomUUID();
                    await sql`
                        INSERT INTO availability_overrides (id, player_id, specific_date, start_time, end_time, status)
                        VALUES (${newId}, ${playerId}, ${date}, ${block.start_time}, ${block.end_time}, ${block.status})
                    `;
                }
            }
            
            // If blocks was empty, signify "override with 0 availability".
            if (blocks.length === 0) {
                 const emptyId = crypto.randomUUID();
                 await sql`
                    INSERT INTO availability_overrides (id, player_id, specific_date, start_time, end_time, status)
                    VALUES (${emptyId}, ${playerId}, ${date}, '00:00', '00:00', 'unavailable')
                `;
            }
        }

        return response.status(200).json({ message: "Overrides updated successfully" });
    } catch (error) {
        console.error("Availability bulk overrides update error:", error);
        return response.status(500).json({ error: "Internal server error" });
    }
}
