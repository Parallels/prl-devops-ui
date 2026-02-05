/* eslint-disable react-hooks/exhaustive-deps */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import parallelsBars from '../../assets/images/parallels-bars-small.png';
import { Alert, Button, FormField, FormLayout, Input, Modal, Panel, Toggle } from '../../controls';
import { useConfig } from '../../contexts/ConfigContext';
import { useSession } from '../../contexts/SessionContext';
import { authService } from '../../services/authService';
import { HostAuthType, HostConfig } from '../../interfaces/Host';
import { getPasswordKey, getApiKeyKey } from '../../utils/secretKeys';

interface DialogInformation {
  isOpen: boolean;
  title: string;
  message: string;
  errorMessage?: string;
  actions: { label: string; onClick: () => void; variant?: string }[];
}

interface FormErrors {
  serverUrl?: string;
  username?: string;
  password?: string;
  apiKey?: string;
}

type TouchedFields = {
  serverUrl: boolean;
  username: boolean;
  password: boolean;
  apiKey: boolean;
};

export interface OnboardingPrefill {
  serverUrl?: string;
  authType?: HostAuthType;
  username?: string;
  hostId?: string;
}

interface OnboardingProps {
  prefill?: OnboardingPrefill;
}

export const Onboarding: React.FC<OnboardingProps> = ({ prefill }) => {
  const config = useConfig();
  const { setSession } = useSession();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [serverUrl, setServerUrl] = useState(prefill?.serverUrl ?? '');
  const [authType, setAuthType] = useState<HostAuthType>(prefill?.authType ?? 'credentials');
  const [username, setUsername] = useState(prefill?.username ?? '');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [formTouched, setFormTouched] = useState<TouchedFields>({
    serverUrl: false,
    username: false,
    password: false,
    apiKey: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [dialog, setDialog] = useState<DialogInformation>({
    isOpen: false,
    title: '',
    message: '',
    actions: [],
  });

  useEffect(() => {
    if (isSaving) {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
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

  useEffect(() => {
    validateForm();
  }, [serverUrl, username, password, apiKey, authType]);

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
      if (!username.trim()) {
        newErrors.username = 'Username is required';
      }
      if (!password.trim()) {
        newErrors.password = 'Password is required';
      }
    } else {
      if (!apiKey.trim()) {
        newErrors.apiKey = 'API Key is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: keyof TouchedFields) => {
    setFormTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleResetConfig = async () => {
    try {
      await config.set('hosts', []);
      await config.save();
      authService.logout();
      console.log('[Onboarding] Configuration reset');
      setDialog({
        isOpen: true,
        title: 'Configuration Reset',
        message: 'All saved hosts have been removed.',
        actions: [
          {
            label: 'OK',
            onClick: () => setDialog((prev) => ({ ...prev, isOpen: false })),
            variant: 'primary',
          },
        ],
      });
    } catch (error) {
      console.error('[Onboarding] Reset failed:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setFormTouched({
      serverUrl: true,
      username: authType === 'credentials',
      password: authType === 'credentials',
      apiKey: authType === 'api_key',
    });

    const isValid = validateForm();
    if (!isValid) return;

    setIsSaving(true);

    const saveSettings = async () => {
      try {
        const t0 = performance.now();
        const normalizedUrl = serverUrl.replace(/\/+$/, '');
        const urlObj = new URL(normalizedUrl);
        const hostname = urlObj.hostname;

        console.log('[Onboarding] Step 1: authenticating', hostname);
        authService.setCredentials(hostname, {
          url: normalizedUrl,
          username: authType === 'credentials' ? username : '',
          password: authType === 'credentials' ? password : '',
          email: authType === 'credentials' ? username : '',
          api_key: authType === 'api_key' ? apiKey : '',
        });

        const t1 = performance.now();
        await authService.getAccessToken(hostname);
        const t2 = performance.now();
        console.log(`[Onboarding] Step 2: token obtained (${((t2 - t1) / 1000).toFixed(2)}s)`);

        // Save secrets
        console.log('[Onboarding] Step 3: saving secrets, keepLoggedIn=', keepLoggedIn);
        const t3 = performance.now();
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
        const t4 = performance.now();
        console.log(`[Onboarding] Step 3b: secret ops done (${((t4 - t3) / 1000).toFixed(2)}s)`);

        await config.flushSecrets();
        const t5 = performance.now();
        console.log(`[Onboarding] Step 4: flushSecrets done (${((t5 - t4) / 1000).toFixed(2)}s)`);

        // Upsert host by hostname — never create duplicates
        const existingHosts = (await config.get<HostConfig[]>('hosts')) ?? [];
        const existingIndex = existingHosts.findIndex((h) => h.hostname === hostname);

        // Mark as default if this will be the only host
        const willBeOnlyHost = existingIndex >= 0
          ? existingHosts.length === 1
          : existingHosts.length === 0;

        const hostEntry: HostConfig = {
          id: existingIndex >= 0 ? existingHosts[existingIndex].id : crypto.randomUUID(),
          hostname,
          baseUrl: normalizedUrl,
          authType,
          username: authType === 'credentials' ? username : '',
          keepLoggedIn,
          lastUsed: new Date().toISOString(),
          isDefault: willBeOnlyHost ? true : (existingIndex >= 0 ? existingHosts[existingIndex].isDefault : undefined),
          type: 'Orchestrator',
        };

        if (existingIndex >= 0) {
          existingHosts[existingIndex] = hostEntry;
        } else {
          existingHosts.push(hostEntry);
        }

        const t6 = performance.now();
        await config.set('hosts', existingHosts);
        const t7 = performance.now();
        console.log(`[Onboarding] Step 5a: config.set done (${((t7 - t6) / 1000).toFixed(2)}s)`);

        await config.save();
        const t8 = performance.now();
        console.log(`[Onboarding] Step 5b: config.save done (${((t8 - t7) / 1000).toFixed(2)}s)`);
        console.log(`[Onboarding] Total: ${((t8 - t0) / 1000).toFixed(2)}s`);

        // Set session data
        setSession({
          serverUrl: normalizedUrl,
          hostname,
          username: authType === 'credentials' ? username : '',
          authType,
          hostId: hostEntry.id,
          connectedAt: new Date().toISOString(),
        });

        navigate('/', { replace: true });
      } catch (error: unknown) {
        console.error('[Onboarding] CAUGHT ERROR:', error);
        setIsSaving(false);
        setDialog({
          isOpen: true,
          title: 'Connection Failed',
          message: 'Could not connect to the server with the provided credentials.',
          errorMessage: (error as Error)?.message || JSON.stringify(error),
          actions: [
            {
              label: 'OK',
              onClick: () => setDialog((prev) => ({ ...prev, isOpen: false })),
              variant: 'primary',
            },
          ],
        });
      }
    };
    void saveSettings();
  };

  const hasError = (field: keyof FormErrors) => {
    return formTouched[field as keyof TouchedFields] && !!errors[field];
  };

  const isFormValid = Object.keys(errors).length === 0;

  return (
    <>
      <div className="flex min-h-screen w-screen flex-col items-center justify-center gap-6 p-6">
        <Panel maxWidth={500} variant="elevated" bodyClassName="h-full">
          <div className="flex items-center justify-center pb-2 p-3">
            <div className="flex items-center">
              <div className="h-[48px] w-[48px] flex items-center justify-center">
                <img className="h-full" src={parallelsBars} alt="Parallels DevOps" />
              </div>
              <div className="flex items-start font-medium text-black dark:text-gray-300 ml-3 text-2xl">
                <span className="text-[#6c757d] dark:text-black pr-2">Parallels</span>
                <span className="text-gray-900 dark:text-gray-300">DevOps</span>
              </div>
            </div>
          </div>
          <div className="text-center text-lg font-semibold">Welcome!</div>
          <div className="text-center text-sm text-neutral-600 dark:text-neutral-300 mb-4 px-4">
            To get started, connect to your DevOps server by entering the URL and credentials below.
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <FormLayout columns={1} gap="sm">
              <FormField
                label="Server URL"
                required={true}
                width="full"
                error={hasError('serverUrl') ? errors.serverUrl : undefined}
              >
                <Input
                  type="url"
                  tone="blue"
                  value={serverUrl}
                  onChange={(e) => {
                    if (e.target.value && !e.target.value.startsWith('http')) {
                      setServerUrl('https://' + e.target.value)
                    } else {
                      setServerUrl(e.target.value)
                    }
                    handleBlur('serverUrl')
                  }}
                  required={true}
                  placeholder="https://your-server.example.com"
                />
              </FormField>

              <div className="py-2">
                <Toggle
                  label="Use API Key"
                  description={
                    authType === 'api_key'
                      ? 'Authenticate with an API key'
                      : 'Authenticate with username and password'
                  }
                  checked={authType === 'api_key'}
                  onChange={(e) => setAuthType(e.target.checked ? 'api_key' : 'credentials')}
                  size="sm"
                  color="blue"
                />
              </div>

              {authType === 'credentials' && (
                <>
                  <FormField
                    label="Username"
                    required={true}
                    width="full"
                    error={hasError('username') ? errors.username : undefined}
                  >
                    <Input
                      type="text"
                      tone="blue"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onBlur={() => handleBlur('username')}
                      required={true}
                      placeholder="Enter your username"
                    />
                  </FormField>
                  <FormField
                    label="Password"
                    required={true}
                    width="full"
                    error={hasError('password') ? errors.password : undefined}
                  >
                    <Input
                      type="password"
                      tone="blue"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => handleBlur('password')}
                      required={true}
                      placeholder="Enter your password"
                    />
                  </FormField>
                </>
              )}

              {authType === 'api_key' && (
                <FormField
                  label="API Key"
                  required={true}
                  width="full"
                  error={hasError('apiKey') ? errors.apiKey : undefined}
                >
                  <Input
                    type="password"
                    tone="blue"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    onBlur={() => handleBlur('apiKey')}
                    required={true}
                    placeholder="Enter your API key"
                  />
                </FormField>
              )}

              <div className="py-2">
                <Toggle
                  label="Keep me logged in"
                  description={
                    keepLoggedIn
                      ? 'Credentials will be stored securely'
                      : 'You will need to re-enter credentials on next launch'
                  }
                  checked={keepLoggedIn}
                  onChange={(e) => setKeepLoggedIn(e.target.checked)}
                  size="sm"
                  color="blue"
                />
              </div>
            </FormLayout>

            <div className="my-4 flex flex-col gap-2">
              <Button
                variant="solid"
                fullWidth={true}
                disabled={isSaving || !isFormValid}
                type="submit"
              >
                {isSaving ? `Connecting... (${elapsedSeconds}s)` : 'Save and Continue'}
              </Button>
              <Button
                variant="outline"
                fullWidth={true}
                type="button"
                onClick={() => void handleResetConfig()}
              >
                Reset Configuration
              </Button>
            </div>
          </form>
        </Panel>
        <Modal
          title={dialog.title}
          isOpen={dialog.isOpen}
          onClose={() => setDialog((prev) => ({ ...prev, isOpen: false }))}
        >
          <div>
            {dialog.errorMessage && (
              <Alert
                variant="outline"
                tone="danger"
                title={dialog.message}
                description={dialog.errorMessage}
              ></Alert>
            )}
            {!dialog.errorMessage && <p>{dialog.message}</p>}
            <div className="flex justify-end pt-3">
              {dialog.actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant === 'primary' ? 'solid' : 'outline'}
                  onClick={action.onClick}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};
