import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/tournaments';

const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Tournaments API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('returns tournaments with standings', async () => {
        const { req, res } = createMocks({ method: 'GET' });
        
        mockSql.mockResolvedValueOnce([
            { id: 't1', displayed_name: 'Tournament 1', page_exists: false, page_url: null, finished: true, end_date: new Date(), displayed_date: '2024', tier: 'S', player_count: 2 }
        ]);
        
        mockSql.mockResolvedValueOnce([
            { tournament_id: 't1', player_id: 'p1', attended: true, finished: true, position: 1, total_points: 100, player_name: 'Player 1' },
            { tournament_id: 't1', player_id: 'p2', attended: true, finished: true, position: 2, total_points: 50, player_name: 'Player 2' },
            { tournament_id: 't1', player_id: 'p3', attended: false } // unattended
        ]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        
        const data = JSON.parse(res._getData());
        expect(data.t1.displayed_name).toBe('Tournament 1');
        expect(data.t1.standings.length).toBe(2);
        expect(data.t1.standings[0].id).toBe('p1');
        expect(data.t1.standings[1].id).toBe('p2');
    });
});
