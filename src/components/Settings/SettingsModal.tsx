import React, { useEffect, useState } from 'react';
import { Button, Modal, ModalActions, type ThemeColor } from '@prl/ui-kit';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { useConfig } from '@/contexts/ConfigContext';
import {
    TELEMETRY_ENABLED_KEY,
    amplitudeService,
    getDeploymentApiKey,
} from '@/services/AmplitudeService';
import { AnalyticsEvent } from '@/services/analytics/events';
import { trackEvent } from '@/services/analytics/trackEvent';

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

// ── Analytics (Amplitude) ─────────────────────────────────────────────────────

const AnalyticsSection: React.FC = () => {
    const config = useConfig();
    const [enabled, setEnabled] = useState(true);
    const [status, setStatus] = useState<'idle' | 'updated' | 'error'>('idle');
    const keyAvailable = getDeploymentApiKey() !== null;

    useEffect(() => {
        let active = true;
        void config.get<boolean>(TELEMETRY_ENABLED_KEY)
            .then((value) => {
                if (active && value !== null) setEnabled(value !== false);
            })
            .catch(() => undefined);
        return () => { active = false; };
    }, [config]);

    const handleToggle = async () => {
        const next = !enabled;
        setEnabled(next);
        setStatus('idle');
        try {
            await config.set(TELEMETRY_ENABLED_KEY, next);
            await amplitudeService.setTelemetryEnabled(next);
            // Only the opt-IN is reported; the opt-out must be honoured silently.
            if (next) {
                trackEvent(AnalyticsEvent.TELEMETRY_ENABLED);
            }
            setStatus('updated');
        } catch {
            setStatus('error');
        }
    };

    return (
        <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">
                Product Analytics
            </p>

            <button
                type="button"
                role="switch"
                aria-checked={enabled}
                onClick={() => void handleToggle()}
                className="flex w-full items-center justify-between gap-3 text-left focus:outline-none focus-visible:outline-none"
            >
                <span className="text-sm text-neutral-800 dark:text-neutral-100">
                    Send anonymous usage data
                </span>
                <span className={[
                    'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                    enabled ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-600',
                ].join(' ')}>
                    <span className={[
                        'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
                        enabled ? 'left-[22px]' : 'left-0.5',
                    ].join(' ')} />
                </span>
            </button>

            <p className="mt-2 text-[10px] leading-snug text-neutral-400 dark:text-neutral-500">
                Only anonymous page views and session statistics are sent. IP address,
                attribution, click, form and URL tracking are disabled; the device
                identifier is a non-identifying fingerprint.
                {!keyAvailable && ' No analytics key is injected in this build, so nothing is sent regardless of this setting.'}
            </p>

            {status === 'updated' && (
                <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">Preference saved.</p>
            )}
            {status === 'error' && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">Could not save the preference.</p>
            )}
        </div>
    );
};

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

                <AnalyticsSection />
            </div>

            <ModalActions>
                <Button variant="solid" color={themeColor} onClick={onClose}>
                    Done
                </Button>
            </ModalActions>
        </Modal>
    );
};
