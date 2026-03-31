import React, { useCallback, useEffect, memo, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ApplyConfirmModal,
  Button,
  CustomIcon,
  DeleteConfirmModal,
  EmptyState,
  HealthCheck,
  IconButton,
  Live,
  NotificationModal,
  Pill,
  SplitView,
  Run,
  Pause,
  Trash,
  TooltipWrapper,
  type SplitViewItem,
  type ThemeColor,
} from '@prl/ui-kit';
import { useSession } from '@/contexts/SessionContext';
import { useEventsHub } from '@/contexts/EventsHubContext';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { Claims } from '@/interfaces/tokenTypes';
import { HostDetailPanel } from './HostDetailPanel';
import { AddHostModal } from './AddHostModal/index';
import { devopsService } from '@/services/devops';
import { DevOpsRemoteHost } from '@/interfaces/devops';
import { OsIcon } from '@/utils/virtualMachine';
import { useNavigateTo } from '@/hooks/useNavigateTo';
import type { HostsDeepLinkState } from '@/types/deepLink';
import { useHighlight } from '@/contexts/HighlightContext';
import { VirtualMachine } from '@/interfaces/VirtualMachine';
import {
  getStateTone,
  parseHostAddedBody,
  parseHostDeployedBody,
  parseHostRemovedBody,
  parseVmReferenceBody,
  parseVmStateChangeBody,
  parseVmUptimeChangeBody,
  sortVirtualMachines,
  upsertVirtualMachine,
} from '@/utils/vmUtils';
import { drainUnseenMessages } from '@/utils/messageQueue';
import { PageHeaderIcon } from '@/components/PageHeader';

// ── Helpers ───────────────────────────────────────────────────────────────────

const HostItemLabel = memo(function HostItemLabel({ host }: { host: DevOpsRemoteHost }) {
  const enableTone: ThemeColor = host.enabled === false ? 'amber' : 'emerald';
  const stateTone: ThemeColor = host.state === 'healthy' ? 'emerald' : 'rose';
  const hostName = host.description ? host.description : host.host;
  return (
    <div className="flex gap-2 flex-1 w-full flex-col">
      <span className="grow font-medium truncate">{hostName}</span>
      <div className="flex flex-wrap items-center gap-1">
        <Pill size="sm" tone={stateTone} variant="soft">
          {host.state.charAt(0).toUpperCase() + host.state.slice(1)}
        </Pill>
        <Pill size="sm" tone={enableTone} variant="soft">
          {host.enabled === false ? 'Disabled' : 'Enabled'}
        </Pill>
        {(host.tags?.length ?? 0) > 0
          ? host.tags?.map(
              (tag) =>
                tag !== '' && (
                  <Pill key={tag} size="sm" tone="sky" variant="soft">
                    {tag}
                  </Pill>
                ),
            )
          : undefined}
      </div>
    </div>
  );
});

const HostSubtitleLabel = memo(function HostSubtitleLabel({ host }: { host: DevOpsRemoteHost }) {
  if (host.vms?.length ?? 0 > 0) {
    return <div className="flex gap-2 min-w-0 flex-1 w-full flex-col text-neutral-400 mt-2">{`${host.vms?.length || 0} VM${host.vms?.length !== 1 ? 's' : ''}`}</div>;
  }
  return null;
});

// ── Page component ────────────────────────────────────────────────────────────

export const Hosts: React.FC = () => {
  const { hasClaim, session } = useSession();
  const { containerMessages } = useEventsHub();
  const { themeColor } = useSystemSettings();
  const canCreate = hasClaim(Claims.CREATE_REVERSE_PROXY_HOST);
  const { toVm } = useNavigateTo();
  const { highlights, addHighlight, clearHighlights } = useHighlight();
  const location = useLocation();
  const deepLink = location.state as HostsDeepLinkState | null;
  const deepLinkConsumedRef = useRef(false);
  const lastOrchestratorEventIdRef = useRef<string | null>(null);
  const lastPdfmEventIdRef = useRef<string | null>(null);
  const pendingVmFetchesRef = useRef<Set<string>>(new Set());

  const [hosts, setHosts] = useState<DevOpsRemoteHost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | undefined>();

  const [keyToDelete, setKeyToDelete] = useState<DevOpsRemoteHost | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [keyToDisable, setKeyToDisable] = useState<DevOpsRemoteHost | null>(null);
  const [keyToEnable, setKeyToEnable] = useState<DevOpsRemoteHost | null>(null);
  const [disabling, setDisabling] = useState(false);
  const [enabling, setEnabling] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [deployNotification, setDeployNotification] = useState<string | null>(null);

  // Derive highlighted host set from context (set by MainLayout job watcher)
  const hostHighlights = useMemo(() => highlights.filter((e) => e.pageId === 'hosts'), [highlights]);
  const highlightedHostIds = useMemo(() => new Set(hostHighlights.map((e) => e.itemId).filter(Boolean) as string[]), [hostHighlights]);

  async function mapRemoteHost(h: DevOpsRemoteHost): Promise<DevOpsRemoteHost> {
    let hostVms: VirtualMachine[] = [];
    if (h.state == 'healthy') {
      const data = await devopsService.orchestrator.getOrchestratorVMs(session?.hostname ?? '', h.id ?? '');
      const unique = [...new Map((data ?? []).map((vm) => [vm.ID, vm])).values()];
      hostVms = sortVirtualMachines(unique);
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
      data.forEach((h) => {
        if (h.id) pendingVmFetchesRef.current.add(h.id);
      });
      const mapped = await Promise.all(data.map(mapRemoteHost));
      data.forEach((h) => {
        if (h.id) pendingVmFetchesRef.current.delete(h.id);
      });
      setHosts(mapped);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load hosts');
    } finally {
      setLoading(false);
    }
  }, [session?.hostname]);

  useEffect(() => {
    void fetchHosts();
  }, [fetchHosts]);

  const applyVmStateChange = useCallback((vmId: string, currentState: string, hostId?: string) => {
    setHosts((prev) =>
      prev.map((host) => {
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
      }),
    );
  }, []);

  const applyVmUptimeChange = useCallback((vmId: string, uptime: string, hostId?: string) => {
    setHosts((prev) =>
      prev.map((host) => {
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
      }),
    );
  }, []);

  const applyVmAddition = useCallback((vm: VirtualMachine, hostId?: string) => {
    const resolvedHostId = hostId ?? (typeof vm.host_id === 'string' ? vm.host_id : undefined);
    if (!resolvedHostId) return;

    setHosts((prev) =>
      prev.map((host) => {
        if (host.id !== resolvedHostId) return host;
        const updatedVms = upsertVirtualMachine(host.vms ?? [], vm);
        return { ...host, vms: updatedVms };
      }),
    );
  }, []);

  const applyVmRemoval = useCallback((vmId: string, hostId?: string) => {
    setHosts((prev) =>
      prev.map((host) => {
        if (hostId && host.id !== hostId) return host;

        const vms = host.vms ?? [];
        const updatedVms = vms.filter((vm) => vm.ID !== vmId);
        if (updatedVms.length === vms.length) return host;
        return { ...host, vms: updatedVms };
      }),
    );
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

        // Use a functional update so we always read current state — avoids the stale-closure
        // bug where HOST_WEBSOCKET_DISCONNECTED and HOST_HEALTH_UPDATE land in the same batch
        // and the healthy message sees pre-disconnect state and is silently dropped.
        setHosts((prev) =>
          prev.map((host) => {
            if (host.id !== hostId) return host;
            if (host.state === state && host.has_websocket_events === (state === 'healthy')) return host;
            return { ...host, state, has_websocket_events: state === 'healthy' };
          }),
        );
      } else if (raw.message === 'HOST_WEBSOCKET_DISCONNECTED') {
        const hostId = raw.body?.host_id as string | undefined;
        if (!hostId) continue;

        // A WebSocket disconnect means the event stream dropped — not that the host is down.
        // Only clear the live indicator; leave host.state for HOST_HEALTH_UPDATE to decide.
        setHosts((prev) =>
          prev.map((host) => {
            if (host.id !== hostId || !host.has_websocket_events) return host;
            return { ...host, has_websocket_events: false };
          }),
        );
      } else if (raw.message === 'HOST_ADDED') {
        const { hostId } = parseHostAddedBody(raw.body);
        if (!hostId || !session?.hostname) continue;

        devopsService.orchestrator
          .getOrchestratorHosts(session.hostname)
          .then(async (all) => {
            const found = all.find((h) => h.id === hostId);
            if (!found) return;
            const mapped = await mapRemoteHost(found);
            setHosts((prev) => (prev.some((h) => h.id === hostId) ? prev : [...prev, mapped]));
          })
          .catch((err) => console.warn('[Hosts] Failed to fetch added host:', err));
      } else if (raw.message === 'HOST_REMOVED') {
        const { hostId } = parseHostRemovedBody(raw.body);
        if (!hostId) continue;

        setHosts((prev) => prev.filter((h) => h.id !== hostId));
        setSelectedId((prev) => (prev === hostId ? undefined : prev));
      } else if (raw.message === 'HOST_DEPLOYED') {
        const { hostId, message } = parseHostDeployedBody(raw.body);
        if (!hostId || !session?.hostname) continue;

        devopsService.orchestrator
          .getOrchestratorHosts(session.hostname)
          .then(async (all) => {
            const found = all.find((h) => h.id === hostId);
            if (!found) return;
            const mapped = await mapRemoteHost(found);
            setHosts((prev) => prev.map((h) => (h.id === hostId ? mapped : h)));
          })
          .catch((err) => console.warn('[Hosts] Failed to refresh deployed host:', err));
        setDeployNotification(message ?? 'Host deployed successfully.');
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

  const handlePause = useCallback(
    (host: DevOpsRemoteHost) => {
      setDisabling(true);
      setKeyToDisable(null);
      void devopsService.orchestrator
        .disableOrchestratorHost(session?.hostname ?? '', host.id ?? '')
        .then(() => {
          setDisabling(false);
          void fetchHosts();
        })
        .catch((err) => {
          setDisabling(false);
          setError(err?.message ?? 'Failed to disable host');
        });
    },
    [session?.hostname, fetchHosts],
  );

  const handleEnable = useCallback(
    (host: DevOpsRemoteHost) => {
      setEnabling(true);
      setKeyToEnable(null);
      void devopsService.orchestrator
        .enableOrchestratorHost(session?.hostname ?? '', host.id ?? '')
        .then(() => {
          setEnabling(false);
          void fetchHosts();
        })
        .catch((err) => {
          setEnabling(false);
          setError(err?.message ?? 'Failed to enable host');
        });
    },
    [session?.hostname, fetchHosts],
  );

  const handleEnableDisableCallback = useCallback((host: DevOpsRemoteHost) => {
    if (host.enabled === false) {
      setKeyToEnable(host);
    } else {
      setKeyToDisable(host);
    }
  }, []);

  const handleRemoveCallback = useCallback((host: DevOpsRemoteHost) => {
    setKeyToDelete(host);
  }, []);

  const handleRemove = useCallback(
    async (host: DevOpsRemoteHost) => {
      if (!host.id) {
        setError('Host ID is required');
        return;
      }
      try {
        setDeleting(true);
        setKeyToDelete(host);
        await devopsService.orchestrator.removeOrchestratorHost(session?.hostname ?? '', host.id);
        setHosts((prev) => prev.filter((h) => h.id !== host.id));
        setSelectedId((prev) => (prev === host.id ? undefined : prev));
      } catch (err: any) {
        setError(err?.message ?? 'Failed to remove host');
      } finally {
        setDeleting(false);
        setKeyToDelete(null);
      }
    },
    [session?.hostname],
  );

  const items = useMemo<SplitViewItem[]>(
    () =>
      hosts.map((host) => ({
        id: host.id ?? '',
        label: <HostItemLabel host={host} />,
        subtitle: <HostSubtitleLabel host={host} />,
        icon: 'Host' as const,
        highlight: highlightedHostIds.has(host.id ?? ''),
        panel: <HostDetailPanel host={host} />,
        subContent:
          host.vms && host.vms.length > 0 ? (
            <div className="border-t border-gray-100 dark:border-gray-800">
              {host.vms.filter((vm, idx, arr) => arr.findIndex((v) => v.ID === vm.ID) === idx).map((vm) => (
                <div
                  key={vm.ID as string}
                  role="button"
                  tabIndex={0}
                  title="Open in VMs page"
                  onClick={() => {
                    addHighlight({ pageId: 'vms', itemId: 'orchestrator', recordId: vm.ID as string, state: 'info' });
                    toVm(vm.ID as string, 'orchestrator');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addHighlight({ pageId: 'vms', itemId: 'orchestrator', recordId: vm.ID as string, state: 'info' });
                      toVm(vm.ID as string, 'orchestrator');
                    }
                  }}
                  className="flex items-center py-2 pl-6 truncate w-full px-4 hover:bg-gray-200/60 dark:hover:bg-gray-800/40 cursor-pointer max-h-12"
                >
                  <div className="flex  h-full p-2">
                    <OsIcon os={vm.OS as string} />
                  </div>
                  <div className="flex flex-col w-full truncate">
                    <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate">
                      {vm.Name as React.ReactNode}{' '}
                      <Pill size="sm" tone={getStateTone(vm.State)}>
                        {vm.State as React.ReactNode}
                      </Pill>
                    </span>
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono truncate">{vm.ID as React.ReactNode}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : undefined,
      })),
    [hosts, highlightedHostIds, addHighlight, toVm],
  );

  return (
    <div className="relative flex h-full min-h-0">
      <SplitView
        className="flex-1 min-w-0"
        items={items}
        value={selectedId}
        onChange={(id) => {
          setSelectedId(id);
          clearHighlights({ pageId: 'hosts', itemId: id });
        }}
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
        panelEmptyState={<EmptyState disableBorder icon="Host" title="Select a host" subtitle="Choose a host from the list to view its details." tone="neutral" />}
        listActions={
          <>
            {canCreate && <IconButton variant="ghost" size="xs" color={themeColor} icon="Add" onClick={() => setShowAddModal(true)} aria-label="Add host" />}
            <IconButton variant="ghost" size="xs" color={themeColor} icon="Restart" onClick={() => void fetchHosts()} aria-label="Refresh hosts" />
          </>
        }
        panelHeaderProps={(activeItem) => {
          const host = hosts.find((h) => h.id === activeItem?.id);
          return host
            ? {
                title: host.description ? host.description : host.host,
                subtitle: host.host,
                icon: (
                  <PageHeaderIcon color={themeColor}>
                    <CustomIcon icon="Host" className="w-5 h-5" />
                  </PageHeaderIcon>
                ),
                badge: host.enabled === false ? { text: 'Disabled', color: 'rose' } : undefined,
                helper: {
                  title: 'Host Management',
                  color: themeColor,
                  content: 'This is used to manage the hosts. [See documentation](https://parallels.github.io/prl-devops-service/docs/devops/catalog/overview/)',
                },
                actions: (
                  <>
                    <TooltipWrapper text={host.state === 'healthy' ? 'Healthy' : 'Unhealthy'}>
                      <HealthCheck className={`w-6 h-6 ${host.state === 'healthy' ? 'text-emerald-600' : 'text-rose-600'}`} aria-label={host.state === 'healthy' ? 'Healthy' : 'Unhealthy'} />
                    </TooltipWrapper>
                    <TooltipWrapper text={host.has_websocket_events ? 'Real-time events are live' : 'Real-time events are offline'}>
                      <Live className={`w-6 h-6 ${host.has_websocket_events ? 'text-emerald-600' : 'text-rose-600'}`} aria-label={host.has_websocket_events ? 'Live' : 'Offline'} />
                    </TooltipWrapper>
                  </>
                ),
                headerDetails: {
                  variant: 'subtle',
                  decoration: 'none',
                  bordered: false,
                  tone: 'white',
                  tags: (
                    <>
                      {host.enabled ? (
                        <Button
                          tooltip="This will disable the Host"
                          variant="solid"
                          color="amber"
                          size="sm"
                          aria-label="Disable Host"
                          onClick={() => handleEnableDisableCallback(host)}
                          leadingIcon={<Pause />}
                        >
                          Disable
                        </Button>
                      ) : (
                        <Button
                          tooltip="This will enable the Host"
                          variant="solid"
                          color="emerald"
                          size="sm"
                          aria-label="Enable Host"
                          onClick={() => handleEnableDisableCallback(host)}
                          leadingIcon={<Run />}
                        >
                          Enable
                        </Button>
                      )}
                      <Button tooltip="This will remove the Host" variant="solid" color="rose" size="sm" aria-label="Remove Host" onClick={() => handleRemoveCallback(host)} leadingIcon={<Trash />}>
                        Remove
                      </Button>
                    </>
                  ),
                },
              }
            : {};
        }}
      />

      <AddHostModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdded={(isAsync) => {
          void fetchHosts();
          if (isAsync) setDeployNotification('Deployment started — the host will appear once the agent comes online.');
        }}
      />

      <NotificationModal isOpen={!!deployNotification} onClose={() => setDeployNotification(null)} title="Deployment Started" message={deployNotification ?? ''} type="info" />

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
        <p className="text-sm text-neutral-500 dark:text-neutral-400">This action is irreversible. Any applications using this host will immediately lose access.</p>
      </DeleteConfirmModal>
      <ApplyConfirmModal
        isOpen={!!keyToDisable}
        onClose={() => setKeyToDisable(null)}
        onConfirm={() => {
          if (keyToDisable) {
            void handlePause(keyToDisable);
          }
        }}
        title="Disable Host"
        icon="Pause"
        confirmLabel={disabling ? 'Disabling…' : 'Disable'}
        isConfirmDisabled={disabling}
        confirmValue={keyToDisable?.description ?? keyToDisable?.host ?? ''}
        confirmValueLabel="host name"
        size="md"
      >
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          This will temporarily disable the host in the orchestrator. Any resources or virtual machines associated with this host will become inaccessible via the orchestrator until it is enabled
          again.
        </p>
      </ApplyConfirmModal>
      <ApplyConfirmModal
        isOpen={!!keyToEnable}
        onClose={() => setKeyToEnable(null)}
        onConfirm={() => keyToEnable && void handleEnable(keyToEnable)}
        title="Enable Host"
        icon="Run"
        confirmLabel={enabling ? 'Enabling…' : 'Enable'}
        isConfirmDisabled={enabling}
        confirmValue={keyToEnable?.description ?? keyToEnable?.host ?? ''}
        confirmValueLabel="host name"
        size="md"
      >
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          This will enable the host in the orchestrator. Any resources or virtual machines associated with this host will now be accessible via the orchestrator.
        </p>
      </ApplyConfirmModal>
    </div>
  );
};
