import React, { useState } from 'react';
import classNames from 'classnames';
import { Button, CustomIcon, EmptyState, HelpButton, IconButton, Loader, Pill, Tabs } from '@prl/ui-kit';
import type { TreeTone } from '@prl/ui-kit';
import type { Job } from '@/interfaces/Jobs';
import { useJobs } from '@/contexts/JobsContext';
import { PageHeader, PageHeaderIcon } from '@/components/PageHeader';

// ── Helpers ───────────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'active' | 'completed' | 'failed';

function stateToTone(state: string): TreeTone {
    switch (state) {
        case 'running': return 'amber';
        case 'pending': return 'sky';
        case 'completed': return 'emerald';
        case 'failed': return 'rose';
        default: return 'neutral';
    }
}

function stateOrder(state: string): number {
    switch (state) {
        case 'running': return 0;
        case 'pending': return 1;
        case 'completed': return 2;
        case 'failed': return 3;
        default: return 4;
    }
}

function jobTypeIcon(type: string): React.ReactNode {
    switch (type.toLowerCase()) {
        case 'catalog': return <CustomIcon icon="Library" className="w-5 h-5" />;
        case 'vm': return <CustomIcon icon="VirtualMachine" className="w-5 h-5" />;
        case 'packer':
        case 'packer_template': return <CustomIcon icon="Blueprint" className="w-5 h-5" />;
        default: return <CustomIcon icon="Script" className="w-5 h-5" />;
    }
}

function formatTimestamp(iso: string): string {
    try {
        return new Date(iso).toLocaleString(undefined, {
            month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
        });
    } catch { return iso; }
}

function titleCase(s: string): string {
    return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── JobCard ───────────────────────────────────────────────────────────────────

const JobCard: React.FC<{ job: Job }> = ({ job }) => {
    const tone = stateToTone(job.state);
    const isActive = job.state === 'running' || job.state === 'pending';
    const isFailed = job.state === 'failed';

    const borderColor: Record<string, string> = {
        amber: 'border-amber-200  dark:border-amber-800',
        sky: 'border-sky-200    dark:border-sky-800',
        emerald: 'border-emerald-200 dark:border-emerald-800',
        rose: 'border-rose-200   dark:border-rose-800',
        neutral: 'border-neutral-200 dark:border-neutral-800',
    };
    const iconBg: Record<string, string> = {
        amber: 'bg-amber-50  text-amber-600  dark:bg-amber-900/30  dark:text-amber-400',
        sky: 'bg-sky-50    text-sky-600    dark:bg-sky-900/30    dark:text-sky-400',
        emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
        rose: 'bg-rose-50   text-rose-600   dark:bg-rose-900/30   dark:text-rose-400',
        neutral: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
    };
    const barColor: Record<string, string> = {
        amber: 'bg-amber-400',
        sky: 'bg-sky-400',
        emerald: 'bg-emerald-500',
        rose: 'bg-rose-500',
        neutral: 'bg-neutral-400',
    };

    return (
        <div className={classNames(
            'rounded-xl border bg-white dark:bg-neutral-900 overflow-hidden',
            borderColor[tone] ?? borderColor.neutral,
        )}>

            {/* Header */}
            <div className="flex items-start gap-3 p-4">
                {/* Type icon */}
                <div className={classNames(
                    'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                    iconBg[tone] ?? iconBg.neutral,
                )}>
                    {jobTypeIcon(job.job_type)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                            {titleCase(job.job_type)} — {titleCase(job.job_operation)}
                        </span>
                        <Pill size="sm" tone={tone} variant="soft">
                            {job.state}
                        </Pill>
                    </div>
                    {job.action && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                            {job.action}
                        </p>
                    )}
                </div>

                {/* Progress % (active only) */}
                {isActive && (
                    <span className="text-xs font-mono font-semibold text-neutral-400 flex-shrink-0 tabular-nums">
                        {job.progress}%
                    </span>
                )}
            </div>

            {/* Progress bar */}
            {isActive && (
                <div className="px-4 pb-3">
                    <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div
                            className={classNames(
                                'h-full rounded-full transition-[width] duration-500 ease-out',
                                barColor[tone] ?? barColor.neutral,
                                job.state === 'running' && job.progress < 100 && 'relative',
                            )}
                            style={{ width: `${Math.min(100, Math.max(0, job.progress))}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Result */}
            {job.result && (
                <div className="px-4 pb-3 flex items-start gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                    <CustomIcon icon="CheckCircle" className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>{job.result}</span>
                </div>
            )}

            {/* Error */}
            {isFailed && job.error && (
                <div className="px-4 pb-3 text-xs text-rose-700 dark:text-rose-400 font-mono whitespace-pre-wrap bg-rose-50 dark:bg-rose-950/20 border-t border-rose-100 dark:border-rose-900/40 p-3 mx-0">
                    {job.error}
                </div>
            )}

            {/* Footer: timestamps + owner */}
            <div className="px-4 py-2.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-3 text-[10px] text-neutral-400 dark:text-neutral-500">
                    <span className="flex items-center gap-1">
                        <CustomIcon icon="User" className="w-3 h-3" />
                        {job.owner || '—'}
                    </span>
                    <span className="flex items-center gap-1">
                        <CustomIcon icon="Calendar" className="w-3 h-3" />
                        {formatTimestamp(job.created_at)}
                    </span>
                    {job.updated_at !== job.created_at && (
                        <span className="flex items-center gap-1">
                            <CustomIcon icon="Refresh" className="w-3 h-3" />
                            {formatTimestamp(job.updated_at)}
                        </span>
                    )}
                </div>
                <span className="text-[10px] font-mono text-neutral-300 dark:text-neutral-600 truncate max-w-[140px]">
                    {job.id}
                </span>
            </div>
        </div>
    );
};

// ── ActiveIndicator ───────────────────────────────────────────────────────────

const ActiveIndicator: React.FC<{ count: number }> = ({ count }) => (
    <span className="inline-flex items-center gap-1">
        <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
        </span>
        <span className="text-[10px] font-semibold tabular-nums text-amber-600 dark:text-amber-400">{count}</span>
    </span>
);

// ── Jobs page ─────────────────────────────────────────────────────────────────

const FILTERS: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'failed', label: 'Failed' },
];

export const Jobs: React.FC = () => {
    const { jobs, activeCount, loading, error, refresh, cleanUp } = useJobs();
    const [filter, setFilter] = useState<FilterTab>('all');
    const [cleaning, setCleaning] = useState(false);

    const filtered = jobs
        .filter((j) => {
            if (filter === 'active') return j.state === 'pending' || j.state === 'running';
            if (filter === 'completed') return j.state === 'completed';
            if (filter === 'failed') return j.state === 'failed';
            return true;
        })
        .sort((a, b) => stateOrder(a.state) - stateOrder(b.state) || new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    const handleCleanUp = async () => {
        setCleaning(true);
        try { await cleanUp(); } finally { setCleaning(false); }
    };

    const completedCount = jobs.filter((j) => j.state === 'completed').length;
    const failedCount = jobs.filter((j) => j.state === 'failed').length;

    return (
        <div className="flex flex-col h-full min-h-0">
            {/* Page header */}
            <PageHeader
                icon={<PageHeaderIcon color="rose"><CustomIcon icon="Jobs" className="w-5 h-5" /></PageHeaderIcon>}
                title="Jobs"
                helper={{
                    title: "Jobs",
                    size: "xs",
                    content: (
                        <div className="max-w-[400px]">
                            <p>Jobs are background tasks running on this host — updates in real time.</p>
                        </div>
                    ),
                }}
                subtitle={loading ? 'Loading…' : <Pill color="rose">{jobs.length} job{jobs.length !== 1 ? 's' : ''}</Pill>}
                actions={<>
                    <IconButton
                        icon="Refresh"
                        variant="ghost"
                        color="slate"
                        size="xs"
                        onClick={() => void refresh()}
                        aria-label="Refresh"
                        className={`{loading ? 'cursor-not-allowed animate-spin' : ''}`}
                    />
                </>}
                className="flex-none bg-white dark:bg-neutral-900"
            />
            <div className="flex-shrink-0 flex items-center gap-1 px-6 py-2">
                <Tabs
                    variant="underline"
                    color="parallels"
                    size="sm"
                    listClassName="bg-transparent px-1"
                    onChange={(value) => setFilter(value as FilterTab)}
                    items={FILTERS.map(({ key, label }) => ({
                        id: key,
                        label: `${label}`,
                    }))}
                />
            </div>
            {/* Filter tabs */}
            <div className="flex-shrink-0 flex items-center gap-1 px-6 py-2 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                {FILTERS.map(({ key, label }) => {
                    const count =
                        key === 'all' ? jobs.length :
                            key === 'active' ? activeCount :
                                key === 'completed' ? completedCount :
                                    failedCount;
                    return (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            className={classNames(
                                'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5',
                                filter === key
                                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm border border-neutral-200 dark:border-neutral-700'
                                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200',
                            )}
                        >
                            {label}
                            {count > 0 && (
                                <span className={classNames(
                                    'inline-flex items-center justify-center rounded-full w-4 h-4 text-[9px] font-bold tabular-nums',
                                    filter === key
                                        ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
                                        : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300',
                                )}>
                                    {count > 99 ? '99+' : count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Job list */}
            <div className="flex-1 overflow-y-auto p-6 w-full h-full">
                {error ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                        <EmptyState
                            icon="Error"
                            title="Something went wrong"
                            subtitle={typeof error === "string" ? error : "An unexpected error occurred."}
                            tone="danger"
                            showIcon
                            actionLabel="Retry"
                            onAction={() => void refresh()}
                            actionVariant="solid"
                            actionColor="blue"
                            disableBorder
                            size="lg"
                        />
                    </div>
                ) : loading && jobs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                        <Loader
                            size="lg"
                            label="Please wait..."
                            color="parallels"
                            variant="spinner"
                            title="Loading..."
                            spinnerThickness="thick"
                            spinnerVariant="segments"
                        />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                        <EmptyState
                            icon="Jobs"
                            title={filter === 'all' ? 'No jobs yet' : `No ${filter} jobs`}
                            subtitle={filter === 'all'
                                ? 'Background tasks will appear here as they are created.'
                                : `No jobs with state "${filter}" found.`
                            }
                            tone="neutral"
                            disableBorder
                        />
                    </div>
                ) : (
                    <div className="space-y-3 max-w-3xl">
                        {filtered.map((job) => (
                            <JobCard key={job.id} job={job} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Jobs;
