import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/sessions';
import { verifySession, revokeSession, revokeAllUserSessions, clearSessionCookie } from '../../lib/auth';

vi.mock('../../lib/auth', () => ({
    verifySession: vi.fn(),
    revokeSession: vi.fn(),
    revokeAllUserSessions: vi.fn(),
    clearSessionCookie: vi.fn((res) => {
        res.setHeader('Set-Cookie', 'auth_token=; Max-Age=0');
    }),
    AUTH_COOKIE_NAME: 'auth_token'
}));

const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Sessions API (/api/sessions)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/sessions', () => {
        test('rejects unauthenticated requests with 401', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce(null);
            const { req, res } = createMocks({ method: 'GET' });

            await handler(req as any, res as any);
            expect(res._getStatusCode()).toBe(401);
            expect(JSON.parse(res._getData()).error).toBe('Not authenticated');
        });

        test('returns list of active sessions with is_current flag', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'player-1', role: 'user', displayed_name: 'Player 1', is_active: true },
                session: {
                    id: 'session-curr',
                    player_id: 'player-1',
                    device_info: 'Chrome on Windows',
                    ip_address: '127.0.0.1',
                    app_id: 'kkol_main',
                    created_at: new Date().toISOString(),
                    last_active_at: new Date().toISOString(),
                    expires_at: new Date(Date.now() + 86400000).toISOString(),
                } as any
            });

            mockSql.mockResolvedValueOnce([
                {
                    id: 'session-curr',
                    player_id: 'player-1',
                    device_info: 'Chrome on Windows',
                    ip_address: '127.0.0.1',
                    app_id: 'kkol_main',
                    created_at: '2026-09-28T10:00:00Z',
                    last_active_at: '2026-09-28T12:00:00Z',
                    expires_at: '2026-10-28T10:00:00Z'
                },
                {
                    id: 'session-other',
                    player_id: 'player-1',
                    device_info: 'Safari on iPhone',
                    ip_address: '192.168.1.5',
                    app_id: 'kkol_main',
                    created_at: '2026-09-20T10:00:00Z',
                    last_active_at: '2026-09-25T12:00:00Z',
                    expires_at: '2026-10-20T10:00:00Z'
                }
            ]);

            const { req, res } = createMocks({ method: 'GET' });
            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(200);
            const data = JSON.parse(res._getData());
            expect(data.sessions).toHaveLength(2);
            expect(data.sessions[0].id).toBe('session-curr');
            expect(data.sessions[0].is_current).toBe(true);
            expect(data.sessions[1].id).toBe('session-other');
            expect(data.sessions[1].is_current).toBe(false);
        });
    });

    describe('DELETE /api/sessions', () => {
        test('rejects unauthenticated requests with 401', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce(null);
            const { req, res } = createMocks({ 
                method: 'DELETE',
                query: { id: 'some-session' }
            });

            await handler(req as any, res as any);
            expect(res._getStatusCode()).toBe(401);
        });

        test('returns 400 if neither id nor others flag is passed', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'player-1', role: 'user', displayed_name: 'Player 1', is_active: true },
                session: { id: 'session-curr' } as any
            });

            const { req, res } = createMocks({ method: 'DELETE' });
            await handler(req as any, res as any);

            expect(res._getStatusCode()).toBe(400);
            expect(JSON.parse(res._getData()).error).toContain('Brakujące parametry');
        });

        test('revokes a specific remote session', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'player-1', role: 'user', displayed_name: 'Player 1', is_active: true },
                session: { id: 'session-curr' } as any
            });
            vi.mocked(revokeSession).mockResolvedValueOnce(true);

            const { req, res } = createMocks({ 
                method: 'DELETE',
                query: { id: 'session-remote' }
            });

            await handler(req as any, res as any);
            expect(res._getStatusCode()).toBe(200);
            expect(revokeSession).toHaveBeenCalledWith('session-remote', 'player-1');
            expect(clearSessionCookie).not.toHaveBeenCalled();
            expect(JSON.parse(res._getData()).success).toBe(true);
        });

        test('returns 404 if session to revoke does not exist or belong to user', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'player-1', role: 'user', displayed_name: 'Player 1', is_active: true },
                session: { id: 'session-curr' } as any
            });
            vi.mocked(revokeSession).mockResolvedValueOnce(false);

            const { req, res } = createMocks({ 
                method: 'DELETE',
                query: { id: 'session-nonexistent' }
            });

            await handler(req as any, res as any);
            expect(res._getStatusCode()).toBe(404);
            expect(JSON.parse(res._getData()).error).toContain('nie istnieje');
        });

        test('clears cookie when revoking the current session', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'player-1', role: 'user', displayed_name: 'Player 1', is_active: true },
                session: { id: 'session-curr' } as any
            });
            vi.mocked(revokeSession).mockResolvedValueOnce(true);

            const { req, res } = createMocks({ 
                method: 'DELETE',
                query: { id: 'session-curr' }
            });

            await handler(req as any, res as any);
            expect(res._getStatusCode()).toBe(200);
            expect(revokeSession).toHaveBeenCalledWith('session-curr', 'player-1');
            expect(clearSessionCookie).toHaveBeenCalledWith(res);
        });

        test('revokes all other sessions when others=true', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce({
                user: { id: 'player-1', role: 'user', displayed_name: 'Player 1', is_active: true },
                session: { id: 'session-curr' } as any
            });
            vi.mocked(revokeAllUserSessions).mockResolvedValueOnce(3);

            const { req, res } = createMocks({ 
                method: 'DELETE',
                query: { others: 'true' }
            });

            await handler(req as any, res as any);
            expect(res._getStatusCode()).toBe(200);
            expect(revokeAllUserSessions).toHaveBeenCalledWith('player-1', 'session-curr');
            expect(clearSessionCookie).not.toHaveBeenCalled();
            const data = JSON.parse(res._getData());
            expect(data.revokedCount).toBe(3);
        });
    });

    test('returns 405 for unsupported method (e.g. POST)', async () => {
        const { req, res } = createMocks({ method: 'POST' });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(405);
    });
});
