import type { NextApiRequest, NextApiResponse } from 'next';
import type { Player, Tournament } from '../../types/db';
import sql from '../../db.js';
import { verifySession } from '../../lib/auth';

interface TournamentCreateRequest extends NextApiRequest {
    body: {
        tournament_id: string;
    };
}

/**
 * @swagger
 * /api/tournament_create:
 *   post:
 *     summary: Create tournament
 *     description: Creates a new tournament. Only admins and organizers are allowed. Creator becomes owner. Verifies server session.
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
 *             properties:
 *               tournament_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tournament created successfully
 *       400:
 *         description: Invalid tournament ID
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Missing permissions
 *       500:
 *         description: Internal server error
 */
export default async function handler(request: TournamentCreateRequest, response: NextApiResponse) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const auth = await verifySession(request);
        if (!auth) {
            return response.status(401).json({ error: "Not authenticated" });
        }

        const requesterId = auth.user.id;
        const { tournament_id } = request.body || {};

        if (!tournament_id || tournament_id.trim() === '') {
            return response.status(400).json({ error: "ID turnieju jest wymagane." });
        }

        const cleanTournamentId = tournament_id.trim(); 

        if (!cleanTournamentId || cleanTournamentId.length < 3) {
            return response.status(400).json({ error: "Id turnieju musi mieć co najmniej 3 znaki." });
        }
        
        if (cleanTournamentId.length > 30) {
            return response.status(400).json({ error: "Id turnieju może mieć maksymalnie 30 znaków." });
        }

        const idRegex = /^[a-z0-9_]{3,30}$/;
        const inputId = cleanTournamentId;

        if (!idRegex.test(inputId)) {
            return response.status(400).json({ 
                error: "ID może zawierać tylko małe litery, cyfry i podkreślniki (bez spacji)." 
            });
        }
        
        const userCheck = await sql<Pick<Player, 'role'>[]>`SELECT role FROM players WHERE id = ${requesterId}`;
        if (userCheck.length === 0 || !['admin', 'organizer'].includes(userCheck[0].role || '')) {
            return response.status(403).json({ error: "Brak uprawnień do tworzenia turniejów." });
        }

        const existCheck = await sql<Pick<Tournament, 'id'>[]>`SELECT id FROM tournaments WHERE id = ${cleanTournamentId}`;
        if (existCheck.length > 0) {
            return response.status(400).json({ error: "Turniej o takim ID już istnieje!" });
        }

        await sql`
            INSERT INTO tournaments (id, displayed_name)
            VALUES (${cleanTournamentId}, ${cleanTournamentId})
        `;

        await sql`
            INSERT INTO results (tournament_id, player_id)
            VALUES (${cleanTournamentId}, ${requesterId})
        `;

        await sql`
            INSERT INTO tournament_organizers (tournament_id, player_id, role)
            VALUES (${cleanTournamentId}, ${requesterId}, 'owner')
        `;

        return response.status(200).json({ message: "Turniej utworzony." });

    } catch (error: any) {
        console.error("Create Tournament Error:", error);
        return response.status(500).json({ error: "Wystąpił błąd podczas tworzenia turnieju." });
    }
}