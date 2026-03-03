import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import {
    ArrowRight,
    Calendar,
    CheckCircle,
    Panel,
    Pill,
    Progress,
    Refresh,
    User,
    formatProgressBytes,
    normalizeDataSizeUnit,
} from '@prl/ui-kit';
import type { Job } from '@/interfaces/Jobs';
import { stateToTone, jobTypeIcon, formatTimestamp, titleCase, formatEta, parseEtaToSeconds, TONE_ICON_BG } from './jobsUtils';

interface JobCardProps {
    job: Job;
    highlighted?: boolean;
}

const JobProgress: React.FC<{ job: Job }> = ({ job }) => {
    const tone = stateToTone(job.state);
    const hasSubStep = (job.action_value != null && job.action_total != null) || job.action_percentage != null;

    return (
        <div className="px-4 pb-3 flex flex-col gap-2">
            {/* Overall job progress */}
            <Progress
                size="sm"
                color={tone}
                value={job.progress}
                motion="stripes"
                motionSpeed="fast"
                motionDirection="forward"
            />

            {/* Current action message */}
            {job.action_message && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-snug truncate">
                    {job.action_message}
                </p>
            )}

            {/* Sub-step progress — value+total takes priority; falls back to raw percentage */}
            {hasSubStep && (() => {
                const useValueTotal = job.action_value != null && job.action_total != null;
                const barValue = useValueTotal
                    ? Math.min(100, Math.round((job.action_value! / job.action_total!) * 100))
                    : Math.min(100, job.action_percentage!);

                let valueLabel: string;
                if (useValueTotal) {
                    const inputUnit = normalizeDataSizeUnit(job.action_value_unit);
                    const fmt = formatProgressBytes(job.action_value!, job.action_total!, inputUnit);
                    valueLabel = `${fmt.valueLabel} / ${fmt.totalLabel} ${fmt.unit}`;
                } else {
                    valueLabel = `${job.action_percentage}%`;
                }

                return (
                    <div className="flex flex-col gap-1">
                        <Progress size="sm" color={tone} value={barValue} />
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] tabular-nums text-neutral-400 dark:text-neutral-500">
                                {valueLabel}
                            </span>
                            {parseEtaToSeconds(job.action_eta) > 0 && (
                                <span className="text-[10px] tabular-nums text-neutral-400 dark:text-neutral-500 shrink-0">
                                    ETA {formatEta(job.action_eta!)}
                                </span>
                            )}
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export const JobCard: React.FC<JobCardProps> = ({ job, highlighted = false }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isHighlighted, setIsHighlighted] = useState(highlighted);

    useEffect(() => {
        if (!highlighted) return;
        setIsHighlighted(true);
        cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const t = setTimeout(() => setIsHighlighted(false), 3000);
        return () => clearTimeout(t);
    }, [highlighted]);

    const tone = stateToTone(job.state);
    const isActive = job.state === 'running' || job.state === 'pending';
    const isFailed = job.state === 'failed';

    return (
        <div
            ref={cardRef}
            className={classNames(
                'rounded-xl transition-[box-shadow] duration-700',
                isHighlighted && 'ring-2 ring-blue-500/60 dark:ring-blue-400/50',
            )}
        >
            <Panel variant="glass" color="rose" padding="sm" tone={tone}>
                {/* Header */}
                <div className="flex items-start gap-3">
                    {/* Type icon */}
                    <div className={classNames(
                        'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                        TONE_ICON_BG[tone] ?? TONE_ICON_BG.neutral,
                    )}>
                        {jobTypeIcon(job.job_type)}
                    </div>

                    {/* Title + action */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            {job.job_type && (
                                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                    {titleCase(job.job_type)}
                                </span>
                            )}
                            {job.job_operation && (
                                <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                            )}
                            {job.job_operation && (
                                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                    {titleCase(job.job_operation)}
                                </span>
                            )}
                            <Pill size="sm" tone={tone} variant="soft">
                                {job.state}
                            </Pill>
                        </div>
                        {job.action && (
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                                {job.action}
                            </p>
                        )}
                    </div>

                    {/* Overall % badge (active only) */}
                    {isActive && (
                        <span className="text-sm font-mono font-bold text-neutral-500 flex-shrink-0 tabular-nums">
                            {job.progress}%
                        </span>
                    )}
                </div>

                {/* Progress block */}
                {isActive && <JobProgress job={job} />}

                {/* Result */}
                {job.result && (
                    <div className="px-4 pb-3 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                        <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <span className="translate-y-[1px]">{job.result}</span>
                    </div>
                )}

                {/* Error */}
                {isFailed && job.error && (
                    <Panel variant="tonal" color="rose" padding="xs" tone="rose" corner="rounded-sm">
                        <span className="text-sm">{job.error}</span>
                    </Panel>
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
                    <span className="text-[10px] font-mono text-neutral-300 dark:text-neutral-600 truncate max-w-[140px]">
                        {job.id}
                    </span>
                </div>
            </Panel>
        </div>
    );
};
