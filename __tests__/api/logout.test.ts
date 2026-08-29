import { expect, test, describe } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/logout';

describe('Logout API Endpoint (/api/logout)', () => {
    test('rejects GET requests', async () => {
        const { req, res } = createMocks({ method: 'GET' });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(405);
    });

    test('clears auth_token cookie on POST', async () => {
        const { req, res } = createMocks({ method: 'POST' });
        await handler(req as any, res as any);
        
        expect(res._getStatusCode()).toBe(200);
        
        const setCookie = res.getHeader('Set-Cookie') as string;
        expect(setCookie).toBeDefined();
        // Should clear the cookie by setting maxAge to -1 or similar clearing logic
        expect(setCookie).toContain('Max-Age=-1');
        expect(setCookie).toContain('auth_token=;');
        
        expect(JSON.parse(res._getData()).message).toBe('Logged out successfully');
    });
});
