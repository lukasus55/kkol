import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/event_results';

const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Event Results API (/api/event_results)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('returns 422 if no parameters provided', async () => {
        const { req, res } = createMocks({ method: 'GET' });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(422);
    });

    test('groups results correctly by event_id', async () => {
        const { req, res } = createMocks({ method: 'GET', query: { tournament: 't1' } });
        
        mockSql.mockResolvedValueOnce([
            { event_id: 1, event_name: 'E1', is_major_event: true, tournament_id: 't1', player_id: 'p1', displayed_name: 'P 1', position: 1, points: 10 },
            { event_id: 1, event_name: 'E1', is_major_event: true, tournament_id: 't1', player_id: 'p2', displayed_name: 'P 2', position: 2, points: 5 },
            { event_id: 2, event_name: 'E2', is_major_event: false, tournament_id: 't1', player_id: 'p1', displayed_name: 'P 1', position: 1, points: 5 }
        ]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        
        const data = JSON.parse(res._getData());
        expect(data.length).toBe(2); // 2 events
        
        const event1 = data.find((e: any) => e.event_id === 1);
        expect(event1.results.length).toBe(2);
        
        const event2 = data.find((e: any) => e.event_id === 2);
        expect(event2.results.length).toBe(1);
    });
});
