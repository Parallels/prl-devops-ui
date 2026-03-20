import React, { createContext, useContext, useEffect, useMemo, useState, useRef } from 'react';
import { useEventsHub } from './EventsHubContext';
import { useSession } from './SessionContext';
import { HostHardwareInfo } from '../interfaces/devops';

const MAX_HISTORY = 50; // Reduced for graph performance if needed, but 500 is fine for sparklines usually.

export interface SystemStats {
  timestamp: number;
  memory_bytes: number;
  memory_alloc_bytes: number;
  cpu_user_seconds: number;
  cpu_system_seconds: number;
  cpu_percent: number;
  goroutines: number;
  goroutines_smoothed: number;
}

export interface CalculatedStats {
  timestamp: number;
  memoryUsedBytes: number;
  memoryTotalBytes: number;
  memoryAllocBytes: number;
  memoryTotalAllocBytes: number;
  cpuIdlePercent: number;
  cpuPercent: number;
  goroutines: number;
  goroutinesSmoothed: number;
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
      memory_alloc_bytes: body.memory_alloc_bytes || body.memory_bytes || 0,
      cpu_user_seconds: body.cpu_user_seconds || 0,
      cpu_system_seconds: body.cpu_system_seconds || 0,
      cpu_percent: body.cpu_percent || 0,
      goroutines: body.goroutines || 0,
      goroutines_smoothed: body.goroutines_smoothed || body.goroutines || 0,
    };

    const prevRaw = lastRawStatsRef.current;

    if (prevRaw && prevRaw.timestamp === newRawStats.timestamp) {
      return;
    }

    // CPU: prefer server-provided cpu_percent; fall back to client-side delta from cumulative seconds
    let cpuPercent: number;
    if (body.cpu_percent != null) {
      cpuPercent = Math.max(0, Math.min(100, newRawStats.cpu_percent));
    } else if (prevRaw) {
      const logicalCores = hardwareInfo?.total?.logical_cpu_count || 1;
      const timeDelta = (newRawStats.timestamp - prevRaw.timestamp) / 1000;
      if (timeDelta > 0) {
        const userDelta = Math.max(0, newRawStats.cpu_user_seconds - prevRaw.cpu_user_seconds);
        const systemDelta = Math.max(0, newRawStats.cpu_system_seconds - prevRaw.cpu_system_seconds);
        cpuPercent = Math.max(0, Math.min(100, ((userDelta + systemDelta) / (timeDelta * logicalCores)) * 100));
      } else {
        cpuPercent = 0;
      }
    } else {
      cpuPercent = 0;
    }
    const cpuIdlePercent = 100 - cpuPercent;

    // Memory: use smoothed alloc for "used", HeapSys for "total reserved"
    const totalMemory = (hardwareInfo?.total?.memory_size ?? 0) * 1024 * 1024;
    const memoryUsed = newRawStats.memory_alloc_bytes;
    const memoryPercent = totalMemory > 0 ? Math.min(100, (memoryUsed / totalMemory) * 100) : 0;

    // Goroutines: use smoothed value for display
    const goroutines = newRawStats.goroutines_smoothed;
    const calculated: CalculatedStats = {
      timestamp: newRawStats.timestamp,
      memoryUsedBytes: memoryPercent > 0 ? memoryUsed : 0,
      memoryTotalBytes: totalMemory,
      memoryAllocBytes: newRawStats.memory_alloc_bytes,
      cpuIdlePercent,
      cpuPercent,
      goroutines: newRawStats.goroutines,
      goroutinesSmoothed: goroutines,
    };

    lastRawStatsRef.current = newRawStats;

    setHistory((prevHist) => {
      const newHist = [calculated, ...prevHist];
      return newHist.length > MAX_HISTORY ? newHist.slice(0, MAX_HISTORY) : newHist;
    });
  }, [statsMessages, hardwareInfo, session?.hostname]);

  const currentStats = history.length > 0 ? history[0] : null;

  const value = useMemo(
    () => ({
      currentStats,
      history,
      setHardwareInfo,
    }),
    [currentStats, history],
  );

  return <SystemStatsContext.Provider value={value}>{children}</SystemStatsContext.Provider>;
};

export const useSystemStats = () => {
  const ctx = useContext(SystemStatsContext);
  if (!ctx) throw new Error('useSystemStats must be used within SystemStatsProvider');
  return ctx;
};
