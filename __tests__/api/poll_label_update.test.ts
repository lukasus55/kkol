import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/poll_label_update';
import jwt from 'jsonwebtoken';
import { hasTournamentPermission, isPartOfTournament } from '../../public/js/utils/permissionChecks.js';

vi.mock('jsonwebtoken', () => ({ default: { verify: vi.fn() } }));
vi.mock('../../public/js/utils/permissionChecks.js', () => ({
    hasTournamentPermission: vi.fn(),
    isPartOfTournament: vi.fn()
}));
const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Poll Label Update API (/api/poll_label_update)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('validates name length constraints', async () => {
        const { req, res } = createMocks({ 
            method: 'POST', 
            headers: { cookie: 'auth_token=token' },
            body: { id: 1, name: 'ab', hex: '#000' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData()).error).toContain('co najmniej 3 znaki');
    });

    test('updates label if permissions exist', async () => {
        const { req, res } = createMocks({ 
            method: 'POST', 
            headers: { cookie: 'auth_token=token' },
            body: { id: 1, name: 'ValidName', hex: '#000' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        mockSql.mockResolvedValueOnce([{ poll_id: 'p1' }]); // labelCheck
        mockSql.mockResolvedValueOnce([{ tournament_id: 't1', rights_level: 1 }]); // pollCheck
        
        vi.mocked(isPartOfTournament).mockResolvedValueOnce(false);
        vi.mocked(hasTournamentPermission).mockResolvedValueOnce(true);

        mockSql.mockResolvedValueOnce([]); // UPDATE

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
    });
});
