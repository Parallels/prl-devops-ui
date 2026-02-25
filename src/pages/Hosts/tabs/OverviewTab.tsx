import { formatMB, InfoRow, MultiProgressBar, SectionCard } from '@prl/ui-kit';
import { useNavigate } from 'react-router-dom';
import { DevOpsRemoteHost } from '@/interfaces/devops';

export function OverviewTab({ host }: { host: DevOpsRemoteHost }) {
    const navigate = useNavigate();
    const getUseColor = (inUse: number | undefined, total: number | undefined) => {
        const usePct = inUse && total ? (inUse / total) * 100 : 0;
        return usePct > 85 ? 'bg-rose-500' : usePct > 60 ? 'bg-amber-400' : 'bg-blue-500';
    };

    const isHealthy = host.state === 'healthy';
    const shouldBlur = !isHealthy;
    const diskTotal = host.detailed_resources?.total?.disk_size ?? host.detailed_resources?.total?.disk_count;
    const diskInUse = host.detailed_resources?.total_in_use?.disk_size ?? host.detailed_resources?.total_in_use?.disk_count;
    const diskReserved = host.detailed_resources?.total_reserved?.disk_size ?? host.detailed_resources?.total_reserved?.disk_count;
    const diskAvailable = host.detailed_resources?.total_available?.disk_size ?? host.detailed_resources?.total_available?.disk_count;

    return (
        <div className="p-4 space-y-4">

            <SectionCard title="Host Info" blur={shouldBlur}>
                <InfoRow label="CPU" value={host.cpu_model || host.architecture || 'Unknown'} />
                <InfoRow label="Architecture" value={host.architecture} />
                <InfoRow label="OS" value={`${host.os_name || ''} ${host.os_version || ''}`.trim() || 'Unknown'} />
                <InfoRow label="External IP" value={host.external_ip_address || host.host} />
            </SectionCard>
            <SectionCard title="Software" blur={shouldBlur}>
                <InfoRow label="Parallels Desktop" value={host.parallels_desktop_version || 'Unknown'} />
                <InfoRow label="DevOps" value={host.devops_version || 'Unknown'} />
            </SectionCard>

            <SectionCard title="Resources" blur={shouldBlur}>
                {/* VMs row with View All link */}
                <div className="flex items-center justify-between py-2.5 border-b border-neutral-100 dark:border-neutral-800">
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">VMs</span>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                            {host.vms?.length || 0}
                        </span>
                        {(host.vms?.length || 0) > 0 && (
                            <button
                                onClick={() => navigate('/vms')}
                                className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors"
                            >
                                View All &rsaquo;
                            </button>
                        )}
                    </div>
                </div>
                <MultiProgressBar
                    className=' py-2.5 border-b border-neutral-100 dark:border-neutral-800'
                    label="CPU Cores"
                    labelClassName='text-sm text-neutral-500 dark:text-neutral-400'
                    total={host.detailed_resources?.total?.logical_cpu_count ?? 0}
                    totalLabel={`${host.detailed_resources?.total?.logical_cpu_count ?? 0} Cores Total`}
                    secondaryLabel={<><span className="font-medium text-neutral-700 dark:text-neutral-300">{host.detailed_resources?.total_reserved?.logical_cpu_count ?? 0}</span> Cores Reserved by VMs</>}
                    series={[
                        {
                            key: 'inUse',
                            label: 'In Use',
                            value: host.detailed_resources?.total_in_use?.logical_cpu_count ?? 0,
                            color: getUseColor(host.detailed_resources?.total_in_use?.logical_cpu_count, host.detailed_resources?.total?.logical_cpu_count)
                        },
                        {
                            key: 'sysRes',
                            label: 'System Reserved',
                            value: host.detailed_resources?.system_reserved?.logical_cpu_count ?? 0,
                            color: 'bg-violet-400 dark:bg-violet-500'
                        },
                        {
                            key: 'available',
                            label: 'Available',
                            value: host.detailed_resources?.total_available?.logical_cpu_count ?? 0,
                            color: 'bg-emerald-400 dark:bg-emerald-500'
                        }
                    ]}
                />
                <MultiProgressBar
                    className='py-2.5 border-b border-neutral-100 dark:border-neutral-800'
                    label="Memory"
                    labelClassName='text-sm text-neutral-500 dark:text-neutral-400'
                    total={host.detailed_resources?.total?.memory_size ?? 0}
                    totalLabel={`${formatMB(host.detailed_resources?.total?.memory_size)} Total`}
                    secondaryLabel={<><span className="font-medium text-neutral-700 dark:text-neutral-300">{formatMB(host.detailed_resources?.total_reserved?.memory_size)}</span> Reserved by VMs</>}
                    series={[
                        {
                            key: 'inUse',
                            label: 'In Use',
                            value: host.detailed_resources?.total_in_use?.memory_size ?? 0,
                            displayValue: formatMB(host.detailed_resources?.total_in_use?.memory_size),
                            color: getUseColor(host.detailed_resources?.total_in_use?.memory_size, host.detailed_resources?.total?.memory_size)
                        },
                        {
                            key: 'sysRes',
                            label: 'System Reserved',
                            value: host.detailed_resources?.system_reserved?.memory_size ?? 0,
                            displayValue: formatMB(host.detailed_resources?.system_reserved?.memory_size),
                            color: 'bg-violet-400 dark:bg-violet-500'
                        },
                        {
                            key: 'available',
                            label: 'Available',
                            value: host.detailed_resources?.total_available?.memory_size ?? 0,
                            displayValue: formatMB(host.detailed_resources?.total_available?.memory_size),
                            color: 'bg-emerald-400 dark:bg-emerald-500'
                        }
                    ]}
                />

                {diskTotal != null && (
                    <>
                        <div className="h-px bg-neutral-100 dark:bg-neutral-800/80 w-full" />
                        <MultiProgressBar
                            className='py-2.5 border-b border-neutral-100 dark:border-neutral-800'
                            label="Disk"
                            labelClassName='text-sm text-neutral-500 dark:text-neutral-400'
                            total={diskTotal}
                            totalLabel={`${formatMB(diskTotal)} Total`}
                            secondaryLabel={<><span className="font-medium text-neutral-700 dark:text-neutral-300">{formatMB(diskReserved)}</span> Reserved by VMs</>}
                            series={[
                                {
                                    key: 'inUse',
                                    label: 'In Use',
                                    value: diskInUse ?? 0,
                                    displayValue: formatMB(diskInUse),
                                    color: getUseColor(diskInUse, diskTotal)
                                },
                                {
                                    key: 'sysRes',
                                    label: 'System Reserved',
                                    value: host.detailed_resources?.system_reserved?.disk_size ?? host.detailed_resources?.system_reserved?.disk_count ?? 0,
                                    displayValue: formatMB(host.detailed_resources?.system_reserved?.disk_size ?? host.detailed_resources?.system_reserved?.disk_count),
                                    color: 'bg-violet-400 dark:bg-violet-500'
                                },
                                {
                                    key: 'available',
                                    label: 'Available',
                                    value: diskAvailable ?? 0,
                                    displayValue: formatMB(diskAvailable),
                                    color: 'bg-emerald-400 dark:bg-emerald-500'
                                }
                            ]}
                        />
                    </>
                )}
            </SectionCard>
        </div>
    );
}
