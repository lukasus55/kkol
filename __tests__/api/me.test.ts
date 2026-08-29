import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/me';
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

describe('Me API Endpoint (/api/me)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret';
    });

    test('returns 401 if token is missing', async () => {
        const { req, res } = createMocks({ method: 'GET' });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
        expect(JSON.parse(res._getData()).error).toBe('Not authenticated');
    });

    test('returns user data if token is valid', async () => {
        const { req, res } = createMocks({ 
            method: 'GET',
            headers: { cookie: 'auth_token=valid-token' }
        });
        
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user123' } as any);
        
        const mockUser = {
            id: 'user123',
            displayed_name: 'TestUser',
            role: 'admin',
            created_at: new Date('2024-01-01'),
            last_pfp_change: null,
            last_name_change: null,
            pfp_base64: 'base64str'
        };
        
        mockSql.mockResolvedValueOnce([mockUser]);

        await handler(req as any, res as any);
        
        expect(res._getStatusCode()).toBe(200);
        const data = JSON.parse(res._getData());
        expect(data.user.id).toBe('user123');
        expect(data.user.displayed_name).toBe('TestUser');
        expect(data.user.role).toBe('admin');
    });
});
