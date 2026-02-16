// @ts-nocheck — placeholder component, flows and controls not yet implemented
import React from 'react';

export type OnboardingFlowType = 'system-requirements';

export interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  flow?: OnboardingFlowType;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  flow = 'system-requirements',
}) => {
  if (!isOpen) return null;

  return (
    <div>
      <p>Onboarding flow: {flow}</p>
      <button onClick={onClose}>Close</button>
    </div>
  );
};
