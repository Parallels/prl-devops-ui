import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, ConfirmModal, CustomIcon, EmptyState, FormField, FormLayout, IconButton, Input, Modal, ModalActions, NotificationModal, Pill, SplitView, SplitViewPanelHeaderProps, TagPicker, type SplitViewItem } from '@prl/ui-kit';
import { devopsService } from '@/services/devops';
import { DevOpsClaim, DevOpsRole } from '@/interfaces/devops';
import { useSession } from '@/contexts/SessionContext';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { RoleDetail } from './RoleDetail';
import { PageHeaderIcon } from '@/components/PageHeader';

export const Roles: React.FC = () => {
  const [roles, setRoles] = useState<DevOpsRole[]>([]);
  const [availableClaims, setAvailableClaims] = useState<DevOpsClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>();
  const { session, hasClaim } = useSession();
  const { themeColor } = useSystemSettings();
  const hostname = session?.hostname ?? '';

  const [selectedId, setSelectedId] = useState<string | undefined>();

  const [roleToDelete, setRoleToDelete] = useState<DevOpsRole | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [saveResult, setSaveResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalName, setModalName] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [modalClaims, setModalClaims] = useState<string[]>([]);
  const [modalSaving, setModalSaving] = useState(false);

  const canCreate = useMemo(() => hasClaim('CREATE_ROLE'), [hasClaim]);
  const canDelete = useMemo(() => hasClaim('DELETE_ROLE'), [hasClaim]);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rolesResult, claimsResult] = await Promise.all([
        devopsService.roles.getRoles(hostname),
        devopsService.claims.getClaims(hostname).catch(() => []),
      ]);
      setRoles(rolesResult);
      setAvailableClaims(
        claimsResult.map((c) => ({
          id: c.id ?? '',
          name: c.name ?? '',
          description: c.description,
        } as DevOpsClaim))
      );
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

  const handleClaimsChange = useCallback((updated: DevOpsRole) => {
    setRoles((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }, []);

  const handleDelete = useCallback(
    async (role: DevOpsRole) => {
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
    setModalClaims([]);
  }, []);

  const handleModalCreate = useCallback(async () => {
    if (!modalName.trim()) return;
    setModalSaving(true);
    try {
      const created = await devopsService.roles.createRole(hostname, {
        name: modalName.trim(),
        description: modalDescription.trim() || undefined,
        ...(modalClaims.length > 0 && { claims: modalClaims }),
      });
      // Merge selected claims into the local role so the detail panel reflects them immediately
      const claimObjects = modalClaims
        .map((id) => availableClaims.find((c) => c.id === id || c.name === id))
        .filter((c): c is DevOpsClaim => c !== undefined);
      setRoles((prev) => [...prev, { ...created, claims: claimObjects }]);
      setSelectedId(created.id);
      handleModalClose();
      setSaveResult({ type: 'success', message: 'The role has been created successfully.' });
    } catch (err: any) {
      setSaveResult({ type: 'error', message: err?.message ?? 'An unexpected error occurred while creating the role.' });
    } finally {
      setModalSaving(false);
    }
  }, [hostname, modalName, modalDescription, modalClaims, availableClaims, handleModalClose]);

  const items: SplitViewItem[] = useMemo(
    () =>
      roles.map((role) => ({
        id: role.id ?? '',
        label: role.name ?? 'Unknown',
        subtitle: role.description ?? `${(role.users ?? []).length} user(s)`,
        icon: 'Roles' as const,
        panel: (
          <RoleDetail
            role={role}
            hostname={hostname}
            availableClaims={availableClaims}
            onClaimsChange={handleClaimsChange}
          />
        ),
        actions: <>{canDelete && role.users?.length ===0 && !role.internal  && <IconButton variant="ghost" size="xs" color="danger" icon="Trash" onClick={() => setRoleToDelete(role)} />}</>,
      })),
    [roles, canDelete, hostname, availableClaims, handleClaimsChange],
  );

  const panelHeaderProps = useCallback(
    (activeItem: SplitViewItem): SplitViewPanelHeaderProps | undefined => {
      const role = roles.find((r) => r.id === activeItem.id);
      if (!role) return undefined;
      return {
        icon: (
          <PageHeaderIcon color={themeColor}>
            <CustomIcon icon="Role" className="w-5 h-5" />
          </PageHeaderIcon>
        ),
        helper: {
          title: "Claims",
          content: "Claims",
          color: themeColor
        },
        actions: role.internal ? (
        <Pill tone={themeColor}>Internal</Pill>
        ): undefined,
        title: `Role: ${role.name ?? 'Unknown'}`,
        subtitle: role.description ?? `${(role.users ?? []).length} user${(role.users ?? []).length === 1 ? '' : 's'} assigned`,
      };
    },
    [roles, themeColor],
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
        size="md"
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
        <div className="space-y-4">
          <FormLayout columns={1}>
            <FormField label="Name" required>
              <Input tone={themeColor} value={modalName} onChange={(e) => setModalName(e.target.value)} placeholder="Role name" />
            </FormField>
            <FormField label="Description">
              <Input tone={themeColor} value={modalDescription} onChange={(e) => setModalDescription(e.target.value)} placeholder="Optional description" />
            </FormField>
          </FormLayout>
          <FormLayout columns={1}>
            <FormField label="Claims">
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
