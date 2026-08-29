import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/tournaments_active';
import jwt from 'jsonwebtoken';

vi.mock('jsonwebtoken', () => ({ default: { verify: vi.fn() } }));
const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Active Tournaments API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('admin sees all active tournaments', async () => {
        const { req, res } = createMocks({ 
            method: 'GET',
            headers: { cookie: 'auth_token=token' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'admin1' } as any);

        mockSql.mockResolvedValueOnce([{ role: 'admin' }]);
        mockSql.mockResolvedValueOnce([{ id: 't1', displayed_name: 'T1' }]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        const data = JSON.parse(res._getData());
        expect(data.length).toBe(1);
    });

    test('user sees only their assigned active tournaments', async () => {
        const { req, res } = createMocks({ 
            method: 'GET',
            headers: { cookie: 'auth_token=token' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        mockSql.mockResolvedValueOnce([{ role: 'user' }]);
        mockSql.mockResolvedValueOnce([{ id: 't2', displayed_name: 'T2' }]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        const data = JSON.parse(res._getData());
        expect(data[0].id).toBe('t2');
    });
});
