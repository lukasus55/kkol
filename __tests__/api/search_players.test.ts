import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/search_players';

const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Search Players API Endpoint (/api/search_players)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('returns empty array if query is missing or empty', async () => {
        const { req, res } = createMocks({ method: 'GET', query: { q: '   ' } });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData())).toEqual([]);
        expect(mockSql).not.toHaveBeenCalled();
    });

    test('returns results from DB trigram search', async () => {
        const { req, res } = createMocks({ method: 'GET', query: { q: 'kuku' } });
        
        const mockPlayers = [
            { id: 'user1', displayed_name: 'Kukula', pfp_base64: null }
        ];
        mockSql.mockResolvedValueOnce(mockPlayers);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData())).toEqual(mockPlayers);
        expect(mockSql).toHaveBeenCalledTimes(1);
    });
});
