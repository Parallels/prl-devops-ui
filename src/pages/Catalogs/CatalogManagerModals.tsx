import React from 'react';
import {
  Alert,
  Button,
  DeleteConfirmModal,
  FormField,
  FormLayout,
  Input,
  Modal,
  ModalActions,
  Select,
  Toggle,
} from '@prl/ui-kit';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { CatalogManager } from '@/interfaces/CatalogManager';
import { CatalogManagerFormData } from './CatalogModels';

interface CatalogManagerEditorModalProps {
  isOpen: boolean;
  isEditMode: boolean;
  showAdvancedFlags: boolean;
  savingManager: boolean;
  isFormDirty: boolean;
  managerForm: CatalogManagerFormData;
  managerFormError: string | null;
  onClose: () => void;
  onSave: () => void;
  onFormChange: (next: CatalogManagerFormData) => void;
}

export const CatalogManagerEditorModal: React.FC<CatalogManagerEditorModalProps> = ({
  isOpen,
  isEditMode,
  showAdvancedFlags,
  savingManager,
  isFormDirty,
  managerForm,
  managerFormError,
  onClose,
  onSave,
  onFormChange,
}) => {
  const { themeColor } = useSystemSettings();
  return (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={isEditMode ? 'Edit Catalog Manager' : 'Add Catalog Manager'}
    description={isEditMode ? 'Update catalog manager connectivity and access settings.' : 'Create a new catalog manager connection.'}
    size="lg"
  >
    <div className="space-y-3">
      <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3 dark:border-neutral-700 dark:bg-neutral-900/40">
        <FormLayout columns={2} gap="sm">
          <FormField label="Manager Name" required width="full" helpText="Display name shown in the catalog source list.">
            <Input
              placeholder="e.g. Shared QA Catalog"
              value={managerForm.name}
              onChange={(e) => onFormChange({ ...managerForm, name: e.target.value })}
            />
          </FormField>

          <FormField label="Manager URL" required width="full" helpText="Base URL for the catalog manager endpoint.">
            <Input
              placeholder="https://catalog.example.com"
              value={managerForm.url}
              onChange={(e) => onFormChange({ ...managerForm, url: e.target.value })}
            />
          </FormField>
        </FormLayout>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900/30">
        <FormLayout columns={2} gap="sm">
          <FormField label="Authentication Method" width="full">
            <Select
              value={managerForm.authentication_method}
              onChange={(e) =>
                onFormChange({
                  ...managerForm,
                  authentication_method: e.target.value as 'credentials' | 'api_key',
                })
              }
            >
              <option value="credentials">Credentials</option>
              <option value="api_key">API Key</option>
            </Select>
          </FormField>

          {managerForm.authentication_method === 'credentials' ? (
            <>
              <FormField label="Username" required width="full">
                <Input
                  placeholder="Username"
                  value={managerForm.username}
                  onChange={(e) => onFormChange({ ...managerForm, username: e.target.value })}
                />
              </FormField>
              <FormField label="Password" required width="full">
                <Input
                  type="password"
                  placeholder="Password"
                  value={managerForm.password}
                  onChange={(e) => onFormChange({ ...managerForm, password: e.target.value })}
                />
              </FormField>
            </>
          ) : (
            <FormField label="API Key" required width="full">
              <Input
                type="password"
                placeholder="API Key"
                value={managerForm.api_key}
                onChange={(e) => onFormChange({ ...managerForm, api_key: e.target.value })}
              />
            </FormField>
          )}
        </FormLayout>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900/30">
        <FormLayout columns={1} gap="sm">
          <FormField
            label="Required Claims"
            width="full"
            helpText="Comma-separated list of claims required to use this manager."
          >
            <Input
              placeholder="e.g. LIST_CATALOG_MANIFEST, CREATE_CATALOG_MANIFEST"
              value={managerForm.required_claims}
              onChange={(e) => onFormChange({ ...managerForm, required_claims: e.target.value })}
            />
          </FormField>

          <div className={`grid grid-cols-1 gap-2 ${showAdvancedFlags ? 'sm:grid-cols-3' : 'sm:grid-cols-1'}`}>
            <Toggle
              label="Active"
              description="Enables this manager for catalog operations."
              checked={managerForm.active}
              onChange={(e) => onFormChange({ ...managerForm, active: e.target.checked })}
              size="sm"
              color="blue"
            />
            {showAdvancedFlags && (
              <Toggle
                label="Internal"
                description="Marks manager as internal-only."
                checked={managerForm.internal}
                onChange={(e) => onFormChange({ ...managerForm, internal: e.target.checked })}
                size="sm"
                color="blue"
              />
            )}
            {showAdvancedFlags && (
              <Toggle
                label="Global"
                description="Makes manager available globally."
                checked={managerForm.global}
                onChange={(e) => onFormChange({ ...managerForm, global: e.target.checked })}
                size="sm"
                color="blue"
              />
            )}
          </div>

          {!showAdvancedFlags && (
            <Alert
              tone="info"
              variant="subtle"
              title="Restricted Fields"
              description="Your permissions allow own-scope operations only, so Internal and Global flags are not editable."
            />
          )}
        </FormLayout>
      </div>

      {managerFormError && (
        <Alert tone="danger" variant="subtle" title="Validation Error" description={managerFormError} />
      )}
    </div>

    <ModalActions>
      <Button variant="soft" color="slate" onClick={onClose} disabled={savingManager}>
        Cancel
      </Button>
      {(!isEditMode || isFormDirty) && (
        <Button
          variant="solid"
          color={themeColor}
          onClick={onSave}
          loading={savingManager}
        >
          Save
        </Button>
      )}
    </ModalActions>
  </Modal>
  );
};

interface DeleteCatalogManagerModalProps {
  manager: CatalogManager | null;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteCatalogManagerModal: React.FC<DeleteCatalogManagerModalProps> = ({
  manager,
  deleting,
  onClose,
  onConfirm,
}) => (
  <DeleteConfirmModal
    isOpen={!!manager}
    onClose={onClose}
    onConfirm={onConfirm}
    title="Delete Catalog Manager"
    icon="Trash"
    confirmLabel={deleting ? 'Deleting…' : 'Delete'}
    isConfirmDisabled={deleting}
    confirmValue={manager?.name ?? ''}
    confirmValueLabel="catalog manager name"
    size="md"
  >
    <p className="text-sm text-neutral-500 dark:text-neutral-400">
      This action is irreversible. Catalog access through this manager will be removed immediately.
    </p>
  </DeleteConfirmModal>
);
