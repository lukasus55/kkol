import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/gd';

vi.mock('../../db.js', () => {
    const sqlMock = vi.fn((strings, ...values) => {
        const query = strings.join('');
        
        if (query.includes('gd_levels')) {
            return Promise.resolve([
                { id: 1, name: 'Stereo Madness', difficulty: 'easy', finished: true },
                { id: 2, name: 'Back on Track', difficulty: 'easy', finished: false }
            ]);
        }
        
        if (query.includes('gd_scores')) {
            return Promise.resolve([
                { level_id: 1, player_id: 'user1', position: 1, score: 100 },
                { level_id: 1, player_id: 'user2', position: 2, score: 50 },
                { level_id: 2, player_id: 'user1', position: 1, score: 10 }
            ]);
        }
        
        return Promise.resolve([]);
    });

    return { default: sqlMock };
});

describe('GD API Endpoint (/api/gd)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('returns correctly mapped levels and scores', async () => {
        const { req, res } = createMocks({ method: 'GET' });

        await handler(req as any, res as any);

        expect(res._getStatusCode()).toBe(200);
        
        const data = JSON.parse(res._getData());
        
        expect(data.levels).toBeDefined();
        expect(data.levels.length).toBe(2);
        
        // Check first level mapping
        expect(data.levels[0].name).toBe('Stereo Madness');
        expect(data.levels[0].players.length).toBe(2);
        expect(data.levels[0].players[0].id).toBe('user1');
        
        // Check second level mapping
        expect(data.levels[1].players.length).toBe(1);
        expect(data.levels[1].players[0].score).toBe(10);
    });
});
