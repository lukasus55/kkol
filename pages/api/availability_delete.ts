import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import sql from '../../db.js';

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
 */
export default async function handler(request: NextApiRequest, response: NextApiResponse) {
    if (request.method !== 'DELETE') {
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
