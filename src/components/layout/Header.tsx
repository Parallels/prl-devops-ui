import React, { useEffect, useState } from 'react';
import toastService from '@/services/ToastService';
import { check, DownloadEvent, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import notificationService from '@/services/NotificationService';
import { GLOBAL_NOTIFICATION_CHANNEL } from '@/constants/constants';
import { HeaderGroup } from '../Controls/HeaderGroup';
import { NotificationWrapper } from '../Notification/NotificationWrapper';
import logo from '@/assets/images/prl_logo_small.png';
import { configService, DEFAULT_CONFIG } from '@/services/ConfigService';
import { DebugConfig, UIConfig } from '@/interfaces/AppConfig';
import { useLayout } from '../../contexts/LayoutContext';
import { IconButton } from '../Controls';


interface HeaderProps {
  onNavChange: (route: string) => void;
  currentRoute: string;
}

export const Header: React.FC<HeaderProps> = () => {
  const [debugConfig, setDebugConfig] = useState<DebugConfig | null>(null);
  const [uiConfig, setUiConfig] = useState<UIConfig | null>(null);
  const [checkedForUpdates, setCheckedForUpdates] = useState(false);

  const [techPreview, setTechPreview] = useState(false);
  const { isModalOpen, openModal, closeModal } = useLayout();
  const isSettingsOpen = isModalOpen('settings');
  const isFeedbackOpen = isModalOpen('feedback');

  // Load initial configuration and subscribe to changes
  useEffect(() => {
    const loadDebugConfig = async () => {
      // Initialize config service if not already initialized
      const betaVersion = await configService.BetaEnvironment();
      const devVersion = await configService.DevEnvironment();
      if (betaVersion || devVersion) {
        setTechPreview(true);
      } else {
        setTechPreview(false);
      }
      const debugFetched = (await configService.get<DebugConfig>('debug')) ?? DEFAULT_CONFIG.debug;
      const resolvedDebug: DebugConfig = {
        ...DEFAULT_CONFIG.debug,
        ...debugFetched,
      };
      setDebugConfig(resolvedDebug);

      const uiFetched = (await configService.get<UIConfig>('ui')) ?? DEFAULT_CONFIG.ui;
      const resolvedUi: UIConfig = {
        ...DEFAULT_CONFIG.ui,
        ...uiFetched,
      };
      setUiConfig(resolvedUi);
    };

    // Subscribe to individual debug config properties
    const unsubscribeEnabled = configService.subscribe('debug::enabled', () => {
      void loadDebugConfig();
    });

    const unsubscribeNewUi = configService.subscribe('ui::enableNewUi', () => {
      void loadDebugConfig();
    });

    // Load initial config
    void loadDebugConfig();

    return () => {
      unsubscribeEnabled();
      unsubscribeNewUi();
    };
  }, []);

  useEffect(() => {
    const checkForUpdates = async () => {
      if (checkedForUpdates) return;

      // Only check for updates in production
      if (import.meta.env.DEV) {
        console.info('Skipping update check in development');
        setCheckedForUpdates(true);
        return;
      }

      try {
        console.info('checking for updates');
        const latestVersion = await check();
        console.info('latestVersion', latestVersion);
        if (latestVersion && latestVersion?.available) {
          console.info('latestVersion', latestVersion);
          notificationService.createNotification({
            id: 'update-available',
            message: `An update is available`,
            details: `A new version of Parallels Desktop AI is available (${latestVersion.version}). Please update to the latest version.\n\n${latestVersion.body}`,
            autoClose: true,
            dismissible: true,
            showAsToast: true,
            channel: GLOBAL_NOTIFICATION_CHANNEL,
            actions: [
              {
                label: 'Update Now',
                onClick: () => void handleUpdateClick(latestVersion),
              },
            ],
          });

          console.info('Latest version:', latestVersion);
        } else {
          console.info('no update available');
        }
      } catch (error) {
        console.error('Failed to check for updates:', error);
      } finally {
        setCheckedForUpdates(true);
      }
    };

    void checkForUpdates();
  }, [checkedForUpdates]);

  useEffect(() => {
    console.info('Debug config changed:', {
      enabled: debugConfig?.enabled,
      enableNewUi: uiConfig?.enableNewUi,
      enableDevtools: debugConfig?.enableDevtools,
      showConsole: debugConfig?.showConsole,
      level: debugConfig?.level,
    });
  }, [debugConfig, uiConfig]);

  const handleUpdateClick = async (update: Update) => {
    console.info('handleUpdateClickFromHeader', update);
    if (!update) return;
    let downloadedBytes = 0;
    let totalBytes = 0;
    let isDownloading = false;
    let currentPercent = 0;

    try {
      // Make a separate try/catch for the download operation
      try {
        await update.downloadAndInstall((progress: DownloadEvent) => {
          try {
            // Safe type checking for each event type
            if (progress.event === 'Started') {
              const data = progress.data as { contentLength: number };
              totalBytes = data.contentLength;
              console.info('started downloading', progress);
              console.info(`started downloading ${data.contentLength} bytes`);
            } else if (progress.event === 'Progress') {
              if (!isDownloading) {
                console.info('downloading update');
                toastService.showProgress({
                  message: 'Downloading update...',
                  details: `Downloading update...`,
                  id: 'update-downloader',
                });
              }
              isDownloading = true;
              downloadedBytes += progress.data.chunkLength;
              const percent = (downloadedBytes / totalBytes) * 100;
              // Only update if the percent is at least 1 integer more than the current percent
              if (Math.floor(percent) > Math.floor(currentPercent)) {
                console.info(`Updating progress: ${Math.floor(percent)}%`);
                toastService.updateProgress({
                  id: 'update-downloader',
                  percent: percent,
                });
                currentPercent = percent;
              }
            } else if (progress.event === 'Finished') {
              console.info('download finished');
              toastService.clearToast('update-downloader');
              toastService.showSuccess({
                message: 'Update downloaded',
                details: 'Update downloaded',
                id: 'update-finished',
              });
            } else {
              console.info('Unknown event:', progress);
            }
          } catch (eventError) {
            console.error('Error handling download event:', eventError);
          }
        });
      } catch (downloadError) {
        console.error('Download error:', downloadError);
        toastService.clearToast('update-downloader');
        toastService.showError({
          message: 'Error updating',
          details: `Failed to update the application. Please try again later.
          **${downloadError as string}**`,
          id: 'update-downloader-error',
          autoClose: false,
          actions: [
            {
              label: 'OK',
              onClick: () => {
                /* no-op */
              },
            },
          ],
        });
        throw downloadError; // Re-throw to be caught by outer catch
      }

      // If we get here, the download completed successfully
      console.info('Download completed, attempting to relaunch...');

      // Add a slight delay before relaunch to ensure everything is flushed/completed
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toastService.clearToast('update-downloader');
      notificationService.deleteNotification('update-available', GLOBAL_NOTIFICATION_CHANNEL);
      try {
        await relaunch();
      } catch (relaunchError) {
        console.error('Relaunch error:', relaunchError);
        toastService.showError({
          message: 'Relaunch failed',
          details:
            'The update was downloaded but the application could not restart. Please restart manually.',
          id: 'update-relaunch-error',
          actions: [
            {
              label: 'OK',
              onClick: () => {
                /* no-op */
              },
            },
          ],
        });
      }
    } catch (error) {
      console.error('Error during update:', error);
      toastService.clearToast('update-downloader');
    }
  };

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
              {techPreview && (
                <span className="text-gray-800 dark:text-gray-300 pl-1.5">(Tech Preview)</span>
              )}
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
