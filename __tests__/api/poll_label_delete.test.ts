import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/poll_label_delete';
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

describe('Poll Label Delete API (/api/poll_label_delete)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('rejects unauthenticated requests', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce(null);
        const { req, res } = createMocks({ method: 'POST', body: { id: 1 } });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
    });

    test('rejects missing id', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'user', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: {}
        });

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
    });

    test('returns 404 if label not found', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'user', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { id: 1 }
        });
        
        mockSql.mockResolvedValueOnce([]); // no label

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(404);
        expect(JSON.parse(res._getData()).error).toContain('etykiety która nie istnieje');
    });

    test('deletes label if allowed', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'user', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { id: 1 }
        });
        
        mockSql.mockResolvedValueOnce([{ poll_id: 'p1' }]); // label found
        mockSql.mockResolvedValueOnce([{ tournament_id: 't1', rights_level: 3 }]); // poll found
        
        vi.mocked(isPartOfTournament).mockResolvedValueOnce(true);

        mockSql.mockResolvedValueOnce([]); // DELETE

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
    });
});
