#!/usr/bin/env node
/**
 * Generate the obfuscated token for AMPLITUDE_API_KEY_OBFUSCATED (runtime env
 * for the Docker/nginx deployment).
 *
 * Usage:
 *   node scripts/obfuscate-amplitude-key.mjs <api-key>
 *   AMPLITUDE_API_KEY=... node scripts/obfuscate-amplitude-key.mjs
 *   echo "key" | node scripts/obfuscate-amplitude-key.mjs --stdin
 *
 * The algorithm must stay in sync with src/utils/keyObfuscation.ts.
 */

const PAD = 'prl::devops::amplitude::obfuscation::v1';

function obfuscate(plaintext) {
    const bytes = new TextEncoder().encode(plaintext);
    const padBytes = new TextEncoder().encode(PAD);
    const xored = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
        xored[i] = bytes[i] ^ padBytes[i % padBytes.length];
    }
    return Buffer.from(xored).toString('base64');
}

let key = '';
if (process.argv.includes('--stdin')) {
    const { readFileSync } = await import('node:fs');
    key = readFileSync(0, 'utf8');
} else {
    key = process.argv[2] || process.env.AMPLITUDE_API_KEY || '';
}
key = key.trim();

if (!key) {
    console.error('No key provided. Pass as argument, AMPLITUDE_API_KEY env var, or use --stdin.');
    process.exit(1);
}

console.log(obfuscate(key));
