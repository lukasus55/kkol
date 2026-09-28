import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/auth/verify';
import { verifySession } from '../../lib/auth';

vi.mock('../../lib/auth', () => ({
    verifySession: vi.fn(),
    AUTH_COOKIE_NAME: 'auth_token'
}));

const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Auth Verify API (/api/auth/verify)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('returns 401 when token is missing, invalid or expired', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce(null);
        const { req, res } = createMocks({ method: 'GET' });

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
        const data = JSON.parse(res._getData());
        expect(data.valid).toBe(false);
        expect(data.error).toBe('Invalid or expired session');
    });

    test('returns 200 and session details when token is valid', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: {
                id: 'player1',
                role: 'player',
                displayed_name: 'Player One',
                is_active: true
            },
            session: {
                id: 'session-uuid-123',
                player_id: 'player1',
                app_id: 'kkol_game',
                expires_at: '2026-10-28T14:00:00.000Z'
            } as any
        });

        const { req, res } = createMocks({ 
            method: 'GET',
            headers: { authorization: 'Bearer some_token' }
        });

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        const data = JSON.parse(res._getData());
        expect(data.valid).toBe(true);
        expect(data.user.id).toBe('player1');
        expect(data.user.displayed_name).toBe('Player One');
        expect(data.session.id).toBe('session-uuid-123');
        expect(data.session.app_id).toBe('kkol_game');
    });

    test('returns 405 for methods other than GET', async () => {
        const { req, res } = createMocks({ method: 'POST' });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(405);
    });
});
