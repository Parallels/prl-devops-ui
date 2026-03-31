import React, { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useNavigate } from 'react-router-dom';
import { ButtonSelector, CustomIcon, MultiToggle } from '@prl/ui-kit';
import { Alert, Button, FormField, Input, Panel, PasswordInput, Toggle } from '../../../controls';
import { useConfig } from '../../../contexts/ConfigContext';
import { useSession } from '../../../contexts/SessionContext';
import { authService } from '../../../services/authService';
import type { HostConfig } from '../../../interfaces/Host';
import { getPasswordKey, getApiKeyKey } from '../../../utils/secretKeys';
import { decodeToken } from '../../../utils/tokenUtils';
import { devopsService } from '../../../services/devops';
import type { HostHardwareInfo } from '../../../interfaces/devops';
import { OnboardingPanelBrand } from './OnboardingBrand';
import { MODULE_OPTIONS, DEFAULT_MODULES, POLL_INTERVAL_MS, POLL_TIMEOUT_MS, buildSshScript, moduleStateToArray, arrayToModuleState, formatCountdown, isTauri } from './helpers';
import type { LocalSetupPhase, ModuleId, ModuleState, SshAuthMethod } from './types';

export interface SshDeployPanelProps {
  onBack: () => void;
  /** Called after a successful auto-connect. Defaults to navigate('/') if omitted. */
  onConnected?: () => void;
}

export const SshDeployPanel: React.FC<SshDeployPanelProps> = ({ onBack, onConnected }) => {
  const color = 'blue';
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

  // If agent came up before root password was entered, trigger auto-connect on password entry
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyScript.replace(/\\\n\s+/g, ' '));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.warn('[SSHDeploy] Clipboard copy failed');
    }
  };

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
      setSession({
        serverUrl: baseUrl,
        hostname,
        username: 'root',
        authType: 'credentials',
        hostId: hostEntry.id,
        connectedAt: new Date().toISOString(),
        tokenPayload,
        hardwareInfo,
      });
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
    countupRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTime);
    }, 500);
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

  const handleRetry = () => {
    stopPolling();
    setPhase('configure');
  };
  const handleCancel = () => {
    stopPolling();
    setPhase('configure');
  };

  const inTauri = isTauri();
  const isValid = serverIp.trim() !== '' && sshUsername.trim() !== '' && sshCredential.trim() !== '';

  return (
    <Panel maxWidth={700} variant="elevated" padding="none">
      <div className="flex">
        {/* Left: branding + context */}
        <div className="flex w-52 shrink-0 flex-col justify-between rounded-l-[inherit] bg-linear-to-br from-blue-50 to-purple-50/70 p-5 dark:from-blue-950/60 dark:to-purple-950/40">
          <div className="space-y-4">
            <OnboardingPanelBrand />
            <div>
              <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Auto-Deploy via SSH</h2>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">Install and launch the agent on any remote server using SSH credentials.</p>
            </div>
            <div className="space-y-2">
              {(
                [
                  { icon: 'Key', label: 'Password or SSH key auth' },
                  { icon: 'Globe', label: 'Any reachable server' },
                  { icon: 'Script', label: 'Automated installation' },
                  { icon: 'Container', label: 'Choose your modules' },
                ] as const
              ).map((f) => (
                <div key={f.label} className="flex items-center gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-500/20">
                    <CustomIcon icon={f.icon} size="xs" className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-[11px] text-neutral-600 dark:text-neutral-400">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
          <Button size="xs" variant="clear" fullWidth color="slate" accentColor="blue" leadingIcon="ArrowLeft" onClick={onBack}>
            Back to options
          </Button>
        </div>

        {/* Soft vertical divider */}
        <div className="w-px shrink-0 bg-linear-to-b from-transparent via-neutral-200 to-transparent dark:via-neutral-700/60" />

        {/* Right: phase-dependent content */}
        <div className="p-5 min-w-0">
          <div className="flex flex-col gap-4 min-w-0">
            {/* ── configure phase ──────────────────────────────────────────────── */}
            {phase === 'configure' && (
              <>
                <div className="space-y-3">
                  <FormField label="Display Name" width="full">
                    <Input type="text" tone={color} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Production Server (optional)" />
                  </FormField>

                  {/* Server + SSH port */}
                  <div className="grid grid-cols-[1fr_80px] gap-3">
                    <FormField label="Server IP / URL" width="full">
                      <Input type="text" tone={color} value={serverIp} onChange={(e) => setServerIp(e.target.value)} placeholder="192.168.1.50" />
                    </FormField>
                    <FormField label="SSH Port" width="full">
                      <Input type="number" tone={color} value={sshPort} onChange={(e) => setSshPort(e.target.value)} placeholder="22" />
                    </FormField>
                  </div>

                  {/* SSH auth method */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">SSH Authentication</span>
                      <MultiToggle
                        options={[
                          { value: 'password', label: 'Password' },
                          { value: 'sshkey', label: 'SSH Key' },
                        ]}
                        value={sshAuth}
                        onChange={(v) => setSshAuth(v as SshAuthMethod)}
                        size="sm"
                        color={color}
                        variant="solid"
                        adaptiveWidth
                      />
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

                  {/* Sudo password toggle */}
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
                  {useDifferentSudo && (
                    <FormField label="Sudo Password" width="full">
                      <PasswordInput tone={color} value={sudoPassword} onChange={(e) => setSudoPassword(e.target.value)} placeholder="Sudo password on remote server" autoComplete="off" />
                    </FormField>
                  )}

                  {/* Root password + agent port */}
                  <div className="flex gap-2">
                    <FormField label="Root Password" className="flex-1 min-w-0">
                      <PasswordInput tone={color} value={rootPassword} onChange={(e) => setRootPassword(e.target.value)} placeholder="Agent root password" autoComplete="new-password" />
                    </FormField>
                    <FormField label="Port" className="w-20 shrink-0">
                      <Input tone={color} type="number" min={1} max={65535} value={String(agentPort)} onChange={(e) => setAgentPort(Number(e.target.value) || 5480)} placeholder="5480" />
                    </FormField>
                  </div>

                  {/* Script (Web only) */}
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
                        <CustomIcon icon={copied ? 'CheckCircle' : 'Copy'} size="xs" className={copied ? `text-emerald-400` : ''} />
                      </button>
                    </div>
                  )}

                  <ButtonSelector<ModuleId>
                    color={color}
                    options={MODULE_OPTIONS}
                    value={moduleStateToArray(modules)}
                    onChange={(v: ModuleId | ModuleId[]) => setModules(arrayToModuleState(v as ModuleId[]))}
                    label="Modules"
                    cols={2}
                  />
                </div>

                {deployError && <Alert variant="subtle" color="red" title="Deployment failed" description={deployError} />}

                <Button variant="solid" color={color} fullWidth disabled={!isValid} onClick={() => void handleDeploy()} trailingIcon="ArrowRight">
                  {inTauri ? 'Deploy' : "I've Run the Script — Start Waiting"}
                </Button>
              </>
            )}

            {/* ── waiting phase ────────────────────────────────────────────────── */}
            {phase === 'waiting' && (
              <>
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="flex flex-col items-center gap-3">
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
                </div>
                <Button variant="outline" color="slate" fullWidth onClick={handleCancel} leadingIcon="ArrowLeft">
                  Cancel
                </Button>
              </>
            )}

            {/* ── timeout phase ────────────────────────────────────────────────── */}
            {phase === 'timeout' && (
              <>
                <div className="flex flex-col items-center gap-4 py-6">
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
                <div className="flex flex-col gap-2">
                  <Button variant="solid" color={color} fullWidth onClick={handleRetry} trailingIcon="ArrowRight">
                    Retry
                  </Button>
                  <Button variant="outline" color="slate" fullWidth onClick={onBack}>
                    Back to Options
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
};
