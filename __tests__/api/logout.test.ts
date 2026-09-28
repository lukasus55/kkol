import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/logout';
import { AUTH_COOKIE_NAME, hashToken } from '../../lib/auth';

const { mockSql } = vi.hoisted(() => {
    return { mockSql: vi.fn() };
});

vi.mock('../../db.js', () => ({
    default: mockSql
}));

describe('Logout API Endpoint (/api/logout)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (process.env as any).NODE_ENV = 'development';
    });

    test('rejects non-POST requests with 405', async () => {
        const { req, res } = createMocks({ method: 'GET' });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(405);
        expect(JSON.parse(res._getData()).error).toBe('Method not allowed');
    });

    test('clears cookie and deletes session from DB when cookie token exists', async () => {
        const rawToken = 'my-active-session-token-12345';
        const { req, res } = createMocks({
            method: 'POST',
            headers: { cookie: `${AUTH_COOKIE_NAME}=${rawToken}` }
        });

        mockSql.mockResolvedValueOnce([{ id: 'revoked-session-id' }]);

        await handler(req as any, res as any);

        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData()).message).toBe('Logged out successfully');

        const setCookie = res.getHeader('Set-Cookie') as string;
        expect(setCookie).toBeDefined();
        expect(setCookie).toContain('Max-Age=-1');
        expect(setCookie).toContain(`${AUTH_COOKIE_NAME}=;`);

        expect(mockSql).toHaveBeenCalled();
    });

    test('clears cookie and deletes session from DB when Bearer header token exists', async () => {
        const rawToken = 'my-bearer-token-67890';
        const { req, res } = createMocks({
            method: 'POST',
            headers: { authorization: `Bearer ${rawToken}` }
        });

        mockSql.mockResolvedValueOnce([{ id: 'revoked-session-id' }]);

        await handler(req as any, res as any);

        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData()).message).toBe('Logged out successfully');

        const setCookie = res.getHeader('Set-Cookie') as string;
        expect(setCookie).toBeDefined();
        expect(setCookie).toContain('Max-Age=-1');

        expect(mockSql).toHaveBeenCalled();
    });

    test('clears cookie successfully even if no session token was provided', async () => {
        const { req, res } = createMocks({ method: 'POST' });

        await handler(req as any, res as any);

        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData()).message).toBe('Logged out successfully');

        const setCookie = res.getHeader('Set-Cookie') as string;
        expect(setCookie).toBeDefined();
        expect(setCookie).toContain('Max-Age=-1');
        // No DB call needed if no token
        expect(mockSql).not.toHaveBeenCalled();
    });

    test('returns 500 when database throws an error', async () => {
        const { req, res } = createMocks({
            method: 'POST',
            headers: { cookie: `${AUTH_COOKIE_NAME}=some-token` }
        });

        mockSql.mockRejectedValueOnce(new Error('DB failure during logout'));

        await handler(req as any, res as any);

        expect(res._getStatusCode()).toBe(500);
        expect(JSON.parse(res._getData()).error).toBe('Internal server error during logout');
    });
});
