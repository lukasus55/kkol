import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/auth/authorize';
import { verifySession, createSession } from '../../lib/auth';

vi.mock('../../lib/auth', () => ({
    verifySession: vi.fn(),
    createSession: vi.fn(),
    AUTH_COOKIE_NAME: 'auth_token'
}));

const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Auth Authorize API (/api/auth/authorize)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('returns 405 for methods other than POST', async () => {
        const { req, res } = createMocks({ method: 'GET' });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(405);
        expect(JSON.parse(res._getData()).error).toBe('Method not allowed');
    });

    test('returns 401 when not authenticated', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce(null);
        const { req, res } = createMocks({ method: 'POST', body: { appId: 'ext_app' } });

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
        expect(JSON.parse(res._getData()).error).toBe('Not authenticated');
    });

    test('returns 403 when account is inactive', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: {
                id: 'player1',
                role: 'player',
                displayed_name: 'Player One',
                is_active: false
            },
            session: {
                id: 'session-1',
                player_id: 'player1',
                app_id: 'kkol_main',
                expires_at: '2026-10-28T14:00:00.000Z'
            } as any
        });

        const { req, res } = createMocks({ method: 'POST', body: { appId: 'ext_app' } });

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(403);
        expect(JSON.parse(res._getData()).error).toBe('This account has been disabled.');
    });

    test('returns 200 with new session token when successfully authorized', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: {
                id: 'player1',
                role: 'player',
                displayed_name: 'Player One',
                is_active: true
            },
            session: {
                id: 'session-1',
                player_id: 'player1',
                app_id: 'kkol_main',
                expires_at: '2026-10-28T14:00:00.000Z'
            } as any
        });

        vi.mocked(createSession).mockResolvedValueOnce({
            token: 'sso_token_123',
            session: {
                id: 'session-sso-2',
                player_id: 'player1',
                token_hash: 'hash_sso',
                app_id: 'ext_app',
                created_at: new Date(),
                expires_at: new Date()
            } as any
        });

        const { req, res } = createMocks({
            method: 'POST',
            body: { appId: 'ext_app' }
        });

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);

        const data = JSON.parse(res._getData());
        expect(data.token).toBe('sso_token_123');
        expect(data.user.id).toBe('player1');
        expect(data.user.displayed_name).toBe('Player One');

        expect(createSession).toHaveBeenCalledWith('player1', req, {
            appId: 'ext_app',
            role: 'player'
        });
    });

    test('returns 500 when session creation fails', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: {
                id: 'player1',
                role: 'player',
                displayed_name: 'Player One',
                is_active: true
            },
            session: {
                id: 'session-1',
                player_id: 'player1',
                app_id: 'kkol_main',
                expires_at: '2026-10-28T14:00:00.000Z'
            } as any
        });

        vi.mocked(createSession).mockRejectedValueOnce(new Error('DB failure'));

        const { req, res } = createMocks({
            method: 'POST',
            body: { appId: 'ext_app' }
        });

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(500);
        expect(JSON.parse(res._getData()).error).toBe('Internal server error during authorization');
    });
});
