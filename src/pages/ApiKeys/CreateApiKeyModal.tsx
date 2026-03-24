import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, FormField, FormLayout, Input, Modal, ModalActions, Panel, ThemeColor, normalizeStringToUpper } from '@prl/ui-kit';

export interface CreateApiKeyModalPayload {
  name: string;
  expiresAt?: string;
}

export interface CreateApiKeyModalProps {
  isOpen: boolean;
  saving: boolean;
  themeColor: ThemeColor;
  onClose: () => void;
  onCreate: (payload: CreateApiKeyModalPayload) => Promise<void>;
}

export const CreateApiKeyModal: React.FC<CreateApiKeyModalProps> = ({ isOpen, saving, themeColor, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [expiresOn, setExpiresOn] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setName('');
    setExpiresOn('');
    setError(null);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const keyPreview = useMemo(() => {
    const trimmedName = name.trim();
    return trimmedName ? normalizeStringToUpper(trimmedName) : null;
  }, [name]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const handleCreate = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Name is required');
      return;
    }

    setError(null);
    try {
      await onCreate({
        name: trimmedName,
        expiresAt: expiresOn || undefined,
      });
      reset();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create API key');
    }
  }, [name, expiresOn, onCreate, reset]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add API Key"
      description="Create a new API key for programmatic access."
      size="sm"
      icon="KeyManagement"
      actions={
        <ModalActions>
          <Button variant="soft" color="rose" size="sm" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="soft" color={themeColor} size="sm" loading={saving} disabled={!name.trim()} onClick={() => void handleCreate()}>
            Create
          </Button>
        </ModalActions>
      }
    >
      <Panel variant="glass" padding="xs" backgroundColor="white">
        <FormLayout columns={1}>
          <FormField label="Name" required>
            <Input
              tone={themeColor}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleCreate();
                if (e.key === 'Escape') handleClose();
              }}
              placeholder="e.g. CI/CD Pipeline Key"
              validationStatus={error ? 'error' : 'none'}
            />
          </FormField>

          <FormField label="Key ID Preview">
            {keyPreview ? (
              <div className="font-mono text-xs text-neutral-500 dark:text-neutral-400 tracking-wider bg-neutral-100 dark:bg-neutral-800 rounded-lg px-3 py-2.5">{keyPreview}</div>
            ) : (
              <div className="text-xs italic text-neutral-400 dark:text-neutral-500">Auto-generated from name</div>
            )}
          </FormField>

          <FormField label="Expires On">
            <Input tone={themeColor} type="date" placeholder="Never" value={expiresOn} onChange={(e) => setExpiresOn(e.target.value)} />
          </FormField>

          {error && <p className="text-xs text-rose-500">{error}</p>}
        </FormLayout>
      </Panel>
    </Modal>
  );
};
