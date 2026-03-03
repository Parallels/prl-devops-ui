import React from 'react';
import { Button, Modal, ModalActions, type ThemeColor } from '@prl/ui-kit';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';

// ── Color options ──────────────────────────────────────────────────────────────

interface ColorOption {
    value: ThemeColor;
    label: string;
    bgClass: string;
    ringClass: string;
}

const COLOR_OPTIONS: ColorOption[] = [
    { value: 'parallels', label: 'Parallels', bgClass: 'bg-red-500',    ringClass: 'ring-red-400' },
    { value: 'rose',      label: 'Rose',      bgClass: 'bg-rose-500',   ringClass: 'ring-rose-400' },
    { value: 'orange',    label: 'Orange',    bgClass: 'bg-orange-500', ringClass: 'ring-orange-400' },
    { value: 'amber',     label: 'Amber',     bgClass: 'bg-amber-500',  ringClass: 'ring-amber-400' },
    { value: 'emerald',   label: 'Emerald',   bgClass: 'bg-emerald-500', ringClass: 'ring-emerald-400' },
    { value: 'sky',       label: 'Sky',       bgClass: 'bg-sky-500',    ringClass: 'ring-sky-400' },
    { value: 'blue',      label: 'Blue',      bgClass: 'bg-blue-500',   ringClass: 'ring-blue-400' },
    { value: 'indigo',    label: 'Indigo',    bgClass: 'bg-indigo-500', ringClass: 'ring-indigo-400' },
    { value: 'violet',    label: 'Violet',    bgClass: 'bg-violet-500', ringClass: 'ring-violet-400' },
    { value: 'cyan',      label: 'Cyan',      bgClass: 'bg-cyan-500',   ringClass: 'ring-cyan-400' },
];

// ── Component ──────────────────────────────────────────────────────────────────

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { themeColor, setThemeColor } = useSystemSettings();

    return (
        <Modal isOpen={isOpen} title="Settings" onClose={onClose} size="sm">
            <div className="space-y-5">
                {/* Accent color */}
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">
                        Accent Color
                    </p>
                    <div className="grid grid-cols-5 gap-3">
                        {COLOR_OPTIONS.map((opt) => {
                            const isSelected = themeColor === opt.value;
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => void setThemeColor(opt.value)}
                                    className="flex flex-col items-center gap-1.5 focus:outline-none focus-visible:outline-none"
                                    title={opt.label}
                                >
                                    <div className={[
                                        'relative w-9 h-9 rounded-full transition-all duration-150',
                                        opt.bgClass,
                                        isSelected
                                            ? `ring-2 ring-offset-2 ${opt.ringClass} ring-offset-white dark:ring-offset-neutral-800 scale-110`
                                            : 'opacity-70 hover:opacity-100 hover:scale-105',
                                    ].join(' ')}>
                                        {isSelected && (
                                            <svg
                                                className="absolute inset-0 m-auto w-4 h-4 text-white drop-shadow"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={3}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className={[
                                        'text-[10px] leading-none',
                                        isSelected
                                            ? 'text-neutral-800 dark:text-neutral-100 font-semibold'
                                            : 'text-neutral-400 dark:text-neutral-500',
                                    ].join(' ')}>
                                        {opt.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <ModalActions>
                <Button variant="solid" color={themeColor} onClick={onClose}>
                    Done
                </Button>
            </ModalActions>
        </Modal>
    );
};
