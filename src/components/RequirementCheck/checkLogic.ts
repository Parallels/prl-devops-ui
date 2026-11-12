/**
 * Pure logic for the pre-flight "Check requirements" feature
 * (POST /orchestrator/machines/check).
 *
 * Everything here is rendering-agnostic and unit-tested:
 * request construction (catalog XOR explicit), response classification
 * (blocking / skipped-disk warning / numeric gap / unknown-name fallback)
 * and required-vs-available formatting.
 */
import { formatBytes, formatMB } from '@prl/ui-kit';
import type {
  CheckDetail,
  CheckHostResult,
  CheckMachineRequirementsRequest,
  VmRequirements,
} from '@/interfaces/Machine';

/** Defaults the server applies when an explicit requirement field is omitted. */
export const CHECK_DEFAULTS = { cpu: 2, memory: 2048 } as const;

/**
 * Blocking entries return a single-check list — render them as a row-level
 * reason for the host, not as a table of gaps.
 */
export const BLOCKING_CHECK_NAMES = ['host_state', 'architecture', 'vm_requirements'] as const;

export const isBlockingCheck = (name: string): boolean =>
  (BLOCKING_CHECK_NAMES as readonly string[]).includes(name);

/**
 * The `disk` check may come back as passed with a "check skipped" note on hosts
 * too old for the live disk probe — render as a warning, not a success.
 */
export const isSkippedDiskCheck = (check: CheckDetail): boolean =>
  check.name === 'disk' && check.passed && /skip/i.test(check.message ?? '');

/** A failed check with numeric required-vs-available can render a progress bar. */
export const hasNumericGap = (check: CheckDetail): boolean =>
  !check.passed &&
  typeof check.required === 'number' &&
  check.required > 0 &&
  typeof check.available === 'number';

const CHECK_LABELS: Record<string, string> = {
  cpu: 'CPU',
  memory: 'Memory',
  disk: 'Disk',
  host_state: 'Host state',
  architecture: 'Architecture',
  vm_requirements: 'VM requirements',
  macos_inventory: 'macOS inventory',
  macos_capacity: 'macOS capacity',
  vm_count: 'Virtual machines',
};

export const checkLabel = (name: string): string => CHECK_LABELS[name] ?? name;

const formatCheckNumber = (value: number, unit?: string): string => {
  if (unit === 'MiB') return formatMB(value);
  if (unit === 'bytes' || unit === 'B') return formatBytes(value);
  return String(value);
};

const unitSuffix = (unit?: string): string => {
  if (unit === 'logical_cpus') return ' vCPUs';
  // MiB/bytes are already humanized by formatMB/formatBytes — no extra suffix.
  if (!unit || unit === 'MiB' || unit === 'bytes' || unit === 'B') return '';
  return ` ${unit}`;
};

export interface CheckGapDisplay {
  label: string;
  /** e.g. "2 / 8 vCPUs" or "8 GB / 64 GB" */
  value: string;
  percentage: number;
}

/** Progress-bar display for a failed numeric check; null when not applicable. */
export const buildGapDisplay = (check: CheckDetail): CheckGapDisplay | null => {
  if (!hasNumericGap(check)) return null;
  const required = check.required as number;
  const available = check.available as number;
  return {
    label: checkLabel(check.name),
    value: `${formatCheckNumber(available, check.unit)} / ${formatCheckNumber(required, check.unit)}${unitSuffix(check.unit)}`,
    percentage: Math.min(100, Math.round((available / required) * 100)),
  };
};

export interface HostCheckSummary {
  checks: CheckDetail[];
  /** Failed blocking entries — row-level reason. */
  blocking: CheckDetail[];
  /** Passed-but-skipped entries (e.g. disk probe unavailable) — warnings. */
  warnings: CheckDetail[];
  /** Failed non-blocking checks — the gap table. */
  gaps: CheckDetail[];
  failedCount: number;
  passedCount: number;
}

export const summarizeHost = (host: CheckHostResult): HostCheckSummary => {
  const checks = Array.isArray(host.checks) ? host.checks : [];
  const blocking = checks.filter((c) => !c.passed && isBlockingCheck(c.name));
  const warnings = checks.filter(isSkippedDiskCheck);
  const gaps = checks.filter((c) => !c.passed && !isBlockingCheck(c.name));
  const failedCount = blocking.length + gaps.length;
  const passedCount = checks.filter((c) => c.passed && !isSkippedDiskCheck(c)).length;
  return { checks, blocking, warnings, gaps, failedCount, passedCount };
};

/* ── Request construction ──────────────────────────────────────────────────── */

const clean = (value?: string | null): string | undefined => {
  const token = (value ?? '').trim();
  return token && token !== '-' ? token : undefined;
};

export const toPositiveNumber = (value: string | number | undefined): number | undefined => {
  const parsed = typeof value === 'number' ? value : Number(clean(String(value ?? '')));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

export interface CatalogCheckInput {
  catalogId?: string;
  version?: string;
  architecture?: string;
  managerId?: string;
}

/**
 * Mode A (catalog-driven). `architecture` is required with `catalog_id` —
 * returns null (skip the check) when inputs are incomplete.
 */
export const buildCatalogCheckRequest = (input: CatalogCheckInput): CheckMachineRequirementsRequest | null => {
  const catalogId = clean(input.catalogId);
  const architecture = clean(input.architecture);
  if (!catalogId || !architecture) return null;
  const version = clean(input.version);
  const managerId = clean(input.managerId);
  return {
    catalog_id: catalogId,
    architecture,
    ...(version ? { version } : {}),
    ...(managerId ? { catalog_manager_id: managerId } : {}),
  };
};

export interface ExplicitCheckInput {
  cpu?: string | number;
  memory?: string | number;
  disk?: string | number;
  /** Pack size in bytes — the only field that triggers the live free-disk probe. */
  sizeBytes?: number;
  macOS?: boolean;
  hostId?: string;
}

/** Mode B (explicit requirements). Unparseable fields fall back to server defaults. */
export const buildExplicitCheckRequest = (input: ExplicitCheckInput): CheckMachineRequirementsRequest => {
  const requirements: VmRequirements = {};
  const cpu = toPositiveNumber(input.cpu);
  const memory = toPositiveNumber(input.memory);
  const disk = toPositiveNumber(input.disk);
  const size = toPositiveNumber(input.sizeBytes);
  if (cpu !== undefined) requirements.cpu = cpu;
  if (memory !== undefined) requirements.memory = memory;
  if (disk !== undefined) requirements.disk = disk;
  if (size !== undefined) requirements.size = size;
  if (input.macOS) requirements.os = 'macos';
  const hostId = clean(input.hostId);
  return { requirements, ...(hostId ? { host_id: hostId } : {}) };
};

export interface WizardCheckInput extends CatalogCheckInput {
  /** Raw wizard inputs (free-text CPU/Memory override fields). */
  cpuText: string;
  memoryText: string;
  /** Manifest-declared defaults used when the matching override is blank. */
  manifestCpu?: string;
  manifestMemory?: string;
  sizeBytes?: number;
  macOS?: boolean;
}

/**
 * Wizard mode selection: with no CPU/memory overrides the check mirrors the
 * create call exactly (catalog-driven, incl. server-side macOS logic); once
 * the user overrides specs we switch to explicit mode, filling blanks from the
 * manifest and carrying the pack size so the disk probe still runs.
 */
export const buildWizardCheckRequest = (input: WizardCheckInput): CheckMachineRequirementsRequest | null => {
  const hasOverride = Boolean(clean(input.cpuText) || clean(input.memoryText));
  if (!hasOverride) return buildCatalogCheckRequest(input);
  return buildExplicitCheckRequest({
    cpu: clean(input.cpuText) ?? input.manifestCpu,
    memory: clean(input.memoryText) ?? input.manifestMemory,
    sizeBytes: input.sizeBytes,
    macOS: input.macOS,
  });
};

/**
 * Heuristic used only in explicit mode (catalog mode delegates macOS detection
 * to the server). Matches the `includes('macos')` heuristic used for VM icons.
 */
export const inferMacOs = (tokens: Array<string | string[] | undefined>): boolean =>
  tokens
    .flat()
    .filter((token): token is string => typeof token === 'string' && token.trim().length > 0)
    .some((token) => token.toLowerCase().includes('macos'));

/* ── Error display ─────────────────────────────────────────────────────────── */

export interface CheckErrorDisplay {
  title: string;
  /** Server message verbatim — for 400 it ends with the real root cause and is the user's remediation hint. */
  description: string;
  isAuthError: boolean;
}

/** Only 400 / 404 / 401-403 reach this path (passed:false is a normal 200). */
export const describeCheckError = (error: { message?: string; statusCode?: number }): CheckErrorDisplay => {
  const description = (error.message ?? '').trim() || 'The requirements check failed.';
  const isAuthError = error.statusCode === 401 || error.statusCode === 403;
  if (isAuthError) return { title: 'Not authorized', description, isAuthError };
  if (error.statusCode === 404) return { title: 'Unknown host', description, isAuthError };
  return { title: 'Check failed', description, isAuthError };
};
