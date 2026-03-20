import React, { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useNavigate } from 'react-router-dom';
import { ButtonSelector, type ButtonSelectorOption, CustomIcon, MultiToggle } from '@prl/ui-kit';
import { Alert, Button, FormField, Input, PasswordInput } from '../../controls';
import { useConfig } from '../../contexts/ConfigContext';
import { useSession } from '../../contexts/SessionContext';
import { authService } from '../../services/authService';
import type { HostConfig } from '../../interfaces/Host';
import { getPasswordKey, getApiKeyKey } from '../../utils/secretKeys';
import { decodeToken } from '../../utils/tokenUtils';
import { devopsService } from '../../services/devops';
import type { HostHardwareInfo } from '../../interfaces/devops';
import { getOS } from '@/utils/utils';
import {
  MODULE_OPTIONS, DEFAULT_MODULES, POLL_INTERVAL_MS, POLL_TIMEOUT_MS,
  buildLocalScript, moduleStateToArray, arrayToModuleState, formatCountdown, isTauri,
} from '../../pages/Onboarding/Panels/helpers';
import type { LocalRunMode, LocalSetupPhase, ModuleId, ModuleState } from '../../pages/Onboarding/Panels/types';

export interface LocalAgentFormProps {
  onBack: () => void;
  onContinue: (serverUrl: string) => void;
  fromLogin?: boolean;
  onConnected?: () => void;
}

export const LocalAgentForm: React.FC<LocalAgentFormProps> = ({ onBack, onContinue, fromLogin, onConnected }) => {
  const config = useConfig();
  const { setSession } = useSession();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [runMode, setRunMode] = useState<LocalRunMode>('docker');
  const [rootPassword, setRootPassword] = useState('');
  const [sudoPassword, setSudoPassword] = useState('');
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

  useEffect(() => { rootPasswordRef.current = rootPassword; }, [rootPassword]);
  useEffect(() => { portRef.current = port; }, [port]);

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
    if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current); pollIntervalRef.current = null; }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    if (countupRef.current) { clearInterval(countupRef.current); countupRef.current = null; }
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
      try { hardwareInfo = await devopsService.config.getHardwareInfo(hostname); } catch { /* non-fatal */ }

      const existingHosts = (await config.get<HostConfig[]>('hosts')) ?? [];
      const existingIndex = existingHosts.findIndex((h) => h.hostname === hostname);
      const willBeOnlyHost = !fromLogin && (existingIndex >= 0 ? existingHosts.length === 1 : existingHosts.length === 0);

      const hostEntry: HostConfig = {
        id: existingIndex >= 0 ? existingHosts[existingIndex].id : crypto.randomUUID(),
        name: displayName.trim() || undefined,
        hostname, baseUrl, authType: 'credentials', username: 'root', keepLoggedIn: true,
        lastUsed: new Date().toISOString(),
        isDefault: willBeOnlyHost ? true : existingIndex >= 0 ? existingHosts[existingIndex].isDefault : undefined,
        type: 'Orchestrator', hardwareInfo,
      };

      if (existingIndex >= 0) existingHosts[existingIndex] = hostEntry; else existingHosts.push(hostEntry);
      await config.set('hosts', existingHosts);
      await config.save();

      authService.currentHostname = hostname;
      const token = authService.getToken(hostname);
      const tokenPayload = token ? (decodeToken(token) ?? undefined) : undefined;

      setSession({ serverUrl: baseUrl, hostname, username: 'root', authType: 'credentials', hostId: hostEntry.id, connectedAt: new Date().toISOString(), tokenPayload, hardwareInfo });

      if (onConnected) onConnected(); else navigate('/', { replace: true });
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
    countupRef.current = setInterval(() => { setElapsedMs(Date.now() - startTime); }, 500);
    timeoutRef.current = setTimeout(() => { stopPolling(); setPhase('timeout'); }, POLL_TIMEOUT_MS);

    const poll = async () => {
      if (connectedRef.current) return;
      const agentUrl = `http://localhost:${portRef.current}`;
      try {
        await fetch(`${agentUrl}/api/v1/auth/token`, { method: 'HEAD', mode: 'no-cors' });
      } catch { return; }

      agentReadyRef.current = true;
      if (connectedRef.current) return;
      if (!rootPasswordRef.current) return;

      connectedRef.current = true;
      stopPolling();
      await autoLogin();
    };

    pollIntervalRef.current = setInterval(() => void poll(), POLL_INTERVAL_MS);
    void poll();
  };

  useEffect(() => { return () => stopPolling(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeploy = async () => {
    setDeployError(null);
    setPhase('waiting');
    if (isTauri()) {
      const enabledModuleIds = MODULE_OPTIONS.filter((m) => modules[m.value]).map((m) => m.value);
      try {
        await invoke('deploy_local_agent', { runMode, rootPassword, sudoPassword: sudoPassword || undefined, port, modules: enabledModuleIds });
      } catch (err) {
        setPhase('configure');
        setDeployError(err instanceof Error ? err.message : String(err));
        return;
      }
    }
    startPolling();
  };

  const handleRetry = () => { stopPolling(); setPhase('configure'); };
  const handleCancel = () => { stopPolling(); setPhase('configure'); };

  const inTauri = isTauri();

  if (phase === 'configure') {
    return (
      <div className="flex flex-col gap-3">
        <Button variant="clear" color="slate" size="xs" leadingIcon="ArrowLeft" onClick={onBack}>
          Back to options
        </Button>

        <FormField label="Display Name" width="full">
          <Input tone="emerald" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. My Local Agent (optional)" />
        </FormField>

        <MultiToggle
          fullWidth size="sm" color="emerald" variant="solid"
          value={runMode}
          onChange={(v) => {
            setRunMode(v as LocalRunMode);
            if (v === 'service') setModules({ ...modules, host: true });
          }}
          options={[
            { value: 'docker',  label: 'Docker',  icon: 'Docker'        },
            { value: 'podman',  label: 'Podman',  icon: 'PodmanDesktop' },
            { value: 'service', label: 'Service', icon: 'Script'        },
          ]}
        />

        <div className="flex gap-2">
          <FormField label="Root Password" className="flex-1 min-w-0">
            <PasswordInput tone="emerald" value={rootPassword} onChange={(e) => setRootPassword(e.target.value)} placeholder="Root password" autoComplete="new-password" />
          </FormField>
          <FormField label="Port" className="w-20 shrink-0">
            <Input tone="emerald" type="number" min={1} max={65535} value={String(port)} onChange={(e) => setPort(Number(e.target.value) || 5480)} placeholder="5480" />
          </FormField>
        </div>

        {runMode === 'service' && (
          <FormField label="Sudo Password" description="Required only if the account needs a password for sudo">
            <PasswordInput tone="emerald" value={sudoPassword} onChange={(e) => setSudoPassword(e.target.value)} placeholder="Leave empty if passwordless sudo" autoComplete="off" />
          </FormField>
        )}

        {!inTauri && (
          <div className="relative overflow-hidden rounded-xl bg-neutral-900 dark:bg-neutral-950 min-h-36">
            <div className="flex items-start gap-2 px-4 py-3 pr-10">
              <span className="mt-0.5 font-mono text-[11px] leading-relaxed text-emerald-400 select-none">$</span>
              <pre className="flex-1 overflow-x-auto font-mono text-[11px] leading-relaxed text-neutral-200 whitespace-pre-wrap break-all">{displayScript}</pre>
            </div>
            <button type="button" onClick={() => void handleCopy()} title="Copy command"
              className="absolute right-2 top-2 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200 transition-colors">
              <CustomIcon icon={copied ? 'CheckCircle' : 'Copy'} size="xs" className={copied ? 'text-emerald-400' : ''} />
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

        {deployError && <Alert variant="subtle" color="red" title="Deployment failed" description={deployError} />}

        <Button variant="solid" color="blue" fullWidth onClick={() => void handleDeploy()} trailingIcon="ArrowRight">
          {inTauri ? 'Deploy' : "I've Run the Script — Start Waiting"}
        </Button>
      </div>
    );
  }

  if (phase === 'waiting') {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center justify-center gap-3 py-8">
          <span className="relative flex h-5 w-5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-5 w-5 rounded-full bg-amber-400" />
          </span>
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Waiting for agent…</p>
          <p className="font-mono text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{formatCountdown(elapsedMs)}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Polling localhost:{port} every 5 seconds (max 5:00)</p>

          {!inTauri && (
            <div className="w-full relative overflow-hidden rounded-xl bg-neutral-900 dark:bg-neutral-950">
              <div className="flex items-start gap-2 px-4 py-3 pr-10">
                <span className="mt-0.5 font-mono text-[11px] leading-relaxed text-emerald-400 select-none">$</span>
                <pre className="flex-1 overflow-x-auto font-mono text-[11px] leading-relaxed text-neutral-200 whitespace-pre-wrap break-all">{displayScript}</pre>
              </div>
              <button type="button" onClick={() => void handleCopy()} title="Copy command"
                className="absolute right-2 top-2 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200 transition-colors">
                <CustomIcon icon={copied ? 'CheckCircle' : 'Copy'} size="xs" className={copied ? 'text-emerald-400' : ''} />
              </button>
            </div>
          )}
        </div>
        <Button variant="outline" color="slate" fullWidth onClick={handleCancel} leadingIcon="ArrowLeft">
          Cancel
        </Button>
      </div>
    );
  }

  // timeout phase
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center justify-center gap-3 py-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20">
          <CustomIcon icon="Warning" size="sm" className="text-red-500 dark:text-red-400" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Agent Not Detected</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">No response from localhost:{port} after 5 minutes.</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Button variant="solid" color="blue" fullWidth onClick={handleRetry} trailingIcon="ArrowRight">Retry</Button>
        <Button variant="outline" color="slate" fullWidth onClick={() => onContinue(`http://localhost:${port}`)}>Configure Manually</Button>
      </div>
    </div>
  );
};
