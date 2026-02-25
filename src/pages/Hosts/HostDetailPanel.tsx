import React, { useState } from 'react';
import { Button, ConfirmModal, CustomIcon, HealthCheck, Live, Tabs, Pause, Run, Trash } from '@prl/ui-kit';
import { DevOpsRemoteHost } from '@/interfaces/devops';
import { PageHeader, PageHeaderIcon } from '@/components/PageHeader';
import { OverviewTab } from './tabs/OverviewTab';
import { PerformanceTab } from './tabs/PerformanceTab';
import { CacheTab } from './tabs/CacheTab';
import { LogsTab } from './tabs/LogsTab';
import { SettingsTab } from './tabs/SettingsTab';

// ── Types ────────────────────────────────────────────────────────────────────

export interface HostDetailPanelProps {
    host: DevOpsRemoteHost;
    onPause?: (host: DevOpsRemoteHost) => void;
    onRemove?: (host: DevOpsRemoteHost) => void;
    onEnable?: (host: DevOpsRemoteHost) => void;
}

function isHealthy(host: DevOpsRemoteHost): boolean {
    return host.state === 'healthy';
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export const HostDetailPanel: React.FC<HostDetailPanelProps> = ({ host, onPause, onRemove, onEnable }) => {
    const [pendingAction, setPendingAction] = useState<'disable' | 'enable' | null>(null);

    return (
        <div className="flex flex-col h-full min-h-0">
            <PageHeader
                icon={<PageHeaderIcon color="rose"><CustomIcon icon="Host" className="w-5 h-5" /></PageHeaderIcon>}
                title={host.description || host.host}
                subtitle={host.id}
                actions={<>
                    <HealthCheck className={`w-6 h-6 ${host.state === 'healthy' ? 'text-emerald-600' : 'text-rose-600'}`} aria-label={host.state === 'healthy' ? 'Healthy' : 'Unhealthy'} />
                    <Live className={`w-6 h-6 ${host.has_websocket_events ? 'text-emerald-600' : 'text-rose-600'}`} aria-label={host.has_websocket_events ? 'Live' : 'Offline'} />
                </>}
                bottomActions={<>
                    {host.enabled ? (
                        <Button
                            variant='solid'
                            color='amber'
                            size='sm'
                            aria-label="Disable Host"
                            onClick={() => setPendingAction('disable')}
                            leadingIcon={<Pause />}
                        >Disable</Button>
                    ) : (
                        <Button
                            variant='solid'
                            color='emerald'
                            size='sm'
                            aria-label="Enable Host"
                            onClick={() => setPendingAction('enable')}
                            leadingIcon={<Run />}
                        >Enable</Button>
                    )}
                    <Button
                        variant='solid'
                        color='rose'
                        size='sm'
                        aria-label="Remove Host"
                        onClick={() => onRemove?.(host)}
                        leadingIcon={<Trash />}
                    >Remove</Button>
                </>}
            />

            {/* Tabs */}
            <Tabs
                variant="underline"
                color="parallels"
                size="sm"
                className="flex-1 min-h-0"
                listClassName="bg-white dark:bg-neutral-900 px-1"
                panelClassName=""
                panelIdPrefix="host-detail"
                scrollFade
                items={[
                    { id: 'overview',     label: 'Overview',     panel: <OverviewTab host={host} /> },
                    ...(isHealthy(host) ? [
                        { id: 'cache',       label: 'Cache',        panel: <CacheTab host={host} /> },
                        { id: 'performance', label: 'Performance',  panel: <PerformanceTab host={host} /> },
                        { id: 'logs',        label: 'Logs',         panel: <LogsTab host={host} /> },
                    ] : []),
                    { id: 'settings',    label: 'Settings',     panel: <SettingsTab host={host} /> },
                ]}
            />

            <ConfirmModal
                isOpen={pendingAction !== null}
                onClose={() => setPendingAction(null)}
                onConfirm={() => {
                    if (pendingAction === 'disable') onPause?.(host);
                    else if (pendingAction === 'enable') onEnable?.(host);
                    setPendingAction(null);
                }}
                title={pendingAction === 'disable' ? 'Disable Host' : 'Enable Host'}
                icon={pendingAction === 'disable' ? 'Pause' : 'Run'}
                size="sm"
                confirmLabel={pendingAction === 'disable' ? 'Disable' : 'Enable'}
                confirmColor={pendingAction === 'disable' ? 'amber' : 'emerald'}
                description={
                    pendingAction === 'disable'
                        ? `${host.description || host.host} will stop receiving new workloads.`
                        : `${host.description || host.host} will be available for workloads again.`
                }
            >
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {pendingAction === 'disable'
                        ? 'Disabling this host will prevent it from being assigned new virtual machines. Any currently running VMs will not be affected.'
                        : 'Enabling this host will allow it to be assigned virtual machines and receive workloads again.'}
                </p>
            </ConfirmModal>
        </div>
    );
};
