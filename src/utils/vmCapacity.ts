/**
 * Pure derivation of the per-host VM count limit (MAX_VMS_PER_HOST /
 * MAX_VMS_PER_HOST_MODE) from the host payload already delivered by
 * GET /orchestrator/hosts and GET /orchestrator/hosts/{id}.
 *
 * Rendering-agnostic and unit-tested (vmCapacity.test.ts), following the
 * RequirementCheck/checkLogic.ts convention. There is no API to change the
 * limit — it is host-local configuration, read-only here.
 *
 * Payload gotchas (verified against the mapper output):
 * - every counter is omitempty: 0 is absent, not 0 — missing numbers default to 0;
 * - the item objects (total, total_in_use, total_reserved) are always present,
 *   only the numbers inside them can be missing;
 * - the mode is reported even when no cap is configured, so any mode chip must
 *   be gated on `hasLimit`, or uncapped hosts advertise a mode they enforce nothing with.
 */
import type { DevOpsRemoteHost } from '@/interfaces/devops';

export type VmCountMode = 'any' | 'running';

/** Same thresholds the existing CPU / memory bars use (getUseColor: >85% / >60%). */
export type VmCapacityTone = 'normal' | 'warning' | 'critical';

export interface VmCapacity {
  /** The cap (MAX_VMS_PER_HOST). 0 = unlimited. */
  limit: number;
  /** 'any' = every VM registered on the host; 'running' = VMs holding a hypervisor slot. */
  mode: VmCountMode;
  /** Counter the enforcement uses for the current mode. */
  used: number;
  /** In-flight operations that will consume a counted slot (creates in `any`, starts in `running`). */
  pending: number;
  /** Every VM registered on the host, or null when the host build does not report it. */
  total: number | null;
  hasLimit: boolean;
  /** used + pending — the number the enforcement compares against the cap. */
  shown: number;
  /** Clamped to 1; null when no cap is configured. */
  ratio: number | null;
  /** Shown counter at or above the cap — placement will skip this host. */
  atLimit: boolean;
  tone: VmCapacityTone;
}

/** Anything that is not 'running' (absent, junk, old builds) counts like the server default 'any'. */
const normalizeMode = (mode: unknown): VmCountMode => (mode === 'running' ? 'running' : 'any');

export const getVmCapacity = (host: DevOpsRemoteHost | null | undefined): VmCapacity => {
  const dr = host?.detailed_resources;
  const limit = dr?.max_vms_per_host ?? 0;
  const mode = normalizeMode(dr?.max_vms_per_host_mode);
  const used = (mode === 'running' ? dr?.total_in_use?.total_vms : dr?.total?.total_vms) ?? 0;
  const pending = dr?.total_reserved?.total_vms ?? 0;
  const total = dr?.total?.total_vms ?? host?.resources?.[0]?.total_vms ?? null;
  const hasLimit = limit > 0;
  const shown = used + pending;
  const ratio = hasLimit ? Math.min(1, shown / limit) : null;
  const atLimit = hasLimit && shown >= limit;
  const tone: VmCapacityTone =
    !hasLimit || (ratio ?? 0) <= 0.6 ? 'normal' : atLimit || (ratio ?? 0) > 0.85 ? 'critical' : 'warning';
  return { limit, mode, used, pending, total, hasLimit, shown, ratio, atLimit, tone };
};

/* ── Copy ────────────────────────────────────────────────────────────────────── */

export const vmModeLabel = (mode: VmCountMode): string => (mode === 'running' ? 'Running VMs' : 'All VMs');

export const vmModeTooltip = (mode: VmCountMode): string =>
  mode === 'running'
    ? 'Mode: running — counts VMs holding a hypervisor slot'
    : 'Mode: any — counts every VM registered on the host, stopped ones included';

export const VM_LIMIT_REACHED_HINT = 'Host VM limit reached — new VMs will be placed on another host';

/* ── Host rejection messages ───────────────────────────────────────────────── */

const VM_LIMIT_REACHED_RE = /host VM limit reached: current (\d+), pending (\d+), maximum (\d+) \(mode (any|running)\)/;
const VM_CAPACITY_UNKNOWN_RE = /cannot verify host VM capacity/i;

const extractMessage = (error: unknown): string => {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const { message } = error as { message?: unknown };
    return typeof message === 'string' ? message : '';
  }
  return '';
};

/**
 * Human-readable variant of the two host VM capacity rejections:
 * - `409 host VM limit reached: current 10, pending 0, maximum 10 (mode any)`
 * - `503 cannot verify host VM capacity: live host inventory failed` (fail-closed by design)
 *
 * Matched on message text (the numbers stay verbatim); every other error returns
 * null so callers keep surfacing the raw server message. Async creates carry the
 * same text in the job error/message — that path is deliberately left verbatim.
 */
export const describeVmCapacityError = (error: unknown): { message: string } | null => {
  const message = extractMessage(error);
  const reached = VM_LIMIT_REACHED_RE.exec(message);
  if (reached) {
    const [, current, pending, maximum, mode] = reached;
    return {
      message: `Host VM limit reached — this host holds ${maximum} VMs (current ${current}, pending ${pending}, counting ${vmModeLabel(mode as VmCountMode)}). New VMs will be placed on another host.`,
    };
  }
  if (VM_CAPACITY_UNKNOWN_RE.test(message)) {
    return { message: 'Cannot verify host VM capacity — the host could not enumerate its VMs. Try again.' };
  }
  return null;
};
