import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/event_create';
import jwt from 'jsonwebtoken';

vi.mock('jsonwebtoken', () => ({ default: { verify: vi.fn() } }));
const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Event Create API (/api/event_create)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('rejects unauthenticated requests', async () => {
        const { req, res } = createMocks({ method: 'POST', body: {} });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
    });

    test('validates minimum name length', async () => {
        const { req, res } = createMocks({ 
            method: 'POST', 
            headers: { cookie: 'auth_token=token' },
            body: { tournament_id: 't1', name: 'ab', is_major: false, start_date: '2025-01-01' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData()).error).toContain('co najmniej 3 znaki');
    });

    test('checks tournament finished status and auth', async () => {
        const { req, res } = createMocks({ 
            method: 'POST', 
            headers: { cookie: 'auth_token=token' },
            body: { tournament_id: 't1', name: 'Valid Event', is_major: false, start_date: '2025-01-01' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        // 1st query: check tournament
        mockSql.mockResolvedValueOnce([{ finished: false }]);
        // 2nd queries: Promise.all [globalRole, tournamentRole]
        mockSql.mockResolvedValueOnce([{ role: 'user' }]); // global
        mockSql.mockResolvedValueOnce([{ role: 'manager' }]); // tournament auth
        
        // Final insert
        mockSql.mockResolvedValueOnce([{ id: 99 }]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData()).id).toBe(99);
    });
});
