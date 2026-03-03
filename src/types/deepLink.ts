/**
 * Deep-link state shapes passed via React Router's location.state.
 *
 * Usage (emitter):
 *   const { toVm, toHost } = useNavigateTo();
 *   toVm(vm.ID, 'orchestrator');
 *
 * Usage (receiver — inside the page component):
 *   const location = useLocation();
 *   const deepLink = location.state as VmsDeepLinkState | null;
 *   // then consume in a useEffect once data has loaded
 */

export interface VmsDeepLinkState {
    /** SplitView group to select ('orchestrator' | 'local') */
    selectGroupId?: string;
    /** VM ID to open in the side panel */
    selectVmId?: string;
}

export interface HostsDeepLinkState {
    /** Host ID to select in the list */
    selectHostId?: string;
}

export interface JobsDeepLinkState {
    /** Job ID to highlight in the list */
    selectJobId?: string;
}
