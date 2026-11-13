import { afterEach, describe, expect, it, vi } from 'vitest';
import { getDeviceFingerprint, resetDeviceFingerprintCache } from './DeviceFingerprint';

describe('DeviceFingerprint', () => {
    afterEach(() => {
        resetDeviceFingerprintCache();
        vi.unstubAllGlobals();
    });

    it('returns a lowercase hex digest', async () => {
        const fp = await getDeviceFingerprint();
        expect(fp).toMatch(/^[0-9a-f]{32,64}$/);
    });

    it('is memoized (same value on repeated calls)', async () => {
        const [a, b] = await Promise.all([getDeviceFingerprint(), getDeviceFingerprint()]);
        expect(a).toBe(b);
    });

    it('changes when a major signal changes', async () => {
        const before = await getDeviceFingerprint();
        Object.defineProperty(window.navigator, 'userAgent', {
            value: 'Mozilla/5.0 (Totally Different OS 42; rv:99.0)',
            configurable: true,
        });
        resetDeviceFingerprintCache();
        const after = await getDeviceFingerprint();
        expect(after).not.toBe(before);
    });

    it('never throws when signals are missing', async () => {
        // jsdom lacks canvas/WebGL support already; the digest path must
        // still resolve even with a hostile environment.
        vi.stubGlobal('screen', undefined);
        resetDeviceFingerprintCache();
        await expect(getDeviceFingerprint()).resolves.toMatch(/^[0-9a-f-]{8,64}$/);
    });
});
