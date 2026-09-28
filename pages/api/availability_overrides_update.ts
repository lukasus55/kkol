import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import sql from '../../db.js';
import { verifySession } from '../../lib/auth';

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
 *       500:
 *         description: Internal server error
 */
export default async function handler(request: NextApiRequest, response: NextApiResponse) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const auth = await verifySession(request);
        if (!auth) {
            return response.status(401).json({ error: "Not authenticated" });
        }
        const playerId = auth.user.id;

        const { id, specific_date, start_time, end_time, status } = request.body || {};

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
