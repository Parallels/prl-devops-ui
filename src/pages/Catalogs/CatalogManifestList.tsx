import React, { useCallback, useMemo } from 'react';
import {
  Artifactory,
  Aws,
  Azure,
  Button,
  DropdownButton,
  EmptyState,
  Folder,
  Library,
  Minio,
  Panel,
  Pill,
  Table,
  TruncatedText,
  type DropdownButtonOption,
  type TableColumn,
  type TableSettings,
} from '@prl/ui-kit';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { useUserConfig } from '@/contexts/UserConfigContext';
import { type CatalogManifestItem, type CatalogRow } from './CatalogModels';
import { CatalogManifest } from '@prl/ui-kit/icons/components/CatalogManifest';

const slug = (sourceId: string, key: string) => `catalog.${sourceId}.${key}`;

interface CatalogManifestListProps {
  sourceId: string;
  items: CatalogManifestItem[];
  query: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  selectedManifestId?: string;
  onSelectItem: (manifest: CatalogManifestItem, tab?: 'details' | 'versions') => void;
  onDownloadItem?: (row: CatalogRow) => void;
}

/** One flat row = one individual catalog item (a single version × architecture). */
interface CatalogFlatRow {
  manifest: CatalogManifestItem;
  row: CatalogRow;
}

/** Pre-computed card view kept for the panel render. */
interface ManifestCardView {
  manifest: CatalogManifestItem;
  allRows: CatalogRow[];
  activeRows: CatalogRow[];
  previewRow: CatalogRow | null;
  latestRow: CatalogRow | null;
  latestVersionLabel: string;
  featuredTags: string[];
}

const hasLatestTag = (row: CatalogRow): boolean => row.tagsList.some((tag) => tag.trim().toLowerCase() === 'latest');
const collectRows = (manifest: CatalogManifestItem): CatalogRow[] => manifest.versions.flatMap((v) => v.items.map(({ row }) => row));
const isRowActive = (row: CatalogRow): boolean => row.active && !row.tainted && !row.revoked;

const findLatestRow = (rows: CatalogRow[]): CatalogRow | null => {
  if (rows.length === 0) return null;
  const latestTagRow = rows.find(hasLatestTag);
  if (latestTagRow) return latestTagRow;
  const latestVersionRow = rows.find((r) => r.version.trim().toLowerCase() === 'latest');
  if (latestVersionRow) return latestVersionRow;
  return rows[0] ?? null;
};

const buildManifestCard = (manifest: CatalogManifestItem): ManifestCardView => {
  const allRows = collectRows(manifest);
  const activeRows = allRows.filter(isRowActive);
  const previewRow = findLatestRow(allRows);
  const latestRow = findLatestRow(activeRows);
  const primaryRow = latestRow ?? previewRow;

  const latestVersionLabel =
    latestRow?.version && latestRow.version !== '-' ? latestRow.version : previewRow?.version && previewRow.version !== '-' ? previewRow.version : (manifest.versions[0]?.version ?? '-');

  const tags = Array.from(
    new Set(
      [...(primaryRow?.tagsList ?? []), ...manifest.tags]
        .map((t) => t.trim())
        .filter((t) => {
          const token = t.toLowerCase();
          return Boolean(t) && token !== 'tainted' && token !== 'revoked';
        }),
    ),
  ).slice(0, 4);

  return { manifest, allRows, activeRows, previewRow, latestRow, latestVersionLabel, featuredTags: tags };
};

const getProviderIcon = (provider: string): React.ReactNode => {
  switch (provider) {
    case 'local':
      return <Folder className="w-4 h-4" />;
    case 'minio':
      return <Minio className="w-4 h-4" />;
    case 'aws-s3':
      return <Aws className="w-4 h-4" />;
    case 'azure-storage-account':
      return <Azure className="w-4 h-4" />;
    case 'artifactory':
      return <Artifactory className="w-4 h-4" />;
    default:
      return <Library className="w-4 h-4" />;
  }
};

export const CatalogManifestList: React.FC<CatalogManifestListProps> = ({ sourceId, items, query, loading = false, error = null, onRetry, selectedManifestId, onSelectItem, onDownloadItem }) => {
  const { themeColor } = useSystemSettings();
  const { isLoaded, getConfig, setConfig } = useUserConfig();

  const savedSettings = getConfig<TableSettings>(slug(sourceId, 'settings'), { activeView: 'panel', groupBy: 'title' });

  // ── Flat rows: one entry per individual catalog item (version × arch) ─────────
  const flatRows = useMemo<CatalogFlatRow[]>(() => items.flatMap((manifest) => manifest.versions.flatMap((version) => version.items.map((leaf) => ({ manifest, row: leaf.row })))), [items]);

  // ── Card views: one per manifest, used by the panel renderer ─────────────────
  const manifestCards = useMemo(() => {
    const map = new Map<string, ManifestCardView>();
    for (const manifest of items) map.set(manifest.id, buildManifestCard(manifest));
    return map;
  }, [items]);

  const handleSettingsChange = useCallback((settings: TableSettings) => setConfig(slug(sourceId, 'settings'), settings), [setConfig, sourceId]);

  // ── Columns ───────────────────────────────────────────────────────────────────
  const columns = useMemo((): TableColumn<CatalogFlatRow>[] => {
    const cols: TableColumn<CatalogFlatRow>[] = [
      {
        id: 'title',
        header: 'Name',
        accessor: (flat) => flat.manifest.title,
        sortable: true,
        hideable: false,
        minWidth: 180,
      },
      {
        id: 'source',
        header: 'Source',
        align: 'left',
        accessor: (flat) => flat.manifest.source.title,
        sortable: true,
        minWidth: 120,
      },
      {
        id: 'provider',
        header: 'Provider',
        align: 'center',
        minWidth: 110,
        render: (flat) => {
          const providerType = flat.row.provider?.type ?? flat.manifest.provider?.type;
          return providerType ? (
            <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
              {getProviderIcon(providerType)}
              <span className="capitalize">{providerType}</span>
            </div>
          ) : (
            <span className="text-neutral-400 dark:text-neutral-500">—</span>
          );
        },
        sortValue: (flat) => flat.row.provider?.type ?? flat.manifest.provider?.type ?? '',
        groupValue: (flat) => {
          const t = flat.row.provider?.type ?? flat.manifest.provider?.type ?? '';
          return t ? t.charAt(0).toUpperCase() + t.slice(1) : 'Unknown';
        },
        sortable: true,
      },
      {
        id: 'version',
        header: 'Version',
        accessor: (flat) => flat.row.version,
        sortable: true,
        width: 110,
        align: 'center',
      },
      {
        id: 'architecture',
        header: 'Architecture',
        accessor: (flat) => flat.row.architecture,
        sortable: true,
        width: 130,
        align: 'center',
      },
      {
        id: 'size',
        header: 'Size',
        accessor: (flat) => flat.row.size,
        sortable: true,
        align: 'center',
        width: 90,
      },
      {
        id: 'status',
        header: 'Status',
        align: 'center',
        render: (flat) => {
          if (flat.row.tainted) {
            return (
              <Pill tone="warning" size="sm" variant="soft">
                Tainted
              </Pill>
            );
          }
          if (flat.row.revoked) {
            return (
              <Pill tone="danger" size="sm" variant="soft">
                Revoked
              </Pill>
            );
          }
          if (flat.row.active) {
            return (
              <Pill tone="success" size="sm" variant="soft">
                Active
              </Pill>
            );
          }
          return (
            <Pill tone="neutral" size="sm" variant="soft">
              Inactive
            </Pill>
          );
        },
        sortValue: (flat) => (flat.row.tainted ? 2 : flat.row.revoked ? 3 : flat.row.active ? 0 : 1),
        groupValue: (flat) => (flat.row.tainted ? 'Tainted' : flat.row.revoked ? 'Revoked' : flat.row.active ? 'Active' : 'Inactive'),
        sortable: true,
        width: 110,
      },
      {
        id: 'tags',
        header: 'Tags',
        align: 'center',
        minWidth: 100,
        render: (flat) =>
          flat.row.tagsList.length > 0 ? (
            <div className="flex gap-1">
              {flat.row.tagsList.slice(0, 3).map((tag) => (
                <Pill key={tag} tone={tag.toLowerCase() === 'latest' ? 'success' : 'neutral'} size="xs" variant={tag.toLowerCase() === 'latest' ? 'soft' : 'outline'}>
                  {tag}
                </Pill>
              ))}
            </div>
          ) : (
            <span className="text-neutral-400 dark:text-neutral-500">—</span>
          ),
        sortValue: (flat) => flat.row.tags,
        groupValue: (flat) => flat.row.tags || '—',
      },
      {
        id: 'created',
        header: 'Created',
        accessor: (flat) => flat.row.created,
        sortable: true,
        width: 160,
        align: 'center',
      },
      {
        id: 'downloads',
        header: 'Downloads',
        accessor: (flat) => flat.row.downloadCount ?? 0,
        sortable: true,
        align: 'center',
        width: 80,
      },
    ];

    if (onDownloadItem) {
      cols.push({
        id: 'actions1',
        header: '',
        hideable: false,
        groupable: false,
        resizable: false,
        minWidth: 120,
        align: 'right',
        sticky: 'right',
        render: (flat) => (
          <Button
            variant="soft"
            color={themeColor}
            size="xs"
            leadingIcon="Download"
            onClick={(e) => {
              e.stopPropagation();
              onDownloadItem(flat.row);
            }}
          >
            Pull {flat.row.version}
          </Button>
        ),
      });
    }

    return cols;
  }, [onDownloadItem, themeColor]);

  // ── Panel card renderer (one card per manifest) ───────────────────────────────
  const renderCard = useCallback(
    (flat: CatalogFlatRow) => {
      const card = manifestCards.get(flat.manifest.id);
      if (!card) return null;

      const { manifest, previewRow, latestRow, latestVersionLabel, featuredTags, activeRows } = card;
      const active = selectedManifestId === manifest.id;
      const architecture = previewRow?.architecture && previewRow.architecture !== '-' ? previewRow.architecture : (manifest.architectures[0] ?? '-');
      const size = previewRow?.size ?? '-';
      const lastUpdated = latestRow?.created ?? '-';
      let panelColor: 'red' | 'orange' | 'slate' = 'slate';
      if (manifest.taintedCount > 0 && manifest.versions.length === manifest.taintedCount) panelColor = 'red';
      else if (manifest.revokedCount > 0 && manifest.versions.length === manifest.revokedCount) panelColor = 'orange';

      const pullOptions: DropdownButtonOption[] = activeRows
        .filter((row) => row.id !== latestRow?.id)
        .map((row) => ({
          value: row.id,
          label: `Version ${row.version} • ${row.architecture}`,
          description: [row.size !== '-' ? row.size : '', row.created !== '-' ? row.created : ''].filter(Boolean).join(' • '),
        }));

      return (
        <Panel
          key={manifest.id}
          variant="glass"
          padding="xs"
          color={panelColor}
          decoration="both"
          bodyClassName="overflow-hidden w-full"
          className={active ? `border-${themeColor}-300/80 ring-1 ring-${themeColor}-200/80 dark:border-${themeColor}-500/70 dark:ring-${themeColor}-500/30` : ''}
          onClick={(e) => {
            e.stopPropagation();
            onSelectItem(manifest);
          }}
        >
          <div className="pointer-events-none absolute inset-0" />
          <div className="relative space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <CatalogManifest className="w-4 h-4 shrink-0" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-neutral-500 dark:text-neutral-400">Manifest</p>
                </div>
                <h3 className="pt-1">
                  <TruncatedText text={manifest.title} className="text-xl font-semibold text-neutral-900 dark:text-neutral-100" />
                </h3>
                <p className="line-clamp-2 text-xs text-neutral-500 dark:text-neutral-400 pt-1">{manifest.description || 'Ready-to-use virtual machine image catalog.'}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {manifest.provider && <div className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400">{getProviderIcon(manifest.provider.type)}</div>}
                <Pill tone={themeColor} size="xs" className="px-3">
                  {manifest.versions.length} version{manifest.versions.length !== 1 ? 's' : ''}
                </Pill>
                {manifest.versions.length > 1 && (
                  <Button
                    type="button"
                    variant="link"
                    color={themeColor}
                    size="sm"
                    className="shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectItem(manifest, 'versions');
                    }}
                  >
                    See all
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-xl border border-neutral-200/80 bg-neutral-100/90 p-2.5 text-[11px] text-neutral-600 dark:border-neutral-700/70 dark:bg-neutral-800/70 dark:text-neutral-300">
              <div>
                <p className="uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Architecture</p>
                <p className="truncate font-medium text-neutral-700 dark:text-neutral-200">{architecture}</p>
              </div>
              <div>
                <p className="uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Size</p>
                <p className="truncate font-medium text-neutral-700 dark:text-neutral-200">{size}</p>
              </div>
              <div>
                <p className="uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Images</p>
                <p className="font-medium text-neutral-700 dark:text-neutral-200">{manifest.totalItems}</p>
              </div>
              <div>
                <p className="uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Last Updated</p>
                <p className="truncate font-medium text-neutral-700 dark:text-neutral-200">{lastUpdated}</p>
              </div>
              <div>
                <p className="uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Provider</p>
                <p className="truncate font-medium text-neutral-700 dark:text-neutral-200">{manifest.provider?.type ?? manifest.source.title}</p>
              </div>
              <div>
                <p className="uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Downloads</p>
                <p className="font-medium text-neutral-700 dark:text-neutral-200">{manifest.totalDownloads}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 min-h-[36px] items-center">
              {manifest.taintedCount > 0 && (
                <Pill size="sm" tone="warning" variant="soft" className="w-fit p-2">
                  {manifest.taintedCount} tainted
                </Pill>
              )}
              {manifest.revokedCount > 0 && (
                <Pill size="sm" tone="danger" variant="soft" className="w-fit p-2">
                  {manifest.revokedCount} revoked
                </Pill>
              )}
              {(featuredTags.length > 0 ? featuredTags : manifest.taintedCount === 0 && manifest.revokedCount === 0 ? ['untagged'] : []).map((tag) => {
                const isLatest = tag.toLowerCase() === 'latest';
                return (
                  <Pill key={`${manifest.id}-${tag}`} size="sm" tone={isLatest ? 'success' : 'neutral'} variant={isLatest ? 'soft' : 'outline'} className="w-fit p-2">
                    {tag}
                  </Pill>
                );
              })}
            </div>

            {onDownloadItem ? (
              <DropdownButton
                label={`Pull Version ${latestVersionLabel}`}
                variant="solid"
                color={themeColor}
                size="sm"
                fullWidth
                className="w-full"
                menuWidth="trigger"
                options={pullOptions}
                disabled={!latestRow}
                onPrimaryClick={(e) => {
                  e.stopPropagation();
                  if (latestRow) onDownloadItem(latestRow);
                }}
                onOptionSelect={(option) => {
                  const selected = activeRows.find((r) => r.id === option.value);
                  if (selected) onDownloadItem(selected);
                }}
              />
            ) : (
              <Button variant="solid" color={themeColor} size="sm" leadingIcon="Download" fullWidth disabled>
                Pull ({latestVersionLabel})
              </Button>
            )}
          </div>
        </Panel>
      );
    },
    [manifestCards, selectedManifestId, themeColor, onSelectItem, onDownloadItem],
  );

  // ── Early-exit states ─────────────────────────────────────────────────────────
  if (!loading && error && flatRows.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4">
        <EmptyState
          disableBorder
          size="md"
          icon="Library"
          title="Could not load catalog items"
          subtitle={error}
          tone="danger"
          actionLabel="Retry"
          onAction={onRetry}
          actionColor="danger"
          actionLeadingIcon="Refresh"
        />
      </div>
    );
  }

  if (!loading && !error && flatRows.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4">
        <EmptyState
          disableBorder
          size="md"
          icon="Library"
          title={query ? 'No matching catalog items' : 'No catalog items available'}
          subtitle={query ? 'Try a different search query.' : 'This source does not contain catalog items yet.'}
          tone="neutral"
        />
      </div>
    );
  }

  if (loading && flatRows.length === 0) {
    return (
      <div className="grid h-full min-h-0 grid-cols-1 gap-4 overflow-y-auto p-4 md:grid-cols-2 2xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, idx) => (
          <div key={`catalog-skeleton-${idx}`} className="animate-pulse rounded-2xl border border-neutral-200/70 bg-white/90 p-4 dark:border-neutral-700/70 dark:bg-neutral-900/80">
            <div className="h-3 w-20 rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="mt-3 h-5 w-40 rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="mt-2 h-3 w-3/4 rounded bg-neutral-100 dark:bg-neutral-800" />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
              <div className="h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
            </div>
            <div className="mt-4 h-9 rounded-md bg-neutral-200 dark:bg-neutral-700" />
          </div>
        ))}
      </div>
    );
  }

  const renderEmptyState = () => (
    <EmptyState
      disableBorder
      size="md"
      icon="Library"
      title={query ? 'No matching catalog items' : 'No catalog items available'}
      subtitle={query ? 'Try a different search query.' : 'This source does not contain catalog items yet.'}
      tone="neutral"
    />
  );

  // ── Table ─────────────────────────────────────────────────────────────────────
  return (
    <Table<CatalogFlatRow>
      key={isLoaded ? `${sourceId}-ready` : `${sourceId}-pending`}
      columns={columns}
      data={flatRows}
      color={themeColor}
      rowKey={(flat) => flat.row.id}
      variant="flat"
      hoverable
      defaultSort={{ columnId: 'title', direction: 'asc' }}
      noBorders
      fullHeight
      stickyHeader
      onRowClick={(flat) => onSelectItem(flat.manifest)}
      resizableColumns
      groupable
      userStickyColumns
      panelMinItemWidth="300px"
      panelGap={12}
      stickyActions
      loading={loading && flatRows.length > 0}
      emptyState={!loading && renderEmptyState()}
      tableSettings={savedSettings}
      onTableSettingsChange={handleSettingsChange}
      panelItem={renderCard}
      panelDeduplicateBy={(flat) => flat.manifest.id}
    />
  );
};
