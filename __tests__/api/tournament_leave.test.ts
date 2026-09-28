import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/tournament_leave';
import { verifySession } from '../../lib/auth';

vi.mock('../../lib/auth', () => ({
    verifySession: vi.fn(),
    AUTH_COOKIE_NAME: 'auth_token'
}));

const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Tournament Leave API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('returns 401 if session is invalid or revoked', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce(null);
        const { req, res } = createMocks({ 
            method: 'POST',
            body: { tournamentId: 't1' }
        });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
        expect(JSON.parse(res._getData()).error).toBe('Not authenticated');
    });

    test('blocks leaving S tier tournaments', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'player', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST',
            body: { tournamentId: 't1' }
        });

        mockSql.mockResolvedValueOnce([{ tier: 'S', role: null }]); 

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(403);
        expect(JSON.parse(res._getData()).error).toContain('S-Tier');
    });

    test('blocks owner from leaving', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'player', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST',
            body: { tournamentId: 't1' }
        });

        mockSql.mockResolvedValueOnce([{ tier: 'A', role: 'owner' }]); 

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(403);
        expect(JSON.parse(res._getData()).error).toContain('owner cannot leave');
    });

    test('successfully leaves tournament', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'player', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST',
            body: { tournamentId: 't1' }
        });

        mockSql.mockResolvedValueOnce([{ tier: 'B', role: null }]); 
        mockSql.mockResolvedValueOnce([]); // Delete 1
        mockSql.mockResolvedValueOnce([]); // Delete 2

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
    });
});
