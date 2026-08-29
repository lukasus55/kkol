import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/tournament_add_player';
import jwt from 'jsonwebtoken';

vi.mock('jsonwebtoken', () => ({ default: { verify: vi.fn() } }));
const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Tournament Add Player API', () => {
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

    test('blocks if user is not owner or manager', async () => {
        const { req, res } = createMocks({ 
            method: 'POST',
            headers: { cookie: 'auth_token=token' },
            body: { tournament_id: 't1', new_player_id: 'p2' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        mockSql.mockResolvedValueOnce([{ role: 'organizer' }]); // Not owner/manager

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(403);
    });

    test('blocks if duplicate player', async () => {
        const { req, res } = createMocks({ 
            method: 'POST',
            headers: { cookie: 'auth_token=token' },
            body: { tournament_id: 't1', new_player_id: 'p2' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        mockSql.mockResolvedValueOnce([{ role: 'manager' }]);
        mockSql.mockResolvedValueOnce([{ id: 'p2' }]); // player exists
        mockSql.mockResolvedValueOnce([{ player_id: 'p2' }]); // duplicate result

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData()).error).toContain('już zapisany');
    });

    test('successfully adds player', async () => {
        const { req, res } = createMocks({ 
            method: 'POST',
            headers: { cookie: 'auth_token=token' },
            body: { tournament_id: 't1', new_player_id: 'p2' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        mockSql.mockResolvedValueOnce([{ role: 'owner' }]);
        mockSql.mockResolvedValueOnce([{ id: 'p2' }]);
        mockSql.mockResolvedValueOnce([]); // no duplicate
        mockSql.mockResolvedValueOnce([]); // INSERT

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
    });
});
