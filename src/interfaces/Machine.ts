/*
 * Machine state response
 */
export interface MachineStateResponse {
    id: string;
    operation: string;
    status: string;
}

export interface CreateMachineFromCatalogManifest {
    catalog_id: string;
    version?: string;
    catalog_manager_id?: string;
    path?: string;
    specs?: {
        cpu?: string;
        memory?: string;
        [key: string]: string | undefined;
    };
}

export interface CreateMachineAsyncRequest {
    name: string;
    startOnCreate: boolean;
    architecture: string;
    owner: string;
    catalog_manifest: CreateMachineFromCatalogManifest;
}

/* ── Pre-flight requirement check (POST /orchestrator/machines/check) ──────── */

/**
 * Explicit VM requirements.
 * Units: cpu = logical CPUs, memory/disk = MiB, size = pack size in bytes
 * (only `size` triggers the live free-disk probe). `os: "macos"` switches on
 * the macOS checks. Server defaults when omitted: cpu=2, memory=2048.
 */
export interface VmRequirements {
    cpu?: number;
    memory?: number;
    disk?: number;
    size?: number;
    os?: 'macos';
}

/** Catalog-driven check — mirrors the inputs of POST /orchestrator/machines. */
export interface CheckMachineRequirementsCatalogMode {
    catalog_id: string;
    /** Required with catalog_id. */
    architecture: string;
    /** Defaults to latest (tag-aware) when omitted. */
    version?: string;
    /** XOR with the request `connection` field — the UI always uses the manager id. */
    catalog_manager_id?: string;
}

/** Explicit-requirements check — optionally scoped to a single host. */
export interface CheckMachineRequirementsExplicitMode {
    requirements: VmRequirements;
    host_id?: string;
}

/** Exactly one source of requirements: catalog_id XOR requirements. */
export type CheckMachineRequirementsRequest =
    | CheckMachineRequirementsCatalogMode
    | CheckMachineRequirementsExplicitMode;

/**
 * One scheduling decision factor evaluated on a host.
 * `message` is already human-readable — render it directly; required/available/unit
 * allow richer formatting. Unknown check names must fall back to `message`.
 */
export interface CheckDetail {
    name: string;
    passed: boolean;
    required?: number;
    available?: number;
    unit?: string;
    message?: string;
}

export interface CheckHostResult {
    host_id: string;
    host?: string;
    passed: boolean;
    /** Blocking entries (host_state, architecture, vm_requirements) return a single-check list. */
    checks?: CheckDetail[];
}

/**
 * Two response shapes:
 * - Enough capacity → SLIM: `passed: true`, the `hosts` key does not exist at all.
 * - Nothing fits   → DETAILED: `passed: false` with a per-host `hosts` list.
 * `passed: false` is HTTP 200 with data — it is NOT an error.
 */
export interface CheckMachineRequirementsResponse {
    passed: boolean;
    message?: string;
    requirements?: { type?: string; [key: string]: unknown };
    hosts?: CheckHostResult[];
}
