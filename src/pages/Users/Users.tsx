import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, ConfirmModal, getGravatarUrl, IconButton, NotificationModal, SplitView, UserAvatar, type SplitViewItem } from '@prl/ui-kit';
import { devopsService } from '@/services/devops';
import { DevOpsUser } from '@/interfaces/devops';
import { useSession } from '@/contexts/SessionContext';
import { UserDetail, type UserDetailRef } from './UserDetail';
import { PageHeader } from '@/components/PageHeader';

const NEW_USER_ID = '__new__';

export const Users: React.FC = () => {
    const [users, setUsers] = useState<DevOpsUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>();
    const [availableRoles, setAvailableRoles] = useState<string[]>([]);
    const [availableClaims, setAvailableClaims] = useState<string[]>([]);
    const { session } = useSession();
    const hostname = session?.hostname ?? '';

    const [selectedId, setSelectedId] = useState<string | undefined>();
    const [newUser, setNewUser] = useState<DevOpsUser | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [saving, setSaving] = useState(false);

    const [userToDelete, setUserToDelete] = useState<DevOpsUser | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [saveResult, setSaveResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
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
                devopsService.roles.getRoles(hostname).catch(() => []),
                devopsService.claims.getClaims(hostname).catch(() => []),
            ]);
            setUsers(usersResult);
            setAvailableRoles(rolesResult.map((r) => r.name ?? '').filter(Boolean));
            setAvailableClaims(claimsResult.map((c) => c.name ?? '').filter(Boolean));
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
        if (newUser) {
            // New user was created — add to real list, clear temp
            setUsers((prev) => [...prev, updated]);
            setNewUser(null);
            setSelectedId(updated.id);
        } else {
            setUsers((prev) =>
                prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u))
            );
        }
        setIsDirty(false);
    }, [newUser]);

    const handleDelete = useCallback(async (user: DevOpsUser) => {
        if (!user.id) return;
        setDeleting(true);
        try {
            await devopsService.users.removeUser(hostname, user.id);
            setUsers((prev) => prev.filter((u) => u.id !== user.id));
            setUserToDelete(null);
            if (selectedId === user.id) {
                setSelectedId(undefined);
            }
        } catch (err) {
            console.error('Failed to delete user:', err);
        } finally {
            setDeleting(false);
        }
    }, [hostname, selectedId]);

    const handleAddNew = useCallback(() => {
        if (newUser) return; // already adding
        const emptyUser: DevOpsUser = {
            id: NEW_USER_ID,
            name: '',
            email: '',
            username: '',
            roles: [],
            claims: [],
            isSuperUser: false,
        };
        setNewUser(emptyUser);
        setSelectedId(NEW_USER_ID);
    }, [newUser]);

    const handleCancelNew = useCallback(() => {
        setNewUser(null);
        setIsDirty(false);
        setSelectedId(users[0]?.id);
    }, [users]);

    const executeCancel = useCallback(() => {
        setShowCancelConfirm(false);
        if (newUser) {
            handleCancelNew();
        } else {
            detailRef.current?.reset();
        }
    }, [newUser, handleCancelNew]);

    const handleHeaderSave = useCallback(async () => {
        setSaving(true);
        try {
            await detailRef.current?.save();
            setSaveResult({
                type: 'success',
                message: newUser
                    ? 'The user account has been created successfully.'
                    : 'Your changes have been saved successfully.',
            });
        } catch (err: any) {
            setSaveResult({
                type: 'error',
                message: err?.message ?? 'An unexpected error occurred while saving.',
            });
        } finally {
            setSaving(false);
        }
    }, [newUser]);

    const handleHeaderCancel = useCallback(() => {
        if (isDirty) {
            setShowCancelConfirm(true);
        } else if (newUser) {
            // New user with no changes — discard directly
            handleCancelNew();
        }
    }, [isDirty, newUser, handleCancelNew]);

    const allUsers = useMemo(() => {
        if (newUser) return [newUser, ...users];
        return users;
    }, [users, newUser]);

    const items: SplitViewItem[] = useMemo(
        () =>
            allUsers.map((user) => {
                const isNew = user.id === NEW_USER_ID;
                return {
                    id: user.id ?? '',
                    label: isNew ? 'New User' : (user.name ?? user.username ?? 'Unknown'),
                    subtitle: isNew ? 'Fill in the details below' : (user.email ?? user.username),
                    icon: 'User' as const,
                    badges: user.isSuperUser
                        ? [{ label: 'Super User', tone: 'red' as const }]
                        : isNew
                            ? [{ label: 'New', tone: 'green' as const }]
                            : undefined,
                    panel: (
                        <UserDetail
                            ref={detailRef}
                            user={user}
                            isNew={isNew}
                            availableRoles={availableRoles}
                            availableClaims={availableClaims}
                            onSave={handleSave}
                            onDirtyChange={setIsDirty}
                        />
                    ),
                    actions: isNew ? undefined : (
                        <>
                            {canUpdate && (
                                <IconButton
                                    variant="ghost"
                                    size="xs"
                                    color="danger"
                                    icon="Trash"
                                    onClick={() => setUserToDelete(user)}
                                />
                            )}
                        </>
                    ),
                };
            }),
        [allUsers, handleSave, availableRoles, availableClaims],
    );

    const panelHeader = useCallback(
        (activeItem: SplitViewItem) => {
            const isNew = activeItem.id === NEW_USER_ID;
            const user = isNew ? newUser : users.find((u) => u.id === activeItem.id);
            if (!user) return null;
            return (
                <PageHeader
                    icon={
                        <UserAvatar
                            user={{
                                name: user.name || undefined,
                                email: user.email || undefined,
                                username: user.username || undefined,
                                avatarUrl: getGravatarUrl(user.email ?? ''),
                            }}
                            size={40}
                            variant="circle"
                        />
                    }
                    title={isNew ? 'New User' : (user.name ?? user.username ?? 'Unknown')}
                    subtitle={isNew ? 'Create a new user account' : (user.email ?? user.username ?? '')}
                    actions={(isDirty || isNew) && canUpdate ? (
                        <>
                            <Button variant="outline" color="theme" size="sm" onClick={handleHeaderCancel}>
                                Cancel
                            </Button>
                            <Button
                                variant="solid"
                                color="parallels"
                                size="sm"
                                loading={saving}
                                onClick={() => void handleHeaderSave()}
                            >
                                Save
                            </Button>
                        </>
                    ) : undefined}
                />
            );
        },
        [users, newUser, isDirty, saving, handleHeaderCancel, handleHeaderSave],
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
                    panelHeader={panelHeader}
                    autoHideList={false}
                    borderLeft
                    color='parallels'
                    searchPlaceholder="Search users..."
                    listActions={
                        <>
                            {canCreate && (
                                <IconButton
                                    variant="ghost"
                                    size="xs"
                                    color="parallels"
                                    accent={true}
                                    accentColor='parallels'
                                    icon="Add"
                                    onClick={handleAddNew}
                                />
                            )}
                        </>
                    }
                />
            </div>

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
