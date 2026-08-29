import type { NextApiRequest, NextApiResponse } from 'next';
import type { Poll, Player } from '../../types/db';
import sql from '../../db.js';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import { isUUIDv7 } from '../../public/js/utils/helpers.js';

interface PollResultsRequest extends NextApiRequest {
    query: {
        poll?: string;
    };
}

/**
 * @swagger
 * /api/poll_results:
 *   get:
 *     summary: Get poll results
 *     description: Retrieves aggregated results for a poll, including vote counts and voters per option.
 *     tags: [Polls]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: poll
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *     responses:
 *       200:
 *         description: Poll results
 *       400:
 *         description: Invalid poll ID
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Missing permissions
 *       404:
 *         description: Poll not found
 *       500:
 *         description: Internal server error
 */
export default async function handler(request: PollResultsRequest, response: NextApiResponse) {
    if (request.method !== 'GET') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { poll } = request.query;

        if (!poll) {
            return response.status(400).json({ error: "Brakujące dane (Id ankiety)." });
        }
        
        if (!isUUIDv7(poll)) {
            return response.status(400).json({ error: "Id ankiety musi być typu uuidv7" });
        }

        const pollCheck = await sql<Pick<Poll, 'id' | 'tournament_id'>[]>`
            SELECT id, tournament_id FROM polls WHERE id = ${poll}
        `;
        
        if (pollCheck.length === 0) {
            return response.status(404).json({ error: "Ankieta nie istnieje." });
        }

        const tournament_id = pollCheck[0].tournament_id;

        const cookies = parse(request.headers.cookie || '');
        const token = cookies.auth_token;
        if (!token) return response.status(401).json({ error: "Brak autoryzacji." });
        
        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET as string) as Pick<Player, 'id'> & { role?: string };
        const requesterId = decodedPayload.id;

        const permissions = await sql<{ global_role: string, is_organizer: boolean, is_player: boolean }[]>`
            SELECT
                (SELECT role FROM players WHERE id = ${requesterId}) as global_role,
                EXISTS(SELECT 1 FROM tournament_organizers WHERE tournament_id = ${tournament_id} AND player_id = ${requesterId}) as is_organizer,
                EXISTS(SELECT 1 FROM results WHERE tournament_id = ${tournament_id} AND player_id = ${requesterId}) as is_player
        `;
        const p = permissions[0];
        if (p.global_role !== 'admin' && !p.is_organizer && !p.is_player) {
            return response.status(403).json({ error: "Brak dostępu. Musisz być przypisany do turnieju, aby zobaczyć wyniki tej ankiety." });
        }

        const participantsResult = await sql<{ total: number }[]>`
            SELECT COUNT(DISTINCT ca.player_id)::int AS total
            FROM checked_answers ca
            JOIN "options" o ON ca.option_id = o.id
            JOIN questions q ON o.question_id = q.id
            WHERE q.poll_id = ${poll}
        `;
        const totalParticipants = participantsResult[0].total;

        const resultsData = await sql<{ final_results: Record<string, any> }[]>`
            WITH option_counts AS (
                SELECT 
                    o.question_id,
                    o.id AS option_id,
                    o.name AS option_name,
                    COUNT(ca.option_id)::int AS vote_count,
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'id', p.id,
                                'displayed_name', p.displayed_name,
                                'pfp_base64', p.pfp_base64
                            )
                        ) FILTER (WHERE p.id IS NOT NULL), '[]'::json
                    ) AS voters
                FROM "options" o
                LEFT JOIN checked_answers ca ON o.id = ca.option_id
                LEFT JOIN players p ON ca.player_id = p.id
                JOIN questions q ON o.question_id = q.id
                WHERE q.poll_id = ${poll}
                GROUP BY o.question_id, o.id, o.name
            ),
            question_totals AS (
                SELECT 
                    question_id,
                    SUM(vote_count)::int AS total_votes
                FROM option_counts
                GROUP BY question_id
            ),
            calculated_options AS (
                SELECT 
                    oc.question_id,
                    oc.option_id,
                    oc.option_name,
                    oc.vote_count,
                    oc.voters,
                    CASE 
                        WHEN qt.total_votes > 0 THEN ROUND((oc.vote_count::numeric / qt.total_votes) * 100, 1)::float
                        ELSE 0.0 
                    END AS percentage
                FROM option_counts oc
                JOIN question_totals qt ON oc.question_id = qt.question_id
            ),
            questions_aggregated AS (
                SELECT 
                    q.id AS question_id,
                    q."name" AS question_name,
                    q.sort_order,
                    COALESCE(
                        json_object_agg(
                            co.option_id,
                            json_build_object(
                                'name', co.option_name,
                                'vote_count', co.vote_count,
                                'percentage', co.percentage,
                                'voters', co.voters
                            )
                        ) FILTER (WHERE co.option_id IS NOT NULL), '{}'::json
                    ) AS options_map
                FROM questions q
                LEFT JOIN calculated_options co ON q.id = co.question_id
                WHERE q.poll_id = ${poll}
                GROUP BY q.id, q."name", q.sort_order
            )
            SELECT COALESCE(
                json_object_agg(
                    question_id,
                    json_build_object(
                        'name', question_name,
                        'sort_order', sort_order,
                        'options', options_map
                    )
                ), '{}'::json
            ) AS final_results
            FROM questions_aggregated;
        `;

        const finalResultsMap = resultsData[0]?.final_results || {};

        return response.status(200).json({
            poll_id: poll,
            total_participants: totalParticipants,
            results: finalResultsMap
        });

    } catch (error: any) {
        console.error("Fetch Poll Results Error:", error);
        return response.status(500).json({ error: "Wystąpił błąd podczas pobierania wyników ankiety." });
    }
}