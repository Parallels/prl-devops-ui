import React, { useState } from 'react';
import { Button, CustomIcon, Modal, ModalActions, Panel } from '@prl/ui-kit';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';

export interface NewApiKeyRevealModalProps {
  encodedKey: string;
  onClose: () => void;
}

export const NewApiKeyRevealModal: React.FC<NewApiKeyRevealModalProps> = ({ encodedKey, onClose }) => {
  const { themeColor } = useSystemSettings();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(encodedKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Modal isOpen title="API Key Created" onClose={onClose} size="md">
      <Panel variant="glass" padding="xs" backgroundColor="white" className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <CustomIcon icon="Info" className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Copy this encoded key now - it will <strong>not</strong> be shown again. Use it as the Bearer token in your API requests.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 font-mono text-xs bg-neutral-100 dark:bg-neutral-800 rounded-lg px-3 py-2.5 text-neutral-800 dark:text-neutral-200 break-all select-all">{encodedKey}</div>
          <Button variant="outline" color={copied ? 'emerald' : 'slate'} size="sm" leadingIcon={copied ? 'Complete' : 'Copy'} onClick={handleCopy}>
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </Panel>
      <ModalActions>
        <Button variant="soft" color={themeColor} onClick={onClose}>
          Done
        </Button>
      </ModalActions>
    </Modal>
  );
};
