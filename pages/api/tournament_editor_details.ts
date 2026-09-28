import type { NextApiRequest, NextApiResponse } from 'next';
import type { TournamentOrganizer } from '../../types/db';
import sql from '../../db.js';
import { verifySession } from '../../lib/auth';

interface TournamentEditorDetailsRequest extends NextApiRequest {
    query: {
        tournamentId?: string;
    };
}

interface MemberData {
    id: string;
    displayed_name: string;
    attended: boolean;
    position: number | null;
    total_points: number | null;
    organizer_role: string | null;
}

/**
 * @swagger
 * /api/tournament_editor_details:
 *   get:
 *     summary: Get tournament editor details
 *     description: Retrieves the tournament details, organizer role, and participant results. Only for owners and managers. Verifies server session.
 *     tags: [Tournaments]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the tournament
 *     responses:
 *       200:
 *         description: Tournament editor details and participants list
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
        const auth = await verifySession(request);
        if (!auth) {
            return response.status(401).json({ error: "Not authenticated" });
        }

        const userId = auth.user.id;
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