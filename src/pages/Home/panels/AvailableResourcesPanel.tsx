import { Panel, Section, PagedPanel } from '@prl/ui-kit';
import { OrchestratorResource } from '@/interfaces/Orchestrator';
import { OrchestratorResourceCard } from './OrchestratorResourceCard';

interface AvailableResourcesPanelProps {
  resourcePages: { title: string; res: OrchestratorResource }[];
  orchLoading: boolean;
  orchError: string | null;
}

export function AvailableResourcesPanel({ resourcePages, orchLoading, orchError }: AvailableResourcesPanelProps) {
  return (
    <Panel variant="glass" padding="sm" className="h-full">
      <Section title="Available Resources" size="lg" noPadding />
      <PagedPanel
        variant="glass"
        padding="xs"
        bare={true}
        loading={orchLoading}
        error={orchError}
        title={resourcePages.map((p) => p.title)}
        pages={resourcePages.map((p) => (
          <OrchestratorResourceCard key={p.title} res={p.res} />
        ))}
        className="col-span-2 w-full"
      />
    </Panel>
  );
}
