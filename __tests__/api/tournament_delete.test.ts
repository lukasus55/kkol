import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/tournament_delete';
import { verifySession } from '../../lib/auth';

vi.mock('../../lib/auth', () => ({
    verifySession: vi.fn(),
    AUTH_COOKIE_NAME: 'auth_token'
}));

const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Tournament Delete API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('returns 401 if session is invalid or revoked', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce(null);
        const { req, res } = createMocks({ 
            method: 'POST',
            body: { tournament_id: 't1' }
        });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
        expect(JSON.parse(res._getData()).error).toBe('Not authenticated');
    });

    test('rejects missing tournament_id', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'admin', displayed_name: 'Admin', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST',
            body: {}
        });

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
    });

    test('rejects if not owner', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'player', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST',
            body: { tournament_id: 't1' }
        });

        mockSql.mockResolvedValueOnce([{ role: 'manager' }]); // not owner

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(403);
    });

    test('successfully deletes tournament', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'player', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST',
            body: { tournament_id: 't1' }
        });

        mockSql.mockResolvedValueOnce([{ role: 'owner' }]);
        mockSql.mockResolvedValueOnce([]); // delete results
        mockSql.mockResolvedValueOnce([]); // delete organizers
        mockSql.mockResolvedValueOnce([]); // delete tournament

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
    });

    test('allows global admin to delete tournament even if not owner', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'admin1', role: 'admin', displayed_name: 'Admin', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST',
            body: { tournament_id: 't1' }
        });

        // delete results
        mockSql.mockResolvedValueOnce([]);
        // delete organizers
        mockSql.mockResolvedValueOnce([]);
        // delete tournament
        mockSql.mockResolvedValueOnce([]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
    });
});
