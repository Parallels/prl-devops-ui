import React, { useState } from 'react';
import { PlaygroundSection } from '../PlaygroundSection';
import { AccessMatrix, MultiToggle, Toggle } from '../../..';
import type { AccessMatrixPermission, TableVariant, PanelTone } from '../../..';
import { tableVariantOptions, tableToneOptions } from '../constants';

const SAMPLE_PERMISSIONS: AccessMatrixPermission[] = [
  // Administrators — full access
  { group: 'Administrators', resource: 'VMs', action: 'View', enabled: true },
  { group: 'Administrators', resource: 'VMs', action: 'Create', enabled: true },
  { group: 'Administrators', resource: 'VMs', action: 'Edit', enabled: true },
  { group: 'Administrators', resource: 'VMs', action: 'Delete', enabled: true },
  { group: 'Administrators', resource: 'Users', action: 'View', enabled: true },
  { group: 'Administrators', resource: 'Users', action: 'Create', enabled: true },
  { group: 'Administrators', resource: 'Users', action: 'Edit', enabled: true },
  { group: 'Administrators', resource: 'Users', action: 'Delete', enabled: true },
  { group: 'Administrators', resource: 'Logs', action: 'View', enabled: true },
  { group: 'Administrators', resource: 'Logs', action: 'Export', enabled: true },

  // Power Users — manage VMs, view users, view logs
  { group: 'Power Users', resource: 'VMs', action: 'View', enabled: true },
  { group: 'Power Users', resource: 'VMs', action: 'Create', enabled: true },
  { group: 'Power Users', resource: 'VMs', action: 'Edit', enabled: true },
  { group: 'Power Users', resource: 'VMs', action: 'Delete', enabled: false },
  { group: 'Power Users', resource: 'Users', action: 'View', enabled: true },
  { group: 'Power Users', resource: 'Users', action: 'Create', enabled: false },
  { group: 'Power Users', resource: 'Users', action: 'Edit', enabled: false },
  { group: 'Power Users', resource: 'Users', action: 'Delete', enabled: false },
  { group: 'Power Users', resource: 'Logs', action: 'View', enabled: true },
  { group: 'Power Users', resource: 'Logs', action: 'Export', enabled: true },

  // Developers — view VMs, no user management
  { group: 'Developers', resource: 'VMs', action: 'View', enabled: true },
  { group: 'Developers', resource: 'VMs', action: 'Create', enabled: false },
  { group: 'Developers', resource: 'VMs', action: 'Edit', enabled: true },
  { group: 'Developers', resource: 'VMs', action: 'Delete', enabled: false },
  { group: 'Developers', resource: 'Users', action: 'View', enabled: false },
  { group: 'Developers', resource: 'Users', action: 'Create', enabled: false },
  { group: 'Developers', resource: 'Users', action: 'Edit', enabled: false },
  { group: 'Developers', resource: 'Users', action: 'Delete', enabled: false },
  { group: 'Developers', resource: 'Logs', action: 'View', enabled: true },
  { group: 'Developers', resource: 'Logs', action: 'Export', enabled: false },

  // Read Only — view everything, change nothing
  { group: 'Read Only', resource: 'VMs', action: 'View', enabled: true },
  { group: 'Read Only', resource: 'VMs', action: 'Create', enabled: false },
  { group: 'Read Only', resource: 'VMs', action: 'Edit', enabled: false },
  { group: 'Read Only', resource: 'VMs', action: 'Delete', enabled: false },
  { group: 'Read Only', resource: 'Users', action: 'View', enabled: true },
  { group: 'Read Only', resource: 'Users', action: 'Create', enabled: false },
  { group: 'Read Only', resource: 'Users', action: 'Edit', enabled: false },
  { group: 'Read Only', resource: 'Users', action: 'Delete', enabled: false },
  { group: 'Read Only', resource: 'Logs', action: 'View', enabled: true },
  { group: 'Read Only', resource: 'Logs', action: 'Export', enabled: false },

  // Support — view VMs and logs only
  { group: 'Support', resource: 'VMs', action: 'View', enabled: true },
  { group: 'Support', resource: 'VMs', action: 'Create', enabled: false },
  { group: 'Support', resource: 'VMs', action: 'Edit', enabled: false },
  { group: 'Support', resource: 'VMs', action: 'Delete', enabled: false },
  { group: 'Support', resource: 'Users', action: 'View', enabled: false },
  { group: 'Support', resource: 'Users', action: 'Create', enabled: false },
  { group: 'Support', resource: 'Users', action: 'Edit', enabled: false },
  { group: 'Support', resource: 'Users', action: 'Delete', enabled: false },
  { group: 'Support', resource: 'Logs', action: 'View', enabled: true },
  { group: 'Support', resource: 'Logs', action: 'Export', enabled: false },

  // Auditors — logs only, full access
  { group: 'Auditors', resource: 'VMs', action: 'View', enabled: false },
  { group: 'Auditors', resource: 'VMs', action: 'Create', enabled: false },
  { group: 'Auditors', resource: 'VMs', action: 'Edit', enabled: false },
  { group: 'Auditors', resource: 'VMs', action: 'Delete', enabled: false },
  { group: 'Auditors', resource: 'Users', action: 'View', enabled: false },
  { group: 'Auditors', resource: 'Users', action: 'Create', enabled: false },
  { group: 'Auditors', resource: 'Users', action: 'Edit', enabled: false },
  { group: 'Auditors', resource: 'Users', action: 'Delete', enabled: false },
  { group: 'Auditors', resource: 'Logs', action: 'View', enabled: true },
  { group: 'Auditors', resource: 'Logs', action: 'Export', enabled: true },

  // Guests — no permissions
  { group: 'Guests', resource: 'VMs', action: 'View', enabled: false },
  { group: 'Guests', resource: 'VMs', action: 'Create', enabled: false },
  { group: 'Guests', resource: 'VMs', action: 'Edit', enabled: false },
  { group: 'Guests', resource: 'VMs', action: 'Delete', enabled: false },
  { group: 'Guests', resource: 'Users', action: 'View', enabled: false },
  { group: 'Guests', resource: 'Users', action: 'Create', enabled: false },
  { group: 'Guests', resource: 'Users', action: 'Edit', enabled: false },
  { group: 'Guests', resource: 'Users', action: 'Delete', enabled: false },
  { group: 'Guests', resource: 'Logs', action: 'View', enabled: false },
  { group: 'Guests', resource: 'Logs', action: 'Export', enabled: false },
];

export const AccessMatrixDemo: React.FC = () => {
  const [variant, setVariant] = useState<TableVariant>('default');
  const [tone, setTone] = useState<PanelTone>('neutral');
  const [limit, setLimit] = useState<number>(4);
  const [striped, setStriped] = useState(true);

  return (
    <PlaygroundSection
      title="Access Matrix"
      label="[AccessMatrix]"
      description="Read-only permission matrix showing group access across resources and actions."
      controls={
        <div className="space-y-4 text-sm">
          <label className="flex flex-col gap-2">
            <span>Variant</span>
            <MultiToggle fullWidth options={tableVariantOptions} value={variant} size="sm" onChange={(value) => setVariant(value as TableVariant)} />
          </label>
          <label className="flex flex-col gap-2">
            <span>Tone</span>
            <MultiToggle fullWidth options={tableToneOptions} value={tone} size="sm" onChange={(value) => setTone(value as PanelTone)} />
          </label>
          <label className="flex flex-col gap-2">
            <span>Row limit (before expand)</span>
            <MultiToggle
              fullWidth
              options={[
                { label: '3', value: '3' },
                { label: '4', value: '4' },
                { label: '5', value: '5' },
              ]}
              value={String(limit)}
              size="sm"
              onChange={(value) => setLimit(Number(value))}
            />
          </label>
          <label className="flex items-center justify-between">
            <span>Striped rows</span>
            <Toggle size="sm" checked={striped} onChange={(e) => setStriped(e.target.checked)} />
          </label>
        </div>
      }
      preview={<AccessMatrix permissions={SAMPLE_PERMISSIONS} limit={limit} variant={variant} tone={tone} striped={striped} />}
    />
  );
};
