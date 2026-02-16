import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GLOBAL_NOTIFICATION_CHANNEL } from '@/constants/constants';
import { HeaderGroup } from '@prl/ui-kit';
import { NotificationWrapper } from '../Notification/NotificationWrapper';
import { useLayout } from '@/contexts/LayoutContext';
import { useConfig } from '@/contexts/ConfigContext';
import { useSession } from '@/contexts/SessionContext';
import { IconButton } from '@/controls';
import { authService } from '@/services/authService';
import { HostConfig } from '@/interfaces/Host';
import { getPasswordKey, getApiKeyKey } from '@/utils/secretKeys';
import { OnboardingPrefill } from '@/pages/Onboarding/Onboarding';


interface HeaderProps {
  onNavChange: (route: string) => void;
  currentRoute: string;
}

const LogoutIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export const Header: React.FC<HeaderProps> = () => {
  const { isModalOpen, openModal, closeModal } = useLayout();
  const config = useConfig();
  const { session, clearSession } = useSession();
  const navigate = useNavigate();
  const isSettingsOpen = isModalOpen('settings');
  const isFeedbackOpen = isModalOpen('feedback');

  const handleLogout = async () => {
    let prefill: OnboardingPrefill | undefined;

    try {
      const hosts = (await config.get<HostConfig[]>('hosts')) ?? [];

      // Find default host (or most recently used) for prefill
      const defaultHost = hosts.find((h) => h.isDefault);
      const sorted = [...hosts].sort((a, b) =>
        (b.lastUsed ?? '').localeCompare(a.lastUsed ?? '')
      );
      const prefillHost = defaultHost ?? sorted[0];

      if (prefillHost) {
        prefill = {
          serverUrl: prefillHost.baseUrl,
          authType: prefillHost.authType,
          username: prefillHost.username,
          hostId: prefillHost.id,
        };
      }

      for (const host of hosts) {
        await config.removeSecret(getPasswordKey(host.hostname));
        await config.removeSecret(getApiKeyKey(host.hostname));
        authService.logout(host.hostname);
      }

      await config.flushSecrets();
      await config.save();
    } catch (error) {
      console.error('Logout failed:', error);
    }

    clearSession();
    navigate('/onboarding', { replace: true, state: prefill ? { prefill } : undefined });
  };

  return (
    <>
      <header className="flex items-center sticky w-full h-20 top-0 z-50 bg-white dark:bg-neutral-500 border-b border-gray-200 dark:border-gray-200">
        <div className="flex w-full items-center px-4 py-4">
          <div className="flex items-center">
            {session && (
              <div className="flex items-center ml-6 px-3 py-1 bg-gray-100 dark:bg-neutral-600 rounded-md">
                <span className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[300px]" title={session.serverUrl}>
                  {session.serverUrl}
                </span>
              </div>
            )}
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
          <HeaderGroup>
            <IconButton
              icon={LogoutIcon}
              variant="icon"
              color="blue"
              accent={true}
              size="md"
              srLabel="Logout"
              title="Logout"
              onClick={() => void handleLogout()}
            />
          </HeaderGroup>
        </div>
      </header>
    </>
  );
};
