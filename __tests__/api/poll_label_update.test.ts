import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/poll_label_update';
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
const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Poll Label Update API (/api/poll_label_update)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('rejects unauthenticated requests', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce(null);
        const { req, res } = createMocks({ method: 'POST', body: { id: 1 } });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
    });

    test('validates name length constraints', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'user', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { id: 1, name: 'ab', hex: '#000' }
        });

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData()).error).toContain('co najmniej 3 znaki');
    });

    test('updates label if permissions exist', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'user', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { id: 1, name: 'ValidName', hex: '#000' }
        });

        mockSql.mockResolvedValueOnce([{ poll_id: 'p1' }]); // labelCheck
        mockSql.mockResolvedValueOnce([{ tournament_id: 't1', rights_level: 1 }]); // pollCheck
        
        vi.mocked(isPartOfTournament).mockResolvedValueOnce(false);
        vi.mocked(hasTournamentPermission).mockResolvedValueOnce(true);

        mockSql.mockResolvedValueOnce([]); // UPDATE

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
    });
});
