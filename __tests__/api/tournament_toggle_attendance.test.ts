import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/tournament_toggle_attendance';
import { verifySession } from '../../lib/auth';

vi.mock('../../lib/auth', () => ({
    verifySession: vi.fn(),
    AUTH_COOKIE_NAME: 'auth_token'
}));

const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Tournament Toggle Attendance API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('returns 401 if session is invalid or revoked', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce(null);
        const { req, res } = createMocks({ 
            method: 'POST',
            body: { tournament_id: 't1', target_player_id: 'p1' }
        });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
        expect(JSON.parse(res._getData()).error).toBe('Not authenticated');
    });

    test('validates payload', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'player', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST',
            body: { tournament_id: 't1' } // missing target
        });

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
    });

    test('rejects unauthorized users', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'player', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST',
            body: { tournament_id: 't1', target_player_id: 'p1' }
        });

        mockSql.mockResolvedValueOnce([{ role: 'user' }]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(403);
    });

    test('successfully toggles attendance', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'player', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST',
            body: { tournament_id: 't1', target_player_id: 'p1' }
        });

        mockSql.mockResolvedValueOnce([{ role: 'manager' }]);
        mockSql.mockResolvedValueOnce([]); // update query execution

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
    });
});
