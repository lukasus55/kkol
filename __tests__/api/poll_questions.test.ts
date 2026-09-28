import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/poll_questions';
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

describe('Poll Questions API', () => {
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

    test('rejects missing poll parameter', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'user', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ method: 'GET' });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
    });

    test('validates user is assigned to tournament', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'user', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'GET',
            query: { poll: 'valid-uuid-v7' }
        });

        mockSql.mockResolvedValueOnce([{ tournament_id: 't1' }]); // poll check
        mockSql.mockResolvedValueOnce([{ global_role: 'user', is_organizer: false, is_player: false }]); // permissions check

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(403);
    });

    test('returns formatted questions', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'user', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'GET',
            query: { poll: 'valid-uuid-v7' }
        });

        mockSql.mockResolvedValueOnce([{ tournament_id: 't1' }]); 
        mockSql.mockResolvedValueOnce([{ global_role: 'admin', is_organizer: false, is_player: false }]); 
        mockSql.mockResolvedValueOnce([{ id: 'q1', name: 'Question 1', labels: [], options: [] }]); // questions result

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData())[0].name).toBe('Question 1');
    });
});
