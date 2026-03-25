import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header/Header';
import { StatusBar } from '../components/StatusBar/StatusBar';
import { Route } from '../types/Header';
import logo from '@/assets/images/parallels-bars-small.png';

import { LayoutProvider, useLayout } from '../contexts/LayoutContext';
import { BottomSheetProvider, SideMenuLayout, type SideMenuItem, type SideMenuItemGuard, type SideMenuSettings } from '@prl/ui-kit';
import { WebSocketProvider } from '../contexts/WebSocketContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { EventsHubProvider, useEventsHub } from '../contexts/EventsHubContext';
import { useSession } from '@/contexts/SessionContext';
import { Claims, Roles } from '@/interfaces/tokenTypes';
import { JobsProvider, useJobs } from '@/contexts/JobsContext';
import { HostSettingsProvider } from '@/contexts/HostSettingsContext';
import { UserConfigProvider, useUserConfig } from '@/contexts/UserConfigContext';
import { SystemSettingsProvider, useSystemSettings } from '@/contexts/SystemSettingsContext';
import { useModuleView, MODULE_VIEW_NAMES } from '@/components/HostSwitcher/ModuleViewSwitcher';
import { SettingsModal } from '@/components/Settings/SettingsModal';
import { ToastManager } from '@/components/Toast/ToastManager';
import { HostOfflineOverlay } from '@/components/HostOfflineOverlay';
import { HighlightProvider, useHighlight, type HighlightState } from '@/contexts/HighlightContext';
import { drainUnseenMessages } from '@/utils/messageQueue';
import { resolveJobOutcome } from '@/utils/jobOutcomeResolver';

export interface MainLayoutProps {
  children?: React.ReactNode;
}

const sideMenuSettingsSlug = 'layout.sidemenu.settings';
const IS_DEVELOPMENT_BUILD = (import.meta.env.VITE_IS_DEVELOPMENT ?? '').toLowerCase() === 'true';
const APP_CHANNEL = (import.meta.env.VITE_CHANNEL ?? 'stable').toLowerCase();
const IS_PRODUCTION_CHANNEL = APP_CHANNEL === 'stable' || APP_CHANNEL === 'production';
const SHOW_DEVELOPER_MENU_ITEMS = IS_DEVELOPMENT_BUILD;

const LayoutModals: React.FC = () => {
  const { isModalOpen, closeModal } = useLayout();
  const isSettingsOpen = isModalOpen('settings');

  return (
    <>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => closeModal('settings')} />
    </>
  );
};

// ── Active-jobs badge (Jobs nav item) ─────────────────────────────────────

type JobBadgeTone = 'pending' | 'running' | 'error';

const jobBadgeColorMap: Record<JobBadgeTone, { ping: string; dot: string; text: string }> = {
  pending: { ping: 'bg-amber-400', dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  running: { ping: 'bg-blue-400', dot: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400' },
  error: { ping: 'bg-red-400', dot: 'bg-red-500', text: 'text-red-600 dark:text-red-400' },
};

const ActiveJobBadge: React.FC<{ count: number; tone: JobBadgeTone }> = ({ count, tone }) => {
  const colors = jobBadgeColorMap[tone];
  return (
    <span className="inline-flex items-center gap-1">
      <span className="relative flex h-2 w-2">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colors.ping}`} />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${colors.dot}`} />
      </span>
      <span className={`text-[10px] font-bold tabular-nums ${colors.text}`}>{count}</span>
    </span>
  );
};

// ── Highlight badge (Catalogs / VMs / Hosts nav items) ────────────────────

const highlightBadgeColors: Record<HighlightState, { ping: string; dot: string; text: string }> = {
  error: { ping: 'bg-red-400', dot: 'bg-red-500', text: 'text-red-600 dark:text-red-400' },
  warning: { ping: 'bg-amber-400', dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  info: { ping: 'bg-blue-400', dot: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400' },
  success: { ping: 'bg-emerald-400', dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
};

/** Reads highlight context directly — renders null when there are no entries. */
const HighlightBadge: React.FC<{ menuItemId: string }> = ({ menuItemId }) => {
  const { getMenuBadgeInfo } = useHighlight();
  const info = getMenuBadgeInfo(menuItemId);
  if (!info) return null;
  const colors = highlightBadgeColors[info.state];
  return (
    <span className="inline-flex items-center gap-1">
      <span className="relative flex h-2 w-2">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colors.ping}`} />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${colors.dot}`} />
      </span>
      {info.count > 1 && <span className={`text-[10px] font-bold tabular-nums ${colors.text}`}>{info.count}</span>}
    </span>
  );
};

const MainLayoutContent: React.FC<MainLayoutProps> = ({ children }) => {
  const { isOverlay, setIsOverlay } = useLayout();
  const { themeColor } = useSystemSettings();

  const location = useLocation();
  const navigate = useNavigate();
  const { hasClaim, hasRole, hasAnyClaim, hasAllClaims, hasModule } = useSession();
  const { jobs, activeCount } = useJobs();
  const { containerMessages } = useEventsHub();
  const { addHighlight, clearHighlights } = useHighlight();
  const activeModuleView = useModuleView();
  const { getConfig, setConfig } = useUserConfig();
  const [currentRoute, setCurrentRoute] = useState<Route>('home');
  const [hasFailedWithMultipleActiveJobs, setHasFailedWithMultipleActiveJobs] = useState(false);
  const previousStatesRef = useRef<Record<string, string>>({});
  const previousActiveCountRef = useRef(0);
  const lastJobManagerEventIdRef = useRef<string | null>(null);
  const prevPathnameRef = useRef(location.pathname);

  // Watch job_manager events to add highlight entries.
  // Running in MainLayout (always mounted) ensures highlights are captured even
  // when the target page is not currently rendered.
  useEffect(() => {
    const msgs = containerMessages['job_manager'];
    const unseen = drainUnseenMessages(msgs, lastJobManagerEventIdRef, 'all');
    if (unseen.length === 0) return;

    for (const event of unseen) {
      const { raw } = event;
      if (raw.message !== 'JOB_COMPLETED' && raw.message !== 'JOB_FAILED') continue;

      const job = raw.body as { job_type?: string; job_operation?: string; result_record_id?: string; result_record_type?: string } | undefined;
      if (!job) continue;

      const highlightState: HighlightState = raw.message === 'JOB_FAILED' ? 'error' : 'success';
      const outcome = resolveJobOutcome({
        message: raw.message,
        job_type: job.job_type,
        job_operation: job.job_operation,
        result_record_id: job.result_record_id,
        result_record_type: job.result_record_type,
        result: raw.body?.result,
      });
      if (!outcome.highlight) continue;

      addHighlight({
        pageId: outcome.highlight.pageId,
        menuItemId: outcome.highlight.menuItemId,
        itemId: outcome.highlight.itemId,
        recordId: outcome.highlight.recordId,
        state: highlightState,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerMessages['job_manager']]);

  // When the user navigates away from a page, clear that page's highlights.
  // Runs in MainLayout (always mounted) so it's unaffected by the target
  // page's component lifecycle and React Strict Mode's double-invoke.
  useEffect(() => {
    const currentPath = location.pathname;
    const prevPath = prevPathnameRef.current;
    prevPathnameRef.current = currentPath;

    if (prevPath === currentPath) return;

    // Derive the pageId from the path segment: '/vms/...' → 'vms'
    const prevPageId = prevPath.replace(/^\//, '').split('/')[0];
    if (prevPageId) {
      clearHighlights({ pageId: prevPageId });
    }
  }, [location.pathname, clearHighlights]);

  // Track job state transitions for the Jobs nav item badge.
  useEffect(() => {
    const previousStates = previousStatesRef.current;
    let shouldFlagErrorBadge = false;

    for (const job of jobs) {
      const previousState = previousStates[job.id];
      if (!previousState || previousState === job.state) continue;
      if (job.state === 'failed' && previousActiveCountRef.current > 1) {
        shouldFlagErrorBadge = true;
      }
    }

    if (shouldFlagErrorBadge) setHasFailedWithMultipleActiveJobs(true);
    if (activeCount === 0) setHasFailedWithMultipleActiveJobs(false);

    previousStatesRef.current = jobs.reduce<Record<string, string>>((acc, job) => {
      acc[job.id] = job.state;
      return acc;
    }, {});
    previousActiveCountRef.current = activeCount;
  }, [jobs, activeCount]);

  const isCatalogRoute = location.pathname.startsWith('/catalogs');
  const isVmRoute = location.pathname.startsWith('/vms');
  const isHostRoute = location.pathname.startsWith('/hosts');
  const hasRunningJobs = useMemo(() => jobs.some((job) => job.state === 'running'), [jobs]);
  const jobsBadgeTone = useMemo<JobBadgeTone>(() => {
    if (hasFailedWithMultipleActiveJobs && activeCount > 0) return 'error';
    if (hasRunningJobs) return 'running';
    return 'pending';
  }, [activeCount, hasFailedWithMultipleActiveJobs, hasRunningJobs]);

  const sideMenuSettings = getConfig<SideMenuSettings>(sideMenuSettingsSlug, { collapsed: false });

  const handleSideMenuToggleCollapse = useCallback(() => {
    void setConfig<SideMenuSettings>(sideMenuSettingsSlug, {
      collapsed: !Boolean(sideMenuSettings.collapsed),
    });
  }, [setConfig, sideMenuSettings.collapsed]);

  const developerSideMenuItems = useMemo<SideMenuItem[]>(() => {
    if (!SHOW_DEVELOPER_MENU_ITEMS) return [];

    return [
      {
        groupName: 'admin',
        slug: 'events',
        label: 'Events Hub',
        path: '/events',
        icon: 'Log',
        guards: [{ type: 'role', role: Roles.SUPER_USER }],
      },
      { slug: 'demos', label: 'Demos', type: 'group', hasDivider: true },
      {
        groupName: 'demos',
        slug: 'ux-demo',
        label: 'UX Demo',
        path: '/ux-demo',
        icon: 'UX',
        guards: [{ type: 'role', role: Roles.SUPER_USER }],
      },
    ];
  }, []);

  const baseSideMenuItems = useMemo<SideMenuItem[]>(
    () => [
      { slug: 'general', label: 'General', type: 'group' },
      { groupName: 'general', slug: 'home', label: 'Home', path: '/', icon: 'Dashboard' },
      {
        groupName: 'general',
        slug: 'catalogs',
        label: 'Catalogs',
        path: '/catalogs',
        icon: 'Library',
        guards: [{ type: 'claim', claim: Claims.LIST_CATALOG_MANIFEST }],
        badge: !isCatalogRoute ? <HighlightBadge menuItemId="catalogs" /> : undefined,
      },

      { slug: 'computing', label: 'Computing', type: 'group', hasDivider: true },
      {
        groupName: 'computing',
        slug: 'hosts',
        label: 'Hosts',
        path: '/hosts',
        icon: 'Host',
        guards: [
          { type: 'claim', claim: Claims.LIST_REVERSE_PROXY_HOSTS },
          { type: 'module', module: 'orchestrator' },
        ],
        badge: !isHostRoute ? <HighlightBadge menuItemId="hosts" /> : undefined,
      },
      {
        groupName: 'computing',
        slug: 'vms',
        label: 'VMs',
        path: '/vms',
        icon: 'VirtualMachine',
        guards: [{ type: 'claim', claim: Claims.LIST_VM }],
        badge: !isVmRoute ? <HighlightBadge menuItemId="vms" /> : undefined,
      },
      {
        groupName: 'computing',
        slug: 'reverse-proxy',
        label: 'Reverse Proxy',
        path: '/reverse-proxy',
        icon: 'ReverseProxy',
        guards: [
          { type: 'claim', claim: Claims.LIST_REVERSE_PROXY_HOSTS },
          { type: 'module', module: 'reverse_proxy' },
        ],
      },

      { slug: 'management', label: 'Management', type: 'group', hasDivider: true },
      {
        groupName: 'management',
        slug: 'users',
        label: 'Users',
        path: '/users',
        icon: 'Users',
        guards: [
          { type: 'claim', claim: Claims.LIST_USER },
          { type: 'module', module: 'api' },
        ],
      },
      {
        groupName: 'management',
        slug: 'roles',
        label: 'Roles',
        path: '/roles',
        icon: 'Roles',
        guards: [
          { type: 'claim', claim: Claims.LIST_ROLE },
          { type: 'module', module: 'api' },
        ],
      },
      {
        groupName: 'management',
        slug: 'claims',
        label: 'Claims',
        path: '/claims',
        icon: 'Claims',
        guards: [
          { type: 'claim', claim: Claims.LIST_CLAIM },
          { type: 'module', module: 'api' },
        ],
      },
      {
        groupName: 'management',
        slug: 'api-keys',
        label: 'API Keys',
        path: '/api-keys',
        icon: 'KeyManagement',
        guards: [
          { type: 'claim', claim: Claims.LIST_API_KEY },
          { type: 'module', module: 'api' },
        ],
      },
      { groupName: 'management', slug: 'cache', label: 'Cache', path: '/cache', icon: 'Cache', guards: [{ type: 'anyModule', modules: ['api', 'cache'] }] },
      {
        groupName: 'management',
        slug: 'jobs',
        label: 'Jobs',
        path: '/jobs',
        icon: 'Jobs',
        badge: activeCount > 0 ? <ActiveJobBadge count={activeCount} tone={jobsBadgeTone} /> : undefined,
      },
      { slug: 'admin', label: 'Admin', type: 'group', hasDivider: true },
      {
        groupName: 'admin',
        slug: 'logs',
        label: 'Log Viewer',
        path: '/logs',
        icon: 'Log',
        guards: [{ type: 'role', role: Roles.SUPER_USER }],
      },
      ...developerSideMenuItems,
    ],
    [activeCount, jobsBadgeTone, isCatalogRoute, isVmRoute, isHostRoute, developerSideMenuItems],
  );

  const guardEvaluator = useCallback(
    (guards: SideMenuItemGuard[]): boolean => {
      return guards.every((guard) => {
        switch (guard.type) {
          case 'claim':
            return hasClaim(guard.claim);
          case 'anyClaim':
            return hasAnyClaim(guard.claims);
          case 'allClaims':
            return hasAllClaims(guard.claims);
          case 'role':
            return hasRole(guard.role);
          case 'anyRole':
            return guard.roles.some((r) => hasRole(r));
          case 'module':
            return hasModule(guard.module);
          case 'anyModule':
            return guard.modules.some((m) => hasModule(m));
          case 'custom':
            return guard.fn();
        }
      });
    },
    [hasClaim, hasRole, hasAnyClaim, hasAllClaims, hasModule],
  );

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/ux-demo')) {
      setCurrentRoute('ux-demo');
    } else {
      setCurrentRoute('home');
    }
  }, [location.pathname]);

  const handleNavChange = (route: string) => {
    setCurrentRoute(route as Route);
    if (route === 'home') {
      navigate('/');
    } else if (route === 'ux-demo') {
      navigate('/ux-demo');
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsOverlay(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [setIsOverlay]);

  const headerElement = useMemo(() => <Header currentRoute={currentRoute} onNavChange={handleNavChange} />, [currentRoute]);

  const logoIconElement = (
    <div className="h-7 w-7 flex items-center justify-center">
      <img className="h-full" src={logo} alt="Parallels Logo" />
    </div>
  );

  const logoTextElement = (
    <div className="flex items-start font-medium text-lg">
      <span className="text-[#6c757d] pr-2">Parallels</span>
      <span className="text-gray-900 dark:text-neutral-100">DevOps</span>
    </div>
  );

  // Desktop: SideMenuLayout with sidebar, header, and scrollable body
  if (!isOverlay) {
    return (
      <div className="flex h-screen flex-col overflow-hidden">
        <LayoutModals />
        <SideMenuLayout
          sideMenuProps={{
            logoIcon: logoIconElement,
            logoText: logoTextElement,
            title: 'Navigation',
            items: baseSideMenuItems,
            guardEvaluator,
            activeModuleView,
            moduleViewOptions: MODULE_VIEW_NAMES,
            color: themeColor,
            collapsed: Boolean(sideMenuSettings.collapsed),
            onToggleCollapse: handleSideMenuToggleCollapse,
          }}
          header={headerElement}
          bodyClassName="bg-white dark:bg-neutral-900"
        >
          {children || <Outlet />}
        </SideMenuLayout>
        <HostOfflineOverlay />
        <div className="relative z-50">
          <StatusBar />
        </div>
      </div>
    );
  }

  // Mobile: current layout without sidebar
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className={`relative flex h-full flex-row overflow-hidden`}>
        <main className={`flex h-full flex-1 flex-col overflow-hidden transition-[flex] duration-300 ease-out`}>
          {headerElement}
          <LayoutModals />
          <div className="flex h-full min-w-100 flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto bg-white dark:bg-neutral-900">{children || <Outlet />}</div>
          </div>
          {/* <LogPanel /> */}
        </main>
      </div>
      <HostOfflineOverlay />
      <div className="relative z-50">
        <StatusBar />
      </div>
    </div>
  );
};

export const MainLayout: React.FC<MainLayoutProps> = (props) => {
  return (
    <BottomSheetProvider>
      <WebSocketProvider>
        <NotificationProvider>
          <EventsHubProvider>
            <HighlightProvider>
              <JobsProvider>
                <LayoutProvider>
                  <SystemSettingsProvider>
                    <HostSettingsProvider>
                      <UserConfigProvider>
                        {/* <VMProvider> */}
                        <MainLayoutContent {...props} />
                        {/* </VMProvider> */}
                      </UserConfigProvider>
                    </HostSettingsProvider>
                  </SystemSettingsProvider>
                </LayoutProvider>
              </JobsProvider>
            </HighlightProvider>
          </EventsHubProvider>
        </NotificationProvider>
      </WebSocketProvider>
      <ToastManager />
    </BottomSheetProvider>
  );
};
