import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, ConfirmModal, CustomIcon, IconButton, NotificationModal, SplitView, type SplitViewItem } from '@prl/ui-kit';
import { devopsService } from '@/services/devops';
import { DevOpsRolesAndClaims } from '@/interfaces/devops';
import { useSession } from '@/contexts/SessionContext';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { RoleDetail, type RoleDetailRef } from './RoleDetail';

const NEW_ROLE_ID = '__new__';

export const Roles: React.FC = () => {
    const [roles, setRoles] = useState<DevOpsRolesAndClaims[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>();
    const { session, hasClaim } = useSession();
    const { themeColor } = useSystemSettings();
    const hostname = session?.hostname ?? '';

    const [selectedId, setSelectedId] = useState<string | undefined>();
    const [newRole, setNewRole] = useState<DevOpsRolesAndClaims | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [saving, setSaving] = useState(false);

    const [roleToDelete, setRoleToDelete] = useState<DevOpsRolesAndClaims | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [saveResult, setSaveResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const canCreate = useMemo(() => hasClaim('CREATE_ROLE'), [hasClaim]);
    const canDelete = useMemo(() => hasClaim('DELETE_ROLE'), [hasClaim]);

    const detailRef = useRef<RoleDetailRef>(null);

    const fetchRoles = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await devopsService.roles.getRoles(hostname);
            setRoles(result);
        } catch (err: any) {
            setError(err?.message ?? 'Failed to load roles');
            console.error('Failed to fetch roles:', err);
        } finally {
            setLoading(false);
        }
    }, [hostname]);

    useEffect(() => {
        void fetchRoles();
    }, [fetchRoles]);

    const handleSave = useCallback((created: DevOpsRolesAndClaims) => {
        setRoles((prev) => [...prev, created]);
        setNewRole(null);
        setSelectedId(created.id);
        setIsDirty(false);
    }, []);

    const handleDelete = useCallback(async (role: DevOpsRolesAndClaims) => {
        if (!role.id) return;
        setDeleting(true);
        try {
            await devopsService.roles.removeRole(hostname, role.id);
            setRoles((prev) => prev.filter((r) => r.id !== role.id));
            setRoleToDelete(null);
            if (selectedId === role.id) setSelectedId(undefined);
        } catch (err) {
            console.error('Failed to delete role:', err);
        } finally {
            setDeleting(false);
        }
    }, [hostname, selectedId]);

    const handleAddNew = useCallback(() => {
        if (newRole) return;
        const empty: DevOpsRolesAndClaims = { id: NEW_ROLE_ID, name: '', description: '', users: [] };
        setNewRole(empty);
        setSelectedId(NEW_ROLE_ID);
    }, [newRole]);

    const handleCancelNew = useCallback(() => {
        setNewRole(null);
        setIsDirty(false);
        setSelectedId(roles[0]?.id);
    }, [roles]);

    const executeCancel = useCallback(() => {
        setShowCancelConfirm(false);
        if (newRole) {
            handleCancelNew();
        } else {
            detailRef.current?.reset();
        }
    }, [newRole, handleCancelNew]);

    const handleHeaderSave = useCallback(async () => {
        setSaving(true);
        try {
            await detailRef.current?.save();
            setSaveResult({ type: 'success', message: 'The role has been created successfully.' });
        } catch (err: any) {
            setSaveResult({ type: 'error', message: err?.message ?? 'An unexpected error occurred while saving.' });
        } finally {
            setSaving(false);
        }
    }, []);

    const handleHeaderCancel = useCallback(() => {
        if (isDirty) {
            setShowCancelConfirm(true);
        } else if (newRole) {
            handleCancelNew();
        }
    }, [isDirty, newRole, handleCancelNew]);

    const allRoles = useMemo(() => (newRole ? [newRole, ...roles] : roles), [roles, newRole]);

    const items: SplitViewItem[] = useMemo(
        () =>
            allRoles.map((role) => {
                const isNew = role.id === NEW_ROLE_ID;
                return {
                    id: role.id ?? '',
                    label: isNew ? 'New Role' : (role.name ?? 'Unknown'),
                    subtitle: isNew ? 'Fill in the details below' : (role.description ?? `${(role.users ?? []).length} user(s)`),
                    icon: 'Roles' as const,
                    badges: isNew ? [{ label: 'New', tone: 'green' as const }] : undefined,
                    panel: (
                        <RoleDetail
                            ref={detailRef}
                            role={role}
                            isNew={isNew}
                            onSave={handleSave}
                            onDirtyChange={setIsDirty}
                        />
                    ),
                    actions: isNew ? undefined : (
                        <>
                            {canDelete && (
                                <IconButton
                                    variant="ghost"
                                    size="xs"
                                    color="danger"
                                    icon="Trash"
                                    onClick={() => setRoleToDelete(role)}
                                />
                            )}
                        </>
                    ),
                };
            }),
        [allRoles, handleSave, canDelete],
    );

    const panelHeaderProps = useCallback(
        (activeItem: SplitViewItem) => {
            const isNew = activeItem.id === NEW_ROLE_ID;
            const role = isNew ? newRole : roles.find((r) => r.id === activeItem.id);
            if (!role) return undefined;
            return {
                icon: (
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                        <CustomIcon icon="Role" className="w-5 h-5" />
                    </div>
                ),
                title: isNew ? 'New Role' : (role.name ?? 'Unknown'),
                subtitle: isNew ? 'Create a new role' : (role.description ?? `${(role.users ?? []).length} user(s) assigned`),
                actions: isNew ? (
                    <>
                        <Button variant="outline" color="theme" size="sm" onClick={handleHeaderCancel}>
                            Cancel
                        </Button>
                        <Button
                            variant="solid"
                            color={themeColor}
                            size="sm"
                            loading={saving}
                            onClick={() => void handleHeaderSave()}
                        >
                            Save
                        </Button>
                    </>
                ) : undefined,
            };
        },
        [roles, newRole, saving, handleHeaderCancel, handleHeaderSave],
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
                    onRetry={() => void fetchRoles()}
                    listTitle={`Roles (${roles.length})`}
                    panelHeaderProps={panelHeaderProps}
                    autoHideList={false}
                    borderLeft
                    color={themeColor}
                    searchPlaceholder="Search roles..."
                    listActions={
                        <>
                            {canCreate && (
                                <IconButton
                                    variant="ghost"
                                    size="xs"
                                    color={themeColor}
                                    accent={true}
                                    accentColor={themeColor}
                                    icon="Add"
                                    onClick={handleAddNew}
                                />
                            )}
                        </>
                    }
                />
            </div>

            <ConfirmModal
                isOpen={!!roleToDelete}
                onClose={() => setRoleToDelete(null)}
                onConfirm={() => roleToDelete && void handleDelete(roleToDelete)}
                title="Delete Role"
                description={`Are you sure you want to delete the role "${roleToDelete?.name ?? 'this role'}"? This action cannot be undone.`}
                confirmLabel={deleting ? 'Deleting...' : 'Delete'}
                confirmColor="danger"
                confirmVariant="solid"
                isConfirmDisabled={deleting}
            />

            <ConfirmModal
                isOpen={showCancelConfirm}
                onClose={() => setShowCancelConfirm(false)}
                onConfirm={executeCancel}
                title="Discard Changes"
                description="You have unsaved changes. Are you sure you want to discard them?"
                confirmLabel="Discard"
                confirmColor="danger"
                confirmVariant="solid"
            />

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
