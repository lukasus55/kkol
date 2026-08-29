import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/events';

const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Events API Endpoint (/api/events)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('returns calendar format by default', async () => {
        const { req, res } = createMocks({ method: 'GET' });
        
        mockSql.mockResolvedValueOnce([
            { id: 1, tournament_id: 't1', creator_id: 'user1', event_date: new Date('2025-01-01'), name: 'Event 1', is_major: true }
        ]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        
        const data = JSON.parse(res._getData());
        expect(data[0].title).toBe('Event 1');
        expect(data[0].backgroundColor).toBe('var(--color-lime-moss)'); // is_major = true
    });

    test('returns list format when requested', async () => {
        const { req, res } = createMocks({ method: 'GET', query: { format: 'list', tournament: 't1' } });
        
        mockSql.mockResolvedValueOnce([
            { id: 1, tournament_id: 't1', creator_id: 'user1', event_date: new Date('2025-01-01'), name: 'Event 1', is_major: true }
        ]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        
        const data = JSON.parse(res._getData());
        expect(data[0].name).toBe('Event 1');
        expect(data[0].tournament_id).toBe('t1');
    });
});
