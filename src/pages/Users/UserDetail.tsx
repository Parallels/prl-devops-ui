import React, { useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import {
  Combobox,
  FormField,
  FormLayout,
  FormSection,
  IconButton,
  Input,
  Pill,
  Toggle,
} from '@prl/ui-kit';
import { devopsService } from '@/services/devops';
import { DevOpsUser } from '@/interfaces/devops';
import { useSession } from '@/contexts/SessionContext';

export interface UserDetailRef {
  save: () => Promise<void>;
  reset: () => void;
}

export interface UserDetailProps {
  user: DevOpsUser;
  isNew?: boolean;
  availableRoles?: string[];
  availableClaims?: string[];
  onSave: (updated: DevOpsUser) => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export const UserDetail = React.forwardRef<UserDetailRef, UserDetailProps>(
  ({ user, isNew = false, availableRoles = [], availableClaims = [], onSave, onDirtyChange }, ref) => {
    const { session } = useSession();
    const hostname = session?.hostname ?? '';

    // Profile fields
    const [name, setName] = useState(user.name ?? '');
    const [email, setEmail] = useState(user.email ?? '');
    const [username, setUsername] = useState(user.username ?? '');
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
      setUsername(user.username ?? '');
      setPassword('');
      setLocalClaims(user.claims ?? []);
      setRolePickerValue('');
      setClaimPickerValue('');
      setRoleComboboxKey((k) => k + 1);
      setClaimComboboxKey((k) => k + 1);
      setCanUpdate(hasClaim('UPDATE_USER'));
      setIsSuperUser(hasRole('SUPER_USER'));
    }, [user.id]);

    // Dirty tracking — includes profile fields and claims diff
    const isDirty = useMemo(() => {
      if (isNew) return name !== '' || email !== '' || username !== '' || password !== '';
      const profileDirty =
        name !== (user.name ?? '') ||
        email !== (user.email ?? '') ||
        password !== '';
      const originalClaims = user.claims ?? [];
      const claimsDirty =
        localClaims.length !== originalClaims.length ||
        localClaims.some((c) => !originalClaims.includes(c));
      return profileDirty || claimsDirty;
    }, [isNew, name, email, username, password, user.name, user.email, localClaims, user.claims]);

    useEffect(() => {
      onDirtyChange?.(isDirty);
    }, [isDirty, onDirtyChange]);

    // ── Save ──────────────────────────────────────────────────────────────────

    const handleSave = useCallback(async () => {
      if (saving) return;
      setSaving(true);
      try {
        if (isNew) {
          const created = await devopsService.users.createUser(hostname, {
            name,
            email,
            password,
            username,
          });
          if (!created?.id) throw new Error('Failed to create user: invalid server response');
          onSave(created);
        } else {
          if (!user.id) return;

          // 1. Update profile fields
          const request: { name?: string; email?: string; password?: string } = { name, email };
          if (password) request.password = password;
          const updated = await devopsService.users.updateUser(hostname, user.id, request);

          // 2. Sync claim changes (batched)
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
        }
      } finally {
        setSaving(false);
      }
    }, [saving, isNew, hostname, name, email, password, username, user.id, user.claims, localClaims, onSave]);

    // ── Reset ─────────────────────────────────────────────────────────────────

    const handleReset = useCallback(() => {
      setName(user.name ?? '');
      setEmail(user.email ?? '');
      setUsername(user.username ?? '');
      setPassword('');
      setLocalClaims(user.claims ?? []);
      setRolePickerValue('');
      setClaimPickerValue('');
      setRoleComboboxKey((k) => k + 1);
      setClaimComboboxKey((k) => k + 1);
    }, [user.name, user.email, user.username, user.claims]);

    useImperativeHandle(ref, () => ({ save: handleSave, reset: handleReset }), [handleSave, handleReset]);

    // ── Roles (immediate) ─────────────────────────────────────────────────────

    const unassignedRoles = useMemo(
      () => availableRoles.filter((r) => !(user.roles ?? []).includes(r)),
      [availableRoles, user.roles],
    );

    const handleRolePickerChange = useCallback(
      (value: string) => {
        setRolePickerValue(value);
        if (!value || !unassignedRoles.includes(value)) return;
        // Auto-add when exact match (user selected from dropdown)
        setRolePickerValue('');
        setRoleComboboxKey((k) => k + 1); // force remount to clear internal filter state
        if (!user.id) return;
        devopsService.users.addUserRole(hostname, user.id, value)
          .then(() => onSave({ ...user, roles: [...(user.roles ?? []), value] }))
          .catch((err) => console.error('Failed to add role:', err));
      },
      [hostname, user, unassignedRoles, onSave],
    );

    const handleRemoveRole = useCallback(
      (roleName: string) => {
        if (!user.id) return;
        devopsService.users.removeUserRole(hostname, user.id, roleName)
          .then(() => onSave({ ...user, roles: (user.roles ?? []).filter((r) => r !== roleName) }))
          .catch((err) => console.error('Failed to remove role:', err));
      },
      [hostname, user, onSave],
    );

    // ── Claims (batched until save) ────────────────────────────────────────────

    const unassignedClaims = useMemo(
      () => availableClaims.filter((c) => !localClaims.includes(c)),
      [availableClaims, localClaims],
    );

    const handleClaimPickerChange = useCallback(
      (value: string) => {
        setClaimPickerValue(value);
        if (!value || !unassignedClaims.includes(value)) return;
        // Auto-add to local state when exact match
        setLocalClaims((prev) => [...prev, value]);
        setClaimPickerValue('');
        setClaimComboboxKey((k) => k + 1); // force remount to clear internal filter state
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
        <FormSection title="Profile">
          <FormLayout columns={2}>
            <FormField label="Name">
              <Input disabled={!canUpdate} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
            </FormField>
            <FormField label="Email">
              <Input disabled={!canUpdate} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" type="email" />
            </FormField>
            <FormField label="Username">
              <Input
                value={isNew ? username : (user.username ?? '')}
                onChange={isNew ? (e) => setUsername(e.target.value) : undefined}
                disabled={!isNew}
                placeholder="Username"
              />
            </FormField>
          </FormLayout>
        </FormSection>

        {/* Security */}
        <FormSection title="Security">
          <FormLayout columns={2}>
            <FormField label="Password">
              <Input
                type="password"
                disabled={!canUpdate}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isNew ? 'Password (required)' : 'Leave blank to keep current'}
              />
            </FormField>
            {!isNew && (
              <FormField label="Super User">
                <Toggle
                  checked={user.isSuperUser ?? false}
                  disabled={!canUpdate || !isSuperUser}
                  label={user.isSuperUser ? 'Yes' : 'No'}
                  color="parallels"
                />
              </FormField>
            )}
          </FormLayout>
        </FormSection>

        {/* Roles — existing users only, immediate API */}
        {!isNew && (
          <FormSection title="Roles">
            <div className="space-y-3">
              {/* Role picker — top */}
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
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {(user.roles ?? []).length > 0 ? 'All available roles are assigned' : 'No roles defined in the system'}
                </p>
              )}
              {/* Assigned roles */}
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
              {(user.roles ?? []).length === 0 && unassignedRoles.length > 0 && (
                <p className="text-xs text-gray-400 dark:text-gray-500">No roles assigned — pick one above</p>
              )}
            </div>
          </FormSection>
        )}

        {/* Claims — existing users only, batched until save */}
        {!isNew && (
          <FormSection title="Claims">
            <div className="space-y-3">
              {/* Claim picker — top */}
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
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {localClaims.length > 0 ? 'All available claims are assigned' : 'No claims defined in the system'}
                </p>
              )}
              {/* Claims list — saved (violet) + pending additions (emerald) */}
              {localClaims.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {localClaims.map((claim) => {
                    const isPending = !(user.claims ?? []).includes(claim);
                    return (
                      <Pill
                        key={claim}
                        tone={isPending ? 'green' : 'violet'}
                        variant="soft"
                        size="sm"
                        className="flex items-center gap-1 pr-1"
                      >
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
              {localClaims.length === 0 && unassignedClaims.length > 0 && (
                <p className="text-xs text-gray-400 dark:text-gray-500">No claims assigned — pick one above</p>
              )}
              {/* Pending-change summary */}
              {(() => {
                const originalClaims = user.claims ?? [];
                const added = localClaims.filter((c) => !originalClaims.includes(c));
                const removed = originalClaims.filter((c) => !localClaims.includes(c));
                if (added.length === 0 && removed.length === 0) return null;
                return (
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {added.length > 0 && (
                      <span className="text-emerald-600 dark:text-emerald-400">+{added.length} pending</span>
                    )}
                    {removed.length > 0 && (
                      <span className="text-rose-600 dark:text-rose-400">−{removed.length} pending removal</span>
                    )}
                    <span className="text-gray-400 dark:text-gray-500 italic">· applied on save</span>
                  </div>
                );
              })()}
            </div>
          </FormSection>
        )}
      </div>
    );
  },
);

UserDetail.displayName = 'UserDetail';

export default UserDetail;
