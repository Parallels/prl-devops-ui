import React, { useCallback, useEffect, useState } from 'react';
import { Button, CustomIcon, FormField, Input, MultiToggle, Select } from '@prl/ui-kit';
import { ReverseProxyHostTcpRoute } from '@/interfaces/ReverseProxy';
import { VirtualMachine } from '@/interfaces/VirtualMachine';

type TargetType = 'static' | 'vm';

/** target_vm_id presence always wins — target_host may be set by the backend as the resolved VM IP */
const resolveTargetType = (route: Pick<ReverseProxyHostTcpRoute, 'target_vm_id'> | null | undefined): TargetType =>
    route?.target_vm_id ? 'vm' : 'static';

interface TcpRouteTabProps {
    tcpRoute: ReverseProxyHostTcpRoute | null | undefined;
    hasHttpRoutes: boolean;
    availableVms: VirtualMachine[];
    canCreate: boolean;
    onSave: (route: Partial<ReverseProxyHostTcpRoute>) => Promise<void>;
    onClear: () => void;
}

export const TcpRouteTab: React.FC<TcpRouteTabProps> = ({
    tcpRoute,
    hasHttpRoutes,
    availableVms,
    canCreate,
    onSave,
    onClear,
}) => {
    const [targetType, setTargetType] = useState<TargetType>(() => resolveTargetType(tcpRoute));
    const [targetHost, setTargetHost] = useState(tcpRoute?.target_host ?? '');
    const [targetPort, setTargetPort] = useState(tcpRoute?.target_port ?? '');
    const [targetVmId, setTargetVmId] = useState(tcpRoute?.target_vm_id ?? '');
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        setTargetType(resolveTargetType(tcpRoute));
        setTargetHost(tcpRoute?.target_host ?? '');
        setTargetPort(tcpRoute?.target_port ?? '');
        setTargetVmId(tcpRoute?.target_vm_id ?? '');
    }, [tcpRoute]);

    const validate = () => {
        const e: Record<string, string> = {};
        if (targetType === 'static' && !targetHost.trim()) e.targetHost = 'Target host is required';
        if (targetType === 'vm' && !targetVmId) e.targetVmId = 'Select a virtual machine';
        if (!targetPort.trim()) e.targetPort = 'Port is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = useCallback(async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            await onSave({
                target_host: targetType === 'static' ? targetHost.trim() : undefined,
                target_port: targetPort.trim(),
                target_vm_id: targetType === 'vm' ? targetVmId : undefined,
            });
        } finally {
            setSaving(false);
        }
    }, [targetType, targetHost, targetPort, targetVmId, onSave]);

    const vmOptions = [
        { value: '', label: 'Select a VM…' },
        ...availableVms.map((vm) => ({ value: vm.ID ?? '', label: `${vm.Name ?? vm.ID} (${vm.State ?? 'unknown'})` })),
    ];

    const statusColor = () => {
        if (!tcpRoute) return 'bg-neutral-50 dark:bg-neutral-950/30 border-neutral-200 dark:border-neutral-800';
        if (tcpRoute.target_vm_details) return 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800';
        return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800';
    };

    return (
        <div className="p-4 space-y-5">
            {/* HTTP routes conflict warning */}
            {hasHttpRoutes && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <CustomIcon icon="Info" className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                        Saving a TCP route will <strong>remove all existing HTTP routes</strong> on this host.
                        The two routing modes are mutually exclusive.
                    </p>
                </div>
            )}

            {/* Current status */}
            {tcpRoute ? (
                <div className={`flex items-center gap-2 p-3 rounded-lg border ${statusColor()}`}>
                    <CustomIcon icon="Script" className="w-4 h-4 text-sky-600 dark:text--400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-sky-800 dark:text-sky-300">TCP route active</p>
                        <p className="text-xs text-sky-600 dark:text-sky-400 font-mono truncate">
                            {tcpRoute.target_vm_id
                                ? `VM: ${tcpRoute.target_vm_details?.name ?? tcpRoute.target_vm_id}`
                                : tcpRoute.target_host}
                            :{tcpRoute.target_port}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
                    <CustomIcon icon="Info" className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">No TCP route configured.</p>
                </div>
            )}

            {/* Target type toggle */}
            <FormField label="Target Type">
                <MultiToggle
                    value={targetType}
                    onChange={(v) => { setTargetType(v as TargetType); setErrors({}); }}
                    options={[
                        { value: 'static', label: 'Static IP / Host' },
                        { value: 'vm', label: 'Virtual Machine' },
                    ]}
                    size="sm"
                />
            </FormField>

            {/* Target fields */}
            {targetType === 'static' ? (
                <div className="flex gap-3">
                    <div className="flex-1">
                        <FormField label="Target Host" required>
                            <Input
                                placeholder="10.0.0.5 or hostname"
                                value={targetHost}
                                onChange={(e) => { setTargetHost(e.target.value); setErrors((p) => ({ ...p, targetHost: '' })); }}
                                validationStatus={errors.targetHost ? 'error' : 'none'}
                                className="font-mono"
                            />
                            {errors.targetHost && <p className="mt-1 text-xs text-rose-500">{errors.targetHost}</p>}
                        </FormField>
                    </div>
                    <div className="w-28">
                        <FormField label="Port" required>
                            <Input
                                placeholder="22"
                                value={targetPort}
                                onChange={(e) => { setTargetPort(e.target.value); setErrors((p) => ({ ...p, targetPort: '' })); }}
                                validationStatus={errors.targetPort ? 'error' : 'none'}
                                className="font-mono"
                            />
                            {errors.targetPort && <p className="mt-1 text-xs text-rose-500">{errors.targetPort}</p>}
                        </FormField>
                    </div>
                </div>
            ) : (
                <div className="flex gap-3">
                    <div className="flex-1">
                        <FormField label="Virtual Machine" required>
                            <Select
                                value={targetVmId}
                                onChange={(e) => { setTargetVmId(e.target.value); setErrors((p) => ({ ...p, targetVmId: '' })); }}
                                validationStatus={errors.targetVmId ? 'error' : 'none'}
                            >
                                {vmOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </Select>
                            {errors.targetVmId && <p className="mt-1 text-xs text-rose-500">{errors.targetVmId}</p>}
                        </FormField>
                    </div>
                    <div className="w-28">
                        <FormField label="Port" required>
                            <Input
                                placeholder="22"
                                value={targetPort}
                                onChange={(e) => { setTargetPort(e.target.value); setErrors((p) => ({ ...p, targetPort: '' })); }}
                                validationStatus={errors.targetPort ? 'error' : 'none'}
                                className="font-mono"
                            />
                            {errors.targetPort && <p className="mt-1 text-xs text-rose-500">{errors.targetPort}</p>}
                        </FormField>
                    </div>
                </div>
            )}

            {/* Actions */}
            {canCreate && (
                <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    {tcpRoute && (
                        <Button variant="outline" color="rose" size="sm" leadingIcon="Trash" onClick={onClear}>
                            Clear TCP Route
                        </Button>
                    )}
                    <div className="ml-auto">
                        <Button
                            variant="solid"
                            color="parallels"
                            size="sm"
                            loading={saving}
                            onClick={() => void handleSave()}
                        >
                            {tcpRoute ? 'Update TCP Route' : 'Save TCP Route'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
