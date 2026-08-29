import type { NextApiRequest, NextApiResponse } from 'next';
import type { Player, TournamentOrganizer } from '../../types/db';
import jwt from 'jsonwebtoken';
import sql from '../../db.js';
import { parse } from 'cookie';

interface TournamentEditorDetailsRequest extends NextApiRequest {
    query: {
        tournamentId?: string;
    };
}

type MemberData = {
    id: string;
    displayed_name: string | null;
    attended: boolean;
    position: number;
    total_points: number;
    organizer_role: string | null;
};

/**
 * @swagger
 * /api/tournament_editor_details:
 *   get:
 *     summary: Get tournament editor details
 *     description: Retrieves the detailed standings and permissions of players in a tournament for editor management.
 *     tags: [Tournaments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: tournamentId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Tournament editor details
 *       400:
 *         description: Missing tournament ID
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Missing permissions
 *       500:
 *         description: Internal server error
 */
export default async function handler(request: TournamentEditorDetailsRequest, response: NextApiResponse) {
    if (request.method !== 'GET') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const cookies = parse(request.headers.cookie || '');
        const token = cookies.auth_token;

        if (!token) {
            return response.status(401).json({ error: "Not authenticated" });
        }

        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET as string) as Pick<Player, 'id'> & { role?: string };
        const userId = decodedPayload.id;

        const { tournamentId } = request.query;

        if (!tournamentId) {
            return response.status(400).json({ error: "Tournament ID is required" });
        }

        const authCheck = await sql<Pick<TournamentOrganizer, 'role'>[]>`
            SELECT role 
            FROM tournament_organizers 
            WHERE tournament_id = ${tournamentId} AND player_id = ${userId}
        `;

        if (authCheck.length === 0 || (authCheck[0].role !== 'owner' && authCheck[0].role !== 'manager')) {
            return response.status(403).json({ error: "Brak uprawnień do edycji tego turnieju." });
        }

        const membersData = await sql<MemberData[]>`
            SELECT 
                r.player_id as id,
                p.displayed_name,
                r.attended,
                r.position,
                r.total_points,
                o.role as organizer_role
            FROM results r
            LEFT JOIN players p 
                ON r.player_id = p.id
            LEFT JOIN tournament_organizers o 
                ON r.tournament_id = o.tournament_id AND r.player_id = o.player_id
            WHERE r.tournament_id = ${tournamentId}
            ORDER BY r.position ASC
        `;

        return response.status(200).json({ 
            tournament_id: tournamentId,
            current_user_id: userId,
            current_user_role: authCheck[0].role,
            members: membersData 
        });

    } catch (error: any) {
        console.error("Fetch Tournament Details Error:", error);
        return response.status(500).json({ error: "Failed to load tournament data" });
    }
}