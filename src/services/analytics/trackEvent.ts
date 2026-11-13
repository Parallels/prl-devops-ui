import { amplitudeService } from '../AmplitudeService';
import {
    type AnalyticsEventName,
    type AnalyticsEventProperties,
    type ApiFailureReason,
} from './events';

const MAX_STRING_PROPERTY_LENGTH = 256;

type PropertyBag = Record<string, string | number | boolean>;

/**
 * Keeps event properties to flat primitives: drops undefined/null, objects,
 * arrays and functions, and truncates long strings. This is the last-line
 * guarantee that credentials, hostnames or stack traces can never be attached
 * to an analytics event, even when a caller misbehaves.
 */
export function sanitizeEventProperties(
    properties?: Record<string, unknown>,
): PropertyBag | undefined {
    if (!properties) return undefined;

    const clean: PropertyBag = {};
    for (const [key, value] of Object.entries(properties)) {
        if (typeof value === 'string') {
            clean[key] = value.length > MAX_STRING_PROPERTY_LENGTH
                ? value.slice(0, MAX_STRING_PROPERTY_LENGTH)
                : value;
        } else if (typeof value === 'number' || typeof value === 'boolean') {
            clean[key] = value;
        } else if (import.meta.env.DEV && value !== undefined && value !== null) {
            console.warn(`[Analytics] Dropped non-primitive property "${key}"`);
        }
    }
    return clean;
}

/**
 * Emits a catalogued event with its typed properties. No-ops silently when
 * telemetry is uninitialized or opted out (handled by AmplitudeService).
 */
export function trackEvent<E extends AnalyticsEventName>(
    event: E,
    properties?: AnalyticsEventProperties[E],
): void {
    amplitudeService.logEvent(event, sanitizeEventProperties(properties));
}

/** Maps an ApiError-ish error to the catalogued failure enum. */
export function classifyApiFailure(error: unknown): ApiFailureReason {
    if (typeof error === 'object' && error !== null && 'statusCode' in error) {
        const status = (error as { statusCode?: unknown }).statusCode;
        if (typeof status === 'number') {
            if (status === 401) return 'unauthorized';
            if (status === 403) return 'forbidden';
            if (status === 404) return 'not_found';
            if (status >= 500) return 'server_error';
            if (status >= 400) return 'client_error';
            return 'other';
        }
    }
    if (error instanceof TypeError) return 'network';
    return 'other';
}

/**
 * Wraps an async operation with success/failure event tracking. The
 * operation's result and thrown errors pass through untouched; failure
 * events always carry { failure_reason } classified from the error.
 */
export async function trackOperation<E extends AnalyticsEventName, T = unknown>(
    successEvent: E,
    failureEvent: AnalyticsEventName,
    properties: AnalyticsEventProperties[E] | undefined,
    operation: () => Promise<T>,
): Promise<T> {
    try {
        const result = await operation();
        trackEvent(successEvent, properties);
        return result;
    } catch (error) {
        amplitudeService.logEvent(failureEvent, {
            ...sanitizeEventProperties(properties),
            failure_reason: classifyApiFailure(error),
        });
        throw error;
    }
}
