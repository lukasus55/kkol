import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/tournament_editor_details';
import { verifySession } from '../../lib/auth';

vi.mock('../../lib/auth', () => ({
    verifySession: vi.fn(),
    AUTH_COOKIE_NAME: 'auth_token'
}));

const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Tournament Editor Details API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('returns 401 if session is invalid or revoked', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce(null);
        const { req, res } = createMocks({ 
            method: 'GET',
            query: { tournamentId: 't1' }
        });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
        expect(JSON.parse(res._getData()).error).toBe('Not authenticated');
    });

    test('rejects missing tournamentId', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'player', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'GET'
        });

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
    });

    test('blocks unauthorized users', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'player', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'GET',
            query: { tournamentId: 't1' }
        });

        mockSql.mockResolvedValueOnce([{ role: 'organizer' }]); // Not owner/manager

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(403);
    });

    test('returns editor details', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'player', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'GET',
            query: { tournamentId: 't1' }
        });

        mockSql.mockResolvedValueOnce([{ role: 'manager' }]);
        mockSql.mockResolvedValueOnce([{ id: 'p1', displayed_name: 'P1', attended: true, position: 1, total_points: 10, organizer_role: null }]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        
        const data = JSON.parse(res._getData());
        expect(data.current_user_role).toBe('manager');
        expect(data.members[0].id).toBe('p1');
    });

    test('allows global admin even without tournament_organizers record', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'admin1', role: 'admin', displayed_name: 'Admin', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'GET',
            query: { tournamentId: 't1' }
        });

        // 1st sql call: check explicit role -> empty (no record)
        mockSql.mockResolvedValueOnce([]);
        // 2nd sql call: members
        mockSql.mockResolvedValueOnce([{ id: 'p1', displayed_name: 'P1', attended: true, position: 1, total_points: 10, organizer_role: null }]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        
        const data = JSON.parse(res._getData());
        expect(data.current_user_role).toBe('owner');
        expect(data.members[0].id).toBe('p1');
    });
});
