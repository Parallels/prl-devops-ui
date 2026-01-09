import React, { useEffect, useState } from 'react';
import { Header } from './Header';
import { StatusBar } from '../StatusBar/StatusBar';
import { Route } from '../../types/Header';

import { LayoutProvider, useLayout } from '../../contexts/LayoutContext';
import { VMProvider } from '../../contexts/VMContext';
import { LogPanel } from '../LogPanel/LogPanel';
import { Settings } from '../Settings/Settings';
import { Feedback } from '../Feedback/Feedback';

export interface MainLayoutProps {
  children: React.ReactNode;
}

const LayoutModals: React.FC = () => {
  const { isModalOpen, closeModal } = useLayout();
  const isSettingsOpen = isModalOpen('settings');
  const isFeedbackOpen = isModalOpen('feedback');

  return (
    <>
      {isSettingsOpen && (
        <Settings isOpen={isSettingsOpen} onClose={() => closeModal('settings')} />
      )}
      {/* Feedback modal can be added here similarly */}
      {isFeedbackOpen && (
        <Feedback isOpen={isFeedbackOpen} onClose={() => closeModal('feedback')} />
      )}
    </>
  );
};

const MainLayoutContent: React.FC<MainLayoutProps> = ({ children }) => {
  const { isModalOpen, setIsOverlay } = useLayout();
  const isChatOpen = isModalOpen('chat');
  const [currentRoute, setCurrentRoute] = useState<Route>('home');

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

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className={`relative flex h-full flex-row overflow-hidden ${isChatOpen ? 'chat-open' : ''}`}>
        <main className={`flex h-full flex-1 flex-col overflow-hidden transition-[flex] duration-300 ease-out ${isChatOpen ? 'chat-open' : ''}`}>
          <Header
            currentRoute={currentRoute}
            onNavChange={(route) => setCurrentRoute(route as Route)}
          />
          <LayoutModals />
          <div className="flex h-full min-w-[400px] flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-hidden bg-white dark:bg-neutral-900">{children}</div>
          </div>
          <LogPanel />
        </main>
      </div>
      <StatusBar />
    </div>
  );
};

export const MainLayout: React.FC<MainLayoutProps> = (props) => {
  return (
    <LayoutProvider>
      <VMProvider>
        <MainLayoutContent {...props} />
      </VMProvider>
    </LayoutProvider>
  );
};
