import React, { useState, useEffect, useRef } from 'react';
import { Button, Modal } from '../../controls';
import type { OnboardingStep } from '../../pages/Onboarding/Panels';
import { AddHostConnectForm, type ConnectFormHandle, type ConnectFormState } from './AddHostConnectForm';
import { AddSshDeployHostForm, type SshDeployFormHandle, type SshDeployFormState } from './AddHostSshDeployForm';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { ArrowRight, CustomIcon, Hero, Panel, ThemeColor } from '@prl/ui-kit';
import { isTauri } from '../../pages/Onboarding/Panels/helpers';

// ── Option picker ─────────────────────────────────────────────────────────────

const OPTION_CARDS = [
  {
    id: 'connect' as const,
    icon: 'Globe' as const,
    title: 'Connect to an Existing Host',
    description: 'Provide the URL and credentials for a host already running.',
    cta: 'Connect',
  },
  {
    id: 'ssh' as const,
    icon: 'Key' as const,
    title: 'Auto-Deploy via SSH',
    description: 'Deploy the host to a remote server using SSH credentials.',
    cta: 'Auto-Deploy Host',
  },
];

export interface AddHostOptionPickerProps {
  onSelect: (step: OnboardingStep) => void;
  onBack?: () => void;
  options?: OnboardingStep[];
  color?: ThemeColor;
}

export const AddHostOptionPicker: React.FC<AddHostOptionPickerProps> = ({ onSelect, onBack, options, color = 'blue' }) => {
  const cards = options ? OPTION_CARDS.filter((c) => options.includes(c.id)) : OPTION_CARDS;
  const cols = cards.length === 2 ? 'grid-cols-2' : 'grid-cols-3';
  return (
    <div className="flex flex-col gap-5">
      <Hero padding="xs" tone={color} icon="Host" title="New Host" subtitle="How would you like to set up your host?" />
      <div className={`grid ${cols} gap-3`}>
        {cards.map((card) => (
          <Panel
            hoverColor={color}
            borderColor={color}
            hoverShadow={true}
            backgroundColor="white"
            key={card.id}
            variant="glass"
            onClick={() => onSelect(card.id)}
            padding="xs"
            bodyClassName="flex flex-col items-center transition-all duration-150 group"
          >
            <div className={`text-neutral-500 dark:text-neutral-400 group-hover:text-${color}-500 dark:group-hover:text-${color}-400`}>
              <CustomIcon icon={card.icon} size="md" />
            </div>
            <div className="space-y-1 grow flex flex-col items-center">
              <p className={`text-xs font-semibold leading-tight text-neutral-800 dark:text-neutral-200'}`}>{card.title}</p>
              <p className="text-[10.5px] text-center leading-snug text-neutral-500 dark:text-neutral-400">{card.description}</p>
            </div>
            <div className={`flex flex-row items-center justify-center w-full text-neutral-500 dark:text-neutral-400 group-hover:text-${color}-500 dark:group-hover:text-${color}-400}`}>
              <span className="text-[12px] font-medium">{card.cta}</span>
              <ArrowRight className="w-4" />
            </div>
          </Panel>
        ))}
      </div>
      {onBack && (
        <div className="mt-4 flex justify-center">
          <Button variant="clear" color="slate" leadingIcon="ArrowLeft" onClick={onBack}>
            Back to login
          </Button>
        </div>
      )}
    </div>
  );
};

// ── Modal ─────────────────────────────────────────────────────────────────────

export interface AddHostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SSH_PHASE_TITLES: Record<string, string> = {
  configure: 'Auto-Deploy via SSH',
  waiting: 'Waiting for Agent…',
  timeout: 'Connection Timed Out',
};

const INITIAL_CONNECT_STATE: ConnectFormState = { canSubmit: false, isSubmitting: false, elapsedSeconds: 0 };
const INITIAL_SSH_STATE: SshDeployFormState = { phase: 'configure', canDeploy: false, elapsedMs: 0 };

export const AddHostModal: React.FC<AddHostModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<OnboardingStep>('pick');
  const { themeColor } = useSystemSettings();

  const connectFormRef = useRef<ConnectFormHandle>(null);
  const sshFormRef = useRef<SshDeployFormHandle>(null);

  const [connectState, setConnectState] = useState<ConnectFormState>(INITIAL_CONNECT_STATE);
  const [sshState, setSshState] = useState<SshDeployFormState>(INITIAL_SSH_STATE);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep('pick');
      setConnectState(INITIAL_CONNECT_STATE);
      setSshState(INITIAL_SSH_STATE);
    }
  }, [isOpen]);

  const handleConnected = () => {
    onSuccess?.();
    onClose();
  };

  // Stop polling if modal is closed during waiting
  const handleClose = () => {
    if (step === 'ssh' && sshState.phase === 'waiting') {
      sshFormRef.current?.cancel();
    }
    onClose();
  };

  // ── Dynamic title ───────────────────────────────────────────────────────────
  const title = step === 'pick' ? 'Add Host' : step === 'connect' ? 'Connect to an Existing Host' : (SSH_PHASE_TITLES[sshState.phase] ?? 'Auto-Deploy via SSH');

  // ── Dynamic back button ─────────────────────────────────────────────────────
  const handleBack = step === 'connect' && !connectState.isSubmitting ? () => setStep('pick') : step === 'ssh' && sshState.phase === 'configure' ? () => setStep('pick') : undefined;

  // ── Dynamic footer actions ──────────────────────────────────────────────────
  let actions: React.ReactNode = undefined;

  if (step === 'connect') {
    actions = (
      <Button variant="solid" color={themeColor} disabled={connectState.isSubmitting || !connectState.canSubmit} onClick={() => connectFormRef.current?.submit()}>
        {connectState.isSubmitting ? `Connecting… (${connectState.elapsedSeconds}s)` : 'Save and Continue'}
      </Button>
    );
  } else if (step === 'ssh') {
    const { phase, canDeploy } = sshState;

    if (phase === 'configure') {
      actions = (
        <Button variant="solid" color={themeColor} disabled={!canDeploy} onClick={() => sshFormRef.current?.deploy()} trailingIcon="ArrowRight">
          {isTauri() ? 'Deploy' : "I've Run the Script — Start Waiting"}
        </Button>
      );
    } else if (phase === 'waiting') {
      actions = (
        <Button variant="outline" color="slate" onClick={() => sshFormRef.current?.cancel()} leadingIcon="ArrowLeft">
          Cancel
        </Button>
      );
    } else if (phase === 'timeout') {
      actions = (
        <>
          <Button variant="soft" color="slate" onClick={() => setStep('pick')}>
            Back to Options
          </Button>
          <Button variant="solid" color={themeColor} onClick={() => sshFormRef.current?.retry()} trailingIcon="ArrowRight">
            Retry
          </Button>
        </>
      );
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onBack={handleBack}
      backTooltip={handleBack ? 'Back to options' : undefined}
      onClose={handleClose}
      title={title}
      size={step === 'pick' ? 'md' : 'lg'}
      closeOnBackdropClick={step === 'pick'}
      closeOnEsc={step === 'pick'}
      actions={actions}
    >
      {step === 'pick' && <AddHostOptionPicker options={['connect', 'ssh']} onSelect={setStep} color={themeColor} />}

      {step === 'connect' && <AddHostConnectForm ref={connectFormRef} color={themeColor} onConnected={handleConnected} onStateChange={setConnectState} />}

      {step === 'ssh' && <AddSshDeployHostForm ref={sshFormRef} color={themeColor} onBack={() => setStep('pick')} onConnected={handleConnected} onStateChange={setSshState} />}
    </Modal>
  );
};
