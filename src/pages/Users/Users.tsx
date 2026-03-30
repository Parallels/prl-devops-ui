import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, ConfirmModal, EmptyState, FormField, FormLayout, getGravatarUrl, IconButton, Input, Modal, ModalActions, NotificationModal, SplitView, TagPicker, UserAvatar, type SplitViewItem } from '@prl/ui-kit';
import { devopsService } from '@/services/devops';
import { DevOpsClaim, DevOpsUser, DevOpsRole } from '@/interfaces/devops';
import { useSession } from '@/contexts/SessionContext';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { UserDetail, type UserDetailRef } from './UserDetail';

export const Users: React.FC = () => {
  const [users, setUsers] = useState<DevOpsUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>();
  const [availableRoles, setAvailableRoles] = useState<DevOpsRole[]>([]);
  const [availableClaims, setAvailableClaims] = useState<DevOpsClaim[]>([]);
  const { session } = useSession();
  const { themeColor } = useSystemSettings();
  const hostname = session?.hostname ?? '';

  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const [userToDelete, setUserToDelete] = useState<DevOpsUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [saveResult, setSaveResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalName, setModalName] = useState('');
  const [modalEmail, setModalEmail] = useState('');
  const [modalUsername, setModalUsername] = useState('');
  const [modalPassword, setModalPassword] = useState('');
  const [modalConfirmPassword, setModalConfirmPassword] = useState('');
  const [modalRoles, setModalRoles] = useState<string[]>([]);
  const [modalClaims, setModalClaims] = useState<string[]>([]);
  const [modalSaving, setModalSaving] = useState(false);

  const { hasClaim } = useSession();
  const [canUpdate, setCanUpdate] = useState(false);
  const [, setCanDelete] = useState(false);
  const [canCreate, setCanCreate] = useState(false);

  const detailRef = useRef<UserDetailRef>(null);

  useEffect(() => {
    setCanUpdate(hasClaim('UPDATE_USER'));
    setCanDelete(hasClaim('DELETE_USER'));
    setCanCreate(hasClaim('CREATE_USER'));
  }, [hasClaim]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersResult, rolesResult, claimsResult] = await Promise.all([
        devopsService.users.getUsers(hostname),
        devopsService.roles.getRoles(hostname).catch(() => [] as DevOpsRole[]),
        devopsService.claims.getClaims(hostname).catch(() => []),
      ]);
      setUsers(usersResult);
      setAvailableRoles(rolesResult);
      setAvailableClaims(
        claimsResult.map((c) => ({
          id: c.id ?? '',
          name: c.name ?? '',
          description: c.description,
        } as DevOpsClaim))
      );
    } catch (err: any) {
      const message = err?.message ?? 'Failed to load users';
      setError(message);
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, [hostname]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const handleSave = useCallback((updated: DevOpsUser) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
    setIsDirty(false);
  }, []);

  const handleDelete = useCallback(
    async (user: DevOpsUser) => {
      if (!user.id) return;
      setDeleting(true);
      try {
        await devopsService.users.removeUser(hostname, user.id);
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        setUserToDelete(null);
        if (selectedId === user.id) setSelectedId(undefined);
      } catch (err) {
        console.error('Failed to delete user:', err);
      } finally {
        setDeleting(false);
      }
    },
    [hostname, selectedId],
  );

  const handleAddNew = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setShowCreateModal(false);
    setModalName('');
    setModalEmail('');
    setModalUsername('');
    setModalPassword('');
    setModalConfirmPassword('');
    setModalRoles([]);
    setModalClaims([]);
  }, []);

  const handleModalCreate = useCallback(async () => {
    setModalSaving(true);
    try {
      const created = await devopsService.users.createUser(hostname, {
        name: modalName,
        email: modalEmail,
        password: modalPassword,
        username: modalUsername,
        ...(modalRoles.length > 0 && { roles: modalRoles }),
        ...(modalClaims.length > 0 && { claims: modalClaims }),
      });
      if (!created?.id) throw new Error('Failed to create user: invalid server response');
      setUsers((prev) => [...prev, { ...created, roles: modalRoles, claims: modalClaims }]);
      setSelectedId(created.id);
      handleModalClose();
      setSaveResult({ type: 'success', message: 'The user account has been created successfully.' });
    } catch (err: any) {
      setSaveResult({ type: 'error', message: err?.message ?? 'An unexpected error occurred while creating the user.' });
    } finally {
      setModalSaving(false);
    }
  }, [hostname, modalName, modalEmail, modalPassword, modalUsername, modalRoles, modalClaims, handleModalClose]);

  const handleHeaderSave = useCallback(async () => {
    setSaving(true);
    try {
      await detailRef.current?.save();
      setSaveResult({ type: 'success', message: 'Your changes have been saved successfully.' });
    } catch (err: any) {
      setSaveResult({ type: 'error', message: err?.message ?? 'An unexpected error occurred while saving.' });
    } finally {
      setSaving(false);
    }
  }, []);

  const handleHeaderCancel = useCallback(() => {
    if (isDirty) {
      setShowCancelConfirm(true);
    }
  }, [isDirty]);

  const executeCancel = useCallback(() => {
    setShowCancelConfirm(false);
    detailRef.current?.reset();
  }, []);

  const items: SplitViewItem[] = useMemo(
    () =>
      users.map((user) => ({
        id: user.id ?? '',
        label: user.name ?? user.username ?? 'Unknown',
        subtitle: user.email ?? user.username,
        icon: 'User' as const,
        badges: user.isSuperUser ? [{ label: 'Super User', tone: 'red' as const }] : undefined,
        panel: <UserDetail ref={detailRef} user={user} availableRoles={availableRoles} availableClaims={availableClaims} onSave={handleSave} onDirtyChange={setIsDirty} />,
        actions: <>{canUpdate && <IconButton variant="ghost" size="xs" color="danger" icon="Trash" onClick={() => setUserToDelete(user)} />}</>,
      })),
    [users, handleSave, availableRoles, availableClaims, canUpdate],
  );

  const panelHeaderProps = useCallback(
    (activeItem: SplitViewItem) => {
      const user = users.find((u) => u.id === activeItem.id);
      if (!user) return undefined;
      return {
        icon: (
          <UserAvatar
            user={{
              name: user.name || undefined,
              email: user.email || undefined,
              username: user.username || undefined,
              avatarUrl: getGravatarUrl(user.email ?? ''),
            }}
            variant="circle"
          />
        ),
        title: user.name ?? user.username ?? 'Unknown',
        subtitle: user.email ?? user.username ?? '',
        actions:
          isDirty && canUpdate ? (
            <>
              <Button variant="outline" color="theme" size="sm" onClick={handleHeaderCancel}>
                Cancel
              </Button>
              <Button variant="soft" color={themeColor} size="sm" loading={saving} onClick={() => void handleHeaderSave()}>
                Save
              </Button>
            </>
          ) : undefined,
      };
    },
    [users, isDirty, saving, canUpdate, handleHeaderCancel, handleHeaderSave, themeColor],
  );

  const modalPasswordMismatch = modalPassword !== '' && modalConfirmPassword !== '' && modalPassword !== modalConfirmPassword;
  const isModalValid =
    modalUsername.trim() !== '' &&
    modalPassword.trim() !== '' &&
    modalPassword === modalConfirmPassword &&
    modalRoles.length > 0;

  const modalRoleItems = useMemo(
    () => availableRoles.map((r) => ({ id: r.id, label: r.name })),
    [availableRoles],
  );

  const modalClaimItems = useMemo(
    () => availableClaims.map((c) => ({ id: c.id || c.name, label: c.name })),
    [availableClaims],
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
        <SplitView
          items={items}
          value={selectedId}
          onChange={(id) => setSelectedId(id)}
          collapsible
          resizable
          loading={loading}
          error={error}
          onRetry={() => void fetchUsers()}
          listTitle={`Users (${users.length})`}
          panelHeaderProps={panelHeaderProps}
          autoHideList={false}
          borderLeft
          color={themeColor}
          panelEmptyState={
            <EmptyState
              disableBorder
              icon="Users"
              title="No users found"
              subtitle="There are no user accounts in the system. Click the button below to create the first one."
              actionColor={themeColor}
              actionLeadingIcon="Add"
              actionVariant="soft"
              actionLabel="Add User"
              onAction={canCreate ? handleAddNew : undefined}
            />
          }
          searchPlaceholder="Search users..."
          listActions={<>{canCreate && <IconButton variant="ghost" size="xs" color={themeColor} icon="Add" onClick={handleAddNew} />}</>}
        />
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={handleModalClose}
        title="Add User"
        description="Create a new user account."
        size="md"
        icon="User"
        actions={
          <ModalActions>
            <Button variant="outline" color="theme" size="sm" onClick={handleModalClose} disabled={modalSaving}>
              Cancel
            </Button>
            <Button variant="soft" color={themeColor} size="sm" loading={modalSaving} disabled={!isModalValid} onClick={() => void handleModalCreate()}>
              Create
            </Button>
          </ModalActions>
        }
      >
        <div className="space-y-4">
          <FormLayout columns={2}>
            <FormField label="Name">
              <Input tone={themeColor} value={modalName} onChange={(e) => setModalName(e.target.value)} placeholder="Full name" />
            </FormField>
            <FormField label="Email">
              <Input tone={themeColor} value={modalEmail} onChange={(e) => setModalEmail(e.target.value)} placeholder="Email address" type="email" />
            </FormField>
            <FormField label="Username" required>
              <Input tone={themeColor} value={modalUsername} onChange={(e) => setModalUsername(e.target.value)} placeholder="Username" />
            </FormField>
          </FormLayout>

          <FormLayout columns={2}>
            <FormField label="Password" required error={modalPasswordMismatch ? 'Passwords do not match' : undefined}>
              <Input
                tone={themeColor}
                type="password"
                value={modalPassword}
                onChange={(e) => {
                  setModalPassword(e.target.value);
                  if (!e.target.value) setModalConfirmPassword('');
                }}
                placeholder="Password"
              />
            </FormField>
            <FormField label="Confirm Password" required error={modalPasswordMismatch ? 'Passwords do not match' : undefined}>
              <Input
                tone={themeColor}
                type="password"
                value={modalConfirmPassword}
                onChange={(e) => setModalConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                disabled={modalPassword === ''}
              />
            </FormField>
          </FormLayout>

          <FormLayout columns={1}>
            <FormField label="Roles" required hint={modalRoles.length === 0 ? 'At least one role is required' : undefined}>
              <TagPicker
                color={themeColor}
                items={modalRoleItems}
                value={modalRoles}
                onChange={setModalRoles}
                placeholder="Assign roles…"
                emptyMessage="No roles available"
                escapeBoundary
                highlightNew={false}
              />
            </FormField>
            <FormField label="Direct Claims">
              <TagPicker
                color={themeColor}
                items={modalClaimItems}
                value={modalClaims}
                onChange={setModalClaims}
                placeholder="Assign claims…"
                emptyMessage="No claims available"
                escapeBoundary
                highlightNew={false}
              />
            </FormField>
          </FormLayout>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={() => userToDelete && void handleDelete(userToDelete)}
        title="Delete User"
        description={`Are you sure you want to delete "${userToDelete?.name ?? userToDelete?.username ?? 'this user'}"? This action cannot be undone.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        confirmColor="danger"
        confirmVariant="solid"
        isConfirmDisabled={deleting}
      />

      {/* Cancel Confirm Modal */}
      <ConfirmModal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={executeCancel}
        title="Discard Changes"
        description="You have unsaved changes. Are you sure you want to discard them? This action cannot be undone."
        confirmLabel="Discard"
        confirmColor="danger"
        confirmVariant="solid"
      />

      {/* Save Result Notification */}
      <NotificationModal
        isOpen={!!saveResult}
        onClose={() => setSaveResult(null)}
        type={saveResult?.type ?? 'info'}
        title={saveResult?.type === 'success' ? 'Saved' : 'Save Failed'}
        message={saveResult?.message ?? ''}
        actionLabel="OK"
      />
    </div>
  );
};
