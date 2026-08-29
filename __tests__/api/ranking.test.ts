import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/ranking';

const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Ranking API Endpoint (/api/ranking)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('returns empty array if no tournaments exist', async () => {
        const { req, res } = createMocks({ method: 'GET' });
        mockSql.mockResolvedValueOnce([]); // S tournaments
        mockSql.mockResolvedValueOnce([]); // AB tournaments
        
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData())).toEqual([]);
    });

    test('calculates complex points correctly and handles ties', async () => {
        const { req, res } = createMocks({ method: 'GET' });
        
        mockSql.mockResolvedValueOnce([{ id: 's_tour1', tier: 'S' }]);
        mockSql.mockResolvedValueOnce([{ id: 'a_tour1', tier: 'A' }]);
        
        mockSql.mockResolvedValueOnce([
            { tournament_id: 's_tour1', tournament_tier: 'S', player_id: 'p1', player_position: 1, player_name: 'Player 1', player_pfp_base64: null },
            { tournament_id: 's_tour1', tournament_tier: 'S', player_id: 'p2', player_position: 2, player_name: 'Player 2', player_pfp_base64: null },
            // tie for 1st in A tier
            { tournament_id: 'a_tour1', tournament_tier: 'A', player_id: 'p1', player_position: 1, player_name: 'Player 1', player_pfp_base64: null },
            { tournament_id: 'a_tour1', tournament_tier: 'A', player_id: 'p3', player_position: 1, player_name: 'Player 3', player_pfp_base64: null }
        ]);
        
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        
        const data = JSON.parse(res._getData());
        
        // p1: 1st in S (15 pts), tied 1st in A (7 + 4 = 11 / 2 = 5.5). Total = 20.5
        // p2: 2nd in S (10 pts). Total = 10
        // p3: tied 1st in A (5.5 pts). Total = 5.5
        
        const player1 = data.find((p: any) => p.id === 'p1');
        expect(player1.ranking).toBe("20.50");
        
        const player2 = data.find((p: any) => p.id === 'p2');
        expect(player2.ranking).toBe("10.00");
        
        const player3 = data.find((p: any) => p.id === 'p3');
        expect(player3.ranking).toBe("5.50");
    });
});
