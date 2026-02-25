import React, { createContext, useContext, useEffect, useMemo, useState, useRef } from 'react';
import { useEventsHub } from './EventsHubContext';
import { useSession } from './SessionContext';
import { HostHardwareInfo } from '../interfaces/devops';

const MAX_HISTORY = 50; // Reduced for graph performance if needed, but 500 is fine for sparklines usually.

export interface SystemStats {
    timestamp: number;
    memory_bytes: number;
    cpu_user_seconds: number;
    cpu_system_seconds: number;
    goroutines: number;
}

export interface CalculatedStats {
    timestamp: number;
    memoryUsedBytes: number;
    memoryTotalBytes: number;
    cpuUserPercent: number;
    cpuSystemPercent: number;
    cpuIdlePercent: number;
    goroutines: number;
}

interface SystemStatsContextType {
    currentStats: CalculatedStats | null;
    history: CalculatedStats[];
    setHardwareInfo: (info: HostHardwareInfo) => void;
}

const SystemStatsContext = createContext<SystemStatsContextType | null>(null);

export const SystemStatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { containerMessages } = useEventsHub();
    const { session } = useSession();
    const [history, setHistory] = useState<CalculatedStats[]>([]);
    const [hardwareInfo, setHardwareInfo] = useState<HostHardwareInfo | null>(null);
    const lastRawStatsRef = useRef<SystemStats | null>(null);

    const statsMessages = containerMessages['stats'] ?? [];

    // Clear accumulated stats whenever the active host changes
    const prevHostnameRef = useRef<string | undefined>(undefined);
    useEffect(() => {
        const newHostname = session?.hostname;
        if (prevHostnameRef.current !== undefined && prevHostnameRef.current !== newHostname) {
            setHistory([]);
            setHardwareInfo(null);
            lastRawStatsRef.current = null;
        }
        prevHostnameRef.current = newHostname;
    }, [session?.hostname]);

    useEffect(() => {
        if (statsMessages.length === 0) return;

        // Index 0 is newest (prepend strategy in reducer)
        const latestMsg = statsMessages[0];

        if (!latestMsg || !latestMsg.raw.body) return;

        const body = latestMsg.raw.body as any;

        let msgTimestamp = latestMsg.receivedAt;
        if (latestMsg.raw.timestamp) {
            const parsed = new Date(latestMsg.raw.timestamp).getTime();
            if (!isNaN(parsed)) {
                msgTimestamp = parsed;
            }
        }

        const newRawStats: SystemStats = {
            timestamp: msgTimestamp,
            memory_bytes: body.memory_bytes || 0,
            cpu_user_seconds: body.cpu_user_seconds || 0,
            cpu_system_seconds: body.cpu_system_seconds || 0,
            goroutines: body.goroutines || 0,
        };

        const prevRaw = lastRawStatsRef.current;

        if (prevRaw && prevRaw.timestamp === newRawStats.timestamp) {
            return;
        }

        // Calculate Deltas
        const logicalCores = hardwareInfo?.total?.logical_cpu_count || 1;
        // memory_size is in MB — convert to bytes so memoryTotalBytes matches the unit of memory_bytes
        const totalMemory = (hardwareInfo?.total?.memory_size ?? 0) * 1024 * 1024;

        let cpuUserPercent = 0;
        let cpuSystemPercent = 0;
        let cpuIdlePercent = 0;

        if (prevRaw) {
            const timeDelta = (newRawStats.timestamp - prevRaw.timestamp) / 1000;

            if (timeDelta > 0) {
                const userDelta = newRawStats.cpu_user_seconds - prevRaw.cpu_user_seconds;
                const systemDelta = newRawStats.cpu_system_seconds - prevRaw.cpu_system_seconds;

                const totalCpuTime = timeDelta * logicalCores;

                if (totalCpuTime > 0) {
                    cpuUserPercent = (userDelta / totalCpuTime) * 100;
                    cpuSystemPercent = (systemDelta / totalCpuTime) * 100;
                }
            }
        }

        cpuUserPercent = Math.max(0, Math.min(100, cpuUserPercent));
        cpuSystemPercent = Math.max(0, Math.min(100, cpuSystemPercent));
        if (cpuUserPercent + cpuSystemPercent > 100) {
            const total = cpuUserPercent + cpuSystemPercent;
            cpuUserPercent = (cpuUserPercent / total) * 100;
            cpuSystemPercent = (cpuSystemPercent / total) * 100;
        }
        cpuIdlePercent = Math.max(0, 100 - cpuUserPercent - cpuSystemPercent);


        const calculated: CalculatedStats = {
            timestamp: newRawStats.timestamp,
            memoryUsedBytes: newRawStats.memory_bytes,
            memoryTotalBytes: totalMemory,
            cpuUserPercent,
            cpuSystemPercent,
            cpuIdlePercent,
            goroutines: newRawStats.goroutines
        };

        lastRawStatsRef.current = newRawStats;

        setHistory(prevHist => {
            const newHist = [calculated, ...prevHist];
            return newHist.length > MAX_HISTORY ? newHist.slice(0, MAX_HISTORY) : newHist;
        });

    }, [statsMessages, hardwareInfo, session?.hostname]);

    const currentStats = history.length > 0 ? history[0] : null;

    const value = useMemo(() => ({
        currentStats,
        history,
        setHardwareInfo
    }), [currentStats, history]);

    return (
        <SystemStatsContext.Provider value={value}>
            {children}
        </SystemStatsContext.Provider>
    );
};

export const useSystemStats = () => {
    const ctx = useContext(SystemStatsContext);
    if (!ctx) throw new Error("useSystemStats must be used within SystemStatsProvider");
    return ctx;
};
