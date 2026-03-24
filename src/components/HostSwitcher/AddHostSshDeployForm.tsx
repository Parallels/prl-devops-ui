import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useNavigate } from 'react-router-dom';
import { ButtonSelector, CustomIcon, Panel, ThemeColor } from '@prl/ui-kit';
import { Alert, FormField, Input, PasswordInput, Toggle } from '../../controls';
import { useConfig } from '../../contexts/ConfigContext';
import { useSession } from '../../contexts/SessionContext';
import { authService } from '../../services/authService';
import type { HostConfig } from '../../interfaces/Host';
import { getPasswordKey, getApiKeyKey } from '../../utils/secretKeys';
import { decodeToken } from '../../utils/tokenUtils';
import { devopsService } from '../../services/devops';
import type { HostHardwareInfo } from '../../interfaces/devops';
import {
  MODULE_OPTIONS,
  DEFAULT_MODULES,
  POLL_INTERVAL_MS,
  POLL_TIMEOUT_MS,
  buildSshScript,
  moduleStateToArray,
  arrayToModuleState,
  formatCountdown,
  isTauri,
} from '../../pages/Onboarding/Panels/helpers';
import type { LocalSetupPhase, ModuleId, ModuleState, SshAuthMethod } from '../../pages/Onboarding/Panels/types';

// ── Public types ──────────────────────────────────────────────────────────────

export interface SshDeployFormHandle {
  deploy: () => void;
  cancel: () => void;
  retry: () => void;
}

export interface SshDeployFormState {
  phase: LocalSetupPhase;
  canDeploy: boolean;
  elapsedMs: number;
}

export interface AddSshDeployHostFormProps {
  onBack: () => void;
  onConnected?: () => void;
  color?: ThemeColor;
  onStateChange?: (state: SshDeployFormState) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const AddSshDeployHostForm = forwardRef<SshDeployFormHandle, AddSshDeployHostFormProps>(function AddSshDeployHostForm({ onBack: _onBack, onConnected, color = 'blue', onStateChange }, ref) {
  const config = useConfig();
  const { setSession } = useSession();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [serverIp, setServerIp] = useState('');
  const [sshPort, setSshPort] = useState('22');
  const [sshAuth, setSshAuth] = useState<SshAuthMethod>('password');
  const [sshUsername, setSshUsername] = useState('');
  const [sshCredential, setSshCredential] = useState('');
  const [sudoPassword, setSudoPassword] = useState('');
  const [useDifferentSudo, setUseDifferentSudo] = useState(false);
  const [rootPassword, setRootPassword] = useState('');
  const [agentPort, setAgentPort] = useState(5480);
  const [modules, setModules] = useState<ModuleState>({ ...DEFAULT_MODULES });
  const [phase, setPhase] = useState<LocalSetupPhase>('configure');
  const [deployError, setDeployError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  const serverIpRef = useRef(serverIp);
  const agentPortRef = useRef(agentPort);
  const rootPasswordRef = useRef(rootPassword);
  const connectedRef = useRef(false);
  const agentReadyRef = useRef(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countupRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    serverIpRef.current = serverIp;
  }, [serverIp]);
  useEffect(() => {
    agentPortRef.current = agentPort;
  }, [agentPort]);
  useEffect(() => {
    rootPasswordRef.current = rootPassword;
  }, [rootPassword]);

  useEffect(() => {
    if (!rootPassword || !agentReadyRef.current || connectedRef.current) return;
    connectedRef.current = true;
    stopPolling();
    void autoConnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootPassword]);

  const effectiveSudoPassword = useDifferentSudo ? sudoPassword : sshAuth === 'password' ? sshCredential : '';

  const displayScript = buildSshScript(
    serverIp,
    sshPort,
    sshAuth,
    sshUsername,
    sshCredential ? '••••••••' : '',
    effectiveSudoPassword ? '••••••••' : '',
    rootPassword ? '••••••••' : '',
    agentPort,
    modules,
  );
  const copyScript = buildSshScript(serverIp, sshPort, sshAuth, sshUsername, sshCredential, effectiveSudoPassword, rootPassword, agentPort, modules);

  const isValid = serverIp.trim() !== '' && sshUsername.trim() !== '' && sshCredential.trim() !== '';

  // ── Report state to parent ──────────────────────────────────────────────────
  useEffect(() => {
    onStateChange?.({ phase, canDeploy: isValid, elapsedMs });
  }, [phase, isValid, elapsedMs]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Polling & deployment ────────────────────────────────────────────────────
  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (countupRef.current) {
      clearInterval(countupRef.current);
      countupRef.current = null;
    }
  };

  const autoConnect = async () => {
    const baseUrl = `http://${serverIpRef.current}:${agentPortRef.current}`;
    const hostname = serverIpRef.current;
    const pw = rootPasswordRef.current;
    try {
      authService.setCredentials(hostname, { url: baseUrl, username: 'root', password: pw, email: 'root', api_key: '' });
      await authService.forceReauth(hostname);
      await config.setSecret(getPasswordKey(hostname), pw);
      await config.removeSecret(getApiKeyKey(hostname));
      await config.flushSecrets();

      let hardwareInfo: HostHardwareInfo | undefined;
      try {
        hardwareInfo = await devopsService.config.getHardwareInfo(hostname);
      } catch {
        /* non-fatal */
      }

      const existingHosts = (await config.get<HostConfig[]>('hosts')) ?? [];
      const existingIndex = existingHosts.findIndex((h) => h.hostname === hostname);
      const hostEntry: HostConfig = {
        id: existingIndex >= 0 ? existingHosts[existingIndex].id : crypto.randomUUID(),
        name: displayName.trim() || undefined,
        hostname,
        baseUrl,
        authType: 'credentials',
        username: 'root',
        keepLoggedIn: true,
        lastUsed: new Date().toISOString(),
        isDefault: existingIndex >= 0 ? existingHosts[existingIndex].isDefault : existingHosts.length === 0 ? true : undefined,
        type: 'Orchestrator',
        hardwareInfo,
      };
      if (existingIndex >= 0) existingHosts[existingIndex] = hostEntry;
      else existingHosts.push(hostEntry);
      await config.set('hosts', existingHosts);
      await config.save();

      authService.currentHostname = hostname;
      const token = authService.getToken(hostname);
      const tokenPayload = token ? (decodeToken(token) ?? undefined) : undefined;
      setSession({ serverUrl: baseUrl, hostname, username: 'root', authType: 'credentials', hostId: hostEntry.id, connectedAt: new Date().toISOString(), tokenPayload, hardwareInfo });
      if (onConnected) onConnected();
      else navigate('/', { replace: true });
    } catch {
      console.warn('[SSHDeploy] Auto-connect failed — returning to configure');
      stopPolling();
      setPhase('configure');
      setDeployError(`Agent is running but auto-login failed. Try connecting manually to ${baseUrl}`);
    }
  };

  const startPolling = () => {
    connectedRef.current = false;
    agentReadyRef.current = false;
    setElapsedMs(0);

    const startTime = Date.now();
    countupRef.current = setInterval(() => setElapsedMs(Date.now() - startTime), 500);
    timeoutRef.current = setTimeout(() => {
      stopPolling();
      setPhase('timeout');
    }, POLL_TIMEOUT_MS);

    const poll = async () => {
      if (connectedRef.current) return;
      const agentUrl = `http://${serverIpRef.current}:${agentPortRef.current}`;
      try {
        await fetch(`${agentUrl}/api/v1/auth/token`, { method: 'HEAD', mode: 'no-cors' });
      } catch {
        return;
      }
      agentReadyRef.current = true;
      if (connectedRef.current) return;
      if (!rootPasswordRef.current) return;
      connectedRef.current = true;
      stopPolling();
      await autoConnect();
    };

    pollIntervalRef.current = setInterval(() => void poll(), POLL_INTERVAL_MS);
    void poll();
  };

  useEffect(() => {
    return () => stopPolling();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeploy = async () => {
    setDeployError(null);
    setPhase('waiting');
    if (isTauri()) {
      const enabledModuleIds = MODULE_OPTIONS.filter((m) => modules[m.value]).map((m) => m.value);
      try {
        await invoke('deploy_ssh_agent', {
          serverIp,
          sshPort: parseInt(sshPort),
          sshAuth,
          sshUsername,
          sshCredential,
          sudoPassword: effectiveSudoPassword || undefined,
          rootPassword,
          agentPort,
          modules: enabledModuleIds,
        });
      } catch (err) {
        setPhase('configure');
        setDeployError(err instanceof Error ? err.message : String(err));
        return;
      }
    }
    startPolling();
  };

  const handleCancel = () => {
    stopPolling();
    setPhase('configure');
  };

  const handleRetry = () => {
    stopPolling();
    setPhase('configure');
  };

  // ── Imperative handle ───────────────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    deploy: () => void handleDeploy(),
    cancel: handleCancel,
    retry: handleRetry,
  })); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyScript.replace(/\\\n\s+/g, ' '));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.warn('[SSHDeploy] Clipboard copy failed');
    }
  };

  const inTauri = isTauri();

  // ── Configure phase ─────────────────────────────────────────────────────────
  if (phase === 'configure') {
    return (
      <div className="flex flex-col gap-3">
        {deployError && <Alert icon="Warning" variant="subtle" color="rose" title="Deployment failed" description={deployError} />}

        <Panel variant="glass" padding="xs" backgroundColor="white">
          <FormField label="Display Name" width="full">
            <Input type="text" tone={color} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Production Server (optional)" />
          </FormField>
        </Panel>
        <Panel variant="glass" padding="xs" backgroundColor="white">
          <div className="grid grid-cols-[1fr_80px] gap-3">
            <FormField label="Server IP / URL" width="full">
              <Input type="text" tone={color} value={serverIp} onChange={(e) => setServerIp(e.target.value)} placeholder="192.168.1.50" />
            </FormField>
            <FormField label="SSH Port" width="full">
              <Input type="number" tone={color} value={sshPort} onChange={(e) => setSshPort(e.target.value)} placeholder="22" />
            </FormField>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">SSH Authentication</span>
              <div className="flex rounded-lg border border-neutral-200/80 dark:border-neutral-700/60 bg-neutral-50 dark:bg-neutral-800/40 p-0.5 gap-0.5">
                {(['password', 'sshkey'] as SshAuthMethod[]).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setSshAuth(method)}
                    className={[
                      'px-2.5 py-1 rounded-md text-xs font-medium transition-colors duration-150',
                      sshAuth === method ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700',
                    ].join(' ')}
                  >
                    {method === 'password' ? 'Password' : 'SSH Key'}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Username" width="full">
                <Input type="text" tone={color} value={sshUsername} onChange={(e) => setSshUsername(e.target.value)} placeholder="root" />
              </FormField>
              <FormField label={sshAuth === 'password' ? 'SSH Password' : 'SSH Key'} width="full">
                <PasswordInput
                  tone={color}
                  value={sshCredential}
                  onChange={(e) => setSshCredential(e.target.value)}
                  placeholder={sshAuth === 'password' ? 'Enter password' : 'Paste private key'}
                  autoComplete={sshAuth === 'password' ? 'current-password' : 'off'}
                />
              </FormField>
            </div>
          </div>
          <div className="pl-1.5 ">
            <Toggle
              color={color}
              size="sm"
              label="Use different password for sudo"
              checked={useDifferentSudo}
              onChange={(e) => {
                setUseDifferentSudo(e.target.checked);
                if (!e.target.checked) setSudoPassword('');
              }}
            />
          </div>
          {useDifferentSudo && (
            <FormField label="Sudo Password" width="full">
              <PasswordInput tone={color} value={sudoPassword} onChange={(e) => setSudoPassword(e.target.value)} placeholder="Sudo password on remote server" autoComplete="off" />
            </FormField>
          )}

          <div className="flex gap-2">
            <FormField label="Root Password" className="flex-1 min-w-0">
              <PasswordInput tone={color} value={rootPassword} onChange={(e) => setRootPassword(e.target.value)} placeholder="Agent root password" autoComplete="new-password" />
            </FormField>
            <FormField label="Port" className="w-20 shrink-0">
              <Input tone={color} type="number" min={1} max={65535} value={String(agentPort)} onChange={(e) => setAgentPort(Number(e.target.value) || 5480)} placeholder="5480" />
            </FormField>
          </div>

          {!inTauri && (
            <div className="relative overflow-hidden rounded-xl bg-neutral-900 dark:bg-neutral-950">
              <div className="flex items-start gap-2 px-4 py-3 pr-10">
                <span className={`mt-0.5 font-mono text-[11px] leading-relaxed text-${color}-400 select-none`}>$</span>
                <pre className="flex-1 overflow-x-auto font-mono text-[11px] leading-relaxed text-neutral-200 whitespace-pre-wrap break-all">{displayScript}</pre>
              </div>
              <button
                type="button"
                onClick={() => void handleCopy()}
                title="Copy command"
                className="absolute right-2 top-2 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200 transition-colors"
              >
                <CustomIcon icon={copied ? 'CheckCircle' : 'Copy'} size="xs" className={copied ? 'text-emerald-400' : ''} />
              </button>
            </div>
          )}
        </Panel>
        <Panel variant="glass" padding="xs" backgroundColor="white">
          <ButtonSelector<ModuleId>
            color={color}
            options={MODULE_OPTIONS}
            value={moduleStateToArray(modules)}
            onChange={(v: ModuleId | ModuleId[]) => setModules(arrayToModuleState(v as ModuleId[]))}
            label="Modules"
            cols={2}
          />
        </Panel>
      </div>
    );
  }

  // ── Waiting phase ───────────────────────────────────────────────────────────
  if (phase === 'waiting') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-8">
        <span className="relative flex h-5 w-5">
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full bg-${color}-400 opacity-75`} />
          <span className={`relative inline-flex h-5 w-5 rounded-full bg-${color}-400`} />
        </span>
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Waiting for agent…</p>
        <p className="font-mono text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{formatCountdown(elapsedMs)}</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Polling {serverIp}:{agentPort} every 5 seconds (max 5:00)
        </p>
      </div>
    );
  }

  // ── Timeout phase ───────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20">
        <CustomIcon icon="Warning" size="sm" className="text-red-500 dark:text-red-400" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Agent Not Detected</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          No response from {serverIp}:{agentPort} after 5 minutes.
        </p>
      </div>
    </div>
  );
});
