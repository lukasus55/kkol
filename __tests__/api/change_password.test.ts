import { expect, test, vi, describe, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/change_password';
import bcrypt from 'bcrypt';
import { verifySession } from '../../lib/auth';
import { validatePassword } from '../../lib/validatePassword';

vi.mock('../../lib/auth', () => ({
    verifySession: vi.fn(),
    revokeAllUserSessions: vi.fn().mockResolvedValue(0),
    AUTH_COOKIE_NAME: 'auth_token'
}));

vi.mock('../../lib/validatePassword', () => ({
    validatePassword: vi.fn(),
    passwordRequirementsNames: {},
    passwordRecomendationsNames: {},
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
        vi.mocked(validatePassword).mockResolvedValue({
            score: 4,
            maxScore: 4,
            requirements: {
                correctLenght: true,
                notNumbersOnly: true,
                notOnList: true,
            },
            recommendations: {} as any
        });
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

    test('returns 404 if user not found', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'player', displayed_name: 'Player', is_active: true },
            session: { id: 'sess1' } as any
        });
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { old_password: 'correct_old', new_password: 'ValidNewPassword123!' }
        });
        mockSql.mockResolvedValueOnce([]); // No user found

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(404);
        expect(JSON.parse(res._getData()).error).toBe('Nie znaleziono użytkownika.');
    });

    test('returns 403 if user account is inactive', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'player', displayed_name: 'Player', is_active: true },
            session: { id: 'sess1' } as any
        });
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { old_password: 'correct_old', new_password: 'ValidNewPassword123!' }
        });
        mockSql.mockResolvedValueOnce([{ id: 'user1', is_active: false, password_hash: 'old_hash' }]);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(403);
        expect(JSON.parse(res._getData()).error).toBe('Konto jest nieaktywne.');
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

    test('returns 400 if new password is the same as old password', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'player', displayed_name: 'Player', is_active: true },
            session: { id: 'sess1' } as any
        });
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { old_password: 'SamePassword12345!', new_password: 'SamePassword12345!' }
        });
        
        mockSql.mockResolvedValueOnce([{ id: 'user1', is_active: true, password_hash: 'old_hash' }]);
        vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData()).error).toBe('Nowe hasło nie może być takie samo jak stare.');
    });

    test('returns 400 if new password is too short', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'player', displayed_name: 'Player', is_active: true },
            session: { id: 'sess1' } as any
        });
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { old_password: 'correct_old', new_password: '123' }
        });
        
        mockSql.mockResolvedValueOnce([{ id: 'user1', is_active: true, password_hash: 'old_hash' }]);
        vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData()).error).toContain('co najmniej 14 znaków');
    });

    test('returns 400 if new password is too long (> 128 characters)', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'player', displayed_name: 'Player', is_active: true },
            session: { id: 'sess1' } as any
        });
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { old_password: 'correct_old', new_password: 'a'.repeat(129) }
        });
        
        mockSql.mockResolvedValueOnce([{ id: 'user1', is_active: true, password_hash: 'old_hash' }]);
        vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData()).error).toContain('maksymalnie 128 znaków');
    });

    test('returns 400 if new password is on compromised list', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'player', displayed_name: 'Player', is_active: true },
            session: { id: 'sess1' } as any
        });
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { old_password: 'correct_old', new_password: 'password12345678' }
        });
        
        mockSql.mockResolvedValueOnce([{ id: 'user1', is_active: true, password_hash: 'old_hash' }]);
        vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);
        vi.mocked(validatePassword).mockResolvedValueOnce({
            score: 0,
            maxScore: 4,
            requirements: {
                correctLenght: true,
                notNumbersOnly: true,
                notOnList: false,
            },
            recommendations: {} as any
        });

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData()).error).toContain('liście słabych i wykradzionych haseł');
    });

    test('returns 400 if new password consists only of numbers', async () => {
        vi.mocked(verifySession).mockResolvedValueOnce({
            user: { id: 'user1', role: 'player', displayed_name: 'Player', is_active: true },
            session: { id: 'sess1' } as any
        });
        const { req, res } = createMocks({ 
            method: 'POST', 
            body: { old_password: 'correct_old', new_password: '12345678901234' }
        });
        
        mockSql.mockResolvedValueOnce([{ id: 'user1', is_active: true, password_hash: 'old_hash' }]);
        vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);
        vi.mocked(validatePassword).mockResolvedValueOnce({
            score: 0,
            maxScore: 4,
            requirements: {
                correctLenght: true,
                notNumbersOnly: false,
                notOnList: true,
            },
            recommendations: {} as any
        });

        await handler(req as any, res as any);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData()).error).toContain('wyłącznie z cyfr');
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
