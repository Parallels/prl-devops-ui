import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useSession } from './SessionContext';
import { devopsService } from '@/services/devops';
import { UserConfig } from '@/services/devops/userConfigService';

interface UserConfigContextType {
  isLoaded: boolean;
  getConfig<T>(slug: string, defaultValue: T): T;
  setConfig<T>(slug: string, value: T): Promise<void>;
}

const UserConfigContext = createContext<UserConfigContextType | null>(null);

function deserializeValue(config: UserConfig): unknown {
  if (!config.value) return undefined;
  switch (config.type) {
    case 'json':
      try { return JSON.parse(config.value); } catch { return undefined; }
    case 'bool':
      return config.value === 'true';
    case 'int':
      return parseInt(config.value, 10);
    default:
      return config.value;
  }
}

export const UserConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useSession();
  const [configMap, setConfigMap] = useState<Map<string, unknown>>(new Map());
  const [isLoaded, setIsLoaded] = useState(false);
  const configMapRef = useRef<Map<string, unknown>>(new Map());

  useEffect(() => {
    const hostId = session?.hostId;
    if (!hostId) {
      const empty = new Map<string, unknown>();
      setConfigMap(empty);
      configMapRef.current = empty;
      setIsLoaded(false);
      return;
    }

    const hostname = session.hostname;
    let cancelled = false;

    (async () => {
      try {
        const configs = await devopsService.userConfig.getAllUserConfigs(hostname);
        if (!cancelled) {
          const map = new Map<string, unknown>(
            configs.map((c) => [c.slug, deserializeValue(c)])
          );
          setConfigMap(map);
          configMapRef.current = map;
          setIsLoaded(true);
        }
      } catch (err) {
        console.error('[UserConfig] Failed to load user configs:', err);
        if (!cancelled) {
          setIsLoaded(true);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [session?.hostId]); // eslint-disable-line react-hooks/exhaustive-deps

  const getConfig = useCallback(<T,>(slug: string, defaultValue: T): T => {
    const v = configMap.get(slug);
    return v !== undefined ? (v as T) : defaultValue;
  }, [configMap]);

  const setConfig = useCallback(async <T,>(slug: string, value: T): Promise<void> => {
    const next = new Map(configMapRef.current);
    next.set(slug, value);
    configMapRef.current = next;
    setConfigMap(next);

    const hostname = session?.hostname;
    if (!hostname) return;

    try {
      await devopsService.userConfig.saveUserConfig(hostname, slug, value);
    } catch (err) {
      console.error(`[UserConfig] Failed to save config "${slug}":`, err);
    }
  }, [session?.hostname]);

  const value: UserConfigContextType = { isLoaded, getConfig, setConfig };

  return (
    <UserConfigContext.Provider value={value}>
      {children}
    </UserConfigContext.Provider>
  );
};

export const useUserConfig = (): UserConfigContextType => {
  const ctx = useContext(UserConfigContext);
  if (!ctx) throw new Error('useUserConfig must be used within a UserConfigProvider');
  return ctx;
};
