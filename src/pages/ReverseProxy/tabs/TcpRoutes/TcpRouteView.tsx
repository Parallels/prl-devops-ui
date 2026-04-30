import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, ConfirmModal, Panel } from '@prl/ui-kit';
import { ReverseProxyHost, ReverseProxyHostTcpRoute } from '@/interfaces/ReverseProxy';
import { VirtualMachine } from '@/interfaces/VirtualMachine';
import { devopsService } from '@/services/devops';
import { useSession } from '@/contexts/SessionContext';
import { useEventsHub } from '@/contexts/EventsHubContext';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { parseVmStateChangeBody } from '@/utils/vmUtils';
import { drainUnseenMessages } from '@/utils/messageQueue';
import TcpFlowHeader from './TcpFlowHeader';
import TcpRouteEditor from './TcpRouteEditor';
import { getVmHealth, resolveTargetType, type TargetType, type VmHealth } from './types';

export interface TcpRouteViewProps {
  proxyHost: ReverseProxyHost;
  availableVms: VirtualMachine[];
  orchestratorHostId?: string;
  proxyEnabled: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  onSaveRoute: (route: Partial<ReverseProxyHostTcpRoute>) => Promise<void>;
  onClearRoute: () => void;
}

export const TcpRouteView: React.FC<TcpRouteViewProps> = ({ proxyHost, availableVms, orchestratorHostId, proxyEnabled, canCreate, canUpdate, onSaveRoute, onClearRoute }) => {
  const { session } = useSession();
  const { themeColor } = useSystemSettings();
  const hostname = session?.hostname ?? '';
  const { containerMessages } = useEventsHub();

  const tcpRoute = proxyHost.tcp_route;

  const [localVmHealth, setLocalVmHealth] = useState<VmHealth>(() => getVmHealth(tcpRoute?.target_vm_details?.state));
  const [actionLoading, setActionLoading] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);
  const POLL_INTERVAL_MS = 3000;
  const MAX_POLLS = 20;

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    pollCountRef.current = 0;
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  // Track whether we've fetched real state so Effect B doesn't reset it
  const resolvedVmIdRef = useRef<string | null>(null);

  const lastOrchestratorEventIdRef = useRef<string | null>(null);
  const lastPdfmEventIdRef = useRef<string | null>(null);

  const vmId = tcpRoute?.target_vm_id;

  useEffect(() => {
    if (!vmId) return;
    const msgs = containerMessages.orchestrator;
    const unseen = drainUnseenMessages(msgs, lastOrchestratorEventIdRef);
    if (unseen.length === 0) return;

    for (const msg of unseen) {
      const { raw } = msg;
      if (raw.message !== 'HOST_VM_STATE_CHANGED') continue;

      const event = parseVmStateChangeBody(raw.body);
      if (event.vmId !== vmId || !event.currentState) continue;

      setLocalVmHealth(getVmHealth(event.currentState));
      resolvedVmIdRef.current = vmId;
      stopPolling();
      setActionLoading(false);
    }
  }, [containerMessages.orchestrator, vmId, stopPolling]);

  useEffect(() => {
    if (!vmId) return;
    const msgs = containerMessages.pdfm;
    const unseen = drainUnseenMessages(msgs, lastPdfmEventIdRef);
    if (unseen.length === 0) return;

    for (const msg of unseen) {
      const { raw } = msg;
      if (raw.message !== 'VM_STATE_CHANGED') continue;

      const event = parseVmStateChangeBody(raw.body);
      if (event.vmId !== vmId) continue;

      if (event.currentState) {
        setLocalVmHealth(getVmHealth(event.currentState));
        resolvedVmIdRef.current = vmId;
        stopPolling();
        setActionLoading(false);
        continue;
      }

      devopsService.machines
        .getVirtualMachine(hostname, vmId, !!orchestratorHostId)
        .then((vm) => {
          setLocalVmHealth(getVmHealth(vm.State));
          resolvedVmIdRef.current = vmId;
          stopPolling();
          setActionLoading(false);
        })
        .catch((err) => console.warn('[TcpRouteView] Failed to refresh VM after state change:', err));
    }
  }, [containerMessages.pdfm, hostname, vmId, orchestratorHostId, stopPolling]);

  // Only run once per vmId change — resolve missing state via VM API
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    hasFetchedRef.current = false;
  }, [vmId, proxyHost]);

  useEffect(() => {
    if (!vmId || proxyHost.tcp_route?.target_vm_details?.state) return;
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    devopsService.machines
      .getVirtualMachine(hostname, vmId, !!orchestratorHostId)
      .then((vm) => {
        if (vm.State) {
          setLocalVmHealth(getVmHealth(vm.State));
          resolvedVmIdRef.current = vmId;
        }
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proxyHost.tcp_route?.target_vm_id]);

  const [targetType, setTargetType] = useState<TargetType>(() => resolveTargetType(tcpRoute));
  const [targetHost, setTargetHost] = useState(tcpRoute?.target_host ?? '');
  const [targetPort, setTargetPort] = useState(tcpRoute?.target_port ?? '');
  const [targetVmId, setTargetVmId] = useState(tcpRoute?.target_vm_id ?? '');
  const [routeErrors, setRouteErrors] = useState<Record<string, string>>({});
  const [routeDirty, setRouteDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Track last known vm_id so we detect vm changes
  const prevVmIdRef = useRef<string | null>(null);

  useEffect(() => {
    stopPolling();
    setActionLoading(false);
    lastOrchestratorEventIdRef.current = null;
    lastPdfmEventIdRef.current = null;

    const route = proxyHost.tcp_route;
    const changedVm = prevVmIdRef.current !== route?.target_vm_id;
    prevVmIdRef.current = route?.target_vm_id ?? null;

    // Only reset localVmHealth when vm_id actually changes — don't overwrite resolved states
    if (changedVm || !route?.target_vm_details?.state) {
      // keep current localVmHealth if already resolved (prevents effect-A result from being clobbered)
      if (!changedVm && !!localVmHealth && localVmHealth !== 'unknown') {
        // keep as-is
      } else if (!(resolvedVmIdRef.current === route?.target_vm_id)) {
        setLocalVmHealth(getVmHealth(route?.target_vm_details?.state));
      }
      // else: vm_id same but state present — keep resolved state
    } else {
      setLocalVmHealth(getVmHealth(route?.target_vm_details?.state));
    }
    
    setTargetType(resolveTargetType(route));
    setTargetHost(route?.target_host ?? '');
    setTargetPort(route?.target_port ?? '');
    setTargetVmId(route?.target_vm_id ?? '');
    setRouteErrors({});
    setRouteDirty(false);
  }, [proxyHost, stopPolling]);

  const handleVmAction = useCallback(async () => {
    const routeVmId = tcpRoute?.target_vm_id;
    if (!routeVmId) return;

    setActionLoading(true);
    try {
      if (localVmHealth === 'stopped') {
        await devopsService.machines.startVirtualMachine(hostname, routeVmId, !!orchestratorHostId);
      } else {
        await devopsService.machines.resumeVirtualMachine(hostname, routeVmId, !!orchestratorHostId);
      }
    } catch {
      setActionLoading(false);
      return;
    }

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
        const vm = await devopsService.machines.getVirtualMachine(hostname, routeVmId, !!orchestratorHostId);
        const health = getVmHealth(vm.State);
        setLocalVmHealth(health);
        resolvedVmIdRef.current = routeVmId;
        if (health === 'running') {
          stopPolling();
          setActionLoading(false);
        }
      } catch {
        // transient error — keep polling
      }
    }, POLL_INTERVAL_MS);
  }, [hostname, tcpRoute, localVmHealth, orchestratorHostId, stopPolling]);

  const validateRoute = () => {
    const e: Record<string, string> = {};
    if (targetType === 'static' && !targetHost.trim()) e.targetHost = 'Target host is required';
    if (targetType === 'vm' && !targetVmId) e.targetVmId = 'Select a virtual machine';
    if (!targetPort.trim()) e.targetPort = 'Port is required';
    setRouteErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = useCallback(async () => {
    if (!tcpRoute) return;
    if (!validateRoute()) return;

    setSaving(true);
    try {
      await onSaveRoute({
        target_host: targetType === 'static' ? targetHost.trim() : undefined,
        target_port: targetPort.trim(),
        target_vm_id: targetType === 'vm' ? targetVmId : undefined,
      });
      setRouteDirty(false);
    } finally {
      setSaving(false);
    }
  }, [targetType, targetHost, targetPort, targetVmId, onSaveRoute, tcpRoute]);

  const handleDiscard = () => {
    const route = proxyHost.tcp_route;
    setTargetType(resolveTargetType(route));
    setTargetHost(route?.target_host ?? '');
    setTargetPort(route?.target_port ?? '');
    setTargetVmId(route?.target_vm_id ?? '');
    setRouteErrors({});
    setRouteDirty(false);
    setShowDiscardConfirm(false);
  };

  const canEdit = canCreate || canUpdate;
  const canStartOrResume = canCreate && !!tcpRoute?.target_vm_id && ['stopped', 'paused', 'suspended'].includes(localVmHealth);

  return (
    <div className="overflow-y-auto">
      <Panel variant="simple" backgroundColor="white">
        {tcpRoute && (
          <div className="p-3">
            <TcpFlowHeader
              proxyHost={proxyHost}
              tcpRoute={tcpRoute}
              proxyEnabled={proxyEnabled}
              localVmHealth={localVmHealth}
              actionLoading={actionLoading}
              canStartOrResume={canStartOrResume}
              availableVms={availableVms}
              onVmAction={() => void handleVmAction()}
            />
          </div>
        )}

        {tcpRoute && <div className="border-t border-neutral-200 dark:border-neutral-800" />}

        <div className="pt-3 pb-4">
          <TcpRouteEditor
            targetType={targetType}
            targetHost={targetHost}
            targetPort={targetPort}
            targetVmId={targetVmId}
            errors={routeErrors}
            availableVms={availableVms}
            onTargetTypeChange={(value) => {
              setTargetType(value);
              setRouteErrors({});
              setRouteDirty(true);
            }}
            onTargetHostChange={(value) => {
              setTargetHost(value);
              setRouteDirty(true);
            }}
            onTargetPortChange={(value) => {
              setTargetPort(value);
              setRouteDirty(true);
            }}
            onTargetVmIdChange={(value) => {
              setTargetVmId(value);
              setRouteDirty(true);
            }}
            onClearError={(key) => setRouteErrors((prev) => ({ ...prev, [key]: '' }))}
          />
        </div>

        {canEdit && (!!tcpRoute || routeDirty) && (
          <div className="flex items-center justify-between gap-2 pb-4 pt-3">
            <div>
              {canCreate && tcpRoute && (
                <Button variant="soft" color="rose" size="sm" leadingIcon="Trash" onClick={onClearRoute}>
                  Clear TCP Route
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {routeDirty && tcpRoute && (
                <Button variant="soft" color="slate" size="sm" onClick={() => setShowDiscardConfirm(true)}>
                  Discard Changes
                </Button>
              )}
              {routeDirty && (
                <Button variant="soft" color={themeColor} size="sm" loading={saving} onClick={() => void handleSave()}>
                  {tcpRoute ? 'Save Changes' : 'Save TCP Route'}
                </Button>
              )}
            </div>
          </div>
        )}

        <ConfirmModal
          isOpen={showDiscardConfirm}
          title="Discard Changes"
          description="You have unsaved changes. Are you sure you want to discard them?"
          confirmLabel="Discard"
          confirmColor="rose"
          onConfirm={handleDiscard}
          onClose={() => setShowDiscardConfirm(false)}
        />
      </Panel>
    </div>
  );
};
