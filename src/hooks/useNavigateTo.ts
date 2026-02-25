import { useNavigate } from 'react-router-dom';
import type { VmsDeepLinkState, HostsDeepLinkState } from '@/types/deepLink';

/**
 * Central navigation helper.
 *
 * Each function navigates to a route and passes typed deep-link state so the
 * destination page can pre-select the right item without any extra coordination.
 *
 * Example:
 *   const { toVm, toHost } = useNavigateTo();
 *   toVm(vm.ID, 'orchestrator');   // → /vms with VM side-panel open
 *   toHost(host.id);               // → /hosts with that host selected
 */
export function useNavigateTo() {
    const navigate = useNavigate();

    return {
        toVm(vmId: string, groupId?: string) {
            const state: VmsDeepLinkState = { selectVmId: vmId, selectGroupId: groupId };
            navigate('/vms', { state });
        },

        toHost(hostId: string) {
            const state: HostsDeepLinkState = { selectHostId: hostId };
            navigate('/hosts', { state });
        },
    };
}
