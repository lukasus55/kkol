import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/admin/trivia';
import { verifySession } from '../../lib/auth';

vi.mock('../../lib/auth', () => ({
    verifySession: vi.fn(),
    AUTH_COOKIE_NAME: 'auth_token'
}));

const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Admin Trivia API (/api/admin/trivia)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('returns 405 for unsupported HTTP methods', async () => {
        const { req, res } = createMocks({ method: 'OPTIONS' });
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

    describe('GET /api/admin/trivia', () => {
        test('returns list of trivia for admin', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'admin1', role: 'admin', displayed_name: 'Admin', is_active: true },
                session: {} as any
            });

            const mockTrivia = [
                { id: 1, content: 'Pierwsza ciekawostka', is_used: false, created_at: new Date().toISOString() },
                { id: 2, content: 'Druga ciekawostka', is_used: true, created_at: new Date().toISOString() }
            ];
            mockSql.mockResolvedValueOnce(mockTrivia);

            const { req, res } = createMocks({ method: 'GET' });
            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(200);
            const data = JSON.parse(res._getData());
            expect(data.trivia).toEqual(mockTrivia);
        });

        test('handles is_used query filter', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'admin1', role: 'admin', displayed_name: 'Admin', is_active: true },
                session: {} as any
            });

            mockSql.mockResolvedValueOnce([]);

            const { req, res } = createMocks({
                method: 'GET',
                query: { is_used: 'false' }
            });
            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(200);
            expect(mockSql).toHaveBeenCalled();
        });

        test('handles next=true query and returns single oldest unused trivia', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'admin1', role: 'admin', displayed_name: 'Admin', is_active: true },
                session: {} as any
            });

            const nextItem = { id: 5, content: 'Najstarsza w kolejce', is_used: false };
            mockSql.mockResolvedValueOnce([nextItem]);

            const { req, res } = createMocks({
                method: 'GET',
                query: { next: 'true' }
            });
            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(200);
            const data = JSON.parse(res._getData());
            expect(data.trivia).toEqual(nextItem);
        });

        test('handles next=true when trivia queue is empty', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'admin1', role: 'admin', displayed_name: 'Admin', is_active: true },
                session: {} as any
            });

            mockSql.mockResolvedValueOnce([]);

            const { req, res } = createMocks({
                method: 'GET',
                query: { next: 'true' }
            });
            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(200);
            const data = JSON.parse(res._getData());
            expect(data.trivia).toBeNull();
            expect(data.message).toContain('pusta');
        });

        test('allows bot authentication via x-trivia-api-key without user session', async () => {
            const oldEnv = process.env.TRIVIA_API_KEY;
            process.env.TRIVIA_API_KEY = 'super-bot-key-999';

            mockSql.mockResolvedValueOnce([]);

            const { req, res } = createMocks({
                method: 'GET',
                headers: { 'x-trivia-api-key': 'super-bot-key-999' }
            });
            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(200);
            expect(verifySession).not.toHaveBeenCalled();

            process.env.TRIVIA_API_KEY = oldEnv;
        });

        test('allows bot authentication via Authorization Bearer TRIVIA_API_KEY', async () => {
            const oldEnv = process.env.TRIVIA_API_KEY;
            process.env.TRIVIA_API_KEY = 'super-bot-key-999';

            mockSql.mockResolvedValueOnce([]);

            const { req, res } = createMocks({
                method: 'GET',
                headers: { authorization: 'Bearer super-bot-key-999' }
            });
            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(200);
            expect(verifySession).not.toHaveBeenCalled();

            process.env.TRIVIA_API_KEY = oldEnv;
        });
    });

    describe('POST /api/admin/trivia', () => {
        test('fails when content is missing or too short', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'admin1', role: 'admin', displayed_name: 'Admin', is_active: true },
                session: {} as any
            });

            const { req, res } = createMocks({
                method: 'POST',
                body: { content: 'abc' }
            });
            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(400);
            expect(JSON.parse(res._getData()).error).toContain('co najmniej 5 znaków');
        });

        test('successfully creates a new trivia entry', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'admin1', role: 'admin', displayed_name: 'Admin', is_active: true },
                session: {} as any
            });

            const createdEntry = {
                id: 1,
                content: 'Czy wiesz, że pierwszy turniej KKOL odbył się w 2020 roku?',
                is_used: false,
                used_at: null,
                created_at: new Date().toISOString(),
                created_by: 'admin1'
            };
            mockSql.mockResolvedValueOnce([createdEntry]);

            const { req, res } = createMocks({
                method: 'POST',
                body: { content: createdEntry.content }
            });
            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(201);
            const data = JSON.parse(res._getData());
            expect(data.trivia).toEqual(createdEntry);
        });
    });

    describe('PATCH /api/admin/trivia', () => {
        test('fails when id is missing or invalid', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'admin1', role: 'admin', displayed_name: 'Admin', is_active: true },
                session: {} as any
            });

            const { req, res } = createMocks({
                method: 'PATCH',
                body: { content: 'Nowa treść ciekawostki' }
            });
            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(400);
            expect(JSON.parse(res._getData()).error).toContain('ID ciekawostki jest wymagane');
        });

        test('fails when neither content nor is_used is provided', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'admin1', role: 'admin', displayed_name: 'Admin', is_active: true },
                session: {} as any
            });

            const { req, res } = createMocks({
                method: 'PATCH',
                body: { id: 1 }
            });
            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(400);
            expect(JSON.parse(res._getData()).error).toContain('Brak danych do aktualizacji');
        });

        test('fails with 404 when trivia entry is not found', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'admin1', role: 'admin', displayed_name: 'Admin', is_active: true },
                session: {} as any
            });

            mockSql.mockResolvedValueOnce([]); // No entry found

            const { req, res } = createMocks({
                method: 'PATCH',
                body: { id: 999, is_used: true }
            });
            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(404);
            expect(JSON.parse(res._getData()).error).toContain('Ciekawostka nie istnieje');
        });

        test('successfully updates content and is_used', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'admin1', role: 'admin', displayed_name: 'Admin', is_active: true },
                session: {} as any
            });

            const existing = { id: 1, content: 'Stara treść', is_used: false };
            mockSql.mockResolvedValueOnce([existing]); // Found

            const updated = { id: 1, content: 'Zaktualizowana treść', is_used: true, used_at: new Date().toISOString() };
            mockSql.mockResolvedValueOnce([updated]); // Update result

            const { req, res } = createMocks({
                method: 'PATCH',
                body: { id: 1, content: 'Zaktualizowana treść', is_used: true }
            });
            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(200);
            const data = JSON.parse(res._getData());
            expect(data.trivia.content).toBe('Zaktualizowana treść');
            expect(data.trivia.is_used).toBe(true);
        });

        test('allows bot with x-trivia-api-key to mark trivia as used', async () => {
            const oldEnv = process.env.TRIVIA_API_KEY;
            process.env.TRIVIA_API_KEY = 'super-bot-key-999';

            mockSql.mockResolvedValueOnce([{ id: 1, content: 'Treść', is_used: false }]); // Found
            mockSql.mockResolvedValueOnce([{ id: 1, content: 'Treść', is_used: true, used_at: new Date().toISOString() }]);

            const { req, res } = createMocks({
                method: 'PATCH',
                headers: { 'x-trivia-api-key': 'super-bot-key-999' },
                body: { id: 1, is_used: 'true' }
            });
            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(200);
            const data = JSON.parse(res._getData());
            expect(data.trivia.is_used).toBe(true);
            expect(verifySession).not.toHaveBeenCalled();

            process.env.TRIVIA_API_KEY = oldEnv;
        });
    });

    describe('DELETE /api/admin/trivia', () => {
        test('fails when id is missing', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'admin1', role: 'admin', displayed_name: 'Admin', is_active: true },
                session: {} as any
            });

            const { req, res } = createMocks({
                method: 'DELETE',
                body: {}
            });
            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(400);
            expect(JSON.parse(res._getData()).error).toContain('ID ciekawostki jest wymagane');
        });

        test('fails with 404 when trivia to delete is not found', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'admin1', role: 'admin', displayed_name: 'Admin', is_active: true },
                session: {} as any
            });

            mockSql.mockResolvedValueOnce([]); // No row deleted

            const { req, res } = createMocks({
                method: 'DELETE',
                body: { id: 999 }
            });
            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(404);
            expect(JSON.parse(res._getData()).error).toContain('Ciekawostka nie istnieje');
        });

        test('successfully deletes trivia entry', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'admin1', role: 'admin', displayed_name: 'Admin', is_active: true },
                session: {} as any
            });

            mockSql.mockResolvedValueOnce([{ id: 1 }]); // Deleted 1 row

            const { req, res } = createMocks({
                method: 'DELETE',
                body: { id: 1 }
            });
            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(200);
            const data = JSON.parse(res._getData());
            expect(data.message).toContain('Ciekawostka usunięta');
        });
    });
});
