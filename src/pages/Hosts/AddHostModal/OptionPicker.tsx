import type { Step } from './types';

interface OptionPickerProps {
  onSelect: (step: 'connect' | 'ssh') => void;
  color: string;
}

export function OptionPicker({ onSelect, color }: OptionPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-3 py-1">
      <button
        type="button"
        onClick={() => onSelect('connect')}
        className={`flex flex-col items-start gap-3 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 text-left transition-all hover:border-${color}-400 hover:shadow-md dark:hover:border-${color}-500 focus:outline-none focus:ring-2 focus:ring-${color}-500`}
      >
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-${color}-50 dark:bg-${color}-500/10`}>
          <svg className={`h-5 w-5 text-${color}-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
            />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Connect Existing</p>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">Register a host that already has the agent running</p>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onSelect('ssh')}
        className={`flex flex-col items-start gap-3 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 text-left transition-all hover:border-${color}-400 hover:shadow-md dark:hover:border-${color}-500 focus:outline-none focus:ring-2 focus:ring-${color}-500`}
      >
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-${color}-50 dark:bg-${color}-500/10`}>
          <svg className={`h-5 w-5 text-${color}-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z"
            />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Deploy via SSH</p>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">Auto-install the agent on a remote machine over SSH</p>
        </div>
      </button>
    </div>
  );
}

// Suppress unused import warning — Step is used by consumers of this module
export type { Step };
