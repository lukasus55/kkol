import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/login';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

vi.mock('bcrypt', () => ({
    default: {
        compare: vi.fn()
    }
}));

vi.mock('jsonwebtoken', () => ({
    default: {
        sign: vi.fn()
    }
}));

const { mockSql } = vi.hoisted(() => {
    return { mockSql: vi.fn() };
});

vi.mock('../../db.js', () => ({
    default: mockSql
}));

describe('Login API Endpoint (/api/login)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret';
        (process.env as any).NODE_ENV = 'development';
    });

    test('returns 400 on missing credentials', async () => {
        const { req, res } = createMocks({ method: 'POST', body: {} });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData()).error).toBe('Username and password are required');
    });

    test('returns 401 on invalid user', async () => {
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { username: 'baduser', password: 'password123' }
        });
        
        mockSql.mockResolvedValueOnce([]); // user not found

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
        expect(JSON.parse(res._getData()).error).toBe('Invalid username or password');
    });

    test('successfully logs in and sets cookie', async () => {
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { username: 'admin', password: 'password123' }
        });
        
        const mockUser = {
            id: 'admin',
            password_hash: 'hashed_password',
            role: 'admin',
            is_active: true
        };
        
        // Mock finding the user
        mockSql.mockResolvedValueOnce([mockUser]);
        // Mock updating last_login
        mockSql.mockResolvedValueOnce([]);
        
        vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);
        vi.mocked(jwt.sign).mockReturnValueOnce('mocked_jwt_token' as never);

        await handler(req as any, res as any);
        
        expect(res._getStatusCode()).toBe(200);
        
        const data = JSON.parse(res._getData());
        expect(data.user.id).toBe('admin');
        expect(data.user.role).toBe('admin');
        
        // Check if cookie was set
        const setCookieHeader = res.getHeader('Set-Cookie');
        expect(setCookieHeader).toBeDefined();
        expect(setCookieHeader).toContain('auth_token=mocked_jwt_token');
    });
});
