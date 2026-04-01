import React, { useMemo, useState } from 'react';
import { CustomIcon, EmptyState, IconButton, Pill, SplitView, SplitViewPanelHeaderProps, type SplitViewItem } from '@prl/ui-kit';
import { useLocation } from 'react-router-dom';
import { useJobs } from '@/contexts/JobsContext';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { PageHeaderIcon } from '@/components/PageHeader';
import type { JobsDeepLinkState } from '@/types/deepLink';
import { JobsPanel } from './JobsPanel';

const JOBS_PANEL_ID = 'jobs-main';

export const Jobs: React.FC = () => {
  const { jobs, activeCount, loading, error, refresh, cleanUp } = useJobs();
  const { themeColor } = useSystemSettings();
  const location = useLocation();
  const deepLinkState = (location.state as JobsDeepLinkState | null) ?? null;
  const [selectedId, setSelectedId] = useState<string>(JOBS_PANEL_ID);
  const [cleaning, setCleaning] = useState(false);

  const handleCleanUp = async () => {
    setCleaning(true);
    try {
      await cleanUp();
    } finally {
      setCleaning(false);
    }
  };

  const items = useMemo<SplitViewItem[]>(
    () => [
      {
        id: JOBS_PANEL_ID,
        label: 'Jobs',
        subtitle: `${jobs.length} job${jobs.length !== 1 ? 's' : ''}`,
        icon: 'Jobs',
        panel: <JobsPanel
          jobs={jobs}
          activeCount={activeCount}
          loading={loading}
          error={error}
          onRetry={() => void refresh()}
          deepLinkState={deepLinkState}
        />,
      },
    ],
    [jobs, activeCount, loading, error, refresh, deepLinkState],
  );

  const panelHeaderProps = useMemo(
    (): SplitViewPanelHeaderProps => ({
      icon: (
        <PageHeaderIcon color={themeColor}>
          <CustomIcon icon="Jobs" className="w-5 h-5" />
        </PageHeaderIcon>
      ),
      title: 'Jobs',
      helper: {
        title: 'Jobs',
        size: 'xs',
        color: themeColor,
        content: (
          <div className="max-w-100">
            <p>Jobs are background tasks running on this host - updates in real time.</p>
          </div>
        ),
      },
      subtitle: loading ? (
        'Loading…'
      ) : (
        <Pill tone={themeColor}>
          {jobs.length} job{jobs.length !== 1 ? 's' : ''}
        </Pill>
      ),
      actions: (
        <div className="flex items-center gap-3">
          <IconButton tooltip='Clean Up' variant="ghost" color="red" icon="Trash" size="sm" onClick={() => void handleCleanUp()} aria-label="Clean Up" loading={cleaning} />
        </div>
      ),
    }),
    [themeColor, loading, jobs.length, refresh, cleaning],
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0">
        <SplitView
          className="h-full"
          items={items}
          value={selectedId}
          onChange={(id) => setSelectedId(id)}
          loading={loading && jobs.length === 0}
          error={error ?? undefined}
          onRetry={() => void refresh()}
          panelHeaderProps={panelHeaderProps}
          color={themeColor}
          autoHideList
          panelScrollable={false}
          emptyState={
            <EmptyState
              disableBorder
              icon="Jobs"
              title="No Jobs"
              subtitle="We couldn't find any jobs to display."
              tone="neutral"
            />
          }
          panelEmptyState={
            <EmptyState
              disableBorder
              icon="Jobs"
              title="There are no jobs"
              subtitle="We couldn't find any jobs to display."
              tone="neutral"
            />
          }
          listActions={<IconButton icon="Refresh" variant="ghost" color={themeColor} size="xs" onClick={() => void refresh()} aria-label="Refresh" />}
        />
      </div>
    </div>
  );
};

export default Jobs;
