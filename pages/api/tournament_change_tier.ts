import type { NextApiRequest, NextApiResponse } from 'next';
import type { Player, Tournament, TournamentOrganizer } from '../../types/db';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import sql from '../../db.js';

interface TournamentChangeTierRequest extends NextApiRequest {
    body: {
        tournament_id: string;
        new_tier: string;
    };
}

/**
 * @swagger
 * /api/tournament_change_tier:
 *   post:
 *     summary: Change tournament tier
 *     description: Changes the tier (S, A, B, C) of a tournament. S-Tier requires admin privileges.
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
 *               - new_tier
 *             properties:
 *               tournament_id:
 *                 type: string
 *               new_tier:
 *                 type: string
 *                 enum: ['S', 'A', 'B', 'C']
 *     responses:
 *       200:
 *         description: Tier changed successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Missing permissions
 *       404:
 *         description: Tournament not found
 *       500:
 *         description: Internal server error
 */
export default async function handler(request: TournamentChangeTierRequest, response: NextApiResponse) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const cookies = parse(request.headers.cookie || '');
        const token = cookies.auth_token;

        if (!token) return response.status(401).json({ error: "Not authenticated" });

        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET as string) as Pick<Player, 'id'> & { role?: string };
        const requesterId = decodedPayload.id;

        const { tournament_id, new_tier } = request.body;

        if (!tournament_id || !['S', 'A', 'B', 'C'].includes(new_tier)) {
            return response.status(400).json({ error: "Nieprawidłowe dane." });
        }

        const userCheck = await sql<Pick<Player, 'role'>[]>`SELECT role FROM players WHERE id = ${requesterId}`;
        if (userCheck.length === 0) return response.status(401).json({ error: "Użytkownik nie istnieje." });
        
        const globalRole = userCheck[0].role; 

        const tournamentCheck = await sql<Pick<Tournament, 'tier'>[]>`SELECT tier FROM tournaments WHERE id = ${tournament_id}`;
        if (tournamentCheck.length === 0) {
            return response.status(404).json({ error: "Turniej nie został znaleziony." });
        }
        const currentTier = tournamentCheck[0].tier;

        if (new_tier === 'S' && globalRole !== 'admin') {
            return response.status(403).json({ error: "Tylko administrator może przypisać rangę S-Tier." });
        }

        if (currentTier === 'S' && globalRole !== 'admin') {
            return response.status(403).json({ error: "Tylko administrator może zmienić rangę turnieju o randze S-Tier." });
        }

        if (['A', 'B', 'C'].includes(new_tier) && globalRole !== 'admin' && globalRole !== 'organizer') {
            return response.status(403).json({ error: "Tylko organizatorzy i administratorzy mogą zmieniać tier." });
        }

        if (globalRole !== 'admin') {
            const authCheck = await sql<Pick<TournamentOrganizer, 'role'>[]>`
                SELECT role 
                FROM tournament_organizers 
                WHERE tournament_id = ${tournament_id} AND player_id = ${requesterId}
            `;

            if (authCheck.length === 0 || !['owner', 'manager'].includes(authCheck[0].role)) {
                return response.status(403).json({ error: "Brak uprawnień do edycji tego turnieju." });
            }
        }

        await sql`
            UPDATE tournaments 
            SET tier = ${new_tier} 
            WHERE id = ${tournament_id}
        `;

        return response.status(200).json({ message: "Tier został pomyślnie zmieniony." });

    } catch (error: any) {
        console.error("Change Tier Error:", error);
        return response.status(500).json({ error: "Wystąpił błąd podczas zmiany tieru." });
    }
}