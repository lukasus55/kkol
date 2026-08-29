import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/poll_players_answers_update';
import jwt from 'jsonwebtoken';

vi.mock('jsonwebtoken', () => ({ default: { verify: vi.fn() } }));
vi.mock('../../public/js/utils/helpers.js', () => ({
    isUUIDv7: vi.fn().mockImplementation((id: string) => id === 'valid-uuid-v7')
}));

const { mockSql } = vi.hoisted(() => {
    const fn: any = vi.fn();
    fn.begin = vi.fn();
    return { mockSql: fn };
});
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Poll Players Answers Update API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('rejects missing poll_id', async () => {
        const { req, res } = createMocks({ 
            method: 'POST', 
            headers: { cookie: 'auth_token=token' },
            body: { answers: {} }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
    });

    test('rejects if voting period has not started', async () => {
        const { req, res } = createMocks({ 
            method: 'POST', 
            headers: { cookie: 'auth_token=token' },
            body: { poll_id: 'valid-uuid-v7', answers: {} }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        mockSql.mockResolvedValueOnce([{ tournament_id: 't1', start_date: futureDate.toISOString() }]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(403);
        expect(JSON.parse(res._getData()).error).toContain('jeszcze się nie rozpoczęło');
    });

    test('throws security violation if option IDs do not match', async () => {
        const { req, res } = createMocks({ 
            method: 'POST', 
            headers: { cookie: 'auth_token=token' },
            body: { poll_id: 'valid-uuid-v7', answers: { q1: ['opt1'] } }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        const pastDate = new Date();
        pastDate.setFullYear(pastDate.getFullYear() - 1);
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);

        mockSql.mockResolvedValueOnce([{ tournament_id: 't1', start_date: pastDate.toISOString(), end_date: futureDate.toISOString() }]);
        mockSql.mockResolvedValueOnce([{ global_role: 'admin', is_organizer: false, is_player: false }]);
        
        // Mock transaction execution
        mockSql.begin.mockImplementationOnce(async (cb: any) => {
            const mockTx = vi.fn().mockResolvedValueOnce([]); // validOptions returns empty array, but we asked for 1
            await cb(mockTx);
        });

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400); // Because error.message === "SECURITY_VIOLATION" is handled as 400
        expect(JSON.parse(res._getData()).error).toContain('nieprawidłowe opcje');
    });
});
