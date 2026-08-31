import type { NextApiRequest, NextApiResponse } from 'next';
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
        // (if blocks is empty and revertToRoutine is false, they are explicitly unavailable all day)
        if (!revertToRoutine && Array.isArray(blocks)) {
            // We need to insert a dummy block if blocks is empty to mark the day as overridden but empty.
            // Wait, if there are no rows in availability_overrides, the frontend will assume routine!
            // Let's insert a special "unavailable" block from 00:00 to 24:00 if they want to clear it?
            // Actually, if a user wants to be completely unavailable, they should add a 00:00-23:59 unavailable block.
            // If they just delete all blocks, maybe they want to be unavailable.
            // Let's just insert whatever they provide.
            for (const block of blocks) {
                if (block.start_time && block.end_time && block.status) {
                    await sql`
                        INSERT INTO availability_overrides (id, player_id, specific_date, start_time, end_time, status)
                        VALUES (gen_random_uuid(), ${playerId}, ${date}, ${block.start_time}, ${block.end_time}, ${block.status})
                    `;
                }
            }
            
            // If blocks was empty, and they didn't revert to routine, we need to signify "override with 0 availability".
            // We can do this by inserting a 00:00 to 00:00 block or similar.
            if (blocks.length === 0) {
                 await sql`
                    INSERT INTO availability_overrides (player_id, specific_date, start_time, end_time, status)
                    VALUES (${playerId}, ${date}, '00:00', '00:00', 'unavailable')
                `;
            }
        }

        return response.status(200).json({ message: "Overrides updated successfully" });
    } catch (error) {
        console.error("Availability bulk overrides update error:", error);
        return response.status(500).json({ error: "Internal server error" });
    }
}
