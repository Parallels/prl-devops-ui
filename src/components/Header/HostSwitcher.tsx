import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useConfig } from '@/contexts/ConfigContext';
import { useSession } from '@/contexts/SessionContext';
import { HostConfig } from '@/interfaces/Host';
import { authService } from '@/services/authService';
import { getPasswordKey, getApiKeyKey } from '@/utils/secretKeys';
import { decodeToken } from '@/utils/tokenUtils';
import { devopsService } from '@/services/devops';
import { AddHostModal } from './AddHostModal';
import { HostLoginModal } from './HostLoginModal';

// ─── Inline icons ────────────────────────────────────────────────────────────

const StarFilledIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const StarOutlineIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="h-3 w-3 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const PlusIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="h-4 w-4 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
  </svg>
);

// ─── Component ───────────────────────────────────────────────────────────────

export const HostSwitcher: React.FC = () => {
  const config = useConfig();
  const { session, setSession } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [hosts, setHosts] = useState<HostConfig[]>([]);
  const [switchingHostId, setSwitchingHostId] = useState<string | null>(null);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [loginHost, setLoginHost] = useState<HostConfig | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadHosts = useCallback(async () => {
    const all = (await config.get<HostConfig[]>('hosts')) ?? [];
    setHosts(all);
  }, [config]);

  useEffect(() => {
    void loadHosts();
  }, [loadHosts]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSwitchError(null);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [isOpen]);

  // ── Derived display values ─────────────────────────────────────────────────
  const currentHost = hosts.find((h) => h.id === session?.hostId);
  const displayName = currentHost?.name || currentHost?.hostname || session?.serverUrl || 'No Connection';
  const isConnected = !!session;

  // Sorted: current first, then others by most recently used
  const sortedHosts = [
    ...(currentHost ? [currentHost] : []),
    ...hosts
      .filter((h) => h.id !== session?.hostId)
      .sort((a, b) => (b.lastUsed ?? '').localeCompare(a.lastUsed ?? '')),
  ];

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleToggleOpen = () => {
    setSwitchError(null);
    if (!isOpen) void loadHosts();
    setIsOpen((prev) => !prev);
  };

  const handleSetDefault = async (e: React.MouseEvent, hostId: string) => {
    e.stopPropagation();
    const updated = hosts.map((h) => ({ ...h, isDefault: h.id === hostId }));
    await config.set('hosts', updated);
    await config.save();
    setHosts(updated);
  };

  const handleRemoveHost = async (e: React.MouseEvent, hostId: string) => {
    e.stopPropagation();
    const hostToRemove = hosts.find((h) => h.id === hostId);
    if (!hostToRemove) return;

    // Clear stored secrets for this host
    await config.removeSecret(getPasswordKey(hostToRemove.hostname));
    await config.removeSecret(getApiKeyKey(hostToRemove.hostname));
    await config.flushSecrets();

    // Remove from the list; if it was the default, promote the first remaining host
    const updated = hosts.filter((h) => h.id !== hostId);
    if (hostToRemove.isDefault && updated.length > 0) {
      updated[0] = { ...updated[0], isDefault: true };
    }

    await config.set('hosts', updated);
    await config.save();
    setHosts(updated);
  };

  const connectToHost = async (
    host: HostConfig,
    credentials: { username: string; password: string; apiKey: string },
    keepLoggedInOverride?: boolean,
  ) => {
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
        : h
    );
    await config.set('hosts', updatedHosts);
    await config.save();
    setHosts(updatedHosts);

    // Fetch fresh hardware info, fall back to cached
    let hardwareInfo = host.hardwareInfo;
    try {
      hardwareInfo = await devopsService.config.getHardwareInfo(host.hostname);
    } catch { /* use cached */ }

    authService.currentHostname = host.hostname;
    const token = authService.getToken(host.hostname);
    const tokenPayload = token ? decodeToken(token) ?? undefined : undefined;

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

      const hasStoredSecret = host.authType === 'credentials'
        ? Boolean(storedPassword)
        : Boolean(storedApiKey);

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

  const handleLoginSubmit = async (
    credentials: { username: string; password: string; apiKey: string },
    keepLoggedIn: boolean,
  ) => {
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
          className="flex items-center gap-2 rounded-md px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-600 dark:hover:bg-neutral-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span
            className={`h-2 w-2 flex-shrink-0 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}
          />
          <span
            className="max-w-[220px] truncate text-sm font-medium text-gray-700 dark:text-gray-200"
            title={session?.serverUrl}
          >
            {displayName}
          </span>
          <ChevronDownIcon />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute left-0 top-full z-[200] mt-2 w-84 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-800">
            {/* Header */}
            <div className="border-b border-neutral-100 px-4 py-2.5 dark:border-neutral-700">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                Hosts
              </span>
            </div>

            {/* Error banner */}
            {switchError && (
              <div className="border-b border-red-100 bg-red-50 px-4 py-2.5 dark:border-red-800/40 dark:bg-red-900/20">
                <p className="text-xs text-red-600 dark:text-red-400">{switchError}</p>
              </div>
            )}

            {/* Host list */}
            <ul className="max-h-60 overflow-y-auto py-1" role="listbox">
              {sortedHosts.length === 0 && (
                <li className="px-4 py-4 text-center text-sm text-neutral-400">
                  No hosts configured
                </li>
              )}

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
                      className={[
                        'group flex cursor-pointer select-none items-center gap-3 px-4 py-3 transition-colors',
                        isCurrent
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:bg-neutral-50 dark:hover:bg-neutral-700/60',
                        isSwitching && 'pointer-events-none opacity-60',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                    {/* Connection status dot */}
                    <span
                      className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${
                        isCurrent ? 'bg-green-500' : 'bg-neutral-300 dark:bg-neutral-600'
                      }`}
                    />

                    {/* Host info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`truncate text-sm font-medium ${
                            isCurrent
                              ? 'text-blue-700 dark:text-blue-300'
                              : 'text-neutral-800 dark:text-neutral-200'
                          }`}
                        >
                          {hostLabel}
                        </span>
                        {isCurrent && (
                          <span className="flex-shrink-0 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:bg-blue-800/60 dark:text-blue-300">
                            active
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-neutral-400 dark:text-neutral-500">
                        {host.baseUrl}
                        <span className="ml-2 text-neutral-300 dark:text-neutral-600">·</span>
                        <span className="ml-1">{host.type}</span>
                      </p>
                    </div>

                    {/* Right-side actions */}
                    <div className="flex flex-shrink-0 items-center gap-1.5">
                      {isSwitching && <SpinnerIcon />}

                      {/* Default star */}
                      <button
                        onClick={(e) => void handleSetDefault(e, host.id)}
                        title={host.isDefault ? 'Default host — auto-connects on startup' : 'Set as default'}
                        className={[
                          'rounded p-1 transition-colors',
                          host.isDefault
                            ? 'text-amber-400 hover:text-amber-500'
                            : 'text-neutral-300 hover:text-amber-400 dark:text-neutral-600 dark:hover:text-amber-400',
                        ].join(' ')}
                        aria-label={host.isDefault ? 'Default host' : 'Set as default'}
                      >
                        {host.isDefault ? <StarFilledIcon /> : <StarOutlineIcon />}
                      </button>

                      {/* Remove host — hidden until row hover, disabled for active host */}
                      {!isCurrent && (
                        <button
                          onClick={(e) => void handleRemoveHost(e, host.id)}
                          title="Remove host"
                          aria-label="Remove host"
                          className="rounded p-1 text-neutral-300 opacity-0 transition-all hover:text-red-500 group-hover:opacity-100 dark:text-neutral-600 dark:hover:text-red-400"
                        >
                          <TrashIcon />
                        </button>
                      )}
                    </div>
                    </li>
                  </React.Fragment>
                );
              })}
            </ul>

            {/* Footer — Add new host */}
            <div className="border-t border-neutral-100 p-2 dark:border-neutral-700">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsAddModalOpen(true);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
              >
                <PlusIcon />
                Add New Host
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Host modal */}
      <AddHostModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {/* Login modal — shown when stored credentials are missing */}
      <HostLoginModal
        isOpen={loginHost !== null}
        onClose={() => setLoginHost(null)}
        host={loginHost}
        onLogin={handleLoginSubmit}
      />
    </>
  );
};
