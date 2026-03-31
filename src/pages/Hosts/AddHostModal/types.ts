export type Step = 'pick' | 'connect' | 'ssh';
export type AuthType = 'credentials' | 'api_key';
export type SshAuthMethod = 'password' | 'ssh-key';

export interface ConnectFormHandle {
  submit: () => void;
}

export interface ConnectFormState {
  canSubmit: boolean;
  isSubmitting: boolean;
}

export interface SshDeployFormHandle {
  submit: () => void;
}

export interface SshDeployFormState {
  canSubmit: boolean;
  isSubmitting: boolean;
}
