import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/poll_labels';

const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

vi.mock('../../public/js/utils/helpers.js', () => ({
    isUUIDv7: vi.fn().mockImplementation((id: string) => id === 'valid-uuid-v7')
}));

describe('Poll Labels API (/api/poll_labels)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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
});
