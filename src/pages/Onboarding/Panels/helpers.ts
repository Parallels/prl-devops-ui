import type { ButtonSelectorOption } from '@prl/ui-kit';
import type { LocalRunMode, LoginErrorResult, ModuleId, ModuleState, SshAuthMethod } from './types';

export const MODULE_OPTIONS: ButtonSelectorOption<ModuleId>[] = [
  { value: 'host',          label: 'Host',          description: 'VM & host management',   icon: 'Host'         },
  { value: 'catalog',       label: 'Catalog',       description: 'VM image catalog',        icon: 'Library'      },
  { value: 'orchestrator',  label: 'Orchestrator',  description: 'Cluster orchestration',   icon: 'Container'    },
  { value: 'reverse-proxy', label: 'Reverse Proxy', description: 'HTTP / TCP routing',      icon: 'ReverseProxy' },
];

export const DEFAULT_MODULES: ModuleState = {
  host: false,
  catalog: false,
  orchestrator: false,
  'reverse-proxy': true,
  cors: true,
};

export const POLL_INTERVAL_MS = 5_000;
export const POLL_TIMEOUT_MS  = 300_000; // 5 min

// cors is always enabled for local setup and intentionally excluded from UI selection
export const moduleStateToArray = (m: ModuleState): ModuleId[] =>
  (Object.keys(m) as ModuleId[]).filter((k) => k !== 'cors' && m[k]);

export const arrayToModuleState = (arr: ModuleId[]): ModuleState => ({
  host:           arr.includes('host'),
  catalog:        arr.includes('catalog'),
  orchestrator:   arr.includes('orchestrator'),
  'reverse-proxy': arr.includes('reverse-proxy'),
  cors: true,
});

export const buildLocalScript = (
  runMode: LocalRunMode,
  rootPassword: string,
  port: number,
  modules: ModuleState,
  sudoPassword?: string,
): string => {
  modules.cors = true;
  let enabledModules = MODULE_OPTIONS.filter((m) => modules[m.value]).map((m) => m.value).join(',');
  enabledModules += enabledModules ? ',cors' : 'cors';
  const password = rootPassword || '<password>';

  if (runMode === 'docker') {
    const modulesLine = enabledModules ? `\\\n  -e ENABLED_MODULES=${enabledModules} ` : '';
    return `docker run -d --name prl-devops-agent \\\n  -p ${port}:3080 \\\n  -e ROOT_PASSWORD=${password} ${modulesLine}\\\n  ghcr.io/parallels/prl-devops-service:latest`;
  }

  if (runMode === 'podman') {
    const modulesLine = enabledModules ? `\\\n  -e ENABLED_MODULES=${enabledModules} ` : '';
    return `podman run -d --name prl-devops-agent \\\n  -p ${port}:3080 \\\n  -e ROOT_PASSWORD=${password} ${modulesLine}\\\n  ghcr.io/parallels/prl-devops-service:latest`;
  }

  const modulesFlag  = enabledModules ? ` \\\n  --modules ${enabledModules}` : '';
  const sudoPrefix   = sudoPassword ? `echo ${sudoPassword} | sudo -S ` : 'sudo ';
  return `curl -sSL https://raw.githubusercontent.com/Parallels/prl-devops-service/main/scripts/install.sh | ${sudoPrefix}bash -s -- \\\n  --install \\\n  --root-password ${password} \\\n  --api-port ${port}${modulesFlag}`;
};

export const buildSshScript = (
  serverIp: string,
  sshPort: string,
  sshAuth: SshAuthMethod,
  sshUsername: string,
  sshCredential: string,
  sudoPassword: string,
  rootPassword: string,
  agentPort: number,
  modules: ModuleState,
): string => {
  let enabledModules = MODULE_OPTIONS.filter((m) => modules[m.value]).map((m) => m.value).join(',');
  enabledModules += enabledModules ? ',cors' : 'cors';
  const credFlag   = sshAuth === 'password'
    ? `--ssh-password ${sshCredential || '<ssh-password>'}`
    : `--ssh-key ${sshCredential || '<ssh-key>'}`;
  const sudoFlag   = sudoPassword ? ` \\\n  --sudo-password ${sudoPassword}` : '';
  const modulesFlag = enabledModules ? ` \\\n  --modules ${enabledModules}` : '';
  return `curl -sSL https://raw.githubusercontent.com/Parallels/prl-devops-service/main/scripts/ssh_install.sh | bash -s -- \\\n  --ssh-host ${serverIp || '<server-ip>'} \\\n  --ssh-port ${sshPort || '22'} \\\n  --ssh-user ${sshUsername || '<username>'} \\\n  ${credFlag} \\\n  --root-password ${rootPassword || '<password>'} \\\n  --api-port ${agentPort}${sudoFlag}${modulesFlag}`;
};

export const formatCountdown = (elapsedMs: number): string => {
  const totalSec = Math.floor(elapsedMs / 1000);
  const mm = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const ss = (totalSec % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
};

export const isTauri = (): boolean => '__TAURI_INTERNALS__' in window;

export const friendlyLoginError = (error: unknown, targetUrl?: string): LoginErrorResult => {
  const apiErr  = error as { message?: string; statusCode?: number };
  const status  = apiErr?.statusCode;
  const rawMsg  = apiErr?.message ?? (error instanceof Error ? error.message : String(error));
  const rawLower = rawMsg.toLowerCase();

  if (status === 401) return { title: 'Authentication Failed',  message: 'Invalid credentials. Please check your username and password.', details: 'HTTP 401 Unauthorized' };
  if (status === 403) return { title: 'Access Denied',          message: 'Your account does not have permission to sign in.',              details: 'HTTP 403 Forbidden'    };
  if (status === 404) return { title: 'Endpoint Not Found',     message: 'The authentication endpoint was not found. Please verify the server URL is correct.', details: 'HTTP 404 Not Found' };
  if (status && status >= 500) return { title: 'Server Error',  message: `The server is currently unavailable or encountered an internal error.`, details: `HTTP ${status}` };

  const isNetworkError =
    !status &&
    (rawLower.includes('load failed') || rawLower.includes('failed to fetch') ||
     rawLower.includes('network request failed') || rawLower.includes('network error') ||
     rawLower.includes('networkerror'));
  if (isNetworkError && !import.meta.env.DEV && typeof window !== 'undefined' && window.location.protocol === 'https:' && targetUrl?.toLowerCase().startsWith('http:')) {
    return { title: 'Mixed Content Blocked', message: 'Your browser blocked the connection because this app is running over HTTPS but the server URL uses HTTP.' };
  }
  if (isNetworkError) return { title: 'Cannot Reach Server',       message: 'Could not connect to the server. Please check the URL, verify the server is running, and check your network.' };
  if (rawLower.includes('timeout') || rawLower.includes('timed out')) return { title: 'Connection Timed Out', message: 'The server did not respond in time.' };
  if (rawLower.includes('certificate') || rawLower.includes('ssl') || rawLower.includes('tls'))
    return { title: 'SSL / Certificate Error', message: 'A certificate error occurred. The server may be using a self-signed or expired certificate.', details: rawMsg };

  return { title: 'Connection Failed', message: rawMsg || 'An unexpected error occurred. Please try again.' };
};
