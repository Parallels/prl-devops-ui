import React, { useMemo } from 'react';
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
  ThemeColor,
  TruncatedText,
  type DropdownButtonOption,
} from '@prl/ui-kit';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import {
  type CatalogManifestItem,
  type CatalogRow,
} from './CatalogModels';
import { CatalogManifest } from '@prl/ui-kit/icons/components/CatalogManifest';

interface CatalogManifestListProps {
  items: CatalogManifestItem[];
  query: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  selectedManifestId?: string;
  onSelectItem: (manifest: CatalogManifestItem, tab?: 'details' | 'versions') => void;
  onDownloadItem?: (row: CatalogRow) => void;
}

interface ManifestCardView {
  manifest: CatalogManifestItem;
  allRows: CatalogRow[];
  activeRows: CatalogRow[];
  previewRow: CatalogRow | null;
  latestRow: CatalogRow | null;
  latestVersionLabel: string;
  featuredTags: string[];
}

const hasLatestTag = (row: CatalogRow): boolean =>
  row.tagsList.some((tag) => tag.trim().toLowerCase() === 'latest');

const collectRows = (manifest: CatalogManifestItem): CatalogRow[] =>
  manifest.versions.flatMap((version) => version.items.map(({ row }) => row));

const isRowActive = (row: CatalogRow): boolean => row.active && !row.tainted && !row.revoked;

const findLatestRow = (rows: CatalogRow[]): CatalogRow | null => {
  if (rows.length === 0) return null;

  const latestTagRow = rows.find((row) => hasLatestTag(row));
  if (latestTagRow) return latestTagRow;

  const latestVersionRow = rows.find((row) => row.version.trim().toLowerCase() === 'latest');
  if (latestVersionRow) return latestVersionRow;

  return rows[0] ?? null;
};

const buildManifestCard = (manifest: CatalogManifestItem): ManifestCardView => {
  const allRows = collectRows(manifest);
  const activeRows = allRows.filter(isRowActive);
  const previewRow = findLatestRow(allRows);
  const latestRow = findLatestRow(activeRows);
  const primaryRow = latestRow ?? previewRow;

  const latestVersionLabel = latestRow?.version && latestRow.version !== '-'
    ? latestRow.version
    : previewRow?.version && previewRow.version !== '-'
      ? previewRow.version
      : manifest.versions[0]?.version ?? '-';

  const tags = Array.from(
    new Set([
      ...(primaryRow?.tagsList ?? []),
      ...manifest.tags,
    ]
      .map((tag) => tag.trim())
      .filter((tag) => {
        const token = tag.toLowerCase();
        return Boolean(tag) && token !== 'tainted' && token !== 'revoked';
      })),
  ).slice(0, 4);

  return {
    manifest,
    allRows,
    activeRows,
    previewRow,
    latestRow,
    latestVersionLabel,
    featuredTags: tags,
  };
};


const getProviderIcon = (provider: string): React.ReactNode => {
  switch (provider) {
    case 'local':
      return <Folder className='w-5 h-5' />;
    case 'minio':
      return <Minio className='w-5 h-5' />;
    case 'aws-s3':
      return <Aws className='w-5 h-5' />;
    case 'azure-storage-account':
      return <Azure className='w-5 h-5' />;
    case 'artifactory':
      return <Artifactory className='w-5 h-5' />;
    default:
      return <Library className='w-5 h-5' />;
  }
};


export const CatalogManifestList: React.FC<CatalogManifestListProps> = ({
  items,
  query,
  loading = false,
  error = null,
  onRetry,
  selectedManifestId,
  onSelectItem,
  onDownloadItem,
}) => {
  const { themeColor } = useSystemSettings();
  const manifests = useMemo(() => items.map(buildManifestCard), [items]);

  if (!loading && error && manifests.length === 0) {
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

  if (!loading && !error && manifests.length === 0) {
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

  if (loading && manifests.length === 0) {
    return (
      <div className="grid h-full min-h-0 grid-cols-1 gap-4 overflow-y-auto p-4 md:grid-cols-2 2xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, idx) => (
          <div
            key={`catalog-skeleton-${idx}`}
            className="animate-pulse rounded-2xl border border-neutral-200/70 bg-white/90 p-4 dark:border-neutral-700/70 dark:bg-neutral-900/80"
          >
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

  return (
    <div className="flex-1 min-h-0 p-4">
      <div className="grid h-full min-h-0 grid-cols-1 gap-4">
        <div className="min-h-0 overflow-y-auto pr-1 @container">
          <div className="grid grid-cols-1 gap-4 @[480px]:grid-cols-2 @[768px]:grid-cols-3 @[1100px]:grid-cols-4">
            {manifests.map((card) => {
              const { manifest, previewRow, latestRow, latestVersionLabel, featuredTags, activeRows } = card;
              const active = selectedManifestId === manifest.id;
              const architecture = previewRow?.architecture && previewRow.architecture !== '-'
                ? previewRow.architecture
                : manifest.architectures[0] ?? '-';
              const size = previewRow?.size ?? '-';
              const lastUpdated = latestRow?.created ?? '-';
              let panelColor: ThemeColor = 'slate';
              if (manifest.taintedCount > 0 && manifest.versions.length === manifest.taintedCount) {
                panelColor = 'red';
              } else if (manifest.revokedCount > 0 && manifest.versions.length === manifest.revokedCount) {
                panelColor = 'orange';
              }

              const pullOptions: DropdownButtonOption[] = activeRows
                .filter((row) => row.id !== latestRow?.id)
                .map((row) => ({
                  value: row.id,
                  label: `Version ${row.version} • ${row.architecture}`,
                  description: [row.size !== '-' ? row.size : '', row.created !== '-' ? row.created : '']
                    .filter(Boolean)
                    .join(' • '),
                }));

              return (
                <Panel
                  key={manifest.id}
                  variant="elevated"
                  padding="xs"
                  tone={panelColor}
                  decoration="both"
                  maxWidth="400px"
                  bodyClassName='overflow-hidden w-full'
                  className={[
                    active
                      ? `border-${themeColor}-300/80 ring-1 ring-${themeColor}-200/80 dark:border-${themeColor}-500/70 dark:ring-${themeColor}-500/30`
                      : '',
                  ].join(' ')}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectItem(manifest);
                  }}
                >
                  <div className="pointer-events-none absolute inset-0" />
                  <div className="relative space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <CatalogManifest className="w-4 h-4 shrink-0" />
                          <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-neutral-500 dark:text-neutral-400">
                            Manifest
                          </p>
                        </div>
                        <h3 className="pt-1">
                          <TruncatedText
                            text={manifest.title}
                            className="text-xl font-semibold text-neutral-900 dark:text-neutral-100"
                          />
                        </h3>
                        <p className="line-clamp-2 text-xs text-neutral-500 dark:text-neutral-400 pt-1">
                          {manifest.description || 'Ready-to-use virtual machine image catalog.'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {manifest.provider && (
                          <div className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400">
                            {getProviderIcon(manifest.provider.type)}
                          </div>
                        )}
                        <Pill tone={themeColor} size="xs" className="px-3">
                          {manifest.versions.length} version{manifest.versions.length !== 1 ? 's' : ''}
                        </Pill>
                        <div className="flex items-center gap-1">
                          {manifest.versions.length > 1 && (
                            <Button
                              type="button"
                              variant="link"
                              color={themeColor}
                              size="sm"
                              className="shrink-0"
                              onClick={(event) => {
                                event.stopPropagation();
                                onSelectItem(manifest, 'versions');
                              }}
                            >
                              See all
                            </Button>
                          )}

                        </div>
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
                        <p className="truncate font-medium text-neutral-700 dark:text-neutral-200">
                          {manifest.provider?.type ?? manifest.source.title}
                        </p>
                      </div>
                      <div>
                        <p className="uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Downloads</p>
                        <p className="font-medium text-neutral-700 dark:text-neutral-200">{manifest.totalDownloads}</p>
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-2">
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
                        {(featuredTags.length > 0 ? featuredTags : (manifest.taintedCount === 0 && manifest.revokedCount === 0 ? ['untagged'] : [])).map((tag) => {
                          const isLatest = tag.toLowerCase() === 'latest';
                          return (
                            <Pill
                              key={`${manifest.id}-${tag}`}
                              size="sm"
                              tone={isLatest ? 'success' : 'neutral'}
                              variant={isLatest ? 'soft' : 'outline'}
                              className="w-fit p-2"
                            >
                              {tag}
                            </Pill>
                          );
                        })}
                      </div>

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
                        onPrimaryClick={(event) => {
                          event.stopPropagation();
                          if (!latestRow) return;
                          onDownloadItem(latestRow);
                        }}
                        onOptionSelect={(option) => {
                          const selected = activeRows.find((row) => row.id === option.value);
                          if (selected) onDownloadItem(selected);
                        }}
                      />
                    ) : (
                      <Button
                        variant="solid"
                        color={themeColor}
                        size="sm"
                        leadingIcon="Download"
                        fullWidth
                        disabled
                      >
                        Pull ({latestVersionLabel})
                      </Button>
                    )}
                  </div>
                </Panel>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
};
