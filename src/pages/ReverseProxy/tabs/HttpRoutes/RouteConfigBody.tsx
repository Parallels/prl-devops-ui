import React, { useCallback, useEffect, useState } from 'react';
import { Button, FormField, Input, MultiToggle, Select, Tabs } from '@prl/ui-kit';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import type { ReverseProxyHostHttpRoute } from '@/interfaces/ReverseProxy';
import type { VirtualMachine } from '@/interfaces/VirtualMachine';
import type { HttpRouteFormData } from '../../ReverseProxyModals';
import HeaderEditor from './HeaderEditor';
import { headersToEntries, type TargetType } from './routeTypes';

interface RouteConfigBodyProps {
    route: ReverseProxyHostHttpRoute;
    canUpdate: boolean;
    availableVms: VirtualMachine[];
    onSave: (routeId: string, data: HttpRouteFormData) => Promise<void>;
}

/**
 * Expandable form body rendered inside a route's TreeItemCard.
 * Owns all local form state; syncs back to the route when the user saves.
 */
const RouteConfigBody: React.FC<RouteConfigBodyProps> = ({
    route, canUpdate, availableVms, onSave,
}) => {
    const { themeColor } = useSystemSettings();
    const [saving, setSaving] = useState(false);
    const [formPath, setFormPath] = useState(route.path ?? '/');
    const [formSchema, setFormSchema] = useState<'http' | 'https'>((route.schema ?? 'http') as 'http' | 'https');
    const [formPattern, setFormPattern] = useState(route.pattern ?? '');
    const [formTargetType, setFormTargetType] = useState<TargetType>(route.target_vm_id ? 'vm' : 'static');
    const [formHost, setFormHost] = useState(route.target_host ?? '');
    const [formPort, setFormPort] = useState(route.target_port ?? '');
    const [formVmId, setFormVmId] = useState(route.target_vm_id ?? '');
    const [formReqHeaders, setFormReqHeaders] = useState(() => headersToEntries(route.request_headers));
    const [formResHeaders, setFormResHeaders] = useState(() => headersToEntries(route.response_headers));
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [formDirty, setFormDirty] = useState(false);

    // Reset form whenever the underlying route changes (e.g. after a save or external update)
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
        if (!formDirty || !validate() || !route.id) return;
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

    const vmOptions = [
        { value: '', label: 'Select a VM…' },
        ...availableVms.map(vm => ({ value: vm.ID ?? '', label: `${vm.Name ?? vm.ID} (${vm.State ?? 'unknown'})` })),
    ];

    const reqHeaderCount = Object.keys(route.request_headers ?? {}).length;
    const resHeaderCount = Object.keys(route.response_headers ?? {}).length;

    const dirty = () => setFormDirty(true);
    const clearErr = (key: string) => setFormErrors(p => ({ ...p, [key]: '' }));

    return (
        <>
            <Tabs
                variant="underline"
                color={themeColor}
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
                                                onChange={e => { setFormPath(e.target.value); dirty(); clearErr('path'); }}
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
                                                onChange={e => { setFormSchema(e.target.value as 'http' | 'https'); dirty(); }}
                                                disabled={!canUpdate}
                                            >
                                                <option value="http">HTTP</option>
                                                <option value="https">HTTPS</option>
                                            </Select>
                                        </FormField>
                                    </div>
                                </div>

                                {/* Match pattern */}
                                <FormField label="Match Pattern" description="Optional regex or glob to match request paths.">
                                    <Input
                                        placeholder="e.g. ^/api/.*"
                                        value={formPattern}
                                        onChange={e => { setFormPattern(e.target.value); dirty(); }}
                                        className="font-mono"
                                        disabled={!canUpdate}
                                    />
                                </FormField>

                                {/* Target type toggle */}
                                <FormField label="Target Type">
                                    <MultiToggle
                                        value={formTargetType}
                                        onChange={v => { setFormTargetType(v as TargetType); setFormErrors({}); dirty(); }}
                                        options={[
                                            { value: 'static', label: 'Static IP / Host' },
                                            { value: 'vm', label: 'Virtual Machine' },
                                        ]}
                                        size="sm"
                                        disabled={!canUpdate}
                                    />
                                </FormField>

                                {/* Target host/VM + port */}
                                <div className="flex gap-3">
                                    {formTargetType === 'static' ? (
                                        <div className="flex-1">
                                            <FormField label="Target Host" required>
                                                <Input
                                                    placeholder="10.0.0.5 or hostname"
                                                    value={formHost}
                                                    onChange={e => { setFormHost(e.target.value); dirty(); clearErr('host'); }}
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
                                                    onChange={e => { setFormVmId(e.target.value); dirty(); clearErr('vmId'); }}
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
                                                onChange={e => { setFormPort(e.target.value); dirty(); clearErr('port'); }}
                                                validationStatus={formErrors.port ? 'error' : 'none'}
                                                className="font-mono"
                                                disabled={!canUpdate}
                                            />
                                            {formErrors.port && <p className="mt-1 text-xs text-rose-500">{formErrors.port}</p>}
                                        </FormField>
                                    </div>
                                </div>
                                <div className="px-4 py-1 text-xs text-rose-500">
                                    DEBUG: canUpdate={String(canUpdate)} | formDirty={String(formDirty)}
                                </div>
                                {canUpdate && (
                                    <div className="flex items-center justify-end px-4 pb-4 pt-1 border-t border-neutral-200 dark:border-neutral-700">
                                        <Button variant="solid" color={themeColor} size="sm" loading={saving}
                                            disabled={!formDirty}
                                            onClick={() => void handleSave()}>
                                            Save Changes
                                        </Button>
                                    </div>
                                )}
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
                                    rows={formReqHeaders} onChange={setFormReqHeaders}
                                    onDirty={dirty} disabled={!canUpdate}
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
                                    rows={formResHeaders} onChange={setFormResHeaders}
                                    onDirty={dirty} disabled={!canUpdate}
                                    emptyLabel="No response headers configured."
                                    addLabel="Add Response Header"
                                />
                            </div>
                        ),
                    },
                ]}
            />
        </>
    );
};

export default RouteConfigBody;
