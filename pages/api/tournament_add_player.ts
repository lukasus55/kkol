import type { NextApiRequest, NextApiResponse } from 'next';
import type { Player, TournamentOrganizer, Result } from '../../types/db';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import sql from '../../db.js';

interface TournamentAddPlayerRequest extends NextApiRequest {
    body: {
        tournament_id: string;
        new_player_id: string;
    };
}

/**
 * @swagger
 * /api/tournament_add_player:
 *   post:
 *     summary: Add player to tournament
 *     description: Enrolls a player in a tournament. User must be the tournament owner or manager.
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
 *               - new_player_id
 *             properties:
 *               tournament_id:
 *                 type: string
 *               new_player_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Player added successfully
 *       400:
 *         description: Player already enrolled or invalid input
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Missing permissions
 *       404:
 *         description: Player not found
 *       500:
 *         description: Internal server error
 */
export default async function handler(request: TournamentAddPlayerRequest, response: NextApiResponse) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const cookies = parse(request.headers.cookie || '');
        const token = cookies.auth_token;

        if (!token) return response.status(401).json({ error: "Not authenticated" });

        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET as string) as Pick<Player, 'id'> & { role?: string };
        const requesterId = decodedPayload.id;

        const { tournament_id, new_player_id } = request.body;

        if (!tournament_id || !new_player_id || new_player_id.trim() === '') {
            return response.status(400).json({ error: "Musisz podać ID gracza." });
        }

        const cleanPlayerId = new_player_id.trim();

        const authCheck = await sql<Pick<TournamentOrganizer, 'role'>[]>`
            SELECT role 
            FROM tournament_organizers 
            WHERE tournament_id = ${tournament_id} AND player_id = ${requesterId}
        `;

        if (authCheck.length === 0 || !['owner', 'manager'].includes(authCheck[0].role)) {
            return response.status(403).json({ error: "Brak uprawnień do dodawania graczy." });
        }

        const playerCheck = await sql<Pick<Player, 'id'>[]>`
            SELECT id FROM players WHERE id = ${cleanPlayerId}
        `;

        if (playerCheck.length === 0) {
            return response.status(404).json({ error: `Gracz o ID "${cleanPlayerId}" nie istnieje.` });
        }

        const duplicateCheck = await sql<Pick<Result, 'player_id'>[]>`
            SELECT player_id FROM results 
            WHERE tournament_id = ${tournament_id} AND player_id = ${cleanPlayerId}
        `;

        if (duplicateCheck.length > 0) {
            return response.status(400).json({ error: "Ten gracz jest już zapisany do tego turnieju." });
        }

        await sql`
            INSERT INTO results (tournament_id, player_id)
            VALUES (${tournament_id}, ${cleanPlayerId})
        `;

        return response.status(200).json({ message: "Gracz został dodany." });

    } catch (error: any) {
        console.error("Add Player Error:", error);
        return response.status(500).json({ error: "Wystąpił błąd podczas dodawania gracza." });
    }
}