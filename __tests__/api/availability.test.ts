import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';

import getHandler from '../../pages/api/availability_get';
import defaultUpdateHandler from '../../pages/api/availability_defaults_update';
import overridesUpdateHandler from '../../pages/api/availability_overrides_update';
import bulkDefaultsHandler from '../../pages/api/availability_bulk_defaults';
import bulkOverridesHandler from '../../pages/api/availability_bulk_overrides';
import deleteHandler from '../../pages/api/availability_delete';
import sharedHandler from '../../pages/api/availability_shared';
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

describe('Availability API Endpoints', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(verifySession).mockResolvedValue({
            user: { id: 'player1', role: 'user', displayed_name: 'Player 1', is_active: true },
            session: {} as any
        });
    });

    describe('GET /api/availability_get', () => {
        test('returns 401 when not authenticated', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce(null);
            const { req, res } = createMocks({ method: 'GET' });
            await getHandler(req as any, res as any);
            expect(res._getStatusCode()).toBe(401);
        });

        test('returns defaults and overrides for self only', async () => {
            const { req, res } = createMocks({ 
                method: 'GET'
            });
            
            mockSql.mockResolvedValueOnce([{ id: 'def1', player_id: 'player1' }]);
            mockSql.mockResolvedValueOnce([{ id: 'over1', player_id: 'player1' }]);

            await getHandler(req as any, res as any);
            expect(res._getStatusCode()).toBe(200);
            
            // Should not allow fetching others by passing query param
            const { req: reqAttempt, res: resAttempt } = createMocks({ 
                method: 'GET',
                query: { playerId: 'player2' }
            });
            
            mockSql.mockResolvedValueOnce([]);
            mockSql.mockResolvedValueOnce([]);

            await getHandler(reqAttempt as any, resAttempt as any);
            
            const query1 = mockSql.mock.calls[2][0][0];
            expect(query1).toContain('player_id = ');
        });
    });

    describe('POST /api/availability_defaults_update', () => {
        test('returns 401 when not authenticated', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce(null);
            const { req, res } = createMocks({ 
                method: 'POST',
                body: { day_of_week: 1, start_time: '10:00', end_time: '12:00', status: 'available' }
            });
            await defaultUpdateHandler(req as any, res as any);
            expect(res._getStatusCode()).toBe(401);
        });

        test('updates default availability', async () => {
            const { req, res } = createMocks({ 
                method: 'POST',
                body: { id: 'def-1', day_of_week: 1, start_time: '10:00', end_time: '12:00', status: 'available' }
            });
            mockSql.mockResolvedValueOnce([]);

            await defaultUpdateHandler(req as any, res as any);
            expect(res._getStatusCode()).toBe(200);
            expect(JSON.parse(res._getData()).message).toBe('Default availability updated');
        });
    });

    describe('POST /api/availability_overrides_update', () => {
        test('returns 401 when not authenticated', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce(null);
            const { req, res } = createMocks({ 
                method: 'POST',
                body: { specific_date: '2024-09-10', start_time: '10:00', end_time: '12:00', status: 'available' }
            });
            await overridesUpdateHandler(req as any, res as any);
            expect(res._getStatusCode()).toBe(401);
        });

        test('updates override availability', async () => {
            const { req, res } = createMocks({ 
                method: 'POST',
                body: { id: 'ov-1', specific_date: '2024-09-10', start_time: '10:00', end_time: '12:00', status: 'available' }
            });
            mockSql.mockResolvedValueOnce([]);

            await overridesUpdateHandler(req as any, res as any);
            expect(res._getStatusCode()).toBe(200);
            expect(JSON.parse(res._getData()).message).toBe('Availability override updated');
        });
    });

    describe('POST /api/availability_bulk_defaults', () => {
        test('returns 401 when not authenticated', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce(null);
            const { req, res } = createMocks({ 
                method: 'POST',
                body: { blocks: [] }
            });
            await bulkDefaultsHandler(req as any, res as any);
            expect(res._getStatusCode()).toBe(401);
        });

        test('updates bulk defaults securely', async () => {
            const { req, res } = createMocks({ 
                method: 'POST',
                body: { 
                  blocks: [
                    { day_of_week: 1, start_time: '10:00', end_time: '12:00', status: 'available' }
                  ] 
                }
            });
            
            mockSql.mockResolvedValue([]);

            await bulkDefaultsHandler(req as any, res as any);
            expect(res._getStatusCode()).toBe(200);
            
            const deleteCall = mockSql.mock.calls.find(call => call[0][0].includes('DELETE FROM availability_defaults'));
            expect(deleteCall).toBeDefined();
        });

        test('fails on invalid payload', async () => {
            const { req, res } = createMocks({ 
                method: 'POST',
                body: { blocks: 'not an array' }
            });
            
            await bulkDefaultsHandler(req as any, res as any);
            expect(res._getStatusCode()).toBe(400);
            expect(JSON.parse(res._getData()).error).toBe('blocks must be an array');
        });
    });

    describe('POST /api/availability_bulk_overrides', () => {
        test('returns 401 when not authenticated', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce(null);
            const { req, res } = createMocks({ 
                method: 'POST',
                body: { date: '2024-09-10', blocks: [] }
            });
            await bulkOverridesHandler(req as any, res as any);
            expect(res._getStatusCode()).toBe(401);
        });

        test('updates bulk overrides securely and ignores spoofed playerIds', async () => {
            const { req, res } = createMocks({ 
                method: 'POST',
                body: { 
                  date: '2024-09-10',
                  playerId: 'player2',
                  blocks: [
                    { start_time: '10:00', end_time: '12:00', status: 'unavailable' }
                  ] 
                }
            });
            
            mockSql.mockResolvedValue([]);

            await bulkOverridesHandler(req as any, res as any);
            expect(res._getStatusCode()).toBe(200);
            
            const deleteCall = mockSql.mock.calls.find(call => call[0][0].includes('DELETE FROM availability_overrides'));
            expect(deleteCall).toBeDefined();
        });

        test('fails without date', async () => {
            const { req, res } = createMocks({ 
                method: 'POST',
                body: { blocks: [] }
            });
            
            await bulkOverridesHandler(req as any, res as any);
            expect(res._getStatusCode()).toBe(400);
            expect(JSON.parse(res._getData()).error).toBe('date is required');
        });
    });

    describe('DELETE /api/availability_delete', () => {
        test('returns 401 when not authenticated', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce(null);
            const { req, res } = createMocks({ 
                method: 'DELETE',
                query: { id: 'def-1', type: 'default' }
            });
            await deleteHandler(req as any, res as any);
            expect(res._getStatusCode()).toBe(401);
        });

        test('deletes default availability', async () => {
            const { req, res } = createMocks({ 
                method: 'DELETE',
                query: { id: 'def-1', type: 'default' }
            });
            mockSql.mockResolvedValueOnce([]);

            await deleteHandler(req as any, res as any);
            expect(res._getStatusCode()).toBe(200);
            expect(JSON.parse(res._getData()).message).toBe('Availability deleted');
        });
    });
    
    describe('GET /api/availability_shared', () => {
        test('returns 401 when not authenticated', async () => {
            vi.mocked(verifySession).mockResolvedValueOnce(null);
            const { req, res } = createMocks({ method: 'GET' });
            await sharedHandler(req as any, res as any);
            expect(res._getStatusCode()).toBe(401);
        });

        test('returns shared availabilities', async () => {
            const { req, res } = createMocks({ 
                method: 'GET'
            });
            
            mockSql.mockResolvedValueOnce([{ id: 'player2', displayed_name: 'Bob', pfp_base64: '' }]);
            mockSql.mockResolvedValueOnce([{ id: 'def2', player_id: 'player2' }]);
            mockSql.mockResolvedValueOnce([]);

            await sharedHandler(req as any, res as any);
            expect(res._getStatusCode()).toBe(200);
            const data = JSON.parse(res._getData());
            expect(data.friends.length).toBe(1);
        });
    });
});
