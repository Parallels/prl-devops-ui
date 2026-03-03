import React, { useCallback, useEffect, useState } from 'react';
import { CustomIcon } from '@prl/ui-kit';
import { ReverseProxyHostTcpRoute } from '@/interfaces/ReverseProxy';
import { VirtualMachine } from '@/interfaces/VirtualMachine';
import TcpRouteConfigTabs from './TcpRoutes/TcpRouteConfigTabs';
import TcpRouteEditor from './TcpRoutes/TcpRouteEditor';
import { resolveTargetType, type TargetType } from './TcpRoutes/types';

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
        setErrors({});
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

    const statusColor = () => {
        if (!tcpRoute) return 'bg-neutral-50 dark:bg-neutral-950/30 border-neutral-200 dark:border-neutral-800';
        if (tcpRoute.target_vm_details) return 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800';
        return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800';
    };

    return (
        <div className="p-4 space-y-5">
            {hasHttpRoutes && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <CustomIcon icon="Info" className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                        Saving a TCP route will <strong>remove all existing HTTP routes</strong> on this host.
                        The two routing modes are mutually exclusive.
                    </p>
                </div>
            )}

            {tcpRoute ? (
                <div className={`flex items-center gap-2 p-3 rounded-lg border ${statusColor()}`}>
                    <CustomIcon icon="Script" className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />
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

            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50">
                <TcpRouteConfigTabs
                    routePanel={
                        <TcpRouteEditor
                            targetType={targetType}
                            targetHost={targetHost}
                            targetPort={targetPort}
                            targetVmId={targetVmId}
                            errors={errors}
                            availableVms={availableVms}
                            onTargetTypeChange={(value) => {
                                setTargetType(value);
                                setErrors({});
                            }}
                            onTargetHostChange={setTargetHost}
                            onTargetPortChange={setTargetPort}
                            onTargetVmIdChange={setTargetVmId}
                            onClearError={(key) => setErrors((prev) => ({ ...prev, [key]: '' }))}
                        />
                    }
                    canEdit={canCreate}
                    canClear={!!tcpRoute}
                    canSave
                    saveLabel={tcpRoute ? 'Update TCP Route' : 'Save TCP Route'}
                    saving={saving}
                    panelIdPrefix="tcp-route-tab"
                    onSave={() => void handleSave()}
                    onClear={onClear}
                />
            </div>
        </div>
    );
};
