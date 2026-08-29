import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/players';

const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Players API Endpoint (/api/players)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('returns all players with mapped tournaments', async () => {
        const { req, res } = createMocks({ method: 'GET' });
        
        mockSql.mockResolvedValueOnce([
            { id: 'player1', displayed_name: 'Player 1', pfp_base64: null },
            { id: 'player2', displayed_name: 'Player 2', pfp_base64: null }
        ]);
        mockSql.mockResolvedValueOnce([
            { tournament_id: 't1', player_id: 'player1', attended: true, finished: true, position: 1, total_points: 100 },
            { tournament_id: 't1', player_id: 'player2', attended: false, finished: true, position: null, total_points: null }
        ]);

        await handler(req as any, res as any);
        
        expect(res._getStatusCode()).toBe(200);
        const data = JSON.parse(res._getData());
        
        expect(Object.keys(data).length).toBe(2);
        expect(data['player1'].displayed_name).toBe('Player 1');
        
        // player1 attended t1
        expect(data['player1'].tournaments['t1'].position).toBe(1);
        
        // player2 didn't attend t1 (attended: false)
        expect(data['player2'].tournaments['t1']).toBeUndefined();
    });

    test('filters by tournament ID', async () => {
        const { req, res } = createMocks({ method: 'GET', query: { tournament: 't1' } });
        
        mockSql.mockResolvedValueOnce([
            { id: 'player1', displayed_name: 'Player 1', pfp_base64: null }
        ]);
        mockSql.mockResolvedValueOnce([
            { tournament_id: 't1', player_id: 'player1', attended: true, finished: true, position: 1, total_points: 100 }
        ]);

        await handler(req as any, res as any);
        
        expect(res._getStatusCode()).toBe(200);
        const data = JSON.parse(res._getData());
        expect(Object.keys(data).length).toBe(1);
    });
});
