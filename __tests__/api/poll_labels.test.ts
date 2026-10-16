import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/poll_labels';
import { verifySession } from '../../lib/auth';

const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

vi.mock('../../lib/auth', () => ({
    verifySession: vi.fn(),
    AUTH_COOKIE_NAME: 'auth_token'
}));

vi.mock('../../public/js/utils/helpers.js', () => ({
    isUUIDv7: vi.fn().mockImplementation((id: string) => id === 'valid-uuid-v7')
}));

describe('Poll Labels API (/api/poll_labels)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(verifySession).mockResolvedValue({
            user: { id: 'user1', role: 'user', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
    });

    test('rejects unauthenticated requests', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce(null);
        const { req, res } = createMocks({ method: 'GET', query: { poll: 'valid-uuid-v7' } });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
        expect(JSON.parse(res._getData()).error).toBe('Brak autoryzacji.');
    });

    test('rejects missing poll parameter', async () => {
        const { req, res } = createMocks({ method: 'GET' });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
    });

    test('rejects invalid UUID', async () => {
        const { req, res } = createMocks({ method: 'GET', query: { poll: 'invalid' } });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData()).error).toContain('typu uuidv7');
    });

    test('fetches poll labels', async () => {
        const { req, res } = createMocks({ method: 'GET', query: { poll: 'valid-uuid-v7' } });
        
        mockSql.mockResolvedValueOnce([
            { id: 1, poll_id: 'valid-uuid-v7', name: 'Label1', hex: '#fff', description: 'Desc', questions_count: 5 }
        ]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        const data = JSON.parse(res._getData());
        expect(data[0].questions_count).toBe(5);
        expect(data[0].name).toBe('Label1');
    });

    test('safely parses limit and offset defaulting appropriately on invalid input', async () => {
        const { req, res } = createMocks({ 
            method: 'GET', 
            query: { poll: 'valid-uuid-v7', limit: 'invalid', offset: 'invalid' } 
        });
        mockSql.mockResolvedValueOnce([]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);

        const call = mockSql.mock.calls[0];
        expect(call).toContain(100);
        expect(call).toContain(0);
    });
});
