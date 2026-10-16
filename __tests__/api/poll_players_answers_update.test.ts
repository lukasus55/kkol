import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/poll_players_answers_update';
import { verifySession } from '../../lib/auth';

vi.mock('../../lib/auth', () => ({
    verifySession: vi.fn(),
    AUTH_COOKIE_NAME: 'auth_token'
}));
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

    test('rejects unauthenticated requests', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce(null);
        const { req, res } = createMocks({ method: 'POST', body: {} });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
    });

    test('rejects missing poll_id', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'user', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { answers: {} }
        });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
    });

    test('rejects if voting period has not started', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'user', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { poll_id: 'valid-uuid-v7', answers: {} }
        });

        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        mockSql.mockResolvedValueOnce([{ tournament_id: 't1', start_date: futureDate.toISOString() }]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(403);
        expect(JSON.parse(res._getData()).error).toContain('jeszcze się nie rozpoczęło');
    });

    test('rejects if voting period has ended', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'user', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { poll_id: 'valid-uuid-v7', answers: {} }
        });

        const pastDate = new Date();
        pastDate.setFullYear(pastDate.getFullYear() - 1);
        mockSql.mockResolvedValueOnce([{ tournament_id: 't1', start_date: pastDate.toISOString(), end_date: pastDate.toISOString() }]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(403);
        expect(JSON.parse(res._getData()).error).toContain('zostało już zakończone');
    });

    test('rejects if user has no tournament access', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'user', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { poll_id: 'valid-uuid-v7', answers: {} }
        });

        const pastDate = new Date(Date.now() - 10000);
        const futureDate = new Date(Date.now() + 10000);
        mockSql.mockResolvedValueOnce([{ tournament_id: 't1', start_date: pastDate.toISOString(), end_date: futureDate.toISOString() }]);
        mockSql.mockResolvedValueOnce([{ global_role: 'player', is_organizer: false, is_player: false }]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(403);
        expect(JSON.parse(res._getData()).error).toContain('Musisz być przypisany do turnieju');
    });

    test('throws security violation if option IDs do not match', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'user', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { poll_id: 'valid-uuid-v7', answers: { q1: ['123'] } }
        });

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
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData()).error).toContain('nieprawidłowe opcje');
    });

    test('rejects multiple options for single-choice question', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'user', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { poll_id: 'valid-uuid-v7', answers: { q1: ['10', '11'] } }
        });

        const pastDate = new Date(Date.now() - 10000);
        const futureDate = new Date(Date.now() + 10000);

        mockSql.mockResolvedValueOnce([{ tournament_id: 't1', start_date: pastDate.toISOString(), end_date: futureDate.toISOString() }]);
        mockSql.mockResolvedValueOnce([{ global_role: 'admin', is_organizer: false, is_player: false }]);

        mockSql.begin.mockImplementationOnce(async (cb: any) => {
            const mockTx = vi.fn().mockResolvedValueOnce([
                { id: '10', question_id: 'q1', multiple_choice: false },
                { id: '11', question_id: 'q1', multiple_choice: false }
            ]);
            await cb(mockTx);
        });

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData()).error).toContain('jednokrotnego wyboru');
    });

    test('successfully saves answers (200 OK)', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'user', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { poll_id: 'valid-uuid-v7', answers: { q1: ['10'], q2: ['20', '21'] } }
        });

        const pastDate = new Date(Date.now() - 10000);
        const futureDate = new Date(Date.now() + 10000);

        mockSql.mockResolvedValueOnce([{ tournament_id: 't1', start_date: pastDate.toISOString(), end_date: futureDate.toISOString() }]);
        mockSql.mockResolvedValueOnce([{ global_role: 'player', is_organizer: false, is_player: true }]);

        mockSql.begin.mockImplementationOnce(async (cb: any) => {
            const mockTx = vi.fn()
                .mockResolvedValueOnce([
                    { id: '10', question_id: 'q1', multiple_choice: false },
                    { id: '20', question_id: 'q2', multiple_choice: true },
                    { id: '21', question_id: 'q2', multiple_choice: true }
                ]) // validOptions
                .mockResolvedValueOnce([]) // DELETE checked_answers
                .mockResolvedValueOnce([]); // INSERT checked_answers
            await cb(mockTx);
        });

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData()).success).toBe(true);
    });

    test('successfully clears answers when answers is empty object (200 OK)', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'user', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { poll_id: 'valid-uuid-v7', answers: {} }
        });

        const pastDate = new Date(Date.now() - 10000);
        const futureDate = new Date(Date.now() + 10000);

        mockSql.mockResolvedValueOnce([{ tournament_id: 't1', start_date: pastDate.toISOString(), end_date: futureDate.toISOString() }]);
        mockSql.mockResolvedValueOnce([{ global_role: 'admin', is_organizer: false, is_player: false }]);

        mockSql.begin.mockImplementationOnce(async (cb: any) => {
            const mockTx = vi.fn().mockResolvedValueOnce([]); // DELETE checked_answers
            await cb(mockTx);
        });

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData()).success).toBe(true);
    });
});
