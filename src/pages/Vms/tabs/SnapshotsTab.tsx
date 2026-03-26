import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EmptyState, Snapshot, TimelinePanel } from '@prl/ui-kit';
import type { TimelinePanelItem } from '@prl/ui-kit';
import { devopsService } from '@/services/devops';
import { useSession } from '@/contexts/SessionContext';
import type { VirtualMachine } from '@/interfaces/VirtualMachine';
import type { VMSnapshot } from '@/interfaces/VMSnapshot';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';

// ── Claims constants ──────────────────────────────────────────────────────────

const CLAIMS = {
  create:    ['CREATE_SNAPSHOT_VM_CLAIM',      'CREATE_OWN_VM_SNAPSHOT_CLAIM'],
  delete:    ['DELETE_SNAPSHOT_VM_CLAIM',      'DELETE_OWN_VM_SNAPSHOT_CLAIM'],
  deleteAll: ['DELETE_ALL_SNAPSHOTS_VM_CLAIM', 'DELETE_ALL_OWN_VM_SNAPSHOTS_CLAIM'],
  revert:    ['REVERT_SNAPSHOT_VM_CLAIM',      'REVERT_OWN_VM_SNAPSHOT_CLAIM'],
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
}

export function SnapshotsTab({ vm, hostname }: SnapshotsTabProps) {
  const { hasAnyClaim } = useSession();
  const { themeColor } = useSystemSettings();

  const canCreate    = hasAnyClaim([...CLAIMS.create]);
  const canDelete    = hasAnyClaim([...CLAIMS.delete]);
  const canDeleteAll = hasAnyClaim([...CLAIMS.deleteAll]);
  const canRevert    = hasAnyClaim([...CLAIMS.revert]);

  // ── Snapshot list state ───────────────────────────────────────────────────
  const [snapshots, setSnapshots]     = useState<VMSnapshot[]>([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({});

  // ── Delete-all confirmation ───────────────────────────────────────────────
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);

  // ── Create form ───────────────────────────────────────────────────────────
  const [isCreating, setIsCreating]   = useState(false);
  const [createName, setCreateName]   = useState('');
  const [createDesc, setCreateDesc]   = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const createNameRef = useRef<HTMLInputElement>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchSnapshots = useCallback(async () => {
    if (!vm.ID) return;
    setLoading(true);
    setError(null);
    try {
      const data = await devopsService.snapshots.getSnapshots(hostname, vm.ID, true);
      setSnapshots(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load snapshots');
    } finally {
      setLoading(false);
    }
  }, [hostname, vm.ID]);

  useEffect(() => { void fetchSnapshots(); }, [fetchSnapshots]);

  useEffect(() => {
    if (isCreating) setTimeout(() => createNameRef.current?.focus(), 50);
  }, [isCreating]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCreate = useCallback(async () => {
    if (!createName.trim() || !vm.ID) return;
    setCreateLoading(true);
    setCreateError(null);
    try {
      await devopsService.snapshots.createSnapshot(hostname, vm.ID, {
        snapshot_name: createName.trim(),
        snapshot_description: createDesc.trim() || undefined,
      });
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
    try {
      await devopsService.snapshots.revertSnapshot(hostname, vm.ID, snapshotId);
      await fetchSnapshots();
    } catch (e) {
      console.error('Failed to revert snapshot:', e);
    } finally {
      setActionLoading((prev) => { const next = { ...prev }; delete next[snapshotId]; return next; });
    }
  }, [hostname, vm.ID, fetchSnapshots]);

  const handleDelete = useCallback(async (snapshotId: string, deleteChildren: boolean) => {
    if (!vm.ID) return;
    setActionLoading((prev) => ({ ...prev, [snapshotId]: 'delete' }));
    try {
      await devopsService.snapshots.deleteSnapshot(hostname, vm.ID, snapshotId, {
        delete_children: deleteChildren || undefined,
      });
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
      await devopsService.snapshots.deleteAllSnapshots(hostname, vm.ID);
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
        actions: canRevert ? [{
          label: actionLoading[snap.id] === 'revert' ? 'Reverting…' : 'Revert',
          loading: actionLoading[snap.id] === 'revert',
          disabled: snap.current || isActionBusy,
          onClick: () => void handleRevert(snap.id),
        }] : [],
        overflowActions: !canDelete ? [
          {
            label: 'Delete',
            value: 'delete',
            danger: true,
            disabled: isActionBusy,
            onClick: () => void handleDelete(snap.id, false),
          },
          ...(snap.children?.length ? [{
            label: 'Delete with children',
            value: 'delete-children',
            danger: true,
            disabled: isActionBusy,
            onClick: () => void handleDelete(snap.id, true),
          }] : []),
        ] : [],
      };
    });
  }, [snapshots, actionLoading, canRevert, canDelete, handleRevert, handleDelete]);

  // ── Render ────────────────────────────────────────────────────────────────

  const flatCount = flattenTree(snapshots).length;

  return (
    <div className="flex flex-col gap-3">
      {/* Delete-all toolbar */}
      {canDeleteAll && flatCount > 0 && (
        <div className="flex items-center justify-end px-1">
          {confirmDeleteAll ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Delete all {flatCount} snapshots?
              </span>
              <button
                onClick={() => void handleDeleteAll()}
                disabled={deleteAllLoading}
                className="rounded-md bg-rose-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-rose-600 disabled:opacity-50"
              >
                {deleteAllLoading ? 'Deleting…' : 'Confirm'}
              </button>
              <button
                onClick={() => setConfirmDeleteAll(false)}
                disabled={deleteAllLoading}
                className="rounded-md px-2.5 py-1 text-xs font-medium text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDeleteAll(true)}
              className="rounded-md px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
            >
              Delete all
            </button>
          )}
        </div>
      )}

      {/* Inline create form */}
      {isCreating && (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800/50">
          <p className="mb-2 text-xs font-medium text-neutral-700 dark:text-neutral-300">New snapshot</p>
          <div className="flex flex-col gap-2">
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
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:border-neutral-400 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder-neutral-500"
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
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:border-neutral-400 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder-neutral-500"
            />
            {createError && (
              <p className="text-xs text-rose-600 dark:text-rose-400">{createError}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setIsCreating(false); setCreateName(''); setCreateDesc(''); setCreateError(null); }}
                disabled={createLoading}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleCreate()}
                disabled={!createName.trim() || createLoading}
                className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700 disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
              >
                {createLoading ? 'Taking…' : 'Take snapshot'}
              </button>
            </div>
          </div>
        </div>
      )}

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
        headerAction={!canCreate ? {
          label: isCreating ? 'Cancel' : '+ Snapshot',
          variant: isCreating ? 'outline' : 'solid',
          color: 'neutral',
          onClick: () => { setIsCreating((v) => !v); setCreateError(null); },
        } : undefined}
        items={items}
        loading={loading}
        loaderProps={
          {
            spinnerThickness:'thick'
          }
        }
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
    </div>
  );
}
