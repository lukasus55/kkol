import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/tournament_save';
import jwt from 'jsonwebtoken';

vi.mock('jsonwebtoken', () => ({ default: { verify: vi.fn() } }));
const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Tournament Save API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('rejects missing data', async () => {
        const { req, res } = createMocks({ 
            method: 'POST',
            headers: { cookie: 'auth_token=token' },
            body: {}
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
    });

    test('rejects out of bounds dates', async () => {
        const { req, res } = createMocks({ 
            method: 'POST',
            headers: { cookie: 'auth_token=token' },
            body: { 
                tournament_id: 't1', 
                results: [], 
                tournament_info: { displayed_name: 'T', displayed_date: 'D', finished: true, end_date: '2020-01-01' } 
            }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData()).error).toContain('wcześniejsz');
    });

    test('saves tournament data successfully', async () => {
        const { req, res } = createMocks({ 
            method: 'POST',
            headers: { cookie: 'auth_token=token' },
            body: { 
                tournament_id: 't1', 
                results: [{ player_id: 'p1', position: 1, total_points: 100 }], 
                tournament_info: { displayed_name: 'T', displayed_date: 'D', finished: true, end_date: '2025-01-01' } 
            }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        mockSql.mockResolvedValueOnce([{ role: 'owner' }]);
        mockSql.mockResolvedValueOnce([]); // update tournaments
        mockSql.mockResolvedValueOnce([]); // update results

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
    });
});
