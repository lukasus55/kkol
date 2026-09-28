import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/tournament_update_organizer_role';
import { verifySession } from '../../lib/auth';

vi.mock('../../lib/auth', () => ({
    verifySession: vi.fn(),
    AUTH_COOKIE_NAME: 'auth_token'
}));

const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Tournament Update Organizer Role API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('returns 401 if session is invalid or revoked', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce(null);
        const { req, res } = createMocks({ 
            method: 'POST',
            body: { tournament_id: 't1', target_player_id: 'p2', action: 'promote' }
        });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
        expect(JSON.parse(res._getData()).error).toBe('Not authenticated');
    });

    test('validates action type', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'owner_user', role: 'player', displayed_name: 'Owner', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST',
            body: { tournament_id: 't1', target_player_id: 'p2', action: 'invalid' }
        });

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
    });

    test('rejects non-owner from updating roles', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'manager_user', role: 'player', displayed_name: 'Manager', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST',
            body: { tournament_id: 't1', target_player_id: 'p2', action: 'promote' }
        });

        mockSql.mockResolvedValueOnce([{ role: 'manager' }]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(403);
    });

    test('successfully promotes a user', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'owner_user', role: 'player', displayed_name: 'Owner', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST',
            body: { tournament_id: 't1', target_player_id: 'p2', action: 'promote' }
        });

        mockSql.mockResolvedValueOnce([{ role: 'owner' }]);
        mockSql.mockResolvedValueOnce([]); // upsert execution

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
    });

    test('successfully demotes a user', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'owner_user', role: 'player', displayed_name: 'Owner', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST',
            body: { tournament_id: 't1', target_player_id: 'p2', action: 'demote' }
        });

        mockSql.mockResolvedValueOnce([{ role: 'owner' }]);
        mockSql.mockResolvedValueOnce([]); // delete execution

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
    });
});
