/**
 * Central event catalog — the single source of truth for analytics event
 * names and their typed payloads, following the open-source
 * `NAMESPACE::DOMAIN::ACTION` convention (e.g. CAPSULES::MARKETPLACE_API::HEARTBEAT,
 * Sentry's Events::Issue::Created).
 *
 * Rules:
 *  - Names are exactly three `::`-separated segments:
 *    DEVOPS_UI::<DOMAIN>::<ACTION>, UPPER_SNAKE segments (enforced by analytics.test.ts).
 *  - Properties must be primitives (string/number/boolean). trackEvent()
 *    drops everything else and truncates long strings, so credentials,
 *    hostnames, identifiers, emails or stack traces can never leak into events.
 *  - Never add free-text user content; prefer enums, booleans, counts, durations.
 *  - Async operations are tracked at ACCEPTANCE (sync|async); their true
 *    completion is captured by DEVOPS_UI::JOB::RESOLVED.
 */

export const AnalyticsEvent = {
    // ── AUTH ────────────────────────────────────────────────────────────────
    /** A host login completed successfully (token stored). */
    AUTH_LOGIN_SUCCEEDED: 'DEVOPS_UI::AUTH::LOGIN_SUCCEEDED',
    /** A host login attempt failed. */
    AUTH_LOGIN_FAILED: 'DEVOPS_UI::AUTH::LOGIN_FAILED',
    /** The user logged out of a host (token discarded). */
    AUTH_LOGOUT: 'DEVOPS_UI::AUTH::LOGOUT',

    // ── HOST ────────────────────────────────────────────────────────────────
    /** A new host was added to the workspace. */
    HOST_ADDED: 'DEVOPS_UI::HOST::ADDED',
    /** Host settings were edited and saved. */
    HOST_UPDATED: 'DEVOPS_UI::HOST::UPDATED',
    /** A host was removed from the workspace. */
    HOST_REMOVED: 'DEVOPS_UI::HOST::REMOVED',

    // ── VM ──────────────────────────────────────────────────────────────────
    /** A power/state operation (start/stop/…) completed. */
    VM_STATE_CHANGE_SUCCEEDED: 'DEVOPS_UI::VM::STATE_CHANGE_SUCCEEDED',
    VM_STATE_CHANGE_FAILED: 'DEVOPS_UI::VM::STATE_CHANGE_FAILED',
    /** A VM was deleted or unregistered. */
    VM_REMOVED: 'DEVOPS_UI::VM::REMOVED',
    VM_REMOVE_FAILED: 'DEVOPS_UI::VM::REMOVE_FAILED',
    /** A VM was cloned. */
    VM_CLONED: 'DEVOPS_UI::VM::CLONED',
    VM_CLONE_FAILED: 'DEVOPS_UI::VM::CLONE_FAILED',
    /** A VM provisioning from a catalog was accepted (async = job follows). */
    VM_PROVISIONED: 'DEVOPS_UI::VM::PROVISIONED',
    VM_PROVISION_FAILED: 'DEVOPS_UI::VM::PROVISION_FAILED',
    /** A snapshot was created / reverted / deleted. */
    VM_SNAPSHOT_CREATED: 'DEVOPS_UI::VM::SNAPSHOT_CREATED',
    VM_SNAPSHOT_CREATE_FAILED: 'DEVOPS_UI::VM::SNAPSHOT_CREATE_FAILED',
    VM_SNAPSHOT_REVERTED: 'DEVOPS_UI::VM::SNAPSHOT_REVERTED',
    VM_SNAPSHOT_REVERT_FAILED: 'DEVOPS_UI::VM::SNAPSHOT_REVERT_FAILED',
    VM_SNAPSHOTS_DELETED: 'DEVOPS_UI::VM::SNAPSHOTS_DELETED',
    VM_SNAPSHOTS_DELETE_FAILED: 'DEVOPS_UI::VM::SNAPSHOTS_DELETE_FAILED',

    // ── CATALOG ─────────────────────────────────────────────────────────────
    /** A catalog push/pull completed (or was accepted, for async mode). */
    CATALOG_PUSHED: 'DEVOPS_UI::CATALOG::PUSHED',
    CATALOG_PUSH_FAILED: 'DEVOPS_UI::CATALOG::PUSH_FAILED',
    CATALOG_PULLED: 'DEVOPS_UI::CATALOG::PULLED',
    CATALOG_PULL_FAILED: 'DEVOPS_UI::CATALOG::PULL_FAILED',
    /** A catalog manifest was removed from a host. */
    CATALOG_MANIFEST_REMOVED: 'DEVOPS_UI::CATALOG::MANIFEST_REMOVED',
    CATALOG_MANIFEST_REMOVE_FAILED: 'DEVOPS_UI::CATALOG::MANIFEST_REMOVE_FAILED',
    /** A catalog manifest taint flag was set or cleared. */
    CATALOG_MANIFEST_TAINTED: 'DEVOPS_UI::CATALOG::MANIFEST_TAINTED',
    CATALOG_MANIFEST_TAINT_FAILED: 'DEVOPS_UI::CATALOG::MANIFEST_TAINT_FAILED',

    // ── PROXY ───────────────────────────────────────────────────────────────
    PROXY_ENABLED: 'DEVOPS_UI::PROXY::ENABLED',
    PROXY_DISABLED: 'DEVOPS_UI::PROXY::DISABLED',
    PROXY_RESTARTED: 'DEVOPS_UI::PROXY::RESTARTED',
    PROXY_RESTART_FAILED: 'DEVOPS_UI::PROXY::RESTART_FAILED',
    /** An HTTP or TCP route was created or updated. */
    PROXY_ROUTE_UPSERTED: 'DEVOPS_UI::PROXY::ROUTE_UPSERTED',
    PROXY_ROUTE_UPSERT_FAILED: 'DEVOPS_UI::PROXY::ROUTE_UPSERT_FAILED',
    PROXY_ROUTE_DELETED: 'DEVOPS_UI::PROXY::ROUTE_DELETED',
    PROXY_ROUTE_DELETE_FAILED: 'DEVOPS_UI::PROXY::ROUTE_DELETE_FAILED',
    PROXY_ROUTE_REORDERED: 'DEVOPS_UI::PROXY::ROUTE_REORDERED',
    PROXY_ROUTE_REORDER_FAILED: 'DEVOPS_UI::PROXY::ROUTE_REORDER_FAILED',

    // ── APIKEY ──────────────────────────────────────────────────────────────
    APIKEY_CREATED: 'DEVOPS_UI::APIKEY::CREATED',
    APIKEY_REVOKED: 'DEVOPS_UI::APIKEY::REVOKED',
    APIKEY_REVOKE_FAILED: 'DEVOPS_UI::APIKEY::REVOKE_FAILED',

    // ── USER (counts only — never names or emails) ─────────────────────────
    USER_CREATED: 'DEVOPS_UI::USER::CREATED',
    USER_UPDATED: 'DEVOPS_UI::USER::UPDATED',
    USER_REMOVED: 'DEVOPS_UI::USER::REMOVED',

    // ── JOB ─────────────────────────────────────────────────────────────────
    /** A job reached its final state (covers async operations end-to-end). */
    JOB_RESOLVED: 'DEVOPS_UI::JOB::RESOLVED',

    // ── WEBSOCKET ───────────────────────────────────────────────────────────
    /** A realtime (WebSocket) connection reached OPEN. */
    WEBSOCKET_CONNECTED: 'DEVOPS_UI::WEBSOCKET::CONNECTED',
    /** An established realtime connection closed. */
    WEBSOCKET_DISCONNECTED: 'DEVOPS_UI::WEBSOCKET::DISCONNECTED',

    // ── TELEMETRY ───────────────────────────────────────────────────────────
    /** User explicitly turned telemetry ON in Settings.
     *  (Turning it OFF intentionally emits nothing — the opt-out must be honoured
     *  immediately and leave no trace.) */
    TELEMETRY_ENABLED: 'DEVOPS_UI::TELEMETRY::ENABLED',
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];

export type AuthFailureReason = ApiFailureReason;

/** Shared classification of API/operation failures (no raw messages travel). */
export type ApiFailureReason =
    | 'unauthorized'
    | 'forbidden'
    | 'not_found'
    | 'server_error'
    | 'client_error'
    | 'network'
    | 'other';

export type VmStateOperation = 'start' | 'stop' | 'pause' | 'resume' | 'suspend';
export type HostConnectMethod = 'api_connect' | 'ssh_deploy' | 'local_agent';
export type HostAddSource = 'settings' | 'onboarding';
export type SyncMode = 'sync' | 'async';
export type RouteProtocol = 'http' | 'tcp';
export type VmRemoveMode = 'delete' | 'unregister';
export type SnapshotDeleteScope = 'one' | 'all';
export type JobOutcome = 'succeeded' | 'failed';

/**
 * Property contract per event. Omitted entries (via Record<string, never>)
 * mean the event carries no properties. Failure events get their
 * { failure_reason } automatically from trackOperation().
 */
export interface AnalyticsEventProperties {
    [AnalyticsEvent.AUTH_LOGIN_SUCCEEDED]: { login_duration_ms?: number };
    [AnalyticsEvent.AUTH_LOGIN_FAILED]: { failure_reason: AuthFailureReason };
    [AnalyticsEvent.AUTH_LOGOUT]: Record<string, never>;

    [AnalyticsEvent.HOST_ADDED]: {
        connect_method: HostConnectMethod;
        source: HostAddSource;
    };
    [AnalyticsEvent.HOST_UPDATED]: Record<string, never>;
    [AnalyticsEvent.HOST_REMOVED]: Record<string, never>;

    [AnalyticsEvent.VM_STATE_CHANGE_SUCCEEDED]: { operation: VmStateOperation };
    [AnalyticsEvent.VM_STATE_CHANGE_FAILED]: { operation: VmStateOperation };
    [AnalyticsEvent.VM_REMOVED]: { mode: VmRemoveMode };
    [AnalyticsEvent.VM_REMOVE_FAILED]: { failure_reason: ApiFailureReason };
    [AnalyticsEvent.VM_CLONED]: Record<string, never>;
    [AnalyticsEvent.VM_CLONE_FAILED]: { failure_reason: ApiFailureReason };
    [AnalyticsEvent.VM_PROVISIONED]: { mode: SyncMode };
    [AnalyticsEvent.VM_PROVISION_FAILED]: { failure_reason: ApiFailureReason };
    [AnalyticsEvent.VM_SNAPSHOT_CREATED]: Record<string, never>;
    [AnalyticsEvent.VM_SNAPSHOT_CREATE_FAILED]: { failure_reason: ApiFailureReason };
    [AnalyticsEvent.VM_SNAPSHOT_REVERTED]: Record<string, never>;
    [AnalyticsEvent.VM_SNAPSHOT_REVERT_FAILED]: { failure_reason: ApiFailureReason };
    [AnalyticsEvent.VM_SNAPSHOTS_DELETED]: { scope: SnapshotDeleteScope };
    [AnalyticsEvent.VM_SNAPSHOTS_DELETE_FAILED]: { failure_reason: ApiFailureReason };

    [AnalyticsEvent.CATALOG_PUSHED]: { mode: SyncMode };
    [AnalyticsEvent.CATALOG_PUSH_FAILED]: { failure_reason: ApiFailureReason };
    [AnalyticsEvent.CATALOG_PULLED]: { mode: SyncMode };
    [AnalyticsEvent.CATALOG_PULL_FAILED]: { failure_reason: ApiFailureReason };
    [AnalyticsEvent.CATALOG_MANIFEST_REMOVED]: Record<string, never>;
    [AnalyticsEvent.CATALOG_MANIFEST_REMOVE_FAILED]: { failure_reason: ApiFailureReason };
    [AnalyticsEvent.CATALOG_MANIFEST_TAINTED]: { tainted: boolean };
    [AnalyticsEvent.CATALOG_MANIFEST_TAINT_FAILED]: { failure_reason: ApiFailureReason };

    [AnalyticsEvent.PROXY_ENABLED]: Record<string, never>;
    [AnalyticsEvent.PROXY_DISABLED]: Record<string, never>;
    [AnalyticsEvent.PROXY_RESTARTED]: Record<string, never>;
    [AnalyticsEvent.PROXY_RESTART_FAILED]: { failure_reason: ApiFailureReason };
    [AnalyticsEvent.PROXY_ROUTE_UPSERTED]: { protocol: RouteProtocol };
    [AnalyticsEvent.PROXY_ROUTE_UPSERT_FAILED]: { protocol: RouteProtocol };
    [AnalyticsEvent.PROXY_ROUTE_DELETED]: { protocol: RouteProtocol };
    [AnalyticsEvent.PROXY_ROUTE_DELETE_FAILED]: { failure_reason: ApiFailureReason };
    [AnalyticsEvent.PROXY_ROUTE_REORDERED]: Record<string, never>;
    [AnalyticsEvent.PROXY_ROUTE_REORDER_FAILED]: { failure_reason: ApiFailureReason };

    [AnalyticsEvent.APIKEY_CREATED]: Record<string, never>;
    [AnalyticsEvent.APIKEY_REVOKED]: Record<string, never>;
    [AnalyticsEvent.APIKEY_REVOKE_FAILED]: { failure_reason: ApiFailureReason };

    [AnalyticsEvent.USER_CREATED]: Record<string, never>;
    [AnalyticsEvent.USER_UPDATED]: Record<string, never>;
    [AnalyticsEvent.USER_REMOVED]: Record<string, never>;

    [AnalyticsEvent.JOB_RESOLVED]: { job_type: string; outcome: JobOutcome };

    [AnalyticsEvent.WEBSOCKET_CONNECTED]: Record<string, never>;
    [AnalyticsEvent.WEBSOCKET_DISCONNECTED]: {
        intentional: boolean;
        close_code?: number;
    };

    [AnalyticsEvent.TELEMETRY_ENABLED]: Record<string, never>;
}
