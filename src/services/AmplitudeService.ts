import * as amplitude from '@amplitude/analytics-browser';
import { deobfuscateKey } from '../utils/keyObfuscation';
import { getDeviceFingerprint } from './DeviceFingerprint';

/** Data-store key for the user's telemetry opt-out (defaults to enabled). */
export const TELEMETRY_ENABLED_KEY = 'telemetry_enabled';

/**
 * Sources the Amplitude ingestion key may come from (ours, injected at build
 * or deploy time — users never provide a key), in resolution order:
 *  1. runtime env  — window.__ENV__.AMPLITUDE_API_KEY_OBFUSCATED (Docker)
 *  2. build time   — obfuscated value baked into the bundle via build arg
 *  3. build time   — VITE_AMPLITUDE_API_KEY, plaintext, local dev only
 */
export interface ApiKeySources {
    runtimeObfuscated: string | null;
    bakedObfuscated: string | null;
    buildPlain: string | null;
}

function decodeOrNull(obfuscated: string | null): string | null {
    const token = obfuscated?.trim();
    if (!token) return null;
    const decoded = deobfuscateKey(token);
    if (!decoded) {
        console.warn('[Amplitude] Ignoring malformed obfuscated API key token');
    }
    return decoded;
}

/** Picks the first usable API key from the configured sources. */
export function resolveApiKey(sources: ApiKeySources): string | null {
    const decoded =
        decodeOrNull(sources.runtimeObfuscated) ??
        decodeOrNull(sources.bakedObfuscated);
    if (decoded) return decoded;

    const plain = sources.buildPlain?.trim();
    return plain || null;
}

/** Obfuscated key baked into the bundle at build time ('' when not provided). */
export function getBakedObfuscatedKey(): string | null {
    return typeof __BAKED_AMPLITUDE_API_KEY__ !== 'undefined' && __BAKED_AMPLITUDE_API_KEY__
        ? __BAKED_AMPLITUDE_API_KEY__
        : null;
}

function readSources(): ApiKeySources {
    return {
        runtimeObfuscated: typeof window !== 'undefined'
            ? window.__ENV__?.AMPLITUDE_API_KEY_OBFUSCATED ?? null
            : null,
        bakedObfuscated: getBakedObfuscatedKey(),
        buildPlain: import.meta.env.VITE_AMPLITUDE_API_KEY ?? null,
    };
}

/** The ingestion key injected by the build/deployment, or null. */
export function getDeploymentApiKey(): string | null {
    return resolveApiKey(readSources());
}

class AmplitudeService {
    private isInitialized = false;
    private lastUserId: string | undefined;

    public async init(apiKey: string, userId?: string) {
        if (this.isInitialized) {
            console.warn('Amplitude already initialized');
            return;
        }

        if (!apiKey) {
            console.error('Amplitude API key is missing');
            return;
        }

        this.lastUserId = userId;

        // Privacy-hardened baseline: only page views and sessions, no IP
        // capture, no attribution, no autocapture of clicks/forms/downloads/URLs,
        // and a stable device fingerprint instead of a throwaway cookie UUID.
        const deviceId = await getDeviceFingerprint();

        amplitude.init(apiKey, userId ?? undefined, {
            deviceId,
            defaultTracking: {
                attribution: false,
                fileDownloads: false,
                formInteractions: false,
                pageViews: true,
                sessions: true,
            },
            autocapture: {
                attribution: false,
                elementInteractions: false,
                frustrationInteractions: false,
                networkTracking: false,
                webVitals: false,
                performanceTracking: false,
                pageUrlEnrichment: false,
            },
            trackingOptions: {
                ipAddress: false,
                language: true,
                platform: true,
            },
            // Pin privacy policy locally: remote config could otherwise
            // re-enable org-level autocapture features, and the fetch itself
            // is an extra request carrying the ingestion key.
            fetchRemoteConfig: false,
            enableDiagnostics: false,
        });
        this.isInitialized = true;
    }

    /**
     * Applies a telemetry preference at runtime. Disabling stops dispatching
     * immediately; re-enabling initializes on demand (key comes from the
     * build/deployment injection, never from the user).
     */
    public async setTelemetryEnabled(enabled: boolean): Promise<void> {
        if (enabled) {
            if (this.isInitialized) {
                amplitude.setOptOut(false);
                return;
            }
            const apiKey = getDeploymentApiKey();
            if (apiKey) {
                await this.init(apiKey, this.lastUserId);
            }
        } else if (this.isInitialized) {
            amplitude.setOptOut(true);
        }
    }

    public logEvent(eventName: string, eventProperties?: Record<string, any>) {
        if (!this.isInitialized) {
            // Opt to log locally or queue if strict tracking is needed, 
            // but often silent fail/warn is acceptable for dev/web.
            console.debug(`[Amplitude] (Not Initialized) ${eventName}`, eventProperties);
            return;
        }

        amplitude.track(eventName, eventProperties);
    }

    public setUserId(userId: string) {
        if (this.isInitialized) {
            amplitude.setUserId(userId);
        }
    }

    public get isReady(): boolean {
        return this.isInitialized;
    }

    public async initializeWithConfig(configService: {
        get: <T>(key: string) => Promise<T | null>;
    }) {
        try {
            const telemetryEnabled = await configService
                .get<boolean>(TELEMETRY_ENABLED_KEY)
                .catch(() => null);
            if (telemetryEnabled === false) {
                console.info('[Amplitude] Telemetry disabled by user preference');
                return;
            }

            const userId = await configService.get<string>('user_id').catch(() => null);
            const apiKey = resolveApiKey(readSources());

            if (apiKey) {
                await this.init(apiKey, userId ?? undefined);
            } else {
                console.info('[Amplitude] No API key injected in this build/deployment — analytics disabled');
            }
        } catch (error) {
            console.error('[Amplitude] Failed to initialize with config:', error);
        }
    }
}

export const amplitudeService = new AmplitudeService();
