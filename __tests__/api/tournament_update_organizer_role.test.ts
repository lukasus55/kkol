import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/tournament_update_organizer_role';
import jwt from 'jsonwebtoken';

vi.mock('jsonwebtoken', () => ({ default: { verify: vi.fn() } }));
const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Tournament Update Organizer Role API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('validates action type', async () => {
        const { req, res } = createMocks({ 
            method: 'POST',
            headers: { cookie: 'auth_token=token' },
            body: { tournament_id: 't1', target_player_id: 'p2', action: 'invalid' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'owner_user' } as any);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
    });

    test('rejects non-owner from updating roles', async () => {
        const { req, res } = createMocks({ 
            method: 'POST',
            headers: { cookie: 'auth_token=token' },
            body: { tournament_id: 't1', target_player_id: 'p2', action: 'promote' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'manager_user' } as any);

        mockSql.mockResolvedValueOnce([{ role: 'manager' }]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(403);
    });

    test('successfully promotes a user', async () => {
        const { req, res } = createMocks({ 
            method: 'POST',
            headers: { cookie: 'auth_token=token' },
            body: { tournament_id: 't1', target_player_id: 'p2', action: 'promote' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'owner_user' } as any);

        mockSql.mockResolvedValueOnce([{ role: 'owner' }]);
        mockSql.mockResolvedValueOnce([]); // upsert execution

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
    });

    test('successfully demotes a user', async () => {
        const { req, res } = createMocks({ 
            method: 'POST',
            headers: { cookie: 'auth_token=token' },
            body: { tournament_id: 't1', target_player_id: 'p2', action: 'demote' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'owner_user' } as any);

        mockSql.mockResolvedValueOnce([{ role: 'owner' }]);
        mockSql.mockResolvedValueOnce([]); // delete execution

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
    });
});
