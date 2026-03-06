import React from 'react';
import {
  Alert,
  Button,
  FormField,
  FormLayout,
  Input,
  Modal,
  ModalActions,
  MultiToggle,
  type MultiToggleOption,
  Toggle,
} from '@prl/ui-kit';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';

export type DownloadTarget = 'host' | 'orchestrator';

export interface DownloadVmFormData {
  owner: string;
  name: string;
  startOnCreate: boolean;
  path: string;
  cpu: string;
  memory: string;
  target: DownloadTarget;
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
  hasHostModule?: boolean;
  hasOrchestratorModule?: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onFormChange: (next: DownloadVmFormData) => void;
}

const targetOptions: MultiToggleOption[] = [
  { value: 'host', label: 'Host' },
  { value: 'orchestrator', label: 'Orchestrator' },
];

export const DownloadCatalogVmModal: React.FC<DownloadCatalogVmModalProps> = ({
  isOpen,
  loading,
  error,
  form,
  catalogId,
  version,
  architecture,
  managerId,
  hasHostModule = false,
  hasOrchestratorModule = false,
  onClose,
  onSubmit,
  onFormChange,
}) => {
  const { themeColor } = useSystemSettings();
  const showTargetSelector = hasHostModule && hasOrchestratorModule;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Download Virtual Machine"
      description="Create a VM from this catalog manifest using asynchronous provisioning."
      size="lg"
    >
      <div className="space-y-3">
        {showTargetSelector && (
          <div className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900/30">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Download Target</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Choose whether to provision this VM directly on the host or via the orchestrator.
                </p>
              </div>
              <div className="flex-none">
                <MultiToggle
                  options={targetOptions}
                  value={form.target}
                  onChange={(value) => onFormChange({ ...form, target: value as DownloadTarget })}
                  variant="solid"
                  color={themeColor}
                  adaptiveWidth
                  size="sm"
                />
              </div>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3 dark:border-neutral-700 dark:bg-neutral-900/40">
          <FormLayout columns={2} gap="sm">
            <FormField label="Catalog ID" width="full">
              <Input value={catalogId} disabled />
            </FormField>
            <FormField label="Catalog Manifest ID" width="full">
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
