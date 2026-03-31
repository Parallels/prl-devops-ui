import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useConfig } from '@/contexts/ConfigContext';
import { useSession } from '@/contexts/SessionContext';
import { useEventsHub } from '@/contexts/EventsHubContext';
import { HostConfig } from '@/interfaces/Host';
import { WebSocketState } from '@/types/WebSocket';
import { authService } from '@/services/authService';
import { getPasswordKey, getApiKeyKey } from '@/utils/secretKeys';
import { decodeToken } from '@/utils/tokenUtils';
import { devopsService } from '@/services/devops';
import { UIModalConfirm } from '../../controls';
import { AddHostModal } from './AddHostModal';
import { EditHostModal } from './EditHostModal';
import { HostLoginModal } from './HostLoginModal';
import { ArrowDown, Button, IconButton, Loader, Star, ThemeColor } from '@prl/ui-kit';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';

// ─── Theme color ─────────────────────────────────────────────────────────────

export type SwitcherColor = ThemeColor;

const COLOR_CLASSES: Record<
  SwitcherColor,
  {
    focusRing: string;
    activeRow: string;
    hoverRow: string;
    activeLabel: string;
    activeBadge: string;
  }
> = {
  parallels: {
    focusRing: 'focus-visible:ring-red-500',
    activeRow: 'bg-red-50 dark:bg-red-900/20',
    hoverRow: 'hover:bg-red-100 dark:hover:bg-red-900/20',
    activeLabel: 'text-red-700 dark:text-red-300',
    activeBadge: 'bg-red-100 text-red-600 dark:bg-red-800/60 dark:text-red-300',
  },
  brand: {
    focusRing: 'focus-visible:ring-red-500',
    activeRow: 'bg-red-50 dark:bg-red-900/20',
    hoverRow: 'hover:bg-red-100 dark:hover:bg-red-900/20',
    activeLabel: 'text-red-700 dark:text-red-300',
    activeBadge: 'bg-red-100 text-red-600 dark:bg-red-800/60 dark:text-red-300',
  },
  red: {
    focusRing: 'focus-visible:ring-red-500',
    activeRow: 'bg-red-50 dark:bg-red-900/20',
    hoverRow: 'hover:bg-red-100 dark:hover:bg-red-900/20',
    activeLabel: 'text-red-700 dark:text-red-300',
    activeBadge: 'bg-red-100 text-red-600 dark:bg-red-800/60 dark:text-red-300',
  },
  orange: {
    focusRing: 'focus-visible:ring-orange-500',
    activeRow: 'bg-orange-50 dark:bg-orange-900/20',
    hoverRow: 'hover:bg-orange-100 dark:hover:bg-orange-900/20',
    activeLabel: 'text-orange-700 dark:text-orange-300',
    activeBadge: 'bg-orange-100 text-orange-600 dark:bg-orange-800/60 dark:text-orange-300',
  },
  amber: {
    focusRing: 'focus-visible:ring-amber-500',
    activeRow: 'bg-amber-50 dark:bg-amber-900/20',
    hoverRow: 'hover:bg-amber-100 dark:hover:bg-amber-900/20',
    activeLabel: 'text-amber-700 dark:text-amber-300',
    activeBadge: 'bg-amber-100 text-amber-600 dark:bg-amber-800/60 dark:text-amber-300',
  },
  yellow: {
    focusRing: 'focus-visible:ring-yellow-500',
    activeRow: 'bg-yellow-50 dark:bg-yellow-900/20',
    hoverRow: 'hover:bg-yellow-100 dark:hover:bg-yellow-900/20',
    activeLabel: 'text-yellow-700 dark:text-yellow-300',
    activeBadge: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-800/60 dark:text-yellow-300',
  },
  lime: {
    focusRing: 'focus-visible:ring-lime-500',
    activeRow: 'bg-lime-50 dark:bg-lime-900/20',
    hoverRow: 'hover:bg-lime-100 dark:hover:bg-lime-900/20',
    activeLabel: 'text-lime-700 dark:text-lime-300',
    activeBadge: 'bg-lime-100 text-lime-600 dark:bg-lime-800/60 dark:text-lime-300',
  },
  green: {
    focusRing: 'focus-visible:ring-green-500',
    activeRow: 'bg-green-50 dark:bg-green-900/20',
    hoverRow: 'hover:bg-green-100 dark:hover:bg-green-900/20',
    activeLabel: 'text-green-700 dark:text-green-300',
    activeBadge: 'bg-green-100 text-green-600 dark:bg-green-800/60 dark:text-green-300',
  },
  emerald: {
    focusRing: 'focus-visible:ring-emerald-500',
    activeRow: 'bg-emerald-50 dark:bg-emerald-900/20',
    hoverRow: 'hover:bg-emerald-100 dark:hover:bg-emerald-900/20',
    activeLabel: 'text-emerald-700 dark:text-emerald-300',
    activeBadge: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-800/60 dark:text-emerald-300',
  },
  teal: {
    focusRing: 'focus-visible:ring-teal-500',
    activeRow: 'bg-teal-50 dark:bg-teal-900/20',
    hoverRow: 'hover:bg-teal-100 dark:hover:bg-teal-900/20',
    activeLabel: 'text-teal-700 dark:text-teal-300',
    activeBadge: 'bg-teal-100 text-teal-600 dark:bg-teal-800/60 dark:text-teal-300',
  },
  cyan: {
    focusRing: 'focus-visible:ring-cyan-500',
    activeRow: 'bg-cyan-50 dark:bg-cyan-900/20',
    hoverRow: 'hover:bg-cyan-100 dark:hover:bg-cyan-900/20',
    activeLabel: 'text-cyan-700 dark:text-cyan-300',
    activeBadge: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-800/60 dark:text-cyan-300',
  },
  sky: {
    focusRing: 'focus-visible:ring-sky-500',
    activeRow: 'bg-sky-50 dark:bg-sky-900/20',
    hoverRow: 'hover:bg-sky-100 dark:hover:bg-sky-900/20',
    activeLabel: 'text-sky-700 dark:text-sky-300',
    activeBadge: 'bg-sky-100 text-sky-600 dark:bg-sky-800/60 dark:text-sky-300',
  },
  blue: {
    focusRing: 'focus-visible:ring-blue-500',
    activeRow: 'bg-blue-50 dark:bg-blue-900/20',
    hoverRow: 'hover:bg-blue-100 dark:hover:bg-blue-900/20',
    activeLabel: 'text-blue-700 dark:text-blue-300',
    activeBadge: 'bg-blue-100 text-blue-600 dark:bg-blue-800/60 dark:text-blue-300',
  },
  indigo: {
    focusRing: 'focus-visible:ring-indigo-500',
    activeRow: 'bg-indigo-50 dark:bg-indigo-900/20',
    hoverRow: 'hover:bg-indigo-100 dark:hover:bg-indigo-900/20',
    activeLabel: 'text-indigo-700 dark:text-indigo-300',
    activeBadge: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-800/60 dark:text-indigo-300',
  },
  violet: {
    focusRing: 'focus-visible:ring-violet-500',
    activeRow: 'bg-violet-50 dark:bg-violet-900/20',
    hoverRow: 'hover:bg-violet-100 dark:hover:bg-violet-900/20',
    activeLabel: 'text-violet-700 dark:text-violet-300',
    activeBadge: 'bg-violet-100 text-violet-600 dark:bg-violet-800/60 dark:text-violet-300',
  },
  purple: {
    focusRing: 'focus-visible:ring-purple-500',
    activeRow: 'bg-purple-50 dark:bg-purple-900/20',
    hoverRow: 'hover:bg-purple-100 dark:hover:bg-purple-900/20',
    activeLabel: 'text-purple-700 dark:text-purple-300',
    activeBadge: 'bg-purple-100 text-purple-600 dark:bg-purple-800/60 dark:text-purple-300',
  },
  fuchsia: {
    focusRing: 'focus-visible:ring-fuchsia-500',
    activeRow: 'bg-fuchsia-50 dark:bg-fuchsia-900/20',
    hoverRow: 'hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/20',
    activeLabel: 'text-fuchsia-700 dark:text-fuchsia-300',
    activeBadge: 'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-800/60 dark:text-fuchsia-300',
  },
  pink: {
    focusRing: 'focus-visible:ring-pink-500',
    activeRow: 'bg-pink-50 dark:bg-pink-900/20',
    hoverRow: 'hover:bg-pink-100 dark:hover:bg-pink-900/20',
    activeLabel: 'text-pink-700 dark:text-pink-300',
    activeBadge: 'bg-pink-100 text-pink-600 dark:bg-pink-800/60 dark:text-pink-300',
  },
  rose: {
    focusRing: 'focus-visible:ring-rose-500',
    activeRow: 'bg-rose-50 dark:bg-rose-900/20',
    hoverRow: 'hover:bg-rose-100 dark:hover:bg-rose-900/20',
    activeLabel: 'text-rose-700 dark:text-rose-300',
    activeBadge: 'bg-rose-100 text-rose-600 dark:bg-rose-800/60 dark:text-rose-300',
  },
  slate: {
    focusRing: 'focus-visible:ring-slate-500',
    activeRow: 'bg-slate-50 dark:bg-slate-900/20',
    hoverRow: 'hover:bg-slate-100 dark:hover:bg-slate-900/20',
    activeLabel: 'text-slate-700 dark:text-slate-300',
    activeBadge: 'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300',
  },
  gray: {
    focusRing: 'focus-visible:ring-gray-500',
    activeRow: 'bg-gray-50 dark:bg-gray-900/20',
    hoverRow: 'hover:bg-gray-100 dark:hover:bg-gray-900/20',
    activeLabel: 'text-gray-700 dark:text-gray-300',
    activeBadge: 'bg-gray-100 text-gray-600 dark:bg-gray-800/60 dark:text-gray-300',
  },
  zinc: {
    focusRing: 'focus-visible:ring-zinc-500',
    activeRow: 'bg-zinc-50 dark:bg-zinc-900/20',
    hoverRow: 'hover:bg-zinc-100 dark:hover:bg-zinc-900/20',
    activeLabel: 'text-zinc-700 dark:text-zinc-300',
    activeBadge: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-300',
  },
  neutral: {
    focusRing: 'focus-visible:ring-neutral-500',
    activeRow: 'bg-neutral-50 dark:bg-neutral-900/20',
    hoverRow: 'hover:bg-neutral-100 dark:hover:bg-neutral-900/20',
    activeLabel: 'text-neutral-700 dark:text-neutral-300',
    activeBadge: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800/60 dark:text-neutral-300',
  },
  stone: {
    focusRing: 'focus-visible:ring-stone-500',
    activeRow: 'bg-stone-50 dark:bg-stone-900/20',
    hoverRow: 'hover:bg-stone-100 dark:hover:bg-stone-900/20',
    activeLabel: 'text-stone-700 dark:text-stone-300',
    activeBadge: 'bg-stone-100 text-stone-600 dark:bg-stone-800/60 dark:text-stone-300',
  },
  white: {
    focusRing: 'focus-visible:ring-white',
    activeRow: 'bg-white dark:bg-white/10',
    hoverRow: 'hover:bg-white dark:hover:bg-white/10',
    activeLabel: 'text-gray-900 dark:text-white',
    activeBadge: 'bg-gray-200 text-gray-800 dark:bg-white/80 dark:text-gray-900',
  },
  info: {
    focusRing: 'focus-visible:ring-cyan-500',
    activeRow: 'bg-cyan-50 dark:bg-cyan-900/20',
    hoverRow: 'hover:bg-cyan-100 dark:hover:bg-cyan-900/20',
    activeLabel: 'text-cyan-700 dark:text-cyan-300',
    activeBadge: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-800/60 dark:text-cyan-300',
  },
  success: {
    focusRing: 'focus-visible:ring-green-500',
    activeRow: 'bg-green-50 dark:bg-green-900/20',
    hoverRow: 'hover:bg-green-100 dark:hover:bg-green-900/20',
    activeLabel: 'text-green-700 dark:text-green-300',
    activeBadge: 'bg-green-100 text-green-600 dark:bg-green-800/60 dark:text-green-300',
  },
  warning: {
    focusRing: 'focus-visible:ring-yellow-500',
    activeRow: 'bg-yellow-50 dark:bg-yellow-900/20',
    hoverRow: 'hover:bg-yellow-100 dark:hover:bg-yellow-900/20',
    activeLabel: 'text-yellow-700 dark:text-yellow-300',
    activeBadge: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-800/60 dark:text-yellow-300',
  },
  danger: {
    focusRing: 'focus-visible:ring-red-500',
    activeRow: 'bg-red-50 dark:bg-red-900/20',
    hoverRow: 'hover:bg-red-100 dark:hover:bg-red-900/20',
    activeLabel: 'text-red-700 dark:text-red-300',
    activeBadge: 'bg-red-100 text-red-600 dark:bg-red-800/60 dark:text-red-300',
  },
  theme: {
    focusRing: 'focus-visible:ring-theme-500',
    activeRow: 'bg-theme-50 dark:bg-theme-900/20',
    hoverRow: 'hover:bg-theme-100 dark:hover:bg-theme-900/20',
    activeLabel: 'text-theme-700 dark:text-theme-300',
    activeBadge: 'bg-theme-100 text-theme-600 dark:bg-theme-800/60 dark:text-theme-300',
  },
};

// ─── Inline icons ────────────────────────────────────────────────────────────

const StarOutlineIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

// ─── Host health check hook ───────────────────────────────────────────────────
type HostHealth = 'online' | 'offline' | 'unknown';

function useHostHealthCheck(hosts: HostConfig[], currentHostId: string | undefined, wsConnectionState: WebSocketState): { healthMap: Record<string, HostHealth>; checkNow: () => void } {
  const [healthMap, setHealthMap] = useState<Record<string, HostHealth>>({});

  const checkInactiveHosts = useCallback(async () => {
    const inactive = hosts.filter((h) => h.id !== currentHostId);
    if (inactive.length === 0) return;

    const checks = inactive.map(async (host) => {
      try {
        const base = host.baseUrl.replace(/\/$/, '');
        await fetch(`${base}/api/health/probe`, {
          signal: AbortSignal.timeout(2000),
          method: 'GET',
        });
        return { id: host.id, health: 'online' as const };
      } catch {
        return { id: host.id, health: 'offline' as const };
      }
    });

    const results = await Promise.allSettled(checks);
    setHealthMap((prev) => {
      const next = { ...prev };
      for (const r of results) {
        if (r.status === 'fulfilled') {
          next[r.value.id] = r.value.health;
        }
      }
      return next;
    });
  }, [hosts, currentHostId]);

  // Active host health derived from WS connection state — no HTTP ping needed
  useEffect(() => {
    if (!currentHostId) return;
    const health: HostHealth = wsConnectionState === WebSocketState.OPEN ? 'online' : wsConnectionState === WebSocketState.CONNECTING ? 'unknown' : 'offline';
    setHealthMap((prev) => ({ ...prev, [currentHostId]: health }));
  }, [currentHostId, wsConnectionState]);

  // Check inactive hosts whenever the list or active host changes
  useEffect(() => {
    void checkInactiveHosts();
  }, [checkInactiveHosts]);

  // Poll every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => void checkInactiveHosts(), 30_000);
    return () => clearInterval(timer);
  }, [checkInactiveHosts]);

  return { healthMap, checkNow: checkInactiveHosts };
}

// ─── Component ───────────────────────────────────────────────────────────────

export interface HostSwitcherProps {
  color?: SwitcherColor;
}

export const HostSwitcher: React.FC<HostSwitcherProps> = ({ color = 'blue' }) => {
  const cls = COLOR_CLASSES[color];
  const config = useConfig();
  const { session, setSession } = useSession();
  const { connectionState } = useEventsHub();
  const [isOpen, setIsOpen] = useState(false);
  const [hosts, setHosts] = useState<HostConfig[]>([]);
  const [switchingHostId, setSwitchingHostId] = useState<string | null>(null);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [loginHost, setLoginHost] = useState<HostConfig | null>(null);
  const [editingHost, setEditingHost] = useState<HostConfig | null>(null);
  const [deletingHost, setDeletingHost] = useState<HostConfig | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { healthMap, checkNow } = useHostHealthCheck(hosts, session?.hostId, connectionState);
  const { themeColor } = useSystemSettings();
  const [hoveredID, setHoveredID] = useState<string | null>(null);

  const loadHosts = useCallback(async () => {
    const all = (await config.get<HostConfig[]>('hosts')) ?? [];
    setHosts(all);
  }, [config]);

  useEffect(() => {
    void loadHosts();
  }, [loadHosts]);

  // Close dropdown on outside click
  useClickOutside(containerRef, () => { setIsOpen(false); setSwitchError(null); }, isOpen);

  // ── Derived display values ─────────────────────────────────────────────────
  const currentHost = hosts.find((h) => h.id === session?.hostId);
  const displayName = currentHost?.name || currentHost?.hostname || session?.serverUrl || 'No Connection';
  const isConnected = !!session;

  // Sorted: current first, then others by most recently used
  const sortedHosts = [...(currentHost ? [currentHost] : []), ...hosts.filter((h) => h.id !== session?.hostId).sort((a, b) => (b.lastUsed ?? '').localeCompare(a.lastUsed ?? ''))];

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleToggleOpen = () => {
    setSwitchError(null);
    if (!isOpen) {
      void loadHosts();
      void checkNow();
    }
    setIsOpen((prev) => !prev);
  };

  const handleSetDefault = async (e: React.MouseEvent, hostId: string) => {
    e.stopPropagation();
    const updated = hosts.map((h) => ({ ...h, isDefault: h.id === hostId }));
    await config.set('hosts', updated);
    await config.save();
    setHosts(updated);
  };

  const confirmRemoveHost = async (hostToRemove: HostConfig) => {
    setDeletingHost(null);

    // Clear stored secrets for this host
    await config.removeSecret(getPasswordKey(hostToRemove.hostname));
    await config.removeSecret(getApiKeyKey(hostToRemove.hostname));
    await config.flushSecrets();

    // Remove from the list; if it was the default, promote the first remaining host
    const updated = hosts.filter((h) => h.id !== hostToRemove.id);
    if (hostToRemove.isDefault && updated.length > 0) {
      updated[0] = { ...updated[0], isDefault: true };
    }

    await config.set('hosts', updated);
    await config.save();
    setHosts(updated);
  };

  const connectToHost = async (host: HostConfig, credentials: { username: string; password: string; apiKey: string }, keepLoggedInOverride?: boolean) => {
    authService.setCredentials(host.hostname, {
      url: host.baseUrl,
      username: host.authType === 'credentials' ? credentials.username : '',
      password: host.authType === 'credentials' ? credentials.password : '',
      email: host.authType === 'credentials' ? credentials.username : '',
      api_key: host.authType === 'api_key' ? credentials.apiKey : '',
    });

    await authService.forceReauth(host.hostname);

    // Persist manually-entered credentials only when user explicitly chooses.
    if (keepLoggedInOverride !== undefined) {
      if (keepLoggedInOverride) {
        if (host.authType === 'credentials') {
          await config.setSecret(getPasswordKey(host.hostname), credentials.password);
          await config.removeSecret(getApiKeyKey(host.hostname));
        } else {
          await config.setSecret(getApiKeyKey(host.hostname), credentials.apiKey);
          await config.removeSecret(getPasswordKey(host.hostname));
        }
      } else {
        await config.removeSecret(getPasswordKey(host.hostname));
        await config.removeSecret(getApiKeyKey(host.hostname));
      }
      await config.flushSecrets();
    }

    // Update host metadata and mark this as recently used
    const nowIso = new Date().toISOString();
    const updatedHosts = hosts.map((h) =>
      h.id === host.id
        ? {
            ...h,
            username: h.authType === 'credentials' ? credentials.username : h.username,
            keepLoggedIn: keepLoggedInOverride ?? h.keepLoggedIn,
            lastUsed: nowIso,
          }
        : h,
    );
    await config.set('hosts', updatedHosts);
    await config.save();
    setHosts(updatedHosts);

    // Fetch fresh hardware info, fall back to cached
    let hardwareInfo = host.hardwareInfo;
    try {
      hardwareInfo = await devopsService.config.getHardwareInfo(host.hostname);
    } catch {
      /* use cached */
    }

    authService.currentHostname = host.hostname;
    const token = authService.getToken(host.hostname);
    const tokenPayload = token ? (decodeToken(token) ?? undefined) : undefined;

    setSession({
      serverUrl: host.baseUrl,
      hostname: host.hostname,
      username: host.authType === 'credentials' ? credentials.username : '',
      authType: host.authType,
      hostId: host.id,
      connectedAt: new Date().toISOString(),
      tokenPayload,
      hardwareInfo,
    });
  };

  const handleSwitchHost = async (host: HostConfig) => {
    if (host.id === session?.hostId || switchingHostId) return;

    setSwitchingHostId(host.id);
    setSwitchError(null);

    try {
      // Read stored credentials
      let storedPassword = '';
      let storedApiKey = '';
      if (host.authType === 'credentials') {
        storedPassword = (await config.getSecret(getPasswordKey(host.hostname))) ?? '';
      } else {
        storedApiKey = (await config.getSecret(getApiKeyKey(host.hostname))) ?? '';
      }

      const hasStoredSecret = host.authType === 'credentials' ? Boolean(storedPassword) : Boolean(storedApiKey);

      if (!hasStoredSecret) {
        setLoginHost(host);
        return;
      }

      await connectToHost(host, {
        username: host.username,
        password: storedPassword,
        apiKey: storedApiKey,
      });

      setIsOpen(false);
    } catch (error) {
      setSwitchError(`Failed to connect: ${(error as Error)?.message ?? 'Unknown error'}`);
    } finally {
      setSwitchingHostId(null);
    }
  };

  const handleLoginSubmit = async (credentials: { username: string; password: string; apiKey: string }, keepLoggedIn: boolean) => {
    if (!loginHost) return;
    // throws on error — HostLoginModal catches and displays it
    await connectToHost(loginHost, credentials, keepLoggedIn);
    setLoginHost(null);
    setIsOpen(false);
  };

  const handleAddSuccess = () => {
    void loadHosts();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div ref={containerRef} className="relative">
        {/* Trigger */}
        <button
          onClick={handleToggleOpen}
          className={`flex items-center gap-2 rounded-md px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-600 dark:hover:bg-neutral-500 transition-colors focus:outline-none focus-visible:ring-2 ${cls.focusRing}`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${
              healthMap[session?.hostId ?? ''] === 'online' ? 'bg-green-500' : healthMap[session?.hostId ?? ''] === 'offline' ? 'bg-red-500' : isConnected ? 'bg-green-500' : 'bg-gray-400'
            }`}
          />
          <span className="max-w-55 truncate text-sm font-medium text-gray-700 dark:text-gray-200" title={session?.serverUrl}>
            {displayName}
          </span>
          <ArrowDown className="w-5" />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute left-0 top-full z-200 mt-2 w-84 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-800">
            {/* Header */}
            <div className="border-b border-neutral-100 px-4 py-2.5 dark:border-neutral-700">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">Hosts</span>
            </div>

            {/* Error banner */}
            {switchError && (
              <div className="border-b border-red-100 bg-red-50 px-4 py-2.5 dark:border-red-800/40 dark:bg-red-900/20">
                <p className="text-xs text-red-600 dark:text-red-400">{switchError}</p>
              </div>
            )}

            {/* Host list */}
            <ul className="max-h-60 overflow-y-auto py-1" role="listbox">
              {sortedHosts.length === 0 && <li className="px-4 py-4 text-center text-sm text-neutral-400">No hosts configured</li>}

              {sortedHosts.map((host) => {
                const isCurrent = host.id === session?.hostId;
                const isSwitching = switchingHostId === host.id;
                const hostLabel = host.name || host.hostname;

                return (
                  <React.Fragment key={host.id}>
                    <li
                      role="option"
                      aria-selected={isCurrent}
                      onClick={() => !isCurrent && !isSwitching && void handleSwitchHost(host)}
                      onMouseEnter={() => {
                        setHoveredID(host.id);
                      }}
                      onMouseLeave={() => {
                        setHoveredID(null);
                      }}
                      className={[
                        'group flex cursor-pointer select-none items-center gap-3 px-4 py-3 transition-colors',
                        isCurrent ? cls.activeRow : cls.hoverRow,
                        isSwitching && 'pointer-events-none opacity-60',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {/* Connection status dot */}
                      <span
                        className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                          healthMap[host.id] === 'online' ? 'bg-green-500' : healthMap[host.id] === 'offline' ? 'bg-red-500' : 'bg-neutral-300 dark:bg-neutral-600'
                        }`}
                      />

                      {/* Host info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`truncate text-sm font-medium ${isCurrent ? cls.activeLabel : 'text-neutral-800 dark:text-neutral-200'}`}>{hostLabel}</span>
                          {isCurrent && <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${cls.activeBadge}`}>active</span>}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-neutral-400 dark:text-neutral-500">
                          {host.baseUrl}
                          <span className="ml-2 text-neutral-300 dark:text-neutral-600">·</span>
                          <span className="ml-1">{host.type}</span>
                        </p>
                      </div>

                      {/* Right-side actions */}
                      <div className="flex shrink items-center gap-1.5">
                        {isSwitching && <Loader color={themeColor} size="sm" />}

                        {/* Default star */}
                        <IconButton
                          onClick={(e) => void handleSetDefault(e, host.id)}
                          title={host.isDefault ? 'Default host — auto-connects on startup' : 'Set as default'}
                          aria-label={host.isDefault ? 'Default host' : 'Set as default'}
                          icon={host.isDefault ? <Star /> : <StarOutlineIcon />}
                          variant="ghost"
                          size="xs"
                          color={host.isDefault ? 'amber' : 'neutral'}
                        />

                        {hoveredID === host.id && (
                          <>
                            {/* Edit host */}
                            {!isSwitching && (
                              <>
                                <IconButton
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingHost(host);
                                    setIsOpen(false);
                                  }}
                                  variant="ghost"
                                  size="xs"
                                  title="Edit host"
                                  aria-label="Edit host"
                                  icon="Edit"
                                  color={themeColor}
                                />

                                {/* Remove host — hidden until row hover, disabled for active host */}
                                {!isCurrent && (
                                  <IconButton
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeletingHost(host);
                                    }}
                                    variant="ghost"
                                    size="xs"
                                    icon="Trash"
                                    title="Remove host"
                                    aria-label="Remove host"
                                    color="rose"
                                  />
                                )}
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </li>
                  </React.Fragment>
                );
              })}
            </ul>

            {/* Footer — Add new host */}
            <div className="border-t border-neutral-100 p-2 dark:border-neutral-700">
              <Button
                onClick={() => {
                  setIsOpen(false);
                  setIsAddModalOpen(true);
                }}
                size="xs"
                leadingIcon="Add"
                color={themeColor}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors`}
              >
                Add New Host
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Host modal */}
      <AddHostModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={handleAddSuccess} />

      {/* Edit Host modal */}
      <EditHostModal
        isOpen={editingHost !== null}
        onClose={() => setEditingHost(null)}
        host={editingHost}
        onSuccess={() => {
          void loadHosts();
        }}
      />

      {/* Delete Host confirmation */}
      <UIModalConfirm
        isOpen={deletingHost !== null}
        title="Remove Host"
        description={deletingHost ? `Remove "${deletingHost.name || deletingHost.hostname}" from your host list? Saved credentials will be deleted.` : ''}
        confirmLabel="Remove"
        confirmColor="red"
        onClose={() => setDeletingHost(null)}
        onConfirm={() => deletingHost && void confirmRemoveHost(deletingHost)}
      />

      {/* Login modal — shown when stored credentials are missing */}
      <HostLoginModal isOpen={loginHost !== null} onClose={() => setLoginHost(null)} host={loginHost} onLogin={handleLoginSubmit} />
    </>
  );
};
