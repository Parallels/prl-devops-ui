/**
 * Lightweight obfuscation for the Amplitude ingestion API key.
 *
 * IMPORTANT: this is OBFUSCATION, not encryption. The client must be able to
 * decode the key to send analytics events, so anyone determined can recover it.
 * The goal is only to keep the plaintext key out of built JS bundles,
 * runtime env files (env-config.js) and source control scans. Amplitude
 * ingestion keys are write-only ("ingest") keys, which limits the blast radius.
 *
 * Algorithm: XOR the UTF-8 bytes with a repeating pad, then base64 the result.
 * Implementations that produce tokens for the runtime env variable must use
 * the same algorithm — see scripts/obfuscate-amplitude-key.mjs.
 */

const PAD = 'prl::devops::amplitude::obfuscation::v1';

function xorPad(bytes: Uint8Array): Uint8Array {
    const padBytes = new TextEncoder().encode(PAD);
    const out = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
        out[i] = bytes[i] ^ padBytes[i % padBytes.length];
    }
    return out;
}

function bytesToBase64(bytes: Uint8Array): string {
    if (typeof btoa === 'function') {
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
    // Node (vite.config.ts, scripts) fallback
    return Buffer.from(bytes).toString('base64');
}

function base64ToBytes(token: string): Uint8Array {
    if (typeof atob === 'function') {
        const binary = atob(token);
        const out = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            out[i] = binary.charCodeAt(i);
        }
        return out;
    }
    // Node fallback
    return new Uint8Array(Buffer.from(token, 'base64'));
}

/** Obfuscate a plaintext key into a token safe to embed in bundles/env files. */
export function obfuscateKey(plaintext: string): string {
    return bytesToBase64(xorPad(new TextEncoder().encode(plaintext)));
}

/**
 * Reverse of {@link obfuscateKey}. Returns null when the token is not valid
 * base64 or does not decode to valid UTF-8 (i.e. it was not produced by
 * obfuscateKey).
 */
export function deobfuscateKey(token: string): string | null {
    try {
        const bytes = base64ToBytes(token);
        const plaintext = new TextDecoder('utf-8', { fatal: true }).decode(xorPad(bytes));
        return plaintext.length > 0 ? plaintext : null;
    } catch {
        return null;
    }
}
