import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/poll_question_update';
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
vi.mock('uuidv7', () => ({ uuidv7: vi.fn().mockReturnValue('new-uuid') }));

const { mockSql } = vi.hoisted(() => {
    const fn: any = vi.fn();
    fn.begin = vi.fn();
    return { mockSql: fn };
});
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Poll Question Update API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('rejects unauthenticated requests', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce(null);
        const { req, res } = createMocks({ 
            method: 'POST',
            body: {}
        });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
    });

    test('rejects missing payload', async () => {
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

    test('validates name length', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'user', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST',
            body: { poll_id: 'p1', questions: [{ name: 'a' }] }
        });

        mockSql.mockResolvedValueOnce([{ tournament_id: 't1', rights_level: 2 }]);
        vi.mocked(isPartOfTournament).mockResolvedValueOnce(true);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData()).error).toContain('co najmniej 3 znaki');
    });

    test('executes transaction on successful update', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'user', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST',
            body: { 
                poll_id: 'p1', 
                questions: [{ id: 'q1', name: 'Valid Question', sort_order: 1, multiple_choice: false, options: [{ name: 'Opt 1' }], label_ids: [] }] 
            }
        });

        mockSql.mockResolvedValueOnce([{ tournament_id: 't1', rights_level: 2 }]);
        vi.mocked(isPartOfTournament).mockResolvedValueOnce(true);
        
        mockSql.begin.mockImplementationOnce(async (cb: any) => {
            const mockTx = vi.fn();
            await cb(mockTx);
        });

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData()).success).toBe(true);
    });
});
