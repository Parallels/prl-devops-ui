import React, { useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { Button, FormField, IconButton, Input, MultiToggle, ReverseProxyFrom, ReverseProxyTo, Select, VirtualMachine as VirtualMachineIcon, ConnectionFlow, type TreeTone } from '@prl/ui-kit';
import { ReverseProxyHost, ReverseProxyHostTcpRoute } from '@/interfaces/ReverseProxy';
import { VirtualMachine } from '@/interfaces/VirtualMachine';
import { devopsService } from '@/services/devops';
import { useSession } from '@/contexts/SessionContext';
import { useEventsHub } from '@/contexts/EventsHubContext';

// ── Types ─────────────────────────────────────────────────────────────────────

type TargetType = 'static' | 'vm';
type VmHealth = 'running' | 'stopped' | 'paused' | 'suspended' | 'unknown';

function getVmHealth(state?: string): VmHealth {
    const s = state?.toLowerCase();
    if (s === 'running') return 'running';
    if (s === 'stopped') return 'stopped';
    if (s === 'paused') return 'paused';
    if (s === 'suspended') return 'suspended';
    return 'unknown';
}

/** target_vm_id presence always wins — target_host may be set by the backend as the resolved VM IP */
const resolveTargetType = (route: Pick<ReverseProxyHostTcpRoute, 'target_vm_id'> | null | undefined): TargetType =>
    route?.target_vm_id ? 'vm' : 'static';

export interface TcpRouteViewProps {
    proxyHost: ReverseProxyHost;
    availableVms: VirtualMachine[];
    orchestratorHostId?: string;
    proxyEnabled: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    onSaveRoute: (route: Partial<ReverseProxyHostTcpRoute>) => Promise<void>;
    onClearRoute: () => void;
    onSaveSettings: (patch: Partial<ReverseProxyHost>) => Promise<void>;
}

// ── Tone helpers ──────────────────────────────────────────────────────────────

function healthToTone(health: VmHealth, proxyEnabled: boolean): TreeTone {
    if (!proxyEnabled) return 'neutral';
    switch (health) {
        case 'running': return 'emerald';
        case 'stopped': return 'rose';
        case 'paused':
        case 'suspended': return 'amber';
        default: return 'neutral';
    }
}

// ── Main Component ─────────────────────────────────────────────────────────────

export const TcpRouteView: React.FC<TcpRouteViewProps> = ({
    proxyHost,
    availableVms,
    orchestratorHostId,
    proxyEnabled,
    canCreate,
    canUpdate,
    onSaveRoute,
    onClearRoute,
    onSaveSettings,
}) => {
    const { session } = useSession();
    const hostname = session?.hostname ?? '';
    const { containerMessages } = useEventsHub();

    const tcpRoute = proxyHost.tcp_route;

    // VM health — updated by proxyHost prop and by the poll loop after Start/Resume
    const [localVmHealth, setLocalVmHealth] = useState<VmHealth>(() =>
        getVmHealth(tcpRoute?.target_vm_details?.state)
    );
    const [actionLoading, setActionLoading] = useState(false);

    // Polling refs — cleared on unmount or when proxyHost changes
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const pollCountRef = useRef(0);
    const POLL_INTERVAL_MS = 3_000;
    const MAX_POLLS = 20; // give up after ~60 s

    const stopPolling = useCallback(() => {
        if (pollRef.current !== null) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
        pollCountRef.current = 0;
    }, []);

    // Always clean up on unmount
    useEffect(() => () => stopPolling(), [stopPolling]);

    // De-dupe refs — avoid reacting to the same event twice
    const lastOrchestratorEventIdRef = useRef<string | null>(null);
    const lastPdfmEventIdRef = useRef<string | null>(null);

    const vmId = tcpRoute?.target_vm_id;

    // ── Real-time: orchestrator HOST_VM_STATE_CHANGED (carries state directly) ──
    useEffect(() => {
        if (!vmId) return;
        const msgs = containerMessages['orchestrator'];
        if (!msgs || msgs.length === 0) return;
        const latest = msgs[0];
        if (latest.id === lastOrchestratorEventIdRef.current) return;
        lastOrchestratorEventIdRef.current = latest.id;

        const { raw } = latest;
        if (raw.message !== 'HOST_VM_STATE_CHANGED') return;

        const event = raw.body?.event as { vm_id?: string; current_state?: string } | undefined;
        if (event?.vm_id !== vmId || !event?.current_state) return;

        const health = getVmHealth(event.current_state);
        setLocalVmHealth(health);
        // If we were polling after a Start/Resume, a real-time event is authoritative — stop polling.
        stopPolling();
        setActionLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [containerMessages['orchestrator'], vmId]);

    // ── Real-time: local/pdfm VM_STATE_CHANGED (no state in payload — must refetch) ──
    useEffect(() => {
        if (!vmId) return;
        const msgs = containerMessages['pdfm'];
        if (!msgs || msgs.length === 0) return;
        const latest = msgs[0];
        if (latest.id === lastPdfmEventIdRef.current) return;
        lastPdfmEventIdRef.current = latest.id;

        const { raw } = latest;
        if (raw.message !== 'VM_STATE_CHANGED') return;

        const eventVmId = raw.body?.vm_id as string | undefined;
        if (eventVmId !== vmId) return;

        devopsService.machines
            .getVirtualMachine(hostname, vmId, !!orchestratorHostId)
            .then((vm) => {
                setLocalVmHealth(getVmHealth(vm.State));
                stopPolling();
                setActionLoading(false);
            })
            .catch((err) => console.warn('[TcpRouteView] Failed to refresh VM after state change:', err));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [containerMessages['pdfm'], vmId]);

    // Configuration panel open state — open when no route exists yet
    const [configOpen, setConfigOpen] = useState(!tcpRoute);

    // Route form state
    const [targetType, setTargetType] = useState<TargetType>(() => resolveTargetType(tcpRoute));
    const [targetHost, setTargetHost] = useState(tcpRoute?.target_host ?? '');
    const [targetPort, setTargetPort] = useState(tcpRoute?.target_port ?? '');
    const [targetVmId, setTargetVmId] = useState(tcpRoute?.target_vm_id ?? '');
    const [routeErrors, setRouteErrors] = useState<Record<string, string>>({});
    const [routeDirty, setRouteDirty] = useState(false);

    // Settings form state
    const [settingsName, setSettingsName] = useState(proxyHost.name ?? '');
    const [settingsHost, setSettingsHost] = useState(proxyHost.host ?? '');
    const [settingsPort, setSettingsPort] = useState(proxyHost.port ?? '80');
    const [settingsDirty, setSettingsDirty] = useState(false);

    // Unified save state
    const [saving, setSaving] = useState(false);
    const isDirty = routeDirty || settingsDirty;

    // Sync all state when parent propagates a new proxyHost.
    // Also cancel any in-flight VM poll — the fresh prop already has the latest state.
    useEffect(() => {
        stopPolling();
        setActionLoading(false);
        lastOrchestratorEventIdRef.current = null;
        lastPdfmEventIdRef.current = null;
        const r = proxyHost.tcp_route;
        setLocalVmHealth(getVmHealth(r?.target_vm_details?.state));
        setTargetType(resolveTargetType(r));
        setTargetHost(r?.target_host ?? '');
        setTargetPort(r?.target_port ?? '');
        setTargetVmId(r?.target_vm_id ?? '');
        setRouteErrors({});
        setRouteDirty(false);
        setSettingsName(proxyHost.name ?? '');
        setSettingsHost(proxyHost.host ?? '');
        setSettingsPort(proxyHost.port ?? '80');
        setSettingsDirty(false);
        setConfigOpen(!r);
    }, [proxyHost, stopPolling]);

    // VM start / resume action — fires the API call then polls until state = running
    const handleVmAction = useCallback(async () => {
        const vmId = tcpRoute?.target_vm_id;
        if (!vmId) return;
        setActionLoading(true);
        try {
            if (localVmHealth === 'stopped') {
                await devopsService.machines.startVirtualMachine(hostname, vmId, !!orchestratorHostId);
            } else {
                await devopsService.machines.resumeVirtualMachine(hostname, vmId, !!orchestratorHostId);
            }
        } catch {
            setActionLoading(false);
            return;
        }

        // Poll the VM state until it reaches 'running' or we time out
        stopPolling();
        pollCountRef.current = 0;
        pollRef.current = setInterval(async () => {
            pollCountRef.current += 1;
            if (pollCountRef.current >= MAX_POLLS) {
                stopPolling();
                setActionLoading(false);
                return;
            }
            try {
                const vm = await devopsService.machines.getVirtualMachine(hostname, vmId, !!orchestratorHostId);
                const health = getVmHealth(vm.State);
                setLocalVmHealth(health);
                if (health === 'running') {
                    stopPolling();
                    setActionLoading(false);
                }
            } catch {
                // transient error — keep polling
            }
        }, POLL_INTERVAL_MS);
    }, [hostname, tcpRoute, localVmHealth, orchestratorHostId, stopPolling]);

    // Route validation
    const validateRoute = () => {
        const e: Record<string, string> = {};
        if (targetType === 'static' && !targetHost.trim()) e.targetHost = 'Target host is required';
        if (targetType === 'vm' && !targetVmId) e.targetVmId = 'Select a virtual machine';
        if (!targetPort.trim()) e.targetPort = 'Port is required';
        setRouteErrors(e);
        return Object.keys(e).length === 0;
    };

    // Unified save
    const handleSave = useCallback(async () => {
        if (routeDirty && !validateRoute()) return;
        setSaving(true);
        try {
            if (routeDirty) {
                await onSaveRoute({
                    target_host: targetType === 'static' ? targetHost.trim() : undefined,
                    target_port: targetPort.trim(),
                    target_vm_id: targetType === 'vm' ? targetVmId : undefined,
                });
                setRouteDirty(false);
            }
            if (settingsDirty) {
                await onSaveSettings({
                    name: settingsName.trim(),
                    host: settingsHost.trim(),
                    port: settingsPort.trim(),
                });
                setSettingsDirty(false);
            }
        } finally {
            setSaving(false);
        }
    }, [
        routeDirty, settingsDirty,
        targetType, targetHost, targetPort, targetVmId,
        settingsName, settingsHost, settingsPort,
        onSaveRoute, onSaveSettings,
    ]);

    const vmOptions = [
        { value: '', label: 'Select a VM…' },
        ...availableVms.map((vm) => ({ value: vm.ID ?? '', label: `${vm.Name ?? vm.ID} (${vm.State ?? 'unknown'})` })),
    ];

    const hasVmTarget = !!(tcpRoute?.target_vm_id);
    const effectiveHealth: VmHealth = hasVmTarget ? localVmHealth : 'running';

    const targetLabel = tcpRoute?.target_vm_id
        ? (tcpRoute.target_vm_details?.name ?? tcpRoute.target_vm_id)
        : (tcpRoute?.target_host ?? '—');
    const resolvedTargetPort = tcpRoute?.target_port ?? '—';

    const showSaveButton = isDirty || !tcpRoute;
    const canEdit = canCreate || canUpdate;

    return (
        <div className="p-4 overflow-y-auto">
            {/* Single outer card — traffic flow header + collapsible config inside one border */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50">

                {/* Traffic flow row — only when a route is configured */}
                {tcpRoute && (
                    <div className="p-3">
                        <ConnectionFlow
                            dotSpacing={30}
                            items={[
                                {
                                    id: 'listener',
                                    tone: !proxyEnabled ? 'neutral' : (proxyEnabled && effectiveHealth === 'running' ? 'emerald' : 'sky'),
                                    icon: <ReverseProxyFrom className={classNames('w-10 h-10', proxyEnabled && 'animate-pulse animate-icon-rock')} />,
                                    title: 'Listening',
                                    titleClassName: 'uppercase tracking-wider text-[10px]',
                                    subtitle: `${proxyHost.host || '0.0.0.0'}:${proxyHost.port}`,
                                    description: !proxyEnabled ? 'Proxy disabled' : "Allowing Traffic",
                                },
                                {
                                    id: 'target',
                                    tone: healthToTone(effectiveHealth, proxyEnabled),
                                    icon: hasVmTarget
                                        ? <VirtualMachineIcon className={classNames('w-10 h-10', proxyEnabled && effectiveHealth === 'running' && 'animate-pulse')} />
                                        : <ReverseProxyTo className={classNames('w-10 h-10', proxyEnabled && 'animate-pulse')} />,
                                    title: hasVmTarget ? 'Target VM' : 'Target',
                                    titleClassName: 'uppercase tracking-wider text-[10px]',
                                    subtitle: `${targetLabel}:${resolvedTargetPort}`,
                                    description: hasVmTarget ? localVmHealth : undefined,
                                    actions: (canCreate && hasVmTarget && ['stopped', 'paused', 'suspended'].includes(localVmHealth)) ? (
                                        <div className="mt-2 flex items-center justify-end w-full">
                                            <Button
                                                variant="solid"
                                                color={localVmHealth === 'stopped' ? 'success' : 'warning'}
                                                size="xs"
                                                loading={actionLoading}
                                                onClick={() => void handleVmAction()}
                                            >
                                                {localVmHealth === 'stopped' ? 'Start VM' : 'Resume VM'}
                                            </Button>
                                        </div>
                                    ) : undefined,
                                    children: [
                                        {
                                            id: 'target',
                                            tone: healthToTone(effectiveHealth, proxyEnabled),
                                            icon: hasVmTarget
                                                ? <VirtualMachineIcon className={classNames('w-10 h-10', proxyEnabled && effectiveHealth === 'running' && 'animate-pulse')} />
                                                : <ReverseProxyTo className={classNames('w-10 h-10', proxyEnabled && 'animate-pulse')} />,
                                            title: hasVmTarget ? 'Target VM' : 'Target',
                                            titleClassName: 'uppercase tracking-wider text-[10px]',
                                            subtitle: `${targetLabel}:${resolvedTargetPort}`,
                                            description: hasVmTarget ? localVmHealth : undefined,
                                            actions: (canCreate && hasVmTarget && ['stopped', 'paused', 'suspended'].includes(localVmHealth)) ? (
                                                <div className="mt-2 flex items-center justify-end w-full">
                                                    <Button
                                                        variant="solid"
                                                        color={localVmHealth === 'stopped' ? 'success' : 'warning'}
                                                        size="xs"
                                                        loading={actionLoading}
                                                        onClick={() => void handleVmAction()}
                                                    >
                                                        {localVmHealth === 'stopped' ? 'Start VM' : 'Resume VM'}
                                                    </Button>
                                                </div>
                                            ) : undefined,
                                        }
                                    ]
                                },
                                {
                                    id: 'target1',
                                    tone: healthToTone(effectiveHealth, proxyEnabled),
                                    icon: hasVmTarget
                                        ? <VirtualMachineIcon className={classNames('w-10 h-10', proxyEnabled && effectiveHealth === 'running' && 'animate-pulse')} />
                                        : <ReverseProxyTo className={classNames('w-10 h-10', proxyEnabled && 'animate-pulse')} />,
                                    title: hasVmTarget ? 'Target VM' : 'Target',
                                    titleClassName: 'uppercase tracking-wider text-[10px]',
                                    subtitle: `${targetLabel}:${resolvedTargetPort}`,
                                    description: hasVmTarget ? localVmHealth : undefined,
                                    actions: (canCreate && hasVmTarget && ['stopped', 'paused', 'suspended'].includes(localVmHealth)) ? (
                                        <div className="mt-2 flex items-center justify-end w-full">
                                            <Button
                                                variant="solid"
                                                color={localVmHealth === 'stopped' ? 'success' : 'warning'}
                                                size="xs"
                                                loading={actionLoading}
                                                onClick={() => void handleVmAction()}
                                            >
                                                {localVmHealth === 'stopped' ? 'Start VM' : 'Resume VM'}
                                            </Button>
                                        </div>
                                    ) : undefined,
                                }
                            ]}
                            flowState={!proxyEnabled ? 'disabled' : (effectiveHealth === 'running' ? 'flowing' : 'stopped')}
                            flowIcon={!proxyEnabled ? <span className="text-base leading-none text-neutral-300 dark:text-neutral-600" title="Proxy engine is disabled" style={{ lineHeight: 1 }}>⊘</span> : undefined}
                            rightAction={canEdit && (
                                <IconButton
                                    icon={configOpen ? 'ArrowUp' : 'ArrowDown'}
                                    size="xs"
                                    variant="ghost"
                                    color="slate"
                                    onClick={() => setConfigOpen(v => !v)}
                                    aria-label={configOpen ? 'Collapse configuration' : 'Configure route'}
                                    aria-expanded={configOpen}
                                />
                            )}
                        />
                    </div>
                )}

                {/* Route Configuration — animates inside the card when route exists */}
                <div
                    className={classNames(
                        tcpRoute && 'grid transition-[grid-template-rows,opacity] duration-300 ease-in-out',
                        tcpRoute && (configOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'),
                    )}
                >
                    <div className={classNames(tcpRoute && 'overflow-hidden')}>
                        {/* Separator from traffic row */}
                        {tcpRoute && (
                            <div className="border-t border-neutral-200 dark:border-neutral-800" />
                        )}

                        <div className="px-4 pt-4 pb-1">
                            <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                                Route Configuration
                            </p>
                        </div>

                        <div className="px-4 pt-2 pb-4 space-y-5">
                            {/* ── Route section ───────────────────────────── */}
                            <div className="space-y-4">
                                <FormField label="Target Type">
                                    <MultiToggle
                                        value={targetType}
                                        onChange={(v) => {
                                            setTargetType(v as TargetType);
                                            setRouteErrors({});
                                            setRouteDirty(true);
                                        }}
                                        options={[
                                            { value: 'static', label: 'Static IP / Host' },
                                            { value: 'vm', label: 'Virtual Machine' },
                                        ]}
                                        size="sm"
                                    />
                                </FormField>

                                {targetType === 'static' ? (
                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <FormField label="Target Host" required>
                                                <Input
                                                    placeholder="10.0.0.5 or hostname"
                                                    value={targetHost}
                                                    onChange={(e) => {
                                                        setTargetHost(e.target.value);
                                                        setRouteErrors((p) => ({ ...p, targetHost: '' }));
                                                        setRouteDirty(true);
                                                    }}
                                                    validationStatus={routeErrors.targetHost ? 'error' : 'none'}
                                                    className="font-mono"
                                                />
                                                {routeErrors.targetHost && (
                                                    <p className="mt-1 text-xs text-rose-500">{routeErrors.targetHost}</p>
                                                )}
                                            </FormField>
                                        </div>
                                        <div className="w-28">
                                            <FormField label="Port" required>
                                                <Input
                                                    placeholder="22"
                                                    value={targetPort}
                                                    onChange={(e) => {
                                                        setTargetPort(e.target.value);
                                                        setRouteErrors((p) => ({ ...p, targetPort: '' }));
                                                        setRouteDirty(true);
                                                    }}
                                                    validationStatus={routeErrors.targetPort ? 'error' : 'none'}
                                                    className="font-mono"
                                                />
                                                {routeErrors.targetPort && (
                                                    <p className="mt-1 text-xs text-rose-500">{routeErrors.targetPort}</p>
                                                )}
                                            </FormField>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <FormField label="Virtual Machine" required>
                                                <Select
                                                    value={targetVmId}
                                                    onChange={(e) => {
                                                        setTargetVmId(e.target.value);
                                                        setRouteErrors((p) => ({ ...p, targetVmId: '' }));
                                                        setRouteDirty(true);
                                                    }}
                                                    validationStatus={routeErrors.targetVmId ? 'error' : 'none'}
                                                >
                                                    {vmOptions.map((o) => (
                                                        <option key={o.value} value={o.value}>{o.label}</option>
                                                    ))}
                                                </Select>
                                                {routeErrors.targetVmId && (
                                                    <p className="mt-1 text-xs text-rose-500">{routeErrors.targetVmId}</p>
                                                )}
                                            </FormField>
                                        </div>
                                        <div className="w-28">
                                            <FormField label="Port" required>
                                                <Input
                                                    placeholder="22"
                                                    value={targetPort}
                                                    onChange={(e) => {
                                                        setTargetPort(e.target.value);
                                                        setRouteErrors((p) => ({ ...p, targetPort: '' }));
                                                        setRouteDirty(true);
                                                    }}
                                                    validationStatus={routeErrors.targetPort ? 'error' : 'none'}
                                                    className="font-mono"
                                                />
                                                {routeErrors.targetPort && (
                                                    <p className="mt-1 text-xs text-rose-500">{routeErrors.targetPort}</p>
                                                )}
                                            </FormField>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ── Settings section ────────────────────────── */}
                            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
                                <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                                    Settings
                                </p>
                                <FormField label="Name" description="Friendly display name (falls back to host if left blank)">
                                    <Input
                                        value={settingsName}
                                        onChange={(e) => { setSettingsName(e.target.value); setSettingsDirty(true); }}
                                        placeholder="e.g. My SSH Gateway"
                                        disabled={!canUpdate}
                                    />
                                </FormField>
                                <FormField label="Listen Host / IP">
                                    <Input
                                        value={settingsHost}
                                        onChange={(e) => { setSettingsHost(e.target.value); setSettingsDirty(true); }}
                                        placeholder="api.domain.local or 0.0.0.0"
                                        disabled={!canUpdate}
                                    />
                                </FormField>
                                <FormField label="Listen Port">
                                    <Input
                                        value={settingsPort}
                                        onChange={(e) => { setSettingsPort(e.target.value); setSettingsDirty(true); }}
                                        placeholder="80"
                                        className="font-mono"
                                        disabled={!canUpdate}
                                    />
                                </FormField>
                            </div>

                            {/* ── Footer ──────────────────────────────────── */}
                            {canEdit && (tcpRoute || showSaveButton) && (
                                <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
                                    <div>
                                        {canCreate && tcpRoute && (
                                            <Button
                                                variant="outline"
                                                color="rose"
                                                size="sm"
                                                leadingIcon="Trash"
                                                onClick={onClearRoute}
                                            >
                                                Clear TCP Route
                                            </Button>
                                        )}
                                    </div>
                                    {showSaveButton && (
                                        <Button
                                            variant="solid"
                                            color="parallels"
                                            size="sm"
                                            loading={saving}
                                            onClick={() => void handleSave()}
                                        >
                                            {tcpRoute ? 'Save Changes' : 'Save TCP Route'}
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
