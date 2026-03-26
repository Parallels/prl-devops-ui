import React, { useState } from 'react';
import { PlaygroundSection } from '../PlaygroundSection';
import { TimelinePanel, MultiToggle, Toggle } from '../../..';
import type {
  TimelinePanelItem,
  TimelinePanelVariant,
  TimelinePanelPadding,
} from '../../..';

// ── Inline SVG icons used in the demo ─────────────────────────────────────

const CameraIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const HistoryIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 .49-4.5" />
    <polyline points="12 7 12 12 15 14" />
  </svg>
);

const DockerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M7 8h2v2H7zM11 8h2v2h-2zM15 8h2v2h-2zM7 12h2v2H7zM11 12h2v2h-2z" />
  </svg>
);

// ── Snapshot data ──────────────────────────────────────────────────────────

const buildSnapshotItems = (
  onRevert: (id: string) => void,
  onDelete: (id: string) => void,
  onRename: (id: string) => void,
): TimelinePanelItem[] => [
  {
    id: 'snap-1',
    icon: <CameraIcon />,
    title: 'Initial Base Image',
    subtitle: '2024-06-14 10:15:22, 01:29 • 1.2 GB',
    isRoot: true,
    depth: 0,
    actions: [
      { label: 'Revert to', variant: 'ghost', color: 'neutral', onClick: () => onRevert('snap-1') },
      { label: 'Delete', variant: 'outline', color: 'danger', onClick: () => onDelete('snap-1') },
    ],
    overflowActions: [
      { label: 'Comment/Rename', value: 'rename', onClick: () => onRename('snap-1') },
    ],
  },
  {
    id: 'snap-2',
    icon: <DockerIcon />,
    title: 'Pre-Docker Install',
    subtitle: '2024-06-14 10:15:22, 01:22 • 1.2 GB',
    depth: 1,
    actions: [
      { label: 'Revert to', variant: 'ghost', color: 'neutral', onClick: () => onRevert('snap-2') },
      { label: 'Delete', variant: 'outline', color: 'danger', onClick: () => onDelete('snap-2') },
    ],
    overflowActions: [
      { label: 'Comment/Rename', value: 'rename', onClick: () => onRename('snap-2') },
    ],
  },
  {
    id: 'snap-3',
    icon: <HistoryIcon />,
    title: 'Post-Configuration Patch',
    subtitle: '2024-06-14 10:15:22, 03:30 • 1.2 GB',
    depth: 2,
    actions: [
      { label: 'Revert to', variant: 'ghost', color: 'neutral', onClick: () => onRevert('snap-3') },
      { label: 'Delete', variant: 'outline', color: 'danger', onClick: () => onDelete('snap-3') },
    ],
    overflowActions: [
      { label: 'Comment/Rename', value: 'rename', onClick: () => onRename('snap-3') },
    ],
  },
  {
    id: 'snap-4',
    icon: <HistoryIcon />,
    title: 'Post-Configuration Patch',
    subtitle: '2024-06-14 10:15:22, 09:30 • 1.2 GB',
    depth: 2,
    actions: [
      { label: 'Revert to', variant: 'ghost', color: 'neutral', onClick: () => onRevert('snap-4') },
      { label: 'Delete', variant: 'outline', color: 'danger', onClick: () => onDelete('snap-4') },
    ],
    overflowActions: [
      { label: 'Comment/Rename', value: 'rename', onClick: () => onRename('snap-4') },
    ],
  },
  {
    id: 'current',
    title: 'Current State',
    isCurrent: true,
    depth: 0,
    overflowActions: [
      { label: 'Comment/Rename', value: 'rename', onClick: () => onRename('current') },
    ],
  },
];

const buildDeployItems = (): TimelinePanelItem[] => [
  {
    id: 'dep-1',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: 'Initial deploy',
    subtitle: '2024-05-01 09:00 • v1.0.0',
    isRoot: true,
    depth: 0,
    actions: [
      { label: 'Rollback', variant: 'outline', color: 'warning', onClick: () => {} },
    ],
    overflowActions: [
      { label: 'View logs', value: 'logs' },
      { label: 'Delete', value: 'delete', danger: true },
    ],
  },
  {
    id: 'dep-2',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: 'Hotfix deploy',
    subtitle: '2024-05-03 14:22 • v1.0.1',
    depth: 1,
    actions: [
      { label: 'Rollback', variant: 'outline', color: 'warning', onClick: () => {} },
    ],
    overflowActions: [
      { label: 'View logs', value: 'logs' },
      { label: 'Delete', value: 'delete', danger: true },
    ],
  },
  {
    id: 'dep-3',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: 'Feature release',
    subtitle: '2024-05-10 11:05 • v1.1.0',
    depth: 1,
    actions: [
      { label: 'Rollback', variant: 'outline', color: 'warning', onClick: () => {} },
    ],
    overflowActions: [
      { label: 'View logs', value: 'logs' },
    ],
  },
  {
    id: 'dep-current',
    title: 'Live',
    isCurrent: true,
    depth: 0,
    overflowActions: [
      { label: 'View logs', value: 'logs' },
    ],
  },
];

// ── Demo component ─────────────────────────────────────────────────────────

export const TimelinePanelDemo: React.FC = () => {
  const [variant, setVariant] = useState<TimelinePanelVariant>('elevated');
  const [padding, setPadding] = useState<TimelinePanelPadding>('sm');
  const [loading, setLoading] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [lastAction, setLastAction] = useState<string>('');

  const handleRevert = (id: string) => setLastAction(`Revert to: ${id}`);
  const handleDelete = (id: string) => setLastAction(`Delete: ${id}`);
  const handleRename = (id: string) => setLastAction(`Comment/Rename: ${id}`);

  const snapshotItems = buildSnapshotItems(handleRevert, handleDelete, handleRename);

  return (
    <PlaygroundSection
      title="Timeline Panel"
      label="[TimelinePanel]"
      description="Generic timeline/history panel with icons, inline actions, and overflow menus. Designed for snapshots, deployment history, changelogs, and any ordered event list."
      controls={
        <div className="space-y-4">
          <div className="space-y-2">
            <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-200">Variant</span>
            <MultiToggle
              fullWidth
              size="sm"
              options={[
                { label: 'Elevated', value: 'elevated' },
                { label: 'Outlined', value: 'outlined' },
                { label: 'Subtle', value: 'subtle' },
                { label: 'Simple', value: 'simple' },
              ]}
              value={variant}
              onChange={(v) => setVariant(v as TimelinePanelVariant)}
            />
          </div>
          <div className="space-y-2">
            <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-200">Padding</span>
            <MultiToggle
              fullWidth
              size="sm"
              options={[
                { label: 'xs', value: 'xs' },
                { label: 'sm', value: 'sm' },
                { label: 'md', value: 'md' },
              ]}
              value={padding}
              onChange={(v) => setPadding(v as TimelinePanelPadding)}
            />
          </div>
          <div className="flex gap-6">
            <Toggle label="Loading" checked={loading} onChange={(e) => setLoading(e.target.checked)} />
            <Toggle label="Empty" checked={empty} onChange={(e) => setEmpty(e.target.checked)} />
          </div>
          {lastAction && (
            <div className="rounded-md bg-sky-50 px-3 py-2 text-xs text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
              Action: <strong>{lastAction}</strong>
            </div>
          )}
        </div>
      }
      preview={
        <div className="flex flex-col gap-6">
          {/* Snapshot example (matches the mockup) */}
          <TimelinePanel
            title="Snapshots"
            headerAction={{
              label: 'Create Snapshot',
              color: 'danger',
              variant: 'solid',
              onClick: () => setLastAction('Create Snapshot clicked'),
            }}
            items={empty ? [] : snapshotItems}
            variant={variant}
            padding={padding}
            loading={loading}
            emptyState={
              <div className="py-4 text-center text-sm text-neutral-400">No snapshots yet</div>
            }
          />

          {/* Deployment history example */}
          <TimelinePanel
            title="Deployment History"
            items={empty ? [] : buildDeployItems()}
            variant={variant}
            padding={padding}
            loading={loading}
            emptyState={
              <div className="py-4 text-center text-sm text-neutral-400">No deployments yet</div>
            }
          />
        </div>
      }
    />
  );
};
