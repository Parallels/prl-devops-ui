import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ThemeColor } from '@prl/ui-kit';
import { useConfig } from './ConfigContext';
import { DEFAULT_SYSTEM_SETTINGS, type SystemSettings } from '../interfaces/SystemSettings';

const CONFIG_KEY = 'system_settings';

interface SystemSettingsContextType {
    themeColor: ThemeColor;
    setThemeColor: (color: ThemeColor) => Promise<void>;
}

const SystemSettingsContext = createContext<SystemSettingsContextType | null>(null);

export const SystemSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const config = useConfig();
    const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);
    const settingsRef = useRef<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const stored = await config.get<SystemSettings>(CONFIG_KEY);
                const merged: SystemSettings = { ...DEFAULT_SYSTEM_SETTINGS, ...stored };
                if (!cancelled) {
                    setSettings(merged);
                    settingsRef.current = merged;
                }
            } catch {
                // leave defaults
            }
        })();
        return () => { cancelled = true; };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const setThemeColor = useCallback(async (color: ThemeColor) => {
        const next: SystemSettings = { ...settingsRef.current, themeColor: color };
        settingsRef.current = next;
        setSettings(next);
        try {
            await config.set(CONFIG_KEY, next);
            await config.save();
        } catch (err) {
            console.error('[SystemSettings] Failed to persist settings:', err);
        }
    }, [config]); // eslint-disable-line react-hooks/exhaustive-deps

    const value: SystemSettingsContextType = {
        themeColor: settings.themeColor,
        setThemeColor,
    };

    return (
        <SystemSettingsContext.Provider value={value}>
            {children}
        </SystemSettingsContext.Provider>
    );
};

export const useSystemSettings = (): SystemSettingsContextType => {
    const ctx = useContext(SystemSettingsContext);
    if (!ctx) throw new Error('useSystemSettings must be used within a SystemSettingsProvider');
    return ctx;
};
