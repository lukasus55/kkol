import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/event_delete';
import jwt from 'jsonwebtoken';

vi.mock('jsonwebtoken', () => ({ default: { verify: vi.fn() } }));
const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Event Delete API (/api/event_delete)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('returns 404 if event does not exist', async () => {
        const { req, res } = createMocks({ 
            method: 'POST', 
            headers: { cookie: 'auth_token=token' },
            body: { event_id: 1 }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);
        
        mockSql.mockResolvedValueOnce([]); // empty array -> not found

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(404);
        expect(JSON.parse(res._getData()).error).toBe('Nie znaleziono wydarzenia.');
    });

    test('deletes event if user has permissions', async () => {
        const { req, res } = createMocks({ 
            method: 'POST', 
            headers: { cookie: 'auth_token=token' },
            body: { event_id: 1 }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);
        
        mockSql.mockResolvedValueOnce([{ tournament_id: 't1' }]); // event check
        mockSql.mockResolvedValueOnce([{ role: 'admin' }]); // global role check
        mockSql.mockResolvedValueOnce([]); // tournament role check
        mockSql.mockResolvedValueOnce([]); // delete

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData()).message).toBe('Wydarzenie usunięte pomyślnie.');
    });
});
