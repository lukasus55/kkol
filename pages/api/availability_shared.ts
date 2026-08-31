import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import sql from '../../db.js';
import type { AvailabilityDefault, AvailabilityOverride } from '../../types/db';

/**
 * @swagger
 * /api/availability_shared:
 *   get:
 *     summary: Get shared availability
 *     description: Retrieves the availability of all players who share an active, unfinished tournament with the authenticated user.
 *     tags: [Availability]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Shared availability data
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

        // Find friends (players sharing an active tournament)
        const friends = await sql<{id: string, displayed_name: string, pfp_base64: string}[]>`
            SELECT DISTINCT p.id, p.displayed_name, p.pfp_base64
            FROM players p
            JOIN results r1 ON p.id = r1.player_id
            JOIN tournaments t ON r1.tournament_id = t.id
            WHERE t.finished = false
              AND p.id != ${playerId}
              AND t.id IN (
                  SELECT tournament_id FROM results WHERE player_id = ${playerId}
              )
        `;

        if (friends.length === 0) {
            return response.status(200).json({ friends: [], defaults: [], overrides: [] });
        }

        const friendIds = friends.map(f => f.id);

        const defaults = await sql<AvailabilityDefault[]>`
            SELECT id, player_id, day_of_week, start_time, end_time, status
            FROM availability_defaults
            WHERE player_id = ANY(${friendIds})
        `;

        const overrides = await sql<AvailabilityOverride[]>`
            SELECT id, player_id, specific_date, start_time, end_time, status
            FROM availability_overrides
            WHERE player_id = ANY(${friendIds})
        `;

        return response.status(200).json({ friends, defaults, overrides });
    } catch (error: any) {
        console.error("Failed to fetch shared availability:", error.message);
        return response.status(500).json({ error: "Internal server error" });
    }
}
