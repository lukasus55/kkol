import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/tournament_kick_player';
import { verifySession } from '../../lib/auth';

vi.mock('../../lib/auth', () => ({
    verifySession: vi.fn(),
    AUTH_COOKIE_NAME: 'auth_token'
}));

const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Tournament Kick Player API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('returns 401 if session is invalid or revoked', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce(null);
        const { req, res } = createMocks({ 
            method: 'POST',
            body: { tournament_id: 't1', target_player_id: 'owner_user' }
        });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
        expect(JSON.parse(res._getData()).error).toBe('Not authenticated');
    });

    test('blocks kicking owner', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'player', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST',
            body: { tournament_id: 't1', target_player_id: 'owner_user' }
        });

        mockSql.mockResolvedValueOnce([{ role: 'manager' }]); // requester
        mockSql.mockResolvedValueOnce([{ role: 'owner' }]); // target

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(403);
        expect(JSON.parse(res._getData()).error).toContain('właściciela');
    });

    test('blocks manager from kicking another manager', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'player', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST',
            body: { tournament_id: 't1', target_player_id: 'other_manager' }
        });

        mockSql.mockResolvedValueOnce([{ role: 'manager' }]); // requester
        mockSql.mockResolvedValueOnce([{ role: 'manager' }]); // target

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(403);
        expect(JSON.parse(res._getData()).error).toContain('innego managera');
    });

    test('successfully kicks player', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'player', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST',
            body: { tournament_id: 't1', target_player_id: 'normal_user' }
        });

        mockSql.mockResolvedValueOnce([{ role: 'owner' }]); // requester
        mockSql.mockResolvedValueOnce([]); // target (not organizer)
        mockSql.mockResolvedValueOnce([]); // delete organizer
        mockSql.mockResolvedValueOnce([]); // delete result

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
    });
});
