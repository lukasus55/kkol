import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/tournament_add_player';
import { verifySession } from '../../lib/auth';

vi.mock('../../lib/auth', () => ({
    verifySession: vi.fn(),
    AUTH_COOKIE_NAME: 'auth_token'
}));

const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Tournament Add Player API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('returns 401 if session is invalid or revoked', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce(null);
        const { req, res } = createMocks({ 
            method: 'POST',
            body: {}
        });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
        expect(JSON.parse(res._getData()).error).toBe('Not authenticated');
    });

    test('rejects missing data', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'player', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST',
            body: {}
        });

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
    });

    test('blocks if user is not owner or manager', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'player', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST',
            body: { tournament_id: 't1', new_player_id: 'p2' }
        });

        mockSql.mockResolvedValueOnce([{ role: 'organizer' }]); // Not owner/manager

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(403);
    });

    test('blocks if duplicate player', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'player', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST',
            body: { tournament_id: 't1', new_player_id: 'p2' }
        });

        mockSql.mockResolvedValueOnce([{ role: 'manager' }]);
        mockSql.mockResolvedValueOnce([{ id: 'p2' }]); // player exists
        mockSql.mockResolvedValueOnce([{ player_id: 'p2' }]); // duplicate result

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData()).error).toContain('już zapisany');
    });

    test('successfully adds player', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'player', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST',
            body: { tournament_id: 't1', new_player_id: 'p2' }
        });

        mockSql.mockResolvedValueOnce([{ role: 'manager' }]);
        mockSql.mockResolvedValueOnce([{ id: 'p2' }]); // player exists
        mockSql.mockResolvedValueOnce([]); // no duplicate
        mockSql.mockResolvedValueOnce([]); // insert results

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
    });

    test('allows global admin to add player without tournament_organizers record', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'admin1', role: 'admin', displayed_name: 'Admin', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST',
            body: { tournament_id: 't1', new_player_id: 'p2' }
        });

        mockSql.mockResolvedValueOnce([{ id: 'p2' }]); // player exists
        mockSql.mockResolvedValueOnce([]); // no duplicate
        mockSql.mockResolvedValueOnce([]); // insert results

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
    });
});
