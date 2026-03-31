import React, { createContext, useContext, useMemo } from 'react';

// ── Build-time constants (evaluated once at module load) ──────────────────────

const RAW_HOST_URL = import.meta.env.VITE_DEFAULT_HOST_URL || '';
const RAW_USERNAME = import.meta.env.VITE_DEFAULT_USERNAME || '';
const RAW_PASSWORD = import.meta.env.VITE_DEFAULT_PASSWORD || '';

// Derive hostname from the URL; treat malformed URL as "not locked"
let _isLocked = false;
let _hostUrl: string | null = null;
let _lockedHostname: string | null = null;

if (RAW_HOST_URL) {
  try {
    const parsed = new URL(RAW_HOST_URL);
    _isLocked = true;
    _hostUrl = RAW_HOST_URL.replace(/\/+$/, ''); // strip trailing slashes
    _lockedHostname = parsed.hostname;
  } catch {
    console.warn('[LockedHostContext] VITE_DEFAULT_HOST_URL is set but not a valid URL — falling back to normal mode.');
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LockedHostContextType {
  /** True when VITE_DEFAULT_HOST_URL is set and valid. */
  isLocked: boolean;
  /** The normalised base URL of the locked host, or null when not locked. */
  hostUrl: string | null;
  /** Hostname extracted from hostUrl (used as HostConfig.hostname key). */
  lockedHostname: string | null;
  /** Pre-configured username, or null. */
  username: string | null;
  /** True when VITE_DEFAULT_PASSWORD is also set. */
  hasPassword: boolean;
  /** Raw password — only for the auto-login path. Do not render this value. */
  password: string | null;
}

// ── Context ───────────────────────────────────────────────────────────────────

const LockedHostContext = createContext<LockedHostContextType | null>(null);

export const LockedHostProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useMemo<LockedHostContextType>(
    () => ({
      isLocked: _isLocked,
      hostUrl: _hostUrl,
      lockedHostname: _lockedHostname,
      username: RAW_USERNAME || null,
      hasPassword: RAW_PASSWORD.length > 0,
      password: RAW_PASSWORD || null,
    }),
    []
  );

  return <LockedHostContext.Provider value={value}>{children}</LockedHostContext.Provider>;
};

export const useLockedHost = (): LockedHostContextType => {
  const ctx = useContext(LockedHostContext);
  if (!ctx) throw new Error('useLockedHost must be used within <LockedHostProvider>');
  return ctx;
};
