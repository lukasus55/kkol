import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/poll_player_answers';
import { hasTournamentPermission, isPartOfTournament } from '../../public/js/utils/permissionChecks.js';
import { verifySession } from '../../lib/auth';

vi.mock('../../lib/auth', () => ({
    verifySession: vi.fn(),
    AUTH_COOKIE_NAME: 'auth_token'
}));
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

    test('rejects unauthenticated requests', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce(null);
        const { req, res } = createMocks({ 
            method: 'GET', 
            query: { poll: 'valid-uuid-v7', player: 'user1' } 
        });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
    });

    test('returns own answers without permission check', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'user', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'GET', 
            query: { poll: 'valid-uuid-v7', player: 'user1' }
        });

        mockSql.mockResolvedValueOnce([{ answers_map: { q1: ['opt1'] } }]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData())).toEqual({ q1: ['opt1'] });
    });

    test('allows any tournament participant to view other player answers', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'user', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'GET', 
            query: { poll: 'valid-uuid-v7', player: 'user2' }
        });

        // Query: poll exists
        mockSql.mockResolvedValueOnce([{ tournament_id: 't1' }]);
        // User1 is part of tournament t1
        vi.mocked(isPartOfTournament).mockResolvedValueOnce(true);

        mockSql.mockResolvedValueOnce([{ answers_map: { q2: ['opt2'] } }]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData())).toEqual({ q2: ['opt2'] });
    });

    test('allows tournament organizer/admin to view other player answers', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'admin1', role: 'admin', displayed_name: 'Admin', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'GET', 
            query: { poll: 'valid-uuid-v7', player: 'user2' }
        });

        mockSql.mockResolvedValueOnce([{ tournament_id: 't1' }]);
        vi.mocked(isPartOfTournament).mockResolvedValueOnce(false);
        vi.mocked(hasTournamentPermission).mockResolvedValueOnce(true);

        mockSql.mockResolvedValueOnce([{ answers_map: { q2: ['opt2'] } }]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
    });

    test('blocks access if user is neither participant nor organizer', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'user', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'GET', 
            query: { poll: 'valid-uuid-v7', player: 'user2' }
        });

        mockSql.mockResolvedValueOnce([{ tournament_id: 't1' }]);
        vi.mocked(isPartOfTournament).mockResolvedValueOnce(false);
        vi.mocked(hasTournamentPermission).mockResolvedValueOnce(false);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(403);
        expect(JSON.parse(res._getData()).error).toContain('Brak uprawnień');
    });

    test('returns 400 when parameters are missing', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'user', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ method: 'GET', query: { poll: 'valid-uuid-v7' } });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
    });

    test('returns 404 when poll does not exist', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'user', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'GET', 
            query: { poll: 'valid-uuid-v7', player: 'user2' }
        });

        mockSql.mockResolvedValueOnce([]); // Poll not found

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(404);
        expect(JSON.parse(res._getData()).error).toBe('Ankieta nie istnieje.');
    });
});
