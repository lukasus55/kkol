import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/event_update';
import { verifySession } from '../../lib/auth';

vi.mock('../../lib/auth', () => ({
    verifySession: vi.fn(),
    AUTH_COOKIE_NAME: 'auth_token'
}));
const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Event Update API (/api/event_update)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('rejects unauthenticated requests', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce(null);
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { id: 1, name: 'Valid Event', is_major: false, start_date: '2025-01-01' } 
        });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
    });

    test('blocks updates to events in finished tournaments', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'user', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { id: 1, name: 'Valid Event', is_major: false, start_date: '2025-01-01' }
        });

        // 1st query: event check returns finished=true
        mockSql.mockResolvedValueOnce([{ tournament_id: 't1', finished: true }]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData()).error).toContain('zakończonym turnieju');
    });

    test('successfully updates event if user is manager', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'user', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { id: 1, name: 'Updated Event', is_major: false, start_date: '2025-01-01' }
        });

        mockSql.mockResolvedValueOnce([{ tournament_id: 't1', finished: false }]);
        mockSql.mockResolvedValueOnce([{ role: 'user' }]); // global role
        mockSql.mockResolvedValueOnce([{ role: 'manager' }]); // tournament role
        mockSql.mockResolvedValueOnce([]); // update query

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData()).success).toBe(true);
    });
});
