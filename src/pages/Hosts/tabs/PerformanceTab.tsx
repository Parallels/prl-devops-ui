import React, { useMemo } from 'react';
import { CustomIcon, StatGraphTile } from '@prl/ui-kit';
import { DevOpsRemoteHost } from '@/interfaces/devops';
import { useHostStats } from '@/contexts/EventsHubContext';

export function PerformanceTab({ host }: { host: DevOpsRemoteHost }) {
    const stats = useHostStats(host.id || '');
    const latest = stats[stats.length - 1];

    // Transform the rolling buffer into chart-ready data, computing CPU rate
    // from consecutive point deltas (cpu_*_seconds are cumulative counters).
    const graphData = useMemo(() => stats.map((point, i) => {
        const prev = i > 0 ? stats[i - 1] : null;
        let cpuRate = 0;
        if (prev && point.ts > prev.ts) {
            const cpuDelta = (point.cpu_user_seconds + point.cpu_system_seconds)
                - (prev.cpu_user_seconds + prev.cpu_system_seconds);
            const timeDelta = (point.ts - prev.ts) / 1000;
            cpuRate = Math.min(100, Math.max(0, Math.round((cpuDelta / timeDelta) * 1000) / 10));
        }
        return {
            timestamp: point.ts,
            cpuRate,
            memoryMB: Math.round(point.memory_bytes / (1024 * 1024) * 10) / 10,
            goroutines: point.goroutines,
        };
    }), [stats]);

    const latestGraph = graphData[graphData.length - 1];

    if (!latest) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-neutral-400 dark:text-neutral-500">
                <CustomIcon icon="HealthCheck" className="h-8 w-8 opacity-30" />
                <p className="text-sm">Waiting for agent stats…</p>
                <p className="text-xs opacity-60">HOST_STATS_UPDATE messages will appear here</p>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4">
            {/* CPU */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                <StatGraphTile
                    title="CPU Usage"
                    value={`${latestGraph?.cpuRate ?? 0}%`}
                    subtitle="Agent process (% of 1 core)"
                    data={graphData}
                    variant="sparkline"
                    series={[{ key: 'cpuRate', label: 'CPU %', color: 'blue' }]}
                    height={80}
                    showLegend={false}
                    showAxes={false}
                    showGrid={false}
                    withDecoration={false}
                    className="!shadow-none border-none bg-transparent"
                />
            </div>

            {/* Memory */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                <StatGraphTile
                    title="Memory"
                    value={`${latestGraph?.memoryMB ?? 0} MB`}
                    subtitle="Agent process heap"
                    data={graphData}
                    variant="sparkline"
                    series={[{ key: 'memoryMB', label: 'MB', color: 'amber' }]}
                    height={80}
                    showLegend={false}
                    showAxes={false}
                    showGrid={false}
                    withDecoration={false}
                    className="!shadow-none border-none bg-transparent"
                />
            </div>

            {/* Goroutines + last updated */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                <StatGraphTile
                    title="Goroutines"
                    value={String(latestGraph?.goroutines ?? 0)}
                    subtitle="Active Go routines"
                    data={graphData}
                    variant="sparkline"
                    series={[{ key: 'goroutines', label: 'Goroutines', color: 'violet' }]}
                    height={80}
                    showLegend={false}
                    showAxes={false}
                    showGrid={false}
                    withDecoration={false}
                    className="!shadow-none border-none bg-transparent"
                />
            </div>

            <div className="flex items-center justify-between px-1 text-xs text-neutral-400 dark:text-neutral-500">
                <span>{stats.length} / 60 data points</span>
                <span>Last update {new Date(latest.ts).toLocaleTimeString()}</span>
            </div>
        </div>
    );
}
