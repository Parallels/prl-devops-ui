import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GLOBAL_NOTIFICATION_CHANNEL } from '@/constants/constants';
import { HeaderGroup, Logout, UserAvatar, getGravatarUrl, useSideMenuActions } from '@prl/ui-kit';
import { NotificationWrapper } from '../Notification/NotificationWrapper';
import { useLayout } from '@/contexts/LayoutContext';
import { useConfig } from '@/contexts/ConfigContext';
import { useSession } from '@/contexts/SessionContext';
import { authService } from '@/services/authService';
import { HostConfig } from '@/interfaces/Host';
import { getPasswordKey, getApiKeyKey } from '@/utils/secretKeys';
import { LoginPrefill } from '@/pages/Login/Login';
import { decodeToken } from '@/utils/tokenUtils';
import { HostSwitcher } from '../HostSwitcher/HostSwitcher';
import { ModuleViewSwitcher } from '../HostSwitcher/ModuleViewSwitcher';
import { useLockedHost } from '@/contexts/LockedHostContext';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { useEventsHub } from '@/contexts/EventsHubContext';

// ─── Menu icons ───────────────────────────────────────────────────────────────

const CogIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const FeedbackIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface HeaderProps {
  onNavChange: (route: string) => void;
  currentRoute: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Header: React.FC<HeaderProps> = () => {
  const { isModalOpen, openModal, closeModal } = useLayout();
  const { sideItemActions, sidePanelActions } = useSideMenuActions();
  const config = useConfig();
  const { session, setSession, clearSession, hasModule } = useSession();
  const { isLocked, hostUrl } = useLockedHost();
  const { isConnected } = useEventsHub();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { themeColor } = useSystemSettings();
  const isSettingsOpen = isModalOpen('settings');
  const isFeedbackOpen = isModalOpen('feedback');

  // Close on outside click
  useEffect(() => {
    if (!isUserMenuOpen) return;
    const handle = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);

    return () => document.removeEventListener('mousedown', handle);
  }, [isUserMenuOpen]);

  const handleLogout = async () => {
    setIsUserMenuOpen(false);

    try {
      const hosts = (await config.get<HostConfig[]>('hosts')) ?? [];
      const currentHostId = session?.hostId;
      const currentHost = hosts.find((h) => h.id === currentHostId);

      // For the current host: if keepLoggedIn is false, clear the stored secret
      // (but keep the username in config). If keepLoggedIn is true, keep the secret
      // so StartupGuard / auto-connect can use it next time.
      if (currentHost) {
        if (!currentHost.keepLoggedIn) {
          await config.removeSecret(getPasswordKey(currentHost.hostname));
          await config.removeSecret(getApiKeyKey(currentHost.hostname));
          await config.flushSecrets();
        }
        authService.logout(currentHost.hostname);
      }

      await config.save();

      // Try to auto-connect to another host that has stored credentials,
      // iterating in the original array index order and skipping the current host.
      const otherHosts = hosts.filter((h) => h.id !== currentHostId);
      let nextHost: HostConfig | null = null;
      let nextSecret = '';

      for (const host of otherHosts) {
        const secretKey = host.authType === 'credentials' ? getPasswordKey(host.hostname) : getApiKeyKey(host.hostname);
        const secret = await config.getSecret(secretKey);
        if (secret) {
          nextHost = host;
          nextSecret = secret;
          break;
        }
      }

      clearSession();

      if (nextHost) {
        // Restore credentials and session for the next host
        authService.setCredentials(nextHost.hostname, {
          url: nextHost.baseUrl,
          username: nextHost.authType === 'credentials' ? nextHost.username : '',
          password: nextHost.authType === 'credentials' ? nextSecret : '',
          email: nextHost.authType === 'credentials' ? nextHost.username : '',
          api_key: nextHost.authType === 'api_key' ? nextSecret : '',
        });

        authService.currentHostname = nextHost.hostname;
        const token = authService.getToken(nextHost.hostname);
        const tokenPayload = token ? (decodeToken(token) ?? undefined) : undefined;

        setSession({
          serverUrl: nextHost.baseUrl,
          hostname: nextHost.hostname,
          username: nextHost.username,
          authType: nextHost.authType,
          hostId: nextHost.id,
          connectedAt: new Date().toISOString(),
          tokenPayload,
          hardwareInfo: nextHost.hardwareInfo,
        });

        navigate('/', { replace: true });
      } else {
        // No auto-connectable host — send to the login page with the current
        // host pre-filled so the user doesn't have to re-type the server URL.
        const prefill: LoginPrefill | undefined = currentHost ? { hostId: currentHost.id } : undefined;

        navigate('/login', { replace: true, state: prefill ? { prefill } : undefined });
      }
    } catch (error) {
      console.error('Logout failed:', error);
      clearSession();
      navigate('/login', { replace: true });
    }
  };

  const handleSettings = () => {
    setIsUserMenuOpen(false);
    isSettingsOpen ? closeModal('settings') : openModal('settings');
  };

  const handleFeedback = () => {
    setIsUserMenuOpen(false);
    isFeedbackOpen ? closeModal('feedback') : openModal('feedback');
  };

  // Prefer the email from the decoded JWT payload — it's always the real email address
  // (e.g. "cjlapao@gmail.com"), whereas session.username may just be a login handle.
  // Request at 128px so it's sharp on retina displays (shown at 32-36px in CSS).
  const userEmail = session?.tokenPayload?.email || session?.username || '';
  const gravatarUrl = userEmail ? getGravatarUrl(userEmail, 128) : undefined;

  const displayLabel = session?.username || 'User';

  return (
    <header className="flex items-center sticky w-full h-15 top-0 z-50 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-700">
      <div className="flex w-full items-center px-4 py-4">
        {/* Left: host switcher + module view */}
        <div className="flex items-center gap-3">
          {session && !isLocked && <HostSwitcher color={themeColor} />}
          {session && isLocked && (
            <div className="flex items-center gap-2 rounded-md px-3 py-1.5 bg-neutral-100 dark:bg-neutral-700/60 text-sm font-medium text-neutral-700 dark:text-neutral-200">
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
              <span className="max-w-60 truncate">{hostUrl ?? session.hostname}</span>
            </div>
          )}
          {session && isConnected && hasModule('host') && hasModule('orchestrator') && <ModuleViewSwitcher />}
        </div>

        <div className="flex grow" />

        {/* Theme toggle */}
        {/* <HeaderGroup>
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            className="flex items-center justify-center h-8 w-8 rounded-full text-neutral-500 hover:text-neutral-700 hover:bg-gray-100 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-700/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
        </HeaderGroup> */}

        {/* Notifications */}
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

        {/* User avatar + menu */}
        <HeaderGroup>
          <div ref={userMenuRef} className="relative">
            {/* Avatar trigger */}
            <button
              onClick={() => setIsUserMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full p-0.5 transition-colors hover:ring-2 hover:ring-blue-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-haspopup="menu"
              aria-expanded={isUserMenuOpen}
              title={displayLabel}
            >
              <UserAvatar
                user={{
                  username: session?.username,
                  email: userEmail,
                  avatarUrl: gravatarUrl,
                }}
                size={32}
                variant="circle"
              />
            </button>

            {/* Dropdown menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 top-full z-200 mt-2 w-56 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-800">
                {/* User info header */}
                <div className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3 dark:border-neutral-700">
                  <UserAvatar
                    user={{
                      username: session?.username,
                      email: userEmail,
                      avatarUrl: gravatarUrl,
                    }}
                    size={36}
                    variant="circle"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-200">{displayLabel}</p>
                    <p className="truncate text-xs text-neutral-400 dark:text-neutral-500">{session?.hostname ?? ''}</p>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button
                    onClick={handleSettings}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-700/60"
                  >
                    <span className="text-neutral-400 dark:text-neutral-500">
                      <CogIcon />
                    </span>
                    Settings
                    {isSettingsOpen && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-500" />}
                  </button>

                  {hasModule('feedback') && (
                    <button
                      onClick={handleFeedback}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-700/60"
                    >
                      <span className="text-neutral-400 dark:text-neutral-500">
                        <FeedbackIcon />
                      </span>
                      Send Feedback
                      {isFeedbackOpen && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-500" />}
                    </button>
                  )}
                </div>

                <div className="border-t border-neutral-100 py-1 dark:border-neutral-700">
                  <button
                    onClick={() => void handleLogout()}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <Logout className="h-4 w-4" />
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </HeaderGroup>

        {/* Side panel actions (detail panel header actions) */}
        {sidePanelActions && <HeaderGroup>{sidePanelActions}</HeaderGroup>}

        {/* Side item actions (per-item actions from the list/sidebar) */}
        {sideItemActions && <HeaderGroup>{sideItemActions}</HeaderGroup>}
      </div>
    </header>
  );
};
