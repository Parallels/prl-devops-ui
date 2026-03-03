import React from 'react';
import {
  Alert,
  Button,
  FormField,
  FormLayout,
  Input,
  Modal,
  ModalActions,
  Toggle,
} from '@prl/ui-kit';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';

export interface DownloadVmFormData {
  owner: string;
  name: string;
  startOnCreate: boolean;
  path: string;
  cpu: string;
  memory: string;
}

interface DownloadCatalogVmModalProps {
  isOpen: boolean;
  loading: boolean;
  error: string | null;
  form: DownloadVmFormData;
  catalogId: string;
  version?: string;
  architecture?: string;
  managerId?: string;
  onClose: () => void;
  onSubmit: () => void;
  onFormChange: (next: DownloadVmFormData) => void;
}

export const DownloadCatalogVmModal: React.FC<DownloadCatalogVmModalProps> = ({
  isOpen,
  loading,
  error,
  form,
  catalogId,
  version,
  architecture,
  managerId,
  onClose,
  onSubmit,
  onFormChange,
}) => {
  const { themeColor } = useSystemSettings();
  return (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="Download Virtual Machine"
    description="Create a VM from this catalog manifest using asynchronous provisioning."
    size="lg"
  >
    <div className="space-y-3">
      <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3 dark:border-neutral-700 dark:bg-neutral-900/40">
        <FormLayout columns={2} gap="sm">
          <FormField label="Catalog ID" width="full">
            <Input value={catalogId} disabled />
          </FormField>
          <FormField label="Catalog Manager ID" width="full">
            <Input value={managerId ?? 'Local catalog'} disabled />
          </FormField>
          <FormField label="Version" width="full">
            <Input value={version || 'latest'} disabled />
          </FormField>
          <FormField label="Architecture" width="full">
            <Input value={architecture || '-'} disabled />
          </FormField>
        </FormLayout>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900/30">
        <FormLayout columns={2} gap="sm">
          <FormField label="VM Name" required width="full">
            <Input
              placeholder="e.g. ubuntu-dev-01"
              value={form.name}
              onChange={(e) => onFormChange({ ...form, name: e.target.value })}
            />
          </FormField>
          <FormField label="Owner" width="full">
            <Input
              placeholder="e.g. johndoe"
              value={form.owner}
              onChange={(e) => onFormChange({ ...form, owner: e.target.value })}
            />
          </FormField>
          <FormField label="Path (optional)" width="full">
            <Input
              placeholder="Leave empty to use default path"
              value={form.path}
              onChange={(e) => onFormChange({ ...form, path: e.target.value })}
            />
          </FormField>
          <div className="flex items-end">
            <Toggle
              label="Start On Create"
              description="Start the VM as soon as provisioning is complete."
              checked={form.startOnCreate}
              onChange={(e) => onFormChange({ ...form, startOnCreate: e.target.checked })}
              size="sm"
              color="blue"
            />
          </div>
        </FormLayout>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900/30">
        <FormLayout columns={2} gap="sm">
          <FormField label="CPU (optional)" width="full" helpText="Defaults from manifest when available.">
            <Input
              placeholder="e.g. 2"
              value={form.cpu}
              onChange={(e) => onFormChange({ ...form, cpu: e.target.value })}
            />
          </FormField>
          <FormField label="Memory (optional)" width="full" helpText="Memory in MB.">
            <Input
              placeholder="e.g. 4096"
              value={form.memory}
              onChange={(e) => onFormChange({ ...form, memory: e.target.value })}
            />
          </FormField>
        </FormLayout>
      </div>

      {error && (
        <Alert tone="danger" variant="subtle" title="Validation Error" description={error} />
      )}
    </div>

    <ModalActions>
      <Button variant="soft" color="slate" onClick={onClose} disabled={loading}>
        Cancel
      </Button>
      <Button variant="solid" color={themeColor} onClick={onSubmit} loading={loading}>
        Download VM
      </Button>
    </ModalActions>
  </Modal>
  );
};
