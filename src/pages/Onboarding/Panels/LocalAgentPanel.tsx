import React, { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useNavigate } from 'react-router-dom';
import { ButtonSelector, type ButtonSelectorOption, CustomIcon, MultiToggle } from '@prl/ui-kit';
import { Alert, Button, FormField, Input, Panel, PasswordInput, Toggle } from '../../../controls';
import { useConfig } from '../../../contexts/ConfigContext';
import { useSession } from '../../../contexts/SessionContext';
import { authService } from '../../../services/authService';
import type { HostConfig } from '../../../interfaces/Host';
import { getPasswordKey, getApiKeyKey } from '../../../utils/secretKeys';
import { decodeToken } from '../../../utils/tokenUtils';
import { devopsService } from '../../../services/devops';
import type { HostHardwareInfo } from '../../../interfaces/devops';
import { getOS } from '@/utils/utils';
import { OnboardingPanelBrand } from './OnboardingBrand';
import { MODULE_OPTIONS, DEFAULT_MODULES, POLL_INTERVAL_MS, POLL_TIMEOUT_MS, buildLocalScript, moduleStateToArray, arrayToModuleState, formatCountdown, isTauri } from './helpers';
import type { LocalRunMode, LocalSetupPhase, ModuleId, ModuleState } from './types';

export interface LocalAgentPanelProps {
  onBack: () => void;
  onContinue: (serverUrl: string) => void;
  fromLogin?: boolean;
  /** Called after a successful auto-login. Defaults to navigate('/') if omitted. */
  onConnected?: () => void;
}

export const LocalAgentPanel: React.FC<LocalAgentPanelProps> = ({ onBack, onContinue, fromLogin, onConnected }) => {
  const config = useConfig();
  const { setSession } = useSession();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [runMode, setRunMode] = useState<LocalRunMode>('docker');
  const [rootPassword, setRootPassword] = useState('');
  const [sudoPassword, setSudoPassword] = useState('');
  const [useDifferentSudo, setUseDifferentSudo] = useState(false);
  const [port, setPort] = useState(5480);
  const [modules, setModules] = useState<ModuleState>({ ...DEFAULT_MODULES });
  const [phase, setPhase] = useState<LocalSetupPhase>('configure');
  const [deployError, setDeployError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  const rootPasswordRef = useRef(rootPassword);
  const portRef = useRef(port);
  const connectedRef = useRef(false);
  const agentReadyRef = useRef(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countupRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    rootPasswordRef.current = rootPassword;
  }, [rootPassword]);
  useEffect(() => {
    portRef.current = port;
  }, [port]);

  // If agent came up before user finished typing the password,
  // trigger auto-login as soon as a non-empty password is provided
  useEffect(() => {
    if (!rootPassword || !agentReadyRef.current || connectedRef.current) return;
    connectedRef.current = true;
    stopPolling();
    void autoLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootPassword]);

  const displayScript = buildLocalScript(runMode, rootPassword ? '••••••••' : '', port, modules, sudoPassword ? '••••••••' : undefined);
  const copyScript = buildLocalScript(runMode, rootPassword, port, modules, sudoPassword || undefined);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyScript.replace(/\\\n\s+/g, ' '));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.warn('[LocalAgent] Clipboard copy failed');
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

  const autoLogin = async () => {
    const baseUrl = `http://localhost:${portRef.current}`;
    const hostname = 'localhost';
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
      const willBeOnlyHost = !fromLogin && (existingIndex >= 0 ? existingHosts.length === 1 : existingHosts.length === 0);

      const hostEntry: HostConfig = {
        id: existingIndex >= 0 ? existingHosts[existingIndex].id : crypto.randomUUID(),
        name: displayName.trim() || undefined,
        hostname,
        baseUrl,
        authType: 'credentials',
        username: 'root',
        keepLoggedIn: true,
        lastUsed: new Date().toISOString(),
        isDefault: willBeOnlyHost ? true : existingIndex >= 0 ? existingHosts[existingIndex].isDefault : undefined,
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
      console.warn('[LocalAgent] Auto-login failed — falling back to onContinue');
      onContinue(`http://localhost:${portRef.current}`);
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
      const agentUrl = `http://localhost:${portRef.current}`;
      try {
        await fetch(`${agentUrl}/api/v1/auth/token`, { method: 'HEAD', mode: 'no-cors' });
      } catch {
        return; // port not open yet
      }

      agentReadyRef.current = true;
      if (connectedRef.current) return;
      if (!rootPasswordRef.current) return; // wait for password entry

      connectedRef.current = true;
      stopPolling();
      await autoLogin();
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
        await invoke('deploy_local_agent', {
          runMode,
          rootPassword,
          sudoPassword: sudoPassword || undefined,
          port,
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

  return (
    <Panel maxWidth={650} variant="elevated" padding="none">
      <div className="flex min-h-90 screen">
        {/* Left: branding + context */}
        <div className="flex w-52 shrink-0 flex-col justify-between rounded-l-[inherit] bg-linear-to-br from-blue-50 to-indigo-50/70 p-5 dark:from-blue-950/60 dark:to-indigo-950/40">
          <div className="space-y-4">
            <OnboardingPanelBrand />
            <div>
              <h2 className="text-md pb-3 font-semibold text-neutral-800 dark:text-neutral-200">Install Locally</h2>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">Run a DevOps agent on this machine using Docker, Podman or a service script.</p>
            </div>
            <div className="space-y-2">
              {(
                [
                  { icon: 'Container', label: 'Run it in Docker or Podman' },
                  { icon: 'Script', label: `One-click script for ${getOS()}` },
                  { icon: 'Verified', label: 'Click deploy to start' },
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
        <div className="p-5 w-full">
          <div className="gap-4 min-w-0 h-full">
            {/* ── configure phase ──────────────────────────────────────────────── */}
            {phase === 'configure' && (
              <>
                <div className="space-y-4">
                  <FormField label="Display Name" width="full">
                    <Input tone="blue" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. My Local Agent (optional)" />
                  </FormField>

                  <MultiToggle
                    fullWidth
                    size="sm"
                    color="blue"
                    variant="solid"
                    value={runMode}
                    onChange={(v) => {
                      setRunMode(v as LocalRunMode);
                      if (v === 'service') setModules({ ...modules, host: true });
                    }}
                    options={[
                      { value: 'docker', label: 'Docker', icon: 'Docker' },
                      { value: 'podman', label: 'Podman', icon: 'PodmanDesktop' },
                      { value: 'service', label: 'Service', icon: 'Script' },
                    ]}
                  />

                  <div className="flex gap-2">
                    <FormField label="Root Password" className="flex-1 min-w-0">
                      <PasswordInput tone="blue" value={rootPassword} onChange={(e) => setRootPassword(e.target.value)} placeholder="Root password" autoComplete="new-password" />
                    </FormField>
                    <FormField label="Port" className="w-20 shrink-0">
                      <Input tone="blue" type="number" min={1} max={65535} value={String(port)} onChange={(e) => setPort(Number(e.target.value) || 5480)} placeholder="5480" />
                    </FormField>
                  </div>

                  {runMode === 'service' && (
                    <>
                      <Toggle
                        color="blue"
                        size="sm"
                        label="Use different password for sudo"
                        checked={useDifferentSudo}
                        onChange={(e) => {
                          setUseDifferentSudo(e.target.checked);
                          if (!e.target.checked) setSudoPassword('');
                        }}
                      />
                      {useDifferentSudo && (
                        <FormField label="Sudo Password">
                          <PasswordInput tone="blue" value={sudoPassword} onChange={(e) => setSudoPassword(e.target.value)} placeholder="Required for sudo operations" autoComplete="off" />
                        </FormField>
                      )}
                    </>
                  )}

                  {!inTauri && (
                    <div className="relative overflow-hidden rounded-xl bg-neutral-900 dark:bg-neutral-950 min-h-36">
                      <div className="flex items-start gap-2 px-4 py-3 pr-10">
                        <span className="mt-0.5 font-mono text-[11px] leading-relaxed text-blue-400 select-none">$</span>
                        <pre className="flex-1 overflow-x-auto font-mono text-[11px] leading-relaxed text-neutral-200 whitespace-pre-wrap break-all">{displayScript}</pre>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleCopy()}
                        title="Copy command"
                        className="absolute right-2 top-2 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200 transition-colors"
                      >
                        <CustomIcon icon={copied ? 'CheckCircle' : 'Copy'} size="xs" className={copied ? 'text-blue-400' : ''} />
                      </button>
                    </div>
                  )}

                  <ButtonSelector<ModuleId>
                    color="blue"
                    options={(MODULE_OPTIONS as ButtonSelectorOption<ModuleId>[]).map((o) => ({
                      value: o.value,
                      label: o.label,
                      description: o.description,
                      icon: o.icon,
                      disabled: o.value === 'host' && (getOS() !== 'macOS' || runMode !== 'service'),
                    }))}
                    value={moduleStateToArray(modules)}
                    onChange={(v: ModuleId | ModuleId[]) => setModules(arrayToModuleState(v as ModuleId[]))}
                    label="Modules"
                    cols={2}
                  />
                </div>

                {deployError && <Alert variant="subtle" color="red" title="Deployment failed" description={deployError} />}
                <div className="pt-4">
                  <Button variant="solid" color="blue" fullWidth onClick={() => void handleDeploy()} trailingIcon="ArrowRight">
                    {inTauri ? 'Deploy' : "I've Run the Script"}
                  </Button>
                </div>
              </>
            )}

            {/* ── waiting phase ────────────────────────────────────────────────── */}
            {phase == 'waiting' && (
              <div className="flex flex-col gap-4 h-full min-w-0">
                <div className="flex flex-col grow items-center gap-4 py-6">
                  <div className="flex flex-col items-center gap-3">
                    <span className="relative flex h-5 w-5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex h-5 w-5 rounded-full bg-amber-400" />
                    </span>
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Waiting for agent…</p>
                    <p className="font-mono text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{formatCountdown(elapsedMs)}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Polling localhost:{port} every 5 seconds (max 5:00)</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button variant="outline" color="rose" fullWidth onClick={handleCancel} leadingIcon="ArrowLeft">
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* ── timeout phase ────────────────────────────────────────────────── */}
            {phase === 'timeout' && (
              <div className="h-full min-w-0 flex flex-col">
                <div className="flex flex-col flex-1 grow items-center gap-4 py-10 ">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20">
                    <CustomIcon icon="Warning" size="sm" className="text-red-500 dark:text-red-400" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Agent Not Detected</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">No response from localhost:{port} after 5 minutes.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button variant="solid" color="blue" fullWidth onClick={handleRetry} trailingIcon="ArrowRight">
                    Retry
                  </Button>
                  <Button variant="outline" color="slate" fullWidth onClick={() => onContinue(`http://localhost:${port}`)}>
                    Configure Manually
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
};
