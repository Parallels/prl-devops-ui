import { InfoRow, Panel, SectionCard } from '@prl/ui-kit';
import { DevOpsRemoteHost } from '@/interfaces/devops';

export function SettingsTab({ host }: { host: DevOpsRemoteHost }) {
    return (
        <Panel variant="glass" padding='sm' title="Settings">
            <SectionCard title="General">
                <InfoRow label="Host ID" value={host.id} />
                <InfoRow label="Name" value={host.description || host.host} />
                <InfoRow label="State" value={host.state} />
                <InfoRow label="Enabled" value={host.enabled ? 'Yes' : 'No'} />
                <InfoRow label="IP Address" value={host.external_ip_address || host.host} />
            </SectionCard>
            <div className="flex items-center justify-center py-12 text-sm text-neutral-400 dark:text-neutral-500">
                Settings management coming soon
            </div>
        </Panel>
    );
}
