import React, { useCallback, useState } from 'react';
import { Button, FormField, FormLayout, Input, Panel, Toggle } from '@prl/ui-kit';
import { DevOpsRemoteHost } from '@/interfaces/devops';
import { useSession } from '@/contexts/SessionContext';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { useRequirementCheck } from '@/hooks/useRequirementCheck';
import { buildExplicitCheckRequest } from '@/components/RequirementCheck/checkLogic';
import { RequirementCheckResult } from '@/components/RequirementCheck/RequirementCheckResult';

export interface RequirementCheckTabProps {
  host: DevOpsRemoteHost;
}

/**
 * Capacity planning for a single orchestrator host: an explicit-requirements
 * check scoped with `host_id`. The request goes to the connected orchestrator —
 * never to the managed host itself. The disk probe is live, so nothing here is
 * cached; every "Run check" re-queries the fleet agent.
 */
export const RequirementCheckTab: React.FC<RequirementCheckTabProps> = ({ host }) => {
  const { session } = useSession();
  const { themeColor } = useSystemSettings();
  const hostname = session?.hostname ?? '';

  const [cpu, setCpu] = useState('');
  const [memory, setMemory] = useState('');
  const [disk, setDisk] = useState('');
  const [macOS, setMacOS] = useState(false);

  const { state, run } = useRequirementCheck(hostname);

  const handleRun = useCallback(() => {
    run(buildExplicitCheckRequest({ cpu, memory, disk, macOS, hostId: host.id }), true);
  }, [cpu, disk, host.id, macOS, memory, run]);

  return (
    <div className="flex flex-col gap-3 p-1 pb-4">
      <Panel tone="neutral" variant="glass" padding="xs" backgroundColor="white">
        <div className="space-y-3">
          <FormLayout columns={3} gap="sm">
            <FormField label="CPU (logical CPUs)" width="full" helpText="Blank uses the default (2).">
              <Input tone={themeColor} inputMode="numeric" placeholder="e.g. 4" value={cpu} onChange={(e) => setCpu(e.target.value)} />
            </FormField>
            <FormField label="Memory (MiB)" width="full" helpText="Blank uses the default (2048).">
              <Input tone={themeColor} inputMode="numeric" placeholder="e.g. 8192" value={memory} onChange={(e) => setMemory(e.target.value)} />
            </FormField>
            <FormField label="Disk (MiB, optional)" width="full" helpText="Declared disk size.">
              <Input tone={themeColor} inputMode="numeric" placeholder="e.g. 65536" value={disk} onChange={(e) => setDisk(e.target.value)} />
            </FormField>
          </FormLayout>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Toggle
              label="macOS VM"
              description="Switches on the macOS inventory and Apple capacity checks."
              checked={macOS}
              onChange={(e) => setMacOS(e.target.checked)}
              size="sm"
              color={themeColor}
            />
            <Button variant="solid" color={themeColor} size="sm" leadingIcon="Refresh" loading={state.status === 'loading'} disabled={!hostname} onClick={handleRun}>
              Run check
            </Button>
          </div>
        </div>
      </Panel>

      <RequirementCheckResult state={state} onRetry={handleRun} />
    </div>
  );
};

export default RequirementCheckTab;
