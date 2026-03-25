import React, { useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { AccessMatrix, type AccessMatrixPermission, FormField, FormLayout, Input, Panel, Pill, Section, TagPicker, Tabs, Toggle, TagPanel } from '@prl/ui-kit';
import { devopsService } from '@/services/devops';
import { ClaimGroupResponse, ClaimResponse, DevOpsUser, RoleResponse } from '@/interfaces/devops';
import { useSession } from '@/contexts/SessionContext';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';

export interface UserDetailRef {
  save: () => Promise<void>;
  reset: () => void;
}

export interface UserDetailProps {
  user: DevOpsUser;
  availableRoles?: RoleResponse[];
  availableClaims?: ClaimResponse[];
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
  const [confirmPassword, setConfirmPassword] = useState('');

  // Roles + Claims local state — batched until save
  const [localRoles, setLocalRoles] = useState<string[]>(user.roles ?? []);
  const [localClaims, setLocalClaims] = useState<string[]>(user.claims ?? []);

  const [canUpdate, setCanUpdate] = useState(false);
  const [isSuperUser, setIsSuperUser] = useState(false);
  const { hasClaim, hasRole } = useSession();

  const [saving, setSaving] = useState(false);

  // Access Matrix tab
  const [activeTab, setActiveTab] = useState('general');
  const [matrixGroups, setMatrixGroups] = useState<ClaimGroupResponse[]>([]);
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [matrixError, setMatrixError] = useState<string | null>(null);

  // Reset all form state when the selected user changes
  useEffect(() => {
    setName(user.name ?? '');
    setEmail(user.email ?? '');
    setPassword('');
    setConfirmPassword('');
    setLocalRoles(user.roles ?? []);
    setLocalClaims(user.claims ?? []);
    setCanUpdate(hasClaim('UPDATE_USER'));
    setIsSuperUser(hasRole('SUPER_USER'));
    setActiveTab('general');
    setMatrixGroups([]);
    setMatrixError(null);
  }, [user.id]);

  // Lazy-load grouped claims when the Access Matrix tab is first opened
  useEffect(() => {
    if (activeTab !== 'access-matrix') return;
    let cancelled = false;
    setMatrixLoading(true);
    setMatrixError(null);
    devopsService.claims
      .getGroupedClaims(hostname)
      .then((groups) => {
        if (!cancelled) setMatrixGroups(groups);
      })
      .catch((err: unknown) => {
        if (!cancelled) setMatrixError((err as Error)?.message ?? 'Failed to load access matrix');
      })
      .finally(() => {
        if (!cancelled) setMatrixLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, hostname]);

  const passwordMismatch = password !== '' && confirmPassword !== '' && password !== confirmPassword;
  const passwordValid = password === '' || (password !== '' && password === confirmPassword);

  // Dirty tracking
  const isDirty = useMemo(() => {
    const profileDirty = name !== (user.name ?? '') || email !== (user.email ?? '') || password !== '';
    const originalRoles = user.roles ?? [];
    const rolesDirty = localRoles.length !== originalRoles.length || localRoles.some((r) => !originalRoles.includes(r));
    const originalClaims = user.claims ?? [];
    const claimsDirty = localClaims.length !== originalClaims.length || localClaims.some((c) => !originalClaims.includes(c));
    return profileDirty || rolesDirty || claimsDirty;
  }, [name, email, password, user.name, user.email, localRoles, user.roles, localClaims, user.claims]);

  useEffect(() => {
    onDirtyChange?.(isDirty && passwordValid);
  }, [isDirty, passwordValid, onDirtyChange]);

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (saving || !user.id || !passwordValid) return;
    setSaving(true);
    try {
      const request: { name?: string; email?: string; password?: string } = { name, email };
      if (password) request.password = password;
      const updated = await devopsService.users.updateUser(hostname, user.id, request);

      // Sync role changes (batched)
      const originalRoles = user.roles ?? [];
      const rolesToAdd = localRoles.filter((r) => !originalRoles.includes(r));
      const rolesToRemove = originalRoles.filter((r) => !localRoles.includes(r));
      for (const role of rolesToAdd) {
        await devopsService.users.addUserRole(hostname, user.id, role);
      }
      for (const role of rolesToRemove) {
        await devopsService.users.removeUserRole(hostname, user.id, role);
      }

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
      setConfirmPassword('');
      onSave({ ...updated, roles: localRoles, claims: localClaims });
    } finally {
      setSaving(false);
    }
  }, [saving, hostname, name, email, password, passwordValid, user.id, user.roles, localRoles, user.claims, localClaims, onSave]);

  // ── Reset ─────────────────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    setName(user.name ?? '');
    setEmail(user.email ?? '');
    setPassword('');
    setConfirmPassword('');
    setLocalRoles(user.roles ?? []);
    setLocalClaims(user.claims ?? []);
  }, [user.name, user.email, user.roles, user.claims]);

  useImperativeHandle(ref, () => ({ save: handleSave, reset: handleReset }), [handleSave, handleReset]);

  // ── Roles (batched until save) ────────────────────────────────────────────

  const roleItems = useMemo(() => availableRoles.map((r) => ({ id: r.id, label: r.name })), [availableRoles]);

  const handleRolesChange = useCallback((newRoles: string[]) => {
    setLocalRoles(newRoles);
  }, []);

  // ── Claims (batched until save) ────────────────────────────────────────────

  // Split effective claims into direct and inherited for display
  const effectiveClaims = user.effective_claims ?? [];
  const inheritedClaims = effectiveClaims.filter((c) => c.is_inherited);

  const claimItems = useMemo(() => availableClaims.map((c) => ({ id: c.id || c.name, label: c.name })), [availableClaims]);

  // Resolve role display name from availableRoles for the inherited badge
  const resolveRoleName = useCallback((roleId: string) => availableRoles.find((r) => r.id === roleId)?.name ?? roleId, [availableRoles]);

  // Build AccessMatrixPermission[] from grouped claims + user's effective claims
  const matrixPermissions = useMemo((): AccessMatrixPermission[] => {
    if (matrixGroups.length === 0) return [];
    const effectiveIds = new Set((user.effective_claims ?? []).map((c) => c.id));
    const result: AccessMatrixPermission[] = [];
    for (const group of matrixGroups) {
      for (const resource of group.resources) {
        for (const claim of resource.claims) {
          result.push({
            group: group.group,
            resource: resource.resource,
            action: claim.action ?? claim.name,
            enabled: effectiveIds.has(claim.id),
          });
        }
      }
    }
    return result;
  }, [matrixGroups, user.effective_claims]);

  // ── Render ────────────────────────────────────────────────────────────────

  const generalPanel = (
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
          <FormField label="Password" error={passwordMismatch ? 'Passwords do not match' : undefined}>
            <Input
              type="password"
              disabled={!canUpdate}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (!e.target.value) setConfirmPassword('');
              }}
              placeholder="Leave blank to keep current"
            />
          </FormField>
          {password !== '' && (
            <FormField label="Confirm Password" error={passwordMismatch ? 'Passwords do not match' : undefined}>
              <Input type="password" disabled={!canUpdate} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" />
            </FormField>
          )}
          <FormField label="Super User">
            <Toggle checked={user.isSuperUser ?? false} disabled={!canUpdate || !isSuperUser} label={user.isSuperUser ? 'Yes' : 'No'} color={themeColor} />
          </FormField>
        </FormLayout>
      </Panel>

      {/* Roles — immediate API */}
      <Panel variant="glass" backgroundColor="white" padding="xs">
        <Section title="Roles" noPadding />
        <TagPicker
          key={`roles-${user.id}`}
          color={themeColor}
          items={roleItems}
          value={localRoles}
          onChange={handleRolesChange}
          disabled={!canUpdate || !isSuperUser}
          placeholder="Search and add roles…"
          emptyMessage="No roles available"
          highlightNew
        />
      </Panel>

      {/* Direct Claims — editable */}
      <Panel variant="glass" backgroundColor="white" padding="xs">
        <Section title="Direct Claims" noPadding />
        <div className="space-y-3">
          <TagPicker
            key={`claims-${user.id}`}
            color={themeColor}
            items={claimItems}
            value={localClaims}
            onChange={setLocalClaims}
            disabled={!canUpdate}
            placeholder="Search and add claims…"
            emptyMessage="No claims available"
            highlightNew
          />
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

      {/* Inherited Claims — read-only */}
      {inheritedClaims.length > 0 && (
        <Panel variant="glass" backgroundColor="white" padding="xs">
          <Section title="Inherited Claims" noPadding />
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">These claims are inherited from assigned roles and cannot be removed here.</p>
          <div className="flex flex-wrap gap-2">
            <TagPanel
              tags={inheritedClaims.map((c) => ({
                label: c.name,
                tone: themeColor,
                variant: 'soft',
                children: (
                  <>
                    <span className="text-gray-500 dark:text-gray-400 pr-2">{c.name}</span>
                    {c.source_role && <span className={`text-xs text-${themeColor}-500 dark:text-${themeColor}-400 font-medium`}>via {resolveRoleName(c.source_role)}</span>}
                  </>
                ),
              }))}
              tagLimit={5}
            />
          </div>
        </Panel>
      )}
    </div>
  );

  const accessMatrixPanel = (
    <div className="h-full flex flex-col p-1">
      {user.isSuperUser && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
          This user is a Super User and has unrestricted access regardless of assigned claims.
        </div>
      )}
      {matrixLoading ? (
        <div className="flex items-center justify-center py-16">
          <svg className="h-6 w-6 animate-spin text-neutral-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : matrixError ? (
        <p className="py-8 text-center text-sm text-rose-500 dark:text-rose-400">{matrixError}</p>
      ) : matrixPermissions.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-400 dark:text-neutral-500">No access data available.</p>
      ) : (
        <div className="flex-1 min-h-0">
          <AccessMatrix variant="flat" tone={themeColor} permissions={matrixPermissions} limit={20} hoverable noBorders fullHeight />
        </div>
      )}
    </div>
  );

  return (
    <Tabs
      variant="underline"
      color={themeColor}
      size="sm"
      value={activeTab}
      onChange={(id) => setActiveTab(id)}
      panelIdPrefix={`user-detail-${user.id}`}
      scrollFade
      items={[
        { id: 'general', label: 'General', panel: generalPanel },
        { id: 'access-matrix', label: 'Access Matrix', panel: accessMatrixPanel },
      ]}
    />
  );
});

UserDetail.displayName = 'UserDetail';

export default UserDetail;
