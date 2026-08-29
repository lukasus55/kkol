import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/poll_create';
import jwt from 'jsonwebtoken';

vi.mock('jsonwebtoken', () => ({ default: { verify: vi.fn() } }));
const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));
vi.mock('uuidv7', () => ({ uuidv7: vi.fn().mockReturnValue('new-uuid-123') }));

describe('Poll Create API (/api/poll_create)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('rejects unauthenticated requests', async () => {
        const { req, res } = createMocks({ method: 'POST', body: {} });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
    });

    test('rejects missing data', async () => {
        const { req, res } = createMocks({ 
            method: 'POST', 
            headers: { cookie: 'auth_token=token' },
            body: { name: 'Valid Name' } // missing tournament_id
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
    });

    test('rejects creating poll in finished tournament', async () => {
        const { req, res } = createMocks({ 
            method: 'POST', 
            headers: { cookie: 'auth_token=token' },
            body: { tournament_id: 't1', name: 'Valid Name' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);
        
        // Return tournament is finished
        mockSql.mockResolvedValueOnce([{ finished: true }]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData()).error).toContain('zakończonego turnieju');
    });

    test('successfully creates poll when conditions are met', async () => {
        const { req, res } = createMocks({ 
            method: 'POST', 
            headers: { cookie: 'auth_token=token' },
            body: { tournament_id: 't1', name: 'Valid Name' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);
        
        // Mock tournament not finished
        mockSql.mockResolvedValueOnce([{ finished: false }]);
        // Mock globalRole
        mockSql.mockResolvedValueOnce([{ role: 'user' }]);
        // Mock tournamentRole
        mockSql.mockResolvedValueOnce([{ role: 'owner' }]);
        // Mock insert
        mockSql.mockResolvedValueOnce([]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        const data = JSON.parse(res._getData());
        expect(data.success).toBe(true);
        expect(data.id).toBe('new-uuid-123');
    });
});
