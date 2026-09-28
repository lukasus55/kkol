import type { NextApiRequest, NextApiResponse } from 'next';
import sql from '../../db.js';
import { verifySession } from '../../lib/auth';

/**
 * @swagger
 * /api/availability_delete:
 *   delete:
 *     summary: Delete an availability block
 *     description: Deletes either a default or an override availability block.
 *     tags: [Availability]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Success message
 *       400:
 *         description: Missing or invalid id/type
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Internal server error
 */
export default async function handler(request: NextApiRequest, response: NextApiResponse) {
    if (request.method !== 'DELETE') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const auth = await verifySession(request);
        if (!auth) {
            return response.status(401).json({ error: "Not authenticated" });
        }
        const playerId = auth.user.id;

        const { id, type } = request.query;

        if (!id || !type || (type !== 'default' && type !== 'override')) {
            return response.status(400).json({ error: "Missing or invalid id/type" });
        }

        if (type === 'default') {
            await sql`
                DELETE FROM availability_defaults
                WHERE id = ${id as string} AND player_id = ${playerId}
            `;
        } else {
            await sql`
                DELETE FROM availability_overrides
                WHERE id = ${id as string} AND player_id = ${playerId}
            `;
        }

        return response.status(200).json({ message: "Availability deleted" });
    } catch (error: any) {
        console.error("Failed to delete availability:", error.message);
        return response.status(500).json({ error: "Internal server error" });
    }
}
