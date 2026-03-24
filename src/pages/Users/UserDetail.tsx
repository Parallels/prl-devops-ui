import React, { useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { Combobox, FormField, FormLayout, IconButton, Input, Panel, Pill, Section, TagPicker, Toggle } from '@prl/ui-kit';
import { devopsService } from '@/services/devops';
import { DevOpsUser } from '@/interfaces/devops';
import { useSession } from '@/contexts/SessionContext';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';

export interface UserDetailRef {
  save: () => Promise<void>;
  reset: () => void;
}

export interface UserDetailProps {
  user: DevOpsUser;
  availableRoles?: string[];
  availableClaims?: string[];
  onSave: (updated: DevOpsUser) => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export const UserDetail = React.forwardRef<UserDetailRef, UserDetailProps>(({ user, availableRoles = [], availableClaims = [], onSave, onDirtyChange }, ref) => {
  const { session } = useSession();
  const { themeColor } = useSystemSettings();
  const hostname = session?.hostname ?? '';

  // Profile fields
  const [name, setName] = useState(user.name ?? '');
  const [email, setEmail] = useState(user.email ?? '');
  const [password, setPassword] = useState('');

  // Claims local state — batched until save
  const [localClaims, setLocalClaims] = useState<string[]>(user.claims ?? []);

  // Combobox picker values + remount keys (force-clear internal filter state after selection)
  const [rolePickerValue, setRolePickerValue] = useState('');
  const [claimPickerValue, setClaimPickerValue] = useState('');
  const [roleComboboxKey, setRoleComboboxKey] = useState(0);
  const [claimComboboxKey, setClaimComboboxKey] = useState(0);
  const [canUpdate, setCanUpdate] = useState(false);
  const [isSuperUser, setIsSuperUser] = useState(false);
  const { hasClaim, hasRole } = useSession();

  const [saving, setSaving] = useState(false);

  // Reset all form state when the selected user changes
  useEffect(() => {
    setName(user.name ?? '');
    setEmail(user.email ?? '');
    setPassword('');
    setLocalClaims(user.claims ?? []);
    setRolePickerValue('');
    setClaimPickerValue('');
    setRoleComboboxKey((k) => k + 1);
    setClaimComboboxKey((k) => k + 1);
    setCanUpdate(hasClaim('UPDATE_USER'));
    setIsSuperUser(hasRole('SUPER_USER'));
  }, [user.id]);

  // Dirty tracking
  const isDirty = useMemo(() => {
    const profileDirty = name !== (user.name ?? '') || email !== (user.email ?? '') || password !== '';
    const originalClaims = user.claims ?? [];
    const claimsDirty = localClaims.length !== originalClaims.length || localClaims.some((c) => !originalClaims.includes(c));
    return profileDirty || claimsDirty;
  }, [name, email, password, user.name, user.email, localClaims, user.claims]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (saving || !user.id) return;
    setSaving(true);
    try {
      const request: { name?: string; email?: string; password?: string } = { name, email };
      if (password) request.password = password;
      const updated = await devopsService.users.updateUser(hostname, user.id, request);

      // Sync claim changes (batched)
      const originalClaims = user.claims ?? [];
      const toAdd = localClaims.filter((c) => !originalClaims.includes(c));
      const toRemove = originalClaims.filter((c) => !localClaims.includes(c));
      for (const claim of toAdd) {
        await devopsService.users.addUserClaim(hostname, user.id, claim);
      }
      for (const claim of toRemove) {
        await devopsService.users.removeUserClaim(hostname, user.id, claim);
      }

      setPassword('');
      onSave({ ...updated, claims: localClaims });
    } finally {
      setSaving(false);
    }
  }, [saving, hostname, name, email, password, user.id, user.claims, localClaims, onSave]);

  // ── Reset ─────────────────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    setName(user.name ?? '');
    setEmail(user.email ?? '');
    setPassword('');
    setLocalClaims(user.claims ?? []);
    setRolePickerValue('');
    setClaimPickerValue('');
    setRoleComboboxKey((k) => k + 1);
    setClaimComboboxKey((k) => k + 1);
  }, [user.name, user.email, user.claims]);

  useImperativeHandle(ref, () => ({ save: handleSave, reset: handleReset }), [handleSave, handleReset]);

  // ── Roles (immediate) ─────────────────────────────────────────────────────

  const unassignedRoles = useMemo(() => availableRoles.filter((r) => !(user.roles ?? []).includes(r)), [availableRoles, user.roles]);

  const handleRolePickerChange = useCallback(
    (value: string) => {
      setRolePickerValue(value);
      if (!value || !unassignedRoles.includes(value)) return;
      setRolePickerValue('');
      setRoleComboboxKey((k) => k + 1);
      if (!user.id) return;
      devopsService.users
        .addUserRole(hostname, user.id, value)
        .then(() => onSave({ ...user, roles: [...(user.roles ?? []), value] }))
        .catch((err) => console.error('Failed to add role:', err));
    },
    [hostname, user, unassignedRoles, onSave],
  );

  const handleRemoveRole = useCallback(
    (roleName: string) => {
      if (!user.id) return;
      devopsService.users
        .removeUserRole(hostname, user.id, roleName)
        .then(() => onSave({ ...user, roles: (user.roles ?? []).filter((r) => r !== roleName) }))
        .catch((err) => console.error('Failed to remove role:', err));
    },
    [hostname, user, onSave],
  );

  // ── Claims (batched until save) ────────────────────────────────────────────

  const unassignedClaims = useMemo(() => availableClaims.filter((c) => !localClaims.includes(c)), [availableClaims, localClaims]);

  const handleClaimPickerChange = useCallback(
    (value: string) => {
      setClaimPickerValue(value);
      if (!value || !unassignedClaims.includes(value)) return;
      setLocalClaims((prev) => [...prev, value]);
      setClaimPickerValue('');
      setClaimComboboxKey((k) => k + 1);
    },
    [unassignedClaims],
  );

  const handleRemoveClaim = useCallback((claimName: string) => {
    setLocalClaims((prev) => prev.filter((c) => c !== claimName));
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Profile */}
      <Panel variant="glass" backgroundColor="white" padding="xs">
        <Section title="Profile" noPadding />
        <FormLayout columns={2}>
          <FormField label="Name">
            <Input tone={themeColor} disabled={!canUpdate} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          </FormField>
          <FormField label="Email">
            <Input tone={themeColor} disabled={!canUpdate} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" type="email" />
          </FormField>
          <FormField label="Username">
            <Input tone={themeColor} value={user.username ?? ''} disabled placeholder="Username" />
          </FormField>
        </FormLayout>
      </Panel>

      {/* Security */}
      <Panel variant="glass" backgroundColor="white" padding="xs">
        <Section title="Security" noPadding />
        <FormLayout columns={2}>
          <FormField label="Password">
            <Input type="password" disabled={!canUpdate} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank to keep current" />
          </FormField>
          <FormField label="Super User">
            <Toggle checked={user.isSuperUser ?? false} disabled={!canUpdate || !isSuperUser} label={user.isSuperUser ? 'Yes' : 'No'} color={themeColor} />
          </FormField>
        </FormLayout>
      </Panel>

      {/* Roles — immediate API */}
      <Panel variant="glass" backgroundColor="white" padding="xs">
        <Section title="Roles" noPadding />
        <div className="space-y-3">
          {unassignedRoles.length > 0 ? (
            <Combobox
              key={roleComboboxKey}
              value={rolePickerValue}
              onChange={handleRolePickerChange}
              options={unassignedRoles}
              disabled={!canUpdate || !isSuperUser}
              placeholder="Search and add a role…"
              emptyMessage="No roles available"
            />
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500">{(user.roles ?? []).length > 0 ? 'All available roles are assigned' : 'No roles defined in the system'}</p>
          )}
          {(user.roles ?? []).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {(user.roles ?? []).map((role) => (
                <Pill key={role} tone="blue" variant="soft" size="sm" className="flex items-center gap-1 pr-1">
                  <span>{role}</span>
                  <IconButton
                    icon="Close"
                    size="xs"
                    variant="ghost"
                    color="blue"
                    rounded="full"
                    customSizeClass="h-4 w-4"
                    disabled={!canUpdate || !isSuperUser}
                    aria-label={`Remove role ${role}`}
                    onClick={() => handleRemoveRole(role)}
                  />
                </Pill>
              ))}
            </div>
          )}
          {(user.roles ?? []).length === 0 && unassignedRoles.length > 0 && <p className="text-xs text-gray-400 dark:text-gray-500">No roles assigned — pick one above</p>}
        </div>
        <TagPicker
          color={themeColor}
          items={availableRoles.map((r) => ({ id: r, label: r }))}
          value={rolePickerValue}
          onChange={handleRolePickerChange}
          disabled={!canUpdate || !isSuperUser}
          placeholder="Search and add a role…"
          emptyMessage="No roles available"
        />
      </Panel>

      {/* Claims — batched until save */}
      <Panel variant="glass" backgroundColor="white" padding="xs">
        <Section title="Claims" noPadding />
        <div className="space-y-3">
          {unassignedClaims.length > 0 ? (
            <Combobox
              key={claimComboboxKey}
              value={claimPickerValue}
              onChange={handleClaimPickerChange}
              options={unassignedClaims}
              placeholder="Search and add a claim…"
              emptyMessage="No claims available"
            />
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500">{localClaims.length > 0 ? 'All available claims are assigned' : 'No claims defined in the system'}</p>
          )}
          {localClaims.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {localClaims.map((claim) => {
                const isPending = !(user.claims ?? []).includes(claim);
                return (
                  <Pill key={claim} tone={isPending ? 'green' : 'violet'} variant="soft" size="sm" className="flex items-center gap-1 pr-1">
                    <span>{claim}</span>
                    <IconButton
                      icon="Close"
                      size="xs"
                      variant="ghost"
                      color={isPending ? 'green' : 'blue'}
                      rounded="full"
                      customSizeClass="h-4 w-4"
                      aria-label={`Remove claim ${claim}`}
                      onClick={() => handleRemoveClaim(claim)}
                    />
                  </Pill>
                );
              })}
            </div>
          )}
          {localClaims.length === 0 && unassignedClaims.length > 0 && <p className="text-xs text-gray-400 dark:text-gray-500">No claims assigned — pick one above</p>}
          {(() => {
            const originalClaims = user.claims ?? [];
            const added = localClaims.filter((c) => !originalClaims.includes(c));
            const removed = originalClaims.filter((c) => !localClaims.includes(c));
            if (added.length === 0 && removed.length === 0) return null;
            return (
              <div className="flex flex-wrap gap-1.5 text-xs">
                {added.length > 0 && <span className="text-emerald-600 dark:text-emerald-400">+{added.length} pending</span>}
                {removed.length > 0 && <span className="text-rose-600 dark:text-rose-400">−{removed.length} pending removal</span>}
                <span className="text-gray-400 dark:text-gray-500 italic">· applied on save</span>
              </div>
            );
          })()}
        </div>
      </Panel>
    </div>
  );
});

UserDetail.displayName = 'UserDetail';

export default UserDetail;
