import React, { useEffect, useMemo, useState } from 'react';
import { CustomIcon } from '@/controls';
import { useEventsHub } from '@/contexts/EventsHubContext';
// import { useAppStartup } from '@/contexts/AppStartupContextDefinition';
// import { configService } from '@/services/ConfigService';
import type { AppBehaviorConfig, DebugConfig } from '@/interfaces/AppConfig';
import { StatusBarDivider, StatusBarSection } from './StatusBarSection';
import { WebSocketState } from '@/types/WebSocket';
import { useConfig } from '@/contexts/ConfigContext';
import { useSession } from '@/contexts/SessionContext';


const formatTimestamp = (timestamp?: number): string => {
  if (!timestamp) {
    return 'Not available';
  }
  const formatter = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return formatter.format(new Date(timestamp));
};

type ReleaseChannel = 'stable' | 'beta' | 'canary';

export const StatusBar: React.FC = () => {
  //   const { isConnected, healthState } = useApplicationSse();
  const { isConnected, connectionState, messageCount } = useEventsHub();
  const config = useConfig();

  const connectionStatus = isConnected ? 'connected' : 'disconnected';

  const [isDevelopmentEnv, setIsDevelopmentEnv] = useState(false);
  const [environment, setEnvironment] = useState<string>('unknown');
  const [appVersion, setAppVersion] = useState<string>('1.0.0');
  const [channel, setChannel] = useState<ReleaseChannel>('stable');
  const [isDebugEnabled, setIsDebugEnabled] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { session } = useSession();

  const backendChecking = false; // backendHealth.lastUpdated === 0;
  const backendHealthy = connectionState === WebSocketState.OPEN;
  const backendVersion = session?.hardwareInfo?.devops_version ?? 'unknown';
  const backendStatusText = backendChecking
    ? 'Checking devops version...'
    : backendHealthy
      ? `${backendVersion}`
      : 'Devops version offline';

  const backendHealth = {
    lastUpdated: 0,
  }

  const sseStatusText = connectionStatus;
  const channelBadge = channel === 'stable' ? undefined : channel;

  const loadConfig = async () => {
    try {
      const appConfig = await config.get<AppBehaviorConfig>('app_behavior');
      const debugConfig = await config.get<DebugConfig>('debug');
      const env = await config.get<string>('environment') || 'production';
      // For now we can assume dev if env is locally set or explicitly in config
      const isDev = env === 'development' || (await config.get<boolean>('is_dev')) || false;
      const version = await config.get<string>('version') || '1.0.0';

      let channelLabel: ReleaseChannel = appConfig?.releaseChannel || 'stable';
      if (appConfig?.isCanary) channelLabel = 'canary';
      if (appConfig?.isBeta) channelLabel = 'beta';

      setEnvironment(env);
      setIsDevelopmentEnv(isDev);
      setAppVersion(version);
      setChannel(channelLabel);
      setIsDebugEnabled(debugConfig?.enabled ?? false);

    } catch (error) {
      console.error('Failed to load status bar config', error);
    }
  };

  useEffect(() => {
    void loadConfig();
  }, [config]);

  const agentDetails = useMemo(
    () => [
      { label: 'Health', value: backendHealthy ? 'Healthy' : 'Offline' },
      { label: 'Version', value: backendVersion },
      { label: 'Updated', value: formatTimestamp(backendHealth.lastUpdated) },
    ],
    [backendHealthy, backendVersion, backendHealth.lastUpdated]
  );

  const sseDetails = useMemo(
    () => [
      { label: 'Status', value: connectionStatus },
      { label: 'Connected', value: isConnected ? 'Yes' : 'No' },
      { label: 'State', value: WebSocketState[connectionState] ?? 'Unknown' },
      { label: 'Messages', value: String(messageCount) },
    ],
    [connectionStatus, isConnected, connectionState, messageCount]
  );

  const buildDetailsList = (items: Array<{ label: string; value: string }>) => (
    <dl className="space-y-2 text-xs text-neutral-300">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-3">
          <dt className="text-neutral-500">{item.label}</dt>
          <dd className="text-md text-neutral-900 dark:text-neutral-50">{item.value}</dd>
        </div>
      ))}
    </dl>
  );

  const showDebugSections = () => isDevelopmentEnv && isDebugEnabled;
  const showDevelopmentSections = () => isDevelopmentEnv;

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  }

  return (
    <footer className="sticky bottom-0 z-30 w-full border-t border-neutral-200/70 bg-white/80 px-2 py-1.5 text-[11px] text-neutral-700 shadow-[0_-6px_18px_rgba(15,23,42,0.18)] backdrop-blur dark:border-white/10 dark:bg-neutral-950/80 dark:text-neutral-200">
      <div className="flex flex-col gap-1.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBarSection
            label="Host Version"
            size="sm"
            variant="minimal"
            value={backendStatusText}
            intent={backendChecking ? 'warning' : backendHealthy ? 'success' : 'danger'}
            loading={backendChecking}
            popoverTitle="Host Version"
            popoverContent={buildDetailsList(agentDetails)}
            rounded={false}
          />
          <StatusBarDivider />
          <StatusBarSection
            label="Realtime"
            size="sm"
            value={sseStatusText}
            intent={
              connectionState === WebSocketState.OPEN ? 'success'
                : connectionState === WebSocketState.CONNECTING ? 'warning'
                  : 'danger'
            }
            loading={connectionState === WebSocketState.CONNECTING}
            popoverTitle="Events Hub"
            popoverContent={buildDetailsList(sseDetails)}
            rounded={false}
            variant="minimal"
          />
          {showDevelopmentSections() && (
            <>
              <StatusBarDivider />
              <StatusBarSection
                label="Application"
                size="sm"
                variant="minimal"
                value={appVersion ? `${appVersion}` : 'unknown'}
                badge={channelBadge}
                badgeIntent={channel === 'canary' ? 'warning' : 'info'}
                showIndicator={false}
                rounded={false}
              />
              {showDebugSections() && (
                <>
                  <StatusBarDivider />
                  <StatusBarSection
                    label="Environment"
                    size="sm"
                    variant="minimal"
                    value={<code className="font-mono text-[11px]">{environment}</code>}
                    showIndicator={false}
                    rounded={false}
                  />
                </>
              )}
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {showDebugSections() && (
            <>
              <StatusBarSection
                label="Dev tools"
                size="sm"
                variant="minimal"
                value="Admin panel"
                showIndicator={false}
                popoverTitle="Toolbox"
                popoverContent={
                  <p className="text-xs text-neutral-500">
                    Additional developer panels can live here. Hook up to existing admin utilities.
                  </p>
                }
              />

              <StatusBarSection
                label="Console"
                size="sm"
                variant="minimal"
                value={isExpanded ? 'Hide logs' : 'View logs'}
                icon={<CustomIcon icon="Log" size="sm" />}
                intent="info"
                showIndicator={false}
                onClick={() => toggleExpanded()}
              />
            </>
          )}
        </div>
      </div>
    </footer>
  );
};
