import React, { useState } from 'react';
import { Button, CustomIcon, EmptyState, IconButton, Loader, Pill, Tabs } from '@prl/ui-kit';
import { useLocation } from 'react-router-dom';
import { useJobs } from '@/contexts/JobsContext';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { PageHeader, PageHeaderIcon } from '@/components/PageHeader';
import type { JobsDeepLinkState } from '@/types/deepLink';
import { JobCard } from './JobCard';
import { type FilterTab, FILTERS } from './jobsTypes';

export const Jobs: React.FC = () => {
    const { jobs, activeCount, loading, error, refresh, cleanUp } = useJobs();
    const { themeColor } = useSystemSettings();
    const location = useLocation();
    const { selectJobId } = (location.state as JobsDeepLinkState | null) ?? {};
    const [filter, setFilter] = useState<FilterTab>('all');
    const [cleaning, setCleaning] = useState(false);

    const completedCount = jobs.filter((j) => j.state === 'completed').length;
    const failedCount    = jobs.filter((j) => j.state === 'failed').length;

    const filtered = jobs
        .filter((j) => {
            if (filter === 'active')    return j.state === 'pending' || j.state === 'running' || j.state === 'init';
            if (filter === 'completed') return j.state === 'completed';
            if (filter === 'failed')    return j.state === 'failed';
            return true;
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const handleCleanUp = async () => {
        setCleaning(true);
        try { await cleanUp(); } finally { setCleaning(false); }
    };

    return (
        <div className="flex flex-col h-full min-h-0">
            <PageHeader
                icon={<PageHeaderIcon color={themeColor}><CustomIcon icon="Jobs" className="w-5 h-5" /></PageHeaderIcon>}
                title="Jobs"
                helper={{
                    title: 'Jobs',
                    size: 'xs',
                    content: (
                        <div className="max-w-[400px]">
                            <p>Jobs are background tasks running on this host — updates in real time.</p>
                        </div>
                    ),
                }}
                subtitle={loading
                    ? 'Loading…'
                    : <Pill color={themeColor}>{jobs.length} job{jobs.length !== 1 ? 's' : ''}</Pill>
                }
                actions={
                    <div className="flex items-center gap-3">
                        <IconButton
                            icon="Refresh"
                            variant="ghost"
                            color="slate"
                            size="xs"
                            onClick={() => void refresh()}
                            aria-label="Refresh"
                        />
                        <Button
                            variant="soft"
                            color={themeColor}
                            leadingIcon="Trash"
                            size="sm"
                            onClick={() => void handleCleanUp()}
                            aria-label="Clean Up"
                            loading={cleaning}
                        >
                            Clean Up
                        </Button>
                    </div>
                }
                className="flex-none bg-white dark:bg-neutral-900"
            />

            <div className="flex-shrink-0 flex items-center gap-1 px-6 py-2">
                <Tabs
                    variant="underline"
                    color={themeColor}
                    size="sm"
                    listClassName="bg-transparent px-1"
                    onChange={(value) => setFilter(value as FilterTab)}
                    items={FILTERS.map(({ key, label }) => {
                        const count =
                            key === 'all'       ? jobs.length :
                            key === 'active'    ? activeCount :
                            key === 'completed' ? completedCount :
                                                  failedCount;
                        const badgeColor =
                            key === 'active'    ? 'blue' :
                            key === 'completed' ? 'emerald' : 'rose';
                        return {
                            id: key,
                            label,
                            badgeColor,
                            badge: count > 0 ? `${count}` : undefined,
                        };
                    })}
                />
            </div>

            <div className="flex-1 overflow-y-auto p-6 w-full h-full">
                {error ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                        <EmptyState
                            icon="Error"
                            title="Something went wrong"
                            subtitle={typeof error === 'string' ? error : 'An unexpected error occurred.'}
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
                            color={themeColor}
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
                    <div className="space-y-3 w-full">
                        {filtered.map((job) => (
                            <JobCard key={job.id} job={job} highlighted={job.id === selectJobId} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Jobs;
