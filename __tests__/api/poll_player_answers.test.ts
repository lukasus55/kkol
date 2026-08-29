import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/poll_player_answers';
import jwt from 'jsonwebtoken';
import { hasTournamentPermission, isPartOfTournament } from '../../public/js/utils/permissionChecks.js';

vi.mock('jsonwebtoken', () => ({ default: { verify: vi.fn() } }));
vi.mock('../../public/js/utils/permissionChecks.js', () => ({
    hasTournamentPermission: vi.fn(),
    isPartOfTournament: vi.fn()
}));
vi.mock('../../public/js/utils/helpers.js', () => ({
    isUUIDv7: vi.fn().mockImplementation((id: string) => id === 'valid-uuid-v7')
}));

const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Poll Player Answers API (/api/poll_player_answers)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('returns own answers without permission check', async () => {
        const { req, res } = createMocks({ 
            method: 'GET', 
            query: { poll: 'valid-uuid-v7', player: 'user1' },
            headers: { cookie: 'auth_token=token' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        mockSql.mockResolvedValueOnce([{ answers_map: { q1: ['opt1'] } }]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData())).toEqual({ q1: ['opt1'] });
    });

    test('checks permissions if viewing other player answers', async () => {
        const { req, res } = createMocks({ 
            method: 'GET', 
            query: { poll: 'valid-uuid-v7', player: 'user2' },
            headers: { cookie: 'auth_token=token' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any); // different from user2

        mockSql.mockResolvedValueOnce([{ tournament_id: 't1', rights_level: 2 }]);
        vi.mocked(isPartOfTournament).mockResolvedValueOnce(true);
        // allowedByRules will be true (rights_level >= 2)

        mockSql.mockResolvedValueOnce([{ answers_map: { q2: ['opt2'] } }]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData())).toEqual({ q2: ['opt2'] });
    });

    test('blocks access if permissions lacking', async () => {
        const { req, res } = createMocks({ 
            method: 'GET', 
            query: { poll: 'valid-uuid-v7', player: 'user2' },
            headers: { cookie: 'auth_token=token' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        mockSql.mockResolvedValueOnce([{ tournament_id: 't1', rights_level: 1 }]);
        vi.mocked(isPartOfTournament).mockResolvedValueOnce(false);
        vi.mocked(hasTournamentPermission).mockResolvedValueOnce(false);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(403);
    });
});
