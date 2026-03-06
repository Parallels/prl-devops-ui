import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  EmptyState,
  IconButton,
  SearchBar,
  Table,
  formatDate,
  type Column,
} from '@prl/ui-kit';
import { PageHeader } from '@/components/PageHeader';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { CatalogManager } from '@/interfaces/CatalogManager';
import { devopsService } from '@/services/devops';
import {
  CatalogRow,
  CatalogSource,
  filterCatalogManifests,
  mapCatalogManifests,
  type CatalogManifestItem,
} from './CatalogModels';
import { CatalogManifestList } from './CatalogManifestList';

const managerColumns = (
  canEdit: (manager: CatalogManager) => boolean,
  canDelete: (manager: CatalogManager) => boolean,
  onEdit: (manager: CatalogManager) => void,
  onDelete: (manager: CatalogManager) => void,
): Column<CatalogManager>[] => [
    { id: 'name', header: 'Name', accessor: 'name', sortable: true },
    { id: 'url', header: 'URL', accessor: 'url', sortable: true },
    {
      id: 'active',
      header: 'Active',
      accessor: 'active',
      sortable: true,
      render: (row) => (row.active ? 'Yes' : 'No'),
      width: 90,
      align: 'center',
    },
    {
      id: 'updated_at',
      header: 'Updated',
      accessor: 'updated_at',
      sortable: true,
      render: (row) => formatDate(row.updated_at),
    },
    {
      id: 'actions',
      header: '',
      width: 88,
      align: 'center',
      render: (row) => {
        const showEdit = canEdit(row);
        const showDelete = canDelete(row);
        if (!showEdit && !showDelete) return null;

        return (
          <div className="flex items-center justify-center gap-1">
            {showEdit && (
              <IconButton
                icon="Edit"
                size="xs"
                variant="ghost"
                color="slate"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(row);
                }}
                aria-label="Edit catalog manager"
              />
            )}
            {showDelete && (
              <IconButton
                icon="Trash"
                size="xs"
                variant="ghost"
                color="danger"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(row);
                }}
                aria-label="Delete catalog manager"
              />
            )}
          </div>
        );
      },
    },
  ];

interface CatalogSourcePanelProps {
  hostname: string;
  source: CatalogSource;
  query: string;
  reloadToken: number;
  selectedManifestId?: string;
  onManifestClick: (manifest: CatalogManifestItem, tab?: 'details' | 'versions') => void;
  onDownloadRow?: (row: CatalogRow) => void;
  onStatsChange?: (stats: CatalogSourceStats) => void;
}

export interface CatalogSourceStats {
  manifests: number;
  versions: number;
  images: number;
}

export const CatalogSourcePanel: React.FC<CatalogSourcePanelProps> = ({
  hostname,
  source,
  query,
  reloadToken,
  selectedManifestId,
  onManifestClick,
  onDownloadRow,
  onStatsChange,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<CatalogManifestItem[]>([]);

  const fetchCatalogs = useCallback(async () => {
    if (!hostname) return;
    setLoading(true);
    setError(null);

    try {
      const manifests = source.type === 'local'
        ? await devopsService.catalog.getCatalogManifests(hostname)
        : await devopsService.catalogManagers.getCatalogManifests(hostname, source.managerId ?? '');

      const nextItems = mapCatalogManifests(manifests, source);
      setItems(nextItems);
      onStatsChange?.({
        manifests: nextItems.length,
        versions: nextItems.reduce((acc, item) => acc + item.versions.length, 0),
        images: nextItems.reduce((acc, item) => acc + item.totalItems, 0),
      });
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load catalogs');
      setItems([]);
      onStatsChange?.({ manifests: 0, versions: 0, images: 0 });
    } finally {
      setLoading(false);
    }
  }, [hostname, onStatsChange, source.managerId, source.type]);

  useEffect(() => {
    void fetchCatalogs();
  }, [fetchCatalogs, reloadToken]);

  const filteredItems = useMemo(() => filterCatalogManifests(items, query), [items, query]);

  return (
    <CatalogManifestList
      items={filteredItems}
      query={query}
      loading={loading}
      error={error}
      onRetry={() => void fetchCatalogs()}
      selectedManifestId={selectedManifestId}
      onSelectItem={onManifestClick}
      onDownloadItem={onDownloadRow}
    />
  );
};

interface CatalogManagersPanelProps {
  managers: CatalogManager[];
  search: string;
  setSearch: (value: string) => void;
  canCreateManager: boolean;
  canEditManager: (manager: CatalogManager) => boolean;
  canDeleteManager: (manager: CatalogManager) => boolean;
  onAdd: () => void;
  onEdit: (manager: CatalogManager) => void;
  onDelete: (manager: CatalogManager) => void;
  onRefresh: () => void;
}

export const CatalogManagersPanel: React.FC<CatalogManagersPanelProps> = ({
  managers,
  search,
  setSearch,
  canCreateManager,
  canEditManager,
  canDeleteManager,
  onAdd,
  onEdit,
  onDelete,
  onRefresh,
}) => {
  const { themeColor } = useSystemSettings();
  const filteredManifests = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return managers;
    return managers.filter((manager) =>
      manager.name?.toLowerCase().includes(q) ||
      manager.url?.toLowerCase().includes(q) ||
      manager.owner_id?.toLowerCase().includes(q),
    );
  }, [managers, search]);

  const columns = useMemo(
    () => managerColumns(canEditManager, canDeleteManager, onEdit, onDelete),
    [canDeleteManager, canEditManager, onDelete, onEdit],
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-neutral-50 dark:bg-neutral-950">
      <PageHeader
        title="Catalog Managers"
        subtitle={`${managers.length} manager${managers.length !== 1 ? 's' : ''}`}
        search={(
          <SearchBar
            leadingIcon="Search"
            variant="gradient"
            glowIntensity="soft"
            placeholder="Search catalog managers…"
            onSearch={setSearch}
            className="w-72"
            color={themeColor}
          />
        )}
        actions={(
          <>
            <IconButton
              icon="Refresh"
              variant="ghost"
              color="slate"
              size="xs"
              onClick={onRefresh}
              aria-label="Refresh catalog managers"
            />
            {canCreateManager && (
              <Button variant="soft" color={themeColor} size="sm" leadingIcon="Add" onClick={onAdd}>
                Add Catalog Manager
              </Button>
            )}
          </>
        )}
        className="flex-none bg-white dark:bg-neutral-900"
      />

      <div className="flex-1 min-h-0 p-2">
        <Table<CatalogManager>
          columns={columns}
          data={filteredManifests}
          rowKey={(row) => row.id}
          variant="flat"
          stickyHeader
          fullHeight
          hoverable
          noBorders
          defaultSort={{ columnId: 'name', direction: 'asc' }}
          emptyState={(
            <EmptyState
              tone="neutral"
              icon="Catalog"
              iconSize="sm"
              title="No catalog manifests found"
              subtitle="No catalog manifests were found in this catalog service."
              disableBorder
            />
          )}
        />
      </div>
    </div>
  );
};
