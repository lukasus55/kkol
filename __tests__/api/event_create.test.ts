import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/event_create';
import { verifySession } from '../../lib/auth';

vi.mock('../../lib/auth', () => ({
    verifySession: vi.fn(),
    AUTH_COOKIE_NAME: 'auth_token'
}));
const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Event Create API (/api/event_create)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('rejects unauthenticated requests', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce(null);
        const { req, res } = createMocks({ method: 'POST', body: {} });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
    });

    test('validates minimum name length', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'user', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { tournament_id: 't1', name: 'ab', is_major: false, start_date: '2025-01-01' }
        });

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData()).error).toContain('co najmniej 3 znaki');
    });

    test('checks tournament finished status and auth', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'user', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { tournament_id: 't1', name: 'Valid Event', is_major: false, start_date: '2025-01-01' }
        });

        // 1st query: check tournament
        mockSql.mockResolvedValueOnce([{ finished: false }]);
        // 2nd queries: Promise.all [globalRole, tournamentRole]
        mockSql.mockResolvedValueOnce([{ role: 'user' }]); // global
        mockSql.mockResolvedValueOnce([{ role: 'manager' }]); // tournament auth
        
        // Final insert
        mockSql.mockResolvedValueOnce([{ id: 99 }]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData()).id).toBe(99);
    });
});
