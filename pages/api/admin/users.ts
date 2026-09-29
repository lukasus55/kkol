import type { NextApiRequest, NextApiResponse } from 'next';
import type { Player } from '../../../types/db';
import sql from '../../../db.js';
import { verifySession } from '../../../lib/auth';
import bcrypt from 'bcrypt';

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all players for admin management
 *     description: Returns a list of players with optional filtering by search query, role, and active status. Only administrators are allowed.
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by player ID or displayed name
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [player, organizer, admin]
 *         description: Filter by player role
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by active account status
 *     responses:
 *       200:
 *         description: List of players returned successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - admin privileges required
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create a new player account
 *     description: Creates a new user with hashed password. Only administrators are allowed.
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
 *               - displayed_name
 *               - password
 *             properties:
 *               id:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 32
 *               displayed_name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 30
 *               password:
 *                 type: string
 *                 minLength: 6
 *               role:
 *                 type: string
 *                 enum: [player, organizer, admin]
 *                 default: player
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid input or validation failed
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - admin privileges required
 *       409:
 *         description: User with this ID already exists
 *       500:
 *         description: Internal server error
 *   patch:
 *     summary: Update player role or active status
 *     description: Allows administrator to change a user's role or activate/deactivate account.
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
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [player, organizer, admin]
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid input or attempting self-demotion
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - admin privileges required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
export default async function handler(request: NextApiRequest, response: NextApiResponse) {
    if (!['GET', 'POST', 'PATCH'].includes(request.method || '')) {
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
            const { search, role, status } = request.query;

            const searchFilter = typeof search === 'string' && search.trim() ? `%${search.trim()}%` : null;
            const roleFilter = typeof role === 'string' && ['player', 'organizer', 'admin'].includes(role) ? role : null;
            const statusFilter = status === 'active' ? true : status === 'inactive' ? false : null;

            let users: Omit<Player, 'password_hash'>[];

            if (searchFilter && roleFilter && statusFilter !== null) {
                users = await sql<Omit<Player, 'password_hash'>[]>`
                    SELECT id, displayed_name, email, role, is_active, last_login, created_at, pfp_base64
                    FROM players
                    WHERE (id ILIKE ${searchFilter} OR displayed_name ILIKE ${searchFilter})
                      AND role = ${roleFilter}
                      AND is_active = ${statusFilter}
                    ORDER BY created_at DESC
                `;
            } else if (searchFilter && roleFilter) {
                users = await sql<Omit<Player, 'password_hash'>[]>`
                    SELECT id, displayed_name, email, role, is_active, last_login, created_at, pfp_base64
                    FROM players
                    WHERE (id ILIKE ${searchFilter} OR displayed_name ILIKE ${searchFilter})
                      AND role = ${roleFilter}
                    ORDER BY created_at DESC
                `;
            } else if (searchFilter && statusFilter !== null) {
                users = await sql<Omit<Player, 'password_hash'>[]>`
                    SELECT id, displayed_name, email, role, is_active, last_login, created_at, pfp_base64
                    FROM players
                    WHERE (id ILIKE ${searchFilter} OR displayed_name ILIKE ${searchFilter})
                      AND is_active = ${statusFilter}
                    ORDER BY created_at DESC
                `;
            } else if (roleFilter && statusFilter !== null) {
                users = await sql<Omit<Player, 'password_hash'>[]>`
                    SELECT id, displayed_name, email, role, is_active, last_login, created_at, pfp_base64
                    FROM players
                    WHERE role = ${roleFilter}
                      AND is_active = ${statusFilter}
                    ORDER BY created_at DESC
                `;
            } else if (searchFilter) {
                users = await sql<Omit<Player, 'password_hash'>[]>`
                    SELECT id, displayed_name, email, role, is_active, last_login, created_at, pfp_base64
                    FROM players
                    WHERE id ILIKE ${searchFilter} OR displayed_name ILIKE ${searchFilter}
                    ORDER BY created_at DESC
                `;
            } else if (roleFilter) {
                users = await sql<Omit<Player, 'password_hash'>[]>`
                    SELECT id, displayed_name, email, role, is_active, last_login, created_at, pfp_base64
                    FROM players
                    WHERE role = ${roleFilter}
                    ORDER BY created_at DESC
                `;
            } else if (statusFilter !== null) {
                users = await sql<Omit<Player, 'password_hash'>[]>`
                    SELECT id, displayed_name, email, role, is_active, last_login, created_at, pfp_base64
                    FROM players
                    WHERE is_active = ${statusFilter}
                    ORDER BY created_at DESC
                `;
            } else {
                users = await sql<Omit<Player, 'password_hash'>[]>`
                    SELECT id, displayed_name, email, role, is_active, last_login, created_at, pfp_base64
                    FROM players
                    ORDER BY created_at DESC
                `;
            }

            return response.status(200).json({ users });
        }

        if (request.method === 'POST') {
            const { id, displayed_name, password, role, email } = request.body || {};

            if (!id || !displayed_name || !password) {
                return response.status(400).json({ error: "Wypełnij wszystkie wymagane pola (ID, nazwa, hasło)." });
            }

            const trimmedId = String(id).trim().toLowerCase();
            if (!/^[a-z0-9_-]{3,32}$/.test(trimmedId)) {
                return response.status(400).json({ error: "ID może zawierać tylko małe litery, cyfry, myślnik i podkreślnik (3-32 znaki)." });
            }

            const trimmedName = String(displayed_name).trim();
            if (trimmedName.length < 2 || trimmedName.length > 30) {
                return response.status(400).json({ error: "Wyświetlana nazwa musi mieć od 2 do 30 znaków." });
            }

            if (String(password).length < 6) {
                return response.status(400).json({ error: "Hasło musi mieć co najmniej 6 znaków." });
            }

            const validRole = ['player', 'organizer', 'admin'].includes(role) ? role : 'player';
            const cleanEmail = email && typeof email === 'string' && email.trim() ? email.trim() : null;

            const existing = await sql<Pick<Player, 'id'>[]>`
                SELECT id FROM players WHERE id = ${trimmedId}
            `;

            if (existing.length > 0) {
                return response.status(409).json({ error: "Użytkownik o podanym ID już istnieje." });
            }

            const password_hash = await bcrypt.hash(password, 10);

            const [createdUser] = await sql<Omit<Player, 'password_hash'>[]>`
                INSERT INTO players (id, displayed_name, password_hash, role, email, is_active, created_at)
                VALUES (${trimmedId}, ${trimmedName}, ${password_hash}, ${validRole}, ${cleanEmail}, true, NOW())
                RETURNING id, displayed_name, email, role, is_active, created_at
            `;

            return response.status(201).json({
                message: "Użytkownik został pomyślnie utworzony.",
                user: createdUser
            });
        }

        if (request.method === 'PATCH') {
            const { id, role, is_active } = request.body || {};

            if (!id || typeof id !== 'string') {
                return response.status(400).json({ error: "ID użytkownika jest wymagane." });
            }

            if (role === undefined && is_active === undefined) {
                return response.status(400).json({ error: "Brak danych do aktualizacji." });
            }

            if (id === auth.user.id && (is_active === false || (role && role !== 'admin'))) {
                return response.status(400).json({ error: "Nie możesz dezaktywować ani odebrać uprawnień administratora swojemu kontu." });
            }

            if (role !== undefined && !['player', 'organizer', 'admin'].includes(role)) {
                return response.status(400).json({ error: "Nieprawidłowa rola." });
            }

            const existing = await sql<Pick<Player, 'id'>[]>`
                SELECT id FROM players WHERE id = ${id}
            `;

            if (existing.length === 0) {
                return response.status(404).json({ error: "Użytkownik nie istnieje." });
            }

            const [updatedUser] = await sql<Omit<Player, 'password_hash'>[]>`
                UPDATE players
                SET
                    role = COALESCE(${role !== undefined ? role : null}, role),
                    is_active = COALESCE(${is_active !== undefined ? is_active : null}, is_active)
                WHERE id = ${id}
                RETURNING id, displayed_name, email, role, is_active, created_at, last_login
            `;

            return response.status(200).json({
                message: "Dane użytkownika zostały zaktualizowane.",
                user: updatedUser
            });
        }
    } catch (error) {
        console.error("Admin users API error:", error);
        return response.status(500).json({ error: "Błąd serwera." });
    }
}
