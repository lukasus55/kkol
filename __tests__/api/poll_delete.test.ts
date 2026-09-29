import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/poll_delete';
import { hasTournamentPermission } from '../../public/js/utils/permissionChecks.js';
import { verifySession } from '../../lib/auth';

vi.mock('../../lib/auth', () => ({
    verifySession: vi.fn(),
    AUTH_COOKIE_NAME: 'auth_token'
}));
vi.mock('../../public/js/utils/permissionChecks.js', () => ({
    hasTournamentPermission: vi.fn()
}));
const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Poll Delete API (/api/poll_delete)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('returns 401 when unauthenticated', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce(null);
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { id: 'poll-123' }
        });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
    });

    test('returns 404 if poll does not exist', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'user', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { id: 'poll-123' }
        });
        
        mockSql.mockResolvedValueOnce([]); // no poll found

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(404);
        expect(JSON.parse(res._getData()).error).toContain('nie istnieje');
    });

    test('deletes poll successfully if user has permissions', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'user', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { id: 'poll-123' }
        });
        
        mockSql.mockResolvedValueOnce([{ tournament_id: 't1' }]); // poll check
        mockSql.mockResolvedValueOnce([{ finished: false }]); // tournament check
        
        vi.mocked(hasTournamentPermission).mockResolvedValueOnce(true);
        mockSql.mockResolvedValueOnce([]); // delete execution

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData()).success).toBe(true);
    });

    test('blocks deletion if user lacks permissions', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'user', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { id: 'poll-123' }
        });
        
        mockSql.mockResolvedValueOnce([{ tournament_id: 't1' }]);
        mockSql.mockResolvedValueOnce([{ finished: false }]);
        
        vi.mocked(hasTournamentPermission).mockResolvedValueOnce(false);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(403);
    });
});
