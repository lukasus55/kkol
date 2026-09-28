import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/poll_update';
import { hasTournamentPermission } from '../../public/js/utils/permissionChecks.js';
import { verifySession } from '../../lib/auth';

vi.mock('../../lib/auth', () => ({
    verifySession: vi.fn(),
    AUTH_COOKIE_NAME: 'auth_token'
}));
vi.mock('../../public/js/utils/permissionChecks.js', () => ({
    hasTournamentPermission: vi.fn()
}));

const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Poll Update API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('rejects unauthenticated requests', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce(null);
        const { req, res } = createMocks({ 
            method: 'POST',
            body: {}
        });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
    });

    test('validates dates', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'user', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST',
            body: { 
                id: 'p1', 
                name: 'Valid Name', 
                start_date: '2025-01-01', 
                end_date: '2024-01-01', // End before start
                rights_level: 2 
            }
        });

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData()).error).toContain('nie może być wcześniejsza');
    });

    test('updates poll successfully', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'user', displayed_name: 'User 1', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST',
            body: { 
                id: 'p1', 
                name: 'Valid Name', 
                start_date: '2025-01-01', 
                end_date: '2025-02-01',
                rights_level: 2 
            }
        });

        mockSql.mockResolvedValueOnce([{ tournament_id: 't1' }]); // Poll check
        mockSql.mockResolvedValueOnce([{ finished: false }]); // Tournament check
        vi.mocked(hasTournamentPermission).mockResolvedValueOnce(true);
        mockSql.mockResolvedValueOnce([]); // Update Execution

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
    });
});
