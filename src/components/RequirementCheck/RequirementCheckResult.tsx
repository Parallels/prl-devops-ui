import React from 'react';
import { Alert, Button, CollapsiblePanel, MetricBar, Pill, Spinner } from '@prl/ui-kit';
import type { CheckDetail, CheckHostResult } from '@/interfaces/Machine';
import {
  buildGapDisplay,
  checkLabel,
  describeCheckError,
  summarizeHost,
  type HostCheckSummary,
} from './checkLogic';
import type { RequirementCheckState } from '@/hooks/useRequirementCheck';

export interface RequirementCheckResultProps {
  state: RequirementCheckState;
  /** Manual re-run (the verdict is a snapshot and is never cached). */
  onRetry?: () => void;
  className?: string;
}

// ── Per-check rows ───────────────────────────────────────────────────────────

const CheckRow: React.FC<{ check: CheckDetail }> = ({ check }) => {
  const gap = buildGapDisplay(check);
  const message = check.message ?? `${checkLabel(check.name)}: ${check.passed ? 'passed' : 'failed'}`;

  if (gap) {
    return (
      <div className="space-y-1">
        <MetricBar label={gap.label} value={gap.value} percentage={gap.percentage} color="red" />
        <p className="text-xs text-neutral-500 dark:text-neutral-400">{message}</p>
      </div>
    );
  }

  // Unknown check names fall back to the server message (forward compatibility).
  return (
    <div className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
      <span>{message}</span>
    </div>
  );
};

const ReasonRow: React.FC<{ tone: 'danger' | 'warning'; children: React.ReactNode }> = ({ tone, children }) => (
  <div
    className={`flex items-start gap-2 rounded-md px-2.5 py-1.5 text-sm ${
      tone === 'danger'
        ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
    }`}
  >
    <span
      className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${tone === 'danger' ? 'bg-red-500' : 'bg-amber-500'}`}
      aria-hidden
    />
    <span>{children}</span>
  </div>
);

// ── Per-host panel ───────────────────────────────────────────────────────────

const HostChecksPanel: React.FC<{ host: CheckHostResult; defaultExpanded: boolean }> = ({ host, defaultExpanded }) => {
  const summary: HostCheckSummary = summarizeHost(host);
  const label = host.host?.trim() || host.host_id;

  return (
    <CollapsiblePanel
      defaultExpanded={defaultExpanded}
      title={<span className="truncate">{label}</span>}
      subtitle={
        summary.failedCount > 0
          ? `${summary.failedCount} check${summary.failedCount === 1 ? '' : 's'} failed${summary.passedCount > 0 ? ` · ${summary.passedCount} passed` : ''}`
          : summary.passedCount > 0
            ? `${summary.passedCount} check${summary.passedCount === 1 ? '' : 's'} passed`
            : 'No checks reported'
      }
      actions={
        <Pill size="sm" tone={host.passed ? 'success' : 'danger'} variant="soft">
          {host.passed ? 'Fits' : 'Cannot fit'}
        </Pill>
      }
    >
      {summary.checks.length === 0 ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">The service reported no checks for this host.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Blocking entries (host_state / architecture / vm_requirements): row-level reason, not a gap table. */}
          {summary.blocking.map((check, i) => (
            <ReasonRow key={`blocking-${check.name}-${i}`} tone="danger">
              {check.message ?? `${checkLabel(check.name)} blocks this host`}
            </ReasonRow>
          ))}

          {/* Skipped disk probe on hosts too old for it: warning, not success. */}
          {summary.warnings.map((check, i) => (
            <ReasonRow key={`warn-${check.name}-${i}`} tone="warning">
              {check.message ?? `${checkLabel(check.name)}: check skipped`}
            </ReasonRow>
          ))}

          {summary.gaps.map((check, i) => (
            <CheckRow key={`gap-${check.name}-${i}`} check={check} />
          ))}
        </div>
      )}
    </CollapsiblePanel>
  );
};

// ── Main renderer ────────────────────────────────────────────────────────────

export const RequirementCheckResult: React.FC<RequirementCheckResultProps> = ({ state, onRetry, className }) => {
  if (state.status === 'idle') return null;

  const retryButton = onRetry ? (
    <Button size="xs" variant="soft" color="slate" leadingIcon="Refresh" onClick={onRetry}>
      Check again
    </Button>
  ) : undefined;

  if (state.status === 'loading') {
    return (
      <div className={`flex items-center gap-2.5 rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 ${className ?? ''}`}>
        <Spinner size="sm" color="slate" />
        <span>Checking host capacity… the live disk probe can take a few seconds.</span>
      </div>
    );
  }

  if (state.status === 'error') {
    const display = describeCheckError(state.error ?? {});
    return (
      <Alert
        color="danger"
        variant="subtle"
        title={display.title}
        description={display.isAuthError ? `${display.description} — your session may have expired.` : display.description}
        actions={retryButton}
        className={className}
      />
    );
  }

  const response = state.response;
  if (!response) return null;

  // SLIM verdict — the `hosts` key does not even exist here; do not invent a hosts section.
  if (response.passed) {
    const type = typeof response.requirements?.type === 'string' ? response.requirements.type : undefined;
    return (
      <Alert
        color="success"
        variant="subtle"
        title="Resources available — it can be created"
        description={type ? `Scheduling requirements type: ${type}` : undefined}
        actions={retryButton}
        className={className}
      />
    );
  }

  const hosts = Array.isArray(response.hosts) ? response.hosts : [];
  const headline = response.message ?? 'No host meets the requirements';

  // Empty fleet ("No hosts registered") — message only, no table.
  if (hosts.length === 0) {
    return (
      <Alert
        color="warning"
        variant="subtle"
        title={headline}
        description="Capacity is a point-in-time snapshot."
        actions={retryButton}
        className={className}
      />
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className ?? ''}`}>
      <Alert
        color="danger"
        variant="subtle"
        title={headline}
        description={`None of the ${hosts.length} checked host${hosts.length === 1 ? '' : 's'} can fit this VM right now. Expand a host to see what is missing.`}
        actions={retryButton}
      />
      <div className="flex flex-col gap-2">
        {hosts.map((host, index) => (
          <HostChecksPanel key={host.host_id || `host-${index}`} host={host} defaultExpanded={index === 0} />
        ))}
      </div>
    </div>
  );
};

export default RequirementCheckResult;
