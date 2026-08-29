import type { NextApiRequest, NextApiResponse } from 'next';
import type { Player, TournamentOrganizer } from '../../types/db';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import sql from '../../db.js';

interface TournamentDeleteRequest extends NextApiRequest {
    body: {
        tournament_id: string;
    };
}

/**
 * @swagger
 * /api/tournament_delete:
 *   post:
 *     summary: Delete tournament
 *     description: Deletes an existing tournament and all its results. User must be the tournament owner.
 *     tags: [Tournaments]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tournament_id
 *             properties:
 *               tournament_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tournament deleted successfully
 *       400:
 *         description: Missing tournament ID
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Missing permissions
 *       500:
 *         description: Internal server error
 */
export default async function handler(request: TournamentDeleteRequest, response: NextApiResponse) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const cookies = parse(request.headers.cookie || '');
        const token = cookies.auth_token;

        if (!token) return response.status(401).json({ error: "Not authenticated" });

        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET as string) as Pick<Player, 'id'> & { role?: string };
        const requesterId = decodedPayload.id;

        const { tournament_id } = request.body;

        if (!tournament_id) {
            return response.status(400).json({ error: "Brak ID turnieju." });
        }

        const authCheck = await sql<Pick<TournamentOrganizer, 'role'>[]>`
            SELECT role 
            FROM tournament_organizers 
            WHERE tournament_id = ${tournament_id} AND player_id = ${requesterId}
        `;

        if (authCheck.length === 0 || authCheck[0].role !== 'owner') {
            return response.status(403).json({ error: "Tylko właściciel może usunąć turniej." });
        }

        await sql`DELETE FROM results WHERE tournament_id = ${tournament_id}`;
        
        await sql`DELETE FROM tournament_organizers WHERE tournament_id = ${tournament_id}`;
        
        await sql`DELETE FROM tournaments WHERE id = ${tournament_id}`;

        return response.status(200).json({ message: "Turniej został usunięty." });

    } catch (error: any) {
        console.error("Delete Tournament Error:", error);
        return response.status(500).json({ error: "Wystąpił błąd podczas usuwania turnieju." });
    }
}