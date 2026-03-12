import React, { useEffect, useId, useState } from 'react';
import { Checkbox, ConfirmModal, DeleteConfirmModal, FormField, Input } from '@prl/ui-kit';
import { VirtualMachine } from '@/interfaces/VirtualMachine';

// ── Clone VM modal ────────────────────────────────────────────────────────────

export interface CloneVmModalProps {
    isOpen: boolean;
    vm: VirtualMachine | null;
    loading?: boolean;
    onClose: () => void;
    onConfirm: (cloneName: string, destinationPath: string) => void;
}

export const CloneVmModal: React.FC<CloneVmModalProps> = ({
    isOpen,
    vm,
    loading = false,
    onClose,
    onConfirm,
}) => {
    const nameId = useId();
    const pathId = useId();

    const [cloneName, setCloneName] = useState('');
    const [destPath, setDestPath] = useState('');
    const [nameError, setNameError] = useState('');

    // Pre-fill name whenever the target VM changes
    useEffect(() => {
        if (isOpen && vm) {
            setCloneName(`${vm.Name ?? 'VM'} Clone`);
            setDestPath('');
            setNameError('');
        }
    }, [isOpen, vm]);

    const handleConfirm = () => {
        if (!cloneName.trim()) {
            setNameError('Clone name is required.');
            return;
        }
        onConfirm(cloneName.trim(), destPath.trim());
    };

    return (
        <ConfirmModal
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={handleConfirm}
            title="Clone Virtual Machine"
            description={vm ? `Create a copy of "${vm.Name}"` : undefined}
            icon="Clone"
            size="sm"
            confirmLabel="Clone"
            confirmColor="blue"
            loading={loading}
            loadingTitle="Cloning…"
            loadingLabel="Creating a copy of the virtual machine"
            closeOnBackdropClick={!loading}
            closeOnEsc={!loading}
        >
            <div className="space-y-4">
                <FormField
                    label="Clone Name"
                    labelFor={nameId}
                    required
                    error={nameError}
                    validationStatus={nameError ? 'error' : 'none'}
                    hint="The name that will be given to the new virtual machine."
                >
                    <Input
                        id={nameId}
                        placeholder="e.g. My VM Clone"
                        value={cloneName}
                        tone="blue"
                        disabled={loading}
                        onChange={(e) => {
                            setCloneName(e.target.value);
                            if (e.target.value.trim()) setNameError('');
                        }}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); }}
                    />
                </FormField>

                <FormField
                    label="Destination Path"
                    labelFor={pathId}
                    hint="Leave blank to use the default storage location."
                >
                    <Input
                        id={pathId}
                        placeholder="e.g. /Users/admin/Parallels"
                        value={destPath}
                        tone="blue"
                        disabled={loading}
                        onChange={(e) => setDestPath(e.target.value)}
                    />
                </FormField>
            </div>
        </ConfirmModal>
    );
};

// ── Delete VM modal ───────────────────────────────────────────────────────────
//
// Thin wrapper around DeleteConfirmModal so callers don't need to manually
// wire up the confirmValue — just pass the VM.

export interface DeleteVmModalProps {
    isOpen: boolean;
    vm: VirtualMachine | null;
    loading?: boolean;
    onClose: () => void;
    onConfirm: (force: boolean) => void;
}

export const DeleteVmModal: React.FC<DeleteVmModalProps> = ({
    isOpen,
    vm,
    loading = false,
    onClose,
    onConfirm,
}) => {
    const [forceDelete, setForceDelete] = useState(false);

    const isRunning = vm
        ? !['stopped', 'error'].includes((vm.State ?? '').toLowerCase())
        : false;

    useEffect(() => {
        if (!isOpen) setForceDelete(false);
    }, [isOpen]);

    return (
        <DeleteConfirmModal
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={() => onConfirm(forceDelete)}
            title="Delete Virtual Machine"
            description={vm ? `This will permanently remove "${vm.Name}" and cannot be undone.` : undefined}
            icon="Trash"
            size={isRunning ? 'md' : 'sm'}
            confirmValue={vm?.Name ?? ''}
            confirmValueLabel="VM name"
            confirmLabel="Delete"
            loading={loading}
            loadingTitle="Deleting…"
            loadingLabel="Removing the virtual machine"
            closeOnBackdropClick={!loading}
            closeOnEsc={!loading}
            isConfirmDisabled={isRunning && !forceDelete}
        >
            <div className="flex flex-col gap-3">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    All files associated with this virtual machine will be deleted from disk.
                    This action <strong className="text-neutral-800 dark:text-neutral-200">cannot be undone</strong>.
                </p>

                {isRunning && (
                    <>
                        <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 dark:border-amber-700 dark:bg-amber-950/40">
                            <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                            <p className="text-sm text-amber-800 dark:text-amber-300">
                                <strong>This VM is currently {vm?.State}.</strong> You must force delete to remove a running virtual machine.
                            </p>
                        </div>

                        <Checkbox
                            label="Force delete — stop and remove the VM even if it is currently running"
                            checked={forceDelete}
                            onChange={(e) => setForceDelete(e.target.checked)}
                            color="rose"
                            disabled={loading}
                        />
                    </>
                )}
            </div>
        </DeleteConfirmModal>
    );
};
