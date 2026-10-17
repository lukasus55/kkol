import { expect, test, vi, describe, beforeEach } from 'vitest';
import {
    validatePassword,
    isNumbersOnly,
    hasLowerCase,
    hasUpperCase,
    hasNumber,
    hasSpecialChar,
    isCompromisedPassword,
    passwordRequirementsNames,
    passwordRecomendationsNames
} from '../../lib/validatePassword';
import { ensureAbsoluteUrl } from '../../lib/utils';

describe('validatePassword utility (lib/validatePassword.ts)', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    describe('Helper character checkers', () => {
        test('isNumbersOnly correctly detects numeric-only strings', () => {
            expect(isNumbersOnly('1234567890')).toBe(true);
            expect(isNumbersOnly('1234a56789')).toBe(false);
            expect(isNumbersOnly('')).toBe(false);
        });

        test('hasLowerCase detects presence of lowercase characters', () => {
            expect(hasLowerCase('ABCdEF')).toBe(true);
            expect(hasLowerCase('ABCDEF')).toBe(false);
            expect(hasLowerCase('123456')).toBe(false);
        });

        test('hasUpperCase detects presence of uppercase characters', () => {
            expect(hasUpperCase('abcdEf')).toBe(true);
            expect(hasUpperCase('abcdef')).toBe(false);
            expect(hasUpperCase('123456')).toBe(false);
        });

        test('hasNumber detects presence of digits', () => {
            expect(hasNumber('password1')).toBe(true);
            expect(hasNumber('password')).toBe(false);
        });

        test('hasSpecialChar detects presence of allowed special characters', () => {
            expect(hasSpecialChar('pass!word')).toBe(true);
            expect(hasSpecialChar('pass@word')).toBe(true);
            expect(hasSpecialChar('password')).toBe(false);
        });
    });

    describe('isCompromisedPassword', () => {
        test('returns true when suffix is found in HIBP response', async () => {
            const encoder = new TextEncoder();
            const data = encoder.encode('password');
            const hashBuffer = await crypto.subtle.digest('SHA-1', data);
            const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
            const suffix = hashHex.substring(5);

            const mockFetch = vi.fn().mockResolvedValue({
                text: async () => `0018A45C4D:3\n${suffix}:42\n`
            });
            global.fetch = mockFetch as any;

            const isCompromised = await isCompromisedPassword('password');
            expect(mockFetch).toHaveBeenCalled();
            expect(isCompromised).toBe(true);
        });

        test('returns false when suffix is not found in HIBP response', async () => {
            const mockFetch = vi.fn().mockResolvedValue({
                text: async () => '00000000000000000000000000000000000:1\n'
            });
            global.fetch = mockFetch as any;

            const isCompromised = await isCompromisedPassword('SuperRandomUniquePass2026!');
            expect(isCompromised).toBe(false);
        });

        test('returns false and logs error when fetch fails', async () => {
            const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
            global.fetch = mockFetch as any;

            const isCompromised = await isCompromisedPassword('anyPassword');
            expect(isCompromised).toBe(false);
        });
    });

    describe('validatePassword', () => {
        test('handles empty or non-string input gracefully', async () => {
            const resNull = await validatePassword(null as any);
            expect(resNull.score).toBe(0);
            expect(resNull.requirements.correctLenght).toBe(false);

            const resEmpty = await validatePassword('');
            expect(resEmpty.score).toBe(0);
            expect(resEmpty.requirements.correctLenght).toBe(false);
        });

        test('correctly validates a strong, compliant password', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                text: async () => ''
            }) as any;

            const res = await validatePassword('SafeP@ssword2026!LongEnough');
            expect(res.requirements.correctLenght).toBe(true);
            expect(res.requirements.notNumbersOnly).toBe(true);
            expect(res.requirements.notOnList).toBe(true);
            expect(res.score).toBe(4);
        });

        test('sets score to 0 if any requirement fails', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                text: async () => ''
            }) as any;

            // 14 digits: meets recommendations for numbers and length, but fails notNumbersOnly
            const res = await validatePassword('12345678901234');
            expect(res.requirements.notNumbersOnly).toBe(false);
            expect(res.score).toBe(0);
        });

        test('exports human-readable requirement and recommendation labels', () => {
            expect(passwordRequirementsNames.correctLenght).toBeDefined();
            expect(passwordRequirementsNames.notNumbersOnly).toBeDefined();
            expect(passwordRequirementsNames.notOnList).toBeDefined();
            expect(passwordRecomendationsNames.lowerCaseChar).toBeDefined();
        });
    });
});

describe('ensureAbsoluteUrl utility (lib/utils.ts)', () => {
    test('returns empty string for falsy input', () => {
        expect(ensureAbsoluteUrl('')).toBe('');
        expect(ensureAbsoluteUrl(null as any)).toBe('');
    });

    test('preserves existing https:// and http:// urls', () => {
        expect(ensureAbsoluteUrl('https://kkol.pl')).toBe('https://kkol.pl');
        expect(ensureAbsoluteUrl('http://kkol.pl')).toBe('http://kkol.pl');
    });

    test('prepends https:// to relative or plain domain urls', () => {
        expect(ensureAbsoluteUrl('kkol.pl')).toBe('https://kkol.pl');
        expect(ensureAbsoluteUrl('youtube.com/watch?v=123')).toBe('https://youtube.com/watch?v=123');
    });
});
