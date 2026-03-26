import React, { useCallback, useState } from 'react';
import classNames from 'classnames';
import { Pill, Pause, Suspend, Stop, Restart, Run, Section, Tabs, formatDuration, InfoRow } from '@prl/ui-kit';
import { devopsService } from '@/services/devops';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { VirtualMachine } from '@/interfaces/VirtualMachine';
import { OsIcon } from '@/utils/virtualMachine';
import { getStateTone } from '@/utils/vmUtils';
import { SnapshotsTab } from './tabs/SnapshotsTab';

// ── Shared helpers (also used by table columns in Vms.tsx) ──────────────────

// ── Internal building blocks ────────────────────────────────────────────────

// function InfoRow({ label, value, mono = false }: {
//     label: string;
//     value?: string | number | boolean | null;
//     mono?: boolean;
// }) {
//     if (value === undefined || value === null || value === '') return null;
//     const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
//     return (
//         <div className="flex items-start justify-between gap-3 px-4 py-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-md mx-1 min-w-0">
//             <span className="text-xs text-neutral-500 dark:text-neutral-400 shrink-0 w-28 leading-relaxed">{label}</span>
//             <span className={classNames(
//                 'text-xs text-right break-all min-w-0',
//                 mono
//                     ? 'font-mono text-neutral-600 dark:text-neutral-300'
//                     : 'text-neutral-800 dark:text-neutral-200'
//             )}>
//                 {display}
//             </span>
//         </div>
//     );
// }

function ActionButton({
  icon,
  label,
  loading,
  loadingLabel,
  onClick,
  disabled,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  loading?: boolean;
  loadingLabel?: string;
  onClick: () => void;
  disabled?: boolean;
  tone: 'emerald' | 'rose' | 'amber' | 'sky' | 'neutral';
}) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20',
    rose: 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20',
    amber: 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20',
    sky: 'bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:hover:bg-sky-500/20',
    neutral: 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-700/50 dark:text-neutral-300 dark:hover:bg-neutral-700',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={classNames('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition select-none', colors[tone], (disabled || loading) && 'opacity-50 cursor-not-allowed')}
    >
      <span className="w-3.5 h-3.5 shrink-0">{icon}</span>
      {loading ? (loadingLabel ?? label) : label}
    </button>
  );
}

// ── Tab content ─────────────────────────────────────────────────────────────

function OverviewTab({ vm }: { vm: VirtualMachine }) {
  const ipAddresses = vm.Network?.ipAddresses ?? [];
  return (
    <>
      <Section title="Identity" titleSize="text-xs">
        <InfoRow label="Name" labelSize="sm" value={vm.Name} hoverable />
        <InfoRow label="ID" labelSize="sm" value={vm.ID} hoverable />
        <InfoRow label="Type" labelSize="sm" value={vm.Type} hoverable />
        <InfoRow label="OS" labelSize="sm" value={vm.OS} hoverable />
        <InfoRow label="Template" labelSize="sm" value={vm.Template as string} hoverable />
        <InfoRow label="Boot order" labelSize="sm" value={vm['Boot order'] as string} hoverable />
        <InfoRow label="BIOS type" labelSize="sm" value={vm['BIOS type'] as string} hoverable />
        <InfoRow label="Description" labelSize="sm" value={vm.Description} hoverable />
      </Section>
      <Section title="Network" titleSize="text-xs">
        <InfoRow label="Internal IP" labelSize="sm" value={vm.internal_ip_address as string} mono hoverable />
        <InfoRow label="External IP" labelSize="sm" value={vm.host_external_ip_address as string} mono hoverable />
        {ipAddresses.map((addr, i) => (
          <InfoRow key={i} label={addr.type ?? `Address ${i + 1}`} value={addr.ip} mono hoverable />
        ))}
      </Section>
      <Section title="Host" titleSize="text-xs">
        <InfoRow label="Host ID" labelSize="sm" value={vm.host_id as string} mono hoverable />
        <InfoRow label="User" labelSize="sm" value={vm.user as string} hoverable />
        <InfoRow label="Uptime" labelSize="sm" value={formatDuration(parseInt(vm.Uptime))} hoverable />
        <InfoRow label="Home" labelSize="sm" value={vm.Home} hoverable />
      </Section>
    </>
  );
}

function HardwareTab({ vm }: { vm: VirtualMachine }) {
  if (!vm.Hardware) {
    return <p className="px-4 py-8 text-center text-xs text-neutral-400 dark:text-neutral-600">Hardware information not available</p>;
  }
  const hw = vm.Hardware;
  return (
    <>
      {hw.cpu && (
        <Section title="CPU" titleSize="text-xs">
          <InfoRow label="Cores" labelSize="sm" value={hw.cpu.cpus} hoverable />
          <InfoRow label="Type" labelSize="sm" value={hw.cpu.type} hoverable />
          <InfoRow label="Mode" labelSize="sm" value={hw.cpu.mode} hoverable />
          <InfoRow label="Acceleration" labelSize="sm" value={hw.cpu.accl} hoverable />
          <InfoRow label="VT-x" labelSize="sm" value={hw.cpu['VT-x']} hoverable />
          <InfoRow label="Hotplug" labelSize="sm" value={hw.cpu.hotplug} hoverable />
        </Section>
      )}
      {hw.memory && (
        <Section title="Memory" titleSize="text-xs">
          <InfoRow label="Size" labelSize="sm" value={hw.memory.size} hoverable />
          <InfoRow label="Auto" labelSize="sm" value={hw.memory.auto} hoverable />
          <InfoRow label="Hotplug" labelSize="sm" value={hw.memory.hotplug} hoverable />
        </Section>
      )}
      {hw.hdd0 && (
        <Section title="Storage" titleSize="text-xs">
          <InfoRow label="Size" labelSize="sm" value={hw.hdd0.size} hoverable />
          <InfoRow label="Type" labelSize="sm" value={hw.hdd0.type} hoverable />
          <InfoRow label="Port" labelSize="sm" value={hw.hdd0.port} hoverable />
          <InfoRow label="Online compact" labelSize="sm" value={hw.hdd0['online-compact']} hoverable />
          <InfoRow label="Image" labelSize="sm" value={hw.hdd0.image} mono hoverable />
        </Section>
      )}
      {hw.video && (
        <Section title="Video" titleSize="text-xs">
          <InfoRow label="Adapter" labelSize="sm" value={hw.video['adapter-type']} hoverable />
          <InfoRow label="VRAM" labelSize="sm" value={hw.video.size} hoverable />
          <InfoRow label="3D acceleration" labelSize="sm" value={hw.video['3d-acceleration']} hoverable />
          <InfoRow label="High resolution" labelSize="sm" value={hw.video['high-resolution']} hoverable />
          <InfoRow label="Vertical sync" labelSize="sm" value={hw.video['vertical-sync']} hoverable />
        </Section>
      )}
      {hw.net0 && (
        <Section title="Network Adapter" titleSize="text-xs">
          <InfoRow label="Type" labelSize="sm" value={hw.net0.type} hoverable />
          <InfoRow label="Card" labelSize="sm" value={hw.net0.card} hoverable />
          <InfoRow label="MAC address" labelSize="sm" value={hw.net0.mac} mono hoverable />
        </Section>
      )}
      {hw.sound0 && (
        <Section title="Sound" titleSize="text-xs">
          <InfoRow label="Output" labelSize="sm" value={hw.sound0.output} hoverable />
          <InfoRow label="Mixer" labelSize="sm" value={hw.sound0.mixer} hoverable />
        </Section>
      )}
    </>
  );
}

function SettingsTab({ vm }: { vm: VirtualMachine }) {
  return (
    <>
      {vm.GuestTools && (
        <Section title="Guest Tools">
          <InfoRow label="State" value={vm.GuestTools.state} hoverable />
          <InfoRow label="Version" value={vm.GuestTools.version} hoverable />
        </Section>
      )}
      {vm.Security && (
        <Section title="Security">
          <InfoRow label="Encrypted" value={vm.Security.Encrypted} hoverable />
          <InfoRow label="TPM enabled" value={vm.Security['TPM enabled']} hoverable />
          <InfoRow label="TPM type" value={vm.Security['TPM type']} hoverable />
          <InfoRow label="Protected" value={vm.Security.Protected} hoverable />
          <InfoRow label="Archived" value={vm.Security.Archived} hoverable />
          <InfoRow label="Packed" value={vm.Security.Packed} hoverable />
        </Section>
      )}
      {vm['Startup and Shutdown'] && (
        <Section title="Startup & Shutdown">
          <InfoRow label="Autostart" value={vm['Startup and Shutdown'].Autostart} hoverable />
          <InfoRow label="Autostart delay" value={vm['Startup and Shutdown']['Autostart delay']} hoverable />
          <InfoRow label="Autostop" value={vm['Startup and Shutdown'].Autostop} hoverable />
          <InfoRow label="Startup view" value={vm['Startup and Shutdown']['Startup view']} hoverable />
          <InfoRow label="On shutdown" value={vm['Startup and Shutdown']['On shutdown']} hoverable />
          <InfoRow label="On window close" value={vm['Startup and Shutdown']['On window close']} hoverable />
          <InfoRow label="Pause idle" value={vm['Startup and Shutdown']['Pause idle']} hoverable />
        </Section>
      )}
      {vm.Optimization && (
        <Section title="Optimization">
          <InfoRow label="Hypervisor" value={vm.Optimization['Hypervisor type']} hoverable />
          <InfoRow label="Adaptive hypervisor" value={vm.Optimization['Adaptive hypervisor']} hoverable />
          <InfoRow label="Nested virt." value={vm.Optimization['Nested virtualization']} hoverable />
          <InfoRow label="Faster VM" value={vm.Optimization['Faster virtual machine']} hoverable />
          <InfoRow label="PMU virtualization" value={vm.Optimization['PMU virtualization']} hoverable />
          <InfoRow label="Battery life" value={vm.Optimization['Longer battery life']} hoverable />
        </Section>
      )}
      {vm['Time Synchronization'] && (
        <Section title="Time Synchronization">
          <InfoRow label="Enabled" value={vm['Time Synchronization'].enabled} hoverable />
          <InfoRow label="Smart mode" value={vm['Time Synchronization']['Smart mode']} hoverable />
          <InfoRow label="Interval" value={vm['Time Synchronization']['Interval (in seconds)']} hoverable />
        </Section>
      )}
    </>
  );
}

// ── Public component ────────────────────────────────────────────────────────

export interface VmDetailContentProps {
  vm: VirtualMachine;
  hostname: string;
  isOrchestrator: boolean;
}

export function VmDetailContent({ vm, hostname, isOrchestrator }: VmDetailContentProps) {
  const { themeColor } = useSystemSettings();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const state = (vm.State ?? '').toLowerCase();
  const isRunning = state === 'running';
  const isStopped = state === 'stopped' || state === 'error';
  const canResume = state === 'paused' || state === 'suspended';
  const busy = !!actionLoading;

  const handleAction = useCallback(
    async (action: string) => {
      if (!vm.ID || actionLoading) return;
      setActionLoading(action);
      try {
        switch (action) {
          case 'start':
            await devopsService.machines.startVirtualMachine(hostname, vm.ID, isOrchestrator);
            break;
          case 'stop':
            await devopsService.machines.stopVirtualMachine(hostname, vm.ID, true, isOrchestrator);
            break;
          case 'pause':
            await devopsService.machines.pauseVirtualMachine(hostname, vm.ID, isOrchestrator);
            break;
          case 'resume':
            await devopsService.machines.resumeVirtualMachine(hostname, vm.ID, isOrchestrator);
            break;
          case 'suspend':
            await devopsService.machines.suspendVirtualMachine(hostname, vm.ID, isOrchestrator);
            break;
          case 'restart':
            await devopsService.machines.stopVirtualMachine(hostname, vm.ID, true, isOrchestrator);
            await devopsService.machines.startVirtualMachine(hostname, vm.ID, isOrchestrator);
            break;
        }
      } catch (err) {
        console.error(`Failed to ${action} VM:`, err);
      } finally {
        setActionLoading(null);
      }
    },
    [vm.ID, hostname, isOrchestrator, actionLoading],
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 py-4 space-y-3 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300">
            <OsIcon os={vm.OS} className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Pill size="sm" tone={getStateTone(vm.State)} variant="soft">
                {vm.State ?? 'Unknown'}
              </Pill>
              {vm.OS && <span className="text-xs text-neutral-500 dark:text-neutral-400">{vm.OS}</span>}
            </div>
            {vm.Uptime && <p className="text-xs text-neutral-400 dark:text-neutral-500">Uptime: {formatDuration(parseInt(vm.Uptime))}</p>}
            {vm.GuestTools?.version && (
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                Guest tools:{' '}
                <span
                  className={
                    vm.GuestTools.state === 'possibly_installed'
                      ? 'text-sky-400  dark:text-sky-500'
                      : vm.GuestTools.state === 'outdated'
                        ? 'text-amber-400 dark:text-amber-500'
                        : 'text-emerald-400 dark:text-emerald-500'
                  }
                >
                  {vm.GuestTools.version}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {isStopped && (
            <ActionButton
              icon={<Run className="w-3.5 h-3.5" />}
              label="Start"
              loadingLabel="Starting…"
              loading={actionLoading === 'start'}
              disabled={busy}
              tone="emerald"
              onClick={() => void handleAction('start')}
            />
          )}
          {canResume && (
            <ActionButton
              icon={<Run className="w-3.5 h-3.5" />}
              label="Resume"
              loadingLabel="Resuming…"
              loading={actionLoading === 'resume'}
              disabled={busy}
              tone="emerald"
              onClick={() => void handleAction('resume')}
            />
          )}
          {(isRunning || canResume) && (
            <ActionButton
              icon={<Stop className="w-3.5 h-3.5" />}
              label="Stop"
              loadingLabel="Stopping…"
              loading={actionLoading === 'stop'}
              disabled={busy}
              tone="rose"
              onClick={() => void handleAction('stop')}
            />
          )}
          {isRunning && (
            <>
              <ActionButton
                icon={<Pause className="w-3.5 h-3.5" />}
                label="Pause"
                loadingLabel="Pausing…"
                loading={actionLoading === 'pause'}
                disabled={busy}
                tone="amber"
                onClick={() => void handleAction('pause')}
              />
              <ActionButton
                icon={<Suspend className="w-3.5 h-3.5" />}
                label="Suspend"
                loadingLabel="Suspending…"
                loading={actionLoading === 'suspend'}
                disabled={busy}
                tone="sky"
                onClick={() => void handleAction('suspend')}
              />
              <ActionButton
                icon={<Restart className="w-3.5 h-3.5" />}
                label="Restart"
                loadingLabel="Restarting…"
                loading={actionLoading === 'restart'}
                disabled={busy}
                tone="neutral"
                onClick={() => void handleAction('restart')}
              />
            </>
          )}
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <Tabs
        variant="underline"
        color={themeColor}
        size="sm"
        className="flex-1 min-h-0"
        listClassName="bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800"
        panelClassName="pb-6"
        panelIdPrefix="vm-detail"
        items={[
          { id: 'overview',   label: 'Overview',   panel: <OverviewTab vm={vm} /> },
          { id: 'hardware',   label: 'Hardware',   panel: <HardwareTab vm={vm} /> },
          { id: 'settings',   label: 'Settings',   panel: <SettingsTab vm={vm} /> },
          { id: 'snapshots',  label: 'Snapshots',  panel: <SnapshotsTab vm={vm} hostname={hostname} /> },
        ]}
      />
    </div>
  );
}
