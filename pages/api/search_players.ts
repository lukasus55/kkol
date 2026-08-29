import type { NextApiRequest, NextApiResponse } from 'next';
import type { Player } from '../../types/db';
import sql from '../../db.js';

interface SearchPlayersRequest extends NextApiRequest {
    query: {
        q?: string;
    };
}

/**
 * @swagger
 * /api/search_players:
 *   get:
 *     summary: Search for players
 *     description: Searches players by displayed name or ID using text similarity matching. Returns up to 5 results.
 *     tags: [Auth & Player]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Search query
 *     responses:
 *       200:
 *         description: Array of matched players
 *       405:
 *         description: Method not allowed
 *       500:
 *         description: Internal server error
 */
export default async function handler(request: SearchPlayersRequest, response: NextApiResponse) {
    if (request.method !== 'GET') {
        return response.status(405).json({ error: "Method not allowed." });
    }

    try {
        const q = typeof request.query.q === "string" ? request.query.q : "";

        if (!q || q.trim().length < 1) {
            return response.status(200).json([]);
        }

        const searchQuery = q.trim();

        const players = await sql<Pick<Player, 'id' | 'displayed_name' | 'pfp_base64'>[]>`
            SELECT id, displayed_name, pfp_base64
            FROM players
            WHERE displayed_name % ${searchQuery} 
                OR id % ${searchQuery} 
                OR displayed_name ILIKE ${'%' + searchQuery + '%'}
                OR id ILIKE ${'%' + searchQuery + '%'}
            ORDER BY GREATEST(
                similarity(displayed_name, ${searchQuery}), 
                similarity(id, ${searchQuery})
            ) DESC
            LIMIT 5;
        `;

        return response.status(200).json(players);

    } catch (error: any) {
        console.error("Search API Error:", error);
        return response.status(500).json({ error: "Failed to search players." });
    }
}
