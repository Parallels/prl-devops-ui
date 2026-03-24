import React from 'react';
import { Alert, Button, FormField, FormLayout, Input, Modal, ModalActions, MultiToggle, type MultiToggleOption, Panel, Toggle } from '@prl/ui-kit';
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
  /** When set, hides the target toggle and locks the download target. */
  forcedTarget?: 'host' | 'orchestrator';
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
  forcedTarget,
  onClose,
  onSubmit,
  onFormChange,
}) => {
  const { themeColor } = useSystemSettings();
  const showTargetSelector = !forcedTarget && hasHostModule && hasOrchestratorModule;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Download Virtual Machine"
      description="Create a VM from this catalog manifest using asynchronous provisioning."
      size="lg"
      actions={
        <ModalActions>
          <Button variant="soft" color="slate" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="solid" color={themeColor} onClick={onSubmit} loading={loading}>
            Download VM
          </Button>
        </ModalActions>
      }
    >
      <div className="space-y-3">
        {showTargetSelector && (
          <Panel padding="xs" variant="glass" color={themeColor} tone={themeColor}>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Download Target</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Choose whether to provision this VM directly on the host or via the orchestrator.</p>
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
          </Panel>
        )}

        <Panel tone="neutral" variant="glass" padding="xs" backgroundColor="white">
          <FormLayout columns={2} gap="sm">
            <FormField label="Catalog ID" width="full">
              <Input tone={themeColor} value={catalogId} disabled />
            </FormField>
            <FormField label="Catalog Manifest ID" width="full">
              <Input tone={themeColor} value={managerId ?? 'Local catalog'} disabled />
            </FormField>
            <FormField label="Version" width="full">
              <Input tone={themeColor} value={version || 'latest'} disabled />
            </FormField>
            <FormField label="Architecture" width="full">
              <Input tone={themeColor} value={architecture || '-'} disabled />
            </FormField>
          </FormLayout>
        </Panel>

        <Panel tone="neutral" variant="glass" padding="xs" backgroundColor="white">
          <FormLayout columns={2} gap="sm">
            <FormField label="VM Name" required width="full">
              <Input tone={themeColor} placeholder="e.g. ubuntu-dev-01" value={form.name} onChange={(e) => onFormChange({ ...form, name: e.target.value })} />
            </FormField>
            <FormField label="Owner" width="full">
              <Input tone={themeColor} placeholder="e.g. johndoe" value={form.owner} onChange={(e) => onFormChange({ ...form, owner: e.target.value })} />
            </FormField>
            <FormField label="Path (optional)" width="full">
              <Input tone={themeColor} placeholder="Leave empty to use default path" value={form.path} onChange={(e) => onFormChange({ ...form, path: e.target.value })} />
            </FormField>
            <FormField width="full">
              <div className="flex items-center">
                <Toggle
                  label="Start On Create"
                  description="Start the VM as soon as provisioning is complete."
                  checked={form.startOnCreate}
                  onChange={(e) => onFormChange({ ...form, startOnCreate: e.target.checked })}
                  size="sm"
                  color={themeColor}
                />
              </div>
            </FormField>
          </FormLayout>
        </Panel>

        <Panel tone="neutral" variant="glass" padding="xs" backgroundColor="white">
          <FormLayout columns={2} gap="sm">
            <FormField label="CPU (optional)" width="full" helpText="Defaults from manifest when available.">
              <Input tone={themeColor} placeholder="e.g. 2" value={form.cpu} onChange={(e) => onFormChange({ ...form, cpu: e.target.value })} />
            </FormField>
            <FormField label="Memory (optional)" width="full" helpText="Memory in MB.">
              <Input placeholder="e.g. 4096" value={form.memory} onChange={(e) => onFormChange({ ...form, memory: e.target.value })} />
            </FormField>
          </FormLayout>
        </Panel>

        {error && <Alert tone="danger" variant="subtle" title="Validation Error" description={error} />}
      </div>
    </Modal>
  );
};
