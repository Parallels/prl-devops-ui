import React, { useCallback, useMemo, useState } from 'react';
import { FormField, FormLayout, Panel, Pill, Section, TagPanel, TagPicker } from '@prl/ui-kit';
import { devopsService } from '@/services/devops';
import { ClaimResponse, RoleResponse } from '@/interfaces/devops';
import { useSession } from '@/contexts/SessionContext';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';

export interface RoleDetailProps {
  role: RoleResponse;
  hostname: string;
  availableClaims?: ClaimResponse[];
  onClaimsChange?: (updated: RoleResponse) => void;
}

export const RoleDetail: React.FC<RoleDetailProps> = ({ role, hostname, availableClaims = [], onClaimsChange }) => {
  const { hasClaim } = useSession();
  const { themeColor } = useSystemSettings();
  const canUpdate = hasClaim('UPDATE_ROLE');

  const assignedUsers = role.users ?? [];
  const assignedClaims = role.claims ?? [];

  const [busy, setBusy] = useState(false);

  const claimItems = useMemo(() => availableClaims.map((c) => ({ id: c.id || c.name, label: c.name })), [availableClaims]);

  const assignedClaimIds = useMemo(() => assignedClaims.map((c) => c.id || c.name), [assignedClaims]);

  // TagPicker onChange fires with the full new set — diff to find what changed
  const handleClaimsChange = useCallback(
    async (newIds: string[]) => {
      const added = newIds.filter((id) => !assignedClaimIds.includes(id));
      const removed = assignedClaimIds.filter((id) => !newIds.includes(id));

      if (added.length === 0 && removed.length === 0) return;
      setBusy(true);
      try {
        let updatedClaims = [...assignedClaims];

        for (const id of added) {
          const found = availableClaims.find((c) => c.id === id || c.name === id);
          if (!found) continue;
          const result = await devopsService.roles.addRoleClaim(hostname, role.id, { name: found.name });
          updatedClaims = [...updatedClaims, result];
        }

        for (const id of removed) {
          await devopsService.roles.removeRoleClaim(hostname, role.id, id);
          updatedClaims = updatedClaims.filter((c) => c.id !== id && c.name !== id);
        }

        onClaimsChange?.({ ...role, claims: updatedClaims });
      } catch (err) {
        console.error('Failed to update role claims:', err);
      } finally {
        setBusy(false);
      }
    },
    [assignedClaims, assignedClaimIds, availableClaims, hostname, role, onClaimsChange],
  );

  return (
    <div className="p-6 space-y-6">
      {/* Profile */}
      <Panel variant="glass" backgroundColor="white" padding="xs">
        <Section title="Profile" noPadding>
          <FormLayout columns={2}>
            <FormField label="Name">
              <p className="text-sm text-gray-700 dark:text-gray-300">{role.name ?? '—'}</p>
            </FormField>
            <FormField label="Description">
              <p className="text-sm text-gray-700 dark:text-gray-300">{role.description || '—'}</p>
            </FormField>
          </FormLayout>
        </Section>
      </Panel>

      {/* Claims */}
      <Panel variant="glass" backgroundColor="white" padding="xs">
        <Section title="Claims" noPadding />
        <div className="space-y-3">
          <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2">
            Changes to role claims apply when affected users next log in.
          </p>
          <TagPicker
            key={`claims-${role.id}`}
            color={themeColor}
            items={claimItems}
            value={assignedClaimIds}
            onChange={(newIds) => void handleClaimsChange(newIds)}
            disabled={!canUpdate || busy}
            placeholder="Search and add claims…"
            emptyMessage="No claims available"
            highlightNew
          />
        </div>
      </Panel>

      {/* Assigned Users */}
      <Panel variant="glass" backgroundColor="white" padding="xs">
        <Section title="Assigned Users" noPadding>
          <div className="pt-3">
            {assignedUsers.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">No users assigned to this role.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <TagPanel tags={assignedUsers.map((u) => ({ label: u.name ?? u.username ?? u.email ?? u.id ?? '', tone: themeColor, variant: 'soft' }))} tagLimit={5} />
              </div>
            )}
          </div>
        </Section>
      </Panel>
    </div>
  );
};

RoleDetail.displayName = 'RoleDetail';
export default RoleDetail;
