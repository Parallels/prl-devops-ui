import React, { useMemo, useState } from 'react';
import { EmptyState, Loader, Tabs } from '@prl/ui-kit';
import type { Job } from '@/interfaces/Jobs';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import type { JobsDeepLinkState } from '@/types/deepLink';
import { JobCard } from './JobCard';
import { FILTERS, type FilterTab } from './jobsTypes';

export interface JobsPanelProps {
  jobs: Job[];
  activeCount: number;
  loading: boolean;
  error?: string | null;
  onRetry: () => void;
  deepLinkState: JobsDeepLinkState | null;
}

export const JobsPanel: React.FC<JobsPanelProps> = ({ jobs, activeCount, loading, error, onRetry, deepLinkState }) => {
  const { themeColor } = useSystemSettings();
  const { selectJobId } = deepLinkState ?? {};
  const [filter, setFilter] = useState<FilterTab>('all');

  const completedCount = useMemo(() => jobs.filter((j) => j.state === 'completed').length, [jobs]);
  const failedCount = useMemo(() => jobs.filter((j) => j.state === 'failed').length, [jobs]);

  const filtered = useMemo(
    () =>
      jobs
        .filter((j) => {
          if (filter === 'active') return j.state === 'pending' || j.state === 'running' || j.state === 'init';
          if (filter === 'completed') return j.state === 'completed';
          if (filter === 'failed') return j.state === 'failed';
          return true;
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [jobs, filter],
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 flex items-center gap-1 px-6 py-2">
        <Tabs
          variant="underline"
          color={themeColor}
          size="sm"
          listClassName="bg-transparent px-1"
          onChange={(value) => setFilter(value as FilterTab)}
          items={FILTERS.map(({ key, label }) => {
            const count = key === 'all' ? jobs.length : key === 'active' ? activeCount : key === 'completed' ? completedCount : failedCount;
            const badgeColor = key === 'active' ? 'blue' : key === 'completed' ? 'emerald' : themeColor;
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
              onAction={onRetry}
              actionVariant="solid"
              actionColor="blue"
              disableBorder
              size="lg"
            />
          </div>
        ) : loading && jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Loader size="lg" label="Please wait..." color={themeColor} variant="spinner" title="Loading..." spinnerThickness="thick" spinnerVariant="segments" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <EmptyState
              icon="Jobs"
              title={filter === 'all' ? 'No jobs yet' : `No ${filter} jobs`}
              subtitle={filter === 'all' ? 'Background tasks will appear here as they are created.' : `No jobs with state "${filter}" found.`}
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
