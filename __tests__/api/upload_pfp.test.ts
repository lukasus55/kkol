import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/upload_pfp';
import sharp from 'sharp';
import { verifySession } from '../../lib/auth';

vi.mock('../../lib/auth', () => ({
    verifySession: vi.fn(),
    AUTH_COOKIE_NAME: 'auth_token'
}));

const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

vi.mock('sharp', () => {
    return {
        default: vi.fn(() => ({
            resize: vi.fn().mockReturnThis(),
            webp: vi.fn().mockReturnThis(),
            toBuffer: vi.fn().mockResolvedValue(Buffer.from('mocked-processed-image'))
        }))
    };
});

describe('Upload PFP API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('returns 401 if session is invalid or revoked', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce(null);
        const { req, res } = createMocks({ 
            method: 'POST',
            body: { image_base64: 'data:image/png;base64,xxxx' }
        });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
        expect(JSON.parse(res._getData()).error).toBe('Not authenticated');
    });

    test('rejects missing image', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'player', displayed_name: 'Player', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST',
            body: {}
        });

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
    });

    test('enforces rate limits on PFP changes', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'player', displayed_name: 'Player', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST',
            body: { image_base64: 'data:image/png;base64,xxxx' }
        });

        // Setting a recent date (1 hour ago)
        const recentDate = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        mockSql.mockResolvedValueOnce([{ last_pfp_change: recentDate }]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(429);
        expect(JSON.parse(res._getData()).error).toContain('odczekać jeszcze');
    });

    test('processes and saves image successfully', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'player', displayed_name: 'Player', is_active: true },
            session: {} as any
        });
        const { req, res } = createMocks({ 
            method: 'POST',
            body: { image_base64: 'data:image/png;base64,xxxx' }
        });

        const oldDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours ago
        mockSql.mockResolvedValueOnce([{ last_pfp_change: oldDate }]);
        mockSql.mockResolvedValueOnce([]); // UPDATE query

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        expect(sharp).toHaveBeenCalled();
    });
});
