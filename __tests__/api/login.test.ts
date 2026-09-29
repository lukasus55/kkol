import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/login';
import bcrypt from 'bcrypt';
import { AUTH_COOKIE_NAME } from '../../lib/auth';

vi.mock('bcrypt', () => ({
    default: {
        compare: vi.fn()
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
        (process.env as any).NODE_ENV = 'development';
    });

    test('returns 405 on non-POST method', async () => {
        const { req, res } = createMocks({ method: 'GET' });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(405);
        expect(JSON.parse(res._getData()).error).toBe('Method not allowed');
    });

    test('returns 400 on missing credentials', async () => {
        const { req, res } = createMocks({ method: 'POST', body: {} });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData()).error).toBe('Username and password are required');
    });

    test('returns 401 on non-existent user', async () => {
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { username: 'baduser', password: 'password123' }
        });
        
        mockSql.mockResolvedValueOnce([]); // user not found

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
        expect(JSON.parse(res._getData()).error).toBe('Invalid username or password');
    });

    test('returns 403 on disabled account', async () => {
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { username: 'disabled_user', password: 'password123' }
        });
        
        mockSql.mockResolvedValueOnce([{
            id: 'disabled_user',
            password_hash: 'hashed_pw',
            role: 'player',
            is_active: false
        }]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(403);
        expect(JSON.parse(res._getData()).error).toBe('This account has been disabled.');
    });

    test('returns 401 on incorrect password', async () => {
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { username: 'valid_user', password: 'wrongpassword' }
        });
        
        mockSql.mockResolvedValueOnce([{
            id: 'valid_user',
            password_hash: 'hashed_pw',
            role: 'player',
            is_active: true
        }]);

        vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as never);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
        expect(JSON.parse(res._getData()).error).toBe('Invalid username or password');
    });

    test('successfully logs in, creates server session, and sets cookie', async () => {
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { username: 'admin', password: 'password123' },
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
                'x-forwarded-for': '127.0.0.1'
            }
        });
        
        const mockUser = {
            id: 'admin',
            password_hash: 'hashed_password',
            role: 'admin',
            is_active: true
        };

        const mockSession = {
            id: 'session-uuid-1',
            player_id: 'admin',
            token_hash: 'hash-abc',
            ip_address: '127.0.0.1',
            device_info: 'Chrome (Windows)',
            app_id: 'kkol_main',
            created_at: new Date(),
            last_active_at: new Date(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        };
        
        // 1. SELECT user
        mockSql.mockResolvedValueOnce([mockUser]);
        // 2. UPDATE players last_login
        mockSql.mockResolvedValueOnce([]);
        // 3. INSERT INTO sessions
        mockSql.mockResolvedValueOnce([mockSession]);
        
        vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);

        await handler(req as any, res as any);
        
        expect(res._getStatusCode()).toBe(200);
        
        const data = JSON.parse(res._getData());
        expect(data.message).toBe('Login successful!');
        expect(data.token).toBeDefined();
        expect(typeof data.token).toBe('string');
        expect(data.user.id).toBe('admin');
        expect(data.user.role).toBe('admin');
        
        // Check if cookie was set with token
        const setCookieHeader = res.getHeader('Set-Cookie') as string;
        expect(setCookieHeader).toBeDefined();
        expect(setCookieHeader).toContain(`${AUTH_COOKIE_NAME}=`);
        expect(setCookieHeader).toContain('HttpOnly');
        expect(setCookieHeader).toContain('SameSite=Lax');
    });

    test('accepts custom appId and stores it in session', async () => {
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { username: 'admin', password: 'password123', appId: 'external_app' }
        });
        
        mockSql.mockResolvedValueOnce([{ id: 'admin', password_hash: 'hashed', role: 'admin', is_active: true }]);
        mockSql.mockResolvedValueOnce([]); // UPDATE last_login
        mockSql.mockResolvedValueOnce([{
            id: 'session-uuid-2',
            player_id: 'admin',
            token_hash: 'hash-abc',
            app_id: 'external_app',
            created_at: new Date(),
            expires_at: new Date()
        }]); // INSERT session
        
        vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);

        await handler(req as any, res as any);
        
        expect(res._getStatusCode()).toBe(200);
        const data = JSON.parse(res._getData());
        expect(data.token).toBeDefined();
    });

    test('returns 500 when database throws an error', async () => {
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { username: 'admin', password: 'password123' }
        });
        
        mockSql.mockRejectedValueOnce(new Error('DB connection failure'));

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(500);
        expect(JSON.parse(res._getData()).error).toBe('Internal server error during login');
    });
});
