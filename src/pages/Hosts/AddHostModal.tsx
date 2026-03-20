import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  ButtonSelector,
  CollapsiblePanel,
  FormField,
  Input,
  Modal,
  MultiToggle,
  Panel,
  PasswordInput,
  Pill,
  Toggle,
} from '@prl/ui-kit';
import { useSession } from '@/contexts/SessionContext';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { devopsService } from '@/services/devops';
import type { AddOrchestratorHostRequest, DeployOrchestratorHostRequest } from '@/interfaces/devops';

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = 'pick' | 'connect' | 'ssh';
type AuthType = 'credentials' | 'api_key';
type SshAuthMethod = 'password' | 'ssh-key';

// ── Tag input ─────────────────────────────────────────────────────────────────

function TagInput({ value, onChange, color }: { value: string[]; onChange: (tags: string[]) => void; color: string }) {
  const [input, setInput] = useState('');

  const addTag = (raw: string) => {
    const tag = raw.trim();
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Input
        tone={color as any}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => input.trim() && addTag(input)}
        placeholder="Type a tag and press Enter"
      />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1">
              <Pill size="sm" tone="sky" variant="soft">{tag}</Pill>
              <button
                type="button"
                aria-label={`Remove tag ${tag}`}
                onClick={() => onChange(value.filter((t) => t !== tag))}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-xs leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export interface AddHostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded?: (isAsync: boolean) => void;
}

// ── Module options ─────────────────────────────────────────────────────────────

const MODULE_OPTIONS = [
  { value: 'api', label: 'API' },
  { value: 'host', label: 'Host' },
  { value: 'catalog', label: 'Catalog' },
  { value: 'cors', label: 'CORS' },
  { value: 'log_viewer', label: 'Log Viewer' },
];

// ── Option picker ─────────────────────────────────────────────────────────────

function OptionPicker({ onSelect, color }: { onSelect: (step: 'connect' | 'ssh') => void; color: string }) {
  return (
    <div className="grid grid-cols-2 gap-3 py-1">
      <button
        type="button"
        onClick={() => onSelect('connect')}
        className={`flex flex-col items-start gap-3 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 text-left transition-all hover:border-${color}-400 hover:shadow-md dark:hover:border-${color}-500 focus:outline-none focus:ring-2 focus:ring-${color}-500`}
      >
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-${color}-50 dark:bg-${color}-500/10`}>
          <svg className={`h-5 w-5 text-${color}-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Connect Existing</p>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">Register a host that already has the agent running</p>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onSelect('ssh')}
        className={`flex flex-col items-start gap-3 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 text-left transition-all hover:border-${color}-400 hover:shadow-md dark:hover:border-${color}-500 focus:outline-none focus:ring-2 focus:ring-${color}-500`}
      >
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-${color}-50 dark:bg-${color}-500/10`}>
          <svg className={`h-5 w-5 text-${color}-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Deploy via SSH</p>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">Auto-install the agent on a remote machine over SSH</p>
        </div>
      </button>
    </div>
  );
}

// ── Connect existing host form ────────────────────────────────────────────────

function ConnectForm({
  onBack,
  onDone,
  color,
  hostname,
}: {
  onBack: () => void;
  onDone: () => void;
  color: string;
  hostname: string;
}) {
  const [hostUrl, setHostUrl] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [authType, setAuthType] = useState<AuthType>('credentials');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ hostUrl: false, username: false, password: false, apiKey: false });

  const touch = (f: keyof typeof touched) => setTouched((p) => ({ ...p, [f]: true }));

  const urlError = touched.hostUrl && !hostUrl.trim() ? 'Host URL is required' : touched.hostUrl && (() => { try { new URL(hostUrl); return false; } catch { return true; } })() ? 'Enter a valid URL' : undefined;
  const usernameError = authType === 'credentials' && touched.username && !username.trim() ? 'Username is required' : undefined;
  const passwordError = authType === 'credentials' && touched.password && !password.trim() ? 'Password is required' : undefined;
  const apiKeyError = authType === 'api_key' && touched.apiKey && !apiKey.trim() ? 'API Key is required' : undefined;

  const isValid = !!hostUrl.trim() && !urlError &&
    (authType === 'credentials' ? !!username.trim() && !!password.trim() : !!apiKey.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ hostUrl: true, username: true, password: true, apiKey: true });
    if (!isValid) return;

    setSubmitting(true);
    setError(null);
    try {
      const request: AddOrchestratorHostRequest = {
        host: hostUrl.replace(/\/+$/, ''),
        description: description.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        authentication: authType === 'credentials'
          ? { username, password }
          : { api_key: apiKey },
      };
      await devopsService.orchestrator.addOrchestratorHost(hostname, request);
      onDone();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to add host');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} noValidate className="flex flex-col gap-3">
      <Button type="button" variant="clear" color={color as any} size="xs" leadingIcon="ArrowLeft" onClick={onBack}>
        Back
      </Button>

      <Panel variant="glass" padding="xs">
        <FormField label="Host URL" required width="full" error={urlError}>
          <Input
            tone={color as any}
            type="url"
            value={hostUrl}
            onChange={(e) => setHostUrl(e.target.value)}
            onBlur={() => {
              if (hostUrl && !/^https?:\/\//i.test(hostUrl)) setHostUrl('http://' + hostUrl);
              touch('hostUrl');
            }}
            placeholder="http://10.0.4.3:5680"
          />
        </FormField>
        <FormField label="Description" width="full">
          <Input tone={color as any} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mac Mini M1 (optional)" />
        </FormField>
      </Panel>

      <Panel variant="glass" padding="xs">
        <MultiToggle
          color={color as any}
          size="sm"
          value={authType}
          onChange={(v) => setAuthType(v as AuthType)}
          options={[
            { value: 'credentials', label: 'Credentials' },
            { value: 'api_key', label: 'API Key' },
          ]}
        />

        {authType === 'credentials' && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <FormField label="Username" required width="full" error={usernameError}>
              <Input tone={color as any} value={username} onChange={(e) => setUsername(e.target.value)} onBlur={() => touch('username')} placeholder="root" autoComplete="username" />
            </FormField>
            <FormField label="Password" required width="full" error={passwordError}>
              <PasswordInput tone={color as any} value={password} onChange={(e) => setPassword(e.target.value)} onBlur={() => touch('password')} placeholder="Password" autoComplete="current-password" />
            </FormField>
          </div>
        )}

        {authType === 'api_key' && (
          <div className="mt-3">
            <FormField label="API Key" required width="full" error={apiKeyError}>
              <PasswordInput tone={color as any} value={apiKey} onChange={(e) => setApiKey(e.target.value)} onBlur={() => touch('apiKey')} placeholder="Enter API key" autoComplete="off" />
            </FormField>
          </div>
        )}
      </Panel>

      <CollapsiblePanel title="Tags" variant="plain">
        <TagInput value={tags} onChange={setTags} color={color} />
      </CollapsiblePanel>

      {error && <Alert variant="subtle" tone="danger" title="Error" description={error} />}

      <Button type="submit" variant="solid" color={color as any} fullWidth disabled={submitting}>
        {submitting ? 'Adding host…' : 'Add Host'}
      </Button>
    </form>
  );
}

// ── SSH deploy form ────────────────────────────────────────────────────────────

function SshDeployForm({
  onBack,
  onDone,
  color,
  hostname,
}: {
  onBack: () => void;
  onDone: (hostName: string) => void;
  color: string;
  hostname: string;
}) {
  // Identity
  const [hostName, setHostName] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // SSH connection
  const [sshHost, setSshHost] = useState('');
  const [sshPort, setSshPort] = useState('');
  const [sshAuth, setSshAuth] = useState<SshAuthMethod>('password');
  const [sshUser, setSshUser] = useState('');
  const [sshPassword, setSshPassword] = useState('');
  const [sshKey, setSshKey] = useState('');

  // Credentials & security
  const [insecureHostKey, setInsecureHostKey] = useState(false);
  const [sudoPassword, setSudoPassword] = useState('');
  const [rootPassword, setRootPassword] = useState('');

  // Install options
  const [agentPort, setAgentPort] = useState('');
  const [preRelease, setPreRelease] = useState(false);
  const [enabledModules, setEnabledModules] = useState<string[]>([]);
  const [pdVersion, setPdVersion] = useState('');
  const [agentVersion, setAgentVersion] = useState('');
  const [enrollmentTtl, setEnrollmentTtl] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ hostName: false, sshHost: false, sshUser: false, sshCredential: false });

  const touch = (f: keyof typeof touched) => setTouched((p) => ({ ...p, [f]: true }));

  const sshCredential = sshAuth === 'password' ? sshPassword : sshKey;
  const hostNameError = touched.hostName && !hostName.trim() ? 'Host name is required' : undefined;
  const sshHostError = touched.sshHost && !sshHost.trim() ? 'SSH host is required' : undefined;
  const sshUserError = touched.sshUser && !sshUser.trim() ? 'SSH user is required' : undefined;
  const sshCredentialError = touched.sshCredential && !sshCredential.trim() ? (sshAuth === 'password' ? 'Password is required' : 'SSH key is required') : undefined;

  const isValid = !!hostName.trim() && !!sshHost.trim() && !!sshUser.trim() && !!sshCredential.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ hostName: true, sshHost: true, sshUser: true, sshCredential: true });
    if (!isValid) return;

    setSubmitting(true);
    setError(null);
    try {
      const request: DeployOrchestratorHostRequest = {
        ssh_host: sshHost.trim(),
        ...(sshPort.trim() && { ssh_port: sshPort.trim() }),
        ssh_user: sshUser.trim(),
        ...(sshAuth === 'password' ? { ssh_password: sshPassword } : { ssh_key: sshKey }),
        ...(insecureHostKey && { ssh_insecure_host_key: true }),
        ...(sudoPassword.trim() && { sudo_password: sudoPassword }),
        host_name: hostName.trim(),
        ...(tags.length > 0 && { tags }),
        ...(rootPassword.trim() && { root_password: rootPassword }),
        ...(enabledModules.length > 0 && { enabled_modules: enabledModules.join(',') }),
        ...(pdVersion.trim() && { pd_version: pdVersion.trim() }),
        ...(agentVersion.trim() && { agent_version: agentVersion.trim() }),
        ...(preRelease && { pre_release: true }),
        ...(agentPort.trim() && { agent_port: agentPort.trim() }),
        ...(enrollmentTtl.trim() && { enrollment_token_ttl: parseInt(enrollmentTtl, 10) }),
      };
      await devopsService.orchestrator.deployOrchestratorHost(hostname, request);
      onDone(hostName.trim());
    } catch (err: any) {
      setError(err?.message ?? 'Failed to start deployment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} noValidate className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto pr-0.5">
      <Button type="button" variant="clear" color={color as any} size="xs" leadingIcon="ArrowLeft" onClick={onBack}>
        Back
      </Button>

      {/* Agent identity */}
      <Panel variant="glass" padding="xs">
        <FormField label="Host Name" required width="full" error={hostNameError}
          hint="Display name for this host in the orchestrator">
          <Input tone={color as any} value={hostName} onChange={(e) => setHostName(e.target.value)} onBlur={() => touch('hostName')} placeholder="canary-host-01" />
        </FormField>
      </Panel>

      {/* SSH connection */}
      <Panel variant="glass" padding="xs">
        <div className="grid grid-cols-[1fr_90px] gap-3">
          <FormField label="SSH Host" required width="full" error={sshHostError}>
            <Input tone={color as any} value={sshHost} onChange={(e) => setSshHost(e.target.value)} onBlur={() => touch('sshHost')} placeholder="10.0.5.236" />
          </FormField>
          <FormField label="SSH Port" width="full">
            <Input tone={color as any} value={sshPort} onChange={(e) => setSshPort(e.target.value)} placeholder="22" />
          </FormField>
        </div>

        <div className="mt-3">
          <MultiToggle
            color={color as any}
            size="sm"
            value={sshAuth}
            onChange={(v) => { setSshAuth(v as SshAuthMethod); setSshPassword(''); setSshKey(''); }}
            options={[
              { value: 'password', label: 'Password' },
              { value: 'ssh-key', label: 'SSH Key' },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <FormField label="SSH User" required width="full" error={sshUserError}>
            <Input tone={color as any} value={sshUser} onChange={(e) => setSshUser(e.target.value)} onBlur={() => touch('sshUser')} placeholder="cjlapao" autoComplete="username" />
          </FormField>
          <FormField label={sshAuth === 'password' ? 'SSH Password' : 'SSH Key'} required width="full" error={sshCredentialError}>
            <PasswordInput
              tone={color as any}
              value={sshCredential}
              onChange={(e) => sshAuth === 'password' ? setSshPassword(e.target.value) : setSshKey(e.target.value)}
              onBlur={() => touch('sshCredential')}
              placeholder={sshAuth === 'password' ? 'Password' : 'Paste PEM private key'}
              autoComplete={sshAuth === 'password' ? 'current-password' : 'off'}
            />
          </FormField>
        </div>
      </Panel>

      {/* Credentials & security */}
      <CollapsiblePanel title="Credentials & Security" variant="plain">
        <div className="flex flex-col gap-3">
          <Toggle color={color as any} size="sm" label="Skip host key verification" description="Insecure — use only in trusted networks" checked={insecureHostKey} onChange={(e) => setInsecureHostKey(e.target.checked)} />
          <FormField label="Sudo Password" width="full" hint="Leave empty to use SSH password for sudo">
            <PasswordInput tone={color as any} value={sudoPassword} onChange={(e) => setSudoPassword(e.target.value)} placeholder="Sudo password (optional)" autoComplete="off" />
          </FormField>
          <FormField label="Root / API Password" width="full" hint="Sets the agent's built-in root account password">
            <PasswordInput tone={color as any} value={rootPassword} onChange={(e) => setRootPassword(e.target.value)} placeholder="Agent root password (optional)" autoComplete="new-password" />
          </FormField>
        </div>
      </CollapsiblePanel>

      {/* Install options */}
      <CollapsiblePanel title="Install Options" variant="plain">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Agent Port" width="full" hint="Default: 3080">
              <Input tone={color as any} value={agentPort} onChange={(e) => setAgentPort(e.target.value)} placeholder="3080" />
            </FormField>
            <FormField label="Enrollment TTL (min)" width="full">
              <Input tone={color as any} type="number" min={1} value={enrollmentTtl} onChange={(e) => setEnrollmentTtl(e.target.value)} placeholder="15" />
            </FormField>
          </div>

          <Toggle color={color as any} size="sm" label="Use pre-release" description="Install the latest pre-release build instead of stable" checked={preRelease} onChange={(e) => setPreRelease(e.target.checked)} />

          <div className="grid grid-cols-2 gap-3">
            <FormField label="PD Version" width="full">
              <Input tone={color as any} value={pdVersion} onChange={(e) => setPdVersion(e.target.value)} placeholder="latest" />
            </FormField>
            <FormField label="Agent Version" width="full">
              <Input tone={color as any} value={agentVersion} onChange={(e) => setAgentVersion(e.target.value)} placeholder="e.g. v0.7.0-beta" />
            </FormField>
          </div>

          <ButtonSelector
            color={color as any}
            label="Enabled Modules"
            options={MODULE_OPTIONS}
            value={enabledModules}
            onChange={(v) => setEnabledModules(v as string[])}
            cols={3}
          />
        </div>
      </CollapsiblePanel>

      {/* Tags */}
      <CollapsiblePanel title="Tags" variant="plain">
        <TagInput value={tags} onChange={setTags} color={color} />
      </CollapsiblePanel>

      {error && <Alert variant="subtle" tone="danger" title="Error" description={error} />}

      <Button type="submit" variant="solid" color={color as any} fullWidth disabled={submitting}>
        {submitting ? 'Starting deployment…' : 'Start Deployment'}
      </Button>
    </form>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

const STEP_TITLES: Record<Step, string> = {
  pick: 'Add Host',
  connect: 'Connect to Existing Agent',
  ssh: 'Deploy via SSH',
};

export const AddHostModal: React.FC<AddHostModalProps> = ({ isOpen, onClose, onAdded }) => {
  const { session } = useSession();
  const { themeColor } = useSystemSettings();
  const [step, setStep] = useState<Step>('pick');

  useEffect(() => {
    if (isOpen) setStep('pick');
  }, [isOpen]);

  const hostname = session?.hostname ?? '';

  const handleConnected = () => {
    onClose();
    onAdded?.(false);
  };

  const handleDeployed = (hostName: string) => {
    onClose();
    onAdded?.(true);
    // hostName surfaced to parent via onAdded for optional notification
    void hostName;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={STEP_TITLES[step]}
      size="md"
      closeOnBackdropClick={step === 'pick'}
      closeOnEsc={step === 'pick'}
    >
      {step === 'pick' && (
        <OptionPicker color={themeColor} onSelect={setStep} />
      )}

      {step === 'connect' && (
        <ConnectForm
          onBack={() => setStep('pick')}
          onDone={handleConnected}
          color={themeColor}
          hostname={hostname}
        />
      )}

      {step === 'ssh' && (
        <SshDeployForm
          onBack={() => setStep('pick')}
          onDone={handleDeployed}
          color={themeColor}
          hostname={hostname}
        />
      )}
    </Modal>
  );
};
