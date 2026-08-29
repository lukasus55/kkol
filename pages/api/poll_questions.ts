import type { NextApiRequest, NextApiResponse } from 'next';
import type { Poll, Player, Question, PollLabel, Option } from '../../types/db';
import sql from '../../db.js';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import { isUUIDv7 } from '../../public/js/utils/helpers.js';

interface PollQuestionsRequest extends NextApiRequest {
    query: {
        poll?: string;
        limit?: string;
        offset?: string;
    };
}

type QuestionRow = Pick<Question, 'id' | 'poll_id' | 'name' | 'added_on' | 'creator_id' | 'multiple_choice' | 'page_url' | 'sort_order'> & {
    labels: Pick<PollLabel, 'id' | 'name' | 'description' | 'hex'>[];
    options: Pick<Option, 'id' | 'name'>[];
};

export default async function handler(request: PollQuestionsRequest, response: NextApiResponse) {
    try {
        const { poll, limit, offset } = request.query;
        const actualLimit = limit ? Math.min(Number(limit), 100) : 100;
        const actualOffset = offset ? Math.max(Number(offset), 0) : 0;

        if (!poll) return response.status(400).json({ error: "Brakujące dane (Id ankiety)." });
        
        if (!isUUIDv7(poll)) {
            return response.status(400).json({ error: "Id ankiety musi być typu uuidv7" });
        }

        const cookies = parse(request.headers.cookie || '');
        const token = cookies.auth_token;
        if (!token) return response.status(401).json({ error: "Brak autoryzacji." });
        
        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET as string) as Pick<Player, 'id'> & { role?: string };
        const requesterId = decodedPayload.id;

        const tournamentRes = await sql<Pick<Poll, 'tournament_id'>[]>`SELECT tournament_id FROM polls WHERE id = ${poll}`;
        if (tournamentRes.length === 0) return response.status(404).json({ error: "Ankieta nie istnieje." });
        const tournament_id = tournamentRes[0].tournament_id;

        const permissions = await sql<{ global_role: string, is_organizer: boolean, is_player: boolean }[]>`
            SELECT
                (SELECT role FROM players WHERE id = ${requesterId}) as global_role,
                EXISTS(SELECT 1 FROM tournament_organizers WHERE tournament_id = ${tournament_id} AND player_id = ${requesterId}) as is_organizer,
                EXISTS(SELECT 1 FROM results WHERE tournament_id = ${tournament_id} AND player_id = ${requesterId}) as is_player
        `;
        const p = permissions[0];
        if (p.global_role !== 'admin' && !p.is_organizer && !p.is_player) {
            return response.status(403).json({ error: "Brak dostępu. Musisz być przypisany do turnieju, aby zobaczyć tę ankietę." });
        }

        const questions = await sql<QuestionRow[]>`
        SELECT 
            q.id, 
            q.poll_id, 
            q."name", 
            q.added_on, 
            q.creator_id,
            q.multiple_choice, 
            q.page_url, 
            q.sort_order,
            
                (
                    SELECT COALESCE(json_agg(
                        json_build_object(
                            'id', pl.id,
                            'name', pl."name",
                            'description', pl.description,
                            'hex', pl.hex
                        )
                    ), '[]'::json)
                    FROM questions_poll_labels qpl
                    JOIN poll_labels pl ON qpl.label_id = pl.id
                    WHERE qpl.question_id = q.id
                ) AS labels,

                (
                    SELECT COALESCE(json_agg(
                        json_build_object(
                            'id', o.id,
                            'name', o."name"
                        )
                    ), '[]'::json)
                    FROM "options" o
                    WHERE o.question_id = q.id
                ) AS options

            FROM questions q
            WHERE q.poll_id = ${poll}
            ORDER BY q.sort_order ASC
            LIMIT ${actualLimit}
            OFFSET ${actualOffset};
        `;

        return response.status(200).json(questions);

    } catch (error: any) {
        console.error("Failed to load poll questions:", error);
        return response.status(500).json({ error: "Failed to load poll questions" });
    }
}