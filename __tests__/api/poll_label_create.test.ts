import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/poll_label_create';
import jwt from 'jsonwebtoken';
import { hasTournamentPermission, isPartOfTournament } from '../../public/js/utils/permissionChecks.js';

vi.mock('jsonwebtoken', () => ({ default: { verify: vi.fn() } }));
vi.mock('../../public/js/utils/permissionChecks.js', () => ({
    hasTournamentPermission: vi.fn(),
    isPartOfTournament: vi.fn()
}));
const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Poll Label Create API (/api/poll_label_create)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('rejects missing parameters', async () => {
        const { req, res } = createMocks({ 
            method: 'POST', 
            headers: { cookie: 'auth_token=token' },
            body: { poll: 'p1', name: 'Label' } // missing hex
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
    });

    test('validates name length', async () => {
        const { req, res } = createMocks({ 
            method: 'POST', 
            headers: { cookie: 'auth_token=token' },
            body: { poll: 'p1', name: 'ab', hex: '#fff' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData()).error).toContain('co najmniej 3 znaki');
    });

    test('allows creation if rights_level >= 3 and part of tournament', async () => {
        const { req, res } = createMocks({ 
            method: 'POST', 
            headers: { cookie: 'auth_token=token' },
            body: { poll: 'p1', name: 'Valid Name', hex: '#fff' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        mockSql.mockResolvedValueOnce([{ tournament_id: 't1', rights_level: 3 }]);
        vi.mocked(isPartOfTournament).mockResolvedValueOnce(true);
        // We skip hasTournamentPermission since allowedByRules handles it
        
        mockSql.mockResolvedValueOnce([{ id: 1, name: 'Valid Name' }]); // Insert return

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData()).label.name).toBe('Valid Name');
    });
});
