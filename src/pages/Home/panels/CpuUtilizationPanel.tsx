import { StatGraphTile, Panel, Section } from '@prl/ui-kit';
import { formatTimeRange } from '@/utils/timeRange';

export interface GraphDataPoint {
  timestamp: number | string;
  cpuPercent: number;
  memoryBytes: number;
  goroutines: number;
}

interface CpuUtilizationPanelProps {
  hasGraphData: boolean;
  cpuTotal: string;
  graphData: GraphDataPoint[];
}

export function CpuUtilizationPanel({ hasGraphData, cpuTotal, graphData }: CpuUtilizationPanelProps) {
  if (!hasGraphData) {
    return (
      <Panel variant="glass" padding="sm" className="h-full">
        <Section title="CPU Utilization" size="lg" noPadding />
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Waiting for metrics...</p>
      </Panel>
    );
  }

  const timeRange = formatTimeRange(graphData.map((d) => (typeof d.timestamp === 'number' ? d.timestamp : 0)));

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 h-full">
      <StatGraphTile
        title="CPU Utilization"
        value={`${cpuTotal}%`}
        subtitle={`Total load (${timeRange})`}
        data={graphData}
        variant="sparkline"
        series={[{ key: 'cpuPercent', label: 'CPU %', color: 'blue' }]}
        maxDataPoints={90}
        yDomain={['auto', 'auto']}
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
