import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/poll_label_delete';
import jwt from 'jsonwebtoken';
import { hasTournamentPermission, isPartOfTournament } from '../../public/js/utils/permissionChecks.js';

vi.mock('jsonwebtoken', () => ({ default: { verify: vi.fn() } }));
vi.mock('../../public/js/utils/permissionChecks.js', () => ({
    hasTournamentPermission: vi.fn(),
    isPartOfTournament: vi.fn()
}));
const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Poll Label Delete API (/api/poll_label_delete)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('rejects missing id', async () => {
        const { req, res } = createMocks({ 
            method: 'POST', 
            headers: { cookie: 'auth_token=token' },
            body: {}
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
    });

    test('returns 404 if label not found', async () => {
        const { req, res } = createMocks({ 
            method: 'POST', 
            headers: { cookie: 'auth_token=token' },
            body: { id: 1 }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);
        
        mockSql.mockResolvedValueOnce([]); // no label

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(404);
        expect(JSON.parse(res._getData()).error).toContain('etykiety która nie istnieje');
    });

    test('deletes label if allowed', async () => {
        const { req, res } = createMocks({ 
            method: 'POST', 
            headers: { cookie: 'auth_token=token' },
            body: { id: 1 }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);
        
        mockSql.mockResolvedValueOnce([{ poll_id: 'p1' }]); // label found
        mockSql.mockResolvedValueOnce([{ tournament_id: 't1', rights_level: 3 }]); // poll found
        
        vi.mocked(isPartOfTournament).mockResolvedValueOnce(true);
        // hasTournamentPermission skipped due to allowedByRules=true

        mockSql.mockResolvedValueOnce([]); // DELETE

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
    });
});
