/**
 * Builds a stable, non-identifying device/OS fingerprint used as the Amplitude
 * `device_id`. It is derived from stable environment signals (user agent,
 * platform, screen, timezone, hardware hints, canvas/WebGL rendering output)
 * and reduced to a hash, so no raw signal leaves the app — only the digest.
 *
 * Notes:
 * - The fingerprint is stable for a given browser+OS+hardware combination, and
 *   changes when those change (e.g. a browser update that alters WebGL output).
 * - Uses SHA-256 via Web Crypto when available; falls back to a 128-bit FNV-1a
 *   digest in insecure contexts (plain HTTP without secure context), where the
 *   Web Crypto API is hidden by the browser.
 */

const FINGERPRINT_VERSION = 'v1';

let cached: Promise<string> | null = null;

function fnv1a128(input: string): string {
    // Two independent 64-bit FNV-1a lanes over different seeds → 32 hex chars.
    const MASK = (1n << 64n) - 1n;
    const PRIME = 1099511628211n;
    let h1 = 14695981039346656037n;
    let h2 = 927111103332482997n;
    let lane = 0;
    for (const ch of new TextEncoder().encode(input)) {
        if (lane % 2 === 0) {
            h1 = ((h1 ^ BigInt(ch)) * PRIME) & MASK;
        } else {
            h2 = ((h2 ^ BigInt(ch)) * PRIME) & MASK;
        }
        lane++;
    }
    return h1.toString(16).padStart(16, '0') + h2.toString(16).padStart(16, '0');
}

async function digest(input: string): Promise<string> {
    const subtle = globalThis.crypto?.subtle;
    if (subtle) {
        const data = new TextEncoder().encode(input);
        const hash = await subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
    }
    return fnv1a128(input);
}

function canvasSignal(): string {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 240;
        canvas.height = 60;
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, '#f00');
        grad.addColorStop(1, '#00f');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textBaseline = 'top';
        ctx.fillText('prl-devops fp\u2764\ufe0f', 4, 4);
        ctx.beginPath();
        ctx.arc(200, 40, 18, 0, Math.PI * 1.25);
        ctx.strokeStyle = 'rgba(0,255,0,0.6)';
        ctx.stroke();
        return canvas.toDataURL();
    } catch {
        return '';
    }
}

function webglSignal(): string {
    try {
        const canvas = document.createElement('canvas');
        const gl = (canvas.getContext('webgl') ?? canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
        if (!gl) return '';
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        const vendor = debugInfo
            ? String(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL))
            : String(gl.getParameter(gl.VENDOR));
        const renderer = debugInfo
            ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL))
            : String(gl.getParameter(gl.RENDERER));
        return `${vendor}|${renderer}`;
    } catch {
        return '';
    }
}

function collectSignals(): string {
    const nav = typeof navigator !== 'undefined' ? navigator : undefined;
    const scr = typeof screen !== 'undefined' ? screen : undefined;
    const uaData = (nav as (Navigator & { userAgentData?: { platform?: string } }) | undefined)?.userAgentData;
    let timezone = '';
    try {
        timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
    } catch {
        timezone = '';
    }

    const parts = [
        FINGERPRINT_VERSION,
        nav?.userAgent ?? '',
        uaData?.platform ?? nav?.platform ?? '',
        (nav?.languages ?? []).join(','),
        nav?.vendor ?? '',
        String(nav?.hardwareConcurrency ?? ''),
        String((nav as (Navigator & { deviceMemory?: number }) | undefined)?.deviceMemory ?? ''),
        String(nav?.maxTouchPoints ?? ''),
        timezone,
        `${scr?.width ?? 0}x${scr?.height ?? 0}x${scr?.colorDepth ?? 0}`,
        String(globalThis.devicePixelRatio ?? ''),
        webglSignal(),
        canvasSignal(),
    ];
    return parts.join('\u0001');
}

/**
 * Returns the device fingerprint as a lowercase hex digest (64 chars with
 * SHA-256, 32 chars when the Web Crypto fallback is used). Memoized.
 */
export function getDeviceFingerprint(): Promise<string> {
    if (!cached) {
        cached = digest(collectSignals()).catch(() => 'unstable-device');
    }
    return cached;
}

/** Test helper: clears the memoized fingerprint so it is recomputed. */
export function resetDeviceFingerprintCache(): void {
    cached = null;
}
