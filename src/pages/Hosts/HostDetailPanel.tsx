import React from 'react';
import { Tabs } from '@prl/ui-kit';
import { DevOpsRemoteHost } from '@/interfaces/devops';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { OverviewTab } from './tabs/OverviewTab';
import { PerformanceTab } from './tabs/PerformanceTab';
import { CacheTab } from './tabs/CacheTab';
import { LogsTab } from './tabs/LogsTab';
import { ReverseProxy } from '@/pages/ReverseProxy/ReverseProxy';

export interface HostDetailPanelProps {
  host: DevOpsRemoteHost;
}

function isHealthy(host: DevOpsRemoteHost): boolean {
  return host.state === 'healthy';
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export const HostDetailPanel: React.FC<HostDetailPanelProps> = ({ host }) => {
  const { themeColor } = useSystemSettings();

  const tabItems = [
    { id: 'overview', label: 'Overview', panel: <OverviewTab host={host} /> },
    ...(isHealthy(host) && host.enabled && host.enabled_modules?.includes('cache') ? [{ id: 'cache', label: 'Cache', panel: <CacheTab host={host} /> }] : []),
    ...(isHealthy(host) && host.enabled ? [{ id: 'performance', label: 'Performance', panel: <PerformanceTab host={host} /> }] : []),
    ...(isHealthy(host) && host.enabled && host.enabled_modules?.includes('reverse_proxy')
      ? [
          {
            id: 'reverse-proxy',
            label: 'Reverse Proxy',
            // Pass host.vms so ReverseProxy doesn't need its own VM fetch.
            panel: <ReverseProxy orchestratorHostId={host.id} availableVms={host.vms} />,
          },
        ]
      : []),
    // { id: 'settings', label: 'Settings', panel: <SettingsTab host={host} /> },
    ...(isHealthy(host) && host.enabled ? [{ id: 'logs', label: 'Logs', panel: <LogsTab host={host} /> }] : []),
  ];

  if (!host.enabled) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">Host is disabled</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Enable the host to view details and access features.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Tabs */}
      <Tabs
        variant="underline"
        color={themeColor}
        size="sm"
        className="flex-1 min-h-0"
        listClassName="bg-white dark:bg-neutral-900 px-1"
        panelClassName="pt-2"
        panelIdPrefix="host-detail"
        scrollFade={false}
        items={tabItems}
      />
    </div>
  );
};
