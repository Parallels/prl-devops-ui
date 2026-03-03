import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useSession } from './SessionContext';
import { useConfig } from './ConfigContext';
import { HostConfig, HostSettings } from '../interfaces/Host';

const EMPTY_SETTINGS: HostSettings = { global: {}, pages: {} };

interface HostSettingsContextType {
    isLoaded: boolean;
    getGlobal<T>(key: string, defaultValue: T): T;
    setGlobal<T>(key: string, value: T): Promise<void>;
    getPage<T>(page: string, key: string, defaultValue: T): T;
    setPage<T>(page: string, key: string, value: T): Promise<void>;
}

const HostSettingsContext = createContext<HostSettingsContextType | null>(null);

export const HostSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { session } = useSession();
    const config = useConfig();
    const [settings, setSettings] = useState<HostSettings>(EMPTY_SETTINGS);
    const [isLoaded, setIsLoaded] = useState(false);
    // Keep a ref so persist() always sees the latest settings without stale closure
    const settingsRef = useRef<HostSettings>(EMPTY_SETTINGS);

    // Load settings when hostId changes (login/host-switch)
    useEffect(() => {
        const hostId = session?.hostId;
        if (!hostId) {
            setSettings(EMPTY_SETTINGS);
            settingsRef.current = EMPTY_SETTINGS;
            setIsLoaded(false);
            return;
        }

        let cancelled = false;
        (async () => {
            try {
                const hosts = (await config.get<HostConfig[]>('hosts')) ?? [];
                const host = hosts.find((h) => h.id === hostId);
                const loaded = host?.settings ?? { global: {}, pages: {} };
                if (!cancelled) {
                    setSettings(loaded);
                    settingsRef.current = loaded;
                    setIsLoaded(true);
                }
            } catch {
                if (!cancelled) {
                    setSettings(EMPTY_SETTINGS);
                    settingsRef.current = EMPTY_SETTINGS;
                    setIsLoaded(true);
                }
            }
        })();

        return () => { cancelled = true; };
    }, [session?.hostId]); // eslint-disable-line react-hooks/exhaustive-deps

    const persist = useCallback(async (next: HostSettings) => {
        const hostId = session?.hostId;
        if (!hostId) return;
        try {
            const hosts = (await config.get<HostConfig[]>('hosts')) ?? [];
            const updated = hosts.map((h) =>
                h.id === hostId ? { ...h, settings: next } : h
            );
            await config.set('hosts', updated);
            await config.save();
        } catch (err) {
            console.error('[HostSettings] Failed to persist settings:', err);
        }
    }, [session?.hostId, config]); // eslint-disable-line react-hooks/exhaustive-deps

    const setGlobal = useCallback(async <T,>(key: string, value: T) => {
        const next: HostSettings = {
            ...settingsRef.current,
            global: { ...settingsRef.current.global, [key]: value },
        };
        settingsRef.current = next;
        setSettings(next);
        await persist(next);
    }, [persist]);

    const setPage = useCallback(async <T,>(page: string, key: string, value: T) => {
        const next: HostSettings = {
            ...settingsRef.current,
            pages: {
                ...settingsRef.current.pages,
                [page]: { ...settingsRef.current.pages[page], [key]: value },
            },
        };
        settingsRef.current = next;
        setSettings(next);
        await persist(next);
    }, [persist]);

    const getGlobal = useCallback(<T,>(key: string, defaultValue: T): T => {
        const v = settings.global[key];
        return v !== undefined ? (v as T) : defaultValue;
    }, [settings]);

    const getPage = useCallback(<T,>(page: string, key: string, defaultValue: T): T => {
        const v = settings.pages[page]?.[key];
        return v !== undefined ? (v as T) : defaultValue;
    }, [settings]);

    const value: HostSettingsContextType = { isLoaded, getGlobal, setGlobal, getPage, setPage };

    return (
        <HostSettingsContext.Provider value={value}>
            {children}
        </HostSettingsContext.Provider>
    );
};

export const useHostSettings = (): HostSettingsContextType => {
    const ctx = useContext(HostSettingsContext);
    if (!ctx) throw new Error('useHostSettings must be used within a HostSettingsProvider');
    return ctx;
};
