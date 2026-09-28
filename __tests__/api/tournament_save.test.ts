import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/tournament_save';
import { verifySession } from '../../lib/auth';

vi.mock('../../lib/auth', () => ({
    verifySession: vi.fn(),
    AUTH_COOKIE_NAME: 'auth_token'
}));

const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Tournament Save API', () => {
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

    test('rejects out of bounds dates', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'player', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST',
            body: { 
                tournament_id: 't1', 
                results: [], 
                tournament_info: { displayed_name: 'T', displayed_date: 'D', finished: true, end_date: '2020-01-01' } 
            }
        });

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData()).error).toContain('wcześniejsz');
    });

    test('saves tournament data successfully', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'player', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST',
            body: { 
                tournament_id: 't1', 
                results: [{ player_id: 'p1', position: 1, total_points: 100 }], 
                tournament_info: { displayed_name: 'T', displayed_date: 'D', finished: true, end_date: '2025-01-01' } 
            }
        });

        mockSql.mockResolvedValueOnce([{ role: 'owner' }]);
        mockSql.mockResolvedValueOnce([]); // update tournaments
        mockSql.mockResolvedValueOnce([]); // update results

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
    });
});
