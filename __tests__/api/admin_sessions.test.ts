import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/admin/sessions';
import { verifySession, revokeSession, revokeAllUserSessions } from '../../lib/auth';

vi.mock('../../lib/auth', () => ({
    verifySession: vi.fn(),
    revokeSession: vi.fn(),
    revokeAllUserSessions: vi.fn(),
    AUTH_COOKIE_NAME: 'auth_token'
}));

const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Admin Sessions API (/api/admin/sessions)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('returns 405 for unsupported HTTP methods', async () => {
        const { req, res } = createMocks({ method: 'POST' });
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

    describe('GET /api/admin/sessions', () => {
        test('fails when player_id is missing', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'admin1', role: 'admin', displayed_name: 'Admin', is_active: true },
                session: {} as any
            });

            const { req, res } = createMocks({ method: 'GET', query: {} });
            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(400);
            expect(JSON.parse(res._getData()).error).toContain('ID użytkownika jest wymagane');
        });

        test('fails when target user does not exist (404)', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'admin1', role: 'admin', displayed_name: 'Admin', is_active: true },
                session: {} as any
            });

            mockSql.mockResolvedValueOnce([]); // Target user not found

            const { req, res } = createMocks({ method: 'GET', query: { player_id: 'nonexistent' } });
            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(404);
            expect(JSON.parse(res._getData()).error).toContain('Użytkownik nie istnieje');
        });

        test('fails with 403 when target user is another admin', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'admin1', role: 'admin', displayed_name: 'Admin 1', is_active: true },
                session: {} as any
            });

            mockSql.mockResolvedValueOnce([{ id: 'admin2', role: 'admin' }]); // Target is admin

            const { req, res } = createMocks({ method: 'GET', query: { player_id: 'admin2' } });
            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(403);
            expect(JSON.parse(res._getData()).error).toContain('innego administratora');
        });

        test('successfully returns active sessions for a player', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'admin1', role: 'admin', displayed_name: 'Admin', is_active: true },
                session: {} as any
            });

            mockSql.mockResolvedValueOnce([{ id: 'player1', role: 'player' }]); // Target user

            const mockSessions = [
                {
                    id: 'sess-1',
                    player_id: 'player1',
                    ip_address: '127.0.0.1',
                    device_info: 'Chrome (Windows)',
                    app_id: 'kkol_main',
                    created_at: new Date().toISOString(),
                    last_active_at: new Date().toISOString(),
                    expires_at: new Date(Date.now() + 100000).toISOString()
                }
            ];
            mockSql.mockResolvedValueOnce(mockSessions); // Sessions query

            const { req, res } = createMocks({ method: 'GET', query: { player_id: 'player1' } });
            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(200);
            const data = JSON.parse(res._getData());
            expect(data.sessions).toHaveLength(1);
            expect(data.sessions[0].id).toBe('sess-1');
        });
    });

    describe('DELETE /api/admin/sessions', () => {
        test('fails when player_id is missing', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'admin1', role: 'admin', displayed_name: 'Admin', is_active: true },
                session: {} as any
            });

            const { req, res } = createMocks({ method: 'DELETE', body: {} });
            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(400);
            expect(JSON.parse(res._getData()).error).toContain('ID użytkownika jest wymagane');
        });

        test('fails when target user is another admin', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'admin1', role: 'admin', displayed_name: 'Admin 1', is_active: true },
                session: {} as any
            });

            mockSql.mockResolvedValueOnce([{ id: 'admin2', role: 'admin' }]); // Target is admin

            const { req, res } = createMocks({ method: 'DELETE', body: { player_id: 'admin2', all: true } });
            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(403);
            expect(JSON.parse(res._getData()).error).toContain('innego administratora');
        });

        test('successfully revokes a single session', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'admin1', role: 'admin', displayed_name: 'Admin', is_active: true },
                session: {} as any
            });

            mockSql.mockResolvedValueOnce([{ id: 'player1', role: 'player' }]); // Target user
            vi.mocked(revokeSession).mockResolvedValueOnce(true);

            const { req, res } = createMocks({
                method: 'DELETE',
                body: { player_id: 'player1', session_id: 'sess-1' }
            });
            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(200);
            expect(revokeSession).toHaveBeenCalledWith('sess-1');
        });

        test('successfully revokes all sessions for player', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'admin1', role: 'admin', displayed_name: 'Admin', is_active: true },
                session: {} as any
            });

            mockSql.mockResolvedValueOnce([{ id: 'player1', role: 'player' }]); // Target user
            vi.mocked(revokeAllUserSessions).mockResolvedValueOnce(3);

            const { req, res } = createMocks({
                method: 'DELETE',
                body: { player_id: 'player1', all: true }
            });
            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(200);
            expect(revokeAllUserSessions).toHaveBeenCalledWith('player1');
        });
    });
});
