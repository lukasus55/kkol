import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/me';
import { AUTH_COOKIE_NAME } from '../../lib/auth';

const { mockSql } = vi.hoisted(() => {
    return { mockSql: vi.fn() };
});

vi.mock('../../db.js', () => ({
    default: mockSql
}));

describe('Me API Endpoint (/api/me)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('returns 401 if token is missing', async () => {
        const { req, res } = createMocks({ method: 'GET' });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
        expect(JSON.parse(res._getData()).error).toBe('Not authenticated');
    });

    test('returns 401 if session does not exist in database', async () => {
        const { req, res } = createMocks({ 
            method: 'GET',
            headers: { cookie: `${AUTH_COOKIE_NAME}=invalid-or-expired-token` }
        });
        
        // mock verifySession query returning no session
        mockSql.mockResolvedValueOnce([]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
        expect(JSON.parse(res._getData()).error).toBe('Invalid or expired session');
    });

    test('returns 401 if user account is disabled', async () => {
        const { req, res } = createMocks({ 
            method: 'GET',
            headers: { cookie: `${AUTH_COOKIE_NAME}=valid-token` }
        });

        // verifySession returns inactive user
        mockSql.mockResolvedValueOnce([{
            id: 'sess-1',
            player_id: 'disabled_user',
            user_is_active: false,
            user_role: 'player',
            user_displayed_name: 'Disabled User',
            last_active_at: new Date()
        }]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
    });

    test('returns user data if session is valid via cookie', async () => {
        const { req, res } = createMocks({ 
            method: 'GET',
            headers: { cookie: `${AUTH_COOKIE_NAME}=valid-token` }
        });
        
        const mockSessionJoin = {
            id: 'sess-1',
            player_id: 'user123',
            user_is_active: true,
            user_role: 'admin',
            user_displayed_name: 'TestUser',
            last_active_at: new Date()
        };

        const mockUserProfile = {
            id: 'user123',
            displayed_name: 'TestUser',
            role: 'admin',
            email: 'test@example.com',
            is_active: true,
            organizer_roles: {},
            tournaments: {},
            pfp_base64: 'base64str'
        };
        
        // 1. verifySession query
        mockSql.mockResolvedValueOnce([mockSessionJoin]);
        // 2. me profile query
        mockSql.mockResolvedValueOnce([mockUserProfile]);

        await handler(req as any, res as any);
        
        expect(res._getStatusCode()).toBe(200);
        const data = JSON.parse(res._getData());
        expect(data.user.id).toBe('user123');
        expect(data.user.displayed_name).toBe('TestUser');
        expect(data.user.role).toBe('admin');
        expect(data.user.email).toBe('test@example.com');
    });

    test('returns user data if session is valid via Bearer header', async () => {
        const { req, res } = createMocks({ 
            method: 'GET',
            headers: { authorization: 'Bearer bearer-valid-token' }
        });
        
        const mockSessionJoin = {
            id: 'sess-2',
            player_id: 'user456',
            user_is_active: true,
            user_role: 'player',
            user_displayed_name: 'BearerUser',
            last_active_at: new Date()
        };

        const mockUserProfile = {
            id: 'user456',
            displayed_name: 'BearerUser',
            role: 'player',
            email: null,
            is_active: true,
            organizer_roles: {},
            tournaments: {},
            pfp_base64: null
        };
        
        mockSql.mockResolvedValueOnce([mockSessionJoin]);
        mockSql.mockResolvedValueOnce([mockUserProfile]);

        await handler(req as any, res as any);
        
        expect(res._getStatusCode()).toBe(200);
        const data = JSON.parse(res._getData());
        expect(data.user.id).toBe('user456');
    });
});
