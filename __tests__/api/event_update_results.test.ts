import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/event_update_results';
import { verifySession } from '../../lib/auth';

vi.mock('../../lib/auth', () => ({
    verifySession: vi.fn(),
    AUTH_COOKIE_NAME: 'auth_token'
}));
const { mockSql } = vi.hoisted(() => ({ 
    mockSql: Object.assign(vi.fn(), {
        begin: vi.fn()
    })
}));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Event Update Results API (/api/event_update_results)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('rejects unauthenticated requests', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce(null);
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { event_id: 1, results: [] } 
        });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
    });

    test('rejects missing or non-array results', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'user', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { event_id: 1, results: 'invalid' } 
        });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
    });

    test('updates results inside transaction when authorized', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'admin', displayed_name: 'Admin', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { 
                event_id: 1, 
                results: [{ player_id: 'p1', position: 1, points: 100 }] 
            } 
        });

        mockSql.mockResolvedValueOnce([{ tournament_id: 't1', finished: false }]);
        mockSql.mockResolvedValueOnce([{ role: 'admin' }]); // global
        mockSql.mockResolvedValueOnce([]); // tournament

        mockSql.begin.mockImplementationOnce(async (cb: any) => {
            const txMock = vi.fn();
            txMock.mockResolvedValueOnce([]); // existingRecord -> 0
            txMock.mockResolvedValueOnce([]); // insert
            return cb(txMock);
        });

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData()).success).toBe(true);
    });
});
