import { MultiProgressBar, formatMB } from '@prl/ui-kit';
import { OrchestratorResource } from '@/interfaces/Orchestrator';

export const ARCH_META: Record<string, { label: string; short: string; accent: string; bg: string; border: string; chip: string }> = {
  arm64: {
    label: 'Apple Silicon / ARM',
    short: 'ARM64',
    accent: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-200 dark:border-rose-800/60',
    chip: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300',
  },
  x86_64: {
    label: 'Intel / AMD (x86)',
    short: 'x86_64',
    accent: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-200 dark:border-blue-800/60',
    chip: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300',
  },
};

export const UNKNOWN_META = {
  label: 'Unknown Arch',
  short: 'Unknown',
  accent: 'text-neutral-500 dark:text-neutral-400',
  bg: 'bg-neutral-50 dark:bg-neutral-900/40',
  border: 'border-neutral-200 dark:border-neutral-700',
  chip: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
};

export function OrchestratorResourceCard({ res }: { res: OrchestratorResource }) {
  const diskTotal = res.total?.disk_size ?? res.total?.disk_count;
  const diskInUse = res.total_in_use?.disk_size ?? res.total_in_use?.disk_count;
  const diskReserved = res.total_reserved?.disk_size ?? res.total_reserved?.disk_count;
  const diskAvailable = res.total_available?.disk_size ?? res.total_available?.disk_count;
  const diskSysReserved = res.system_reserved?.disk_size ?? res.system_reserved?.disk_count ?? 0;
  // Physical space committed to VM disks (thin-provisioned, allocated but not yet written).
  // = total − in_use − system_reserved − available
  const diskCommitted = Math.max(0, (diskTotal ?? 0) - (diskInUse ?? 0) - diskSysReserved - (diskAvailable ?? 0));

  const getUseColor = (inUse: number | undefined, total: number | undefined) => {
    const usePct = inUse && total ? (inUse / total) * 100 : 0;
    return usePct > 85 ? 'bg-rose-500' : usePct > 60 ? 'bg-amber-400' : 'bg-blue-500';
  };

  return (
    <div className="flex w-full flex-col gap-5 pt-2">
      <MultiProgressBar
        label="CPU Cores"
        total={res.total?.logical_cpu_count ?? 0}
        totalLabel={`${res.total?.logical_cpu_count ?? 0} Cores Total`}
        secondaryLabel={
          <>
            <span className="font-medium text-neutral-700 dark:text-neutral-300">{res.total_reserved?.logical_cpu_count ?? 0}</span> Cores Reserved
          </>
        }
        series={[
          {
            key: 'inUse',
            label: 'In Use',
            value: res.total_in_use?.logical_cpu_count ?? 0,
            color: getUseColor(res.total_in_use?.logical_cpu_count, res.total?.logical_cpu_count),
          },
          {
            key: 'sysRes',
            label: 'System Reserved',
            value: res.system_reserved?.logical_cpu_count ?? 0,
            color: 'bg-violet-400 dark:bg-violet-500',
          },
          {
            key: 'available',
            label: 'Available',
            value: res.total_available?.logical_cpu_count ?? 0,
            color: 'bg-emerald-400 dark:bg-emerald-500',
          },
        ]}
      />

      <div className="h-px bg-neutral-100 dark:bg-neutral-800/80 w-full" />

      <MultiProgressBar
        label="Memory"
        total={res.total?.memory_size ?? 0}
        totalLabel={`${formatMB(res.total?.memory_size)} Total`}
        secondaryLabel={
          <>
            <span className="font-medium text-neutral-700 dark:text-neutral-300">{formatMB(res.total_reserved?.memory_size)}</span> Reserved
          </>
        }
        series={[
          {
            key: 'inUse',
            label: 'In Use',
            value: res.total_in_use?.memory_size ?? 0,
            displayValue: formatMB(res.total_in_use?.memory_size),
            color: getUseColor(res.total_in_use?.memory_size, res.total?.memory_size),
          },
          {
            key: 'sysRes',
            label: 'System Reserved',
            value: res.system_reserved?.memory_size ?? 0,
            displayValue: formatMB(res.system_reserved?.memory_size),
            color: 'bg-violet-400 dark:bg-violet-500',
          },
          {
            key: 'available',
            label: 'Available',
            value: res.total_available?.memory_size ?? 0,
            displayValue: formatMB(res.total_available?.memory_size),
            color: 'bg-emerald-400 dark:bg-emerald-500',
          },
        ]}
      />

      {diskTotal != null && (
        <>
          <div className="h-px bg-neutral-100 dark:bg-neutral-800/80 w-full" />
          <MultiProgressBar
            label="Disk"
            total={diskTotal}
            totalLabel={`${formatMB(diskTotal)} Total`}
            secondaryLabel={
              <>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">{formatMB(diskReserved)}</span> VM Allocated
              </>
            }
            series={[
              {
                key: 'inUse',
                label: 'In Use',
                value: diskInUse ?? 0,
                displayValue: formatMB(diskInUse),
                color: getUseColor(diskInUse, diskTotal),
              },
              {
                key: 'sysRes',
                label: 'System Reserved',
                value: diskSysReserved,
                displayValue: formatMB(diskSysReserved),
                color: 'bg-violet-400 dark:bg-violet-500',
              },
              {
                key: 'committed',
                label: 'VM Committed',
                value: diskCommitted,
                displayValue: formatMB(diskCommitted),
                color: 'bg-orange-400 dark:bg-orange-500',
              },
              {
                key: 'available',
                label: 'Available',
                value: diskAvailable ?? 0,
                displayValue: formatMB(diskAvailable),
                color: 'bg-emerald-400 dark:bg-emerald-500',
              },
            ]}
          />
        </>
      )}
    </div>
  );
}
