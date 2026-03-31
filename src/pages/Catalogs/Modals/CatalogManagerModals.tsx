import React from 'react';
import { Alert, Button, DeleteConfirmModal, FormField, FormLayout, Input, Modal, ModalActions, Panel, Select, TagPicker, Toggle } from '@prl/ui-kit';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { CatalogManager } from '@/interfaces/CatalogManager';
import { CatalogManagerFormData } from '../CatalogModels';

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
      icon={isEditMode ? 'Edit' : 'Add'}
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Catalog Manager' : 'Add Catalog Service'}
      description={isEditMode ? 'Update catalog service connectivity and access settings.' : 'Create a connection to a new catalog service hosted remotely.'}
      size="lg"
    >
      <div className="space-y-3">
        <Panel backgroundColor="white" variant="glass" padding="xs">
          <FormLayout columns={2} gap="sm">
            <FormField label="Catalog Name" required width="full" helpText="Display name shown in the catalog source list.">
              <Input tone={themeColor} placeholder="e.g. Shared QA Catalog" value={managerForm.name} onChange={(e) => onFormChange({ ...managerForm, name: e.target.value })} />
            </FormField>

            <FormField label="Catalog URL" required width="full" helpText="Base URL for the catalog manager endpoint.">
              <Input tone={themeColor} placeholder="https://catalog.example.com" value={managerForm.url} onChange={(e) => onFormChange({ ...managerForm, url: e.target.value })} />
            </FormField>
          </FormLayout>
        </Panel>

        <Panel backgroundColor="white" variant="glass" padding="xs">
          <FormField label="Authentication Method" width="full">
              <Select
                value={managerForm.authentication_method}
                tone={themeColor}
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
          <FormLayout columns={managerForm.authentication_method === 'credentials' ? 2 : 1} gap="sm">
            {managerForm.authentication_method === 'credentials' ? (
              <>
                <FormField label="Username" required width="full">
                  <Input tone={themeColor} placeholder="Username" value={managerForm.username} onChange={(e) => onFormChange({ ...managerForm, username: e.target.value })} />
                </FormField>
                <FormField label="Password" required width="full">
                  <Input tone={themeColor} type="password" placeholder="Password" value={managerForm.password} onChange={(e) => onFormChange({ ...managerForm, password: e.target.value })} />
                </FormField>
              </>
            ) : (
              <FormField label="API Key" required width="full">
                <Input tone={themeColor} type="password" placeholder="API Key" value={managerForm.api_key} onChange={(e) => onFormChange({ ...managerForm, api_key: e.target.value })} />
              </FormField>
            )}
          </FormLayout>
        </Panel>

        <Panel backgroundColor="white" variant="glass" padding="xs">
          <FormLayout columns={1} gap="sm">
            <FormField label="Required Claims" width="full" helpText="Claims required to use this manager. Tags are uppercased automatically.">
              <TagPicker
                color={themeColor}
                items={[]}
                allowCreate
                escapeBoundary
                value={managerForm.required_claims}
                placeholder="e.g. LIST_CATALOG_MANIFEST"
                onChange={(values) => onFormChange({ ...managerForm, required_claims: values.map((v) => v.toUpperCase()) })}
              />
            </FormField>

            <div className={`grid grid-cols-1 gap-2 ${showAdvancedFlags ? 'sm:grid-cols-3' : 'sm:grid-cols-1'}`}>
              <Toggle
                label="Active"
                description="Enables this manager for catalog operations."
                checked={managerForm.active}
                onChange={(e) => onFormChange({ ...managerForm, active: e.target.checked })}
                size="sm"
                color={themeColor}
              />
              {showAdvancedFlags && (
                <Toggle
                  label="Internal"
                  description="Marks manager as internal-only."
                  checked={managerForm.internal}
                  onChange={(e) => onFormChange({ ...managerForm, internal: e.target.checked })}
                  size="sm"
                  color={themeColor}
                />
              )}
              {showAdvancedFlags && (
                <Toggle
                  label="Global"
                  description="Makes manager available globally."
                  checked={managerForm.global}
                  onChange={(e) => onFormChange({ ...managerForm, global: e.target.checked })}
                  size="sm"
                  color={themeColor}
                />
              )}
            </div>

            {!showAdvancedFlags && (
              <Alert tone="info" variant="subtle" title="Restricted Fields" description="Your permissions allow own-scope operations only, so Internal and Global flags are not editable." />
            )}
          </FormLayout>
        </Panel>

        {managerFormError && <Alert tone="danger" variant="subtle" title="Validation Error" description={managerFormError} />}
      </div>

      <ModalActions>
        <Button variant="soft" color="slate" onClick={onClose} disabled={savingManager}>
          Cancel
        </Button>
        {(!isEditMode || isFormDirty) && (
          <Button variant="solid" color={themeColor} onClick={onSave} loading={savingManager}>
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

export const DeleteCatalogManagerModal: React.FC<DeleteCatalogManagerModalProps> = ({ manager, deleting, onClose, onConfirm }) => (
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
    <p className="text-sm text-neutral-500 dark:text-neutral-400">This action is irreversible. Catalog access through this manager will be removed immediately.</p>
  </DeleteConfirmModal>
);
