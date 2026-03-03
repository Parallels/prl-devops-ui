import React from 'react';
import { Button, IconButton, InfoRow, Pill, Section } from '@prl/ui-kit';
import { type CatalogManifestItem, type CatalogRow } from './CatalogModels';

const valueOrDash = (value?: string): string => {
  if (!value || value.trim().length === 0 || value === '-') return '—';
  return value;
};

const rowStatus = (row: CatalogRow): { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' } => {
  if (row.revoked) return { label: 'revoked', tone: 'danger' };
  if (row.tainted) return { label: 'tainted', tone: 'warning' };
  if (!row.active) return { label: 'inactive', tone: 'neutral' };
  return { label: 'active', tone: 'success' };
};

const isRowActive = (row: CatalogRow): boolean => row.active && !row.tainted && !row.revoked;

// ── Details Tab ────────────────────────────────────────────────────────────────

export interface CatalogDetailContentProps {
  manifest: CatalogManifestItem;
}

export const CatalogDetailContent: React.FC<CatalogDetailContentProps> = ({ manifest }) => {
  const { source } = manifest;

  return (
    <div className="space-y-3 p-3">
      {manifest.description && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{manifest.description}</p>
      )}

      <Section title="Catalog Overview" size="sm" bodyClassName="space-y-0 px-0 pb-0">
        <InfoRow label="Manifest ID" labelSize="sm" value={manifest.manifestId} hoverable />
        <InfoRow label="Versions" labelSize="sm" value={manifest.versions.length} hoverable />
        <InfoRow label="Total Images" labelSize="sm" value={manifest.totalItems} hoverable />
        <InfoRow label="Total Downloads" labelSize="sm" value={manifest.totalDownloads} hoverable />
      </Section>

      {manifest.architectures.length > 0 && (
        <Section title="Architectures" size="sm" bodyClassName="px-0 pb-0">
          <div className="flex flex-wrap gap-1.5 px-3 pb-3 pt-2">
            {manifest.architectures.map((arch) => (
              <Pill key={arch} size="xs" tone="info" variant="soft">{arch}</Pill>
            ))}
          </div>
        </Section>
      )}

      {manifest.tags.length > 0 && (
        <Section title="Tags" size="sm" bodyClassName="px-0 pb-0">
          <div className="flex flex-wrap gap-1.5 px-3 pb-3 pt-2">
            {manifest.tags.map((tag) => {
              const isLatest = tag.toLowerCase() === 'latest';
              return (
                <Pill
                  key={tag}
                  size="xs"
                  tone={isLatest ? 'success' : 'neutral'}
                  variant={isLatest ? 'soft' : 'outline'}
                >
                  {tag}
                </Pill>
              );
            })}
          </div>
        </Section>
      )}

      {(manifest.taintedCount > 0 || manifest.revokedCount > 0 || manifest.inactiveCount > 0) && (
        <Section title="Health" size="sm" bodyClassName="space-y-0 px-0 pb-0">
          {manifest.taintedCount > 0 && (
            <InfoRow label="Tainted" labelSize="sm" value={manifest.taintedCount} hoverable />
          )}
          {manifest.revokedCount > 0 && (
            <InfoRow label="Revoked" labelSize="sm" value={manifest.revokedCount} hoverable />
          )}
          {manifest.inactiveCount > 0 && (
            <InfoRow label="Inactive" labelSize="sm" value={manifest.inactiveCount} hoverable />
          )}
        </Section>
      )}

      {manifest.provider && (
        <Section title="Provider" size="sm" bodyClassName="space-y-0 px-0 pb-0">
          <InfoRow label="Type" labelSize="sm" value={valueOrDash(manifest.provider.type)} hoverable />
          <InfoRow label="Host" labelSize="sm" value={valueOrDash(manifest.provider.host)} hoverable />
        </Section>
      )}

      {(manifest.requiredRoles.length > 0 || manifest.requiredClaims.length > 0) && (
        <Section title="Access Control" size="sm" bodyClassName="space-y-0 px-0 pb-0">
          {manifest.requiredRoles.length > 0 && (
            <InfoRow
              label="Required Roles"
              labelSize="sm"
              value={
                <div className="flex flex-wrap gap-1.5 py-0.5">
                  {manifest.requiredRoles.map((role) => (
                    <Pill key={role} size="xs" tone="warning" variant="soft">{role}</Pill>
                  ))}
                </div>
              }
              hoverable
            />
          )}
          {manifest.requiredClaims.length > 0 && (
            <InfoRow
              label="Required Claims"
              labelSize="sm"
              value={
                <div className="flex flex-wrap gap-1.5 py-0.5">
                  {manifest.requiredClaims.map((claim) => (
                    <Pill key={claim} size="xs" tone="info" variant="soft">{claim}</Pill>
                  ))}
                </div>
              }
              hoverable
            />
          )}
        </Section>
      )}

      <Section title="Source" size="sm" bodyClassName="space-y-0 px-0 pb-0">
        <InfoRow label="Name" labelSize="sm" value={valueOrDash(source.title)} hoverable />
        <InfoRow label="Type" labelSize="sm" value={valueOrDash(source.type)} hoverable />
        <InfoRow label="Endpoint" labelSize="sm" value={valueOrDash(source.subtitle)} hoverable />
      </Section>
    </div>
  );
};

// ── Versions Tab ───────────────────────────────────────────────────────────────

export interface CatalogVersionsContentProps {
  manifest: CatalogManifestItem;
  onDownloadItem?: (row: CatalogRow) => void;
  onDeleteItem?: (row: CatalogRow) => void;
}

export const CatalogVersionsContent: React.FC<CatalogVersionsContentProps> = ({
  manifest,
  onDownloadItem,
  onDeleteItem,
}) => (
  <div className="space-y-3 p-3">
    <div className="rounded-xl border border-neutral-200/80 bg-gradient-to-br from-neutral-100/80 via-white to-white p-3 dark:border-neutral-700/80 dark:from-neutral-800 dark:via-neutral-900 dark:to-neutral-900">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
        Quick Version View
      </p>
      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
        Pull only active rows. Tainted and revoked rows remain visible for audit context.
      </p>
    </div>

    {manifest.versions.map((version) => (
      <section
        key={version.id}
        className="rounded-xl border border-neutral-200/80 bg-neutral-50/80 p-3 dark:border-neutral-700/80 dark:bg-neutral-800/60"
      >
        <div className="mb-2 flex items-center justify-between gap-2 border-b border-neutral-200/80 pb-2 dark:border-neutral-700/70">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-xs font-semibold text-neutral-700 dark:text-neutral-200">
              Version {version.version}
            </p>
            {version.version.trim().toLowerCase() === 'latest' && (
              <Pill size="xs" tone="success">latest</Pill>
            )}
          </div>
          <Pill size="xs" tone="info">
            {version.items.length} item{version.items.length !== 1 ? 's' : ''}
          </Pill>
        </div>

        <div className="space-y-2">
          {version.items.map(({ id, row }) => {
            const status = rowStatus(row);
            return (
              <div
                key={id}
                className="rounded-lg border border-neutral-200/80 bg-white p-2.5 shadow-sm dark:border-neutral-700/80 dark:bg-neutral-900/70"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                      {row.name}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Arch {row.architecture} • {row.size}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Pill size="xs" tone={status.tone} variant="soft">{status.label}</Pill>
                      {row.tagsList.slice(0, 2).map((tag) => (
                        <Pill
                          key={`${row.id}-${tag}`}
                          size="xs"
                          tone={tag.toLowerCase() === 'latest' ? 'success' : 'neutral'}
                          variant={tag.toLowerCase() === 'latest' ? 'soft' : 'outline'}
                        >
                          {tag}
                        </Pill>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {onDownloadItem && isRowActive(row) && (
                      <Button
                        variant="soft"
                        color="success"
                        size="xs"
                        onClick={() => onDownloadItem(row)}
                      >
                        Pull
                      </Button>
                    )}
                    {onDeleteItem && (
                      <IconButton
                        icon="Trash"
                        size="xs"
                        variant="ghost"
                        color="danger"
                        onClick={() => onDeleteItem(row)}
                        aria-label="Delete catalog item"
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    ))}
  </div>
);
