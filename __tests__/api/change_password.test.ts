import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/change_password';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

vi.mock('jsonwebtoken', () => ({
    default: {
        verify: vi.fn()
    }
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
        process.env.JWT_SECRET = 'test-secret';
    });

    test('returns 401 if missing token', async () => {
        const { req, res } = createMocks({ method: 'POST' });
        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
    });

    test('returns 400 if missing body fields', async () => {
        const { req, res } = createMocks({ 
            method: 'POST', 
            headers: { cookie: 'auth_token=valid' }
        });
        
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);
        mockSql.mockResolvedValueOnce([{ id: 'user1', is_active: true, password_hash: 'old_hash' }]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData()).error).toBe('Wypełnij wszystkie wymagane pola.');
    });

    test('returns 401 on incorrect old password', async () => {
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { old_password: 'wrong', new_password: 'new_password123!' },
            headers: { cookie: 'auth_token=valid' }
        });
        
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);
        mockSql.mockResolvedValueOnce([{ id: 'user1', is_active: true, password_hash: 'old_hash' }]);
        vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as never);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(401);
        expect(JSON.parse(res._getData()).error).toBe('Niepoprawne hasło.');
    });

    test('returns 400 on weak password or same as old', async () => {
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { old_password: 'oldpass', new_password: 'short' },
            headers: { cookie: 'auth_token=valid' }
        });
        
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);
        mockSql.mockResolvedValueOnce([{ id: 'user1', is_active: true, password_hash: 'old_hash' }]);
        vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never); // old pass is correct

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData()).error).toBe('Hasło musi mieć co najmniej 14 znaków.');
    });

    test('successfully changes password', async () => {
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { old_password: 'oldpass', new_password: 'ValidLongPassword123!' },
            headers: { cookie: 'auth_token=valid' }
        });
        
        vi.mocked(jwt.verify).mockReturnValue({ id: 'user1' } as any);
        mockSql.mockResolvedValueOnce([{ id: 'user1', is_active: true, password_hash: 'old_hash' }]);
        vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never); 
        vi.mocked(bcrypt.hash).mockResolvedValueOnce('new_hash' as never);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData()).message).toBe('Hasło zostało pomyślnie zaktualizowane.');
        expect(mockSql).toHaveBeenCalledTimes(2); // SELECT and UPDATE
    });
});
