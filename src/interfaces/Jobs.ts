export type JobState = 'pending' | 'init' | 'running' | 'completed' | 'failed' | 'skipped' | string;

/**
 * Job interface
 */
export interface Job {
    id: string;
    owner: string;
    owner_name?: string;
    owner_email?: string;
    message?: string;
    state: JobState;
    progress: number;
    job_type: string;
    job_operation: string;
    steps: JobStep[];
    result: string;
    error: string;
    result_record_id?: string;
    result_record_type?: string;
    created_at: string;
    updated_at: string;
}

export interface JobStep {
    name: string;
    display_name?: string;
    weight: number;
    parallel: boolean;
    hasPercentage: boolean;
    state: JobState;
    value: number;
    total: number;
    eta: string;
    message: string;
    error: string;
    filename: string;
    unit: string;
}
