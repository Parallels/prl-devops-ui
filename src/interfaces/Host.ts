import { HostHardwareInfo } from './devops';

export type HostAuthType = 'credentials' | 'api_key';

export interface HostConfig {
    id: string;
    /** Optional display name; falls back to hostname if not set */
    name?: string;
    hostname: string;
    baseUrl: string;
    authType: HostAuthType;
    username: string;
    keepLoggedIn: boolean;
    lastUsed?: string;
    isDefault?: boolean;
    type: 'Orchestrator' | 'Host' | 'Catalog';
    /** Last known hardware info — persisted so it's available immediately after reload */
    hardwareInfo?: HostHardwareInfo;
}
