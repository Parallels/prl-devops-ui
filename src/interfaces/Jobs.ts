/**
 * Job interface
 */
export interface Job {
    id: string;
    owner: string;
    state: 'pending' | 'running' | 'completed' | 'failed' | string;
    progress: number;
    job_type: string;
    job_operation: string;
    action: string;
    result: string;
    error: string;
    created_at: string;
    updated_at: string;
}
