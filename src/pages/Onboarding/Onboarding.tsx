import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Panel } from '../../controls';
import { OnboardingBrand, OptionPicker, ConnectPanel, LocalAgentPanel, SshDeployPanel } from './Panels';
import type { OnboardingStep, OnboardingPrefill } from './Panels';

export type { OnboardingPrefill };

export interface OnboardingProps {
  prefill?: OnboardingPrefill;
}

export const Onboarding: React.FC<OnboardingProps> = ({ prefill }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<OnboardingStep>(prefill?.serverUrl ? 'connect' : 'pick');
  const [connectUrl, setConnectUrl] = useState(prefill?.serverUrl ?? '');

  return (
    <div className="flex min-h-screen w-screen flex-col items-center justify-center gap-6 p-6">
      {step === 'pick' && (
        <Panel maxWidth={580} variant="elevated" bodyClassName="h-full">
          <OnboardingBrand />
          <div className="text-center text-sm text-neutral-500 dark:text-neutral-400 mb-1">{prefill?.fromLogin ? 'Add a new server' : 'Welcome to DevOps'}</div>
          <OptionPicker onSelect={setStep} onBack={prefill?.fromLogin ? () => navigate('/login') : undefined} />
        </Panel>
      )}

      {step === 'connect' && <ConnectPanel prefill={{ ...prefill, serverUrl: connectUrl || prefill?.serverUrl }} onBack={prefill?.serverUrl ? undefined : () => setStep('pick')} />}

      {step === 'local' && (
        <LocalAgentPanel
          onBack={() => setStep('pick')}
          onContinue={(url) => {
            setConnectUrl(url);
            setStep('connect');
          }}
          fromLogin={prefill?.fromLogin}
        />
      )}

      {step === 'ssh' && <SshDeployPanel onBack={() => setStep('pick')} />}
    </div>
  );
};
