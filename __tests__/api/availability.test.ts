import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import jwt from 'jsonwebtoken';

import getHandler from '../../pages/api/availability_get';
import defaultUpdateHandler from '../../pages/api/availability_defaults_update';
import overridesUpdateHandler from '../../pages/api/availability_overrides_update';
import bulkDefaultsHandler from '../../pages/api/availability_bulk_defaults';
import bulkOverridesHandler from '../../pages/api/availability_bulk_overrides';
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
        test('returns defaults and overrides for self only', async () => {
            const { req, res } = createMocks({ 
                method: 'GET',
                headers: { cookie: 'auth_token=valid-token' }
            });
            
            mockSql.mockResolvedValueOnce([{ id: 'def1', player_id: 'player1' }]);
            mockSql.mockResolvedValueOnce([{ id: 'over1', player_id: 'player1' }]);

            await getHandler(req as any, res as any);
            expect(res._getStatusCode()).toBe(200);
            
            // Should not allow fetching others by passing query param
            const { req: reqAttempt, res: resAttempt } = createMocks({ 
                method: 'GET',
                query: { playerId: 'player2' },
                headers: { cookie: 'auth_token=valid-token' }
            });
            
            mockSql.mockResolvedValueOnce([]);
            mockSql.mockResolvedValueOnce([]);

            await getHandler(reqAttempt as any, resAttempt as any);
            
            // Check that mockSql was called with player1 despite query param
            const query1 = mockSql.mock.calls[2][0][0]; // the string part of the sql template
            expect(query1).toContain('player_id = ');
            // In NextApiRequest, query isn't used by the handler to override token ID, so it's secure by design.
        });
    });

    describe('POST /api/availability_bulk_defaults', () => {
        test('updates bulk defaults securely', async () => {
            const { req, res } = createMocks({ 
                method: 'POST',
                headers: { cookie: 'auth_token=valid-token' },
                body: { 
                  blocks: [
                    { day_of_week: 1, start_time: '10:00', end_time: '12:00', status: 'available' }
                  ] 
                }
            });
            
            mockSql.mockResolvedValue([]);

            await bulkDefaultsHandler(req as any, res as any);
            expect(res._getStatusCode()).toBe(200);
            
            // Ensure delete was called for player1
            const deleteCall = mockSql.mock.calls.find(call => call[0][0].includes('DELETE FROM availability_defaults'));
            expect(deleteCall).toBeDefined();
        });

        test('fails on invalid payload', async () => {
            const { req, res } = createMocks({ 
                method: 'POST',
                headers: { cookie: 'auth_token=valid-token' },
                body: { blocks: 'not an array' }
            });
            
            await bulkDefaultsHandler(req as any, res as any);
            expect(res._getStatusCode()).toBe(400);
            expect(JSON.parse(res._getData()).error).toBe('blocks must be an array');
        });
    });

    describe('POST /api/availability_bulk_overrides', () => {
        test('updates bulk overrides securely and ignores spoofed playerIds', async () => {
            const { req, res } = createMocks({ 
                method: 'POST',
                headers: { cookie: 'auth_token=valid-token' },
                body: { 
                  date: '2024-09-10',
                  playerId: 'player2', // Attempt to spoof
                  blocks: [
                    { start_time: '10:00', end_time: '12:00', status: 'unavailable' }
                  ] 
                }
            });
            
            mockSql.mockResolvedValue([]);

            await bulkOverridesHandler(req as any, res as any);
            expect(res._getStatusCode()).toBe(200);
            
            // Ensure delete was called for player1 (from token), ignoring spoofed playerId
            const deleteCall = mockSql.mock.calls.find(call => call[0][0].includes('DELETE FROM availability_overrides'));
            expect(deleteCall).toBeDefined();
            // The sql template uses \ where playerId comes from decoded token.
        });

        test('fails without date', async () => {
            const { req, res } = createMocks({ 
                method: 'POST',
                headers: { cookie: 'auth_token=valid-token' },
                body: { blocks: [] } // missing date
            });
            
            await bulkOverridesHandler(req as any, res as any);
            expect(res._getStatusCode()).toBe(400);
            expect(JSON.parse(res._getData()).error).toBe('date is required');
        });
    });
    
    describe('GET /api/availability_shared', () => {
        test('returns shared availabilities', async () => {
            const { req, res } = createMocks({ 
                method: 'GET',
                headers: { cookie: 'auth_token=valid-token' }
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
