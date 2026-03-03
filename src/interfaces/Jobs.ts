/**
 * Job interface
 */
export interface Job {
    id: string;
    owner: string;
    owner_name?: string;
    owner_email?: string;
    state: 'pending' | 'running' | 'completed' | 'failed' | string;
    progress: number;
    job_type: string;
    job_operation: string;
    action: string;
    action_message?: string;
    action_percentage?: number;
    action_total?: number;
    action_value?: number;
    action_value_unit?: string;
    action_eta?: number | string;
    result: string;
    error: string;
    created_at: string;
    updated_at: string;
}
