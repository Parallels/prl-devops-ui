import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
    Alert,
    Button,
    FormField,
    Input,
    Modal,
    MultiToggle,
    NotificationModal,
    Progress,
    Toggle,
    type MultiToggleOption,
} from '@prl/ui-kit';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';

// ── Types ─────────────────────────────────────────────────────────────────────

type AuthType = 'api_key' | 'credentials';
type SshAuthType = 'password' | 'key';
type ModalMode = 'manual' | 'auto';
type InstallPhase = 'idle' | 'running' | 'success' | 'error';

export interface AddHostFormData {
    name: string;
    address: string;
    port: number;
    secure: boolean;
    authType: AuthType;
    apiKey: string;
    username: string;
    password: string;
}

export interface AutoInstallFormData {
    targetHost: string;
    sshPort: number;
    sshAuthType: SshAuthType;
    sshUsername: string;
    sshPassword: string;
    sshKeyPath: string;
    sshKeyPassphrase: string;
    version: string;
}

export interface AddHostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: AddHostFormData) => Promise<void>;
    onAutoInstall?: (data: AutoInstallFormData) => Promise<void>;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MODE_OPTIONS: MultiToggleOption[] = [
    { value: 'manual', label: 'Manual Connect' },
    { value: 'auto',   label: 'Auto Install'   },
];

const MANUAL_AUTH_OPTIONS: MultiToggleOption[] = [
    { value: 'api_key',     label: 'API Key'     },
    { value: 'credentials', label: 'Credentials' },
];

const SSH_AUTH_OPTIONS: MultiToggleOption[] = [
    { value: 'password', label: 'Password' },
    { value: 'key',      label: 'SSH Key'  },
];

const DEFAULT_PORT_HTTP  = 8080;
const DEFAULT_PORT_HTTPS = 443;
const DEFAULT_SSH_PORT   = 22;
const DEFAULT_VERSION    = 'latest';

// ── Install Steps ─────────────────────────────────────────────────────────────

interface InstallStep {
    id: number;
    label: string;
    detail: string;
}

const INSTALL_STEPS: InstallStep[] = [
    { id: 0, label: 'Connecting via SSH',             detail: 'Establishing SSH connection to the target host…' },
    { id: 1, label: 'Checking system requirements',   detail: 'Verifying OS version, architecture and disk space…' },
    { id: 2, label: 'Downloading agent',              detail: 'Fetching Parallels DevOps Service package…' },
    { id: 3, label: 'Installing agent',               detail: 'Running installer and setting up system service…' },
    { id: 4, label: 'Configuring service',            detail: 'Writing configuration files and API credentials…' },
    { id: 5, label: 'Starting service',               detail: 'Enabling and starting the DevOps Service daemon…' },
    { id: 6, label: 'Verifying deployment',           detail: 'Confirming the service is reachable on the network…' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function Section({ title }: { title: string }) {
    return (
        <div className="pt-5 pb-2 first:pt-0">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                {title}
            </span>
        </div>
    );
}

// Eye icon helper (show/hide password)
function EyeIcon({ open }: { open: boolean }) {
    return open ? (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
            <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clipRule="evenodd" />
        </svg>
    ) : (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.651 1.651 0 0 0 0-1.185A10.004 10.004 0 0 0 9.999 3a9.956 9.956 0 0 0-4.744 1.194L3.28 2.22ZM7.752 6.69l1.092 1.092a2.5 2.5 0 0 1 3.374 3.373l1.091 1.092a4 4 0 0 0-5.557-5.557Z" clipRule="evenodd" />
            <path d="m10.748 13.93 2.523 2.523a10.003 10.003 0 0 1-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 0 1 0-1.186A10.007 10.007 0 0 1 2.839 6.02L6.07 9.252a4 4 0 0 0 4.678 4.678Z" />
        </svg>
    );
}

// ── Step status indicator ─────────────────────────────────────────────────────

function StepIndicator({ status }: { status: 'pending' | 'running' | 'done' | 'error' }) {
    if (status === 'done') {
        return (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                <svg className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            </span>
        );
    }
    if (status === 'running') {
        return (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
                <svg className="h-3.5 w-3.5 animate-spin text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            </span>
        );
    }
    if (status === 'error') {
        return (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/40">
                <svg className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </span>
        );
    }
    // pending
    return (
        <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-neutral-200 dark:border-neutral-600">
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
        </span>
    );
}

// ── Empty form defaults ───────────────────────────────────────────────────────

const EMPTY_MANUAL: AddHostFormData = {
    name:     '',
    address:  '',
    port:     DEFAULT_PORT_HTTP,
    secure:   false,
    authType: 'api_key',
    apiKey:   '',
    username: '',
    password: '',
};

const EMPTY_AUTO: AutoInstallFormData = {
    targetHost:       '',
    sshPort:          DEFAULT_SSH_PORT,
    sshAuthType:      'password',
    sshUsername:      '',
    sshPassword:      '',
    sshKeyPath:       '',
    sshKeyPassphrase: '',
    version:          DEFAULT_VERSION,
};

// ── Component ─────────────────────────────────────────────────────────────────

export const AddHostModal: React.FC<AddHostModalProps> = ({ isOpen, onClose, onSubmit, onAutoInstall }) => {
    const { themeColor } = useSystemSettings();
    const portId   = useId();
    const sshPortId = useId();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Shared state ──────────────────────────────────────────────────────────
    const [mode, setMode] = useState<ModalMode>('manual');

    // ── Manual form ───────────────────────────────────────────────────────────
    const [manual, setManual]             = useState<AddHostFormData>(EMPTY_MANUAL);
    const [manualErrors, setManualErrors] = useState<Partial<Record<keyof AddHostFormData, string>>>({});
    const [submitting, setSubmitting]     = useState(false);
    const [showApiKey, setShowApiKey]     = useState(false);
    const [showManualPassword, setShowManualPassword] = useState(false);

    // ── Auto-install form ─────────────────────────────────────────────────────
    const [auto, setAuto]               = useState<AutoInstallFormData>(EMPTY_AUTO);
    const [autoErrors, setAutoErrors]   = useState<Partial<Record<keyof AutoInstallFormData, string>>>({});
    const [showSshPassword, setShowSshPassword]       = useState(false);
    const [showKeyPassphrase, setShowKeyPassphrase]   = useState(false);

    // ── Installation progress ─────────────────────────────────────────────────
    const [installPhase, setInstallPhase]   = useState<InstallPhase>('idle');
    const [currentStepIdx, setCurrentStepIdx] = useState(0);
    const [progressValue, setProgressValue] = useState(0);
    const [stepStatuses, setStepStatuses]   = useState<Array<'pending' | 'running' | 'done' | 'error'>>(() => INSTALL_STEPS.map(() => 'pending'));
    const [installError, setInstallError]   = useState<string | null>(null);
    const [showResultModal, setShowResultModal] = useState(false);

    // ── Reset on open ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (isOpen) {
            setMode('manual');
            setManual(EMPTY_MANUAL);
            setManualErrors({});
            setSubmitting(false);
            setShowApiKey(false);
            setShowManualPassword(false);
            setAuto(EMPTY_AUTO);
            setAutoErrors({});
            setShowSshPassword(false);
            setShowKeyPassphrase(false);
            setInstallPhase('idle');
            setCurrentStepIdx(0);
            setProgressValue(0);
            setStepStatuses(INSTALL_STEPS.map(() => 'pending'));
            setInstallError(null);
            setShowResultModal(false);
        }
    }, [isOpen]);

    // ── Manual: sync port on HTTPS toggle ────────────────────────────────────
    const handleSecureToggle = useCallback((checked: boolean) => {
        setManual((prev) => {
            const defaultPort = prev.port === DEFAULT_PORT_HTTP || prev.port === DEFAULT_PORT_HTTPS
                ? (checked ? DEFAULT_PORT_HTTPS : DEFAULT_PORT_HTTP)
                : prev.port;
            return { ...prev, secure: checked, port: defaultPort };
        });
    }, []);

    const setManualField = useCallback(<K extends keyof AddHostFormData>(key: K, val: AddHostFormData[K]) => {
        setManual((p) => ({ ...p, [key]: val }));
        setManualErrors((p) => { const n = { ...p }; delete n[key]; return n; });
    }, []);

    const validateManual = useCallback((): boolean => {
        const errs: typeof manualErrors = {};
        if (!manual.name.trim())    errs.name    = 'Display name is required.';
        if (!manual.address.trim()) errs.address = 'Host address is required.';
        if (manual.authType === 'api_key') {
            if (!manual.apiKey.trim()) errs.apiKey = 'API key is required.';
        } else {
            if (!manual.username.trim()) errs.username = 'Username is required.';
            if (!manual.password.trim()) errs.password = 'Password is required.';
        }
        setManualErrors(errs);
        return Object.keys(errs).length === 0;
    }, [manual]);

    const handleManualSubmit = useCallback(async () => {
        if (!validateManual()) return;
        setSubmitting(true);
        try {
            await onSubmit(manual);
            onClose();
        } catch (err: any) {
            setManualErrors({ address: err?.message ?? 'Failed to connect to the host. Please check the details and try again.' });
        } finally {
            setSubmitting(false);
        }
    }, [validateManual, onSubmit, manual, onClose]);

    // ── Auto: field helpers ────────────────────────────────────────────────────
    const setAutoField = useCallback(<K extends keyof AutoInstallFormData>(key: K, val: AutoInstallFormData[K]) => {
        setAuto((p) => ({ ...p, [key]: val }));
        setAutoErrors((p) => { const n = { ...p }; delete n[key]; return n; });
    }, []);

    const validateAuto = useCallback((): boolean => {
        const errs: typeof autoErrors = {};
        if (!auto.targetHost.trim()) errs.targetHost = 'Target host is required.';
        if (!auto.sshUsername.trim()) errs.sshUsername = 'SSH username is required.';
        if (auto.sshAuthType === 'password') {
            if (!auto.sshPassword.trim()) errs.sshPassword = 'SSH password is required.';
        } else {
            if (!auto.sshKeyPath.trim()) errs.sshKeyPath = 'SSH key file is required.';
        }
        setAutoErrors(errs);
        return Object.keys(errs).length === 0;
    }, [auto]);

    // File picker handler
    const handleKeyFilePick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // In Tauri we'd use the real path; in browser we use the file name as a stand-in
            setAutoField('sshKeyPath', (file as any).path || file.name);
        }
    }, [setAutoField]);

    // ── Auto: start installation ───────────────────────────────────────────────
    const handleStartInstall = useCallback(async () => {
        if (!validateAuto()) return;

        setInstallPhase('running');
        setCurrentStepIdx(0);
        setProgressValue(0);
        setStepStatuses(INSTALL_STEPS.map(() => 'pending'));
        setInstallError(null);

        if (onAutoInstall) {
            // Real backend call — UI will be driven by progress events from the caller
            try {
                await onAutoInstall(auto);
                setInstallPhase('success');
                setShowResultModal(true);
            } catch (err: any) {
                setInstallError(err?.message ?? 'Installation failed. Please check the target host and credentials.');
                setInstallPhase('error');
                setShowResultModal(true);
            }
        } else {
            // UI-only simulation: step through each stage
            const stepDurations = [1200, 1000, 2000, 2500, 1000, 800, 1000];
            let step = 0;

            const advance = () => {
                if (step >= INSTALL_STEPS.length) {
                    setProgressValue(100);
                    setInstallPhase('success');
                    setTimeout(() => setShowResultModal(true), 400);
                    return;
                }
                const stepStep = step; // capture
                setCurrentStepIdx(stepStep);
                setStepStatuses((prev) => {
                    const next = [...prev];
                    next[stepStep] = 'running';
                    return next;
                });
                setProgressValue(Math.round(((stepStep) / INSTALL_STEPS.length) * 100));

                setTimeout(() => {
                    setStepStatuses((prev) => {
                        const next = [...prev];
                        next[stepStep] = 'done';
                        return next;
                    });
                    step++;
                    advance();
                }, stepDurations[stepStep] ?? 1000);
            };

            advance();
        }
    }, [validateAuto, onAutoInstall, auto]);

    // ── Derived ───────────────────────────────────────────────────────────────
    const isInstalling = installPhase === 'running';
    const showProgress = installPhase !== 'idle' && !showResultModal;

    const modalTitle = mode === 'auto' && showProgress
        ? 'Installing Parallels DevOps Service'
        : 'Add New Host';

    const modalDescription = mode === 'auto' && showProgress
        ? `Target: ${auto.targetHost}`
        : mode === 'auto'
            ? 'Automatically install the DevOps Service agent on a remote host via SSH.'
            : 'Connect a Parallels Desktop host running the DevOps Service agent.';

    // ── Render: progress view ─────────────────────────────────────────────────
    const renderProgress = () => (
        <div className="space-y-5">
            {/* Progress bar */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                    <span>{isInstalling ? 'Installing…' : installPhase === 'success' ? 'Installation complete' : 'Installation failed'}</span>
                    <span>{progressValue}%</span>
                </div>
                <Progress
                    value={progressValue}
                    color={installPhase === 'error' ? 'danger' : installPhase === 'success' ? 'success' : themeColor}
                    size="sm"
                    showShimmer={isInstalling}
                />
            </div>

            {/* Step list */}
            <div className="rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800">
                {INSTALL_STEPS.map((step, idx) => {
                    const status = stepStatuses[idx];
                    const isCurrent = idx === currentStepIdx && isInstalling;
                    return (
                        <div
                            key={step.id}
                            className={`flex items-start gap-3 px-4 py-3 transition-colors duration-200 ${
                                isCurrent
                                    ? 'bg-red-50 dark:bg-red-900/10'
                                    : status === 'done'
                                        ? 'bg-emerald-50/50 dark:bg-emerald-900/5'
                                        : status === 'error'
                                            ? 'bg-rose-50 dark:bg-rose-900/10'
                                            : 'bg-white dark:bg-neutral-900'
                            }`}
                        >
                            <div className="flex-shrink-0 pt-0.5">
                                <StepIndicator status={status} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className={`text-sm font-medium leading-tight ${
                                    status === 'done'
                                        ? 'text-emerald-700 dark:text-emerald-400'
                                        : status === 'error'
                                            ? 'text-rose-700 dark:text-rose-400'
                                            : isCurrent
                                                ? 'text-neutral-900 dark:text-neutral-100'
                                                : 'text-neutral-400 dark:text-neutral-600'
                                }`}>
                                    {step.label}
                                </p>
                                {(isCurrent || status === 'running') && (
                                    <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{step.detail}</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    // ── Render: manual form ───────────────────────────────────────────────────
    const renderManual = () => (
        <>
            <Section title="Connection" />
            <div className="space-y-4">
                <FormField
                    label="Display Name"
                    required
                    error={manualErrors.name}
                    validationStatus={manualErrors.name ? 'error' : 'none'}
                    hint="A friendly label to identify this host in the interface."
                >
                    <Input
                        placeholder="e.g. Production Build Server"
                        value={manual.name}
                        tone={themeColor}
                        disabled={submitting}
                        onChange={(e) => setManualField('name', e.target.value)}
                    />
                </FormField>

                <FormField
                    label="Host Address"
                    required
                    error={manualErrors.address}
                    validationStatus={manualErrors.address ? 'error' : 'none'}
                    hint="IP address or fully-qualified hostname of the machine."
                >
                    <Input
                        placeholder="e.g. 192.168.1.42 or build-host.local"
                        value={manual.address}
                        tone={themeColor}
                        leadingIcon="Globe"
                        disabled={submitting}
                        onChange={(e) => setManualField('address', e.target.value)}
                    />
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                    <FormField label="Port" labelFor={portId} hint="Default: 8080 (HTTP) or 443 (HTTPS)">
                        <Input
                            id={portId}
                            type="number"
                            min={1}
                            max={65535}
                            value={String(manual.port)}
                            tone={themeColor}
                            disabled={submitting}
                            onChange={(e) => {
                                const v = parseInt(e.target.value, 10);
                                if (!isNaN(v)) setManualField('port', v);
                            }}
                        />
                    </FormField>

                    <FormField label="Secure Connection (HTTPS)">
                        <div className="flex items-center gap-3 py-2">
                            <Toggle
                                color={themeColor}
                                checked={manual.secure}
                                disabled={submitting}
                                onChange={(e) => handleSecureToggle(e.target.checked)}
                            />
                            <span className="text-sm text-neutral-600 dark:text-neutral-300">
                                {manual.secure ? 'HTTPS enabled' : 'HTTP only'}
                            </span>
                        </div>
                    </FormField>
                </div>
            </div>

            <Section title="Authentication" />
            <div className="space-y-4">
                <FormField label="Authentication Method">
                    <MultiToggle
                        options={MANUAL_AUTH_OPTIONS}
                        value={manual.authType}
                        color={themeColor}
                        fullWidth
                        onChange={(v) => setManualField('authType', v as AuthType)}
                    />
                </FormField>

                {manual.authType === 'api_key' ? (
                    <FormField
                        label="API Key"
                        required
                        error={manualErrors.apiKey}
                        validationStatus={manualErrors.apiKey ? 'error' : 'none'}
                        hint="The service API key configured on the DevOps agent."
                    >
                        <Input
                            type={showApiKey ? 'text' : 'password'}
                            placeholder="Enter API key"
                            value={manual.apiKey}
                            tone={themeColor}
                            disabled={submitting}
                            autoComplete="off"
                            trailingIcon={
                                <button type="button" tabIndex={-1}
                                    onClick={() => setShowApiKey((v) => !v)}
                                    className="flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                                    aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                                >
                                    <EyeIcon open={showApiKey} />
                                </button>
                            }
                            onChange={(e) => setManualField('apiKey', e.target.value)}
                        />
                    </FormField>
                ) : (
                    <div className="space-y-4">
                        <FormField
                            label="Username"
                            required
                            error={manualErrors.username}
                            validationStatus={manualErrors.username ? 'error' : 'none'}
                        >
                            <Input
                                placeholder="Enter username"
                                value={manual.username}
                                tone={themeColor}
                                leadingIcon="User"
                                disabled={submitting}
                                autoComplete="username"
                                onChange={(e) => setManualField('username', e.target.value)}
                            />
                        </FormField>

                        <FormField
                            label="Password"
                            required
                            error={manualErrors.password}
                            validationStatus={manualErrors.password ? 'error' : 'none'}
                        >
                            <Input
                                type={showManualPassword ? 'text' : 'password'}
                                placeholder="Enter password"
                                value={manual.password}
                                tone={themeColor}
                                disabled={submitting}
                                autoComplete="current-password"
                                trailingIcon={
                                    <button type="button" tabIndex={-1}
                                        onClick={() => setShowManualPassword((v) => !v)}
                                        className="flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                                        aria-label={showManualPassword ? 'Hide password' : 'Show password'}
                                    >
                                        <EyeIcon open={showManualPassword} />
                                    </button>
                                }
                                onChange={(e) => setManualField('password', e.target.value)}
                            />
                        </FormField>
                    </div>
                )}
            </div>
        </>
    );

    // ── Render: auto-install form ─────────────────────────────────────────────
    const renderAutoForm = () => (
        <>
            {/* Info banner */}
            <Alert
                tone="info"
                variant="subtle"
                title="What this does"
                description={
                    `The installer will connect to the target machine via SSH, download the Parallels DevOps ` +
                    `Service agent (version: ${auto.version || 'latest'}), install it as a system service, and ` +
                    `register the host automatically — no manual steps required on the remote machine.`
                }
                className="mb-1"
            />

            <Section title="Target Host" />
            <div className="space-y-4">
                <FormField
                    label="Host Address"
                    required
                    error={autoErrors.targetHost}
                    validationStatus={autoErrors.targetHost ? 'error' : 'none'}
                    hint="IP address or hostname of the machine to install the agent on."
                >
                    <Input
                        placeholder="e.g. 192.168.1.50 or worker-01.local"
                        value={auto.targetHost}
                        tone={themeColor}
                        leadingIcon="Globe"
                        onChange={(e) => setAutoField('targetHost', e.target.value)}
                    />
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        label="SSH Port"
                        labelFor={sshPortId}
                        hint="Default: 22"
                    >
                        <Input
                            id={sshPortId}
                            type="number"
                            min={1}
                            max={65535}
                            value={String(auto.sshPort)}
                            tone={themeColor}
                            onChange={(e) => {
                                const v = parseInt(e.target.value, 10);
                                if (!isNaN(v)) setAutoField('sshPort', v);
                            }}
                        />
                    </FormField>

                    <FormField
                        label="Agent Version"
                        hint="Use 'latest' for the most recent release."
                    >
                        <Input
                            placeholder="latest"
                            value={auto.version}
                            tone={themeColor}
                            onChange={(e) => setAutoField('version', e.target.value || DEFAULT_VERSION)}
                        />
                    </FormField>
                </div>
            </div>

            <Section title="SSH Authentication" />
            <div className="space-y-4">
                <FormField label="Authentication Method">
                    <MultiToggle
                        options={SSH_AUTH_OPTIONS}
                        value={auto.sshAuthType}
                        color={themeColor}
                        fullWidth
                        onChange={(v) => setAutoField('sshAuthType', v as SshAuthType)}
                    />
                </FormField>

                <FormField
                    label="Username"
                    required
                    error={autoErrors.sshUsername}
                    validationStatus={autoErrors.sshUsername ? 'error' : 'none'}
                    hint="The SSH user on the target machine (must have sudo/admin rights)."
                >
                    <Input
                        placeholder="e.g. admin or root"
                        value={auto.sshUsername}
                        tone={themeColor}
                        leadingIcon="User"
                        autoComplete="username"
                        onChange={(e) => setAutoField('sshUsername', e.target.value)}
                    />
                </FormField>

                {auto.sshAuthType === 'password' ? (
                    <FormField
                        label="Password"
                        required
                        error={autoErrors.sshPassword}
                        validationStatus={autoErrors.sshPassword ? 'error' : 'none'}
                    >
                        <Input
                            type={showSshPassword ? 'text' : 'password'}
                            placeholder="Enter SSH password"
                            value={auto.sshPassword}
                            tone={themeColor}
                            autoComplete="current-password"
                            trailingIcon={
                                <button type="button" tabIndex={-1}
                                    onClick={() => setShowSshPassword((v) => !v)}
                                    className="flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                                    aria-label={showSshPassword ? 'Hide password' : 'Show password'}
                                >
                                    <EyeIcon open={showSshPassword} />
                                </button>
                            }
                            onChange={(e) => setAutoField('sshPassword', e.target.value)}
                        />
                    </FormField>
                ) : (
                    <>
                        <FormField
                            label="SSH Private Key"
                            required
                            error={autoErrors.sshKeyPath}
                            validationStatus={autoErrors.sshKeyPath ? 'error' : 'none'}
                            hint="Path to your private key file (e.g. ~/.ssh/id_rsa)."
                        >
                            {/* Hidden native file input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pem,.key,.rsa,*"
                                className="hidden"
                                onChange={handleKeyFilePick}
                            />
                            <div className="flex gap-2">
                                <Input
                                    placeholder="~/.ssh/id_rsa"
                                    value={auto.sshKeyPath}
                                    tone={themeColor}
                                    className="flex-1"
                                    onChange={(e) => setAutoField('sshKeyPath', e.target.value)}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    color="theme"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex-shrink-0 whitespace-nowrap"
                                >
                                    Browse…
                                </Button>
                            </div>
                        </FormField>

                        <FormField
                            label="Key Passphrase"
                            hint="Leave blank if the key has no passphrase."
                        >
                            <Input
                                type={showKeyPassphrase ? 'text' : 'password'}
                                placeholder="Optional passphrase"
                                value={auto.sshKeyPassphrase}
                                tone={themeColor}
                                autoComplete="off"
                                trailingIcon={
                                    <button type="button" tabIndex={-1}
                                        onClick={() => setShowKeyPassphrase((v) => !v)}
                                        className="flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                                        aria-label={showKeyPassphrase ? 'Hide passphrase' : 'Show passphrase'}
                                    >
                                        <EyeIcon open={showKeyPassphrase} />
                                    </button>
                                }
                                onChange={(e) => setAutoField('sshKeyPassphrase', e.target.value)}
                            />
                        </FormField>
                    </>
                )}
            </div>
        </>
    );

    // ── Footer actions ────────────────────────────────────────────────────────
    const renderActions = () => {
        if (showProgress) {
            // During/after progress: only a Cancel/Close button (no re-trigger)
            return (
                <div className="flex items-center justify-end w-full">
                    <Button
                        variant="outline"
                        color="theme"
                        size="sm"
                        disabled={isInstalling}
                        onClick={onClose}
                    >
                        {isInstalling ? 'Installing…' : 'Close'}
                    </Button>
                </div>
            );
        }

        if (mode === 'manual') {
            return (
                <div className="flex items-center gap-2 justify-end w-full">
                    <Button variant="outline" color="theme" size="sm" disabled={submitting} onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="solid"
                        color={themeColor}
                        size="sm"
                        loading={submitting}
                        onClick={() => void handleManualSubmit()}
                    >
                        Add Host
                    </Button>
                </div>
            );
        }

        // auto mode — idle form
        return (
            <div className="flex items-center gap-2 justify-end w-full">
                <Button variant="outline" color="theme" size="sm" onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    variant="solid"
                    color={themeColor}
                    size="sm"
                    onClick={() => void handleStartInstall()}
                >
                    Start Installation
                </Button>
            </div>
        );
    };

    // ── Main render ───────────────────────────────────────────────────────────
    return (
        <>
            <Modal
                isOpen={isOpen && !showResultModal}
                onClose={onClose}
                title={modalTitle}
                description={modalDescription}
                icon="Host"
                size="md"
                closeOnBackdropClick={!isInstalling && !submitting}
                closeOnEsc={!isInstalling && !submitting}
                actions={renderActions()}
            >
                {/* Mode switcher — only visible when idle */}
                {!showProgress && (
                    <div className="mb-5">
                        <MultiToggle
                            options={MODE_OPTIONS}
                            value={mode}
                            color={themeColor}
                            fullWidth
                            onChange={(v) => setMode(v as ModalMode)}
                        />
                    </div>
                )}

                {showProgress
                    ? renderProgress()
                    : mode === 'manual'
                        ? renderManual()
                        : renderAutoForm()
                }
            </Modal>

            {/* Success notification */}
            <NotificationModal
                isOpen={showResultModal && installPhase === 'success'}
                onClose={() => { setShowResultModal(false); onClose(); }}
                type="success"
                title="Installation Complete"
                message={
                    <span>
                        The Parallels DevOps Service has been successfully installed on{' '}
                        <strong>{auto.targetHost}</strong> and is now running.
                        The host will appear in your host list shortly.
                    </span>
                }
                actionLabel="Done"
                onAction={() => { setShowResultModal(false); onClose(); }}
            />

            {/* Error notification */}
            <NotificationModal
                isOpen={showResultModal && installPhase === 'error'}
                onClose={() => setShowResultModal(false)}
                type="error"
                title="Installation Failed"
                message={installError ?? 'An unexpected error occurred during installation.'}
                actionLabel="Try Again"
                onAction={() => {
                    setShowResultModal(false);
                    setInstallPhase('idle');
                    setProgressValue(0);
                    setStepStatuses(INSTALL_STEPS.map(() => 'pending'));
                }}
                secondaryActionLabel="Cancel"
                onSecondaryAction={() => { setShowResultModal(false); onClose(); }}
            />
        </>
    );
};
