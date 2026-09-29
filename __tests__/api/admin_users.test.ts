import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/admin/users';
import { verifySession } from '../../lib/auth';
import bcrypt from 'bcrypt';

vi.mock('../../lib/auth', () => ({
    verifySession: vi.fn(),
    AUTH_COOKIE_NAME: 'auth_token'
}));

vi.mock('bcrypt', () => ({
    default: {
        hash: vi.fn(),
        compare: vi.fn()
    }
}));

const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Admin Users API (/api/admin/users)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('returns 405 for unsupported HTTP methods', async () => {
        const { req, res } = createMocks({ method: 'DELETE' });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(405);
        expect(JSON.parse(res._getData()).error).toBe('Method not allowed');
    });

    test('returns 401 when not authenticated', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce(null);
        const { req, res } = createMocks({ method: 'GET' });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
        expect(JSON.parse(res._getData()).error).toBe('Not authenticated');
    });

    test('returns 403 when user is not an administrator', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'player1', role: 'player', displayed_name: 'Player 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ method: 'GET' });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(403);
        expect(JSON.parse(res._getData()).error).toBe('Tylko administrator ma dostęp.');
    });

    describe('GET /api/admin/users', () => {
        test('returns list of users for admin', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'admin1', role: 'admin', displayed_name: 'Admin', is_active: true },
                session: {} as any
            });

            const mockUsers = [
                { id: 'admin1', displayed_name: 'Admin', role: 'admin', is_active: true, email: 'admin@kkol.pl' },
                { id: 'player1', displayed_name: 'Player', role: 'player', is_active: true, email: null }
            ];
            mockSql.mockResolvedValueOnce(mockUsers);

            const { req, res } = createMocks({ method: 'GET' });
            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(200);
            const data = JSON.parse(res._getData());
            expect(data.users).toEqual(mockUsers);
        });

        test('handles filters query parameters correctly', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'admin1', role: 'admin', displayed_name: 'Admin', is_active: true },
                session: {} as any
            });

            mockSql.mockResolvedValueOnce([]);

            const { req, res } = createMocks({
                method: 'GET',
                query: { search: 'test', role: 'player', status: 'active' }
            });
            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(200);
            expect(mockSql).toHaveBeenCalled();
        });
    });

    describe('POST /api/admin/users', () => {
        test('fails when required fields are missing', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'admin1', role: 'admin', displayed_name: 'Admin', is_active: true },
                session: {} as any
            });

            const { req, res } = createMocks({
                method: 'POST',
                body: { id: 'newuser' }
            });
            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(400);
            expect(JSON.parse(res._getData()).error).toContain('Wypełnij wszystkie wymagane pola');
        });

        test('fails when user ID format is invalid', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'admin1', role: 'admin', displayed_name: 'Admin', is_active: true },
                session: {} as any
            });

            const { req, res } = createMocks({
                method: 'POST',
                body: { id: 'Invalid ID with Spaces', displayed_name: 'Valid Name', password: 'password123' }
            });
            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(400);
            expect(JSON.parse(res._getData()).error).toContain('ID może zawierać tylko');
        });

        test('fails when password is too short', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'admin1', role: 'admin', displayed_name: 'Admin', is_active: true },
                session: {} as any
            });

            const { req, res } = createMocks({
                method: 'POST',
                body: { id: 'valid_id', displayed_name: 'Valid Name', password: '123' }
            });
            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(400);
            expect(JSON.parse(res._getData()).error).toContain('Hasło musi mieć co najmniej');
        });

        test('fails when user ID already exists (409 Conflict)', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'admin1', role: 'admin', displayed_name: 'Admin', is_active: true },
                session: {} as any
            });

            mockSql.mockResolvedValueOnce([{ id: 'existing_id' }]); // User exists

            const { req, res } = createMocks({
                method: 'POST',
                body: { id: 'existing_id', displayed_name: 'Valid Name', password: 'password123' }
            });
            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(409);
            expect(JSON.parse(res._getData()).error).toContain('już istnieje');
        });

        test('successfully hashes password and creates user', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'admin1', role: 'admin', displayed_name: 'Admin', is_active: true },
                session: {} as any
            });

            mockSql.mockResolvedValueOnce([]); // No conflict
            vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashed_secret_pw' as never);

            const createdUser = {
                id: 'new_player',
                displayed_name: 'New Player',
                role: 'player',
                email: 'player@kkol.pl',
                is_active: true
            };
            mockSql.mockResolvedValueOnce([createdUser]); // Insert result

            const { req, res } = createMocks({
                method: 'POST',
                body: {
                    id: 'new_player',
                    displayed_name: 'New Player',
                    password: 'password123',
                    role: 'player',
                    email: 'player@kkol.pl'
                }
            });
            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(201);
            const data = JSON.parse(res._getData());
            expect(data.user).toEqual(createdUser);
            expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
        });
    });

    describe('PATCH /api/admin/users', () => {
        test('fails when id is missing', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'admin1', role: 'admin', displayed_name: 'Admin', is_active: true },
                session: {} as any
            });

            const { req, res } = createMocks({
                method: 'PATCH',
                body: { role: 'organizer' }
            });
            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(400);
            expect(JSON.parse(res._getData()).error).toContain('ID użytkownika jest wymagane');
        });

        test('fails when neither role nor is_active is provided', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'admin1', role: 'admin', displayed_name: 'Admin', is_active: true },
                session: {} as any
            });

            const { req, res } = createMocks({
                method: 'PATCH',
                body: { id: 'user1' }
            });
            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(400);
            expect(JSON.parse(res._getData()).error).toContain('Brak danych do aktualizacji');
        });

        test('prevents admin from deactivating or demoting themselves', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'admin1', role: 'admin', displayed_name: 'Admin', is_active: true },
                session: {} as any
            });

            const { req, res } = createMocks({
                method: 'PATCH',
                body: { id: 'admin1', is_active: false }
            });
            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(400);
            expect(JSON.parse(res._getData()).error).toContain('Nie możesz dezaktywować');
        });

        test('fails when target user does not exist (404)', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'admin1', role: 'admin', displayed_name: 'Admin', is_active: true },
                session: {} as any
            });

            mockSql.mockResolvedValueOnce([]); // Target user not found

            const { req, res } = createMocks({
                method: 'PATCH',
                body: { id: 'nonexistent', role: 'organizer' }
            });
            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(404);
            expect(JSON.parse(res._getData()).error).toContain('Użytkownik nie istnieje');
        });

        test('successfully updates user role and status', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'admin1', role: 'admin', displayed_name: 'Admin', is_active: true },
                session: {} as any
            });

            const existingUser = { id: 'user1', displayed_name: 'User 1', role: 'player', is_active: true };
            mockSql.mockResolvedValueOnce([existingUser]); // Find user

            const updatedUser = { ...existingUser, role: 'organizer' };
            mockSql.mockResolvedValueOnce([updatedUser]); // Update user

            const { req, res } = createMocks({
                method: 'PATCH',
                body: { id: 'user1', role: 'organizer' }
            });
            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(200);
            const data = JSON.parse(res._getData());
            expect(data.user.role).toBe('organizer');
        });
    });
});
