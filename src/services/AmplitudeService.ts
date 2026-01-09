import * as amplitude from '@amplitude/analytics-browser';

class AmplitudeService {
    private isInitialized = false;

    public init(apiKey: string, userId?: string) {
        if (this.isInitialized) {
            console.warn('Amplitude already initialized');
            return;
        }

        if (!apiKey) {
            console.error('Amplitude API key is missing');
            return;
        }

        amplitude.init(apiKey, userId, {
            defaultTracking: true,
        });
        this.isInitialized = true;
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

    public async initializeWithConfig(configService: any) {
        try {
            const apiKey = await configService.getSecret('amplitude_api_key');
            const userId = await configService.get('user_id');
            if (apiKey) {
                this.init(apiKey, userId ?? undefined);
            } else {
                console.warn('[Amplitude] No API key found in config');
            }
        } catch (error) {
            console.error('[Amplitude] Failed to initialize with config:', error);
        }
    }
}

export const amplitudeService = new AmplitudeService();
