import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/tournament_create';
import jwt from 'jsonwebtoken';

vi.mock('jsonwebtoken', () => ({ default: { verify: vi.fn() } }));
const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Tournament Create API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('validates regex for tournament id', async () => {
        const { req, res } = createMocks({ 
            method: 'POST',
            headers: { cookie: 'auth_token=token' },
            body: { tournament_id: 'Invalid ID!' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData()).error).toContain('tylko małe litery');
    });

    test('blocks non-organizers', async () => {
        const { req, res } = createMocks({ 
            method: 'POST',
            headers: { cookie: 'auth_token=token' },
            body: { tournament_id: 'valid_id' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        mockSql.mockResolvedValueOnce([{ role: 'user' }]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(403);
    });

    test('creates tournament successfully', async () => {
        const { req, res } = createMocks({ 
            method: 'POST',
            headers: { cookie: 'auth_token=token' },
            body: { tournament_id: 'valid_id' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        mockSql.mockResolvedValueOnce([{ role: 'organizer' }]);
        mockSql.mockResolvedValueOnce([]); // Exist check = false
        mockSql.mockResolvedValueOnce([]); // Insert 1
        mockSql.mockResolvedValueOnce([]); // Insert 2
        mockSql.mockResolvedValueOnce([]); // Insert 3

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData()).message).toBe('Turniej utworzony.');
    });
});
