import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ConfirmModal, CustomIcon, DeleteConfirmModal, EmptyState, IconButton, NotificationModal, Pill, SplitView, Toggle, type SplitViewItem } from '@prl/ui-kit';
import { devopsService } from '@/services/devops';
import { ReverseProxyConfig, ReverseProxyHost } from '@/interfaces/ReverseProxy';
import { VirtualMachine } from '@/interfaces/VirtualMachine';
import { useSession } from '@/contexts/SessionContext';
import { Claims } from '@/interfaces/tokenTypes';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { ReverseProxyDetailPanel } from './ReverseProxyDetailPanel';
import { CreateProxyHostModal } from './ReverseProxyModals';
import { PageHeader, PageHeaderIcon } from '@/components/PageHeader';

// ── List item label ───────────────────────────────────────────────────────────

function ProxyHostLabel({ host }: { host: ReverseProxyHost }) {
  const httpCount = host.http_routes?.length ?? 0;
  const hasTcp = !!host.tcp_route;
  const hasRoutes = httpCount > 0 || hasTcp;
  const displayName = host.name || host.host || '—';
  const { themeColor } = useSystemSettings();

  const isUnhealthy =
    (hasTcp && !!host.tcp_route?.target_vm_id && host.tcp_route?.target_vm_details?.state?.toLowerCase() === 'stopped') ||
    (!hasTcp && (host.http_routes ?? []).some((r) => r.target_vm_id && r.target_vm_details?.state?.toLowerCase() === 'stopped'));

  return (
    <div className="flex flex-col gap-1 min-w-0 flex-1 w-full">
      <span className="font-medium truncate text-neutral-800 dark:text-neutral-200">
        {displayName}
        <span className="font-mono text-neutral-400 dark:text-neutral-500">:{host.port ?? '—'}</span>
      </span>
      <div className="flex items-center gap-1 flex-wrap">
        {hasTcp ? (
          <Pill size="sm" tone={themeColor} variant="soft">
            TCP
          </Pill>
        ) : httpCount > 0 ? (
          <Pill size="sm" tone={themeColor} variant="soft">
            {httpCount} HTTP {httpCount !== 1 ? 'routes' : 'route'}
          </Pill>
        ) : (
          !hasRoutes && (
            <Pill size="sm" tone="neutral" variant="soft">
              No routes
            </Pill>
          )
        )}
        {isUnhealthy && (
          <Pill size="sm" tone="rose" variant="soft">
            Unhealthy
          </Pill>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface ReverseProxyProps {
  /** When provided, operations target an orchestrated host (Hosts page integration). */
  orchestratorHostId?: string;
  /**
   * When provided (e.g. from HostDetailPanel), these VMs are used directly and no
   * independent fetch is made. When absent (standalone page), VMs are fetched.
   */
  availableVms?: VirtualMachine[];
}

export const ReverseProxy: React.FC<ReverseProxyProps> = ({ orchestratorHostId, availableVms: externalVms }) => {
  const { session, hasClaim } = useSession();
  const { themeColor } = useSystemSettings();
  const hostname = session?.hostname ?? '';

  const canCreate = hasClaim(Claims.CREATE_REVERSE_PROXY_HOST);

  const [config, setConfig] = useState<ReverseProxyConfig | null>(null);
  const [hosts, setHosts] = useState<ReverseProxyHost[]>([]);
  const [fetchedVms, setFetchedVms] = useState<VirtualMachine[]>([]);
  const availableVms = externalVms ?? fetchedVms;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | undefined>();

  const [toggling, setToggling] = useState(false);
  const [pendingToggle, setPendingToggle] = useState<boolean | null>(null);
  const [restarting, setRestarting] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [hostToDelete, setHostToDelete] = useState<ReverseProxyHost | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isEnabled = config?.enabled ?? false;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await devopsService.reverseProxy.getReverseProxy(hostname, orchestratorHostId);
      setConfig(result.reverse_proxy_config ?? null);
      setHosts(result.reverse_proxy_hosts ?? []);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load reverse proxy configuration');
    } finally {
      setLoading(false);
    }
  }, [hostname, orchestratorHostId]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  // Only fetch VMs when running standalone (no parent-supplied list).
  useEffect(() => {
    if (externalVms) return;
    devopsService.machines
      .getVirtualMachines(hostname, !!orchestratorHostId)
      .then(setFetchedVms)
      .catch(() => setFetchedVms([]));
  }, [hostname, orchestratorHostId, externalVms]);

  const handleToggleEngine = useCallback(
    async (enabled: boolean) => {
      setToggling(true);
      try {
        if (enabled) {
          await devopsService.reverseProxy.enableReverseProxy(hostname, orchestratorHostId);
        } else {
          await devopsService.reverseProxy.disableReverseProxy(hostname, orchestratorHostId);
        }
        setConfig((prev) => (prev ? { ...prev, enabled } : { enabled }));
      } finally {
        setToggling(false);
      }
    },
    [hostname, orchestratorHostId],
  );

  const handleRestartEngine = useCallback(async () => {
    setRestarting(true);
    try {
      await devopsService.reverseProxy.restartReverseProxy(hostname, orchestratorHostId);
    } finally {
      setRestarting(false);
    }
  }, [hostname, orchestratorHostId]);

  const handleAddHost = useCallback(
    async (data: Partial<ReverseProxyHost>) => {
      try {
        const created = await devopsService.reverseProxy.createReverseProxyHost(hostname, data, orchestratorHostId);
        setHosts((prev) => [...prev, created]);
        setSelectedId(created.id);
        setNotification({ type: 'success', message: `Proxy host "${data.host ?? ''}:${data.port ?? ''}" added successfully.` });
      } catch (err: any) {
        setNotification({ type: 'error', message: err?.message ?? 'Failed to add proxy host.' });
      }
    },
    [hostname, orchestratorHostId],
  );

  const handleDeleteHost = useCallback(
    async (host: ReverseProxyHost) => {
      if (!host.id) return;
      setDeleting(true);
      try {
        await devopsService.reverseProxy.deleteReverseProxyHost(hostname, host.id, orchestratorHostId);
        setHosts((prev) => prev.filter((h) => h.id !== host.id));
        setHostToDelete(null);
        if (selectedId === host.id) setSelectedId(undefined);
      } catch (err: any) {
        setNotification({ type: 'error', message: err?.message ?? 'Failed to delete proxy host.' });
      } finally {
        setDeleting(false);
      }
    },
    [hostname, orchestratorHostId, selectedId],
  );

  const handleUpdateHost = useCallback((updated: ReverseProxyHost) => {
    setHosts((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
  }, []);

  const items = useMemo<SplitViewItem[]>(
    () =>
      hosts.map((host) => ({
        id: host.id ?? '',
        label: <ProxyHostLabel host={host} />,
        icon: host.http_routes ? 'ReverseProxyHTTP' : 'ReverseProxyTCP',
        panel: (
          <ReverseProxyDetailPanel
            proxyHost={host}
            config={config ?? { enabled: false }}
            availableVms={availableVms}
            orchestratorHostId={orchestratorHostId}
            onDelete={setHostToDelete}
            onUpdate={handleUpdateHost}
          />
        ),
      })),
    [hosts, config, availableVms, orchestratorHostId, handleUpdateHost],
  );

  // ── Subtitle ─────────────────────────────────────────────────────────────
  const subtitle = loading ? 'Loading…' : `${hosts.length} proxy host${hosts.length !== 1 ? 's' : ''}${config?.host ? ` · ${config.host}:${config.port}` : ''}`;

  return (
    <div className="flex flex-col h-full min-h-0 bg-neutral-50 dark:bg-neutral-950">
      {/* ── Page header ─────────────────────────────────────────── */}
      <PageHeader
        icon={
          <PageHeaderIcon color={themeColor}>
            <CustomIcon icon="ReverseProxy" className="w-5 h-5" />
          </PageHeaderIcon>
        }
        title="Reverse Proxy"
        subtitle={subtitle}
        helper={{
          title: 'Reverse Proxy',
          color: themeColor,
          content: 'Manage your reverse proxy hosts and routes. [See documentation](https://parallels.github.io/prl-devops-service/docs/devops/catalog/overview/#reverse-proxy)',
        }}
        actions={
          <>
            {/* Engine status dot + label */}
            <div className="flex items-center gap-1.5 pr-1 border-r border-neutral-200 dark:border-neutral-700 mr-1">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isEnabled ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
              <Pill size="sm" tone={isEnabled ? 'emerald' : 'neutral'} variant="soft">
                {loading ? '…' : isEnabled ? 'Running' : 'Stopped'}
              </Pill>
            </div>
            {/* Engine toggle */}
            <Toggle
              tooltip={isEnabled ? 'Disable engine' : 'Enable engine'}
              checked={isEnabled}
              onChange={(e) => setPendingToggle(e.target.checked)}
              disabled={loading || toggling}
              color={themeColor}
              size="sm"
            />
            {/* Restart engine */}
            <IconButton
              tooltip="Restart Engine"
              icon="Restart"
              variant="ghost"
              color={themeColor}
              size="sm"
              loading={restarting}
              disabled={loading || !isEnabled}
              onClick={() => void handleRestartEngine()}
              aria-label="Restart proxy engine"
            />
          </>
        }
        className="flex-none bg-white dark:bg-neutral-900"
      />

      {/* ── Split view ──────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 bg-white">
        <SplitView
          className="flex-1 min-w-0"
          items={items}
          value={selectedId}
          onChange={(id) => setSelectedId(id)}
          loading={loading}
          error={error ?? undefined}
          onRetry={() => void fetchAll()}
          listTitle={`Proxy Hosts (${hosts.length})`}
          autoHideList={false}
          borderLeft
          color={themeColor}
          collapsible
          resizable
          autoExpand={false}
          minListWidth={220}
          searchPlaceholder="Search hosts…"
          panelEmptyState={
            <EmptyState
              disableBorder
              icon="ReverseProxy"
              title="No routes configured"
              subtitle="Add a proxy host to start routing traffic to your VMs."
              actionColor={themeColor}
              actionLeadingIcon="Add"
              actionVariant="solid"
              actionLabel="Add proxy host"
              onAction={() => setShowAddModal(true)}
            />
          }
          listActions={
            <>
              {canCreate && <IconButton tooltip='Create Route' variant="ghost" size="xs" color={themeColor} icon="Add" onClick={() => setShowAddModal(true)} aria-label="Add proxy host" />}
              <IconButton tooltip='Refresh' variant="ghost" size="xs" color={themeColor} icon="Restart" onClick={() => void fetchAll()} aria-label="Refresh" />
            </>
          }
          panelHeaderProps={(activeItem) => {
            const activeRoute = hosts.find((i) => i.id === activeItem?.id);
            const hasTcpRoute = !!activeRoute?.tcp_route;
            const httpRoutes = activeRoute?.http_routes ?? [];
            const routeType = hasTcpRoute ? 'TCP' : httpRoutes.length > 0 ? 'HTTP' : null;

            const canDelete = hasClaim(Claims.DELETE_REVERSE_PROXY_HOST);
            return activeRoute
              ? {
                  title: activeRoute.name || activeRoute.host || '—',
                  subtitle: `${activeRoute.host}:${activeRoute.port}`,
                  icon: (
                    <PageHeaderIcon color={themeColor}>
                      <CustomIcon icon={routeType === 'TCP' ? 'ReverseProxyTCP' : 'ReverseProxyHTTP'} className="w-5 h-5" />
                    </PageHeaderIcon>
                  ),
                  helper: {
                    title: 'Host Management',
                    color: themeColor,
                    content: 'This is used to manage the hosts. [See documentation](https://parallels.github.io/prl-devops-service/docs/devops/catalog/overview/)',
                  },
                  actions: (
                    <>
                      {routeType && (
                        <Pill size="sm" tone={themeColor} variant="soft">
                          {routeType}
                        </Pill>
                      )}
                      {canDelete && <IconButton icon="Trash" size="sm" variant="ghost" color="danger" onClick={() => setHostToDelete(activeRoute)} aria-label="Delete proxy host" />}
                    </>
                  ),
                }
              : {};
          }}
        />
      </div>

      <CreateProxyHostModal isOpen={showAddModal} existingHosts={hosts} orchestratorHostId={orchestratorHostId} onClose={() => setShowAddModal(false)} onSubmit={handleAddHost} />

      <DeleteConfirmModal
        isOpen={!!hostToDelete}
        onClose={() => setHostToDelete(null)}
        onConfirm={() => hostToDelete && void handleDeleteHost(hostToDelete)}
        title="Delete Proxy Host"
        icon="Trash"
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        isConfirmDisabled={deleting}
        confirmValue={`${hostToDelete?.host ?? ''}:${hostToDelete?.port ?? ''}`}
        confirmValueLabel="host address"
        size="md"
      >
        <p className="text-sm text-neutral-500 dark:text-neutral-400">This will remove the proxy host and all its configured routes permanently.</p>
      </DeleteConfirmModal>

      <ConfirmModal
        isOpen={pendingToggle !== null}
        onClose={() => setPendingToggle(null)}
        onConfirm={() => {
          if (pendingToggle !== null) void handleToggleEngine(pendingToggle);
          setPendingToggle(null);
        }}
        title={pendingToggle ? 'Enable Reverse Proxy' : 'Disable Reverse Proxy'}
        confirmLabel={pendingToggle ? 'Enable' : 'Disable'}
        confirmColor={pendingToggle ? 'emerald' : 'danger'}
        size="sm"
      >
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {pendingToggle ? 'The reverse proxy engine will start and begin routing traffic.' : 'The reverse proxy engine will stop and all traffic routing will be suspended.'}
        </p>
      </ConfirmModal>

      <NotificationModal
        isOpen={!!notification}
        onClose={() => setNotification(null)}
        type={notification?.type ?? 'info'}
        title={notification?.type === 'success' ? 'Success' : 'Error'}
        message={notification?.message ?? ''}
        actionLabel="OK"
      />
    </div>
  );
};
