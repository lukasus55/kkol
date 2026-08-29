import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/change_name';
import jwt from 'jsonwebtoken';

vi.mock('jsonwebtoken', () => ({
    default: {
        verify: vi.fn()
    }
}));

const { mockSql } = vi.hoisted(() => {
    return { mockSql: vi.fn() };
});

vi.mock('../../db.js', () => ({
    default: mockSql
}));

describe('Change Name API (/api/change_name)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret';
    });

    test('returns 401 if not authenticated', async () => {
        const { req, res } = createMocks({ method: 'POST', body: { new_name: 'Super Player' } });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
        expect(JSON.parse(res._getData()).error).toBe('Not authenticated');
    });

    test('returns 429 if changed recently', async () => {
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { new_name: 'Super Player' },
            headers: { cookie: 'auth_token=valid-token' }
        });
        
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user123' } as any);
        
        mockSql.mockResolvedValueOnce([{ last_name_change: new Date(Date.now() - 1000 * 60) }]); // 1 minute ago

        await handler(req as any, res as any);
        
        expect(res._getStatusCode()).toBe(429);
        expect(JSON.parse(res._getData()).error).toContain('Musisz odczekać jeszcze');
    });

    test('successfully updates name if all conditions met', async () => {
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { new_name: 'Super Player' },
            headers: { cookie: 'auth_token=valid-token' }
        });
        
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user123' } as any);
        
        // Over 30 days ago
        mockSql.mockResolvedValueOnce([{ last_name_change: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40) }]); 
        mockSql.mockResolvedValueOnce([]);

        await handler(req as any, res as any);
        
        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData()).message).toBe('Nazwa została zaktualizowana.');
        expect(mockSql).toHaveBeenCalledTimes(2);
    });
});
