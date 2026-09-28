import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/change_name';
import { verifySession } from '../../lib/auth';

vi.mock('../../lib/auth', () => ({
    verifySession: vi.fn(),
    AUTH_COOKIE_NAME: 'auth_token'
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
    });

    test('returns 401 if session is not found or revoked', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce(null);
        const { req, res } = createMocks({ method: 'POST', body: { new_name: 'Super Player' } });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
        expect(JSON.parse(res._getData()).error).toBe('Not authenticated');
    });

    test('returns 400 if name is invalid (too short)', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user123', role: 'player', displayed_name: 'Old', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ method: 'POST', body: { new_name: 'ab' } });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData()).error).toContain('co najmniej 3 znaki');
    });

    test('returns 429 if changed recently', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user123', role: 'player', displayed_name: 'Old', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { new_name: 'Super Player' }
        });
        
        mockSql.mockResolvedValueOnce([{ last_name_change: new Date(Date.now() - 1000 * 60) }]); // 1 minute ago

        await handler(req as any, res as any);
        
        expect(res._getStatusCode()).toBe(429);
        expect(JSON.parse(res._getData()).error).toContain('Musisz odczekać jeszcze');
    });

    test('successfully updates name if all conditions met', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user123', role: 'player', displayed_name: 'Old', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { new_name: 'Super Player' }
        });
        
        // Over 30 days ago
        mockSql.mockResolvedValueOnce([{ last_name_change: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40) }]); 
        mockSql.mockResolvedValueOnce([]); // UPDATE query

        await handler(req as any, res as any);
        
        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData()).message).toBe('Nazwa została zaktualizowana.');
    });
});
