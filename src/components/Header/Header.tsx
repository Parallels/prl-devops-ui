import React from 'react';
import { GLOBAL_NOTIFICATION_CHANNEL } from '@/constants/constants';
import { HeaderGroup } from '../../controls/HeaderGroup';
import { NotificationWrapper } from '../Notification/NotificationWrapper';
import logo from '@/assets/images/parallels-bars-small.png';
import { useLayout } from '../../contexts/LayoutContext';
import { IconButton } from '../../controls/IconButton';


interface HeaderProps {
  onNavChange: (route: string) => void;
  currentRoute: string;
}

export const Header: React.FC<HeaderProps> = () => {
  const { isModalOpen, openModal, closeModal } = useLayout();
  const isSettingsOpen = isModalOpen('settings');
  const isFeedbackOpen = isModalOpen('feedback');

  return (
    <>
      <header className="flex items-center sticky w-full h-20 top-0 z-50 bg-white dark:bg-neutral-500 border-b border-gray-200 dark:border-gray-200">
        <div className="flex w-full items-center px-4 py-4">
          <div className="flex items-center">
            <div className="h-[28px] w-[28px] flex items-center justify-center">
              <img className="h-full" src={logo} alt="Parallels Desktop AI" />
            </div>
            <div className="flex items-start font-medium text-black dark:text-gray-300 ml-3 text-lg">
              <span className="text-[#6c757d] dark:text-black pr-2">Parallels Desktop</span>
              <span className="text-gray-900 dark:text-gray-300">Capsule Hub</span>
            </div>
          </div>
          <div className="flex flex-grow"></div>
          <HeaderGroup>
            <IconButton
              icon="ReportFeedback"
              variant="icon"
              color="blue"
              accent={true}
              size="md"
              srLabel="Open settings"
              title="Open settings"
              onClick={() => (isFeedbackOpen ? closeModal('feedback') : openModal('feedback'))}
              aria-pressed={isFeedbackOpen}
            />
          </HeaderGroup>
          <HeaderGroup>
            <NotificationWrapper
              channelFilter={GLOBAL_NOTIFICATION_CHANNEL}
              variant="header"
              hideOnScroll={true}
              onlyDot={true}
              size="md"
              animation="slide-up"
              activeColor="blue"
              buttonColor="blue"
              zIndex={1001}
              layoutKey="notifications"
            />
          </HeaderGroup>
          <HeaderGroup>
            <IconButton
              icon="Cog"
              variant="icon"
              color="blue"
              accent={true}
              size="md"
              srLabel="Open settings"
              title="Open settings"
              onClick={() => (isSettingsOpen ? closeModal('settings') : openModal('settings'))}
              aria-pressed={isSettingsOpen}
            />
          </HeaderGroup>
        </div>
      </header>
    </>
  );
};
