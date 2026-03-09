import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
    EmptyState,
    IconButton,
    Pill,
    SearchBar,
    SidePanel,
    SplitView,
    Table,
    type Column,
    type SplitViewItem,
} from '@prl/ui-kit';
import { devopsService } from '@/services/devops';
import { VirtualMachine } from '@/interfaces/VirtualMachine';
import { useSession } from '@/contexts/SessionContext';
import { PageHeader } from '@/components/PageHeader';
import { useEventsHub } from '@/contexts/EventsHubContext';
import { VmDetailContent } from './VmDetailPanel';
import { CloneVmModal, DeleteVmModal } from './VmModals';
import { OsIcon } from '@/utils/virtualMachine';
import { useLocation } from 'react-router-dom';
import { useNavigateTo } from '@/hooks/useNavigateTo';
import type { VmsDeepLinkState } from '@/types/deepLink';
import { getStateTone, parseVmReferenceBody, parseVmStateChangeBody, parseVmUptimeChangeBody, sortVirtualMachines, upsertVirtualMachine } from '@/utils/vmUtils';
import { drainUnseenMessages } from '@/utils/messageQueue';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';


// ── Table columns ──────────────────────────────────────────────────────────

const baseColumns: Column<VirtualMachine>[] = [
    {
        id: 'os',
        header: 'OS',
        accessor: 'OS',
        sortable: true,
        sortValue: (row) => row.OS ?? '',
        align: 'center',
        width: 56,
        render: (row) => (
            <div className="flex items-center justify-center">
                <OsIcon os={row.OS} />
            </div>
        ),
    },
    {
        id: 'name',
        header: 'Name',
        accessor: 'Name',
        sortable: true,
        sortValue: (row) => row.Name ?? '',
        render: (row) => (
            <div className="flex flex-col">
                <span className="font-medium">{row.Name ?? '—'}</span>
                <span className="text-xs text-neutral-400 dark:text-neutral-500">{row.ID ?? '—'}</span>
            </div>
        ),
    },
    {
        id: 'state',
        header: 'State',
        accessor: 'State',
        sortable: true,
        align: 'center',
        width: 110,
        render: (row) => (
            <Pill size="sm" tone={getStateTone(row.State)} variant="soft">
                {row.State ?? 'Unknown'}
            </Pill>
        ),
    },
    {
        id: 'internal_ip',
        header: 'Internal IP',
        accessor: 'internal_ip_address',
        maxWidth: 200,
        align: 'center',
        render: (row) => (
            <span className="font-mono text-xs text-neutral-400 dark:text-neutral-500 truncate block max-w-[180px]">
                {String(row.internal_ip_address ?? '—')}
            </span>
        ),
    },
    {
        id: 'external_ip',
        header: 'External IP',
        accessor: 'host_external_ip_address',
        maxWidth: 200,
        align: 'center',
        render: (row) => (
            <span className="font-mono text-xs text-neutral-400 dark:text-neutral-500 truncate block max-w-[180px]">
                {String(row.host_external_ip_address ?? '—')}
            </span>
        ),
    },
    {
        id: 'description',
        header: 'Description',
        accessor: 'Description',
        render: (row) => (
            <span className="text-neutral-500 dark:text-neutral-400 truncate max-w-[260px] block">
                {row.Description || '—'}
            </span>
        ),
    },
];

// HostLink is a component so it can call useNavigateTo (hooks require components).
function HostLink({ hostId }: { hostId: string }) {
    const { toHost } = useNavigateTo();
    if (!hostId || hostId === '—') {
        return <span className="font-mono text-xs text-neutral-400 dark:text-neutral-500">—</span>;
    }
    return (
        <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toHost(hostId); }}
            title={`Go to host ${hostId}`}
            className="font-mono text-xs text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 hover:underline truncate block max-w-[180px] text-left"
        >
            {hostId}
        </button>
    );
}

const orchestratorColumns: Column<VirtualMachine>[] = [
    baseColumns[0], // os
    baseColumns[1], // name
    baseColumns[2], // state
    {
        id: 'host',
        header: 'Host',
        accessor: 'host_name',
        width: 200,
        render: (row) => <HostLink hostId={String(row.host_id ?? '—')} />,
    },
    {
        id: 'user',
        header: 'User',
        accessor: 'user',
        sortable: true,
        align: 'center',
        width: 130,
        render: (row) => (
            <span className="font-mono text-xs text-neutral-400 dark:text-neutral-500 truncate block max-w-[180px]">
                {String(row.user ?? 'Unknown')}
            </span>
        ),
    },
    baseColumns[3], // internal_ip
    baseColumns[4], // external_ip
];

const localColumns: Column<VirtualMachine>[] = [
    baseColumns[0], // os
    baseColumns[1], // name
    baseColumns[2], // state
    baseColumns[3], // internal_ip
    baseColumns[4], // external_ip
];

// ── VM table panel (header + sticky-search + scrollable table) ─────────────

interface VmTablePanelProps {
    title: string;
    columns: Column<VirtualMachine>[];
    data: VirtualMachine[];
    defaultSort?: { columnId: string; direction: 'asc' | 'desc' };
    emptyTitle: string;
    emptySubtitle: string;
    onRowClick: (vm: VirtualMachine) => void;
}

function VmTablePanel({ title, columns, data, defaultSort, emptyTitle, emptySubtitle, onRowClick }: VmTablePanelProps) {
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return data;
        return data.filter((vm) =>
            (vm.Name ?? '').toLowerCase().includes(q) ||
            (vm.ID ?? '').toLowerCase().includes(q) ||
            (vm.State ?? '').toLowerCase().includes(q) ||
            (vm.OS ?? '').toLowerCase().includes(q) ||
            (vm.user ?? '').toLowerCase().includes(q)
        );
    }, [data, search]);

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <PageHeader
                title={title}
                subtitle={
                    filtered.length === data.length
                        ? `${data.length} machine${data.length !== 1 ? 's' : ''}`
                        : `${filtered.length} of ${data.length} machines`
                }
                search={
                    <SearchBar
                        leadingIcon="Search"
                        variant="gradient"
                        glowIntensity="soft"
                        onSearch={setSearch}
                        placeholder="Search VMs…"
                    />
                }
            />

            {/* Scrollable table */}
            <div className="flex-1 min-h-0">
                <Table<VirtualMachine>
                    columns={columns}
                    data={filtered}
                    rowKey={(row) => row.ID ?? Math.random().toString()}
                    hoverable
                    noBorders
                    fullHeight
                    stickyHeader
                    variant="flat"
                    defaultSort={defaultSort}
                    onRowClick={onRowClick}
                    emptyState={
                        <EmptyState
                            icon="Container"
                            title={emptyTitle}
                            subtitle={emptySubtitle}
                        />
                    }
                />
            </div>
        </div>
    );
}

// ── Types ──────────────────────────────────────────────────────────────────

interface SelectedVm {
    vm: VirtualMachine;
    isOrchestrator: boolean;
}

interface PendingVmAction {
    type: 'clone' | 'delete';
    vm: VirtualMachine;
    isOrchestrator: boolean;
}

// ── Page component ─────────────────────────────────────────────────────────

export const Vms: React.FC = () => {
    const { themeColor } = useSystemSettings();
    const [orchestratorVms, setOrchestratorVms] = useState<VirtualMachine[]>([]);
    const [localVms, setLocalVms] = useState<VirtualMachine[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>();
    const [selectedVm, setSelectedVm] = useState<SelectedVm | null>(null);
    const [pendingAction, setPendingAction] = useState<PendingVmAction | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const { session, hasModule } = useSession();
    const { containerMessages } = useEventsHub();
    const location = useLocation();
    const deepLink = location.state as VmsDeepLinkState | null;
    const lastPdfmEventIdRef = useRef<string | null>(null);
    const lastOrchestratorEventIdRef = useRef<string | null>(null);
    const deepLinkConsumedRef = useRef(false);

    const fetchVms = useCallback(async () => {
        setLoading(true);
        setError(null);
        setSelectedVm(null);
        try {
            const [orchestrator, local] = await Promise.all([
                hasModule('orchestrator') ? devopsService.machines.getVirtualMachines(session?.hostname ?? '', true).catch(() => [] as VirtualMachine[]) : [],
                hasModule('host') ? devopsService.machines.getVirtualMachines(session?.hostname ?? '', false).catch(() => [] as VirtualMachine[]) : [],
            ]);
            setOrchestratorVms(sortVirtualMachines(orchestrator));
            setLocalVms(sortVirtualMachines(local));
        } catch (err: any) {
            setError(err?.message ?? 'Failed to load virtual machines');
        } finally {
            setLoading(false);
        }
    }, [session?.hostname]);

    useEffect(() => { void fetchVms(); }, [fetchVms]);

    // Auto-select the first available group after loading (skip when deep-linking)
    useEffect(() => {
        if (loading || selectedGroupId || deepLink?.selectVmId) return;
        if (localVms.length > 0) setSelectedGroupId('local');
        else if (orchestratorVms.length > 0) setSelectedGroupId('orchestrator');
    }, [loading, orchestratorVms.length, localVms.length, selectedGroupId, deepLink?.selectVmId]);

    // Consume deep-link state once VMs have loaded
    useEffect(() => {
        if (deepLinkConsumedRef.current || loading || !deepLink?.selectVmId) return;

        const vmId = deepLink.selectVmId;
        let vm = orchestratorVms.find((v) => v.ID === vmId);
        let isOrchestrator = true;
        if (!vm) {
            vm = localVms.find((v) => v.ID === vmId);
            isOrchestrator = false;
        }
        if (!vm) return; // VM not yet in state — wait for next render

        deepLinkConsumedRef.current = true;
        const groupId = deepLink.selectGroupId ?? (isOrchestrator ? 'orchestrator' : 'local');
        setSelectedGroupId(groupId);
        setSelectedVm({ vm, isOrchestrator });
    }, [loading, deepLink, orchestratorVms, localVms]);

    // ── Real-time VM state updates (orchestrator) ───────────────────────────
    // HOST_VM_STATE_CHANGED carries the new state directly — patch in-place, no API call.
    useEffect(() => {
        const msgs = containerMessages['orchestrator'];
        const unseen = drainUnseenMessages(msgs, lastOrchestratorEventIdRef);
        if (unseen.length === 0) return;

        for (const msg of unseen) {
            const { raw } = msg;
            if (raw.message === 'HOST_VM_ADDED') {
                const { vmId } = parseVmReferenceBody(raw.body);
                if (!vmId || !session?.hostname) continue;

                devopsService.machines
                    .getVirtualMachine(session.hostname, vmId, true)
                    .then((added) => {
                        setOrchestratorVms((prev) => upsertVirtualMachine(prev, added));
                        setSelectedVm((prev) => prev?.vm.ID === vmId
                            ? { vm: added, isOrchestrator: true }
                            : prev);
                    })
                    .catch((err) => console.warn('[Vms] Failed to fetch added orchestrator VM:', err));
                continue;
            }

            if (raw.message === 'HOST_VM_REMOVED') {
                const { vmId } = parseVmReferenceBody(raw.body);
                if (!vmId) continue;

                setOrchestratorVms((prev) => prev.filter((vm) => vm.ID !== vmId));
                setSelectedVm((prev) => prev?.vm.ID === vmId ? null : prev);
                continue;
            }

            if (raw.message !== 'HOST_VM_STATE_CHANGED') continue;

            const { vmId, currentState } = parseVmStateChangeBody(raw.body);
            if (!vmId || !currentState) continue;

            setOrchestratorVms((prev) => prev.map((vm) => vm.ID === vmId ? { ...vm, State: currentState } : vm));
            setSelectedVm((prev) => prev?.vm.ID === vmId ? { ...prev, vm: { ...prev.vm, State: currentState } } : prev);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [containerMessages['orchestrator']]);

    // ── Real-time VM updates (local / pdfm) ─────────────────────────────────
    // Handle both VM_STATE_CHANGED and VM_UPTIME_CHANGED in-place; fall back to
    // a VM fetch only when state payload is incomplete.
    useEffect(() => {
        const msgs = containerMessages['pdfm'];
        const unseen = drainUnseenMessages(msgs, lastPdfmEventIdRef);
        if (unseen.length === 0) return;

        for (const msg of unseen) {
            const { raw } = msg;
            if (raw.message === 'VM_ADDED') {
                const { vmId } = parseVmReferenceBody(raw.body);
                if (!vmId || !session?.hostname) continue;

                devopsService.machines
                    .getVirtualMachine(session.hostname, vmId, false)
                    .then((added) => {
                        setLocalVms((prev) => upsertVirtualMachine(prev, added));
                        setSelectedVm((prev) => prev?.vm.ID === vmId
                            ? { vm: added, isOrchestrator: false }
                            : prev);
                    })
                    .catch((err) => console.warn('[Vms] Failed to fetch added local VM:', err));
                continue;
            }

            if (raw.message === 'VM_REMOVED') {
                const { vmId } = parseVmReferenceBody(raw.body);
                if (!vmId) continue;

                setLocalVms((prev) => prev.filter((vm) => vm.ID !== vmId));
                setSelectedVm((prev) => prev?.vm.ID === vmId ? null : prev);
                continue;
            }

            if (raw.message === 'VM_UPTIME_CHANGED') {
                const { vmId, uptime } = parseVmUptimeChangeBody(raw.body);
                if (!vmId || !uptime) continue;

                setOrchestratorVms((prev) => prev.map((vm) => vm.ID === vmId ? { ...vm, Uptime: uptime } : vm));
                setLocalVms((prev) => prev.map((vm) => vm.ID === vmId ? { ...vm, Uptime: uptime } : vm));
                setSelectedVm((prev) => prev?.vm.ID === vmId ? { ...prev, vm: { ...prev.vm, Uptime: uptime } } : prev);
                continue;
            }

            if (raw.message !== 'VM_STATE_CHANGED') continue;

            const { vmId, currentState } = parseVmStateChangeBody(raw.body);
            if (!vmId) continue;

            if (currentState) {
                setOrchestratorVms((prev) => prev.map((vm) => vm.ID === vmId ? { ...vm, State: currentState } : vm));
                setLocalVms((prev) => prev.map((vm) => vm.ID === vmId ? { ...vm, State: currentState } : vm));
                setSelectedVm((prev) => prev?.vm.ID === vmId ? { ...prev, vm: { ...prev.vm, State: currentState } } : prev);
                continue;
            }

            if (!session?.hostname) continue;

            const inOrchestrator = orchestratorVms.some((vm) => vm.ID === vmId);
            const inLocal = localVms.some((vm) => vm.ID === vmId);
            if (!inOrchestrator && !inLocal) continue;

            devopsService.machines
                .getVirtualMachine(session.hostname, vmId, inOrchestrator)
                .then((updated) => {
                    if (inOrchestrator) {
                        setOrchestratorVms((prev) => prev.map((vm) => vm.ID === vmId ? updated : vm));
                    } else {
                        setLocalVms((prev) => prev.map((vm) => vm.ID === vmId ? updated : vm));
                    }
                    setSelectedVm((prev) => prev?.vm.ID === vmId ? { ...prev, vm: updated } : prev);
                })
                .catch((err) => console.warn('[Vms] Failed to refresh VM after state change:', err));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [containerMessages['pdfm']]);

    // ── Modal action handlers ───────────────────────────────────────────────

    const handleCloneConfirm = useCallback(async (cloneName: string, destinationPath: string) => {
        if (!pendingAction) return;
        setModalLoading(true);
        try {
            await devopsService.machines.cloneVirtualMachine(
                session?.hostname ?? '',
                pendingAction.vm.ID ?? '',
                cloneName,
                destinationPath,
                pendingAction.isOrchestrator,
            );
            setPendingAction(null);
            void fetchVms();
        } catch (err: any) {
            setError(err?.message ?? 'Failed to clone virtual machine');
            setPendingAction(null);
        } finally {
            setModalLoading(false);
        }
    }, [pendingAction, session?.hostname, fetchVms]);

    const handleDeleteConfirm = useCallback(async () => {
        if (!pendingAction) return;
        setModalLoading(true);
        try {
            await devopsService.machines.removeVirtualMachine(
                session?.hostname ?? '',
                pendingAction.vm.ID ?? '',
                pendingAction.isOrchestrator,
            );
            setPendingAction(null);
            setSelectedVm(null);
            void fetchVms();
        } catch (err: any) {
            setError(err?.message ?? 'Failed to delete virtual machine');
            setPendingAction(null);
        } finally {
            setModalLoading(false);
        }
    }, [pendingAction, session?.hostname, fetchVms]);

    const handleGroupChange = useCallback((id: string) => {
        setSelectedGroupId(id);
        setSelectedVm(null);
    }, []);

    const items = useMemo<SplitViewItem[]>(() => {
        const result: SplitViewItem[] = [];
        if (localVms.length > 0) {
            result.push({
                id: 'local',
                label: 'Local VMs',
                subtitle: `${localVms.length} machine${localVms.length !== 1 ? 's' : ''}`,
                icon: 'VirtualMachine',
                panel: (
                    <VmTablePanel
                        title="Local VMs"
                        columns={localColumns}
                        data={localVms}
                        defaultSort={{ columnId: 'name', direction: 'asc' }}
                        emptyTitle="No local VMs"
                        emptySubtitle="No virtual machines found on the local host."
                        onRowClick={(vm) => setSelectedVm({ vm, isOrchestrator: false })}
                    />
                ),
            });
        }
        if (orchestratorVms.length > 0) {
            result.push({
                id: 'orchestrator',
                label: 'Orchestrator VMs',
                subtitle: `${orchestratorVms.length} machine${orchestratorVms.length !== 1 ? 's' : ''}`,
                icon: 'VirtualMachine',
                panel: (
                    <VmTablePanel
                        title="Orchestrator VMs"
                        columns={orchestratorColumns}
                        data={orchestratorVms}
                        defaultSort={{ columnId: 'name', direction: 'asc' }}
                        emptyTitle="No orchestrator VMs"
                        emptySubtitle="No virtual machines found on the orchestrator."
                        onRowClick={(vm) => setSelectedVm({ vm, isOrchestrator: true })}
                    />
                ),
            });
        }

        return result;
    }, [orchestratorVms, localVms]);

    return (
        <div className="relative flex h-full min-h-0">
            {/* ── SplitView ─────────────────────────────────────────── */}
            <SplitView
                className="flex-1 min-w-0"
                items={items}
                value={selectedGroupId}
                onChange={(id) => handleGroupChange(id)}
                loading={loading}
                error={error}
                onRetry={() => void fetchVms()}
                listTitle="Virtual Machines"
                autoHideList={false}
                borderLeft
                color={themeColor}
                collapsible
                resizable
                panelScrollable={false}
                searchPlaceholder="Search groups..."
                panelEmptyState={
                    <EmptyState icon="Container" title="No virtual machines"
                        subtitle="No virtual machines were found on the connected host." />
                }
                listActions={
                    <IconButton variant="ghost" size="xs" color={themeColor}
                        aria-label="Refresh"
                        icon="Restart" onClick={() => void fetchVms()} />
                }
            />

            {/* ── SidePanel ─────────────────────────────────────────── */}
            <SidePanel
                isOpen={!!selectedVm}
                onClose={() => setSelectedVm(null)}
                title={selectedVm?.vm.Name ?? 'VM Details'}
                subtitle={selectedVm?.vm.ID}
                width={460}
                headerActions={
                    <>
                        {selectedVm?.vm.State === 'stopped' && (
                            <IconButton
                                icon="Clone" size="sm" variant="ghost" color="blue"
                                aria-label="Clone VM"
                                onClick={() => selectedVm && setPendingAction({
                                    type: 'clone',
                                    vm: selectedVm.vm,
                                    isOrchestrator: selectedVm.isOrchestrator,
                                })}
                            />
                        )}
                        {selectedVm?.vm.State === 'stopped' && (
                            <IconButton
                                icon="Trash" size="sm" variant="ghost" color="rose"
                                aria-label="Delete VM"
                                onClick={() => selectedVm && setPendingAction({
                                    type: 'delete',
                                    vm: selectedVm.vm,
                                    isOrchestrator: selectedVm.isOrchestrator,
                                })}
                            />
                        )}
                    </>
                }
            >
                {selectedVm && (
                    <VmDetailContent
                        vm={selectedVm.vm}
                        hostname={session?.hostname ?? ''}
                        isOrchestrator={selectedVm.isOrchestrator}
                    />
                )}
            </SidePanel>

            {/* ── Modals ────────────────────────────────────────────── */}
            <CloneVmModal
                isOpen={pendingAction?.type === 'clone'}
                vm={pendingAction?.vm ?? null}
                loading={modalLoading}
                onClose={() => setPendingAction(null)}
                onConfirm={(name, path) => void handleCloneConfirm(name, path)}
            />

            <DeleteVmModal
                isOpen={pendingAction?.type === 'delete'}
                vm={pendingAction?.vm ?? null}
                loading={modalLoading}
                onClose={() => setPendingAction(null)}
                onConfirm={() => void handleDeleteConfirm()}
            />
        </div>
    );
};
