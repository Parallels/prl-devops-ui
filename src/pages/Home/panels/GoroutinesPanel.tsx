import { StatGraphTile, Panel, Section } from '@prl/ui-kit';
import { type GraphDataPoint } from './CpuUtilizationPanel';
import { formatTimeRange } from '@/utils/timeRange';

interface GoroutinesPanelProps {
  hasGraphData: boolean;
  goroutinesSmoothed: number | undefined;
  graphData: GraphDataPoint[];
}

export function GoroutinesPanel({ hasGraphData, goroutinesSmoothed, graphData }: GoroutinesPanelProps) {
  if (!hasGraphData) {
    return (
      <Panel variant="glass" padding="sm" className="h-full">
        <Section title="Goroutines" size="lg" noPadding />
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Waiting for metrics...</p>
      </Panel>
    );
  }

  const timeRange = formatTimeRange(graphData.map((d) => (typeof d.timestamp === 'number' ? d.timestamp : 0)));

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 h-full">
      <StatGraphTile
        title="Goroutines"
        value={String(goroutinesSmoothed ?? 0)}
        subtitle={`Active Go routines (${timeRange})`}
        data={graphData}
        variant="sparkline"
        series={[{ key: 'goroutines', label: 'Goroutines', color: 'violet' }]}
        maxDataPoints={90}
        chartAnimation={false}
        height={120}
        showLegend={false}
        showAxes={false}
        showGrid={false}
        withDecoration={false}
        className="shadow-none! border-none bg-transparent"
      />
    </div>
  );
}
