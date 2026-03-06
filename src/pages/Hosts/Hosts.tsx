import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
    DeleteConfirmModal,
    EmptyState,
    IconButton,
    NotificationModal,
    Pill,
    SplitView,
    type SplitViewItem,
} from '@prl/ui-kit';
import { useSession } from '@/contexts/SessionContext';
import { useEventsHub } from '@/contexts/EventsHubContext';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { Claims } from '@/interfaces/tokenTypes';
import { HostDetailPanel } from './HostDetailPanel';
import { AddHostModal, type AddHostFormData } from './AddHostModal';
import { devopsService } from '@/services/devops';
import { DevOpsRemoteHost } from '@/interfaces/devops';
import { OsIcon } from '@/utils/virtualMachine';
import { useNavigateTo } from '@/hooks/useNavigateTo';
import type { HostsDeepLinkState } from '@/types/deepLink';
import { VirtualMachine } from '@/interfaces/VirtualMachine';
import { getStateTone, parseVmReferenceBody, parseVmStateChangeBody, parseVmUptimeChangeBody, sortVirtualMachines, upsertVirtualMachine } from '@/utils/vmUtils';
import { drainUnseenMessages } from '@/utils/messageQueue';

// ── Helpers ───────────────────────────────────────────────────────────────────

function HostItemLabel({ host }: { host: DevOpsRemoteHost }) {
    const enableTone = host.enabled === false ? 'amber' : 'emerald';
    const stateTone = host.state === 'healthy' ? 'emerald' : 'rose';
    const hostName = host.description ? host.description : host.host;
    return (
        <div className="flex gap-2 flex-1 w-full flex-col">
            <span className="flex-grow font-medium truncate">{hostName}</span>
            <div className="flex flex-wrap items-center gap-1">
                <Pill size="sm" tone={stateTone as any} variant="soft">
                    {host.state.charAt(0).toUpperCase() + host.state.slice(1)}
                </Pill>
                <Pill size="sm" tone={enableTone as any} variant="soft">
                    {host.enabled === false ? 'Disabled' : 'Enabled'}
                </Pill>
                {(host.tags?.length ?? 0) > 0 ? (host.tags?.map((tag) => (
                    tag !== '' && (
                        <Pill key={tag} size="sm" tone="sky" variant="soft">
                            {tag}
                        </Pill>
                    )
                ))) : (
                    undefined
                )}
            </div>
        </div>
    );
}

function HostSubtitleLabel({ host }: { host: DevOpsRemoteHost }) {
    if (host.vms?.length ?? 0 > 0) {
        return (
            <div className="flex gap-2 min-w-0 flex-1 w-full flex-col text-neutral-400 mt-2">
                {`${host.vms?.length || 0} VM${host.vms?.length !== 1 ? 's' : ''}`}
            </div>
        );
    }
    return undefined;
}

// ── Page component ────────────────────────────────────────────────────────────

export const Hosts: React.FC = () => {
    const { hasClaim, session } = useSession();
    const { containerMessages } = useEventsHub();
    const { themeColor } = useSystemSettings();
    const canCreate = hasClaim(Claims.CREATE_REVERSE_PROXY_HOST);
    const { toVm } = useNavigateTo();
    const location = useLocation();
    const deepLink = location.state as HostsDeepLinkState | null;
    const deepLinkConsumedRef = useRef(false);
    const lastOrchestratorEventIdRef = useRef<string | null>(null);
    const lastPdfmEventIdRef = useRef<string | null>(null);

    const [hosts, setHosts] = useState<DevOpsRemoteHost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | undefined>();

    const [keyToDelete, setKeyToDelete] = useState<DevOpsRemoteHost | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [showAddModal, setShowAddModal] = useState(false);
    const [addResult, setAddResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    async function mapRemoteHost(h: DevOpsRemoteHost): Promise<DevOpsRemoteHost> {
        let hostVms: VirtualMachine[] = [];
        if (h.state == 'healthy') {
            const data = await devopsService.orchestrator.getOrchestratorVMs(session?.hostname ?? '', h.id ?? '');
            hostVms = sortVirtualMachines(data ?? []);
        }
        return {
            ...h,
            id: h.id ?? `host-${Math.random()}`,
            host: h.host ?? h.id ?? 'Unknown',
            enabled: h.enabled ?? true,
            state: h.state ?? 'healthy',
            vms: hostVms,
        };
    }

    const fetchHosts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await devopsService.orchestrator.getOrchestratorHosts(session?.hostname ?? '');
            setHosts(await Promise.all(data.map(mapRemoteHost)));
        } catch (err: any) {
            setError(err?.message ?? 'Failed to load hosts');
        } finally {
            setLoading(false);
        }
    }, [session?.hostname]);

    useEffect(() => { void fetchHosts(); }, [fetchHosts]);

    const applyVmStateChange = useCallback((vmId: string, currentState: string, hostId?: string) => {
        setHosts((prev) => prev.map((host) => {
            if (hostId && host.id !== hostId) return host;

            const vms = host.vms ?? [];
            let changed = false;
            const updatedVms = vms.map((vm) => {
                if (vm.ID !== vmId) return vm;
                changed = true;
                return vm.State === currentState ? vm : { ...vm, State: currentState };
            });

            if (!changed) return host;
            return { ...host, vms: updatedVms };
        }));
    }, []);

    const applyVmUptimeChange = useCallback((vmId: string, uptime: string, hostId?: string) => {
        setHosts((prev) => prev.map((host) => {
            if (hostId && host.id !== hostId) return host;

            const vms = host.vms ?? [];
            let changed = false;
            const updatedVms = vms.map((vm) => {
                if (vm.ID !== vmId) return vm;
                changed = true;
                return vm.Uptime === uptime ? vm : { ...vm, Uptime: uptime };
            });

            if (!changed) return host;
            return { ...host, vms: updatedVms };
        }));
    }, []);

    const applyVmAddition = useCallback((vm: VirtualMachine, hostId?: string) => {
        const resolvedHostId = hostId ?? (typeof vm.host_id === 'string' ? vm.host_id : undefined);
        if (!resolvedHostId) return;

        setHosts((prev) => prev.map((host) => {
            if (host.id !== resolvedHostId) return host;
            const updatedVms = upsertVirtualMachine(host.vms ?? [], vm);
            return { ...host, vms: updatedVms };
        }));
    }, []);

    const applyVmRemoval = useCallback((vmId: string, hostId?: string) => {
        setHosts((prev) => prev.map((host) => {
            if (hostId && host.id !== hostId) return host;

            const vms = host.vms ?? [];
            const updatedVms = vms.filter((vm) => vm.ID !== vmId);
            if (updatedVms.length === vms.length) return host;
            return { ...host, vms: updatedVms };
        }));
    }, []);

    // ── Real-time VM state updates ──────────────────────────────────────────
    // Apply VM state changes from orchestrator events directly into the host VM
    // lists without re-fetching.
    useEffect(() => {
        const msgs = containerMessages['orchestrator'];
        const unseen = drainUnseenMessages(msgs, lastOrchestratorEventIdRef);
        if (unseen.length === 0) return;

        for (const msg of unseen) {
            const { raw } = msg;

            if (raw.message === 'HOST_VM_STATE_CHANGED' || raw.message === 'VM_STATE_CHANGED') {
                const { hostId, vmId, currentState } = parseVmStateChangeBody(raw.body);
                if (!vmId || !currentState) continue;
                applyVmStateChange(vmId, currentState, hostId);
            } else if (raw.message === 'HOST_VM_ADDED' || raw.message === 'VM_ADDED') {
                const { hostId, vmId } = parseVmReferenceBody(raw.body);
                if (!vmId || !session?.hostname) continue;

                devopsService.machines
                    .getVirtualMachine(session.hostname, vmId, true)
                    .then((vm) => applyVmAddition(vm, hostId))
                    .catch((err) => console.warn('[Hosts] Failed to fetch added orchestrator VM:', err));
            } else if (raw.message === 'HOST_VM_UPTIME_CHANGED' || raw.message === 'VM_UPTIME_CHANGED') {
                const { hostId, vmId, uptime } = parseVmUptimeChangeBody(raw.body);
                if (!vmId || !uptime) continue;
                applyVmUptimeChange(vmId, uptime, hostId);
            } else if (raw.message === 'HOST_VM_REMOVED' || raw.message === 'VM_REMOVED') {
                const { hostId, vmId } = parseVmReferenceBody(raw.body);
                if (!vmId) continue;
                applyVmRemoval(vmId, hostId);
            } else if (raw.message === 'HOST_HEALTH_UPDATE') {
                const hostId = raw.body?.host_id as string | undefined;
                const state = raw.body?.state as 'healthy' | 'unhealthy' | undefined;
                if (!hostId || !state) continue;

                if (state === 'healthy') {
                    // If it became healthy, we need to fetch the full host again to get its VMs and full status
                    const existingHost = hosts.find(h => h.id === hostId);
                    if (existingHost) {
                        void mapRemoteHost({ ...existingHost, state }).then(mappedHost => {
                            setHosts(prev => prev.map(host => host.id === hostId ? mappedHost : host));
                        });
                    }
                } else {
                    setHosts((prev) => prev.map((host) => {
                        if (host.id !== hostId) return host;
                        return { ...host, state: state };
                    }));
                }
            } else if (raw.message === 'HOST_WEBSOCKET_DISCONNECTED') {
                const hostId = raw.body?.host_id as string | undefined;
                if (!hostId) continue;

                setHosts((prev) => prev.map((host) => {
                    if (host.id !== hostId) return host;
                    return { ...host, state: 'unhealthy' };
                }));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [containerMessages['orchestrator']]);

    // Some deployments emit VM updates on pdfm with vm_id in body. Apply state
    // and uptime changes against host VM lists without re-fetching.
    useEffect(() => {
        const msgs = containerMessages['pdfm'];
        const unseen = drainUnseenMessages(msgs, lastPdfmEventIdRef);
        if (unseen.length === 0) return;

        for (const msg of unseen) {
            const { raw } = msg;
            if (raw.message === 'VM_ADDED') {
                const { hostId, vmId } = parseVmReferenceBody(raw.body);
                if (!vmId || !session?.hostname) continue;

                devopsService.machines
                    .getVirtualMachine(session.hostname, vmId, false)
                    .then((vm) => applyVmAddition(vm, hostId))
                    .catch((err) => console.warn('[Hosts] Failed to fetch added local VM:', err));
                continue;
            }

            if (raw.message === 'VM_STATE_CHANGED') {
                const { hostId, vmId, currentState } = parseVmStateChangeBody(raw.body);
                if (!vmId || !currentState) continue;
                applyVmStateChange(vmId, currentState, hostId);
                continue;
            }

            if (raw.message === 'VM_UPTIME_CHANGED') {
                const { hostId, vmId, uptime } = parseVmUptimeChangeBody(raw.body);
                if (!vmId || !uptime) continue;
                applyVmUptimeChange(vmId, uptime, hostId);
                continue;
            }

            if (raw.message === 'VM_REMOVED') {
                const { hostId, vmId } = parseVmReferenceBody(raw.body);
                if (!vmId) continue;
                applyVmRemoval(vmId, hostId);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [containerMessages['pdfm']]);

    // Consume deep-link state once hosts have loaded
    useEffect(() => {
        if (deepLinkConsumedRef.current || loading || !deepLink?.selectHostId) return;
        const host = hosts.find((h) => h.id === deepLink.selectHostId);
        if (!host) return;
        deepLinkConsumedRef.current = true;
        setSelectedId(host.id);
    }, [loading, deepLink, hosts]);

    const handlePause = useCallback((host: DevOpsRemoteHost) => {
        void devopsService.orchestrator.disableOrchestratorHost(session?.hostname ?? '', host.id ?? '')
            .then(() => void fetchHosts())
            .catch((err) => setError(err?.message ?? 'Failed to disable host'));
    }, [session?.hostname, fetchHosts]);

    const handleEnable = useCallback((host: DevOpsRemoteHost) => {
        void devopsService.orchestrator.enableOrchestratorHost(session?.hostname ?? '', host.id ?? '')
            .then(() => void fetchHosts())
            .catch((err) => setError(err?.message ?? 'Failed to enable host'));
    }, [session?.hostname, fetchHosts]);

    const handleRemoveCallback = useCallback((host: DevOpsRemoteHost) => {
        setKeyToDelete(host);
    }, []);

    const handleRemove = useCallback(async (host: DevOpsRemoteHost) => {
        if (!host.id) { setError('Host ID is required'); return; }
        try {
            setDeleting(true);
            setKeyToDelete(host);
            await devopsService.orchestrator.removeOrchestratorHost(session?.hostname ?? '', host.id);
            setHosts((prev) => prev.filter((h) => h.id !== host.id));
            setSelectedId((prev) => prev === host.id ? undefined : prev);
        } catch (err: any) {
            setError(err?.message ?? 'Failed to remove host');
        } finally {
            setDeleting(false);
            setKeyToDelete(null);
        }
    }, [session?.hostname]);

    const handleAddHost = useCallback(async (data: AddHostFormData) => {
        try {
            await devopsService.orchestrator.addOrchestratorHost(session?.hostname ?? '', {
                host: data.address,
                description: data.name,
            });
            setAddResult({ type: 'success', message: `"${data.name}" was successfully added.` });
            void fetchHosts();
        } catch (err: any) {
            setAddResult({ type: 'error', message: err?.message ?? 'Failed to add host.' });
        }
    }, [session?.hostname, fetchHosts]);

    const items = useMemo<SplitViewItem[]>(() =>
        hosts.map((host) => ({
            id: host.id ?? '',
            label: <HostItemLabel host={host} />,
            subtitle: HostSubtitleLabel({ host }),
            icon: 'Host' as const,
            panel: (
                <HostDetailPanel
                    host={host}
                    onPause={handlePause}
                    onRemove={handleRemoveCallback}
                    onEnable={handleEnable}
                />
            ),
            subContent: (host.vms && host.vms.length > 0) ? (
                <div className="border-t border-gray-100 dark:border-gray-800">
                    {host.vms.map((vm) => (
                        <div
                            key={vm.ID as string}
                            role="button"
                            tabIndex={0}
                            title="Open in VMs page"
                            onClick={() => toVm(vm.ID as string, 'orchestrator')}
                            onKeyDown={(e) => e.key === 'Enter' && toVm(vm.ID as string, 'orchestrator')}
                            className="flex items-center py-2 pl-6 truncate w-full px-4 hover:bg-gray-200/60 dark:hover:bg-gray-800/40 cursor-pointer max-h-12"
                        >
                            <div className="flex  h-full p-2">
                                <OsIcon os={vm.OS as string} />
                            </div>
                            <div className="flex flex-col w-full truncate">
                                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate">
                                    {vm.Name as React.ReactNode} <Pill size="sm" tone={getStateTone(vm.State)}>{vm.State as React.ReactNode}</Pill>
                                </span>
                                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono truncate">{vm.ID as React.ReactNode}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : undefined,
        })),
        [hosts, handlePause, handleRemove]
    );

    return (
        <div className="relative flex h-full min-h-0">
            <SplitView
                className="flex-1 min-w-0"
                items={items}
                value={selectedId}
                onChange={(id) => setSelectedId(id)}
                loading={loading}
                error={error ?? undefined}
                onRetry={() => void fetchHosts()}
                listTitle={`Hosts (${hosts.length})`}
                autoHideList={false}
                borderLeft
                color={themeColor}
                collapsible
                resizable
                autoExpand={false}
                minListWidth={220}
                searchPlaceholder="Search hosts..."
                panelEmptyState={
                    <EmptyState
                        disableBorder
                        icon="Host"
                        title="Select a host"
                        subtitle="Choose a host from the list to view its details."
                        tone="neutral"
                    />
                }
                listActions={
                    <>
                        {canCreate && (
                            <IconButton
                                variant="ghost"
                                size="xs"
                                color={themeColor}
                                icon="Add"
                                onClick={() => setShowAddModal(true)}
                                aria-label="Add host"
                            />
                        )}
                        <IconButton
                            variant="ghost"
                            size="xs"
                            color={themeColor}
                            icon="Restart"
                            onClick={() => void fetchHosts()}
                            aria-label="Refresh hosts"
                        />
                    </>
                }
            />

            <AddHostModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSubmit={handleAddHost}
            />

            <DeleteConfirmModal
                isOpen={!!keyToDelete}
                onClose={() => setKeyToDelete(null)}
                onConfirm={() => keyToDelete && void handleRemove(keyToDelete)}
                title="Delete Host"
                icon="Trash"
                confirmLabel={deleting ? 'Deleting…' : 'Delete'}
                isConfirmDisabled={deleting}
                confirmValue={keyToDelete?.description ?? keyToDelete?.host ?? ''}
                confirmValueLabel="host name"
                size="md"
            >
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    This action is irreversible. Any applications using this host will immediately lose access.
                </p>
            </DeleteConfirmModal>

            <NotificationModal
                isOpen={!!addResult}
                onClose={() => setAddResult(null)}
                type={addResult?.type ?? 'info'}
                title={addResult?.type === 'success' ? 'Host Added' : 'Connection Failed'}
                message={addResult?.message ?? ''}
                actionLabel="OK"
            />
        </div>
    );
};
