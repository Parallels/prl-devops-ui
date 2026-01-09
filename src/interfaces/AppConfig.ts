export interface AppBehaviorConfig {
    isCanary?: boolean;
    isBeta?: boolean;
    isDev?: boolean;
    releaseChannel?: 'stable' | 'beta' | 'canary';
}

export interface DebugConfig {
    enabled: boolean;
    showDevTools?: boolean;
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
}
