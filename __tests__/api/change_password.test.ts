import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/change_password';
import bcrypt from 'bcrypt';
import { verifySession } from '../../lib/auth';

vi.mock('../../lib/auth', () => ({
    verifySession: vi.fn(),
    revokeAllUserSessions: vi.fn().mockResolvedValue(0),
    AUTH_COOKIE_NAME: 'auth_token'
}));

vi.mock('bcrypt', () => ({
    default: {
        compare: vi.fn(),
        hash: vi.fn()
    }
}));

const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }));
vi.mock('../../db.js', () => ({ default: mockSql }));

describe('Change Password API (/api/change_password)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('returns 401 if session is invalid or revoked', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce(null);
        const { req, res } = createMocks({ method: 'POST' });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
        expect(JSON.parse(res._getData()).error).toBe('Not authenticated');
    });

    test('returns 400 if missing body fields', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'player', displayed_name: 'Player', is_active: true },
            session: { id: 'sess1' } as any
        });
        const { req, res } = createMocks({ 
            method: 'POST',
            body: {}
        });

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData()).error).toBe('Wypełnij wszystkie wymagane pola.');
    });

    test('returns 401 on incorrect old password', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'player', displayed_name: 'Player', is_active: true },
            session: { id: 'sess1' } as any
        });
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { old_password: 'wrong', new_password: 'new_password123!' }
        });
        
        mockSql.mockResolvedValueOnce([{ id: 'user1', is_active: true, password_hash: 'old_hash' }]);
        vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as never);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
        expect(JSON.parse(res._getData()).error).toBe('Niepoprawne hasło.');
    });

    test('returns 400 if new password is too weak', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'player', displayed_name: 'Player', is_active: true },
            session: { id: 'sess1' } as any
        });
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { old_password: 'correct_old', new_password: '123' } // too short
        });
        
        mockSql.mockResolvedValueOnce([{ id: 'user1', is_active: true, password_hash: 'old_hash' }]);
        vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData()).error).toContain('Hasło musi mieć');
    });

    test('successfully changes password and updates database', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'player', displayed_name: 'Player', is_active: true },
            session: { id: 'sess1' } as any
        });
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { old_password: 'correct_old', new_password: 'VeryUniquePassword987!@#Xyz' }
        });
        
        mockSql.mockResolvedValueOnce([{ id: 'user1', is_active: true, password_hash: 'old_hash' }]);
        vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);
        vi.mocked(bcrypt.hash).mockResolvedValueOnce('new_hashed_password' as never);
        mockSql.mockResolvedValueOnce([]); // UPDATE query

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData()).message).toBe('Hasło zostało pomyślnie zaktualizowane.');
    });
});
