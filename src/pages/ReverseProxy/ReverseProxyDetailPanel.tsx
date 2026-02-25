import React, { useCallback, useEffect, useState } from 'react';
import { CustomIcon, IconButton, Pill, Tabs } from '@prl/ui-kit';
import { ReverseProxyConfig, ReverseProxyHost, ReverseProxyHostHttpRoute, ReverseProxyHostTcpRoute } from '@/interfaces/ReverseProxy';
import { VirtualMachine } from '@/interfaces/VirtualMachine';
import { PageHeader, PageHeaderIcon } from '@/components/PageHeader';
import { RoutesTab } from './tabs/RoutesTab';
import { TcpRouteTab } from './tabs/TcpRouteTab';
import { TcpLogsTab } from './tabs/TcpLogsTab';
import { SettingsTab } from './tabs/SettingsTab';
import { TcpRouteView } from './TcpRouteView';
import { HttpRouteFormData } from './ReverseProxyModals';
import { devopsService } from '@/services/devops';
import { useSession } from '@/contexts/SessionContext';
import { Claims } from '@/interfaces/tokenTypes';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ReverseProxyDetailPanelProps {
    proxyHost: ReverseProxyHost;
    config: ReverseProxyConfig;
    availableVms: VirtualMachine[];
    orchestratorHostId?: string;
    onDelete: (proxyHost: ReverseProxyHost) => void;
    onUpdate: (updated: ReverseProxyHost) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const ReverseProxyDetailPanel: React.FC<ReverseProxyDetailPanelProps> = ({
    proxyHost,
    config,
    availableVms,
    orchestratorHostId,
    onDelete,
    onUpdate,
}) => {
    const { session, hasClaim } = useSession();
    const hostname = session?.hostname ?? '';

    const canUpdate = hasClaim(Claims.UPDATE_REVERSE_PROXY_HOST);
    const canCreate = hasClaim(Claims.CREATE_REVERSE_PROXY_HOST);
    const canDelete = hasClaim(Claims.DELETE_REVERSE_PROXY_HOST);
    const canCreateRoute = hasClaim(Claims.CREATE_REVERSE_PROXY_HOST_HTTP_ROUTE);
    const canUpdateRoute = hasClaim(Claims.UPDATE_REVERSE_PROXY_HOST_HTTP_ROUTE);
    const canDeleteRoute = hasClaim(Claims.DELETE_REVERSE_PROXY_HOST_HTTP_ROUTE);

    const [localHost, setLocalHost] = useState<ReverseProxyHost>(proxyHost);
    const [restarting, setRestarting] = useState(false);

    // Keep local state in sync when the parent updates (e.g. after list refresh)
    useEffect(() => { setLocalHost(proxyHost); }, [proxyHost]);

    const hasTcpRoute = !!(localHost.tcp_route);
    const httpRoutes = localHost.http_routes ?? [];
    const routeType = hasTcpRoute ? 'TCP' : httpRoutes.length > 0 ? 'HTTP' : null;

    const handleRestart = useCallback(async () => {
        setRestarting(true);
        try {
            await devopsService.reverseProxy.restartReverseProxy(hostname, orchestratorHostId);
        } finally {
            setRestarting(false);
        }
    }, [hostname, orchestratorHostId]);

    const buildHttpRoutePayload = (data: HttpRouteFormData, routeId?: string): Partial<ReverseProxyHostHttpRoute> => ({
        ...(routeId ? { id: routeId } : {}),
        path: data.path,
        schema: data.schema,
        ...(data.pattern.trim() ? { pattern: data.pattern.trim() } : {}),
        ...(data.targetType === 'static'
            ? { target_host: data.targetHost, target_port: data.targetPort }
            : { target_vm_id: data.targetVmId, target_port: data.targetPort }),
        request_headers: data.requestHeaders.reduce<Record<string, string>>((acc, { key, value }) => {
            if (key.trim()) acc[key.trim()] = value;
            return acc;
        }, {}),
        response_headers: data.responseHeaders.reduce<Record<string, string>>((acc, { key, value }) => {
            if (key.trim()) acc[key.trim()] = value;
            return acc;
        }, {}),
    });

    const handleAddHttpRoute = useCallback(async (data: HttpRouteFormData) => {
        const route = buildHttpRoutePayload(data);
        await devopsService.reverseProxy.upsertHttpRoute(hostname, localHost.id!, route, orchestratorHostId);
        const freshHost = await devopsService.reverseProxy.getReverseProxyHost(hostname, localHost.id!, orchestratorHostId);
        setLocalHost(freshHost);
        onUpdate(freshHost);
    }, [hostname, localHost, orchestratorHostId, onUpdate]);

    const handleUpdateHttpRoute = useCallback(async (routeId: string, data: HttpRouteFormData) => {
        const route = buildHttpRoutePayload(data, routeId);
        await devopsService.reverseProxy.upsertHttpRoute(hostname, localHost.id!, route, orchestratorHostId);
        const freshHost = await devopsService.reverseProxy.getReverseProxyHost(hostname, localHost.id!, orchestratorHostId);
        setLocalHost(freshHost);
        onUpdate(freshHost);
    }, [hostname, localHost, orchestratorHostId, onUpdate]);

    const handleDeleteHttpRoute = useCallback(async (routeId: string) => {
        await devopsService.reverseProxy.deleteHttpRoute(hostname, localHost.id!, routeId, orchestratorHostId);
        const freshHost = await devopsService.reverseProxy.getReverseProxyHost(hostname, localHost.id!, orchestratorHostId);
        setLocalHost(freshHost);
        onUpdate(freshHost);
    }, [hostname, localHost, orchestratorHostId, onUpdate]);

    const handleSaveTcpRoute = useCallback(async (route: Partial<ReverseProxyHostTcpRoute>) => {
        await devopsService.reverseProxy.upsertTcpRoute(hostname, localHost.id!, route, orchestratorHostId);
        // Always re-fetch the full host so target_vm_details (name, state, etc.) is populated —
        // the upsert endpoint only returns a partial route without VM details.
        const freshHost = await devopsService.reverseProxy.getReverseProxyHost(hostname, localHost.id!, orchestratorHostId);
        setLocalHost(freshHost);
        onUpdate(freshHost);
    }, [hostname, localHost, orchestratorHostId, onUpdate]);

    const handleClearTcpRoute = useCallback(async () => {
        const updated = { ...localHost, tcp_route: undefined };
        setLocalHost(updated);
        onUpdate(updated);
    }, [localHost, onUpdate]);

    const handleSaveSettings = useCallback(async (patch: Partial<ReverseProxyHost>) => {
        await devopsService.reverseProxy.updateReverseProxyHost(
            hostname, localHost.id!, patch, orchestratorHostId
        );
        // Re-fetch full host to preserve tcp_route.target_vm_details across settings saves.
        const freshHost = await devopsService.reverseProxy.getReverseProxyHost(hostname, localHost.id!, orchestratorHostId);
        setLocalHost(freshHost);
        onUpdate(freshHost);
    }, [hostname, localHost, orchestratorHostId, onUpdate]);

    const displayName = localHost.name || localHost.host || '—';
    const title = `${displayName}:${localHost.port ?? '—'}`;

    return (
        <div className="flex flex-col h-full min-h-0">
            <PageHeader
                icon={<PageHeaderIcon color="rose"><CustomIcon icon={routeType === 'TCP' ? 'ReverseProxyTCP' : 'ReverseProxyHTTP'} className="w-5 h-5" /></PageHeaderIcon>}
                title={title}
                subtitle={localHost.id}
                actions={<>
                    {routeType && (
                        <Pill size="sm" tone={routeType === 'TCP' ? 'violet' : 'sky'} variant="soft">
                            {routeType}
                        </Pill>
                    )}
                    <IconButton
                        icon="Restart"
                        size="sm"
                        variant="ghost"
                        color="slate"
                        loading={restarting}
                        onClick={() => void handleRestart()}
                        aria-label="Restart proxy engine"
                    />
                    {canDelete && (
                        <IconButton
                            icon="Trash"
                            size="sm"
                            variant="ghost"
                            color="danger"
                            onClick={() => onDelete(localHost)}
                            aria-label="Delete proxy host"
                        />
                    )}
                </>}
            />

            {hasTcpRoute ? (
                <Tabs
                    variant="underline"
                    color="parallels"
                    size="sm"
                    className="flex-1 min-h-0"
                    listClassName="bg-white dark:bg-neutral-900 px-1"
                    panelIdPrefix="tcp-route-detail"
                    scrollFade
                    items={[
                        {
                            id: 'routes',
                            label: 'Routes',
                            panel: (
                                <TcpRouteView
                                    proxyHost={localHost}
                                    availableVms={availableVms}
                                    orchestratorHostId={orchestratorHostId}
                                    proxyEnabled={config?.enabled ?? true}
                                    canCreate={canCreate}
                                    canUpdate={canUpdate}
                                    onSaveRoute={handleSaveTcpRoute}
                                    onClearRoute={() => void handleClearTcpRoute()}
                                    onSaveSettings={handleSaveSettings}
                                />
                            ),
                        },
                        {
                            id: 'logs',
                            label: 'Logs',
                            panel: <TcpLogsTab hostId={localHost.id} />,
                        },
                    ]}
                />
            ) : (
                <Tabs
                    variant="underline"
                    color="parallels"
                    size="sm"
                    className="flex-1 min-h-0"
                    listClassName="bg-white dark:bg-neutral-900 px-1"
                    panelIdPrefix="proxy-detail"
                    scrollFade
                    items={[
                        {
                            id: 'routes',
                            label: `HTTP Routes${httpRoutes.length ? ` (${httpRoutes.length})` : ''}`,
                            panel: (
                                <RoutesTab
                                    proxyHost={localHost}
                                    proxyEnabled={config?.enabled ?? true}
                                    routes={httpRoutes}
                                    hasTcpRoute={hasTcpRoute}
                                    availableVms={availableVms}
                                    orchestratorHostId={orchestratorHostId}
                                    canCreate={canCreateRoute}
                                    canUpdate={canUpdateRoute}
                                    canDelete={canDeleteRoute}
                                    onAddRoute={handleAddHttpRoute}
                                    onUpdateRoute={handleUpdateHttpRoute}
                                    onDeleteRoute={handleDeleteHttpRoute}
                                />
                            ),
                        },
                        ...(httpRoutes.length === 0 ? [{
                            id: 'tcp',
                            label: 'TCP Route',
                            panel: (
                                <TcpRouteTab
                                    tcpRoute={localHost.tcp_route}
                                    hasHttpRoutes={httpRoutes.length > 0}
                                    availableVms={availableVms}
                                    canCreate={canCreate}
                                    onSave={handleSaveTcpRoute}
                                    onClear={() => void handleClearTcpRoute()}
                                />
                            ),
                        }] : []),
                        {
                            id: 'settings',
                            label: 'Settings',
                            panel: (
                                <SettingsTab
                                    proxyHost={localHost}
                                    canUpdate={canUpdate}
                                    onSave={handleSaveSettings}
                                />
                            ),
                        },
                    ]}
                />
            )}
        </div>
    );
};
