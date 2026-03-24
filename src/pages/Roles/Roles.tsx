import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, ConfirmModal, CustomIcon, EmptyState, FormField, FormLayout, IconButton, Input, Modal, ModalActions, NotificationModal, SplitView, type SplitViewItem } from '@prl/ui-kit';
import { devopsService } from '@/services/devops';
import { DevOpsRolesAndClaims } from '@/interfaces/devops';
import { useSession } from '@/contexts/SessionContext';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { RoleDetail } from './RoleDetail';
import { PageHeaderIcon } from '@/components/PageHeader';

export const Roles: React.FC = () => {
  const [roles, setRoles] = useState<DevOpsRolesAndClaims[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>();
  const { session, hasClaim } = useSession();
  const { themeColor } = useSystemSettings();
  const hostname = session?.hostname ?? '';

  const [selectedId, setSelectedId] = useState<string | undefined>();

  const [roleToDelete, setRoleToDelete] = useState<DevOpsRolesAndClaims | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [saveResult, setSaveResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalName, setModalName] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [modalSaving, setModalSaving] = useState(false);

  const canCreate = useMemo(() => hasClaim('CREATE_ROLE'), [hasClaim]);
  const canDelete = useMemo(() => hasClaim('DELETE_ROLE'), [hasClaim]);

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

  const handleDelete = useCallback(
    async (role: DevOpsRolesAndClaims) => {
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
    },
    [hostname, selectedId],
  );

  const handleAddNew = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setShowCreateModal(false);
    setModalName('');
    setModalDescription('');
  }, []);

  const handleModalCreate = useCallback(async () => {
    if (!modalName.trim()) return;
    setModalSaving(true);
    try {
      const created = await devopsService.roles.createRole(hostname, {
        name: modalName.trim(),
        description: modalDescription.trim() || undefined,
      });
      setRoles((prev) => [...prev, created]);
      setSelectedId(created.id);
      handleModalClose();
      setSaveResult({ type: 'success', message: 'The role has been created successfully.' });
    } catch (err: any) {
      setSaveResult({ type: 'error', message: err?.message ?? 'An unexpected error occurred while creating the role.' });
    } finally {
      setModalSaving(false);
    }
  }, [hostname, modalName, modalDescription, handleModalClose]);

  const items: SplitViewItem[] = useMemo(
    () =>
      roles.map((role) => ({
        id: role.id ?? '',
        label: role.name ?? 'Unknown',
        subtitle: role.description ?? `${(role.users ?? []).length} user(s)`,
        icon: 'Roles' as const,
        panel: <RoleDetail role={role} />,
        actions: <>{canDelete && <IconButton variant="ghost" size="xs" color="danger" icon="Trash" onClick={() => setRoleToDelete(role)} />}</>,
      })),
    [roles, canDelete],
  );

  const panelHeaderProps = useCallback(
    (activeItem: SplitViewItem) => {
      const role = roles.find((r) => r.id === activeItem.id);
      if (!role) return undefined;
      return {
        icon: (
          <PageHeaderIcon color={themeColor}>
            <CustomIcon icon="Role" className="w-5 h-5" />
          </PageHeaderIcon>
        ),
        title: `Role: ${role.name ?? 'Unknown'}`,
        subtitle: role.description ?? `${(role.users ?? []).length} user${(role.users ?? []).length === 1 ? '' : 's'} assigned`,
      };
    },
    [roles, themeColor],
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
          panelEmptyState={
            <EmptyState
              disableBorder
              icon="Roles"
              title="No roles found"
              subtitle="There are no roles in the system. Click the button below to create the first one."
              actionColor={themeColor}
              actionLeadingIcon="Add"
              actionVariant="soft"
              actionLabel="Add Role"
              onAction={canCreate ? handleAddNew : undefined}
            />
          }
          searchPlaceholder="Search roles..."
          listActions={<>{canCreate && <IconButton variant="ghost" size="xs" color={themeColor} icon="Add" onClick={handleAddNew} />}</>}
        />
      </div>

      {/* Create Role Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={handleModalClose}
        title="Add Role"
        description="Create a new role."
        size="sm"
        icon="Roles"
        actions={
          <ModalActions>
            <Button variant="outline" color="theme" size="sm" onClick={handleModalClose} disabled={modalSaving}>
              Cancel
            </Button>
            <Button variant="soft" color={themeColor} size="sm" loading={modalSaving} disabled={!modalName.trim()} onClick={() => void handleModalCreate()}>
              Create
            </Button>
          </ModalActions>
        }
      >
        <FormLayout columns={1}>
          <FormField label="Name" required>
            <Input tone={themeColor} value={modalName} onChange={(e) => setModalName(e.target.value)} placeholder="Role name" />
          </FormField>
          <FormField label="Description">
            <Input tone={themeColor} value={modalDescription} onChange={(e) => setModalDescription(e.target.value)} placeholder="Optional description" />
          </FormField>
        </FormLayout>
      </Modal>

      {/* Delete Confirm Modal */}
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
