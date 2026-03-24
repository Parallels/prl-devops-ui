import { useNavigate, type NavigateFunction } from 'react-router-dom';
import type { VmsDeepLinkState, HostsDeepLinkState, JobsDeepLinkState, CatalogsDeepLinkState } from '@/types/deepLink';

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
/** Maps a job result_record_type to a human-readable label for navigation buttons. */
export const RECORD_TYPE_LABELS: Record<string, string> = {
    vm:            'VM',
    host:          'Host',
    machine:       'Host',
    catalog:       'Catalog',
    reverse_proxy: 'Reverse Proxy',
};

/**
 * Navigate to the page that owns a result record.
 * Returns false if the record_type is unknown (caller can decide to omit the button).
 */
export function navigateToRecord(
    navigate: NavigateFunction,
    recordType: string,
    recordId: string,
): boolean {
    const type = recordType.toLowerCase();
    switch (type) {
        case 'vm':
            navigate('/vms', { state: { selectVmId: recordId } as VmsDeepLinkState });
            return true;
        case 'host':
        case 'machine':
            navigate('/hosts', { state: { selectHostId: recordId } as HostsDeepLinkState });
            return true;
        case 'catalog':
            navigate('/catalogs', { state: { selectCatalogId: recordId } });
            return true;
        case 'reverse_proxy':
            navigate('/reverse-proxy', { state: { selectProxyId: recordId } });
            return true;
        default:
            return false;
    }
}

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

        toJob(jobId: string) {
            const state: JobsDeepLinkState = { selectJobId: jobId };
            navigate('/jobs', { state });
        },

        toCatalogs(downloadTarget?: 'host' | 'orchestrator') {
            const state: CatalogsDeepLinkState = { downloadTarget };
            navigate('/catalogs', { state });
        },

        toRecord(recordType: string, recordId: string) {
            navigateToRecord(navigate, recordType, recordId);
        },
    };
}
