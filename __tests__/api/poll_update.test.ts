import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/poll_update';
import jwt from 'jsonwebtoken';
import { hasTournamentPermission } from '../../public/js/utils/permissionChecks.js';

vi.mock('jsonwebtoken', () => ({ default: { verify: vi.fn() } }));
vi.mock('../../public/js/utils/permissionChecks.js', () => ({
    hasTournamentPermission: vi.fn()
}));

const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Poll Update API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('validates dates', async () => {
        const { req, res } = createMocks({ 
            method: 'POST',
            headers: { cookie: 'auth_token=token' },
            body: { 
                id: 'p1', 
                name: 'Valid Name', 
                start_date: '2025-01-01', 
                end_date: '2024-01-01', // End before start
                rights_level: 2 
            }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData()).error).toContain('nie może być wcześniejsza');
    });

    test('updates poll successfully', async () => {
        const { req, res } = createMocks({ 
            method: 'POST',
            headers: { cookie: 'auth_token=token' },
            body: { 
                id: 'p1', 
                name: 'Valid Name', 
                start_date: '2025-01-01', 
                end_date: '2025-02-01',
                rights_level: 2 
            }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        mockSql.mockResolvedValueOnce([{ tournament_id: 't1' }]); // Poll check
        mockSql.mockResolvedValueOnce([{ finished: false }]); // Tournament check
        vi.mocked(hasTournamentPermission).mockResolvedValueOnce(true);
        mockSql.mockResolvedValueOnce([]); // Update Execution

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
    });
});
