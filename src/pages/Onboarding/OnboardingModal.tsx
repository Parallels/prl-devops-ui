import React from 'react';
import { Modal } from '../Controls';
import { SystemRequirementsFlow } from './flows/SystemRequirementsFlow';

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
  const renderFlow = () => {
    switch (flow) {
      case 'system-requirements':
        return <SystemRequirementsFlow onComplete={onClose} />;
    }
  };

  const getTitle = () => {
    switch (flow) {
      case 'system-requirements':
        return ''; // Custom header in component
      default:
        return 'Onboarding';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()} size="md">
      {renderFlow()}
    </Modal>
  );
};
