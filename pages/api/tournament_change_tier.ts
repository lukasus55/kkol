import type { NextApiRequest, NextApiResponse } from 'next';
import type { Tournament, TournamentOrganizer } from '../../types/db';
import sql from '../../db.js';
import { verifySession } from '../../lib/auth';

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
 *     description: Changes the tier (S, A, B, C) of a tournament. S-Tier requires admin privileges. Verifies active server session.
 *     tags: [Tournaments]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
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
        const auth = await verifySession(request);
        if (!auth) {
            return response.status(401).json({ error: "Not authenticated" });
        }

        const requesterId = auth.user.id;
        const globalRole = auth.user.role;

        const { tournament_id, new_tier } = request.body || {};

        if (!tournament_id || !['S', 'A', 'B', 'C'].includes(new_tier)) {
            return response.status(400).json({ error: "Nieprawidłowe dane." });
        }

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