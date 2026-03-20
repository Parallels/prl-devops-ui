import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Panel, ThemeColor } from '@prl/ui-kit';
import { Alert, Button, FormField, Input, Modal, PasswordInput, Toggle } from '../../controls';
import { useConfig } from '../../contexts/ConfigContext';
import { useSession } from '../../contexts/SessionContext';
import { authService } from '../../services/authService';
import { getPasswordKey, getApiKeyKey } from '../../utils/secretKeys';
import { decodeToken } from '../../utils/tokenUtils';
import { devopsService } from '../../services/devops';
import type { HostAuthType, HostConfig } from '../../interfaces/Host';
import type { HostHardwareInfo } from '../../interfaces/devops';
import { friendlyLoginError } from '../../pages/Onboarding/Panels/helpers';
import type { DialogInformation, FormErrors, TouchedFields, OnboardingPrefill } from '../../pages/Onboarding/Panels/types';

// ── Public types ──────────────────────────────────────────────────────────────

export interface ConnectFormHandle {
  submit: () => void;
}

export interface ConnectFormState {
  canSubmit: boolean;
  isSubmitting: boolean;
  elapsedSeconds: number;
}

export interface AddHostConnectFormProps {
  prefill?: OnboardingPrefill;
  onBack?: () => void;
  onConnected?: () => void;
  color?: ThemeColor;
  onStateChange?: (state: ConnectFormState) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const AddHostConnectForm = forwardRef<ConnectFormHandle, AddHostConnectFormProps>(function AddHostConnectForm({ prefill, onBack: _onBack, onConnected, color = 'blue', onStateChange }, ref) {
  const config = useConfig();
  const { setSession } = useSession();
  const navigate = useNavigate();

  const formRef = useRef<HTMLFormElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [serverUrl, setServerUrl] = useState(prefill?.serverUrl ?? '');
  const [authType, setAuthType] = useState<HostAuthType>(prefill?.authType ?? 'credentials');
  const [username, setUsername] = useState(prefill?.username ?? '');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [formTouched, setFormTouched] = useState<TouchedFields>({ serverUrl: false, username: false, password: false, apiKey: false });
  const [errors, setErrors] = useState<FormErrors>({});
  const [dialog, setDialog] = useState<DialogInformation>({ isOpen: false, title: '', message: '', actions: [] });

  // ── Imperative handle ───────────────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    submit: () => formRef.current?.requestSubmit(),
  }));

  // ── Timer while saving ──────────────────────────────────────────────────────
  useEffect(() => {
    if (isSaving) {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isSaving]);

  // ── Validation ──────────────────────────────────────────────────────────────
  useEffect(() => {
    validateForm();
  }, [serverUrl, username, password, apiKey, authType]); // eslint-disable-line react-hooks/exhaustive-deps

  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (!serverUrl.trim()) {
      newErrors.serverUrl = 'Server URL is required';
    } else {
      try {
        new URL(serverUrl);
      } catch {
        newErrors.serverUrl = 'Please enter a valid URL';
      }
    }
    if (authType === 'credentials') {
      if (!username.trim()) newErrors.username = 'Username is required';
      if (!password.trim()) newErrors.password = 'Password is required';
    } else {
      if (!apiKey.trim()) newErrors.apiKey = 'API Key is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = Object.keys(errors).length === 0;

  // ── Report state to parent ──────────────────────────────────────────────────
  useEffect(() => {
    onStateChange?.({ canSubmit: isFormValid, isSubmitting: isSaving, elapsedSeconds });
  }, [isFormValid, isSaving, elapsedSeconds]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleBlur = (field: keyof TouchedFields) => setFormTouched((prev) => ({ ...prev, [field]: true }));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormTouched({ serverUrl: true, username: authType === 'credentials', password: authType === 'credentials', apiKey: authType === 'api_key' });
    if (!validateForm()) return;
    setIsSaving(true);

    const save = async () => {
      try {
        const normalizedUrl = serverUrl.replace(/\/+$/, '');
        const urlObj = new URL(normalizedUrl);
        const hostname = urlObj.hostname;

        authService.setCredentials(hostname, {
          url: normalizedUrl,
          username: authType === 'credentials' ? username : '',
          password: authType === 'credentials' ? password : '',
          email: authType === 'credentials' ? username : '',
          api_key: authType === 'api_key' ? apiKey : '',
        });
        await authService.forceReauth(hostname);

        if (keepLoggedIn) {
          if (authType === 'credentials') {
            await config.setSecret(getPasswordKey(hostname), password);
            await config.removeSecret(getApiKeyKey(hostname));
          } else {
            await config.setSecret(getApiKeyKey(hostname), apiKey);
            await config.removeSecret(getPasswordKey(hostname));
          }
        } else {
          await config.removeSecret(getPasswordKey(hostname));
          await config.removeSecret(getApiKeyKey(hostname));
        }
        await config.flushSecrets();

        let hardwareInfo: HostHardwareInfo | undefined;
        try {
          hardwareInfo = await devopsService.config.getHardwareInfo(hostname);
        } catch {
          /* non-fatal */
        }

        const existingHosts = (await config.get<HostConfig[]>('hosts')) ?? [];
        const existingIndex = existingHosts.findIndex((h) => h.hostname === hostname);
        const willBeOnlyHost = !prefill?.fromLogin && (existingIndex >= 0 ? existingHosts.length === 1 : existingHosts.length === 0);

        const hostEntry: HostConfig = {
          id: existingIndex >= 0 ? existingHosts[existingIndex].id : crypto.randomUUID(),
          name: displayName.trim() || undefined,
          hostname,
          baseUrl: normalizedUrl,
          authType,
          username: authType === 'credentials' ? username : '',
          keepLoggedIn,
          lastUsed: new Date().toISOString(),
          isDefault: willBeOnlyHost ? true : existingIndex >= 0 ? existingHosts[existingIndex].isDefault : undefined,
          type: 'Orchestrator',
          hardwareInfo,
        };

        if (existingIndex >= 0) existingHosts[existingIndex] = hostEntry;
        else existingHosts.push(hostEntry);
        await config.set('hosts', existingHosts);
        await config.save();

        authService.currentHostname = hostname;
        const token = authService.getToken(hostname);
        const tokenPayload = token ? (decodeToken(token) ?? undefined) : undefined;

        setSession({
          serverUrl: normalizedUrl,
          hostname,
          username: authType === 'credentials' ? username : '',
          authType,
          hostId: hostEntry.id,
          connectedAt: new Date().toISOString(),
          tokenPayload,
          hardwareInfo,
        });

        if (onConnected) onConnected();
        else navigate('/', { replace: true });
      } catch (error: unknown) {
        setIsSaving(false);
        const { title, message: errMessage, details } = friendlyLoginError(error, serverUrl);
        setDialog({
          isOpen: true,
          title,
          message: errMessage,
          errorMessage: details,
          tone: 'danger',
          actions: [{ label: 'OK', onClick: () => setDialog((p) => ({ ...p, isOpen: false })), variant: 'primary' }],
        });
      }
    };
    void save();
  };

  const hasError = (field: keyof FormErrors) => formTouched[field as keyof TouchedFields] && !!errors[field];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
        <Panel variant="glass" padding="xs" backgroundColor="white">
          <FormField label="Display Name" width="full">
            <Input type="text" tone={color} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Production (optional)" />
          </FormField>
        </Panel>

        <Panel variant="glass" padding="xs" backgroundColor="white">
          <FormField label="Server URL" required width="full" error={hasError('serverUrl') ? errors.serverUrl : undefined}>
            <Input
              type="url"
              tone={color}
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              onBlur={() => {
                if (serverUrl && !/^https?:\/\//i.test(serverUrl)) setServerUrl('https://' + serverUrl);
                handleBlur('serverUrl');
              }}
              required
              placeholder="https://your-server.example.com"
            />
          </FormField>

          <Toggle
            label="Use API Key"
            description={authType === 'api_key' ? 'Authenticate with an API key' : 'Authenticate with username and password'}
            checked={authType === 'api_key'}
            onChange={(e) => setAuthType(e.target.checked ? 'api_key' : 'credentials')}
            size="sm"
            color={color}
          />

          {authType === 'credentials' && (
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Username" required width="full" error={hasError('username') ? errors.username : undefined}>
                <Input
                  type="text"
                  tone={color}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={() => handleBlur('username')}
                  required
                  placeholder="Username"
                  autoComplete="username"
                />
              </FormField>
              <FormField label="Password" required width="full" error={hasError('password') ? errors.password : undefined}>
                <PasswordInput
                  tone={color}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur('password')}
                  required
                  placeholder="Password"
                  autoComplete="current-password"
                />
              </FormField>
            </div>
          )}

          {authType === 'api_key' && (
            <FormField label="API Key" required width="full" error={hasError('apiKey') ? errors.apiKey : undefined}>
              <PasswordInput tone={color} value={apiKey} onChange={(e) => setApiKey(e.target.value)} onBlur={() => handleBlur('apiKey')} required placeholder="Enter your API key" autoComplete="off" />
            </FormField>
          )}

          <Toggle
            label="Keep me logged in"
            description={keepLoggedIn ? 'Credentials will be stored securely' : 'You will need to re-enter credentials on next launch'}
            checked={keepLoggedIn}
            onChange={(e) => setKeepLoggedIn(e.target.checked)}
            size="sm"
            color={color}
          />
        </Panel>
      </form>

      <Modal title={dialog.title} isOpen={dialog.isOpen} onClose={() => setDialog((p) => ({ ...p, isOpen: false }))}>
        <div>
          <Alert variant="outline" tone={dialog.tone ?? 'neutral'} title={dialog.message} description={dialog.errorMessage} />
          <div className="flex justify-end pt-3">
            {dialog.actions.map((action, i) => (
              <Button key={i} variant={action.variant === 'primary' ? 'solid' : 'outline'} onClick={action.onClick}>
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
});
