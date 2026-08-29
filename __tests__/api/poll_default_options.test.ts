import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/poll_default_options';
import sql from '../../db.js';
import jwt from 'jsonwebtoken';
import { hasTournamentPermission } from '../../public/js/utils/permissionChecks.js';

vi.mock('../../db.js', () => {
    const mSql = vi.fn();
    (mSql as any).begin = vi.fn(async (cb) => {
        await cb(mSql);
    });
    return { default: mSql };
});

vi.mock('jsonwebtoken', () => ({
    default: {
        verify: vi.fn(),
    }
}));

vi.mock('../../public/js/utils/permissionChecks.js', () => ({
    hasTournamentPermission: vi.fn(),
}));

describe('/api/poll_default_options', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('GET - returns default options', async () => {
        const { req, res } = createMocks({
            method: 'GET',
            query: { poll_id: '123e4567-e89b-12d3-a456-426614174000' }
        });

        vi.mocked(sql as any).mockResolvedValueOnce([{ id: '1', name: 'Tak', sort_order: 0 }] as any);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData())).toEqual([{ id: '1', name: 'Tak', sort_order: 0 }]);
    });

    it('POST - fails if not authorized (no token)', async () => {
        const { req, res } = createMocks({
            method: 'POST',
            body: { poll_id: '123e4567-e89b-12d3-a456-426614174000', options: [] },
            headers: {}
        });

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
    });

    it('POST - fails if no permission', async () => {
        vi.mocked(jwt.verify).mockReturnValueOnce({ id: 'user1', role: 'user' } as any);
        vi.mocked(sql as any).mockResolvedValueOnce([{ tournament_id: 't1' }] as any); // polls
        vi.mocked(hasTournamentPermission).mockResolvedValueOnce(false);

        const { req, res } = createMocks({
            method: 'POST',
            body: { poll_id: '123e4567-e89b-12d3-a456-426614174000', options: [] },
            headers: { cookie: 'auth_token=fake_token' }
        });

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(403);
    });

    it('POST - saves options for authorized user', async () => {
        vi.mocked(jwt.verify).mockReturnValueOnce({ id: 'admin1', role: 'admin' } as any);
        vi.mocked(sql as any).mockResolvedValueOnce([{ tournament_id: 't1' }] as any); // polls
        vi.mocked(hasTournamentPermission).mockResolvedValueOnce(true);

        const { req, res } = createMocks({
            method: 'POST',
            body: { 
                poll_id: '123e4567-e89b-12d3-a456-426614174000', 
                options: [{ name: 'Opcja 1' }] 
            },
            headers: { cookie: 'auth_token=fake_token' }
        });

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        expect(sql.begin).toHaveBeenCalled();
    });
});
