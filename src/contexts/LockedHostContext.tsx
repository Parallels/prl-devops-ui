import React, { createContext, useContext, useMemo } from 'react';

// ── Runtime/build constants ───────────────────────────────────────────────────

const readLockedHostEnv = () => {
  const runtimeEnv = typeof window !== 'undefined' ? window.__ENV__ : undefined;
  return {
    hostUrl: runtimeEnv?.VITE_DEFAULT_HOST_URL ?? import.meta.env.VITE_DEFAULT_HOST_URL ?? '',
    username: runtimeEnv?.VITE_DEFAULT_USERNAME ?? import.meta.env.VITE_DEFAULT_USERNAME ?? '',
    password: runtimeEnv?.VITE_DEFAULT_PASSWORD ?? import.meta.env.VITE_DEFAULT_PASSWORD ?? '',
  };
};

const resolveLockedHostState = (): LockedHostContextType => {
  const { hostUrl: rawHostUrl, username: rawUsername, password: rawPassword } = readLockedHostEnv();

  if (!rawHostUrl) {
    return {
      isLocked: false,
      hostUrl: null,
      lockedHostname: null,
      username: rawUsername || null,
      hasPassword: rawPassword.length > 0,
      password: rawPassword || null,
    };
  }

  try {
    const parsed = new URL(rawHostUrl);
    return {
      isLocked: true,
      hostUrl: rawHostUrl.replace(/\/+$/, ''),
      lockedHostname: parsed.hostname,
      username: rawUsername || null,
      hasPassword: rawPassword.length > 0,
      password: rawPassword || null,
    };
  } catch {
    console.warn('[LockedHostContext] VITE_DEFAULT_HOST_URL is set but not a valid URL — falling back to normal mode.');
    return {
      isLocked: false,
      hostUrl: null,
      lockedHostname: null,
      username: rawUsername || null,
      hasPassword: rawPassword.length > 0,
      password: rawPassword || null,
    };
  }
};

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
    () => resolveLockedHostState(),
    []
  );

  return <LockedHostContext.Provider value={value}>{children}</LockedHostContext.Provider>;
};

export const useLockedHost = (): LockedHostContextType => {
  const ctx = useContext(LockedHostContext);
  if (!ctx) throw new Error('useLockedHost must be used within <LockedHostProvider>');
  return ctx;
};
