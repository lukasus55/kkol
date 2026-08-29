import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/poll_delete';
import jwt from 'jsonwebtoken';
import { hasTournamentPermission } from '../../public/js/utils/permissionChecks.js';

vi.mock('jsonwebtoken', () => ({ default: { verify: vi.fn() } }));
vi.mock('../../public/js/utils/permissionChecks.js', () => ({
    hasTournamentPermission: vi.fn()
}));
const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Poll Delete API (/api/poll_delete)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('returns 404 if poll does not exist', async () => {
        const { req, res } = createMocks({ 
            method: 'POST', 
            headers: { cookie: 'auth_token=token' },
            body: { id: 'poll-123' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);
        
        mockSql.mockResolvedValueOnce([]); // no poll found

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(404);
        expect(JSON.parse(res._getData()).error).toContain('nie istnieje');
    });

    test('deletes poll successfully if user has permissions', async () => {
        const { req, res } = createMocks({ 
            method: 'POST', 
            headers: { cookie: 'auth_token=token' },
            body: { id: 'poll-123' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);
        
        mockSql.mockResolvedValueOnce([{ tournament_id: 't1' }]); // poll check
        mockSql.mockResolvedValueOnce([{ finished: false }]); // tournament check
        
        vi.mocked(hasTournamentPermission).mockResolvedValueOnce(true);
        mockSql.mockResolvedValueOnce([]); // delete execution

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData()).success).toBe(true);
    });

    test('blocks deletion if user lacks permissions', async () => {
        const { req, res } = createMocks({ 
            method: 'POST', 
            headers: { cookie: 'auth_token=token' },
            body: { id: 'poll-123' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);
        
        mockSql.mockResolvedValueOnce([{ tournament_id: 't1' }]);
        mockSql.mockResolvedValueOnce([{ finished: false }]);
        
        vi.mocked(hasTournamentPermission).mockResolvedValueOnce(false);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(403);
    });
});
