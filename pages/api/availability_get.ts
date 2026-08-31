import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import sql from '../../db.js';
import type { AvailabilityDefault, AvailabilityOverride } from '../../types/db';

/**
 * @swagger
 * /api/availability_get:
 *   get:
 *     summary: Get own availability
 *     description: Retrieves default and overridden availability for the authenticated user.
 *     tags: [Availability]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User availability data
 *       401:
 *         description: Not authenticated
 */
export default async function handler(request: NextApiRequest, response: NextApiResponse) {
    if (request.method !== 'GET') {
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

        const defaults = await sql<AvailabilityDefault[]>`
            SELECT id, player_id, day_of_week, start_time, end_time, status
            FROM availability_defaults
            WHERE player_id = ${playerId}
        `;

        const overrides = await sql<AvailabilityOverride[]>`
            SELECT id, player_id, specific_date, start_time, end_time, status
            FROM availability_overrides
            WHERE player_id = ${playerId}
        `;

        return response.status(200).json({ defaults, overrides });
    } catch (error: any) {
        console.error("Failed to fetch availability:", error.message);
        return response.status(500).json({ error: "Internal server error" });
    }
}
