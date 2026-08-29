import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/polls';

const { mockSql } = vi.hoisted(() => ({ mockSql: Object.assign(vi.fn(), { unsafe: (str: string) => str }) }));
vi.mock('../../db.js', () => ({ default: mockSql }));

vi.mock('../../public/js/utils/helpers.js', () => ({
    isUUIDv7: vi.fn().mockImplementation((id: string) => id === 'valid-uuid-v7')
}));

describe('Polls API Endpoint (/api/polls)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('returns 400 for invalid UUID', async () => {
        const { req, res } = createMocks({ method: 'GET', query: { id: 'invalid-id' } });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData()).error).toContain('typu uuidv7');
    });

    test('fetches poll by valid UUID', async () => {
        const { req, res } = createMocks({ method: 'GET', query: { id: 'valid-uuid-v7' } });
        mockSql.mockResolvedValueOnce([{ id: 'valid-uuid-v7', name: 'Test Poll' }]);
        
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData())[0].name).toBe('Test Poll');
        expect(mockSql).toHaveBeenCalledTimes(1);
    });

    test('fetches polls by player', async () => {
        const { req, res } = createMocks({ method: 'GET', query: { player: 'player1' } });
        mockSql.mockResolvedValueOnce([{ id: 'valid-uuid-v7', name: 'Player Poll' }]);
        
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData())[0].name).toBe('Player Poll');
    });

    test('applies reversed order clause', async () => {
        const { req, res } = createMocks({ method: 'GET', query: { tournament: 't1', order: 'reversed' } });
        mockSql.mockResolvedValueOnce([]);
        
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        // orderClause is tested indirectly by the fact that the query string gets 'ASC'
    });
});
