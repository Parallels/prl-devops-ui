import  { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EmptyState, Snapshot, TimelinePanel, InlinePanel, Button, IconButton, ConfirmInlinePanel, DeleteConfirmInlinePanel } from '@prl/ui-kit';
import type { TimelinePanelItem } from '@prl/ui-kit';
import { devopsService } from '@/services/devops';
import { useSession } from '@/contexts/SessionContext';
import type { VirtualMachine } from '@/interfaces/VirtualMachine';
import type { VMSnapshot } from '@/interfaces/VMSnapshot';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';

// ── Claims constants ──────────────────────────────────────────────────────────

const CLAIMS = {
  create:    ['CREATE_SNAPSHOT_VM',      'CREATE_OWN_VM_SNAPSHOT'],
  delete:    ['DELETE_SNAPSHOT_VM',      'DELETE_OWN_VM_SNAPSHOT'],
  deleteAll: ['DELETE_ALL_SNAPSHOTS_VM', 'DELETE_ALL_OWN_VM_SNAPSHOTS'],
  revert:    ['REVERT_SNAPSHOT_VM',      'REVERT_OWN_VM_SNAPSHOT'],
} as const;

// ── Tree → flat list ──────────────────────────────────────────────────────────

interface FlatSnapshot extends VMSnapshot {
  depth: number;
}

function flattenTree(snapshots: VMSnapshot[], depth = 0): FlatSnapshot[] {
  const result: FlatSnapshot[] = [];
  for (const snap of snapshots) {
    result.push({ ...snap, depth });
    if (snap.children?.length) {
      result.push(...flattenTree(snap.children, depth + 1));
    }
  }
  return result;
}

// ── Date formatter ────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

// ── SnapshotsTab ──────────────────────────────────────────────────────────────

export interface SnapshotsTabProps {
  vm: VirtualMachine;
  hostname: string;
  isOrchestrator?: boolean;
}

export function SnapshotsTab({ vm, hostname, isOrchestrator = false }: SnapshotsTabProps) {
  const { hasAnyClaim } = useSession();
  const { themeColor } = useSystemSettings();

  const canDelete = hasAnyClaim([...CLAIMS.delete]);
  const canDeleteAll = hasAnyClaim([...CLAIMS.deleteAll]);
  const canRevert = hasAnyClaim([...CLAIMS.revert]);

  // ── Snapshot list state ───────────────────────────────────────────────────
  const [snapshots, setSnapshots] = useState<VMSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({});

  // ── Create form ───────────────────────────────────────────────────────────
  const [isCreating, setIsCreating] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const createNameRef = useRef<HTMLInputElement>(null);

  // ── Delete confirmation state ─────────────────────────────────────────────
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string; withChildren: boolean } | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchSnapshots = useCallback(async () => {
    if (!vm.ID) return;
    setLoading(true);
    setError(null);
    try {
      const data = await devopsService.snapshots.getSnapshots(hostname, vm.ID, true, isOrchestrator);
      setSnapshots(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load snapshots');
    } finally {
      setLoading(false);
    }
  }, [hostname, vm.ID, isOrchestrator]);

  useEffect(() => { void fetchSnapshots(); }, [fetchSnapshots]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCreate = useCallback(async () => {
    if (!createName.trim() || !vm.ID) return;
    setCreateLoading(true);
    setCreateError(null);
    try {
      await devopsService.snapshots.createSnapshot(hostname, vm.ID, {
        snapshot_name: createName.trim(),
        snapshot_description: createDesc.trim() || undefined,
      }, isOrchestrator);
      setIsCreating(false);
      setCreateName('');
      setCreateDesc('');
      await fetchSnapshots();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Failed to create snapshot');
    } finally {
      setCreateLoading(false);
    }
  }, [hostname, vm.ID, createName, createDesc, fetchSnapshots]);

  const handleRevert = useCallback(async (snapshotId: string) => {
    if (!vm.ID) return;
    setActionLoading((prev) => ({ ...prev, [snapshotId]: 'revert' }));
    setIsReverting(true);
    setLoading(true);
    try {
      await devopsService.snapshots.revertSnapshot(hostname, vm.ID, snapshotId, {}, isOrchestrator);
      await fetchSnapshots();
    } catch (e) {
      console.error('Failed to revert snapshot:', e);
    } finally {
      setActionLoading((prev) => { const next = { ...prev }; delete next[snapshotId]; return next; });
      setIsReverting(false);
      setLoading(false);
    }
  }, [hostname, vm.ID, fetchSnapshots]);

  const handleDelete = useCallback(async (snapshotId: string, deleteChildren: boolean) => {
    if (!vm.ID) return;
    setActionLoading((prev) => ({ ...prev, [snapshotId]: 'delete' }));
    try {
      await devopsService.snapshots.deleteSnapshot(hostname, vm.ID, snapshotId, {
        delete_children: deleteChildren || undefined,
      }, isOrchestrator);
      setPendingDelete(null);
      await fetchSnapshots();
    } catch (e) {
      console.error('Failed to delete snapshot:', e);
    } finally {
      setActionLoading((prev) => { const next = { ...prev }; delete next[snapshotId]; return next; });
    }
  }, [hostname, vm.ID, fetchSnapshots]);

  const handleDeleteAll = useCallback(async () => {
    if (!vm.ID) return;
    setDeleteAllLoading(true);
    try {
      await devopsService.snapshots.deleteAllSnapshots(hostname, vm.ID, isOrchestrator);
      setConfirmDeleteAll(false);
      await fetchSnapshots();
    } catch (e) {
      console.error('Failed to delete all snapshots:', e);
    } finally {
      setDeleteAllLoading(false);
    }
  }, [hostname, vm.ID, fetchSnapshots]);

  // ── Build TimelinePanelItems ──────────────────────────────────────────────

  const items = useMemo<TimelinePanelItem[]>(() => {
    const flat = flattenTree(snapshots);
    return flat.map((snap) => {
      const isActionBusy = !!actionLoading[snap.id];

      const title = snap.current ? (
        <span className="flex items-center gap-2">
          {snap.name}
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
            Current
          </span>
        </span>
      ) : snap.name;

      const subtitle = [fmtDate(snap.date), snap.state].filter(Boolean).join(' · ');

      return {
        id: snap.id,
        isRoot: snap.depth === 0 && snap.parent === '',
        isCurrent: snap.current === true,
        title,
        icon: <Snapshot />,
        iconBackground: true,
        subtitle: subtitle || undefined,
        depth: snap.depth,
        actions: canRevert && !snap.current ? (
          <IconButton
            variant="ghost"
            color={themeColor}
            size="sm"
            icon="Revert"
            loading={actionLoading[snap.id] === 'revert'}
            disabled={snap.current || isActionBusy || isReverting}
            onClick={() => void handleRevert(snap.id)}
          />
        ) : undefined,
        overflowActions: canDelete ? [
          {
            label: 'Delete',
            value: 'delete',
            danger: true,
            icon: 'Trash',
            disabled: isActionBusy,
            onClick: () => setPendingDelete({ id: snap.id, name: snap.name, withChildren: false }),
          },
          ...(snap.children?.length ? [{
            label: 'Delete with children',
            value: 'delete-children',
            danger: true,
            disabled: isActionBusy,
            icon: 'Trash',
            onClick: () => setPendingDelete({ id: snap.id, name: snap.name, withChildren: true }),
          }] : []),
        ] : [],
      };
    });
  }, [snapshots, actionLoading, canRevert, canDelete, handleRevert, themeColor, isReverting]);

  // ── Render ────────────────────────────────────────────────────────────────

  const flatCount = flattenTree(snapshots).length;
  const loadingTitle = (): string | null => {
    if (isReverting) return 'Reverting snapshot...';
    return null;
  };

  return (
    <div className="relative flex flex-col gap-3 h-full">
      {/* Error banner */}
      {error && (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
          {error}
        </p>
      )}

      {/* Timeline */}
      <TimelinePanel
        title="Snapshots"
        tone={themeColor}
        headerAction={(
          <div className="flex shrink-0 gap-2">
            <Button variant='solid' color={themeColor} size='xs'
              onClick={() => { setIsCreating(true); setCreateError(null); }}>
              Take Snapshot
            </Button>
            {canDeleteAll && flatCount > 0 && (
              <Button variant='outline' color="rose" size='xs'
                onClick={() => setConfirmDeleteAll(true)}>
                Delete All
              </Button>
            )}
          </div>
        )}
        items={items}
        loading={loading}
        loaderProps={{ spinnerThickness: 'thick', label: loadingTitle() }}
        showTrunkDots
        emptyState={
          <EmptyState
            icon="Snapshot"
            title="No Snapshots Found"
            disableBorder
            fullWidth
            fullHeight
          />
        }
      />

      {/* Inline create form */}
      <InlinePanel
        isOpen={isCreating}
        anchor="center"
        showBackdrop
        title="New Snapshot"
        icon="Snapshot"
        size='sm'
        initialFocusRef={createNameRef}
        loading={createLoading}
        loadingLabel="Taking snapshot…"
        onClose={() => { setIsCreating(false); setCreateName(''); setCreateDesc(''); setCreateError(null); }}
        actions={
          <>
            <Button variant="outline" color="slate" size="sm" disabled={createLoading}
              onClick={() => { setIsCreating(false); setCreateName(''); setCreateDesc(''); setCreateError(null); }}>
              Cancel
            </Button>
            <Button variant="solid" color={themeColor} size="sm"
              disabled={!createName.trim() || createLoading} loading={createLoading}
              onClick={() => void handleCreate()}>
              Take snapshot
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <input
            ref={createNameRef}
            type="text"
            placeholder="Snapshot name (required)"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleCreate();
              if (e.key === 'Escape') { setIsCreating(false); setCreateName(''); setCreateDesc(''); }
            }}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-neutral-400 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder-neutral-500"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={createDesc}
            onChange={(e) => setCreateDesc(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleCreate();
              if (e.key === 'Escape') { setIsCreating(false); setCreateName(''); setCreateDesc(''); }
            }}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-neutral-400 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder-neutral-500"
          />
          {createError && (
            <p className="text-sm text-rose-600 dark:text-rose-400">{createError}</p>
          )}
        </div>
      </InlinePanel>

      {/* Delete single snapshot confirmation */}
      <DeleteConfirmInlinePanel
        isOpen={!!pendingDelete}
        title={pendingDelete?.withChildren ? 'Delete snapshot and children' : 'Delete snapshot'}
        description={
          pendingDelete?.withChildren
            ? 'This will permanently delete this snapshot and all of its child snapshots.'
            : 'This will permanently delete this snapshot.'
        }
        icon="Trash"
        confirmValue={pendingDelete?.name ?? ''}
        confirmValueLabel="snapshot name"
        onClose={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && void handleDelete(pendingDelete.id, pendingDelete.withChildren)}
        isConfirmDisabled={!!actionLoading[pendingDelete?.id ?? '']}
      />

      {/* Delete all confirmation */}
      <ConfirmInlinePanel
        isOpen={confirmDeleteAll}
        title="Delete all snapshots"
        description={`This will permanently delete all ${flatCount} snapshot${flatCount !== 1 ? 's' : ''} for this VM. This action cannot be undone.`}
        icon="Trash"
        confirmLabel={deleteAllLoading ? 'Deleting…' : 'Delete all'}
        confirmColor="danger"
        isConfirmDisabled={deleteAllLoading}
        onClose={() => setConfirmDeleteAll(false)}
        onConfirm={() => void handleDeleteAll()}
      >
        {null}
      </ConfirmInlinePanel>
    </div>
  );
}
