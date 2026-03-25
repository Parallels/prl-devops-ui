import React, { useCallback, useMemo } from 'react';
import { EmptyState, formatDate, IconButton, Pill, Table, ThemeColor, type Column, type TableSettings } from '@prl/ui-kit';
import { DevOpsApiKey } from '@/interfaces/devops';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { useUserConfig } from '@/contexts/UserConfigContext';

const API_KEYS_TABLE_SETTINGS_SLUG = 'api-keys::tableSettings';

export interface ApiKeysPanelProps {
  keys: DevOpsApiKey[];
  loading: boolean;
  canCreate: boolean;
  canDelete: boolean;
  onDelete: (key: DevOpsApiKey) => void;
  onCreate?: () => void;
}

export const ApiKeysPanel: React.FC<ApiKeysPanelProps> = ({ keys, loading, canCreate, canDelete, onDelete, onCreate }) => {
  const { themeColor } = useSystemSettings();
  const { isLoaded, getConfig, setConfig } = useUserConfig();
  const tableSettings = getConfig<TableSettings>(API_KEYS_TABLE_SETTINGS_SLUG, { activeView: 'table' });
  const handleSettingsChange = useCallback((settings: TableSettings) => void setConfig(API_KEYS_TABLE_SETTINGS_SLUG, settings), [setConfig]);

  const getExpiredTone = (expiresAt?: string): ThemeColor => {
    if (!expiresAt) return 'emerald';
    const isExpired = new Date(expiresAt) < new Date();
    if (isExpired) return 'rose';

    const isWarning = new Date(expiresAt) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    if (isWarning) return 'amber';

    return 'emerald';
  };

  const columns = useMemo<Column<DevOpsApiKey>[]>(
    () => [
      {
        id: 'id',
        header: 'ID',
        accessor: (row) => row.id ?? '—',
        maxWidth: 300,
        defaultHidden: true,
        className: 'text-sm text-neutral-500 dark:text-neutral-400',
      },
      {
        id: 'name',
        header: 'Name',
        accessor: (row) => row.name ?? '—',
        sortable: true,
        sortValue: (row) => row.name ?? '',
        maxWidth: 220,
        className: 'font-medium text-neutral-800 dark:text-neutral-200',
      },
      {
        id: 'key',
        header: 'Key ID',
        accessor: (row) => row.key ?? '—',
        width: 260,
        className: 'font-mono text-xs text-neutral-500 dark:text-neutral-400 tracking-wider',
      },
      {
        id: 'expires',
        header: 'Expires',
        accessor: 'expires_at',
        sortable: true,
        align: 'center',
        sortValue: (row) => row.expires_at ?? '',
        width: 160,
        render: (row) => {
          if (!row.expires_at) {
            return (
              <Pill size="sm" tone="rose" variant="soft">
                Never
              </Pill>
            );
          }
          const tone = getExpiredTone(row.expires_at);
          return (
            <Pill size="sm" tone={tone} variant="soft">
              {formatDate(row.expires_at)}
            </Pill>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        align: 'center',
        minWidth: 60,
        maxWidth: 120,
        isActionsColumn: true,
        render: (row) => {
          if (!canDelete) return null;
          return (
            <div className="flex w-full items-center justify-center">
              <IconButton
                tooltip="Delete API Key"
                icon="Trash"
                size="xs"
                variant="ghost"
                color="danger"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(row);
                }}
                aria-label="Delete key"
              />
            </div>
          );
        },
      },
    ],
    [canDelete, onDelete],
  );
  if (keys.length === 0 && !loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState
          tone="neutral"
          iconSize="sm"
          fullWidth
          fullHeight
          icon="KeyManagement"
          title="No API keys yet"
          subtitle={canCreate ? 'Click "New API Key" to create your first key.' : 'No API keys have been created.'}
          disableBorder
          actionColor={themeColor}
          actionSize="sm"
          actionLeadingIcon="Add"
          actionVariant="soft"
          actionLabel="Add API Key"
          onAction={() => {
            if (canCreate) onCreate?.();
          }}
        />
      </div>
    );
  }

  return (
    <Table<DevOpsApiKey>
      key={isLoaded ? 'api-keys-ready' : 'api-keys-pending'}
      columns={columns}
      data={keys}
      rowKey={(row) => row.id ?? `${row.name ?? 'key'}-${row.key ?? 'id'}`}
      variant="flat"
      stickyHeader
      fullHeight
      hoverable
      noBorders
      resizableColumns
      loading={loading}
      loadingMessage="Loading API keys…"
      defaultSort={{ columnId: 'name', direction: 'asc' }}
      tableSettings={tableSettings}
      onTableSettingsChange={handleSettingsChange}
      emptyState={
        <EmptyState
          tone="neutral"
          iconSize="sm"
          fullWidth
          fullHeight
          icon="KeyManagement"
          title="No API keys yet"
          subtitle={canCreate ? 'Click "New API Key" to create your first key.' : 'No API keys have been created.'}
          disableBorder
        />
      }
    />
  );
};
