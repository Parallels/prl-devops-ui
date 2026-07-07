const CRYPTO_ERROR_PREFIX = 'Secure context required to encrypt secrets';

export function getCryptoMode(): 'encrypted' | 'insecure-trial' {
    const secure = window.isSecureContext && !!globalThis.crypto?.subtle;
    if (secure) return 'encrypted';

    const allowInsecure = typeof window.__ENV__ !== 'undefined'
        && window.__ENV__.ALLOW_INSECURE_STORAGE === true;
    if (allowInsecure) return 'insecure-trial';

    throw new Error(
        CRYPTO_ERROR_PREFIX + '. You\'re on an insecure origin '
        + '(HTTP over a non-loopback address), so the browser hides the Web Crypto API. '
        + 'Serve over HTTPS, reach the app via localhost, or set ALLOW_INSECURE_STORAGE=true '
        + 'to run in insecure mode (secrets stored without encryption — not for production).'
    );
}

export function isInsecureTrialMode(): boolean {
    try {
        return getCryptoMode() === 'insecure-trial';
    } catch {
        return false;
    }
}

export function isCryptoUnavailableError(error: unknown): boolean {
    return error instanceof Error && error.message.startsWith(CRYPTO_ERROR_PREFIX);
}