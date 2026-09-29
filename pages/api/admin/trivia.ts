import type { NextApiRequest, NextApiResponse } from 'next';
import type { Trivia } from '../../../types/db';
import sql from '../../../db.js';
import { verifySession } from '../../../lib/auth';

/**
 * @swagger
 * /api/admin/trivia:
 *   get:
 *     summary: Get trivia list
 *     description: Returns a list of trivia items with optional filtering by used status. Only administrators are allowed.
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: is_used
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *         description: Filter trivia by whether it has been published to Discord
 *     responses:
 *       200:
 *         description: Trivia list returned successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - admin privileges required
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Add new trivia item
 *     description: Adds a new trivia item to the database. Only administrators are allowed.
 *     tags: [Admin]
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
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 5
 *     responses:
 *       201:
 *         description: Trivia created successfully
 *       400:
 *         description: Invalid content length
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - admin privileges required
 *       500:
 *         description: Internal server error
 *   patch:
 *     summary: Update trivia content or publication status
 *     description: Allows updating trivia text or toggling used status.
 *     tags: [Admin]
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
 *               - id
 *             properties:
 *               id:
 *                 type: integer
 *               content:
 *                 type: string
 *               is_used:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Trivia updated successfully
 *       400:
 *         description: Missing ID or update parameters
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - admin privileges required
 *       404:
 *         description: Trivia not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete trivia item
 *     description: Removes a trivia item from the database.
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Trivia deleted successfully
 *       400:
 *         description: Missing ID parameter
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - admin privileges required
 *       404:
 *         description: Trivia not found
 *       500:
 *         description: Internal server error
 */
export default async function handler(request: NextApiRequest, response: NextApiResponse) {
    if (!['GET', 'POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method || '')) {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const auth = await verifySession(request);
        if (!auth) {
            return response.status(401).json({ error: "Not authenticated" });
        }

        if (auth.user.role !== 'admin') {
            return response.status(403).json({ error: "Tylko administrator ma dostęp." });
        }

        if (request.method === 'GET') {
            const { is_used } = request.query;
            let trivia: Trivia[];

            if (is_used === 'true') {
                trivia = await sql<Trivia[]>`
                    SELECT id, content, is_used, used_at, created_at, created_by
                    FROM trivia
                    WHERE is_used = true
                    ORDER BY id DESC
                `;
            } else if (is_used === 'false') {
                trivia = await sql<Trivia[]>`
                    SELECT id, content, is_used, used_at, created_at, created_by
                    FROM trivia
                    WHERE is_used = false
                    ORDER BY id DESC
                `;
            } else {
                trivia = await sql<Trivia[]>`
                    SELECT id, content, is_used, used_at, created_at, created_by
                    FROM trivia
                    ORDER BY id DESC
                `;
            }

            return response.status(200).json({ trivia });
        }

        if (request.method === 'POST') {
            const { content } = request.body || {};

            if (!content || typeof content !== 'string' || content.trim().length < 5) {
                return response.status(400).json({ error: "Treść ciekawostki musi mieć co najmniej 5 znaków." });
            }

            const [newTrivia] = await sql<Trivia[]>`
                INSERT INTO trivia (content, is_used, created_by, created_at)
                VALUES (${content.trim()}, false, ${auth.user.id}, NOW())
                RETURNING id, content, is_used, used_at, created_at, created_by
            `;

            return response.status(201).json({
                message: "Ciekawostka dodana.",
                trivia: newTrivia
            });
        }

        if (request.method === 'PATCH' || request.method === 'PUT') {
            const { id, content, is_used } = request.body || {};
            const triviaId = Number(id);

            if (!triviaId || isNaN(triviaId)) {
                return response.status(400).json({ error: "ID ciekawostki jest wymagane." });
            }

            if (content === undefined && is_used === undefined) {
                return response.status(400).json({ error: "Brak danych do aktualizacji." });
            }

            const existing = await sql<Pick<Trivia, 'id'>[]>`
                SELECT id FROM trivia WHERE id = ${triviaId}
            `;

            if (existing.length === 0) {
                return response.status(404).json({ error: "Ciekawostka nie istnieje." });
            }

            const trimmedContent = typeof content === 'string' && content.trim() ? content.trim() : null;

            let updated: Trivia[];

            if (is_used === true) {
                updated = await sql<Trivia[]>`
                    UPDATE trivia
                    SET
                        content = COALESCE(${trimmedContent}, content),
                        is_used = true,
                        used_at = NOW()
                    WHERE id = ${triviaId}
                    RETURNING id, content, is_used, used_at, created_at, created_by
                `;
            } else if (is_used === false) {
                updated = await sql<Trivia[]>`
                    UPDATE trivia
                    SET
                        content = COALESCE(${trimmedContent}, content),
                        is_used = false,
                        used_at = NULL
                    WHERE id = ${triviaId}
                    RETURNING id, content, is_used, used_at, created_at, created_by
                `;
            } else {
                updated = await sql<Trivia[]>`
                    UPDATE trivia
                    SET
                        content = COALESCE(${trimmedContent}, content)
                    WHERE id = ${triviaId}
                    RETURNING id, content, is_used, used_at, created_at, created_by
                `;
            }

            return response.status(200).json({
                message: "Ciekawostka zaktualizowana.",
                trivia: updated[0]
            });
        }

        if (request.method === 'DELETE') {
            const triviaId = Number(request.body?.id || request.query?.id);

            if (!triviaId || isNaN(triviaId)) {
                return response.status(400).json({ error: "ID ciekawostki jest wymagane." });
            }

            const deleted = await sql<Pick<Trivia, 'id'>[]>`
                DELETE FROM trivia WHERE id = ${triviaId} RETURNING id
            `;

            if (deleted.length === 0) {
                return response.status(404).json({ error: "Ciekawostka nie istnieje." });
            }

            return response.status(200).json({ message: "Ciekawostka usunięta." });
        }
    } catch (error) {
        console.error("Admin trivia API error:", error);
        return response.status(500).json({ error: "Błąd serwera." });
    }
}
