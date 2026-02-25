import React, { useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { FormField, FormLayout, FormSection, Input, Pill } from '@prl/ui-kit';
import { DevOpsRolesAndClaims } from '@/interfaces/devops';
import { devopsService } from '@/services/devops';
import { useSession } from '@/contexts/SessionContext';

export interface RoleDetailRef {
    save: () => Promise<void>;
    reset: () => void;
}

export interface RoleDetailProps {
    role: DevOpsRolesAndClaims;
    isNew?: boolean;
    onSave: (created: DevOpsRolesAndClaims) => void;
    onDirtyChange?: (isDirty: boolean) => void;
}

export const RoleDetail = React.forwardRef<RoleDetailRef, RoleDetailProps>(
    ({ role, isNew = false, onSave, onDirtyChange }, ref) => {
        const { session, hasClaim } = useSession();
        const hostname = session?.hostname ?? '';

        const [name, setName] = useState(role.name ?? '');
        const [description, setDescription] = useState(role.description ?? '');
        const [saving, setSaving] = useState(false);

        const canCreate = useMemo(() => hasClaim('CREATE_ROLE'), [hasClaim]);

        useEffect(() => {
            setName(role.name ?? '');
            setDescription(role.description ?? '');
        }, [role.id]);

        const isDirty = useMemo(() => {
            if (!isNew) return false;
            return name !== '' || description !== '';
        }, [isNew, name, description]);

        useEffect(() => {
            onDirtyChange?.(isDirty);
        }, [isDirty, onDirtyChange]);

        const handleSave = useCallback(async () => {
            if (saving || !isNew) return;
            if (!name.trim()) throw new Error('Role name is required.');
            setSaving(true);
            try {
                const created = await devopsService.roles.createRole(hostname, {
                    name: name.trim(),
                    description: description.trim() || undefined,
                });
                onSave(created);
            } finally {
                setSaving(false);
            }
        }, [saving, isNew, hostname, name, description, onSave]);

        const handleReset = useCallback(() => {
            setName(role.name ?? '');
            setDescription(role.description ?? '');
        }, [role.name, role.description]);

        useImperativeHandle(ref, () => ({ save: handleSave, reset: handleReset }), [handleSave, handleReset]);

        const assignedUsers = role.users ?? [];

        return (
            <div className="p-6 space-y-6">
                <FormSection title="Details">
                    <FormLayout columns={2}>
                        <FormField label="Name">
                            <Input
                                value={isNew ? name : (role.name ?? '')}
                                onChange={isNew && canCreate ? (e) => setName(e.target.value) : undefined}
                                disabled={!isNew || !canCreate}
                                placeholder="Role name"
                            />
                        </FormField>
                        <FormField label="Description">
                            <Input
                                value={isNew ? description : (role.description ?? '')}
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
                            <p className="text-sm text-gray-400 dark:text-gray-500">No users assigned to this role.</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {assignedUsers.map((u) => (
                                    <Pill key={u.id ?? u.username} tone="blue" variant="soft" size="sm">
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

RoleDetail.displayName = 'RoleDetail';
export default RoleDetail;
