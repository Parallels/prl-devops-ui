import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, ConfirmModal, CustomIcon, IconButton, NotificationModal, SplitView, type SplitViewItem } from '@prl/ui-kit';
import { devopsService } from '@/services/devops';
import { DevOpsRolesAndClaims } from '@/interfaces/devops';
import { useSession } from '@/contexts/SessionContext';
import { ClaimDetail, type ClaimDetailRef } from './ClaimDetail';
import { PageHeader, PageHeaderIcon } from '@/components/PageHeader';

const NEW_CLAIM_ID = '__new__';

export const Claims: React.FC = () => {
    const [claims, setClaims] = useState<DevOpsRolesAndClaims[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>();
    const { session, hasClaim } = useSession();
    const hostname = session?.hostname ?? '';

    const [selectedId, setSelectedId] = useState<string | undefined>();
    const [newClaim, setNewClaim] = useState<DevOpsRolesAndClaims | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [saving, setSaving] = useState(false);

    const [claimToDelete, setClaimToDelete] = useState<DevOpsRolesAndClaims | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [saveResult, setSaveResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const canCreate = useMemo(() => hasClaim('CREATE_CLAIM'), [hasClaim]);
    const canDelete = useMemo(() => hasClaim('DELETE_CLAIM'), [hasClaim]);

    const detailRef = useRef<ClaimDetailRef>(null);

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

    const handleSave = useCallback((created: DevOpsRolesAndClaims) => {
        setClaims((prev) => [...prev, created]);
        setNewClaim(null);
        setSelectedId(created.id);
        setIsDirty(false);
    }, []);

    const handleDelete = useCallback(async (claim: DevOpsRolesAndClaims) => {
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
    }, [hostname, selectedId]);

    const handleAddNew = useCallback(() => {
        if (newClaim) return;
        const empty: DevOpsRolesAndClaims = { id: NEW_CLAIM_ID, name: '', description: '', users: [] };
        setNewClaim(empty);
        setSelectedId(NEW_CLAIM_ID);
    }, [newClaim]);

    const handleCancelNew = useCallback(() => {
        setNewClaim(null);
        setIsDirty(false);
        setSelectedId(claims[0]?.id);
    }, [claims]);

    const executeCancel = useCallback(() => {
        setShowCancelConfirm(false);
        if (newClaim) {
            handleCancelNew();
        } else {
            detailRef.current?.reset();
        }
    }, [newClaim, handleCancelNew]);

    const handleHeaderSave = useCallback(async () => {
        setSaving(true);
        try {
            await detailRef.current?.save();
            setSaveResult({ type: 'success', message: 'The claim has been created successfully.' });
        } catch (err: any) {
            setSaveResult({ type: 'error', message: err?.message ?? 'An unexpected error occurred while saving.' });
        } finally {
            setSaving(false);
        }
    }, []);

    const handleHeaderCancel = useCallback(() => {
        if (isDirty) {
            setShowCancelConfirm(true);
        } else if (newClaim) {
            handleCancelNew();
        }
    }, [isDirty, newClaim, handleCancelNew]);

    const allClaims = useMemo(() => (newClaim ? [newClaim, ...claims] : claims), [claims, newClaim]);

    const items: SplitViewItem[] = useMemo(
        () =>
            allClaims.map((claim) => {
                const isNew = claim.id === NEW_CLAIM_ID;
                return {
                    id: claim.id ?? '',
                    label: isNew ? 'New Claim' : (claim.name ?? 'Unknown'),
                    subtitle: isNew ? 'Fill in the details below' : (claim.description ?? `${(claim.users ?? []).length} user(s)`),
                    icon: 'Claims' as const,
                    badges: isNew ? [{ label: 'New', tone: 'green' as const }] : undefined,
                    panel: (
                        <ClaimDetail
                            ref={detailRef}
                            claim={claim}
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
                                    onClick={() => setClaimToDelete(claim)}
                                />
                            )}
                        </>
                    ),
                };
            }),
        [allClaims, handleSave, canDelete],
    );

    const panelHeader = useCallback(
        (activeItem: SplitViewItem) => {
            const isNew = activeItem.id === NEW_CLAIM_ID;
            const claim = isNew ? newClaim : claims.find((c) => c.id === activeItem.id);
            if (!claim) return null;
            return (
                <PageHeader
                    icon={<PageHeaderIcon color="rose"><CustomIcon icon="Claim" className="w-5 h-5" /></PageHeaderIcon>}
                    title={isNew ? 'New Claim' : (claim.name ?? 'Unknown')}
                    subtitle={isNew ? 'Create a new claim' : (claim.description ?? `${(claim.users ?? []).length} user(s) assigned`)}
                    actions={isNew ? (
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
        [claims, newClaim, saving, handleHeaderCancel, handleHeaderSave],
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
                    panelHeader={panelHeader}
                    autoHideList={false}
                    borderLeft
                    color="parallels"
                    searchPlaceholder="Search claims..."
                    listActions={
                        <>
                            {canCreate && (
                                <IconButton
                                    variant="ghost"
                                    size="xs"
                                    color="parallels"
                                    accent={true}
                                    accentColor="parallels"
                                    icon="Add"
                                    onClick={handleAddNew}
                                />
                            )}
                        </>
                    }
                />
            </div>

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
