import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import {
  ArrowRight,
  Button,
  Calendar,
  CheckCircle,
  ConfirmModal,
  ConnectionFlow,
  IconButton,
  Panel,
  Pill,
  Progress,
  Refresh,
  User,
  formatProgressBytes,
  normalizeDataSizeUnit,
  type ConnectionFlowItem,
} from '@prl/ui-kit';
import { useNavigate } from 'react-router-dom';
import type { Job, JobStep } from '@/interfaces/Jobs';
import { useJobs } from '@/contexts/JobsContext';
import { useHighlight } from '@/contexts/HighlightContext';
import { resolveJobOutcome } from '@/utils/jobOutcomeResolver';
import { stateToTone, jobTypeIcon, formatTimestamp, titleCase, stepName, joinNames, formatEta, parseEtaToSeconds, TONE_ICON_BG } from './jobsUtils';

interface JobCardProps {
  job: Job;
  highlighted?: boolean;
}

// ── Step pipeline (ConnectionFlow) ────────────────────────────────────────────

const StepFlow: React.FC<{ steps: JobStep[]; jobActive: boolean }> = ({ steps, jobActive }) => {
  if (!steps || steps.length === 0) return null;

  const runningIdx = steps.findIndex((s) => s.state === 'running');

  const items: ConnectionFlowItem[] = steps.map((step, i) => {
    return {
      id: `step-${i}-${step.name}`,
      title: stepName(step, `Step ${i + 1}`),
      titleWrap: true,
      tone: stateToTone(step.state),
      active: step.state === 'running',
      activePulse: step.state === 'running',
      parallel: step.parallel ?? false,
      skipped: step.state === 'skipped',
      // Animate only the connector leading into the currently running step
      connector: i > 0 ? { width: 24, animateCompleted: i === runningIdx } : undefined,
    };
  });

  return (
    <div className="px-4 pb-1 pt-1">
      <ConnectionFlow items={items} autoScale minScale={0.5} connectorWidth={24} animated={jobActive} dotSpacing={20} connectorBorderSize="xs" connectorHalf autoConnectorState />
    </div>
  );
};

// ── Step color palette (cycles when there are multiple running steps) ─────────

const STEP_COLORS = ['blue', 'violet', 'teal', 'amber', 'rose', 'cyan', 'orange', 'emerald'] as const;

// ── Progress block ────────────────────────────────────────────────────────────

const JobProgress: React.FC<{ job: Job }> = ({ job }) => {
  const tone = stateToTone(job.state);
  const runningSteps = (job.steps ?? []).filter((s) => s.state === 'running');

  // Label above the overall bar: running step names only (job.message is already shown in the card header)
  const mainLabel = runningSteps.length > 0 ? joinNames(runningSteps.map((s) => stepName(s)).filter(Boolean)) : null;

  const hasOverallProgress = job.progress > 0;
  const hasStepProgress = runningSteps.some((s) => (s.value > 0 && s.total > 0) || s.hasPercentage);

  if (!hasOverallProgress && !hasStepProgress && !mainLabel) return null;

  return (
    <div className="px-4 pb-3 flex flex-col gap-2">
      {/* Label for the overall bar */}
      {mainLabel && <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-snug truncate">{mainLabel}</p>}

      {/* Overall job progress — only when progress > 0 */}
      {hasOverallProgress && <Progress size="sm" color={tone} value={job.progress} motion="stripes" motionSpeed="fast" motionDirection="forward" />}

      {/* One block per running step: message → bar → size/ETA */}
      <div className="flex flex-col gap-1.5 mt-2">
        {runningSteps.map((step, i) => {
          const hasValueData = step.value > 0 && step.total > 0;
          if (!hasValueData && !step.hasPercentage) return null;

          const barValue = hasValueData ? Math.min(100, Math.round((step.value / step.total) * 100)) : 0;

          let valueLabel = '';
          if (hasValueData) {
            const inputUnit = normalizeDataSizeUnit(step.unit);
            const fmt = formatProgressBytes(step.value, step.total, inputUnit);
            valueLabel = `${fmt.valueLabel} / ${fmt.totalLabel} ${fmt.unit}`;
          }

          const stepMessage = step.message || step.filename || null;
          const stepColor = STEP_COLORS[i % STEP_COLORS.length];

          return (
            <div key={`${step.name}-${i}`} className="flex flex-col gap-1">
              {stepMessage && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-snug truncate">
                  {step.parallel && <span className="text-[10px] font-semibold text-blue-400 dark:text-blue-500 mr-1.5 font-mono">∥</span>}
                  {stepMessage}
                </p>
              )}
              <Progress size="sm" color={stepColor} value={barValue} motion="stripes" motionSpeed="fast" motionDirection="forward" />
              {(valueLabel || parseEtaToSeconds(step.eta) > 0) && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] tabular-nums text-neutral-400 dark:text-neutral-500">{valueLabel}</span>
                  {parseEtaToSeconds(step.eta) > 0 && <span className="text-[10px] tabular-nums text-neutral-400 dark:text-neutral-500 shrink-0">ETA {formatEta(step.eta)}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── JobCard ───────────────────────────────────────────────────────────────────

export const JobCard: React.FC<JobCardProps> = ({ job, highlighted = false }) => {
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHighlighted, setIsHighlighted] = useState(highlighted);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { deleteJob } = useJobs();
  const { addHighlight } = useHighlight();

  useEffect(() => {
    if (!highlighted) return;
    setIsHighlighted(true);
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const t = setTimeout(() => setIsHighlighted(false), 3000);
    return () => clearTimeout(t);
  }, [highlighted]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteJob(job.id);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const tone = stateToTone(job.state);
  const isInit = job.state === 'init';
  const isActive = job.state === 'running' || job.state === 'pending' || isInit;
  const isFailed = job.state === 'failed';
  const hasSteps = !isInit && (job.steps?.length ?? 0) > 0;
  const outcome = resolveJobOutcome({
    message: job.state === 'failed' ? 'JOB_FAILED' : job.state === 'completed' ? 'JOB_COMPLETED' : 'JOB_UPDATED',
    job_type: job.job_type,
    job_operation: job.job_operation,
    result_record_id: job.result_record_id,
    result_record_type: job.result_record_type,
    result: job.result,
  });

  const handleNavigateToOutcome = () => {
    if (!outcome.deepLink) return;

    if (outcome.highlight) {
      addHighlight({
        pageId: outcome.highlight.pageId,
        menuItemId: outcome.highlight.menuItemId,
        itemId: outcome.highlight.itemId,
        recordId: outcome.highlight.recordId,
        state: isFailed ? 'error' : 'success',
      });
    }

    navigate(outcome.deepLink.path, { state: outcome.deepLink.state });
  };

  // Use the first running step's message (or name) as the active subtitle
  // const runningStep = job.steps?.find(s => s.state === 'running');
  // const activeMessage = runningStep
  //     ? (runningStep.message || (runningStep.name ? titleCase(runningStep.name) : null))
  //     : null;

  return (
    <div ref={cardRef} className={classNames('rounded-xl transition-shadow duration-700', isHighlighted && 'ring-2 ring-blue-500/60 dark:ring-blue-400/50')}>
      <Panel variant="glass" padding="sm" color="white" borderColor={tone}>
        {/* Header */}
        <div className="flex items-center gap-3">
          {/* Type icon */}
          <div className={classNames('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', TONE_ICON_BG[tone] ?? TONE_ICON_BG.neutral)}>{jobTypeIcon(job.job_type)}</div>

          {/* Title + active step */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {job.job_type && <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{titleCase(job.job_type)}</span>}
              {job.job_operation && <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
              {job.job_operation && <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{titleCase(job.job_operation)}</span>}
              <Pill size="sm" tone={tone} variant="soft">
                {job.state === 'init' ? 'Preparing' : job.state}
              </Pill>
            </div>
            {job.message && <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">{job.message}</p>}
          </div>

          {/* Overall % badge (active + progress > 0 only) */}
          {isActive && job.progress > 0 && <span className="text-sm font-mono font-bold text-neutral-500 shrink-0 tabular-nums">{job.progress}%</span>}
        </div>

        {/* Step pipeline — shown when steps are present */}
        {hasSteps && (
          <div className="mt-3">
            <StepFlow steps={job.steps} jobActive={isActive} />
          </div>
        )}

        {/* Progress block — active jobs only (hidden during init since steps aren't known yet) */}
        {isActive && !isInit && <JobProgress job={job} />}

        {/* Result */}
        {job.result && (
          <div className="px-4 pb-3 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
            <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <span className="translate-y-px">{job.result}</span>
          </div>
        )}

        {/* Error */}
        {isFailed && job.error && (
          <Panel variant="tonal" color="rose" padding="xs" tone="rose" corner="rounded-sm">
            <span className="text-sm">{job.error}</span>
          </Panel>
        )}

        {/* Finished job deeplink */}
        {!isActive && outcome.deepLink && (
          <div className="px-4 pb-3">
            <Button variant="soft" color={isFailed ? 'rose' : 'blue'} size="xs" trailingIcon="ArrowRight" onClick={handleNavigateToOutcome}>
              View {outcome.deepLink.label}
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3 text-[10px] text-neutral-400 dark:text-neutral-500">
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {job.owner_name || job.owner_email || job.owner || '—'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatTimestamp(job.created_at)}
            </span>
            {job.updated_at !== job.created_at && (
              <span className="flex items-center gap-1">
                <Refresh className="w-4 h-4" />
                {formatTimestamp(job.updated_at)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-neutral-300 dark:text-neutral-600 truncate max-w-35">{job.id}</span>
            {!isActive && <IconButton tooltip="Delete job" icon="Trash" variant="ghost" color="rose" size="xs" aria-label="Delete job" onClick={() => setConfirmDelete(true)} />}
          </div>
        </div>
      </Panel>

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => void handleDelete()}
        title="Delete Job"
        description="This action cannot be undone."
        icon="Trash"
        size="sm"
        confirmLabel="Delete"
        confirmVariant="solid"
        confirmColor="rose"
        confirmButtonProps={{ leadingIcon: 'Trash', loading: deleting }}
        isConfirmDisabled={deleting}
      >
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Are you sure you want to delete the{' '}
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
            {titleCase(job.job_type)} · {titleCase(job.job_operation)}
          </span>{' '}
          job?
        </p>
      </ConfirmModal>
    </div>
  );
};
