import React, { useState, useEffect } from 'react';
import { Alert, Button, FormField, FormLayout, Input, Modal, Panel, Toggle, UIModalConfirm } from '../../controls';
import { useConfig } from '@/contexts/ConfigContext';
import { useSession } from '@/contexts/SessionContext';
import { authService } from '@/services/authService';
import { HostAuthType, HostConfig } from '@/interfaces/Host';
import { getPasswordKey, getApiKeyKey } from '@/utils/secretKeys';
import { decodeToken } from '@/utils/tokenUtils';
import { devopsService } from '@/services/devops';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { Section } from '@prl/ui-kit';

interface FormErrors {
  serverUrl?: string;
  username?: string;
  password?: string;
  apiKey?: string;
}

export interface EditHostModalProps {
  isOpen: boolean;
  onClose: () => void;
  host: HostConfig | null;
  onSuccess?: () => void;
}

export const EditHostModal: React.FC<EditHostModalProps> = ({ isOpen, onClose, host, onSuccess }) => {
  const config = useConfig();
  const { session, setSession } = useSession();
  const { themeColor } = useSystemSettings();

  const [name, setName] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [authType, setAuthType] = useState<HostAuthType>('credentials');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [hasStoredSecret, setHasStoredSecret] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState({ serverUrl: false, username: false, password: false, apiKey: false });

  // Seed fields from host when modal opens
  useEffect(() => {
    if (!isOpen || !host) return;
    setName(host.name ?? '');
    setServerUrl(host.baseUrl ?? '');
    setAuthType(host.authType ?? 'credentials');
    setUsername(host.username ?? '');
    setPassword('');
    setApiKey('');
    setKeepLoggedIn(host.keepLoggedIn ?? true);
    setHasStoredSecret(false);
    setIsSaving(false);
    setSaveError(null);
    setShowCancelConfirm(false);
    setErrors({});
    setTouched({ serverUrl: false, username: false, password: false, apiKey: false });

    // Async-load stored secret indicator
    void (async () => {
      const key = host.authType === 'credentials' ? getPasswordKey(host.hostname) : getApiKeyKey(host.hostname);
      const secret = await config.getSecret(key);
      setHasStoredSecret(Boolean(secret));
    })();
  }, [isOpen, host]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!host) return null;

  // ── Dirty state ─────────────────────────────────────────────────────────────
  const isDirty =
    name !== (host.name ?? '') ||
    serverUrl !== (host.baseUrl ?? '') ||
    authType !== (host.authType ?? 'credentials') ||
    username !== (host.username ?? '') ||
    keepLoggedIn !== (host.keepLoggedIn ?? true) ||
    password !== '' ||
    apiKey !== '';

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!serverUrl.trim()) {
      e.serverUrl = 'Server URL is required';
    } else {
      try {
        new URL(serverUrl);
      } catch {
        e.serverUrl = 'Please enter a valid URL';
      }
    }
    // Credential fields are changing if URL, authType, or username differ from saved values
    const credentialFieldsChanging =
      serverUrl.replace(/\/+$/, '') !== (host.baseUrl ?? '').replace(/\/+$/, '') ||
      authType !== (host.authType ?? 'credentials') ||
      username !== (host.username ?? '');
    // Password/key is required only when we'll need it: either to store (keepLoggedIn) or to reauth (credentialFieldsChanging)
    const secretRequired = keepLoggedIn || credentialFieldsChanging;
    if (authType === 'credentials') {
      if (!username.trim()) e.username = 'Username is required';
      if (!password && !hasStoredSecret && secretRequired) e.password = 'Password is required';
    } else {
      if (!apiKey && !hasStoredSecret && secretRequired) e.apiKey = 'API Key is required';
    }
    return e;
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((p) => ({ ...p, [field]: true }));
    setErrors(validate());
  };

  const hasError = (field: keyof FormErrors) => touched[field as keyof typeof touched] && !!errors[field];
  const isFormValid = Object.keys(validate()).length === 0;

  // ── Cancel ──────────────────────────────────────────────────────────────────
  const handleCancel = () => {
    if (isDirty) {
      setShowCancelConfirm(true);
    } else {
      onClose();
    }
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setTouched({ serverUrl: true, username: true, password: true, apiKey: true });
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const normalizedUrl = serverUrl.replace(/\/+$/, '');
      const newHostname = new URL(normalizedUrl).hostname;
      const oldHostname = host.hostname;
      const hostnameChanged = newHostname !== oldHostname;

      const credentialsChanged =
        hostnameChanged ||
        authType !== (host.authType ?? 'credentials') ||
        username !== (host.username ?? '') ||
        password !== '' ||
        apiKey !== '';

      if (credentialsChanged) {
        // Test credentials before persisting
        authService.setCredentials(newHostname, {
          url: normalizedUrl,
          username: authType === 'credentials' ? username : '',
          password: authType === 'credentials' ? password : '',
          email: authType === 'credentials' ? username : '',
          api_key: authType === 'api_key' ? apiKey : '',
        });

        await authService.forceReauth(newHostname);
      }

      // If URL/hostname changed, remove old secrets
      if (hostnameChanged) {
        await config.removeSecret(getPasswordKey(oldHostname));
        await config.removeSecret(getApiKeyKey(oldHostname));
      }

      // Persist secrets (only when credentials or keepLoggedIn changed)
      const keepLoggedInChanged = keepLoggedIn !== (host.keepLoggedIn ?? true);
      if (credentialsChanged || keepLoggedInChanged) {
        if (keepLoggedIn) {
          if (authType === 'credentials' && password) {
            await config.setSecret(getPasswordKey(newHostname), password);
            await config.removeSecret(getApiKeyKey(newHostname));
          } else if (authType === 'api_key' && apiKey) {
            await config.setSecret(getApiKeyKey(newHostname), apiKey);
            await config.removeSecret(getPasswordKey(newHostname));
          }
        } else {
          await config.removeSecret(getPasswordKey(newHostname));
          await config.removeSecret(getApiKeyKey(newHostname));
        }
        await config.flushSecrets();
      }

      // Fetch hardware info (non-fatal)
      let hardwareInfo = host.hardwareInfo;
      try {
        hardwareInfo = await devopsService.config.getHardwareInfo(newHostname);
      } catch {
        /* use cached */
      }

      // Update host entry
      const existingHosts = (await config.get<HostConfig[]>('hosts')) ?? [];
      const idx = existingHosts.findIndex((h) => h.id === host.id);
      const updatedEntry: HostConfig = {
        ...host,
        name: name.trim() || undefined,
        hostname: newHostname,
        baseUrl: normalizedUrl,
        authType,
        username: authType === 'credentials' ? username : '',
        keepLoggedIn,
        hardwareInfo,
      };

      if (idx >= 0) {
        existingHosts[idx] = updatedEntry;
      }

      await config.set('hosts', existingHosts);
      await config.save();

      // Update active session if editing the currently connected host
      if (session?.hostId === host.id) {
        authService.currentHostname = newHostname;
        const token = authService.getToken(newHostname);
        const tokenPayload = token ? (decodeToken(token) ?? undefined) : undefined;
        setSession({
          serverUrl: normalizedUrl,
          hostname: newHostname,
          username: authType === 'credentials' ? username : '',
          authType,
          hostId: host.id,
          connectedAt: session.connectedAt,
          tokenPayload,
          hardwareInfo,
        });
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      setSaveError((error as Error)?.message ?? 'Could not connect. Please check the URL and credentials.');
    } finally {
      setIsSaving(false);
    }
  };

  const hostLabel = host.name || host.hostname;

  return (
    <>
      <Modal
        icon="Host"
        title={`Edit Host: ${hostLabel}`}
        description="Update host settings. Credentials will be tested before saving."
        isOpen={isOpen}
        onClose={handleCancel}
        size="lg"
        closeOnBackdropClick={!isSaving}
        closeOnEsc={!isSaving}
        actions={
          <>
            <Button variant="solid" color={isDirty ? 'red' : themeColor} onClick={handleCancel} disabled={isSaving}>
              {isDirty ? 'Discard Changes' : 'Close'}
            </Button>
            {isDirty && (
              <Button variant="solid" color={themeColor} onClick={() => void handleSave()} disabled={isSaving || !isFormValid}>
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            )}
          </>
        }
      >
        {saveError && <Alert variant="outline" tone="danger" title="Save Failed" description={saveError} />}

        {/* ── Server ─────────────────────────────────────────────────────────── */}
        <Panel variant="glass" padding="xs" backgroundColor="white">
          <Section title="Server" noPadding>
            <FormLayout columns={1} gap="sm">
              <FormField label="Display Name" width="full">
                <Input type="text" tone={themeColor} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Production (optional)" />
              </FormField>

              <FormField label="Server URL" required width="full" error={hasError('serverUrl') ? errors.serverUrl : undefined}>
                <Input
                  type="url"
                  tone={themeColor}
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  onBlur={() => {
                    if (serverUrl && !/^https?:\/\//i.test(serverUrl)) {
                      setServerUrl('https://' + serverUrl);
                    }
                    handleBlur('serverUrl');
                  }}
                  placeholder="https://your-server.example.com"
                />
              </FormField>
            </FormLayout>
          </Section>
        </Panel>

        {/* ── Authentication ──────────────────────────────────────────────────── */}
        <Panel variant="glass" padding="xs" backgroundColor="white">
          <Section title="Authentication" noPadding>
            <Toggle
              label="Use API Key"
              description={authType === 'api_key' ? 'Authenticate with an API key' : 'Authenticate with username and password'}
              checked={authType === 'api_key'}
              onChange={(e) => setAuthType(e.target.checked ? 'api_key' : 'credentials')}
              size="sm"
              color={themeColor}
            />

            <FormLayout columns={authType === 'credentials' ? 2 : 1} gap="sm">
              {authType === 'credentials' ? (
                <>
                  <FormField label="Username" required width="full" error={hasError('username') ? errors.username : undefined}>
                    <Input
                      type="text"
                      tone={themeColor}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onBlur={() => handleBlur('username')}
                      placeholder="Enter your username"
                      autoComplete="username"
                    />
                  </FormField>
                  <FormField
                    label="Password"
                    required={!hasStoredSecret}
                    width="full"
                    error={hasError('password') ? errors.password : undefined}
                    description={hasStoredSecret && !password ? 'Leave blank to keep existing password' : undefined}
                  >
                    <Input
                      type="password"
                      tone={themeColor}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => handleBlur('password')}
                      placeholder={hasStoredSecret ? '••••••••' : 'Enter your password'}
                      autoComplete="new-password"
                    />
                  </FormField>
                </>
              ) : (
                <FormField
                  label="API Key"
                  required={!hasStoredSecret}
                  width="full"
                  error={hasError('apiKey') ? errors.apiKey : undefined}
                  description={hasStoredSecret && !apiKey ? 'Leave blank to keep existing API key' : undefined}
                >
                  <Input
                    type="password"
                    tone={themeColor}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    onBlur={() => handleBlur('apiKey')}
                    placeholder={hasStoredSecret ? '••••••••' : 'Enter your API key'}
                  />
                </FormField>
              )}
            </FormLayout>
          </Section>
          <Section title="Session" noPadding>
            <Toggle
              label="Keep me logged in"
              description="Save credentials securely for future sessions"
              checked={keepLoggedIn}
              onChange={(e) => setKeepLoggedIn(e.target.checked)}
              color={themeColor}
              size="sm"
            />
          </Section>
        </Panel>
      </Modal>

      {/* Cancel confirmation — shown when there are unsaved changes */}
      <UIModalConfirm
        isOpen={showCancelConfirm}
        title="Discard Changes?"
        description="You have unsaved changes. Are you sure you want to discard them?"
        confirmLabel="Discard"
        confirmColor="red"
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={() => {
          setShowCancelConfirm(false);
          onClose();
        }}
      />
    </>
  );
};
