export interface StartupStage {
    id: string;
    label: string;
    title: string;
    status: StartupStageStatus;
    errorMessage?: string;
    errorType?: string;
    description?: string;
    statusMessage?: string;
    retryCount?: number;
    maxRetryCount?: number;
    progress?: {
        percentage: number;
        currentMessage?: string;
        details?: string;
    };
}

export type StartupStageStatus = 'pending' | 'in-progress' | 'has-error' | 'is-ok';
