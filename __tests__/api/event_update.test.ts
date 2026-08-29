import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/event_update';
import jwt from 'jsonwebtoken';

vi.mock('jsonwebtoken', () => ({ default: { verify: vi.fn() } }));
const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Event Update API (/api/event_update)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('blocks updates to events in finished tournaments', async () => {
        const { req, res } = createMocks({ 
            method: 'POST', 
            headers: { cookie: 'auth_token=token' },
            body: { id: 1, name: 'Valid Event', is_major: false, start_date: '2025-01-01' }
        });
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);

        // 1st query: event check returns finished=true
        mockSql.mockResolvedValueOnce([{ tournament_id: 't1', finished: true }]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData()).error).toContain('zakończonym turnieju');
    });
});
