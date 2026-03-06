import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { navigateToRecord, RECORD_TYPE_LABELS } from '@/hooks/useNavigateTo';
import type { Job } from '@/interfaces/Jobs';
import { jobsService } from '@/services/devops/jobsService';
import { useSession } from './SessionContext';
import { useEventsHub } from './EventsHubContext';
import { useNotifications } from './NotificationContext';
import { drainUnseenMessages } from '@/utils/messageQueue';
import { GLOBAL_NOTIFICATION_CHANNEL } from '@/constants/constants';

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
}

// ── Reducer ───────────────────────────────────────────────────────────────────

type JobsState = Record<string, Job>; // keyed by id

type JobsAction =
    | { type: 'SET_ALL'; jobs: Job[] }
    | { type: 'UPSERT'; job: Job }
    | { type: 'CLEAR' };

function jobsReducer(state: JobsState, action: JobsAction): JobsState {
    switch (action.type) {
        case 'SET_ALL':
            return Object.fromEntries(action.jobs.map((j) => [j.id, j]));
        case 'UPSERT':
            return { ...state, [action.job.id]: action.job };
        case 'CLEAR':
            return {};
    }
}

// ── Context ───────────────────────────────────────────────────────────────────

const JobsContext = createContext<JobsContextType | null>(null);

export const JobsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { session } = useSession();
    const { containerMessages } = useEventsHub();
    const { addNotification } = useNotifications();
    const navigate = useNavigate();
    const hostname = session?.hostname ?? '';

    const [jobsMap, dispatch] = useReducer(jobsReducer, {});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
        if (!hostname) { dispatch({ type: 'CLEAR' }); return; }
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

            const job = event.raw.body as Job | undefined;
            if (!job?.id) continue;

            dispatch({ type: 'UPSERT', job });

            const jobLabel = `${titleCase(job.job_type)} · ${titleCase(job.job_operation)}`;
            const viewAction = {
                label: 'View Job',
                icon: 'ArrowRight' as const,
                onClick: () => navigate('/jobs', { state: { selectJobId: job.id } }),
            };

            // Build an optional "View <Record>" action when the job produced a known record
            const recordAction = (job.result_record_id && job.result_record_type)
                ? (() => {
                    const label = RECORD_TYPE_LABELS[job.result_record_type!.toLowerCase()];
                    if (!label) return null;
                    return {
                        label: `View ${label}`,
                        icon: 'ArrowRight' as const,
                        onClick: () => navigateToRecord(navigate, job.result_record_type!, job.result_record_id!),
                    };
                })()
                : null;

            const baseActions = recordAction ? [viewAction, recordAction] : [viewAction];

            if (msg === 'JOB_CREATED') {
                addNotification({
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
                addNotification({
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
                addNotification({
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
    }, [containerMessages['job_manager']]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Derived values ────────────────────────────────────────────────────────

    const jobs = useMemo<Job[]>(
        () => Object.values(jobsMap).sort(
            (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        ),
        [jobsMap]
    );

    const activeJobs = useMemo(
        () => jobs.filter((j) => j.state === 'pending' || j.state === 'running' || j.state === 'init'),
        [jobs]
    );

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

    const value = useMemo<JobsContextType>(() => ({
        jobs,
        activeJobs,
        activeCount: activeJobs.length,
        activeByType,
        loading,
        error,
        refresh: fetchJobs,
        cleanUp,
    }), [jobs, activeJobs, activeByType, loading, error, fetchJobs, cleanUp]);

    return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
};

export function useJobs(): JobsContextType {
    const ctx = useContext(JobsContext);
    if (!ctx) throw new Error('useJobs must be used within JobsProvider');
    return ctx;
}
