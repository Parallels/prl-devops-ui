import { useCallback, useEffect, useRef, useState } from 'react';
import { devopsService } from '@/services/devops';
import { useSession } from '@/contexts/SessionContext';
import { useEventsHub } from '@/contexts/EventsHubContext';
import type { ReverseProxyHostHttpRoute } from '@/interfaces/ReverseProxy';
import { getVmHealth, type VmHealth } from './routeTypes';

interface RouteRowProps {
    route: ReverseProxyHostHttpRoute;
    index: number;
    orchestratorHostId?: string;
    onHealthChange: (index: number, health: VmHealth) => void;
    onActionLoadingChange: (index: number, loading: boolean) => void;
    onActionRef: (index: number, fn: () => Promise<void>) => void;
}

/**
 * Null-rendering component. Owns VM health state, polling, and event subscriptions
 * for a single route. Exposes state and action handlers to the parent via callbacks
 * so that RoutesTab can build TreeItemData[] and pass them to TreeView.
 */
const RouteRow: React.FC<RouteRowProps> = ({
    route, index, orchestratorHostId,
    onHealthChange, onActionLoadingChange, onActionRef,
}) => {
    const { session } = useSession();
    const hostname = session?.hostname ?? '';
    const { containerMessages } = useEventsHub();

    const hasVmTarget = !!(route.target_vm_id);
    const [vmHealth, setVmHealth] = useState<VmHealth>(
        hasVmTarget ? getVmHealth(route.target_vm_details?.state) : 'running',
    );
    const [actionLoading, setActionLoading] = useState(false);

    // ── Polling helpers ──────────────────────────────────────────────────────

    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const pollCountRef = useRef(0);
    const POLL_MS = 3_000;
    const MAX_POLLS = 20;

    const stopPolling = useCallback(() => {
        if (pollRef.current !== null) { clearInterval(pollRef.current); pollRef.current = null; }
        pollCountRef.current = 0;
    }, []);
    useEffect(() => () => stopPolling(), [stopPolling]);

    // Sync health when route's VM details change (e.g. parent refreshed)
    useEffect(() => {
        stopPolling();
        setActionLoading(false);
        setVmHealth(hasVmTarget ? getVmHealth(route.target_vm_details?.state) : 'running');
    }, [route.target_vm_details?.state, hasVmTarget, stopPolling]);

    // ── Event subscriptions ──────────────────────────────────────────────────

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
        stopPolling();
        setActionLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [containerMessages['orchestrator'], route.target_vm_id]);

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
        devopsService.machines
            .getVirtualMachine(hostname, vmId, !!orchestratorHostId)
            .then(vm => { setVmHealth(getVmHealth(vm.State)); stopPolling(); setActionLoading(false); })
            .catch(() => undefined);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [containerMessages['pdfm'], route.target_vm_id]);

    // ── VM action (start / resume) ───────────────────────────────────────────

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

    // ── Report state to parent ───────────────────────────────────────────────

    const health = hasVmTarget ? vmHealth : 'running';
    useEffect(() => { onHealthChange(index, health); }, [health, index, onHealthChange]);
    useEffect(() => { onActionLoadingChange(index, actionLoading); }, [actionLoading, index, onActionLoadingChange]);
    useEffect(() => { onActionRef(index, handleVmAction); }, [handleVmAction, index, onActionRef]);

    return null;
};

export default RouteRow;
