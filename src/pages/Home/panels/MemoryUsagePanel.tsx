import { StatGraphTile, Panel, Section } from '@prl/ui-kit';
import { type GraphDataPoint } from './CpuUtilizationPanel';

interface MemoryUsagePanelProps {
  hasGraphData: boolean;
  memUsedDisplay: string;
  memTotalDisplay: string;
  graphData: GraphDataPoint[];
}

export function MemoryUsagePanel({ hasGraphData, memUsedDisplay, memTotalDisplay, graphData }: MemoryUsagePanelProps) {
  if (!hasGraphData) {
    return (
      <Panel variant="glass" padding="sm" className="h-full">
        <Section title="Memory Usage" size="lg" noPadding />
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Waiting for metrics...</p>
      </Panel>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 h-full">
      <StatGraphTile
        title="Memory Usage"
        value={memUsedDisplay}
        subtitle={`of ${memTotalDisplay} total`}
        data={graphData}
        variant="sparkline"
        series={[{ key: 'memoryBytes', label: 'Used', color: 'amber' }]}
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
