import React, { useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import {
    Button, CustomIcon, EmptyState, FormField, IconButton, Input,
    MultiToggle, Pill, ReverseProxyFrom, ReverseProxyTo, Select, Tabs,
    VirtualMachine as VirtualMachineIcon,
} from '@prl/ui-kit';
import { ReverseProxyHost, ReverseProxyHostHttpRoute } from '@/interfaces/ReverseProxy';
import { VirtualMachine } from '@/interfaces/VirtualMachine';
import { devopsService } from '@/services/devops';
import { useSession } from '@/contexts/SessionContext';
import { useEventsHub } from '@/contexts/EventsHubContext';
import { useTheme } from '@/contexts/ThemeContext';
import { HttpRouteModal, type HttpRouteFormData } from '../ReverseProxyModals';

// ── Shared types & palette (mirrors TcpRouteView) ─────────────────────────────

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

function headersToEntries(h?: Record<string, string>): { key: string; value: string }[] {
    if (!h) return [];
    return Object.entries(h).map(([key, value]) => ({ key, value }));
}

// Header bg/border split so expanded section can stay white
const cardBgColor: Record<VmHealth, string> = {
    running:   'bg-emerald-50   dark:bg-emerald-950/30',
    stopped:   'bg-rose-50     dark:bg-rose-950/30',
    paused:    'bg-amber-50    dark:bg-amber-950/30',
    suspended: 'bg-amber-50    dark:bg-amber-950/30',
    unknown:   'bg-neutral-50  dark:bg-neutral-800/50',
};
const cardBorderColor: Record<VmHealth, string> = {
    running:   'border-emerald-200 dark:border-emerald-800',
    stopped:   'border-rose-200   dark:border-rose-800',
    paused:    'border-amber-200  dark:border-amber-800',
    suspended: 'border-amber-200  dark:border-amber-800',
    unknown:   'border-neutral-200 dark:border-neutral-700',
};
const cardLabel: Record<VmHealth, string> = {
    running:   'text-emerald-600 dark:text-emerald-400',
    stopped:   'text-rose-600   dark:text-rose-400',
    paused:    'text-amber-600  dark:text-amber-400',
    suspended: 'text-amber-600  dark:text-amber-400',
    unknown:   'text-neutral-500 dark:text-neutral-400',
};
const cardText: Record<VmHealth, string> = {
    running:   'text-emerald-800 dark:text-emerald-200',
    stopped:   'text-rose-800   dark:text-rose-200',
    paused:    'text-amber-800  dark:text-amber-200',
    suspended: 'text-amber-800  dark:text-amber-200',
    unknown:   'text-neutral-600 dark:text-neutral-400',
};

// ── useElementHeight hook ─────────────────────────────────────────────────────

function useElementHeight(ref: React.RefObject<HTMLElement | null>): number {
    const [h, setH] = useState(0);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const ro = new ResizeObserver(([e]) => setH(e.contentRect.height));
        ro.observe(el);
        return () => ro.disconnect();
    }, [ref]);
    return h;
}

// ── RouteConnector SVG component ──────────────────────────────────────────────

interface RouteConnectorProps {
    height: number;
    isLast: boolean;
    proxyEnabled: boolean;
    routeHealth: VmHealth;
    // routeIndex kept for API compatibility but no longer used for stagger
    routeIndex: number;
}

const RouteConnector: React.FC<RouteConnectorProps> = ({
    height, isLast, proxyEnabled, routeHealth,
}) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const trunkColor = proxyEnabled
        ? (isDark ? '#065f46' : '#6ee7b7')
        : (isDark ? '#4b5563' : '#d1d5db');

    const branchColor = !proxyEnabled ? trunkColor
        : routeHealth === 'running'  ? trunkColor
        : routeHealth === 'stopped'  ? (isDark ? '#9f1239' : '#fca5a5')
        : /* paused|suspended|unknown */ (isDark ? '#92400e' : '#fcd34d');

    const dotColor = isDark ? '#34d399' : '#10b981';
    const isFlowing = proxyEnabled && routeHealth === 'running';

    const midY = height / 2;

    // ── Dot timing ──────────────────────────────────────────────────────────────
    // DOT_GAP is fixed so the cadence is always the same regardless of card size.
    // numBranch / numLower scale with the segment length so the SPATIAL gap
    // between dots stays at ~D_PX pixels on the vertical segment.
    //
    //   DOT_GAP = 0.8 s   →  same rhythm whether card is collapsed or expanded
    //   D_PX    = 50 px   →  target pixel distance between consecutive dots
    //
    const DOT_GAP = 0.8;
    const D_PX    = 50;

    // L-path branch dots  (0 → midY vertically, then → right to card)
    const numBranch  = Math.max(1, Math.round(midY / D_PX));
    const branchDur  = numBranch * DOT_GAP;

    // Lower-trunk continuation dots  (midY → height+6, straight down).
    // These start at y=midY — NOT y=0 — so they never overlap branch dots on
    // the upper trunk segment.  The begin is offset by (0.55 * branchDur) so
    // the first lower dot appears exactly when the first branch dot transitions
    // from vertical to horizontal, creating a seamless hand-off at midY.
    const lowerLen        = height + 6 - midY;          // ≈ midY + 6
    const numLower        = Math.max(1, Math.round(lowerLen / D_PX));
    const lowerDur        = numLower * DOT_GAP;
    const lowerBeginBase  = 0.55 * branchDur;           // sync with branch midY transition

    return (
        <svg
            width={24}
            height={height}
            viewBox={`0 0 24 ${height}`}
            overflow="visible"
            style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
        >
            {/* Upper trunk */}
            <path
                d={`M 12 0 L 12 ${midY}`}
                stroke={trunkColor}
                strokeWidth={2}
                strokeLinecap="round"
                fill="none"
            />
            {/* Branch to card */}
            <path
                d={`M 12 ${midY} L 24 ${midY}`}
                stroke={branchColor}
                strokeWidth={2}
                strokeLinecap="round"
                fill="none"
            />
            {/* Lower trunk (non-last rows only) */}
            {!isLast && (
                <path
                    d={`M 12 ${midY} L 12 ${height + 6}`}
                    stroke={trunkColor}
                    strokeWidth={2}
                    strokeLinecap="round"
                    fill="none"
                />
            )}

            {isFlowing && <>
                {/* Branch dots: travel 0→midY (vertical) then midY→right (horizontal) */}
                {Array.from({ length: numBranch }, (_, i) => {
                    const b = `${i * DOT_GAP}s`;
                    return (
                        <circle key={`b${i}`} r="3" fill={dotColor} opacity="0">
                            <animate attributeName="cx"
                                values="12;12;24" keyTimes="0;0.55;1"
                                dur={`${branchDur}s`} begin={b} repeatCount="indefinite" />
                            <animate attributeName="cy"
                                values={`0;${midY};${midY}`} keyTimes="0;0.55;1"
                                dur={`${branchDur}s`} begin={b} repeatCount="indefinite" />
                            <animate attributeName="opacity"
                                values="0;0.9;0.9;0" keyTimes="0;0.05;0.92;1"
                                dur={`${branchDur}s`} begin={b} repeatCount="indefinite" />
                        </circle>
                    );
                })}

                {/* Lower-trunk continuation dots: start at midY, travel to height+6.
                    Begin is staggered from lowerBeginBase so first dot appears exactly
                    as first branch dot hands off from vertical to horizontal at midY. */}
                {!isLast && Array.from({ length: numLower }, (_, i) => {
                    const b = `${lowerBeginBase + i * DOT_GAP}s`;
                    return (
                        <circle key={`t${i}`} r="3" fill={dotColor} opacity="0">
                            <animate attributeName="cx"
                                values="12;12" keyTimes="0;1"
                                dur={`${lowerDur}s`} begin={b} repeatCount="indefinite" />
                            <animate attributeName="cy"
                                values={`${midY};${height + 6}`} keyTimes="0;1"
                                dur={`${lowerDur}s`} begin={b} repeatCount="indefinite" />
                            <animate attributeName="opacity"
                                values="0;0.9;0.9;0" keyTimes="0;0.05;0.92;1"
                                dur={`${lowerDur}s`} begin={b} repeatCount="indefinite" />
                        </circle>
                    );
                })}
            </>}
        </svg>
    );
};

// ── Listener node ─────────────────────────────────────────────────────────────

const ListenerNode: React.FC<{ proxyHost: ReverseProxyHost; proxyEnabled: boolean }> = ({
    proxyHost, proxyEnabled,
}) => {
    const bg = proxyEnabled
        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
        : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600';
    const iconCls = proxyEnabled ? 'text-emerald-500 dark:text-emerald-400' : 'text-neutral-400 dark:text-neutral-500';
    const labelCls = proxyEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400 dark:text-neutral-500';
    const textCls  = proxyEnabled ? 'text-emerald-800 dark:text-emerald-200' : 'text-neutral-500 dark:text-neutral-400';

    return (
        <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border ${bg}`}>
            <ReverseProxyFrom className={`w-10 h-10 flex-shrink-0 ${iconCls}`} />
            <div className="flex flex-col min-w-0">
                <p className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${labelCls}`}>
                    Listening
                </p>
                <p className={`text-sm font-mono font-medium truncate ${textCls}`}>
                    {proxyHost.host || '0.0.0.0'}:{proxyHost.port}
                </p>
                {!proxyEnabled && (
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500">Proxy disabled</p>
                )}
            </div>
        </div>
    );
};

// ── Header-row key-value editor (reused for req + res headers) ─────────────────

const HeaderEditor: React.FC<{
    rows: { key: string; value: string }[];
    onChange: (rows: { key: string; value: string }[]) => void;
    onDirty: () => void;
    disabled: boolean;
    emptyLabel: string;
    addLabel: string;
}> = ({ rows, onChange, onDirty, disabled, emptyLabel, addLabel }) => (
    <div className="space-y-2">
        {rows.length === 0 && (
            <p className="text-xs text-neutral-400 dark:text-neutral-500 italic">{emptyLabel}</p>
        )}
        {rows.map((row, i) => (
            <div key={i} className="flex gap-2">
                <Input
                    placeholder="Header name"
                    value={row.key}
                    onChange={e => { onChange(rows.map((r, j) => j === i ? { ...r, key: e.target.value } : r)); onDirty(); }}
                    className="font-mono flex-1"
                    size="sm"
                    disabled={disabled}
                />
                <Input
                    placeholder="Value"
                    value={row.value}
                    onChange={e => { onChange(rows.map((r, j) => j === i ? { ...r, value: e.target.value } : r)); onDirty(); }}
                    className="font-mono flex-1"
                    size="sm"
                    disabled={disabled}
                />
                {!disabled && (
                    <Button variant="ghost" color="rose" size="sm" leadingIcon="Trash"
                        onClick={() => { onChange(rows.filter((_, j) => j !== i)); onDirty(); }} />
                )}
            </div>
        ))}
        {!disabled && (
            <Button variant="outline" color="slate" size="sm" leadingIcon="Add"
                onClick={() => { onChange([...rows, { key: '', value: '' }]); onDirty(); }}>
                {addLabel}
            </Button>
        )}
    </div>
);

// ── Individual HTTP route card (pure UI — health/action state comes from RouteRow) ──

interface HttpRouteCardProps {
    route: ReverseProxyHostHttpRoute;
    index: number;
    proxyEnabled: boolean;
    availableVms: VirtualMachine[];
    orchestratorHostId?: string;
    canUpdate: boolean;
    canDelete: boolean;
    onSave: (routeId: string, data: HttpRouteFormData) => Promise<void>;
    onDelete: (routeId: string) => Promise<void>;
    deleting: boolean;
    // lifted from RouteRow
    vmHealth: VmHealth;
    actionLoading: boolean;
    onVmAction: () => Promise<void>;
}

const HttpRouteCard: React.FC<HttpRouteCardProps> = ({
    route, index, proxyEnabled,
    availableVms,
    canUpdate, canDelete,
    onSave, onDelete, deleting,
    vmHealth, actionLoading, onVmAction,
}) => {
    const hasVmTarget = !!(route.target_vm_id);
    const [expanded, setExpanded] = useState(false);
    const [saving, setSaving] = useState(false);

    // ── Expand form state ──────────────────────────────────────────────────────

    const [formPath,       setFormPath]       = useState(route.path ?? '/');
    const [formSchema,     setFormSchema]     = useState<'http' | 'https'>((route.schema ?? 'http') as 'http' | 'https');
    const [formPattern,    setFormPattern]    = useState(route.pattern ?? '');
    const [formTargetType, setFormTargetType] = useState<TargetType>(route.target_vm_id ? 'vm' : 'static');
    const [formHost,       setFormHost]       = useState(route.target_host ?? '');
    const [formPort,       setFormPort]       = useState(route.target_port ?? '');
    const [formVmId,       setFormVmId]       = useState(route.target_vm_id ?? '');
    const [formReqHeaders, setFormReqHeaders] = useState<{ key: string; value: string }[]>(
        () => headersToEntries(route.request_headers)
    );
    const [formResHeaders, setFormResHeaders] = useState<{ key: string; value: string }[]>(
        () => headersToEntries(route.response_headers)
    );
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [formDirty,  setFormDirty]  = useState(false);

    // Sync form when parent route prop changes
    useEffect(() => {
        setFormPath(route.path ?? '/');
        setFormSchema((route.schema ?? 'http') as 'http' | 'https');
        setFormPattern(route.pattern ?? '');
        setFormTargetType(route.target_vm_id ? 'vm' : 'static');
        setFormHost(route.target_host ?? '');
        setFormPort(route.target_port ?? '');
        setFormVmId(route.target_vm_id ?? '');
        setFormReqHeaders(headersToEntries(route.request_headers));
        setFormResHeaders(headersToEntries(route.response_headers));
        setFormErrors({});
        setFormDirty(false);
    }, [route]);

    const validate = () => {
        const e: Record<string, string> = {};
        if (!formPath.trim()) e.path = 'Path is required';
        if (formTargetType === 'static' && !formHost.trim()) e.host = 'Target host is required';
        if (formTargetType === 'vm' && !formVmId) e.vmId = 'Select a virtual machine';
        if (!formPort.trim()) e.port = 'Port is required';
        setFormErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = useCallback(async () => {
        if (!validate() || !route.id) return;
        setSaving(true);
        try {
            await onSave(route.id, {
                path: formPath.trim(),
                schema: formSchema,
                pattern: formPattern.trim(),
                targetType: formTargetType,
                targetHost: formHost.trim(),
                targetPort: formPort.trim(),
                targetVmId: formVmId,
                requestHeaders: formReqHeaders.filter(r => r.key.trim()),
                responseHeaders: formResHeaders.filter(r => r.key.trim()),
            });
            setFormDirty(false);
        } finally { setSaving(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [route.id, formPath, formSchema, formPattern, formTargetType, formHost, formPort, formVmId, formReqHeaders, formResHeaders, onSave]);

    // ── Derived visuals ────────────────────────────────────────────────────────

    const health = hasVmTarget ? vmHealth : 'running';
    const isProxyDown = !proxyEnabled;

    const targetLabel = route.target_vm_id
        ? (route.target_vm_details?.name ?? route.target_vm_id)
        : (route.target_host ?? '—');

    const vmOptions = [
        { value: '', label: 'Select a VM…' },
        ...availableVms.map(vm => ({ value: vm.ID ?? '', label: `${vm.Name ?? vm.ID} (${vm.State ?? 'unknown'})` })),
    ];

    const showVmAction = hasVmTarget && (health === 'stopped' || health === 'paused' || health === 'suspended');

    const reqHeaderCount = Object.keys(route.request_headers ?? {}).length;
    const resHeaderCount = Object.keys(route.response_headers ?? {}).length;

    const borderCls = isProxyDown ? 'border-neutral-200 dark:border-neutral-800' : cardBorderColor[health];
    const headerBgCls = isProxyDown ? 'bg-white dark:bg-neutral-900/50' : cardBgColor[health];

    return (
        <div
            className="relative"
            style={{ animation: 'fadeIn 0.3s ease both', animationDelay: `${index * 0.05}s` }}
        >
            <div className={`relative overflow-hidden rounded-xl border ${borderCls} group/card`}>

                {/* Header row — health-state colored */}
                <div className={`flex items-stretch gap-3 p-3 ${headerBgCls}`}>
                    {/* Big icon */}
                    {hasVmTarget
                        ? <VirtualMachineIcon className={`w-10 h-10 flex-shrink-0 self-center ${isProxyDown ? 'text-neutral-400 dark:text-neutral-500' : cardLabel[health]}`} />
                        : <ReverseProxyTo     className={`w-10 h-10 flex-shrink-0 self-center ${isProxyDown ? 'text-neutral-400 dark:text-neutral-500' : cardLabel[health]}`} />
                    }

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <Pill size="sm" tone={route.schema === 'https' ? 'emerald' : 'sky'} variant="soft">
                                {route.schema === 'https' ? 'HTTPS' : 'HTTP'}
                            </Pill>
                            <span className={classNames(
                                'font-mono text-sm font-semibold truncate',
                                isProxyDown ? 'text-neutral-500 dark:text-neutral-400' : cardText[health],
                            )}>
                                {route.path ?? '/'}
                            </span>
                        </div>
                        <p className={classNames(
                            'text-sm font-mono truncate',
                            isProxyDown ? 'text-neutral-500 dark:text-neutral-400' : cardText[health],
                        )}>
                            {targetLabel}:{route.target_port ?? '—'}
                        </p>
                        {hasVmTarget && (
                            <p className={classNames('text-[10px] mt-0.5', isProxyDown ? 'text-neutral-400 dark:text-neutral-500' : cardLabel[health])}>
                                {vmHealth}
                            </p>
                        )}
                        {isProxyDown && (
                            <p className="text-[10px] mt-0.5 text-neutral-400 dark:text-neutral-500">Proxy disabled</p>
                        )}
                        {showVmAction && !isProxyDown && (
                            <div className="mt-1.5">
                                <Button
                                    variant="solid"
                                    color={vmHealth === 'stopped' ? 'success' : 'warning'}
                                    size="xs"
                                    loading={actionLoading}
                                    onClick={() => void onVmAction()}
                                >
                                    {vmHealth === 'stopped' ? 'Start VM' : 'Resume VM'}
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Hover-only action buttons */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-150 flex-shrink-0 self-start mt-1">
                        {canDelete && (
                            <IconButton
                                icon="Trash"
                                size="xs"
                                variant="ghost"
                                color="danger"
                                loading={deleting}
                                onClick={() => route.id && void onDelete(route.id)}
                                aria-label="Delete route"
                            />
                        )}
                    </div>

                    {/* Expand toggle — always visible */}
                    {(canUpdate || canDelete) && (
                        <div className="flex items-center flex-shrink-0 self-start mt-1">
                            <IconButton
                                icon={expanded ? 'ArrowUp' : 'ArrowDown'}
                                size="xs"
                                variant="ghost"
                                color="slate"
                                onClick={() => setExpanded(v => !v)}
                                aria-label={expanded ? 'Collapse' : 'Configure route'}
                                aria-expanded={expanded}
                            />
                        </div>
                    )}
                </div>

                {/* Expandable config panel — always white */}
                <div className={classNames(
                    'grid transition-[grid-template-rows,opacity] duration-300 ease-in-out',
                    expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                )}>
                    <div className="overflow-hidden bg-white dark:bg-neutral-900 rounded-b-xl">
                        <div className="border-t border-neutral-200 dark:border-neutral-700" />
                        <Tabs
                            variant="underline"
                            color="parallels"
                            size="sm"
                            listClassName="bg-transparent px-1"
                            panelIdPrefix={`http-route-${route.id}`}
                            items={[
                                {
                                    id: 'route',
                                    label: 'Route',
                                    panel: (
                                        <div className="px-4 pt-3 pb-4 space-y-4">
                                            {/* Path + Schema */}
                                            <div className="flex gap-3">
                                                <div className="flex-1">
                                                    <FormField label="Path" required>
                                                        <Input
                                                            placeholder="/api/v1"
                                                            value={formPath}
                                                            onChange={e => { setFormPath(e.target.value); setFormDirty(true); setFormErrors(p => ({ ...p, path: '' })); }}
                                                            validationStatus={formErrors.path ? 'error' : 'none'}
                                                            className="font-mono"
                                                            disabled={!canUpdate}
                                                        />
                                                        {formErrors.path && <p className="mt-1 text-xs text-rose-500">{formErrors.path}</p>}
                                                    </FormField>
                                                </div>
                                                <div className="w-28">
                                                    <FormField label="Schema">
                                                        <Select
                                                            value={formSchema}
                                                            onChange={e => { setFormSchema(e.target.value as 'http' | 'https'); setFormDirty(true); }}
                                                            disabled={!canUpdate}
                                                        >
                                                            <option value="http">HTTP</option>
                                                            <option value="https">HTTPS</option>
                                                        </Select>
                                                    </FormField>
                                                </div>
                                            </div>

                                            {/* Pattern */}
                                            <FormField label="Match Pattern" description="Optional regex or glob to match request paths.">
                                                <Input
                                                    placeholder="e.g. ^/api/.*"
                                                    value={formPattern}
                                                    onChange={e => { setFormPattern(e.target.value); setFormDirty(true); }}
                                                    className="font-mono"
                                                    disabled={!canUpdate}
                                                />
                                            </FormField>

                                            {/* Target type */}
                                            <FormField label="Target Type">
                                                <MultiToggle
                                                    value={formTargetType}
                                                    onChange={v => { setFormTargetType(v as TargetType); setFormErrors({}); setFormDirty(true); }}
                                                    options={[
                                                        { value: 'static', label: 'Static IP / Host' },
                                                        { value: 'vm',     label: 'Virtual Machine' },
                                                    ]}
                                                    size="sm"
                                                    disabled={!canUpdate}
                                                />
                                            </FormField>

                                            {/* Target fields */}
                                            <div className="flex gap-3">
                                                {formTargetType === 'static' ? (
                                                    <div className="flex-1">
                                                        <FormField label="Target Host" required>
                                                            <Input
                                                                placeholder="10.0.0.5 or hostname"
                                                                value={formHost}
                                                                onChange={e => { setFormHost(e.target.value); setFormDirty(true); setFormErrors(p => ({ ...p, host: '' })); }}
                                                                validationStatus={formErrors.host ? 'error' : 'none'}
                                                                className="font-mono"
                                                                disabled={!canUpdate}
                                                            />
                                                            {formErrors.host && <p className="mt-1 text-xs text-rose-500">{formErrors.host}</p>}
                                                        </FormField>
                                                    </div>
                                                ) : (
                                                    <div className="flex-1">
                                                        <FormField label="Virtual Machine" required>
                                                            <Select
                                                                value={formVmId}
                                                                onChange={e => { setFormVmId(e.target.value); setFormDirty(true); setFormErrors(p => ({ ...p, vmId: '' })); }}
                                                                validationStatus={formErrors.vmId ? 'error' : 'none'}
                                                                disabled={!canUpdate}
                                                            >
                                                                {vmOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                                            </Select>
                                                            {formErrors.vmId && <p className="mt-1 text-xs text-rose-500">{formErrors.vmId}</p>}
                                                        </FormField>
                                                    </div>
                                                )}
                                                <div className="w-28">
                                                    <FormField label="Port" required>
                                                        <Input
                                                            placeholder="3000"
                                                            value={formPort}
                                                            onChange={e => { setFormPort(e.target.value); setFormDirty(true); setFormErrors(p => ({ ...p, port: '' })); }}
                                                            validationStatus={formErrors.port ? 'error' : 'none'}
                                                            className="font-mono"
                                                            disabled={!canUpdate}
                                                        />
                                                        {formErrors.port && <p className="mt-1 text-xs text-rose-500">{formErrors.port}</p>}
                                                    </FormField>
                                                </div>
                                            </div>
                                        </div>
                                    ),
                                },
                                {
                                    id: 'req-headers',
                                    label: `Request${reqHeaderCount ? ` (${reqHeaderCount})` : ''}`,
                                    panel: (
                                        <div className="px-4 pt-3 pb-4 space-y-3">
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                Injected into every request forwarded to the target.
                                            </p>
                                            <HeaderEditor
                                                rows={formReqHeaders}
                                                onChange={setFormReqHeaders}
                                                onDirty={() => setFormDirty(true)}
                                                disabled={!canUpdate}
                                                emptyLabel="No request headers configured."
                                                addLabel="Add Request Header"
                                            />
                                        </div>
                                    ),
                                },
                                {
                                    id: 'res-headers',
                                    label: `Response${resHeaderCount ? ` (${resHeaderCount})` : ''}`,
                                    panel: (
                                        <div className="px-4 pt-3 pb-4 space-y-3">
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                Injected into every response from this route.
                                            </p>
                                            <HeaderEditor
                                                rows={formResHeaders}
                                                onChange={setFormResHeaders}
                                                onDirty={() => setFormDirty(true)}
                                                disabled={!canUpdate}
                                                emptyLabel="No response headers configured."
                                                addLabel="Add Response Header"
                                            />
                                        </div>
                                    ),
                                },
                            ]}
                        />

                        {/* Footer */}
                        {canUpdate && formDirty && (
                            <div className="flex items-center justify-end px-4 pb-4 pt-1 border-t border-neutral-200 dark:border-neutral-700">
                                <Button variant="solid" color="parallels" size="sm" loading={saving}
                                    onClick={() => void handleSave()}>
                                    Save Changes
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

            </div>

        </div>
    );
};

// ── RouteRow — wraps connector + card, owns vmHealth/polling/event state ───────

interface RouteRowProps {
    route: ReverseProxyHostHttpRoute;
    index: number;
    isLast: boolean;
    proxyEnabled: boolean;
    availableVms: VirtualMachine[];
    orchestratorHostId?: string;
    canUpdate: boolean;
    canDelete: boolean;
    onSave: (routeId: string, data: HttpRouteFormData) => Promise<void>;
    onDelete: (routeId: string) => Promise<void>;
    deleting: boolean;
}

const RouteRow: React.FC<RouteRowProps> = (props) => {
    const { route, index, isLast, proxyEnabled, orchestratorHostId } = props;
    const { session } = useSession();
    const hostname = session?.hostname ?? '';
    const { containerMessages } = useEventsHub();

    // Measure the card wrapper only — NOT the outer flex row which contains the SVG.
    // If we measured the row, the SVG's own height attribute would prevent shrinking
    // on collapse (circular dependency).
    const cardRef = useRef<HTMLDivElement>(null);
    const cardHeight = useElementHeight(cardRef);

    const hasVmTarget = !!(route.target_vm_id);
    const [vmHealth, setVmHealth] = useState<VmHealth>(
        hasVmTarget ? getVmHealth(route.target_vm_details?.state) : 'running'
    );
    const [actionLoading, setActionLoading] = useState(false);

    // Polling refs
    const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null);
    const pollCountRef = useRef(0);
    const POLL_MS   = 3_000;
    const MAX_POLLS = 20;

    const stopPolling = useCallback(() => {
        if (pollRef.current !== null) { clearInterval(pollRef.current); pollRef.current = null; }
        pollCountRef.current = 0;
    }, []);
    useEffect(() => () => stopPolling(), [stopPolling]);

    // Sync vmHealth when parent sends updated route
    useEffect(() => {
        stopPolling();
        setActionLoading(false);
        setVmHealth(hasVmTarget ? getVmHealth(route.target_vm_details?.state) : 'running');
    }, [route.target_vm_details?.state, hasVmTarget, stopPolling]);

    // Real-time: orchestrator HOST_VM_STATE_CHANGED
    const lastOrchestratorIdRef = useRef<string | null>(null);
    useEffect(() => {
        const vmId = route.target_vm_id;
        if (!vmId) return;
        const msgs = containerMessages['orchestrator'];
        if (!msgs?.length) return;
        const latest = msgs[0];
        if (latest.id === lastOrchestratorIdRef.current) return;
        lastOrchestratorIdRef.current = latest.id;
        if (latest.raw.message !== 'HOST_VM_STATE_CHANGED') return;
        const event = latest.raw.body?.event as { vm_id?: string; current_state?: string } | undefined;
        if (event?.vm_id !== vmId || !event?.current_state) return;
        setVmHealth(getVmHealth(event.current_state));
        stopPolling(); setActionLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [containerMessages['orchestrator'], route.target_vm_id]);

    // Real-time: local pdfm VM_STATE_CHANGED
    const lastPdfmIdRef = useRef<string | null>(null);
    useEffect(() => {
        const vmId = route.target_vm_id;
        if (!vmId) return;
        const msgs = containerMessages['pdfm'];
        if (!msgs?.length) return;
        const latest = msgs[0];
        if (latest.id === lastPdfmIdRef.current) return;
        lastPdfmIdRef.current = latest.id;
        if (latest.raw.message !== 'VM_STATE_CHANGED') return;
        if ((latest.raw.body?.vm_id as string | undefined) !== vmId) return;
        devopsService.machines.getVirtualMachine(hostname, vmId, !!orchestratorHostId)
            .then((vm) => { setVmHealth(getVmHealth(vm.State)); stopPolling(); setActionLoading(false); })
            .catch(() => undefined);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [containerMessages['pdfm'], route.target_vm_id]);

    // VM start / resume with polling
    const handleVmAction = useCallback(async () => {
        const vmId = route.target_vm_id;
        if (!vmId) return;
        setActionLoading(true);
        try {
            if (vmHealth === 'stopped') {
                await devopsService.machines.startVirtualMachine(hostname, vmId, !!orchestratorHostId);
            } else {
                await devopsService.machines.resumeVirtualMachine(hostname, vmId, !!orchestratorHostId);
            }
        } catch { setActionLoading(false); return; }
        stopPolling();
        pollCountRef.current = 0;
        pollRef.current = setInterval(async () => {
            pollCountRef.current += 1;
            if (pollCountRef.current >= MAX_POLLS) { stopPolling(); setActionLoading(false); return; }
            try {
                const vm = await devopsService.machines.getVirtualMachine(hostname, vmId, !!orchestratorHostId);
                const h = getVmHealth(vm.State);
                setVmHealth(h);
                if (h === 'running') { stopPolling(); setActionLoading(false); }
            } catch { /* keep polling */ }
        }, POLL_MS);
    }, [hostname, route.target_vm_id, vmHealth, orchestratorHostId, stopPolling]);

    const health = hasVmTarget ? vmHealth : 'running';

    // The SVG is absolutely positioned so it never participates in the flex layout
    // and cannot hold the row open when the card collapses.  The card wrapper gets
    // 24px left padding to leave room for the 24px-wide connector column.
    return (
        <div className="relative mb-2" style={{ paddingLeft: 24 }}>
            {cardHeight > 0 && (
                <RouteConnector
                    height={cardHeight}
                    isLast={isLast}
                    proxyEnabled={proxyEnabled}
                    routeHealth={health}
                    routeIndex={index}
                />
            )}
            <div ref={cardRef} className="min-w-0">
                <HttpRouteCard
                    {...props}
                    vmHealth={vmHealth}
                    actionLoading={actionLoading}
                    onVmAction={handleVmAction}
                />
            </div>
        </div>
    );
};

// ── Main tab component ────────────────────────────────────────────────────────

interface RoutesTabProps {
    proxyHost: ReverseProxyHost;
    proxyEnabled: boolean;
    routes: ReverseProxyHostHttpRoute[];
    hasTcpRoute: boolean;
    availableVms: VirtualMachine[];
    orchestratorHostId?: string;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    onAddRoute: (data: HttpRouteFormData) => Promise<void>;
    onUpdateRoute: (routeId: string, data: HttpRouteFormData) => Promise<void>;
    onDeleteRoute: (routeId: string) => Promise<void>;
}

export const RoutesTab: React.FC<RoutesTabProps> = ({
    proxyHost, proxyEnabled, routes, hasTcpRoute,
    availableVms, orchestratorHostId,
    canCreate, canUpdate, canDelete,
    onAddRoute, onUpdateRoute, onDeleteRoute,
}) => {
    const { theme } = useTheme();
    const [showAddModal, setShowAddModal] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    const handleDelete = useCallback(async (id: string) => {
        setDeleting(id);
        try { await onDeleteRoute(id); } finally { setDeleting(null); }
    }, [onDeleteRoute]);

    const trunkStubColor = proxyEnabled
        ? (theme === 'dark' ? '#065f46' : '#6ee7b7')
        : (theme === 'dark' ? '#4b5563' : '#d1d5db');

    return (
        <div className="flex flex-col h-full min-h-0">
            {/* Add route modal */}
            <HttpRouteModal
                isOpen={showAddModal}
                availableVms={availableVms}
                onClose={() => setShowAddModal(false)}
                onSubmit={onAddRoute}
            />

            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-100 dark:border-neutral-800 flex-shrink-0">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {routes.length} route{routes.length !== 1 ? 's' : ''}
                </span>
                {canCreate && (
                    <Button
                        variant="solid" color="parallels" size="sm" leadingIcon="Add"
                        disabled={hasTcpRoute}
                        onClick={() => setShowAddModal(true)}
                    >
                        Add HTTP Route
                    </Button>
                )}
            </div>

            {/* Pipeline view */}
            <div className="flex-1 overflow-y-auto p-4">
                {hasTcpRoute && (
                    <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                        <CustomIcon icon="Info" className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 dark:text-amber-300">
                            A TCP route is active on this host. Remove it first before adding HTTP routes.
                        </p>
                    </div>
                )}

                {/* Listener */}
                <ListenerNode proxyHost={proxyHost} proxyEnabled={proxyEnabled} />

                {routes.length === 0 ? (
                    <div className="mt-3">
                        <EmptyState
                            icon="Script"
                            title="No HTTP routes"
                            subtitle={hasTcpRoute ? 'Remove the TCP route to enable HTTP routing.' : 'Add a route to start forwarding traffic.'}
                            tone="neutral"
                            disableBorder
                        />
                    </div>
                ) : (
                    <>
                        {/* Trunk stub — bridges listener card to first route row */}
                        <div
                            className="ml-[11px] w-0.5 h-3"
                            style={{ backgroundColor: trunkStubColor }}
                        />

                        {/* Route rows */}
                        <div className="mt-0 space-y-0">
                            {routes.map((route, i) => (
                                <RouteRow
                                    key={route.id ?? i}
                                    route={route}
                                    index={i}
                                    isLast={i === routes.length - 1}
                                    proxyEnabled={proxyEnabled}
                                    availableVms={availableVms}
                                    orchestratorHostId={orchestratorHostId}
                                    canUpdate={canUpdate}
                                    canDelete={canDelete}
                                    onSave={onUpdateRoute}
                                    onDelete={handleDelete}
                                    deleting={deleting === route.id}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
