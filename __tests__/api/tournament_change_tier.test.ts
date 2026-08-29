import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/tournament_change_tier';
import jwt from 'jsonwebtoken';

vi.mock('jsonwebtoken', () => ({ default: { verify: vi.fn() } }));
const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Tournament Change Tier API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('validates valid tiers', async () => {
        const { req, res } = createMocks({ 
            method: 'POST',
            headers: { cookie: 'auth_token=token' },
            body: { tournament_id: 't1', new_tier: 'F' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
    });

    test('blocks non-admin from setting S tier', async () => {
        const { req, res } = createMocks({ 
            method: 'POST',
            headers: { cookie: 'auth_token=token' },
            body: { tournament_id: 't1', new_tier: 'S' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        mockSql.mockResolvedValueOnce([{ role: 'organizer' }]);
        mockSql.mockResolvedValueOnce([{ tier: 'A' }]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(403);
        expect(JSON.parse(res._getData()).error).toContain('Tylko administrator');
    });

    test('successfully updates tier for authorized user', async () => {
        const { req, res } = createMocks({ 
            method: 'POST',
            headers: { cookie: 'auth_token=token' },
            body: { tournament_id: 't1', new_tier: 'B' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        mockSql.mockResolvedValueOnce([{ role: 'organizer' }]);
        mockSql.mockResolvedValueOnce([{ tier: 'C' }]);
        mockSql.mockResolvedValueOnce([{ role: 'owner' }]); // tournament_organizers check
        mockSql.mockResolvedValueOnce([]); // Update

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
    });
});
