import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/poll_question_update';
import jwt from 'jsonwebtoken';
import { hasTournamentPermission, isPartOfTournament } from '../../public/js/utils/permissionChecks.js';

vi.mock('jsonwebtoken', () => ({ default: { verify: vi.fn() } }));
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

    test('rejects missing payload', async () => {
        const { req, res } = createMocks({ 
            method: 'POST',
            headers: { cookie: 'auth_token=token' },
            body: {}
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
    });

    test('validates name length', async () => {
        const { req, res } = createMocks({ 
            method: 'POST',
            headers: { cookie: 'auth_token=token' },
            body: { poll_id: 'p1', questions: [{ name: 'a' }] }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        mockSql.mockResolvedValueOnce([{ tournament_id: 't1', rights_level: 2 }]);
        vi.mocked(isPartOfTournament).mockResolvedValueOnce(true);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData()).error).toContain('co najmniej 3 znaki');
    });

    test('executes transaction on successful update', async () => {
        const { req, res } = createMocks({ 
            method: 'POST',
            headers: { cookie: 'auth_token=token' },
            body: { 
                poll_id: 'p1', 
                questions: [{ id: 'q1', name: 'Valid Question', sort_order: 1, multiple_choice: false, options: [{ name: 'Opt 1' }], label_ids: [] }] 
            }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

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
