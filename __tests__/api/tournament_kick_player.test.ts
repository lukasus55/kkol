import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/tournament_kick_player';
import jwt from 'jsonwebtoken';

vi.mock('jsonwebtoken', () => ({ default: { verify: vi.fn() } }));
const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Tournament Kick Player API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('blocks kicking owner', async () => {
        const { req, res } = createMocks({ 
            method: 'POST',
            headers: { cookie: 'auth_token=token' },
            body: { tournament_id: 't1', target_player_id: 'owner_user' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        mockSql.mockResolvedValueOnce([{ role: 'manager' }]); // requester
        mockSql.mockResolvedValueOnce([{ role: 'owner' }]); // target

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(403);
        expect(JSON.parse(res._getData()).error).toContain('właściciela');
    });

    test('blocks manager from kicking another manager', async () => {
        const { req, res } = createMocks({ 
            method: 'POST',
            headers: { cookie: 'auth_token=token' },
            body: { tournament_id: 't1', target_player_id: 'other_manager' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        mockSql.mockResolvedValueOnce([{ role: 'manager' }]); // requester
        mockSql.mockResolvedValueOnce([{ role: 'manager' }]); // target

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(403);
        expect(JSON.parse(res._getData()).error).toContain('innego managera');
    });

    test('successfully kicks player', async () => {
        const { req, res } = createMocks({ 
            method: 'POST',
            headers: { cookie: 'auth_token=token' },
            body: { tournament_id: 't1', target_player_id: 'normal_user' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        mockSql.mockResolvedValueOnce([{ role: 'owner' }]); // requester
        mockSql.mockResolvedValueOnce([]); // target (not organizer)
        mockSql.mockResolvedValueOnce([]); // delete organizer
        mockSql.mockResolvedValueOnce([]); // delete result

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
    });
});
