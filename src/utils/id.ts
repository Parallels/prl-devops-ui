const HEX = '0123456789abcdef';

function randHex(n: number): string {
    const buf = new Uint8Array(n);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(buf);
    } else {
        for (let i = 0; i < n; i++) {
            buf[i] = Math.floor(Math.random() * 256);
        }
    }
    let s = '';
    for (let i = 0; i < n; i++) {
        s += HEX[buf[i] & 0xf];
        s += HEX[(buf[i] >> 4) & 0xf];
    }
    return s;
}

export function generateId(): string {
    if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
        return (crypto as any).randomUUID();
    }
    // Fallback: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    return `${randHex(4)}${randHex(2)}-${randHex(2)}-${randHex(2)}-${randHex(2)}${randHex(6)}`;
}