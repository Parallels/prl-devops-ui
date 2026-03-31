import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Button, CustomIcon, Hero, Modal, Panel, ThemeColor } from '@prl/ui-kit';
import { useSession } from '@/contexts/SessionContext';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { ConnectToHostForm, type ConnectToHostFormProps } from './ConnectToHostForm';
import { SshDeployForm, type SshDeployFormProps } from './SshDeployForm';
import type { ConnectFormHandle, ConnectFormState, SshDeployFormHandle, SshDeployFormState } from './types';
import { OnboardingStep } from '@/pages/Onboarding/Panels/types';

export interface AddHostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded?: (isAsync: boolean) => void;
}

const OPTION_CARDS = [
  {
    id: 'connect' as const,
    icon: 'Globe' as const,
    title: 'Connect to an Existing Agent',
    description: 'Provide the URL and credentials for an agent already running on a Host.',
    cta: 'Connect to Agent',
  },
  {
    id: 'ssh' as const,
    icon: 'Key' as const,
    title: 'Auto-Deploy via SSH',
    description: 'Deploy the agent to a remote server using SSH credentials.',
    cta: 'Auto-Deploy Agent',
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
      <Hero padding="xs" tone={color} icon="Host" title="New Host" subtitle="How would you like to add your host?" />

      <div className={`grid ${cols} gap-3`}>
        {cards.map((card) => (
          <Panel
            hoverColor={color}
            borderColor={color}
            hoverShadow={true}
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

const INITIAL_CONNECT_STATE: ConnectFormState = { canSubmit: false, isSubmitting: false };
const INITIAL_SSH_STATE: SshDeployFormState = { canSubmit: false, isSubmitting: false };

export const AddHostModal: React.FC<AddHostModalProps> = ({ isOpen, onClose, onAdded }) => {
  const { session } = useSession();
  const { themeColor } = useSystemSettings();

  const [step, setStep] = useState<OnboardingStep>('pick');

  const connectRef = useRef<ConnectFormHandle>(null);
  const sshRef = useRef<SshDeployFormHandle>(null);

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

  const hostname = session?.hostname ?? '';

  const handleConnected = () => {
    onClose();
    onAdded?.(false);
  };

  const handleDeployed = (_hostName: string) => {
    onClose();
    onAdded?.(true);
  };

  // ── Footer actions ──────────────────────────────────────────────────────────
  let actions: React.ReactNode = undefined;

  if (step === 'connect') {
    actions = (
      <Button loading={connectState.isSubmitting} variant="solid" color={themeColor} disabled={connectState.isSubmitting || !connectState.canSubmit} onClick={() => connectRef.current?.submit()}>
        {connectState.isSubmitting ? 'Adding…' : 'Add Host'}
      </Button>
    );
  } else if (step === 'ssh') {
    actions = (
      <Button loading={sshState.isSubmitting} variant="solid" color={themeColor} disabled={sshState.isSubmitting || !sshState.canSubmit} onClick={() => sshRef.current?.submit()}>
        {sshState.isSubmitting ? 'Starting…' : 'Start Deployment'}
      </Button>
    );
  }

  // ── Shared form props ───────────────────────────────────────────────────────
  const connectProps: ConnectToHostFormProps = {
    hostname,
    color: themeColor,
    onConnected: handleConnected,
    onStateChange: setConnectState,
  };

  const sshProps: SshDeployFormProps = {
    hostname,
    color: themeColor,
    onDeployed: handleDeployed,
    onStateChange: setSshState,
  };

  const title = step === 'pick' ? 'Add Host' : step === 'connect' ? 'Connect to an Existing Host' : 'Auto-Deploy via SSH';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onBack={step !== 'pick' ? () => setStep('pick') : undefined}
      backTooltip="Back to options"
      title={title}
      size={step === 'ssh' ? 'lg' : 'md'}
      closeOnBackdropClick={step === 'pick'}
      closeOnEsc={step === 'pick'}
      actions={actions}
    >
      {step === 'pick' && <AddHostOptionPicker color={themeColor} onSelect={setStep} />}
      {step === 'connect' && <ConnectToHostForm ref={connectRef} {...connectProps} />}
      {step === 'ssh' && <SshDeployForm ref={sshRef} {...sshProps} />}
    </Modal>
  );
};
