import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/tournament_toggle_attendance';
import jwt from 'jsonwebtoken';

vi.mock('jsonwebtoken', () => ({ default: { verify: vi.fn() } }));
const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Tournament Toggle Attendance API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('validates payload', async () => {
        const { req, res } = createMocks({ 
            method: 'POST',
            headers: { cookie: 'auth_token=token' },
            body: { tournament_id: 't1' } // missing target
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
    });

    test('rejects unauthorized users', async () => {
        const { req, res } = createMocks({ 
            method: 'POST',
            headers: { cookie: 'auth_token=token' },
            body: { tournament_id: 't1', target_player_id: 'p1' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        mockSql.mockResolvedValueOnce([{ role: 'user' }]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(403);
    });

    test('successfully toggles attendance', async () => {
        const { req, res } = createMocks({ 
            method: 'POST',
            headers: { cookie: 'auth_token=token' },
            body: { tournament_id: 't1', target_player_id: 'p1' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        mockSql.mockResolvedValueOnce([{ role: 'manager' }]);
        mockSql.mockResolvedValueOnce([]); // update query execution

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
    });
});
