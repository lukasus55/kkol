import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import jwt from 'jsonwebtoken';

import getHandler from '../../pages/api/availability_get';
import defaultUpdateHandler from '../../pages/api/availability_defaults_update';
import overridesUpdateHandler from '../../pages/api/availability_overrides_update';
import deleteHandler from '../../pages/api/availability_delete';
import sharedHandler from '../../pages/api/availability_shared';

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

describe('Availability API Endpoints', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret';
        vi.mocked(jwt.verify).mockReturnValue({ id: 'player1' } as any);
    });

    describe('GET /api/availability_get', () => {
        test('returns defaults and overrides', async () => {
            const { req, res } = createMocks({ 
                method: 'GET',
                headers: { cookie: 'auth_token=valid-token' }
            });
            
            mockSql.mockResolvedValueOnce([{ id: 'def1', day_of_week: 1 }]); // defaults
            mockSql.mockResolvedValueOnce([{ id: 'over1', specific_date: '2024-09-04' }]); // overrides

            await getHandler(req as any, res as any);
            expect(res._getStatusCode()).toBe(200);
            const data = JSON.parse(res._getData());
            expect(data.defaults.length).toBe(1);
            expect(data.overrides.length).toBe(1);
        });
    });

    describe('POST /api/availability_defaults_update', () => {
        test('creates new default availability', async () => {
            const { req, res } = createMocks({ 
                method: 'POST',
                headers: { cookie: 'auth_token=valid-token' },
                body: { day_of_week: 2, start_time: '17:00', end_time: '20:00', status: 'available' }
            });
            
            mockSql.mockResolvedValueOnce([]); // insert resolves

            await defaultUpdateHandler(req as any, res as any);
            expect(res._getStatusCode()).toBe(200);
            expect(JSON.parse(res._getData()).message).toBe('Default availability created');
        });
    });

    describe('POST /api/availability_overrides_update', () => {
        test('creates new override availability', async () => {
            const { req, res } = createMocks({ 
                method: 'POST',
                headers: { cookie: 'auth_token=valid-token' },
                body: { specific_date: '2024-09-10', start_time: '10:00', end_time: '12:00', status: 'unavailable' }
            });
            
            mockSql.mockResolvedValueOnce([]); // insert resolves

            await overridesUpdateHandler(req as any, res as any);
            expect(res._getStatusCode()).toBe(200);
            expect(JSON.parse(res._getData()).message).toBe('Availability override created');
        });
    });

    describe('DELETE /api/availability_delete', () => {
        test('deletes a default block', async () => {
            const { req, res } = createMocks({ 
                method: 'DELETE',
                headers: { cookie: 'auth_token=valid-token' },
                query: { id: 'uuid-123', type: 'default' }
            });
            
            mockSql.mockResolvedValueOnce([]); // delete resolves

            await deleteHandler(req as any, res as any);
            expect(res._getStatusCode()).toBe(200);
            expect(JSON.parse(res._getData()).message).toBe('Availability deleted');
        });
    });

    describe('GET /api/availability_shared', () => {
        test('returns shared availabilities', async () => {
            const { req, res } = createMocks({ 
                method: 'GET',
                headers: { cookie: 'auth_token=valid-token' }
            });
            
            // 1. friends query
            mockSql.mockResolvedValueOnce([{ id: 'player2', displayed_name: 'Bob', pfp_base64: '' }]);
            // 2. defaults query
            mockSql.mockResolvedValueOnce([{ id: 'def2', player_id: 'player2' }]);
            // 3. overrides query
            mockSql.mockResolvedValueOnce([]);

            await sharedHandler(req as any, res as any);
            expect(res._getStatusCode()).toBe(200);
            const data = JSON.parse(res._getData());
            expect(data.friends.length).toBe(1);
            expect(data.defaults.length).toBe(1);
            expect(data.overrides.length).toBe(0);
        });
    });
});
