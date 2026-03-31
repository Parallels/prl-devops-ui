import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Button, CatalogVersion, ConfirmInlinePanel, DeleteConfirmInlinePanel, IconButton, InfoRow, InlinePanel, Picker, Pill, Section, TagPanel, TagPanelTag, TagPicker, Textarea, type PickerItem, type TagPickerItem } from '@prl/ui-kit';
import { type CatalogManifestItem, type CatalogManifestVersion, type CatalogRow, type CatalogSource } from './CatalogModels';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { devopsService } from '@/services/devops';
import { DevOpsClaim } from '@/interfaces/devops';

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

// ── Fan-out helper (version-scoped) ────────────────────────────────────────────

type EditField = 'tags' | 'roles' | 'claims';

async function applyVersionField(
  hostname: string,
  source: CatalogSource,
  manifest: CatalogManifestItem,
  version: CatalogManifestVersion,
  field: EditField,
  current: string[],
  next: string[],
): Promise<void> {
  const toAdd = next.filter((v) => !current.includes(v));
  const toRemove = current.filter((v) => !next.includes(v));

  if (toAdd.length === 0 && toRemove.length === 0) return;

  const architectures = Array.from(
    new Set(version.items.map(({ row }) => row.architecture).filter((a) => a !== '-')),
  );
  const versionId = version.version;
  const isManager = source.type === 'manager' && !!source.managerId;

  await Promise.all(
    architectures.flatMap((architecture) => {
      const ops: Promise<boolean>[] = [];
      if (toAdd.length > 0) {
        if (field === 'tags') {
          ops.push(isManager
            ? devopsService.catalogManagers.addCatalogManifestTags(hostname, source.managerId!, manifest.manifestId, versionId, architecture, toAdd)
            : devopsService.catalog.addCatalogManifestTags(hostname, manifest.manifestId, versionId, architecture, toAdd));
        } else if (field === 'roles') {
          ops.push(isManager
            ? devopsService.catalogManagers.addCatalogManifestRoles(hostname, source.managerId!, manifest.manifestId, versionId, architecture, toAdd)
            : devopsService.catalog.addCatalogManifestRoles(hostname, manifest.manifestId, versionId, architecture, toAdd));
        } else {
          ops.push(isManager
            ? devopsService.catalogManagers.addCatalogManifestClaims(hostname, source.managerId!, manifest.manifestId, versionId, architecture, toAdd)
            : devopsService.catalog.addCatalogManifestClaims(hostname, manifest.manifestId, versionId, architecture, toAdd));
        }
      }
      if (toRemove.length > 0) {
        if (field === 'tags') {
          ops.push(isManager
            ? devopsService.catalogManagers.removeCatalogManifestTags(hostname, source.managerId!, manifest.manifestId, versionId, architecture, toRemove)
            : devopsService.catalog.removeCatalogManifestTags(hostname, manifest.manifestId, versionId, architecture, toRemove));
        } else if (field === 'roles') {
          ops.push(isManager
            ? devopsService.catalogManagers.removeCatalogManifestRoles(hostname, source.managerId!, manifest.manifestId, versionId, architecture, toRemove)
            : devopsService.catalog.removeCatalogManifestRoles(hostname, manifest.manifestId, versionId, architecture, toRemove));
        } else {
          ops.push(isManager
            ? devopsService.catalogManagers.removeCatalogManifestClaims(hostname, source.managerId!, manifest.manifestId, versionId, architecture, toRemove)
            : devopsService.catalog.removeCatalogManifestClaims(hostname, manifest.manifestId, versionId, architecture, toRemove));
        }
      }
      return ops;
    }),
  );
}

// ── Detail Panel ───────────────────────────────────────────────────────────────

export interface CatalogDetailContentProps {
  manifest: CatalogManifestItem;
  hostname?: string;
  source?: CatalogSource;
  canEdit?: boolean;
  onReload?: () => void;
  onClose?: () => void;
  onPullRow?: (row: CatalogRow) => void;
}

export const CatalogDetailContent: React.FC<CatalogDetailContentProps> = ({
  manifest,
  hostname,
  source,
  canEdit,
  onReload,
  onClose,
  onPullRow,
}) => {
  const { themeColor } = useSystemSettings();

  // ── Version selection ──────────────────────────────────────────────────────
  const defaultVersionId = useMemo(() => {
    const latest = manifest.versions.find((v) => v.version.toLowerCase() === 'latest');
    return (latest ?? manifest.versions[0])?.id ?? '';
  }, [manifest.versions]);

  const [selectedVersionId, setSelectedVersionId] = useState<string>(defaultVersionId);

  // Reset when manifest changes
  useEffect(() => {
    setSelectedVersionId(defaultVersionId);
  }, [defaultVersionId]);

  const selectedVersion = useMemo(
    () => manifest.versions.find((v) => v.id === selectedVersionId) ?? manifest.versions[0],
    [manifest.versions, selectedVersionId],
  );

  const versionPickerItems = useMemo<PickerItem[]>(
    () =>
      manifest.versions.map((v) => {
        const hasTainted = v.items.some(({ row }) => row.tainted);
        const hasRevoked = v.items.some(({ row }) => row.revoked);
        const tags: { label: string; tone: 'success' | 'warning' | 'danger' }[] = [];
        if (v.version.toLowerCase() === 'latest') tags.push({ label: 'latest', tone: 'success' });
        if (hasTainted) tags.push({ label: 'tainted', tone: 'warning' });
        if (hasRevoked) tags.push({ label: 'revoked', tone: 'danger' });
        let subtitle: string | undefined = undefined;
        if (v.items.length > 0) {
          subtitle = `${v.items[0].row.size || 'Unknown Size'} (${v.items[0].row.architecture})`;
        }

        const item: PickerItem = {
          id: v.id,
          title: `Version ${v.version}`,
          subtitle: subtitle,
          tags: tags.length > 0 ? tags : undefined,
          icon: <CatalogVersion className={hasRevoked ? 'text-rose-500' : hasTainted ? 'text-amber-500' : 'text-emerald-500'} />,
        };
        return item;
      }),
    [manifest.versions],
  );

  // ── Per-version derived data ───────────────────────────────────────────────
  const versionTags = useMemo(
    () => (selectedVersion
      ? Array.from(new Set(selectedVersion.items.flatMap(({ row }) => row.tagsList))).sort()
      : []),
    [selectedVersion],
  );

  const versionArchitectures = useMemo(
    () => (selectedVersion
      ? Array.from(new Set(selectedVersion.items.map(({ row }) => row.architecture).filter((a) => a !== '-'))).sort()
      : []),
    [selectedVersion],
  );

  const versionRoles = useMemo(
    () => (selectedVersion
      ? Array.from(new Set(selectedVersion.items.flatMap(({ row }) => row.requiredRoles ?? []))).sort()
      : []),
    [selectedVersion],
  );

  const versionClaims = useMemo(
    () => (selectedVersion
      ? Array.from(new Set(selectedVersion.items.flatMap(({ row }) => row.requiredClaims ?? []))).sort()
      : []),
    [selectedVersion],
  );

  const versionHealth = useMemo(() => {
    if (!selectedVersion) return { tainted: 0, revoked: 0, inactive: 0 };
    return selectedVersion.items.reduce(
      (acc, { row }) => ({
        tainted: acc.tainted + (row.tainted ? 1 : 0),
        revoked: acc.revoked + (row.revoked ? 1 : 0),
        inactive: acc.inactive + (!row.active ? 1 : 0),
      }),
      { tainted: 0, revoked: 0, inactive: 0 },
    );
  }, [selectedVersion]);

  const versionProvider = useMemo(
    () => selectedVersion?.items.find(({ row }) => row.provider)?.row.provider,
    [selectedVersion],
  );

  // Editing is disabled when the selected version has any tainted or revoked items
  const versionIsEditable = canEdit && versionHealth.tainted === 0 && versionHealth.revoked === 0;

  // ── Description state ──────────────────────────────────────────────────────
  const [descPanelOpen, setDescPanelOpen] = useState(false);
  const [descValue, setDescValue] = useState('');
  const [descSaving, setDescSaving] = useState(false);
  const [descError, setDescError] = useState<string | null>(null);

  // ── Tags state ─────────────────────────────────────────────────────────────
  const [tagsPanelOpen, setTagsPanelOpen] = useState(false);
  const [tagsValue, setTagsValue] = useState<string[]>([]);
  const [tagsSaving, setTagsSaving] = useState(false);
  const [tagsError, setTagsError] = useState<string | null>(null);

  // ── Roles state ────────────────────────────────────────────────────────────
  const [rolesPanelOpen, setRolesPanelOpen] = useState(false);
  const [rolesValue, setRolesValue] = useState<string[]>([]);
  const [rolesSaving, setRolesSaving] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);

  // ── Claims state ───────────────────────────────────────────────────────────
  const [claimsPanelOpen, setClaimsPanelOpen] = useState(false);
  const [claimsValue, setClaimsValue] = useState<string[]>([]);
  const [claimsSaving, setClaimsSaving] = useState(false);
  const [claimsError, setClaimsError] = useState<string | null>(null);
  const [availableClaims, setAvailableClaims] = useState<TagPickerItem[]>([]);

  // ── Load available claims when claims panel opens ──────────────────────────
  useEffect(() => {
    if (!claimsPanelOpen || !hostname) return;
    devopsService.claims
      .getClaims(hostname)
      .then((all) =>
        setAvailableClaims(
          all
            .filter((c: DevOpsClaim) => !!c.internal)
            .map((c: DevOpsClaim) => ({ id: c.name, label: c.name, ...(c.description ? { description: c.description } : {}) })),
        ),
      )
      .catch(() => setAvailableClaims([]));
  }, [claimsPanelOpen, hostname]);

  // ── Save handlers ──────────────────────────────────────────────────────────
  const handleSaveDescription = useCallback(async () => {
    if (!hostname || !source || !selectedVersion) return;
    setDescSaving(true);
    setDescError(null);
    try {
      const architectures = Array.from(
        new Set(selectedVersion.items.map(({ row }) => row.architecture).filter((a) => a !== '-')),
      );
      const versionId = selectedVersion.version;
      const isManager = source.type === 'manager' && !!source.managerId;
      await Promise.all(
        architectures.map((architecture) =>
          isManager
            ? devopsService.catalogManagers.updateCatalogManifestDescription(hostname, source.managerId!, manifest.manifestId, versionId, architecture, descValue)
            : devopsService.catalog.updateCatalogManifestDescription(hostname, manifest.manifestId, versionId, architecture, descValue),
        ),
      );
      setDescPanelOpen(false);
      onReload?.();
    } catch (err: any) {
      setDescError(err?.message ?? 'Failed to update description.');
    } finally {
      setDescSaving(false);
    }
  }, [hostname, source, manifest, selectedVersion, descValue, onReload]);

  const handleSaveTags = useCallback(async () => {
    if (!hostname || !source || !selectedVersion) return;
    setTagsSaving(true);
    setTagsError(null);
    try {
      await applyVersionField(hostname, source, manifest, selectedVersion, 'tags', versionTags, tagsValue);
      setTagsPanelOpen(false);
      onReload?.();
    } catch (err: any) {
      setTagsError(err?.message ?? 'Failed to update tags.');
    } finally {
      setTagsSaving(false);
    }
  }, [hostname, source, manifest, selectedVersion, versionTags, tagsValue, onReload]);

  const handleSaveRoles = useCallback(async () => {
    if (!hostname || !source || !selectedVersion) return;
    setRolesSaving(true);
    setRolesError(null);
    try {
      await applyVersionField(hostname, source, manifest, selectedVersion, 'roles', versionRoles, rolesValue);
      setRolesPanelOpen(false);
      onReload?.();
    } catch (err: any) {
      setRolesError(err?.message ?? 'Failed to update roles.');
    } finally {
      setRolesSaving(false);
    }
  }, [hostname, source, manifest, selectedVersion, versionRoles, rolesValue, onReload]);

  const handleSaveClaims = useCallback(async () => {
    if (!hostname || !source || !selectedVersion) return;
    setClaimsSaving(true);
    setClaimsError(null);
    try {
      await applyVersionField(hostname, source, manifest, selectedVersion, 'claims', versionClaims, claimsValue);
      setClaimsPanelOpen(false);
      onReload?.();
    } catch (err: any) {
      setClaimsError(err?.message ?? 'Failed to update claims.');
    } finally {
      setClaimsSaving(false);
    }
  }, [hostname, source, manifest, selectedVersion, versionClaims, claimsValue, onReload]);

  // ── Version actions: taint / revoke / delete ──────────────────────────────
  const [confirmTaint, setConfirmTaint] = useState(false);
  const [taintLoading, setTaintLoading] = useState(false);
  const [confirmUntaint, setConfirmUntaint] = useState(false);
  const [untaintLoading, setUntaintLoading] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [versionActionError, setVersionActionError] = useState<string | null>(null);

  const fanOutVersionAction = useCallback(
    async (action: 'taint' | 'untaint' | 'revoke') => {
      if (!hostname || !source || !selectedVersion) return;
      const architectures = Array.from(
        new Set(selectedVersion.items.map(({ row }) => row.architecture).filter((a) => a !== '-')),
      );
      const versionId = selectedVersion.version;
      const isManager = source.type === 'manager' && !!source.managerId;
      await Promise.all(
        architectures.map((architecture) => {
          if (action === 'taint') {
            return isManager
              ? devopsService.catalogManagers.taintCatalogManifest(hostname, source.managerId!, manifest.manifestId, versionId, architecture)
              : devopsService.catalog.taintCatalogManifest(hostname, manifest.manifestId, versionId, architecture);
          }
          if (action === 'untaint') {
            return isManager
              ? devopsService.catalogManagers.untaintCatalogManifest(hostname, source.managerId!, manifest.manifestId, versionId, architecture)
              : devopsService.catalog.untaintCatalogManifest(hostname, manifest.manifestId, versionId, architecture);
          }
          return isManager
            ? devopsService.catalogManagers.revokeCatalogManifest(hostname, source.managerId!, manifest.manifestId, versionId, architecture)
            : devopsService.catalog.revokeCatalogManifest(hostname, manifest.manifestId, versionId, architecture);
        }),
      );
    },
    [hostname, source, manifest, selectedVersion],
  );

  const handleTaint = useCallback(async () => {
    setTaintLoading(true);
    setVersionActionError(null);
    try {
      await fanOutVersionAction('taint');
      setConfirmTaint(false);
      onReload?.();
    } catch (err: any) {
      setVersionActionError(err?.message ?? 'Failed to taint version.');
    } finally {
      setTaintLoading(false);
    }
  }, [fanOutVersionAction, onReload]);

  const handleUntaint = useCallback(async () => {
    setUntaintLoading(true);
    setVersionActionError(null);
    try {
      await fanOutVersionAction('untaint');
      setConfirmUntaint(false);
      onReload?.();
    } catch (err: any) {
      setVersionActionError(err?.message ?? 'Failed to untaint version.');
    } finally {
      setUntaintLoading(false);
    }
  }, [fanOutVersionAction, onReload]);

  const handleRevoke = useCallback(async () => {
    setRevokeLoading(true);
    setVersionActionError(null);
    try {
      await fanOutVersionAction('revoke');
      setConfirmRevoke(false);
      onReload?.();
    } catch (err: any) {
      setVersionActionError(err?.message ?? 'Failed to revoke version.');
    } finally {
      setRevokeLoading(false);
    }
  }, [fanOutVersionAction, onReload]);

  const handleDeleteVersion = useCallback(async () => {
    if (!hostname || !source || !selectedVersion) return;
    setDeleteLoading(true);
    setVersionActionError(null);
    try {
      const isManager = source.type === 'manager' && !!source.managerId;
      if (isManager) {
        await devopsService.catalogManagers.removeCatalogManifest(hostname, source.managerId!, manifest.manifestId, selectedVersion.version);
      } else {
        await devopsService.catalog.removeCatalogManifest(hostname, manifest.manifestId, selectedVersion.version);
      }
      setConfirmDelete(false);
      onClose?.();
    } catch (err: any) {
      setVersionActionError(err?.message ?? 'Failed to delete version.');
    } finally {
      setDeleteLoading(false);
    }
  }, [hostname, source, manifest, selectedVersion, onReload]);

  // First active row in the selected version — used for pull
  const firstActiveRow = useMemo(
    () => selectedVersion?.items.find(({ row }) => row.active && !row.tainted && !row.revoked)?.row,
    [selectedVersion],
  );

  // Version-level action availability
  const isNormal = versionHealth.tainted === 0 && versionHealth.revoked === 0;
  const isTainted = versionHealth.tainted > 0 && versionHealth.revoked === 0;
  const canPull = isNormal && !!firstActiveRow;
  const canTaintVersion = canEdit && isNormal;
  const canUntaintVersion = canEdit && isTainted;
  const canRevokeVersion = canEdit && (isNormal || isTainted);
  const canDeleteVersion = !!canEdit;
  const versionName = selectedVersion ? `Version ${selectedVersion.version}` : 'the version';

  const manifestSource = source ?? manifest.source;
  const tags: TagPanelTag[] = versionTags.map((m) => (() => { 
    let color = themeColor;
    if (m.toLowerCase() === 'latest') color = 'success';
    const tag: TagPanelTag = { label: m.toLowerCase(), tone:  color, variant: 'soft' };
    return tag;
  })());

  return (
    <>
      <div className="space-y-3 p-3">

        {/* Version picker */}
        {manifest.versions.length > 1 && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">Version</p>
            <Picker
              items={versionPickerItems}
              selectedId={selectedVersionId}
              onSelect={(item) => setSelectedVersionId(item.id)}
              placeholder="Select a version…"
              color={themeColor}
              escapeBoundary
            />
          </div>
        )}

        {/* Version actions */}
        {(canPull || canTaintVersion || canUntaintVersion || canRevokeVersion || canDeleteVersion) && (
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {canPull && (
              <Button
                tooltip={`Pull ${versionName}`}
                size="xs"
                variant="soft"
                color="success"
                leadingIcon="Pull"
                onClick={() => { if (firstActiveRow) { onPullRow?.(firstActiveRow); onClose?.(); } }}
              >
                Pull
              </Button>
            )}
            {canTaintVersion && (
              <Button
                tooltip={`Taint ${versionName}`}
                size="xs"
                variant="soft"
                color="warning"
                leadingIcon="Taint"
                onClick={() => { setConfirmTaint(true); setVersionActionError(null); }}
              >
                Taint
              </Button>
            )}
            {canUntaintVersion && (
              <Button
                tooltip={`Untaint ${versionName}`}
                size="xs"
                variant="soft"
                color="success"
                leadingIcon="Unlock"
                onClick={() => { setConfirmUntaint(true); setVersionActionError(null); }}
              >
                Untaint
              </Button>
            )}
            {canRevokeVersion && (
              <Button
                tooltip={`Revoke ${versionName}`}
                size="xs"
                variant="soft"
                color="rose"
                leadingIcon="Revoke"
                onClick={() => { setConfirmRevoke(true); setVersionActionError(null); }}
              >
                Revoke
              </Button>
            )}
            {canDeleteVersion && (
              <Button
                tooltip={`Delete ${versionName}`}
                size="xs"
                variant="soft"
                color="red"
                leadingIcon="Trash"
                onClick={() => { setConfirmDelete(true); setVersionActionError(null); }}
              >
                Delete
              </Button>
            )}
          </div>
        )}

        {/* Description (manifest-level) */}
        <div className="flex items-start justify-between gap-2 pt-1 pb-2">
          <p className="text-sm text-neutral-500 dark:text-neutral-400 flex-1">
            {manifest.description || (
              <span className="italic text-neutral-400 dark:text-neutral-600">No description</span>
            )}
          </p>
          {versionIsEditable && (
            <Button
              size="xs"
              variant="ghost"
              color="slate"
              leadingIcon={manifest.description ? 'Edit' : 'Add'}
              onClick={() => {
                setDescValue(manifest.description ?? '');
                setDescPanelOpen(true);
                setDescError(null);
              }}
            >
              {manifest.description ? 'Edit' : 'Add'}
            </Button>
          )}
        </div>

        <Section title="Catalog Overview" size="sm" bodyClassName="space-y-0 px-0 pb-0">
          <InfoRow label="Manifest ID" labelSize="sm" value={manifest.manifestId} hoverable />
          <InfoRow label="Versions" labelSize="sm" value={manifest.versions.length} hoverable />
          <InfoRow label="Images (this version)" labelSize="sm" value={selectedVersion?.items.length ?? 0} hoverable />
          <InfoRow label="Total Downloads" labelSize="sm" value={manifest.totalDownloads} hoverable />
        </Section>

        {versionArchitectures.length > 0 && (
          <Section title="Architectures" size="sm" bodyClassName="px-0 pb-0">
            <div className="flex flex-wrap gap-1.5 px-3 pb-3 pt-2">
              {versionArchitectures.map((arch) => (
                <Pill key={arch} size="xs" tone="info" variant="soft">{arch}</Pill>
              ))}
            </div>
          </Section>
        )}

        <Section
          title={
            <div className="flex items-center justify-between w-full pr-1 gap-2">
              <span>Tags</span>
              {versionIsEditable && (
                <Button
                  size="xs"
                  variant="ghost"
                  color={themeColor}
                  leadingIcon={versionTags.length > 0 ? 'Edit' : 'Add'}
                  onClick={() => {
                    setTagsValue([...versionTags]);
                    setTagsPanelOpen(true);
                    setTagsError(null);
                  }}
                >
                  {versionTags.length > 0 ? 'Edit' : 'Add'}
                </Button>
              )}
            </div>
          }
          size="sm"
          bodyClassName="px-0 pb-0"
        >
          {versionTags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 px-3 pt-2">
              <TagPanel tags={tags} tagLimit={5} />
            </div>
          ) : (
            <p className="px-3 pb-3 pt-2 text-xs italic text-neutral-400 dark:text-neutral-600">No tags</p>
          )}
        </Section>

        {(versionHealth.tainted > 0 || versionHealth.revoked > 0 || versionHealth.inactive > 0) && (
          <Section title="Health" size="sm" bodyClassName="space-y-0 px-0 pb-0">
            {versionHealth.tainted > 0 && (
              <InfoRow label="Tainted" labelSize="sm" value={versionHealth.tainted} hoverable />
            )}
            {versionHealth.revoked > 0 && (
              <InfoRow label="Revoked" labelSize="sm" value={versionHealth.revoked} hoverable />
            )}
            {versionHealth.inactive > 0 && (
              <InfoRow label="Inactive" labelSize="sm" value={versionHealth.inactive} hoverable />
            )}
          </Section>
        )}

        {versionProvider && (
          <Section title="Provider" size="sm" bodyClassName="space-y-0 px-0 pb-0">
            <InfoRow label="Type" labelSize="sm" value={valueOrDash(versionProvider.type)} hoverable />
            <InfoRow label="Host" labelSize="sm" value={valueOrDash(versionProvider.host)} hoverable />
          </Section>
        )}

        <Section
          title={
            <div className="flex items-center justify-between w-full pr-1 gap-2">
              <span>Required Roles</span>
              {versionIsEditable && (
                <Button
                  size="xs"
                  variant="ghost"
                  color={themeColor}
                  leadingIcon={versionRoles.length > 0 ? 'Edit' : 'Add'}
                  onClick={() => {
                    setRolesValue([...versionRoles]);
                    setRolesPanelOpen(true);
                    setRolesError(null);
                  }}
                >
                  {versionRoles.length > 0 ? 'Edit' : 'Add'}
                </Button>
              )}
            </div>
          }
          size="sm"
          bodyClassName="px-0 pb-0"
        >
          {versionRoles.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 px-3 pt-2">
              <TagPanel tags={versionRoles.map((r) => ({ label: r, tone: "green", variant: 'soft' }))} tagLimit={5} />
            </div>
          ) : (
            <p className="px-3 pb-3 pt-2 text-xs italic text-neutral-400 dark:text-neutral-600">No required roles</p>
          )}
        </Section>

        <Section
          title={
            <div className="flex items-center justify-between w-full pr-1 gap-2">
              <span>Required Claims</span>
              {versionIsEditable && (
                <Button
                  size="xs"
                  variant="ghost"
                  color={themeColor}
                  leadingIcon={versionClaims.length > 0 ? 'Edit' : 'Add'}
                  onClick={() => {
                    setClaimsValue([...versionClaims]);
                    setClaimsPanelOpen(true);
                    setClaimsError(null);
                  }}
                >
                  {versionClaims.length > 0 ? 'Edit' : 'Add'}
                </Button>
              )}
            </div>
          }
          size="sm"
          bodyClassName="px-0 pb-0"
        >
          {versionClaims.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 px-3 pb-3 pt-2">
              <TagPanel tags={versionClaims.map((c) => ({ label: c, tone: "info", variant: 'soft' }))} tagLimit={5} />
            </div>
          ) : (
            <p className="px-3 pb-3 pt-2 text-xs italic text-neutral-400 dark:text-neutral-600">No required claims</p>
          )}
        </Section>

        <Section title="Source" size="sm" bodyClassName="space-y-0 px-0 pb-0">
          <InfoRow label="Name" labelSize="sm" value={valueOrDash(manifestSource.title)} hoverable />
          <InfoRow label="Type" labelSize="sm" value={valueOrDash(manifestSource.type)} hoverable />
          <InfoRow label="Endpoint" labelSize="sm" value={valueOrDash(manifestSource.subtitle)} hoverable />
        </Section>
      </div>

      {/* ── InlinePanels ──────────────────────────────────────────────────────── */}

      <InlinePanel
        icon="Edit"
        isOpen={descPanelOpen}
        onClose={() => setDescPanelOpen(false)}
        title="Edit Description"
        anchor="center"
        showBackdrop
        size="sm"
        actions={
          <div className="flex gap-2">
            {descError && <p className="text-xs text-red-500 flex-1">{descError}</p>}
            <Button size="sm" variant="outline" color="rose" onClick={() => setDescPanelOpen(false)}>Cancel</Button>
            <Button size="sm" variant="solid" color={themeColor} onClick={handleSaveDescription} disabled={descSaving}>
              {descSaving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        }
      >
        <div className="p-0">
          <Textarea
            tone={themeColor}
            rows={4}
            placeholder="Enter a description…"
            value={descValue}
            onChange={(e) => setDescValue(e.target.value)}
          />
        </div>
      </InlinePanel>

      <InlinePanel
        icon="Edit"
        isOpen={tagsPanelOpen}
        onClose={() => setTagsPanelOpen(false)}
        title="Edit Tags"
        anchor="center"
        showBackdrop
        size="sm"
        actions={
          <div className="flex gap-2">
            {tagsError && <p className="text-xs text-red-500 flex-1">{tagsError}</p>}
            <Button size="sm" variant="ghost" color="slate" onClick={() => setTagsPanelOpen(false)}>Cancel</Button>
            <Button size="sm" variant="soft" color={themeColor} onClick={handleSaveTags} disabled={tagsSaving}>
              {tagsSaving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        }
      >
        <div className="p-0">
          <TagPicker
            items={[]}
            value={tagsValue}
            onChange={setTagsValue}
            allowCreate
            placeholder="Add a tag…"
            color={themeColor}
            escapeBoundary
          />
        </div>
      </InlinePanel>

      <InlinePanel
        icon="Edit"
        isOpen={rolesPanelOpen}
        onClose={() => setRolesPanelOpen(false)}
        title="Edit Required Roles"
        anchor="center"
        showBackdrop
        size="sm"
        actions={
          <div className="flex gap-2">
            {rolesError && <p className="text-xs text-red-500 flex-1">{rolesError}</p>}
            <Button size="sm" variant="ghost" color="slate" onClick={() => setRolesPanelOpen(false)}>Cancel</Button>
            <Button size="sm" variant="soft" color={themeColor} onClick={handleSaveRoles} disabled={rolesSaving}>
              {rolesSaving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        }
      >
        <div className="p-3">
          <TagPicker
            items={[]}
            value={rolesValue}
            onChange={setRolesValue}
            allowCreate
            placeholder="Add a role…"
            color={themeColor}
            escapeBoundary
          />
        </div>
      </InlinePanel>

      <InlinePanel
        icon="Edit"
        isOpen={claimsPanelOpen}
        onClose={() => setClaimsPanelOpen(false)}
        title="Edit Required Claims"
        anchor="center"
        showBackdrop
        size="sm"
        actions={
          <div className="flex gap-2">
            {claimsError && <p className="text-xs text-red-500 flex-1">{claimsError}</p>}
            <Button size="sm" variant="ghost" color="slate" onClick={() => setClaimsPanelOpen(false)}>Cancel</Button>
            <Button size="sm" variant="soft" color={themeColor} onClick={handleSaveClaims} disabled={claimsSaving}>
              {claimsSaving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        }
      >
        <div className="p-3">
          <TagPicker
            items={availableClaims}
            value={claimsValue}
            onChange={setClaimsValue}
            allowCreate
            placeholder="Add a claim…"
            color={themeColor}
            escapeBoundary
          />
        </div>
      </InlinePanel>

      {/* ── Version action confirmations ──────────────────────────────────── */}

      <ConfirmInlinePanel
        isOpen={confirmTaint}
        title="Taint this version"
        description={`This will mark all images in version "${selectedVersion?.version}" as tainted. Tainted images remain visible but are flagged as problematic.`}
        icon="Warning"
        confirmLabel={taintLoading ? 'Tainting…' : 'Taint'}
        confirmColor="warning"
        isConfirmDisabled={taintLoading}
        onClose={() => setConfirmTaint(false)}
        onConfirm={() => void handleTaint()}
      >
        {versionActionError && (
          <p className="text-xs text-red-500">{versionActionError}</p>
        )}
      </ConfirmInlinePanel>

      <ConfirmInlinePanel
        isOpen={confirmUntaint}
        title="Untaint this version"
        description={`This will remove the tainted flag from all images in version "${selectedVersion?.version}", restoring them to active status.`}
        icon="CheckCircle"
        confirmLabel={untaintLoading ? 'Untainting…' : 'Untaint'}
        confirmColor="success"
        isConfirmDisabled={untaintLoading}
        onClose={() => setConfirmUntaint(false)}
        onConfirm={() => void handleUntaint()}
      >
        {versionActionError && (
          <p className="text-xs text-red-500">{versionActionError}</p>
        )}
      </ConfirmInlinePanel>

      <ConfirmInlinePanel
        isOpen={confirmRevoke}
        title="Revoke this version"
        description={`This will revoke all images in version "${selectedVersion?.version}". Revoked images cannot be downloaded and this action cannot be undone.`}
        icon="Stop"
        confirmLabel={revokeLoading ? 'Revoking…' : 'Revoke'}
        confirmColor="danger"
        isConfirmDisabled={revokeLoading}
        onClose={() => setConfirmRevoke(false)}
        onConfirm={() => void handleRevoke()}
      >
        {versionActionError && (
          <p className="text-xs text-red-500">{versionActionError}</p>
        )}
      </ConfirmInlinePanel>

      <DeleteConfirmInlinePanel
        isOpen={confirmDelete}
        title="Delete this version"
        description={`This will permanently delete version "${selectedVersion?.version}" from this catalog. This action cannot be undone.`}
        icon="Trash"
        confirmValue={selectedVersion?.version ?? ''}
        confirmValueLabel="version"
        isConfirmDisabled={deleteLoading}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => void handleDeleteVersion()}
      />
    </>
  );
};

// ── Versions list (kept for potential reuse) ───────────────────────────────────

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
    <div className="rounded-xl border border-neutral-200/80 bg-linear-to-br from-neutral-100/80 via-white to-white p-3 dark:border-neutral-700/80 dark:from-neutral-800 dark:via-neutral-900 dark:to-neutral-900">
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
