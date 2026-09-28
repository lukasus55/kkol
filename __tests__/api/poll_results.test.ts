import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/poll_results';
import { verifySession } from '../../lib/auth';

vi.mock('../../lib/auth', () => ({
    verifySession: vi.fn(),
    AUTH_COOKIE_NAME: 'auth_token'
}));
vi.mock('../../public/js/utils/helpers.js', () => ({
    isUUIDv7: vi.fn().mockImplementation((id: string) => id === 'valid-uuid-v7')
}));

const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Poll Results API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('rejects unauthenticated requests', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce(null);
        const { req, res } = createMocks({ 
            method: 'GET',
            query: { poll: 'valid-uuid-v7' }
        });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
    });

    test('rejects unassigned users', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'user', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'GET',
            query: { poll: 'valid-uuid-v7' }
        });

        mockSql.mockResolvedValueOnce([{ id: 'valid-uuid-v7', tournament_id: 't1' }]); 
        mockSql.mockResolvedValueOnce([{ global_role: 'user', is_organizer: false, is_player: false }]); 

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(403);
    });

    test('returns mapped poll results', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'user', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'GET',
            query: { poll: 'valid-uuid-v7' }
        });

        mockSql.mockResolvedValueOnce([{ id: 'valid-uuid-v7', tournament_id: 't1' }]); 
        mockSql.mockResolvedValueOnce([{ global_role: 'admin', is_organizer: false, is_player: false }]); 
        mockSql.mockResolvedValueOnce([{ total: 10 }]); // participants
        mockSql.mockResolvedValueOnce([{ final_results: { q1: { options: {} } } }]); // results_map

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        
        const data = JSON.parse(res._getData());
        expect(data.total_participants).toBe(10);
        expect(data.results.q1).toBeDefined();
    });
});
