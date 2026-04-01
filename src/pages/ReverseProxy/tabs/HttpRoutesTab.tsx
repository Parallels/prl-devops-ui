import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CustomIcon, EmptyState, IconButton, Pill, ReverseProxyFrom, ReverseProxyTo, VirtualMachine as VirtualMachineIcon, TreeView, type TreeItemData } from '@prl/ui-kit';
import type { ReverseProxyHost, ReverseProxyHostHttpRoute } from '@/interfaces/ReverseProxy';
import type { VirtualMachine } from '@/interfaces/VirtualMachine';
import type { HttpRouteFormData } from '../ReverseProxyModals';
import RouteConfigBody from './HttpRoutes/RouteConfigBody';
import RouteRow from './HttpRoutes/RouteRow';
import { healthToTone, type VmHealth } from './HttpRoutes/routeTypes';

// ── Props ─────────────────────────────────────────────────────────────────────

interface HttpRoutesTabProps {
  proxyHost: ReverseProxyHost;
  proxyEnabled: boolean;
  routes: ReverseProxyHostHttpRoute[];
  hasTcpRoute: boolean;
  availableVms: VirtualMachine[];
  orchestratorHostId?: string;
  canUpdate: boolean;
  canDelete: boolean;
  onUpdateRoute: (routeId: string, data: HttpRouteFormData) => Promise<void>;
  onDeleteRoute: (routeId: string) => Promise<void>;
  onReorderRoute?: (routeId: string, oldOrder: number, newOrder: number) => Promise<void> | void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const HttpRoutesTab: React.FC<HttpRoutesTabProps> = ({
  proxyHost,
  proxyEnabled,
  routes,
  hasTcpRoute,
  availableVms,
  orchestratorHostId,
  canUpdate,
  canDelete,
  onUpdateRoute,
  onDeleteRoute,
  onReorderRoute,
}) => {
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = useCallback(
    async (id: string) => {
      setDeleting(id);
      try {
        await onDeleteRoute(id);
      } finally {
        setDeleting(null);
      }
    },
    [onDeleteRoute],
  );

  // ── Per-route health state — reported by null-rendering RouteRow components ──

  const [routeHealthList, setRouteHealthList] = useState<VmHealth[]>(() => routes.map(() => 'unknown'));
  const [routeActionLoadings, setRouteActionLoadings] = useState<boolean[]>(() => routes.map(() => false));
  // Stable ref to each route's current VM action handler
  const actionHandlers = useRef<Array<() => Promise<void>>>([]);

  // Resize arrays when routes are added or removed
  const routeCount = routes.length;
  useEffect(() => {
    setRouteHealthList((prev) => routes.map((_, i) => prev[i] ?? 'unknown'));
    setRouteActionLoadings((prev) => routes.map((_, i) => prev[i] ?? false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeCount]);

  const handleHealthChange = useCallback((i: number, h: VmHealth) => {
    setRouteHealthList((prev) => {
      if (prev[i] === h) return prev;
      const n = [...prev];
      n[i] = h;
      return n;
    });
  }, []);
  const handleActionLoadingChange = useCallback((i: number, l: boolean) => {
    setRouteActionLoadings((prev) => {
      if (prev[i] === l) return prev;
      const n = [...prev];
      n[i] = l;
      return n;
    });
  }, []);
  const handleActionRef = useCallback((i: number, fn: () => Promise<void>) => {
    actionHandlers.current[i] = fn;
  }, []);

  // ── Build TreeItemData[] ──────────────────────────────────────────────────

  const routeItems = useMemo<TreeItemData[]>(
    () =>
      routes.map((route, i) => {
        const health = routeHealthList[i] ?? 'unknown';
        const actionLoading = routeActionLoadings[i] ?? false;
        const hasVmTarget = !!route.target_vm_id;
        const tone = healthToTone(health, proxyEnabled);
        const isProxyDown = !proxyEnabled;
        const showVmAction = hasVmTarget && (health === 'stopped' || health === 'paused' || health === 'suspended');
        const targetLabel = route.target_vm_id ? (route.target_vm_details?.name ?? availableVms.find((v) => v.ID === route.target_vm_id)?.Name ?? route.target_vm_id) : (route.target_host ?? '—');

        return {
          id: route.id ?? String(i),
          tone,
          active: health === 'running' && proxyEnabled,
          icon: hasVmTarget ? <VirtualMachineIcon className="w-10 h-10" /> : <ReverseProxyTo className="w-10 h-10" />,

          title: (
            <div className="flex items-center gap-1.5 min-w-0">
              <Pill size="sm" tone={route.schema === 'https' ? 'emerald' : 'sky'} variant="soft" className="shrink-0">
                {route.schema === 'https' ? 'HTTPS' : 'HTTP'}
              </Pill>
              <span className="font-mono font-semibold truncate">{route.path ?? '/'}</span>
            </div>
          ),
          titleClassName: '!overflow-visible',
          subtitle: `${targetLabel}:${route.target_port ?? '—'}`,

          badge:
            hasVmTarget || isProxyDown ? (
              <div className="flex flex-wrap items-center gap-1">
                {hasVmTarget &&
                  !isProxyDown &&
                  (() => {
                    switch (health) {
                      case 'running':
                        return (
                          <Pill key="h" size="sm" tone="emerald" variant="soft">
                            Running
                          </Pill>
                        );
                      case 'stopped':
                        return (
                          <Pill key="h" size="sm" tone="rose" variant="soft">
                            Stopped
                          </Pill>
                        );
                      case 'paused':
                        return (
                          <Pill key="h" size="sm" tone="amber" variant="soft">
                            Paused
                          </Pill>
                        );
                      case 'suspended':
                        return (
                          <Pill key="h" size="sm" tone="amber" variant="soft">
                            Suspended
                          </Pill>
                        );
                      default:
                        return (
                          <Pill key="h" size="sm" tone="neutral" variant="soft">
                            Unknown
                          </Pill>
                        );
                    }
                  })()}
                {isProxyDown && (
                  <Pill size="sm" tone="neutral" variant="soft">
                    Proxy disabled
                  </Pill>
                )}
              </div>
            ) : undefined,
          actions:
            showVmAction && !isProxyDown ? (
              <IconButton
                icon={health === 'stopped' ? 'Run' : 'Refresh'}
                tooltip={health === 'stopped' ? 'Start VM' : 'Resume VM'}
                variant="ghost"
                color={health === 'stopped' ? 'success' : 'warning'}
                size="xs"
                loading={actionLoading} onClick={() => void actionHandlers.current[i]?.()} />
            ) : undefined,

          hoverActions: canDelete ? (
            <IconButton icon="Trash" size="xs" variant="ghost" color="danger" loading={deleting === route.id} onClick={() => route.id && void handleDelete(route.id)} aria-label="Delete route" />
          ) : undefined,

          body: canUpdate || canDelete ? <RouteConfigBody route={route} canUpdate={canUpdate} availableVms={availableVms} onSave={onUpdateRoute} /> : undefined,
        };
      }),
    [routes, routeHealthList, routeActionLoadings, proxyEnabled, canDelete, canUpdate, deleting, availableVms, onUpdateRoute, handleDelete],
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Null-rendering health managers — one per route */}
      {routes.map((route, i) => (
        <RouteRow
          key={route.id ?? i}
          route={route}
          index={i}
          orchestratorHostId={orchestratorHostId}
          onHealthChange={handleHealthChange}
          onActionLoadingChange={handleActionLoadingChange}
          onActionRef={handleActionRef}
        />
      ))}

      {/* Pipeline view */}
      <div className="flex-1 overflow-y-auto p-4">
        {hasTcpRoute && (
          <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <CustomIcon icon="Info" className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-300">A TCP route is active on this host. Remove it first before adding HTTP routes.</p>
          </div>
        )}

        <TreeView
          root={{
            id: 'listener',
            tone: proxyEnabled ? 'emerald' : 'neutral',
            active: proxyEnabled,
            icon: <ReverseProxyFrom className={`w-8 h-8 ${proxyEnabled ? 'animate-pulse' : ''}`} />,
            title: (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5">Listening</p>
                <p className="text-sm font-mono font-medium">
                  {proxyHost.host || '0.0.0.0'}:{proxyHost.port}
                </p>
              </div>
            ),
            titleClassName: '!overflow-visible',
            badge: proxyEnabled ? (
              <Pill size="sm" tone="emerald" variant="soft">
                Running
              </Pill>
            ) : (
              <Pill size="sm" tone="neutral" variant="soft">
                Disabled
              </Pill>
            ),
          }}
          items={routeItems}
          stubHeight={12}
          animated
          showLine
          showConnectors
          connectorHalf
          connectorBorderSize="fit"
          dotSpacing={30}
          indent="md"
          reorderable
          onReorder={({ id, oldOrder, newOrder }) => {
            if (!onReorderRoute || oldOrder === newOrder) return;
            void onReorderRoute(id, oldOrder, newOrder);
          }}
          emptyState={
            <EmptyState
              icon="Script"
              title="No HTTP routes"
              subtitle={hasTcpRoute ? 'Remove the TCP route to enable HTTP routing.' : 'Add a route to start forwarding traffic.'}
              tone="neutral"
              disableBorder
            />
          }
        />
      </div>
    </div>
  );
};
