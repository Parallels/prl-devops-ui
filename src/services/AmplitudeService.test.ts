import { beforeEach, describe, expect, it, vi } from 'vitest';
import { obfuscateKey } from '../utils/keyObfuscation';

vi.mock('@amplitude/analytics-browser', () => ({
    init: vi.fn(),
    track: vi.fn(),
    setUserId: vi.fn(),
    setOptOut: vi.fn(),
}));

import * as amplitude from '@amplitude/analytics-browser';
import {
    TELEMETRY_ENABLED_KEY,
    amplitudeService,
    resolveApiKey,
} from './AmplitudeService';

const KEY = 'aa11bb22cc33dd44ee55ff6600112233';

type ConfigGetter = { get: <T>(key: string) => Promise<T | null> };

function makeConfigService(telemetry: boolean | null): ConfigGetter {
    const get = async <T,>(key: string): Promise<T | null> => {
        if (key === TELEMETRY_ENABLED_KEY) return telemetry as T | null;
        return null;
    };
    return { get };
}

describe('resolveApiKey', () => {
    it('decodes the runtime obfuscated token', () => {
        expect(
            resolveApiKey({
                runtimeObfuscated: obfuscateKey(KEY),
                bakedObfuscated: null,
                buildPlain: null,
            }),
        ).toBe(KEY);
    });

    it('falls back to baked, then plaintext dev key', () => {
        expect(
            resolveApiKey({
                runtimeObfuscated: null,
                bakedObfuscated: obfuscateKey(KEY),
                buildPlain: 'ignored',
            }),
        ).toBe(KEY);
        expect(
            resolveApiKey({
                runtimeObfuscated: null,
                bakedObfuscated: null,
                buildPlain: 'dev-plain-key',
            }),
        ).toBe('dev-plain-key');
    });

    it('skips a malformed obfuscated token and keeps falling back', () => {
        expect(
            resolveApiKey({
                runtimeObfuscated: 'not-base64!!',
                bakedObfuscated: obfuscateKey(KEY),
                buildPlain: null,
            }),
        ).toBe(KEY);
    });

    it('returns null when nothing is configured', () => {
        expect(
            resolveApiKey({
                runtimeObfuscated: null,
                bakedObfuscated: '',
                buildPlain: '  ',
            }),
        ).toBeNull();
    });
});

describe('amplitudeService.initializeWithConfig', () => {
    beforeEach(() => {
        vi.mocked(amplitude.init).mockClear();
        vi.mocked(amplitude.setOptOut).mockClear();
        delete window.__ENV__;
    });

    it('respects the telemetry opt-out preference', async () => {
        await amplitudeService.initializeWithConfig(makeConfigService(false));
        expect(amplitude.init).not.toHaveBeenCalled();
        expect(amplitudeService.isReady).toBe(false);
    });

    it('does not initialize without an injected key', async () => {
        await amplitudeService.initializeWithConfig(makeConfigService(null));
        expect(amplitude.init).not.toHaveBeenCalled();
        expect(amplitudeService.isReady).toBe(false);
    });

    it('initializes from the injected key with hardened options', async () => {
        window.__ENV__ = { AMPLITUDE_API_KEY_OBFUSCATED: obfuscateKey(KEY) };
        await amplitudeService.initializeWithConfig(makeConfigService(true));

        expect(amplitude.init).toHaveBeenCalledTimes(1);
        const [apiKey, userId, options] = vi.mocked(amplitude.init).mock.calls[0];
        expect(apiKey).toBe(KEY);
        expect(userId).toBeUndefined();

        expect(options?.deviceId).toMatch(/^[0-9a-f]{32,64}$/);
        expect(options?.trackingOptions).toEqual({
            ipAddress: false,
            language: true,
            platform: true,
        });
        expect(options?.defaultTracking).toEqual({
            attribution: false,
            fileDownloads: false,
            formInteractions: false,
            pageViews: true,
            sessions: true,
        });
        expect(options?.autocapture).toEqual({
            attribution: false,
            elementInteractions: false,
            frustrationInteractions: false,
            networkTracking: false,
            webVitals: false,
            performanceTracking: false,
            pageUrlEnrichment: false,
        });
        expect(options?.fetchRemoteConfig).toBe(false);
        expect(options?.enableDiagnostics).toBe(false);
        expect(amplitudeService.isReady).toBe(true);
    });

    it('ignores further initialization calls once active', async () => {
        // initializeWithConfig reads only the preference and the injected key
        // sources — user-provided keys no longer exist as a concept.
        await amplitudeService.initializeWithConfig(makeConfigService(true));
        expect(amplitude.init).not.toHaveBeenCalled();
    });
});

describe('amplitudeService.setTelemetryEnabled (runtime toggle)', () => {
    beforeEach(() => {
        vi.mocked(amplitude.setOptOut).mockClear();
    });

    it('opts out immediately when disabled', async () => {
        await amplitudeService.setTelemetryEnabled(false);
        expect(amplitude.setOptOut).toHaveBeenCalledWith(true);
    });

    it('opts back in when re-enabled while already initialized', async () => {
        await amplitudeService.setTelemetryEnabled(true);
        expect(amplitude.setOptOut).toHaveBeenCalledWith(false);
    });
});
