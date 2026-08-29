import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/upload_pfp';
import jwt from 'jsonwebtoken';
import sharp from 'sharp';

vi.mock('jsonwebtoken', () => ({ default: { verify: vi.fn() } }));
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

    test('rejects missing image', async () => {
        const { req, res } = createMocks({ 
            method: 'POST',
            headers: { cookie: 'auth_token=token' },
            body: {}
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
    });

    test('enforces rate limits on PFP changes', async () => {
        const { req, res } = createMocks({ 
            method: 'POST',
            headers: { cookie: 'auth_token=token' },
            body: { image_base64: 'data:image/png;base64,xxxx' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        // Setting a recent date (1 hour ago)
        const recentDate = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        mockSql.mockResolvedValueOnce([{ last_pfp_change: recentDate }]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(429);
        expect(JSON.parse(res._getData()).error).toContain('odczekać jeszcze');
    });

    test('processes and saves image successfully', async () => {
        const { req, res } = createMocks({ 
            method: 'POST',
            headers: { cookie: 'auth_token=token' },
            body: { image_base64: 'data:image/png;base64,xxxx' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        const oldDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours ago
        mockSql.mockResolvedValueOnce([{ last_pfp_change: oldDate }]);
        mockSql.mockResolvedValueOnce([]); // UPDATE query

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        expect(sharp).toHaveBeenCalled();
    });
});
