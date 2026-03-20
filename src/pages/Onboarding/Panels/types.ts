import type { HostAuthType } from '../../../interfaces/Host';

export type OnboardingStep = 'pick' | 'connect' | 'local' | 'ssh';
export type LocalRunMode = 'docker' | 'podman' | 'service';
export type SshAuthMethod = 'password' | 'sshkey';
export type LocalSetupPhase = 'configure' | 'waiting' | 'timeout';

export interface ModuleState {
  host: boolean;
  catalog: boolean;
  orchestrator: boolean;
  'reverse-proxy': boolean;
  cors: boolean;
}

export type ModuleId = keyof ModuleState;

export interface DialogInformation {
  isOpen: boolean;
  title: string;
  message: string;
  errorMessage?: string;
  tone?: 'danger' | 'success' | 'warning' | 'neutral';
  actions: { label: string; onClick: () => void; variant?: string }[];
}

export interface FormErrors {
  serverUrl?: string;
  username?: string;
  password?: string;
  apiKey?: string;
}

export type TouchedFields = {
  serverUrl: boolean;
  username: boolean;
  password: boolean;
  apiKey: boolean;
};

export interface OnboardingPrefill {
  serverUrl?: string;
  authType?: HostAuthType;
  username?: string;
  hostId?: string;
  /** True when launched from the Login page's "Add a new server" link. */
  fromLogin?: boolean;
}

export interface LoginErrorResult {
  title: string;
  message: string;
  details?: string;
}
