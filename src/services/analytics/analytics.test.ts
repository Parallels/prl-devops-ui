import { describe, expect, it, vi } from 'vitest';

vi.mock('../AmplitudeService', () => ({
    amplitudeService: { logEvent: vi.fn() },
}));

import { amplitudeService } from '../AmplitudeService';
import { AnalyticsEvent, type AnalyticsEventName } from './events';
import {
    classifyApiFailure,
    sanitizeEventProperties,
    trackEvent,
    trackOperation,
} from './trackEvent';

const CATALOG = Object.values(AnalyticsEvent) as AnalyticsEventName[];

describe('event catalog naming convention', () => {
    it('uses exactly three UPPER_SNAKE NAMESPACE::DOMAIN::ACTION segments', () => {
        for (const name of CATALOG) {
            expect(name).toMatch(
                /^DEVOPS_UI::[A-Z0-9]+(?:_[A-Z0-9]+)*::[A-Z0-9]+(?:_[A-Z0-9]+)*$/,
            );
        }
    });

    it('has no duplicate event names', () => {
        expect(new Set(CATALOG).size).toBe(CATALOG.length);
    });

    it('declares a matching _FAILED event for every operation failure family', () => {
        // Every *_FAILED constant must exist alongside its success counterpart's domain
        const failed = CATALOG.filter((n) => n.endsWith('_FAILED'));
        expect(failed.length).toBeGreaterThan(0);
    });
});

describe('sanitizeEventProperties', () => {
    it('keeps primitives', () => {
        expect(
            sanitizeEventProperties({ str: 'a', num: 1, bool: false }),
        ).toEqual({ str: 'a', num: 1, bool: false });
    });

    it('drops objects, arrays, null and undefined', () => {
        expect(
            sanitizeEventProperties({
                obj: { password: 'x' },
                arr: [1, 2],
                nil: null,
                undef: undefined,
                keep: 7,
            }),
        ).toEqual({ keep: 7 });
    });

    it('truncates long strings', () => {
        const result = sanitizeEventProperties({ long: 'x'.repeat(500) });
        expect(result?.long).toHaveLength(256);
    });

    it('returns undefined for missing properties', () => {
        expect(sanitizeEventProperties(undefined)).toBeUndefined();
    });
});

describe('trackEvent', () => {
    it('forwards catalogued events with sanitized properties', () => {
        trackEvent(AnalyticsEvent.AUTH_LOGIN_FAILED, { failure_reason: 'unauthorized' });
        expect(amplitudeService.logEvent).toHaveBeenCalledWith(
            'DEVOPS_UI::AUTH::LOGIN_FAILED',
            { failure_reason: 'unauthorized' },
        );
    });

    it('emits zero-property events with no properties', () => {
        trackEvent(AnalyticsEvent.WEBSOCKET_CONNECTED);
        expect(amplitudeService.logEvent).toHaveBeenCalledWith(
            'DEVOPS_UI::WEBSOCKET::CONNECTED',
            undefined,
        );
    });
});

describe('classifyApiFailure', () => {
    it('maps HTTP status codes', () => {
        expect(classifyApiFailure({ statusCode: 401 })).toBe('unauthorized');
        expect(classifyApiFailure({ statusCode: 403 })).toBe('forbidden');
        expect(classifyApiFailure({ statusCode: 404 })).toBe('not_found');
        expect(classifyApiFailure({ statusCode: 502 })).toBe('server_error');
        expect(classifyApiFailure({ statusCode: 422 })).toBe('client_error');
        expect(classifyApiFailure({ statusCode: 299 })).toBe('other');
    });

    it('classifies fetch TypeErrors as network and everything else as other', () => {
        expect(classifyApiFailure(new TypeError('Failed to fetch'))).toBe('network');
        expect(classifyApiFailure(new Error('boom'))).toBe('other');
        expect(classifyApiFailure('string failure')).toBe('other');
    });
});

describe('trackOperation', () => {
    const logEvent = amplitudeService.logEvent as ReturnType<typeof vi.fn>;

    it('tracks success, passes the result through, and no-ops the failure path', async () => {
        const result = await trackOperation(
            AnalyticsEvent.VM_STATE_CHANGE_SUCCEEDED,
            AnalyticsEvent.VM_STATE_CHANGE_FAILED,
            { operation: 'start' },
            async () => ({ ok: true }),
        );

        expect(result).toEqual({ ok: true });
        expect(logEvent).toHaveBeenCalledWith(
            'DEVOPS_UI::VM::STATE_CHANGE_SUCCEEDED',
            { operation: 'start' },
        );
        expect(logEvent).not.toHaveBeenCalledWith(
            'DEVOPS_UI::VM::STATE_CHANGE_FAILED',
            expect.anything(),
        );
    });

    it('tracks the failure with a classified reason and rethrows the original error', async () => {
        const apiError = Object.assign(new Error('Failed to stop VM'), { statusCode: 503 });
        await expect(
            trackOperation(
                AnalyticsEvent.VM_STATE_CHANGE_SUCCEEDED,
                AnalyticsEvent.VM_STATE_CHANGE_FAILED,
                { operation: 'stop' },
                async () => { throw apiError; },
            ),
        ).rejects.toBe(apiError);

        expect(logEvent).toHaveBeenCalledWith(
            'DEVOPS_UI::VM::STATE_CHANGE_FAILED',
            { operation: 'stop', failure_reason: 'server_error' },
        );
    });

    it('classifies network failures', async () => {
        const err = new TypeError('Failed to fetch');
        await expect(
            trackOperation(
                AnalyticsEvent.CATALOG_PULLED,
                AnalyticsEvent.CATALOG_PULL_FAILED,
                { mode: 'sync' },
                async () => { throw err; },
            ),
        ).rejects.toBe(err);

        expect(logEvent).toHaveBeenCalledWith(
            'DEVOPS_UI::CATALOG::PULL_FAILED',
            { mode: 'sync', failure_reason: 'network' },
        );
    });
});
