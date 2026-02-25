import React, { useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { FormField, FormLayout, FormSection, Input, Pill } from '@prl/ui-kit';
import { DevOpsRolesAndClaims } from '@/interfaces/devops';
import { devopsService } from '@/services/devops';
import { useSession } from '@/contexts/SessionContext';

export interface ClaimDetailRef {
    save: () => Promise<void>;
    reset: () => void;
}

export interface ClaimDetailProps {
    claim: DevOpsRolesAndClaims;
    isNew?: boolean;
    onSave: (created: DevOpsRolesAndClaims) => void;
    onDirtyChange?: (isDirty: boolean) => void;
}

export const ClaimDetail = React.forwardRef<ClaimDetailRef, ClaimDetailProps>(
    ({ claim, isNew = false, onSave, onDirtyChange }, ref) => {
        const { session, hasClaim } = useSession();
        const hostname = session?.hostname ?? '';

        const [name, setName] = useState(claim.name ?? '');
        const [description, setDescription] = useState(claim.description ?? '');
        const [saving, setSaving] = useState(false);

        const canCreate = useMemo(() => hasClaim('CREATE_CLAIM'), [hasClaim]);

        useEffect(() => {
            setName(claim.name ?? '');
            setDescription(claim.description ?? '');
        }, [claim.id]);

        const isDirty = useMemo(() => {
            if (!isNew) return false;
            return name !== '' || description !== '';
        }, [isNew, name, description]);

        useEffect(() => {
            onDirtyChange?.(isDirty);
        }, [isDirty, onDirtyChange]);

        const handleSave = useCallback(async () => {
            if (saving || !isNew) return;
            if (!name.trim()) throw new Error('Claim name is required.');
            setSaving(true);
            try {
                const created = await devopsService.claims.createClaim(hostname, {
                    name: name.trim(),
                    description: description.trim() || undefined,
                });
                onSave(created);
            } finally {
                setSaving(false);
            }
        }, [saving, isNew, hostname, name, description, onSave]);

        const handleReset = useCallback(() => {
            setName(claim.name ?? '');
            setDescription(claim.description ?? '');
        }, [claim.name, claim.description]);

        useImperativeHandle(ref, () => ({ save: handleSave, reset: handleReset }), [handleSave, handleReset]);

        const assignedUsers = claim.users ?? [];

        return (
            <div className="p-6 space-y-6">
                <FormSection title="Details">
                    <FormLayout columns={2}>
                        <FormField label="Name">
                            <Input
                                value={isNew ? name : (claim.name ?? '')}
                                onChange={isNew && canCreate ? (e) => setName(e.target.value) : undefined}
                                disabled={!isNew || !canCreate}
                                placeholder="Claim name"
                            />
                        </FormField>
                        <FormField label="Description">
                            <Input
                                value={isNew ? description : (claim.description ?? '')}
                                onChange={isNew && canCreate ? (e) => setDescription(e.target.value) : undefined}
                                disabled={!isNew || !canCreate}
                                placeholder="Optional description"
                            />
                        </FormField>
                    </FormLayout>
                </FormSection>

                {!isNew && (
                    <FormSection title="Assigned Users">
                        {assignedUsers.length === 0 ? (
                            <p className="text-sm text-gray-400 dark:text-gray-500">No users assigned to this claim.</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {assignedUsers.map((u) => (
                                    <Pill key={u.id ?? u.username} tone="violet" variant="soft" size="sm">
                                        {u.name ?? u.username ?? u.email ?? u.id}
                                    </Pill>
                                ))}
                            </div>
                        )}
                    </FormSection>
                )}
            </div>
        );
    },
);

ClaimDetail.displayName = 'ClaimDetail';
export default ClaimDetail;
