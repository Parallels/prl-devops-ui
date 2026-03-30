import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, ConfirmModal, CustomIcon, EmptyState, FormField, FormLayout, IconButton, Input, Modal, ModalActions, NotificationModal, Pill, SplitView, SplitViewPanelHeaderProps, type SplitViewItem } from '@prl/ui-kit';
import { devopsService } from '@/services/devops';
import { DevOpsClaim } from '@/interfaces/devops';
import { useSession } from '@/contexts/SessionContext';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { ClaimDetail } from './ClaimDetail';
import { PageHeaderIcon } from '@/components/PageHeader';

export const Claims: React.FC = () => {
  const [claims, setClaims] = useState<DevOpsClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>();
  const { session, hasClaim } = useSession();
  const { themeColor } = useSystemSettings();
  const hostname = session?.hostname ?? '';

  const [selectedId, setSelectedId] = useState<string | undefined>();

  const [claimToDelete, setClaimToDelete] = useState<DevOpsClaim | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [saveResult, setSaveResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalName, setModalName] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [modalSaving, setModalSaving] = useState(false);

  const canCreate = useMemo(() => hasClaim('CREATE_CLAIM'), [hasClaim]);
  const canDelete = useMemo(() => hasClaim('DELETE_CLAIM'), [hasClaim]);

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await devopsService.claims.getClaims(hostname);
      setClaims(result);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load claims');
      console.error('Failed to fetch claims:', err);
    } finally {
      setLoading(false);
    }
  }, [hostname]);

  useEffect(() => {
    void fetchClaims();
  }, [fetchClaims]);

  const handleDelete = useCallback(
    async (claim: DevOpsClaim) => {
      if (!claim.id) return;
      setDeleting(true);
      try {
        await devopsService.claims.removeClaim(hostname, claim.id);
        setClaims((prev) => prev.filter((c) => c.id !== claim.id));
        setClaimToDelete(null);
        if (selectedId === claim.id) setSelectedId(undefined);
      } catch (err) {
        console.error('Failed to delete claim:', err);
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
      const created = await devopsService.claims.createClaim(hostname, {
        name: modalName.trim(),
        description: modalDescription.trim() || undefined,
      });
      setClaims((prev) => [...prev, created]);
      setSelectedId(created.id);
      handleModalClose();
      setSaveResult({ type: 'success', message: 'The claim has been created successfully.' });
    } catch (err: any) {
      setSaveResult({ type: 'error', message: err?.message ?? 'An unexpected error occurred while creating the claim.' });
    } finally {
      setModalSaving(false);
    }
  }, [hostname, modalName, modalDescription, handleModalClose]);

  const items: SplitViewItem[] = useMemo(
    () =>
      claims.map((claim) => ({
        id: claim.id ?? '',
        label: claim.name ?? 'Unknown',
        subtitle: claim.description ?? `${(claim.users ?? []).length} user(s)`,
        icon: 'Claims' as const,
        panel: <ClaimDetail claim={claim} />,
        actions: <>{canDelete && claim.users?.length === 0 && !claim.internal && <IconButton variant="ghost" size="xs" color="danger" icon="Trash" onClick={() => setClaimToDelete(claim)} />}</>,
      })),
    [claims, canDelete],
  );

  const panelHeaderProps = useCallback(
    (activeItem: SplitViewItem): SplitViewPanelHeaderProps | undefined => {
      const claim = claims.find((c) => c.id === activeItem.id);
      if (!claim) return undefined;
      return {
        icon: (
          <PageHeaderIcon color={themeColor}>
            <CustomIcon icon="Claim" className="w-5 h-5" />
          </PageHeaderIcon>
        ),
        helper: {
          title: "Claims",
          content: "Claims",
          color: themeColor
        },
        actions: claim.internal ? (
        <Pill tone={themeColor}>Internal</Pill>
        ): undefined,
        title: `Claim: ${claim.name ?? 'Unknown'}`,
        subtitle: claim.description ?? `${(claim.users ?? []).length} user(s) assigned`,
      };
    },
    [claims, themeColor],
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
          onRetry={() => void fetchClaims()}
          listTitle={`Claims (${claims.length})`}
          panelHeaderProps={panelHeaderProps}
          autoHideList={false}
          borderLeft
          color={themeColor}
          searchPlaceholder="Search claims..."
          panelEmptyState={
            <EmptyState
              disableBorder
              icon="Claims"
              title="No claims found"
              subtitle="There are no claims in the system. Click the button below to create the first one."
              actionColor={themeColor}
              actionLeadingIcon="Add"
              actionVariant="soft"
              actionLabel="Add Claim"
              onAction={canCreate ? handleAddNew : undefined}
            />
          }
          listActions={<>{canCreate && <IconButton variant="ghost" size="xs" color={themeColor} icon="Add" onClick={handleAddNew} />}</>}
        />
      </div>

      {/* Create Claim Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={handleModalClose}
        title="Add Claim"
        description="Create a new claim."
        size="sm"
        icon="Claims"
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
            <Input tone={themeColor} value={modalName} onChange={(e) => setModalName(e.target.value)} placeholder="Claim name" />
          </FormField>
          <FormField label="Description">
            <Input tone={themeColor} value={modalDescription} onChange={(e) => setModalDescription(e.target.value)} placeholder="Optional description" />
          </FormField>
        </FormLayout>
      </Modal>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!claimToDelete}
        onClose={() => setClaimToDelete(null)}
        onConfirm={() => claimToDelete && void handleDelete(claimToDelete)}
        title="Delete Claim"
        description={`Are you sure you want to delete the claim "${claimToDelete?.name ?? 'this claim'}"? This action cannot be undone.`}
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
