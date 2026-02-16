export type HostAuthType = 'credentials' | 'api_key';

export interface HostConfig {
    id: string;
    hostname: string;
    baseUrl: string;
    authType: HostAuthType;
    username: string;
    keepLoggedIn: boolean;
    lastUsed?: string;
    isDefault?: boolean;
    type: 'Orchestrator' | 'Host' | 'Catalog';
}
