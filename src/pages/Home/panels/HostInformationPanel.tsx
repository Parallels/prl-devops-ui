import { Panel, Section, InfoRow, TagPanel, type ThemeColor } from '@prl/ui-kit';
import { HostHardwareInfo } from '@/interfaces/devops';

const MODULE_COLORS: Record<string, ThemeColor> = {
  host: 'blue',
  catalog: 'emerald',
  orchestrator: 'violet',
  api: 'sky',
  reverse_proxy: 'amber',
  cache: 'lime',
};

interface HostInformationPanelProps {
  hw: HostHardwareInfo | undefined;
}

export function HostInformationPanel({ hw }: HostInformationPanelProps) {
  return (
    <Panel variant="glass" padding="sm">
      <Section title="Host" size="lg" noPadding />
      <InfoRow noBorder labelSize="sm" noPadding label="CPU" value={hw?.cpu_brand ?? hw?.cpu_type} />
      <InfoRow noBorder labelSize="sm" noPadding label="Architecture" value={hw?.cpu_type} />
      <InfoRow noBorder labelSize="sm" noPadding label="OS" value={hw?.os_name && hw?.os_version ? `${hw.os_name} ${hw.os_version}` : hw?.os_name} />
      <InfoRow noBorder labelSize="sm" noPadding label="External IP" value={hw?.external_ip_address} />
      <Section title="Software" size="lg" noPadding />
      {(hw?.parallels_desktop_version || hw?.parallels_desktop_licensed) && (
        <>
          <InfoRow noBorder labelSize="sm" noPadding label="Parallels Desktop" value={hw?.parallels_desktop_version} />
          <InfoRow noBorder labelSize="sm" noPadding label="PD Licensed" value={hw?.parallels_desktop_licensed != null ? (hw.parallels_desktop_licensed ? 'Yes' : 'No') : undefined} />
        </>
      )}
      <InfoRow noBorder labelSize="sm" noPadding label="DevOps Version" value={hw?.devops_version} />
      {hw?.enabled_modules && hw.enabled_modules.length > 0 && (
        <div className="pt-2 mt-1 border-t border-neutral-100 dark:border-neutral-800">
          <Section title="Enabled Modules" size="lg" noPadding className="py-3" />
          <div className="flex flex-wrap gap-1.5">
            <TagPanel tags={hw.enabled_modules.map((m) => ({ label: m, tone: MODULE_COLORS[m] ?? 'neutral', variant: 'soft' }))} tagLimit={5} />
          </div>
        </div>
      )}
    </Panel>
  );
}
