import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { Job } from '@/interfaces/Jobs';
import { jobsService } from '@/services/devops/jobsService';
import { useSession } from './SessionContext';
import { useEventsHub } from './EventsHubContext';

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
        if (!msgs?.length) return;
        const latest = msgs[0]; // newest first
        if (latest.id === lastEventIdRef.current) return;
        lastEventIdRef.current = latest.id;

        const msg = latest.raw.message; // JOB_CREATED | JOB_UPDATED | JOB_COMPLETED | JOB_FAILED
        if (!msg) return;

        const job = latest.raw.body as Job | undefined;
        if (!job?.id) return;

        if (msg === 'JOB_CREATED' || msg === 'JOB_UPDATED' || msg === 'JOB_COMPLETED' || msg === 'JOB_FAILED') {
            dispatch({ type: 'UPSERT', job });
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
        () => jobs.filter((j) => j.state === 'pending' || j.state === 'running'),
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
