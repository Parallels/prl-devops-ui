import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Job, HostJobEvent } from '@/interfaces/Jobs';
import { jobsService } from '@/services/devops/jobsService';
import { useSession } from './SessionContext';
import { useEventsHub } from './EventsHubContext';
import { useOptionalNotifications } from './NotificationContext';
import { drainUnseenMessages } from '@/utils/messageQueue';
import { GLOBAL_NOTIFICATION_CHANNEL } from '@/constants/constants';
import { resolveJobOutcome } from '@/utils/jobOutcomeResolver';

const DELETED_JOB_TOMBSTONE_TTL_MS = 60_000;

function titleCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface JobsContextType {
  /** All known jobs, newest first. */
  jobs: Job[];
  /** Jobs that are pending or running. */
  activeJobs: Job[];
  /** Total count of active (pending + running) jobs. */
  activeCount: number;
  /**
   * Count of active jobs per job_type (e.g. { catalog: 1, vm: 2 }).
   * Useful for sidebar badges.
   */
  activeByType: Record<string, number>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  cleanUp: () => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
}

// ── Reducer ───────────────────────────────────────────────────────────────────

type JobsState = Record<string, Job>; // keyed by id

type JobsAction = { type: 'SET_ALL'; jobs: Job[] } | { type: 'UPSERT'; job: Job } | { type: 'REMOVE'; id: string } | { type: 'CLEAR' };

function jobsReducer(state: JobsState, action: JobsAction): JobsState {
  switch (action.type) {
    case 'SET_ALL':
      return Object.fromEntries(action.jobs.map((j) => [j.id, j]));
    case 'UPSERT':
      return { ...state, [action.job.id]: action.job };
    case 'REMOVE': {
      const next = { ...state };
      delete next[action.id];
      return next;
    }
    case 'CLEAR':
      return {};
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

const JobsContext = createContext<JobsContextType | null>(null);

export const JobsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useSession();
  const { containerMessages } = useEventsHub();
  const notifications = useOptionalNotifications();
  const navigate = useNavigate();
  const hostname = session?.hostname ?? '';

  const [jobsMap, dispatch] = useReducer(jobsReducer, {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deletedJobsRef = useRef<Map<string, number>>(new Map());

  const isLocallyDeletedJob = useCallback((id: string): boolean => {
    const deletedAt = deletedJobsRef.current.get(id);
    if (!deletedAt) return false;

    if (Date.now() - deletedAt <= DELETED_JOB_TOMBSTONE_TTL_MS) {
      return true;
    }

    deletedJobsRef.current.delete(id);
    return false;
  }, []);

  // ── Initial fetch ─────────────────────────────────────────────────────────

  const fetchJobs = useCallback(async () => {
    if (!hostname) return;
    setLoading(true);
    setError(null);
    try {
      const list = await jobsService.getJobs(hostname);
      dispatch({ type: 'SET_ALL', jobs: list ?? [] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [hostname]);

  // Fetch on mount and when hostname changes
  useEffect(() => {
    if (!hostname) {
      dispatch({ type: 'CLEAR' });
      return;
    }
    void fetchJobs();
  }, [hostname, fetchJobs]);

  // ── Real-time WS events ───────────────────────────────────────────────────

  const lastEventIdRef = useRef<string | null>(null);

  useEffect(() => {
    const msgs = containerMessages['job_manager'];
    const unseen = drainUnseenMessages(msgs, lastEventIdRef, 'all');
    if (unseen.length === 0) return;

    for (const event of unseen) {
      const msg = event.raw.message; // JOB_CREATED | JOB_UPDATED | JOB_COMPLETED | JOB_FAILED
      if (!msg) continue;

      // Detect forwarded host job events (body.host_id present) vs local jobs
      const rawBody = event.raw.body as Job | HostJobEvent | undefined;
      const isForwarded = !!rawBody && 'host_id' in rawBody;
      const job: Job | undefined = isForwarded ? (rawBody as HostJobEvent).event : (rawBody as Job | undefined);
      const forwardedHostId: string | undefined = isForwarded ? (rawBody as HostJobEvent).host_id : undefined;
      if (!job?.id) continue;

      if (msg === 'JOB_DELETED') {
        dispatch({ type: 'REMOVE', id: job.id });
        deletedJobsRef.current.set(job.id, Date.now());
        continue;
      }

      if (isLocallyDeletedJob(job.id)) {
        continue;
      }

      dispatch({ type: 'UPSERT', job });

      const hostSuffix = forwardedHostId ? ` (host ${forwardedHostId})` : '';
      const jobLabel = `${titleCase(job.job_type)} · ${titleCase(job.job_operation)}${hostSuffix}`;
      const viewAction = {
        label: 'View Job',
        icon: 'ArrowRight' as const,
        onClick: () => navigate('/jobs', { state: { selectJobId: job.id } }),
      };

      const outcome = resolveJobOutcome({
        message: msg,
        job_type: job.job_type,
        job_operation: job.job_operation,
        result_record_id: job.result_record_id,
        result_record_type: job.result_record_type,
        result: job.result,
      });

      const recordAction = outcome.deepLink
        ? {
            label: `View ${outcome.deepLink.label}`,
            icon: 'ArrowRight' as const,
            onClick: () => navigate(outcome.deepLink!.path, { state: outcome.deepLink!.state }),
          }
        : null;

      const baseActions = recordAction ? [viewAction, recordAction] : [viewAction];

      if (msg === 'JOB_CREATED') {
        notifications?.addNotification({
          id: job.id,
          channel: GLOBAL_NOTIFICATION_CHANNEL,
          type: 'info',
          message: `Job started: ${jobLabel}`,
          timestamp: Date.now(),
          updatedAt: Date.now(),
          isRead: false,
          showAsToast: true,
          autoClose: true,
          autoCloseDuration: 15000,
          dismissible: true,
          actions: baseActions,
        });
      } else if (msg === 'JOB_COMPLETED') {
        notifications?.addNotification({
          id: job.id,
          channel: GLOBAL_NOTIFICATION_CHANNEL,
          type: 'success',
          message: `Job completed: ${jobLabel}`,
          details: job.result || undefined,
          timestamp: Date.now(),
          updatedAt: Date.now(),
          isRead: false,
          showAsToast: true,
          autoClose: true,
          autoCloseDuration: 15000,
          dismissible: true,
          replace: true,
          actions: baseActions,
        });
      } else if (msg === 'JOB_FAILED') {
        notifications?.addNotification({
          id: job.id,
          channel: GLOBAL_NOTIFICATION_CHANNEL,
          type: 'error',
          message: `Job failed: ${jobLabel}`,
          details: job.error || undefined,
          timestamp: Date.now(),
          updatedAt: Date.now(),
          isRead: false,
          showAsToast: true,
          autoClose: false,
          dismissible: true,
          replace: true,
          actions: baseActions,
        });
      }
    }
  }, [containerMessages['job_manager'], isLocallyDeletedJob, notifications]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived values ────────────────────────────────────────────────────────

  const jobs = useMemo<Job[]>(() => Object.values(jobsMap).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()), [jobsMap]);

  const activeJobs = useMemo(() => jobs.filter((j) => j.state === 'pending' || j.state === 'running' || j.state === 'init'), [jobs]);

  const activeByType = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    for (const j of activeJobs) {
      counts[j.job_type] = (counts[j.job_type] ?? 0) + 1;
    }
    return counts;
  }, [activeJobs]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const cleanUp = useCallback(async () => {
    if (!hostname) return;
    await jobsService.cleanUpJobs(hostname);
    await fetchJobs();
  }, [hostname, fetchJobs]);

  const deleteJob = useCallback(
    async (id: string) => {
      if (!hostname) return;
      deletedJobsRef.current.set(id, Date.now());
      dispatch({ type: 'REMOVE', id }); // optimistic removal
      try {
        await jobsService.deleteJob(hostname, id);
      } catch {
        deletedJobsRef.current.delete(id);
        await fetchJobs(); // roll back on failure
        throw new Error('Failed to delete job');
      }
    },
    [hostname, fetchJobs],
  );

  const value = useMemo<JobsContextType>(
    () => ({
      jobs,
      activeJobs,
      activeCount: activeJobs.length,
      activeByType,
      loading,
      error,
      refresh: fetchJobs,
      cleanUp,
      deleteJob,
    }),
    [jobs, activeJobs, activeByType, loading, error, fetchJobs, cleanUp, deleteJob],
  );

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
};

export function useJobs(): JobsContextType {
  const ctx = useContext(JobsContext);
  if (!ctx) throw new Error('useJobs must be used within JobsProvider');
  return ctx;
}
