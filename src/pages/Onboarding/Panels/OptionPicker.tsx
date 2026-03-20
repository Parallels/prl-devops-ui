import React from 'react';
import { ArrowRight, CustomIcon, ThemeColor } from '@prl/ui-kit';
import { Button } from '../../../controls';
import type { OnboardingStep } from './types';

const OPTION_CARDS = [
  {
    id: 'connect' as const,
    icon: 'Globe' as const,
    title: 'Connect to an Existing Agent',
    description: 'Provide the URL and credentials for an agent already running.',
    cta: 'Connect',
  },
  {
    id: 'local' as const,
    icon: 'Script' as const,
    title: 'Install Locally',
    description: 'For testing or development purposes. Run via Docker or a service script on this machine.',
    cta: 'Get Local Agent',
    featured: true,
  },
  {
    id: 'ssh' as const,
    icon: 'Key' as const,
    title: 'Auto-Deploy via SSH',
    description: 'Deploy the agent to a remote server using SSH credentials.',
    cta: 'Auto-Deploy Agent',
  },
];

export interface OptionPickerProps {
  onSelect: (step: OnboardingStep) => void;
  onBack?: () => void;
  /** Restrict which option cards are shown. Defaults to all three. */
  options?: OnboardingStep[];
  color?: ThemeColor;
}

export const OptionPicker: React.FC<OptionPickerProps> = ({ onSelect, onBack, options, color = 'blue' }) => {
  const cards = options ? OPTION_CARDS.filter((c) => options.includes(c.id)) : OPTION_CARDS;
  const cols = cards.length === 2 ? 'grid-cols-2' : 'grid-cols-3';
  return (
    <div>
      <div className="text-center mb-5">
        <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100">How would you like to set up your agent?</p>
      </div>
      <div className={`grid ${cols} gap-3`}>
        {cards.map((card) => (
          <Button
            key={card.id}
            variant="outline"
            color={color}
            active={card.featured || false}
            onClick={() => onSelect(card.id)}
            className="flex flex-col items-center gap-3 py-4 text-center transition-all duration-150 group"
          >
            <div className={card.featured ? `text-${color}-600 dark:text-${color}-400` : `text-neutral-500 dark:text-neutral-400 group-hover:text-${color}-500 dark:group-hover:text-${color}-400`}>
              <CustomIcon icon={card.icon} size="md" />
            </div>
            <div className="space-y-1 grow">
              <p className={`text-xs font-semibold leading-tight ${card.featured ? `text-${color}-700 dark:text-${color}-300` : 'text-neutral-800 dark:text-neutral-200'}`}>{card.title}</p>
              <p className="text-[10.5px] leading-snug text-neutral-500 dark:text-neutral-400">{card.description}</p>
            </div>
            <div
              className={`flex flex-row items-center justify-center w-full ${card.featured ? `text-${color}-600 dark:text-${color}-400` : `text-neutral-500 dark:text-neutral-400 group-hover:text-${color}-500 dark:group-hover:text-${color}-400`}`}
            >
              <span className="text-[12px] font-medium">{card.cta}</span>
              <ArrowRight className="w-4" />
            </div>
          </Button>
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
