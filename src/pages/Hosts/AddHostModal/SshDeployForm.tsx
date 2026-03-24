import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Alert, ButtonSelector, ButtonSelectorOption, CollapsiblePanel, FormField, Input, MultiToggle, Panel, PasswordInput, ThemeColor, Toggle } from '@prl/ui-kit';
import { devopsService } from '@/services/devops';
import type { DeployOrchestratorHostRequest } from '@/interfaces/devops';
import { TagInput } from './TagInput';
import type { SshAuthMethod, SshDeployFormHandle, SshDeployFormState } from './types';
import { arrayToModuleState, DEFAULT_MODULES, moduleStateToArray } from '@/pages/Onboarding/Panels/helpers';
import { ModuleId, ModuleState } from '@/pages/Onboarding/Panels';

export const MODULE_OPTIONS: ButtonSelectorOption<ModuleId>[] = [
  { value: 'host', label: 'Host', description: 'VM & host management', icon: 'Host' },
  { value: 'catalog', label: 'Catalog', description: 'VM image catalog', icon: 'Library' },
  { value: 'orchestrator', label: 'Orchestrator', description: 'Cluster orchestration', icon: 'Container' },
  { value: 'reverse-proxy', label: 'Reverse Proxy', description: 'HTTP / TCP routing', icon: 'ReverseProxy' },
];

export interface SshDeployFormProps {
  hostname: string;
  color: ThemeColor;
  onDeployed: (hostName: string) => void;
  onStateChange?: (state: SshDeployFormState) => void;
}

export const SshDeployForm = forwardRef<SshDeployFormHandle, SshDeployFormProps>(function SshDeployForm({ hostname, color, onDeployed, onStateChange }, ref) {
  const formRef = useRef<HTMLFormElement>(null);

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
  const [pdVersion, setPdVersion] = useState('');
  const [agentVersion, setAgentVersion] = useState('');
  const [enrollmentTtl, setEnrollmentTtl] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ hostName: false, sshHost: false, sshUser: false, sshCredential: false });

  const [modules, setModules] = useState<ModuleState>({ ...DEFAULT_MODULES });

  // ── Imperative handle ───────────────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    submit: () => formRef.current?.requestSubmit(),
  }));

  // ── Validation ──────────────────────────────────────────────────────────────
  const touch = (f: keyof typeof touched) => setTouched((p) => ({ ...p, [f]: true }));

  const sshCredential = sshAuth === 'password' ? sshPassword : sshKey;
  const hostNameError = touched.hostName && !hostName.trim() ? 'Host name is required' : undefined;
  const sshHostError = touched.sshHost && !sshHost.trim() ? 'SSH host is required' : undefined;
  const sshUserError = touched.sshUser && !sshUser.trim() ? 'SSH user is required' : undefined;
  const sshCredentialError = touched.sshCredential && !sshCredential.trim() ? (sshAuth === 'password' ? 'Password is required' : 'SSH key is required') : undefined;

  const isValid = !!hostName.trim() && !!sshHost.trim() && !!sshUser.trim() && !!sshCredential.trim();

  // ── Report state to parent ──────────────────────────────────────────────────
  useEffect(() => {
    onStateChange?.({ canSubmit: isValid, isSubmitting: submitting });
  }, [isValid, submitting]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ hostName: true, sshHost: true, sshUser: true, sshCredential: true });
    if (!isValid) return;

    setSubmitting(true);
    setError(null);
    try {
      const enabledModuleIds = MODULE_OPTIONS.filter((m) => modules[m.value]).map((m) => m.value);
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
        ...(enabledModuleIds.length > 0 && { enabled_modules: enabledModuleIds.join(',') }),
        ...(pdVersion.trim() && { pd_version: pdVersion.trim() }),
        ...(agentVersion.trim() && { agent_version: agentVersion.trim() }),
        ...(preRelease && { pre_release: true }),
        ...(agentPort.trim() && { agent_port: agentPort.trim() }),
        ...(enrollmentTtl.trim() && { enrollment_token_ttl: parseInt(enrollmentTtl, 10) }),
      };
      await devopsService.orchestrator.deployOrchestratorHostAsync(hostname, request);
      onDeployed(hostName.trim());
    } catch (err: any) {
      setError(err?.message ?? 'Failed to start deployment');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <form ref={formRef} onSubmit={(e) => void handleSubmit(e)} noValidate className="flex flex-col gap-3">
      {/* Agent identity */}
      <Panel backgroundColor="white" variant="glass" padding="xs" className="shrink-0">
        <FormField label="Host Name" required width="full" error={hostNameError} hint="Display name for this host in the orchestrator">
          <Input tone={color} value={hostName} onChange={(e) => setHostName(e.target.value)} onBlur={() => touch('hostName')} placeholder="host-01" />
        </FormField>
      </Panel>

      {/* SSH connection */}
      <Panel backgroundColor="white" variant="glass" padding="xs" className="shrink-0">
        <div className="grid grid-cols-[1fr_90px] gap-3">
          <FormField label="SSH Host" required width="full" error={sshHostError}>
            <Input tone={color} value={sshHost} onChange={(e) => setSshHost(e.target.value)} onBlur={() => touch('sshHost')} placeholder="10.0.1.1" />
          </FormField>
          <FormField label="SSH Port" width="full">
            <Input tone={color} value={sshPort} onChange={(e) => setSshPort(e.target.value)} placeholder="22" />
          </FormField>
        </div>

        <div className="mt-3">
          <MultiToggle
            color={color}
            size="md"
            value={sshAuth}
            variant="solid"
            adaptiveWidth
            onChange={(v) => {
              setSshAuth(v as SshAuthMethod);
              setSshPassword('');
              setSshKey('');
            }}
            options={[
              { value: 'password', label: 'Password' },
              { value: 'ssh-key', label: 'SSH Key' },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <FormField label="SSH User" required width="full" error={sshUserError}>
            <Input tone={color} value={sshUser} onChange={(e) => setSshUser(e.target.value)} onBlur={() => touch('sshUser')} placeholder="root" autoComplete="username" />
          </FormField>
          <FormField label={sshAuth === 'password' ? 'SSH Password' : 'SSH Key'} required width="full" error={sshCredentialError}>
            <PasswordInput
              tone={color}
              value={sshCredential}
              onChange={(e) => (sshAuth === 'password' ? setSshPassword(e.target.value) : setSshKey(e.target.value))}
              onBlur={() => touch('sshCredential')}
              placeholder={sshAuth === 'password' ? 'Password' : 'Paste PEM private key'}
              autoComplete={sshAuth === 'password' ? 'current-password' : 'off'}
            />
          </FormField>
        </div>
      </Panel>

      {/* Credentials & security */}
      <CollapsiblePanel title="Credentials & Security" variant="glass" padding="xs" minExpandedHeight={200}>
        <div className="flex flex-col gap-3">
          <Toggle
            color={color}
            size="sm"
            label="Skip host key verification"
            description="Insecure — use only in trusted networks"
            checked={insecureHostKey}
            onChange={(e) => setInsecureHostKey(e.target.checked)}
          />
          <FormField label="Sudo Password" width="full" hint="Leave empty to use SSH password for sudo">
            <PasswordInput tone={color} value={sudoPassword} onChange={(e) => setSudoPassword(e.target.value)} placeholder="Sudo password (optional)" autoComplete="off" />
          </FormField>
          <FormField label="Root / API Password" width="full" hint="Sets the agent's built-in root account password">
            <PasswordInput tone={color} value={rootPassword} onChange={(e) => setRootPassword(e.target.value)} placeholder="Agent root password (optional)" autoComplete="new-password" />
          </FormField>
        </div>
      </CollapsiblePanel>

      {/* Install options */}
      <CollapsiblePanel title="Install Options" variant="glass" padding="xs" fillHeight>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Agent Port" width="full" hint="Default: 3080">
              <Input tone={color} value={agentPort} onChange={(e) => setAgentPort(e.target.value)} placeholder="3080" />
            </FormField>
            <FormField label="Enrollment TTL (min)" width="full">
              <Input tone={color} type="number" min={1} value={enrollmentTtl} onChange={(e) => setEnrollmentTtl(e.target.value)} placeholder="15" />
            </FormField>
          </div>

          <Toggle
            color={color}
            size="sm"
            label="Use pre-release"
            description="Install the latest pre-release build instead of stable"
            checked={preRelease}
            onChange={(e) => setPreRelease(e.target.checked)}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField label="PD Version" width="full">
              <Input tone={color} value={pdVersion} onChange={(e) => setPdVersion(e.target.value)} placeholder="latest" />
            </FormField>
            <FormField label="Agent Version" width="full">
              <Input tone={color} value={agentVersion} onChange={(e) => setAgentVersion(e.target.value)} placeholder="e.g. v0.7.0-beta" />
            </FormField>
          </div>

          <ButtonSelector<ModuleId>
            color={color}
            options={MODULE_OPTIONS}
            value={moduleStateToArray(modules)}
            onChange={(v: ModuleId | ModuleId[]) => setModules(arrayToModuleState(v as ModuleId[]))}
            label="Enable Modules"
            cols={2}
          />
        </div>
      </CollapsiblePanel>

      {/* Tags */}
      <CollapsiblePanel title="Tags" variant="glass" padding="xs">
        <TagInput value={tags} onChange={setTags} color={color} />
      </CollapsiblePanel>

      {error && <Alert variant="subtle" tone="danger" title="Error" description={error} />}
    </form>
  );
});
