import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/event_delete';
import { verifySession } from '../../lib/auth';

vi.mock('../../lib/auth', () => ({
    verifySession: vi.fn(),
    AUTH_COOKIE_NAME: 'auth_token'
}));
const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Event Delete API (/api/event_delete)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('rejects unauthenticated requests', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce(null);
        const { req, res } = createMocks({ method: 'POST', body: { event_id: 1 } });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
    });

    test('returns 404 if event does not exist', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'user', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { event_id: 1 }
        });
        
        mockSql.mockResolvedValueOnce([]); // empty array -> not found

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(404);
        expect(JSON.parse(res._getData()).error).toBe('Nie znaleziono wydarzenia.');
    });

    test('deletes event if user has permissions', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'admin', displayed_name: 'Admin User', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { event_id: 1 }
        });
        
        mockSql.mockResolvedValueOnce([{ tournament_id: 't1' }]); // event check
        mockSql.mockResolvedValueOnce([{ role: 'admin' }]); // global role check
        mockSql.mockResolvedValueOnce([]); // tournament role check
        mockSql.mockResolvedValueOnce([]); // delete

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData()).message).toBe('Wydarzenie usunięte pomyślnie.');
    });
});
