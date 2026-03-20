import { useMemo } from 'react';
import { EmptyState, StatGraphTile } from '@prl/ui-kit';
import { DevOpsRemoteHost } from '@/interfaces/devops';
import { useHostStats } from '@/contexts/EventsHubContext';

function autoScaleBytes(bytes: number): string {
    if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
    if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(2)} KB`;
}

export function PerformanceTab({ host }: { host: DevOpsRemoteHost }) {
    const stats = useHostStats(host.id || '');
    const latest = stats[stats.length - 1];

    // Transform the rolling buffer into chart-ready data.
    // CPU: prefer server-provided cpu_percent; if absent, derive from consecutive
    // cumulative-second deltas (same approach as SystemStatsContext).
    const graphData = useMemo(() => stats.map((point, i) => {
        let cpuPercent = point.cpu_percent;
        if (!cpuPercent && i > 0) {
            const prev = stats[i - 1];
            const timeDelta = (point.ts - prev.ts) / 1000;
            if (timeDelta > 0) {
                const userDelta = Math.max(0, point.cpu_user_seconds - prev.cpu_user_seconds);
                const systemDelta = Math.max(0, point.cpu_system_seconds - prev.cpu_system_seconds);
                cpuPercent = Math.max(0, Math.min(100, ((userDelta + systemDelta) / timeDelta) * 100));
            }
        }
        return {
            timestamp: point.ts,
            cpuPercent,
            memoryBytes: point.memory_alloc_bytes,
            goroutines: point.goroutines_smoothed,
        };
    }), [stats]);

    const latestGraph = graphData[graphData.length - 1];

    if (!latest) {
        return (
            // <div className="flex flex-col items-center justify-center gap-3 py-16 text-neutral-400 dark:text-neutral-500">
            //     <CustomIcon icon="HealthCheck" className="h-8 w-8 opacity-30" />
            //     <p className="text-sm">Waiting for agent stats…</p>
            //     <p className="text-xs opacity-60">HOST_STATS_UPDATE messages will appear here</p>
            // </div>
            <EmptyState
                icon="Realtime"
                title="Waiting for agent stats…"
                subtitle="Real-time performance data will appear here"
                fullHeight
                fullWidth
                disableBorder
            />
        );
    }

    return (
        <div className="p-4 space-y-4">
            {/* CPU */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                <StatGraphTile
                    title="CPU Usage"
                    value={`${(latestGraph?.cpuPercent ?? 0).toFixed(2)}%`}
                    subtitle="Agent process"
                    data={graphData}
                    variant="sparkline"
                    series={[{ key: 'cpuPercent', label: 'CPU %', color: 'blue' }]}
                    yDomain={['auto', 'auto']}
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
                    value={autoScaleBytes(latestGraph?.memoryBytes ?? 0)}
                    subtitle="Agent process heap"
                    data={graphData}
                    variant="sparkline"
                    series={[{ key: 'memoryBytes', label: 'Bytes', color: 'amber' }]}
                    yDomain={['auto', 'auto']}
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
