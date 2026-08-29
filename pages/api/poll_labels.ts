import type { NextApiRequest, NextApiResponse } from 'next';
import type { PollLabel } from '../../types/db';
import sql from '../../db.js';
import { isUUIDv7 } from '../../public/js/utils/helpers.js';

interface PollLabelsRequest extends NextApiRequest {
    query: {
        poll?: string;
        limit?: string;
        offset?: string;
    };
}

type PollLabelRow = Pick<PollLabel, 'id' | 'poll_id' | 'name' | 'hex' | 'description'> & {
    questions_count: number;
};

/**
 * @swagger
 * /api/poll_labels:
 *   get:
 *     summary: Get poll labels
 *     description: Retrieves all labels for a given poll.
 *     tags: [Polls]
 *     parameters:
 *       - in: query
 *         name: poll
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Array of poll labels
 *       400:
 *         description: Missing or invalid poll ID
 *       500:
 *         description: Internal server error
 */
export default async function handler(request: PollLabelsRequest, response: NextApiResponse) {
    try {
        const { poll, limit, offset } = request.query;
        const actualLimit = limit ? Math.min(Number(limit), 100) : 100;
        const actualOffset = offset ? Math.max(Number(offset), 0) : 0;

        if (!poll) return response.status(400).json({ error: "Brakujące dane (Id ankiety)." });
        
        if (!isUUIDv7(poll)) {
            return response.status(400).json({ error: "Id ankiety musi być typu uuidv7" });
        }

        const labels = await sql<PollLabelRow[]>`
            SELECT 
                pl.id,
                pl.poll_id,
                pl.name,
                pl.hex,
                pl.description,
                COUNT(qpl.question_id)::int AS questions_count
            FROM poll_labels pl
            LEFT JOIN questions_poll_labels qpl 
                ON pl.id = qpl.label_id 
                AND qpl.poll_id = ${poll}
            WHERE pl.poll_id = ${poll} 
            GROUP BY pl.id
            ORDER BY pl.name ASC
            LIMIT ${actualLimit}
            OFFSET ${actualOffset}
        `;

        return response.status(200).json(labels);

    } catch (error: any) {
        console.error("Failed to load poll labels:", error);
        return response.status(500).json({ error: "Failed to load poll labels" });
    }
}