import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header/Header';
import { StatusBar } from '../components/StatusBar/StatusBar';
import { Route } from '../types/Header';
import logo from '@/assets/images/parallels-bars-small.png';

import { LayoutProvider, useLayout } from '../contexts/LayoutContext';
import { BottomSheetProvider, SideMenuLayout, type SideMenuItem } from '@prl/ui-kit';
import { WebSocketProvider } from '../contexts/WebSocketContext';
import { NotificationProvider } from '../contexts/NotificationContext';

export interface MainLayoutProps {
  children?: React.ReactNode;
}

const LayoutModals: React.FC = () => {
  // const { isModalOpen, closeModal } = useLayout();
  // const isSettingsOpen = isModalOpen('settings');
  // const isFeedbackOpen = isModalOpen('feedback');

  return (
    <>
      {/* {isSettingsOpen && (
          <Settings isOpen={isSettingsOpen} onClose={() => closeModal('settings')} />
        )}
        {/* Feedback modal can be added here similarly */}
      {/* {isFeedbackOpen && (
          <Feedback isOpen={isFeedbackOpen} onClose={() => closeModal('feedback')} />
        )} */}
    </>
  );
};

const sideMenuItems: SideMenuItem[] = [
  { label: 'General', type: 'group' },
  { label: 'Home', path: '/', icon: 'Dashboard' },
  { label: 'Library', path: '/library', icon: 'Library' },
  { type: 'divider' },
  { label: 'Computing', type: 'group' },
  { label: 'Hosts', path: '/hosts', icon: 'Host' },
  { label: 'VMs', path: '/vms', icon: 'VirtualMachine' },
  { type: 'divider' },
  { label: 'Management', type: 'group' },
  { label: 'Users', path: '/users', icon: 'Users' },
  { label: 'Roles', path: '/roles', icon: 'Roles' },
  { label: 'Claims', path: '/claims', icon: 'Claims' },
  { label: 'Cache', path: '/cache', icon: 'Cache' },
  { type: 'divider' },
  { label: 'Demos', type: 'group' },
  { label: 'UX Demo', path: '/ux-demo', icon: 'UX' },
];

const MainLayoutContent: React.FC<MainLayoutProps> = ({ children }) => {
  const { isOverlay, setIsOverlay } = useLayout();

  const location = useLocation();
  const navigate = useNavigate();
  const [currentRoute, setCurrentRoute] = useState<Route>('home');

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

  const headerElement = useMemo(
    () => <Header currentRoute={currentRoute} onNavChange={handleNavChange} />,
    [currentRoute],
  );

  const logoIconElement = (
    <div className="h-[28px] w-[28px] flex items-center justify-center">
      <img className="h-full" src={logo} alt="Parallels Logo" />
    </div>
  );

  const logoTextElement = (
    <div className="flex items-start font-medium text-lg">
      <span className="text-[#6c757d] pr-2">Parallels</span>
      <span className="text-gray-900">DevOps</span>
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
            items: sideMenuItems,
          }}
          header={headerElement}
          bodyClassName="bg-white dark:bg-neutral-900"
        >
          {children || <Outlet />}
        </SideMenuLayout>
        <StatusBar />
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
            <div className="flex-1 overflow-y-auto bg-white dark:bg-neutral-900">
              {children || <Outlet />}
            </div>
          </div>
          {/* <LogPanel /> */}
        </main>
      </div>
      <StatusBar />
    </div>
  );
};

export const MainLayout: React.FC<MainLayoutProps> = (props) => {
  return (
    <BottomSheetProvider>
      <WebSocketProvider>
        <NotificationProvider>
          <LayoutProvider>
            {/* <VMProvider> */}
            <MainLayoutContent {...props} />
            {/* </VMProvider> */}
          </LayoutProvider>
        </NotificationProvider>
      </WebSocketProvider>
    </BottomSheetProvider>
  );
};
