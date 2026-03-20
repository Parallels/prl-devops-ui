import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header/Header';
import { StatusBar } from '../components/StatusBar/StatusBar';
import { Route } from '../types/Header';
import logo from '@/assets/images/parallels-bars-small.png';

import { LayoutProvider, useLayout } from '../contexts/LayoutContext';
import { BottomSheetProvider, SideMenuLayout, type SideMenuItem, type SideMenuItemGuard } from '@prl/ui-kit';
import { WebSocketProvider } from '../contexts/WebSocketContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { EventsHubProvider } from '../contexts/EventsHubContext';
import { useSession } from '@/contexts/SessionContext';
import { Claims, Roles } from '@/interfaces/tokenTypes';
import { JobsProvider, useJobs } from '@/contexts/JobsContext';
import { HostSettingsProvider } from '@/contexts/HostSettingsContext';
import { UserConfigProvider } from '@/contexts/UserConfigContext';
import { SystemSettingsProvider, useSystemSettings } from '@/contexts/SystemSettingsContext';
import { useModuleView, MODULE_VIEW_NAMES } from '@/components/HostSwitcher/ModuleViewSwitcher';
import { SettingsModal } from '@/components/Settings/SettingsModal';
import { ToastManager } from '@/components/Toast/ToastManager';
import { HostOfflineOverlay } from '@/components/HostOfflineOverlay';

export interface MainLayoutProps {
  children?: React.ReactNode;
}

const LayoutModals: React.FC = () => {
  const { isModalOpen, closeModal } = useLayout();
  const isSettingsOpen = isModalOpen('settings');

  return (
    <>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => closeModal('settings')} />
    </>
  );
};

// Small animated badge for active jobs in the sidebar
type JobBadgeTone = 'pending' | 'running' | 'error';

const jobBadgeColorMap: Record<JobBadgeTone, { ping: string; dot: string; text: string }> = {
  pending: {
    ping: 'bg-amber-400',
    dot: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
  },
  running: {
    ping: 'bg-blue-400',
    dot: 'bg-blue-500',
    text: 'text-blue-600 dark:text-blue-400',
  },
  error: {
    ping: 'bg-red-400',
    dot: 'bg-red-500',
    text: 'text-red-600 dark:text-red-400',
  },
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

// Per-type dot for Catalogs/VMs menu items when a job of that type is active
const ActiveTypeDot: React.FC = () => (
  <span className="relative flex h-2 w-2">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
  </span>
);

const isActiveState = (state: string): boolean => state === 'pending' || state === 'running';
const isTerminalState = (state: string): boolean => state === 'completed' || state === 'failed';

const toSideMenuType = (jobType: string): 'catalog' | 'vm' | undefined => {
  switch (jobType.toLowerCase()) {
    case 'catalog':
    case 'packer':
    case 'packer_template':
      return 'catalog';
    case 'vm':
    case 'machine':
    case 'machines':
      return 'vm';
    default:
      return undefined;
  }
};

const MainLayoutContent: React.FC<MainLayoutProps> = ({ children }) => {
  const { isOverlay, setIsOverlay } = useLayout();
  const { themeColor } = useSystemSettings();

  const location = useLocation();
  const navigate = useNavigate();
  const { hasClaim, hasRole, hasAnyClaim, hasAllClaims, hasModule } = useSession();
  const { jobs, activeCount } = useJobs();
  const activeModuleView = useModuleView();
  const [currentRoute, setCurrentRoute] = useState<Route>('home');
  const [unseenByType, setUnseenByType] = useState<Record<string, boolean>>({});
  const [hasFailedWithMultipleActiveJobs, setHasFailedWithMultipleActiveJobs] = useState(false);
  const previousStatesRef = useRef<Record<string, string>>({});
  const previousActiveCountRef = useRef(0);

  // Show "new" dots only after active jobs transition to a terminal state.
  useEffect(() => {
    const previousStates = previousStatesRef.current;
    const completedTypes = new Set<'catalog' | 'vm'>();
    let shouldFlagErrorBadge = false;

    for (const job of jobs) {
      const previousState = previousStates[job.id];
      if (!previousState || previousState === job.state) continue;

      if (job.state === 'failed' && previousActiveCountRef.current > 1) {
        shouldFlagErrorBadge = true;
      }

      if (isActiveState(previousState) && isTerminalState(job.state)) {
        const menuType = toSideMenuType(job.job_type);
        if (menuType) completedTypes.add(menuType);
      }
    }

    if (completedTypes.size > 0) {
      setUnseenByType((prev) => {
        let changed = false;
        const next = { ...prev };
        completedTypes.forEach((type) => {
          if (!next[type]) {
            next[type] = true;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }

    if (shouldFlagErrorBadge) {
      setHasFailedWithMultipleActiveJobs(true);
    }
    if (activeCount === 0) {
      setHasFailedWithMultipleActiveJobs(false);
    }

    previousStatesRef.current = jobs.reduce<Record<string, string>>((acc, job) => {
      acc[job.id] = job.state;
      return acc;
    }, {});
    previousActiveCountRef.current = activeCount;
  }, [jobs, activeCount]);

  useEffect(() => {
    // Clear the indicator when the user visits the corresponding section
    const path = location.pathname;
    const visitedType = path.startsWith('/catalogs') ? 'catalog' : path.startsWith('/vms') ? 'vm' : undefined;
    if (visitedType && unseenByType[visitedType]) {
      setUnseenByType((prev) => ({ ...prev, [visitedType]: false }));
    }
  }, [location.pathname, unseenByType]);

  const isCatalogRoute = location.pathname.startsWith('/catalogs');
  const isVmRoute = location.pathname.startsWith('/vms');
  const hasRunningJobs = useMemo(() => jobs.some((job) => job.state === 'running'), [jobs]);
  const jobsBadgeTone = useMemo<JobBadgeTone>(() => {
    if (hasFailedWithMultipleActiveJobs && activeCount > 0) return 'error';
    if (hasRunningJobs) return 'running';
    return 'pending';
  }, [activeCount, hasFailedWithMultipleActiveJobs, hasRunningJobs]);

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
        badge: unseenByType['catalog'] && !isCatalogRoute ? <ActiveTypeDot /> : undefined,
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
      },
      {
        groupName: 'computing',
        slug: 'vms',
        label: 'VMs',
        path: '/vms',
        icon: 'VirtualMachine',
        guards: [{ type: 'claim', claim: Claims.LIST_VM }],
        badge: unseenByType['vm'] && !isVmRoute ? <ActiveTypeDot /> : undefined,
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
      { groupName: 'admin', slug: 'admin', label: 'Admin', type: 'group', hasDivider: true },
      {
        groupName: 'admin',
        slug: 'logs',
        label: 'Log Viewer',
        path: '/logs',
        icon: 'Log',
        guards: [{ type: 'role', role: Roles.SUPER_USER }],
      },
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
    ],
    [activeCount, jobsBadgeTone, unseenByType, isCatalogRoute, isVmRoute],
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
    <div className="h-[28px] w-[28px] flex items-center justify-center">
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
          <div className="flex h-full min-w-[400px] flex-1 flex-col overflow-hidden">
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
          </EventsHubProvider>
        </NotificationProvider>
      </WebSocketProvider>
      <ToastManager />
    </BottomSheetProvider>
  );
};
