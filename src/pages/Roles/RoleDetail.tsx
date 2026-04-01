import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, FormField, FormLayout, Panel, Section, TagPanel, TagPicker } from '@prl/ui-kit';
import { devopsService } from '@/services/devops';
import { DevOpsClaim, DevOpsRole } from '@/interfaces/devops';
import { useSession } from '@/contexts/SessionContext';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';

export interface RoleDetailProps {
  role: DevOpsRole;
  hostname: string;
  availableClaims?: DevOpsClaim[];
  onClaimsChange?: (updated: DevOpsRole) => void;
}

export const RoleDetail: React.FC<RoleDetailProps> = ({ role, hostname, availableClaims = [], onClaimsChange }) => {
  const { hasClaim } = useSession();
  const { themeColor } = useSystemSettings();
  const canUpdate = hasClaim('UPDATE_ROLE');

  const assignedUsers = role.users ?? [];
  const assignedClaims = role.claims ?? [];

  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const claimItems = useMemo(() => availableClaims.map((c) => ({ id: c.id || c.name, label: c.name })), [availableClaims]);

  const assignedClaimIds = useMemo(() => assignedClaims.map((c) => c.id || c.name), [assignedClaims]);

  // Local pending state — tracks unsaved changes
  const [pendingClaimIds, setPendingClaimIds] = useState<string[]>(assignedClaimIds);

  // Keep pending in sync when the role prop changes (e.g. parent refresh)
  useEffect(() => {
    setPendingClaimIds(assignedClaimIds);
  }, [role.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDirty = useMemo(() => {
    if (pendingClaimIds.length !== assignedClaimIds.length) return true;
    const base = new Set(assignedClaimIds);
    return pendingClaimIds.some((id) => !base.has(id));
  }, [pendingClaimIds, assignedClaimIds]);

  const handleDiscard = useCallback(() => {
    setPendingClaimIds(assignedClaimIds);
    setSaveError(null);
  }, [assignedClaimIds]);

  const handleSave = useCallback(async () => {
    const added = pendingClaimIds.filter((id) => !assignedClaimIds.includes(id));
    const removed = assignedClaimIds.filter((id) => !pendingClaimIds.includes(id));
    if (added.length === 0 && removed.length === 0) return;

    setBusy(true);
    setSaveError(null);
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
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setBusy(false);
    }
  }, [pendingClaimIds, assignedClaimIds, assignedClaims, availableClaims, hostname, role, onClaimsChange]);

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
            value={pendingClaimIds}
            readOnly={role.internal}
            onChange={setPendingClaimIds}
            disabled={!canUpdate || busy}
            placeholder="Search and add claims…"
            emptyMessage="No claims available"
            highlightNew
          />
          {isDirty && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800/50">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">You have unsaved claim changes.</span>
              {saveError && (
                <span className="text-xs text-rose-600 dark:text-rose-400">{saveError}</span>
              )}
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="soft" color="red" size="sm" disabled={busy} onClick={handleDiscard}>
                  Discard
                </Button>
                <Button variant="solid" color="emerald" size="sm" loading={busy} onClick={() => void handleSave()}>
                  Save
                </Button>
              </div>
            </div>
          )}
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
