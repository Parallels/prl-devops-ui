import { describe, expect, it } from 'vitest';
import { deobfuscateKey, obfuscateKey } from './keyObfuscation';

describe('keyObfuscation', () => {
    it('round-trips an ASCII API key', () => {
        const key = 'abc0123456789def0123456789abcd';
        const token = obfuscateKey(key);
        expect(token).not.toContain(key);
        expect(deobfuscateKey(token)).toBe(key);
    });

    it('round-trips non-ASCII input', () => {
        const key = 'k\u00e9y-\u00fcnicode-123';
        expect(deobfuscateKey(obfuscateKey(key))).toBe(key);
    });

    it('produces pure base64 tokens', () => {
        expect(obfuscateKey('some-key-123')).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
    });

    it('returns null for invalid base64', () => {
        expect(deobfuscateKey('not valid base64!!')).toBeNull();
    });

    it('returns null for base64 that is not valid UTF-8 after un-XOR', () => {
        // '//' decodes to the single byte 0xFB; un-XORing gives 0x8B, an
        // invalid UTF-8 lead byte, so the fatal decoder must reject it.
        expect(deobfuscateKey('//')).toBeNull();
    });

    it('returns null for an empty token', () => {
        expect(deobfuscateKey('')).toBeNull();
    });
});
