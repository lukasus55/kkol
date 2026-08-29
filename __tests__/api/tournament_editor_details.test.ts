import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/tournament_editor_details';
import jwt from 'jsonwebtoken';

vi.mock('jsonwebtoken', () => ({ default: { verify: vi.fn() } }));
const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Tournament Editor Details API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('rejects missing tournamentId', async () => {
        const { req, res } = createMocks({ 
            method: 'GET',
            headers: { cookie: 'auth_token=token' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
    });

    test('blocks unauthorized users', async () => {
        const { req, res } = createMocks({ 
            method: 'GET',
            query: { tournamentId: 't1' },
            headers: { cookie: 'auth_token=token' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        mockSql.mockResolvedValueOnce([{ role: 'organizer' }]); // Not owner/manager

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(403);
    });

    test('returns editor details', async () => {
        const { req, res } = createMocks({ 
            method: 'GET',
            query: { tournamentId: 't1' },
            headers: { cookie: 'auth_token=token' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        mockSql.mockResolvedValueOnce([{ role: 'manager' }]);
        mockSql.mockResolvedValueOnce([{ id: 'p1', displayed_name: 'P1', attended: true, position: 1, total_points: 10, organizer_role: null }]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        
        const data = JSON.parse(res._getData());
        expect(data.current_user_role).toBe('manager');
        expect(data.members[0].id).toBe('p1');
    });
});
