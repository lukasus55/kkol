import type { NextApiRequest, NextApiResponse } from 'next';
import type { Trivia } from '../../../types/db';
import sql from '../../../db.js';
import { verifySession } from '../../../lib/auth';

/**
 * @swagger
 * /api/admin/trivia:
 *   get:
 *     summary: Get trivia list or next pending trivia
 *     description: Returns a list of trivia items or the next pending item. Accessible by admins (session cookie / token) or Discord Bot (via x-trivia-api-key or Bearer TRIVIA_API_KEY).
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-trivia-api-key
 *         schema:
 *           type: string
 *         description: Secret API key for Discord bot or automation scripts
 *       - in: query
 *         name: next
 *         schema:
 *           type: string
 *           enum: ['true', '1']
 *         description: If true, returns the single oldest unused trivia from the queue (FIFO)
 *       - in: query
 *         name: is_used
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *         description: Filter trivia by whether it has been published to Discord
 *     responses:
 *       200:
 *         description: Trivia list or next trivia object returned successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - admin privileges required
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Add new trivia item
 *     description: Adds a new trivia item to the database. Accessible by admins or bot.
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-trivia-api-key
 *         schema:
 *           type: string
 *         description: Secret API key for Discord bot or automation scripts
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
 *     description: Allows updating trivia text or toggling used status. Used by bot to mark trivia as published.
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-trivia-api-key
 *         schema:
 *           type: string
 *         description: Secret API key for Discord bot or automation scripts
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
        const configuredSecret = process.env.TRIVIA_API_KEY || process.env.DISCORD_BOT_SECRET;
        const botKeyHeader = (request.headers['x-trivia-api-key'] || request.headers['x-api-key']) as string | undefined;
        const authHeader = request.headers['authorization'];
        const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : undefined;

        let authUserId: string | null = null;

        if (configuredSecret && (botKeyHeader === configuredSecret || bearerToken === configuredSecret)) {
            authUserId = 'discord_bot';
        } else {
            const auth = await verifySession(request);
            if (!auth) {
                return response.status(401).json({ error: "Not authenticated" });
            }

            if (auth.user.role !== 'admin') {
                return response.status(403).json({ error: "Tylko administrator ma dostęp." });
            }

            authUserId = auth.user.id;
        }

        if (request.method === 'GET') {
            const { is_used, next } = request.query;

            // FIFO queue: oldest pending trivia
            if (next === 'true' || next === '1') {
                const [nextTrivia] = await sql<Trivia[]>`
                    SELECT id, content, is_used, used_at, created_at, created_by
                    FROM trivia
                    WHERE is_used = false
                    ORDER BY id ASC
                    LIMIT 1
                `;

                return response.status(200).json({
                    trivia: nextTrivia || null,
                    message: nextTrivia ? undefined : "Kolejka ciekawostek jest pusta."
                });
            }

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
                VALUES (${content.trim()}, false, ${authUserId}, NOW())
                RETURNING id, content, is_used, used_at, created_at, created_by
            `;

            return response.status(201).json({
                message: "Ciekawostka dodana.",
                trivia: newTrivia
            });
        }

        if (request.method === 'PATCH' || request.method === 'PUT') {
            const { id, content, is_used } = request.body || {};
            const triviaId = Number(id !== undefined ? id : request.query.id);

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

            let isUsedValue: boolean | undefined = undefined;
            if (is_used === true || is_used === 'true' || is_used === 1 || is_used === '1') {
                isUsedValue = true;
            } else if (is_used === false || is_used === 'false' || is_used === 0 || is_used === '0') {
                isUsedValue = false;
            }

            let updated: Trivia[];

            if (isUsedValue === true) {
                updated = await sql<Trivia[]>`
                    UPDATE trivia
                    SET
                        content = COALESCE(${trimmedContent}, content),
                        is_used = true,
                        used_at = NOW()
                    WHERE id = ${triviaId}
                    RETURNING id, content, is_used, used_at, created_at, created_by
                `;
            } else if (isUsedValue === false) {
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
