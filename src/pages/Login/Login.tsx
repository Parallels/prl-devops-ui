import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import parallelsBars from '../../assets/images/parallels-bars-small.png';
import { Alert, Button, FormField, FormLayout, Input, Modal, Panel, PasswordInput, Toggle } from '../../controls';
import { useConfig } from '../../contexts/ConfigContext';
import { useSession } from '../../contexts/SessionContext';
import { useLockedHost } from '../../contexts/LockedHostContext';
import { authService } from '../../services/authService';
import { HostConfig } from '../../interfaces/Host';
import { getPasswordKey, getApiKeyKey } from '../../utils/secretKeys';
import { decodeToken } from '../../utils/tokenUtils';
import { devopsService } from '../../services/devops';
import { HostHardwareInfo } from '../../interfaces/devops';
import { Picker, PickerItem } from '@prl/ui-kit';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormErrors {
  username?: string;
  password?: string;
  apiKey?: string;
}

type TouchedFields = {
  username: boolean;
  password: boolean;
  apiKey: boolean;
};

interface DialogInformation {
  isOpen: boolean;
  title: string;
  message: string;
  errorMessage?: string;
  tone: 'danger' | 'success' | 'warning' | 'neutral';
}

export interface LoginPrefill {
  hostId?: string;
}

interface LoginProps {
  prefill?: LoginPrefill;
}

interface LoginErrorResult {
  title: string;
  message: string;
  details?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const friendlyLoginError = (error: unknown, targetUrl?: string): LoginErrorResult => {
  const apiErr = error as { message?: string; statusCode?: number };
  const status = apiErr?.statusCode;
  const rawMsg = apiErr?.message ?? (error instanceof Error ? error.message : String(error));
  const rawLower = rawMsg.toLowerCase();

  if (status === 401) return { title: 'Authentication Failed', message: 'Invalid credentials. Please check your username and password.', details: 'HTTP 401 Unauthorized' };
  if (status === 403) return { title: 'Access Denied', message: 'Your account does not have permission to sign in.', details: 'HTTP 403 Forbidden' };
  if (status === 404) return { title: 'Endpoint Not Found', message: 'The authentication endpoint was not found. Please verify the server URL is correct.', details: 'HTTP 404 Not Found' };
  if (status && status >= 500) return { title: 'Server Error', message: 'The server is currently unavailable or encountered an internal error.', details: `HTTP ${status}` };

  const isNetworkError = !status && (rawLower.includes('load failed') || rawLower.includes('failed to fetch') || rawLower.includes('network request failed') || rawLower.includes('network error') || rawLower.includes('networkerror'));
  if (isNetworkError && !import.meta.env.DEV && typeof window !== 'undefined' && window.location.protocol === 'https:' && targetUrl?.toLowerCase().startsWith('http:')) {
    return { title: 'Mixed Content Blocked', message: 'Your browser blocked the connection because this app is running over HTTPS but the server URL uses HTTP.' };
  }
  if (isNetworkError) return { title: 'Cannot Reach Server', message: 'Could not connect to the server. Please check the URL, verify the server is running, and check your network.' };
  if (rawLower.includes('timeout') || rawLower.includes('timed out')) return { title: 'Connection Timed Out', message: 'The server did not respond in time.' };
  if (rawLower.includes('certificate') || rawLower.includes('ssl') || rawLower.includes('tls')) return { title: 'SSL / Certificate Error', message: 'A certificate error occurred. The server may be using a self-signed or expired certificate.', details: rawMsg };

  return { title: 'Connection Failed', message: rawMsg || 'An unexpected error occurred. Please try again.' };
};

// ── Component ─────────────────────────────────────────────────────────────────

export const Login: React.FC<LoginProps> = ({ prefill }) => {
  const config = useConfig();
  const { setSession } = useSession();
  const { isLocked, hostUrl, hostName: lockedHostName, lockedHostname, username: lockedUsername, hasPassword, password: lockedPassword, clearLockedPassword } = useLockedHost();
  const navigate = useNavigate();

  // ── Host list ──────────────────────────────────────────────────────────────
  const [hosts, setHosts] = useState<HostConfig[]>([]);
  const [hostsLoading, setHostsLoading] = useState(!isLocked);
  const [selectedHostId, setSelectedHostId] = useState<string>('');
  const [hostPickerItems, setHostPickerItems] = useState<PickerItem[]>([]);

  // ── Form fields ────────────────────────────────────────────────────────────
  const [authType, setAuthType] = useState<'credentials' | 'api_key'>('credentials');
  const [username, setUsername] = useState(lockedUsername ?? '');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);

  // ── Submit state ───────────────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Validation ─────────────────────────────────────────────────────────────
  const [formTouched, setFormTouched] = useState<TouchedFields>({ username: false, password: false, apiKey: false });
  const [errors, setErrors] = useState<FormErrors>({});
  const [dialog, setDialog] = useState<DialogInformation>({ isOpen: false, title: '', message: '', tone: 'danger' });

  // Build a synthetic in-memory host when in locked mode
  const effectiveLockedUsername = username || lockedUsername || '';

  const lockedHost = isLocked && hostUrl && lockedHostname
    ? ({
        id: `locked:${lockedHostname}`,
        name: lockedHostName || undefined,
        hostname: lockedHostname,
        baseUrl: hostUrl,
        authType: 'credentials' as const,
        username: effectiveLockedUsername,
        keepLoggedIn,
        lastUsed: new Date().toISOString(),
        type: 'Orchestrator' as const,
      } satisfies HostConfig)
    : null;

  // Load all saved hosts on mount (skipped in locked mode)
  useEffect(() => {
    if (isLocked) {
      const loadLockedHost = async () => {
        if (!lockedHost) return;

        const savedHosts = (await config.get<HostConfig[]>('hosts')) ?? [];
        const savedHost = savedHosts.find((host) => host.hostname === lockedHost.hostname);
        const savedPassword = await config.getSecret(getPasswordKey(lockedHost.hostname));

        setKeepLoggedIn(savedHost?.keepLoggedIn ?? !!savedPassword);
        setUsername(lockedUsername ?? savedHost?.username ?? '');
        setPassword(savedPassword ?? '');
        setHostsLoading(false);
      };

      void loadLockedHost();
      return;
    }

    const loadHosts = async () => {
      const saved = (await config.get<HostConfig[]>('hosts')) ?? [];
      setHosts(saved);
      const target =
        (prefill?.hostId && saved.find((h) => h.id === prefill.hostId)) ??
        saved.find((h) => h.isDefault) ??
        [...saved].sort((a, b) => (b.lastUsed ?? '').localeCompare(a.lastUsed ?? ''))[0];
      if (target) setSelectedHostId(target.id);
      setHostPickerItems(saved.map((h) => ({ id: h.id, title: h.hostname, subtitle: h.baseUrl })));
      setHostsLoading(false);
    };
    void loadHosts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Populate form fields whenever the selected host changes (normal mode only)
  useEffect(() => {
    if (isLocked || !selectedHostId || hostsLoading) return;
    const host = hosts.find((h) => h.id === selectedHostId);
    if (!host) return;

    setAuthType(host.authType);
    setUsername(host.authType === 'credentials' ? (host.username ?? '') : '');
    setKeepLoggedIn(host.keepLoggedIn ?? true);
    setPassword('');
    setApiKey('');
    setFormTouched({ username: false, password: false, apiKey: false });

    // Attempt to pre-fill saved credential
    const loadSecret = async () => {
      const secretKey = host.authType === 'credentials' ? getPasswordKey(host.hostname) : getApiKeyKey(host.hostname);
      const secret = await config.getSecret(secretKey);
      if (secret) {
        if (host.authType === 'credentials') setPassword(secret);
        else setApiKey(secret);
      }
    };
    void loadSecret();
  }, [selectedHostId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-login when both VITE_DEFAULT_USERNAME and VITE_DEFAULT_PASSWORD are set
  useEffect(() => {
    if (!isLocked || !lockedHost || !hasPassword || !lockedPassword || hostsLoading || !username) return;
    setIsSaving(true);
    const performAutoLogin = async () => {
      try {
        authService.setCredentials(lockedHostname!, {
          url: hostUrl!,
          username,
          password: lockedPassword,
          email: username,
          api_key: '',
        });
        await authService.forceReauth(lockedHostname!);

        let hardwareInfo: HostHardwareInfo | undefined;
        try { hardwareInfo = await devopsService.config.getHardwareInfo(lockedHostname!); } catch { /* non-fatal */ }

        authService.currentHostname = lockedHostname!;
        const token = authService.getToken(lockedHostname!);
        const tokenPayload = token ? decodeToken(token) ?? undefined : undefined;

        setSession({
          serverUrl: hostUrl!,
          hostname: lockedHostname!,
          username,
          authType: 'credentials',
          hostId: lockedHost.id,
          connectedAt: new Date().toISOString(),
          tokenPayload,
          hardwareInfo,
        });
        navigate('/', { replace: true });
      } catch (error: unknown) {
        clearLockedPassword();
        await config.removeSecret(getPasswordKey(lockedHostname!));
        await config.flushSecrets();
        setPassword('');
        setKeepLoggedIn(false);
        setIsSaving(false);
        const { title, message: errMessage, details } = friendlyLoginError(error, hostUrl ?? '');
        setDialog({ isOpen: true, title, message: errMessage, errorMessage: details, tone: 'danger' });
      }
    };
    void performAutoLogin();
  }, [hasPassword, hostUrl, hostsLoading, isLocked, lockedHost, lockedHostname, lockedPassword, navigate, setSession, username, clearLockedPassword, config]); // eslint-disable-line react-hooks/exhaustive-deps

  // Elapsed-time counter while saving
  useEffect(() => {
    if (isSaving) {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [isSaving]);

  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (authType === 'credentials') {
      if (!username.trim()) newErrors.username = 'Username is required';
      if (!password.trim()) newErrors.password = 'Password is required';
    } else {
      if (!apiKey.trim()) newErrors.apiKey = 'API Key is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => { validateForm(); }, [username, password, apiKey, authType]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBlur = (field: keyof TouchedFields) => setFormTouched((prev) => ({ ...prev, [field]: true }));
  const hasError = (field: keyof FormErrors) => formTouched[field as keyof TouchedFields] && !!errors[field];
  const isFormValid = Object.keys(errors).length === 0;
  const selectedHost = isLocked ? lockedHost : hosts.find((h) => h.id === selectedHostId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormTouched({ username: authType === 'credentials', password: authType === 'credentials', apiKey: authType === 'api_key' });
    if (!validateForm() || !selectedHost) return;
    setIsSaving(true);

    const signIn = async () => {
      try {
        const normalizedUrl = selectedHost.baseUrl.replace(/\/+$/, '');
        const hostname = selectedHost.hostname;

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
        try { hardwareInfo = await devopsService.config.getHardwareInfo(hostname); } catch { /* non-fatal */ }

        // Update the selected host in config (saves any credential/keepLoggedIn changes)
        const allHosts = (await config.get<HostConfig[]>('hosts')) ?? [];
        const idx = allHosts.findIndex((h) => h.id === selectedHost.id);
        const updatedHost: HostConfig = {
          ...selectedHost,
          authType,
          username: authType === 'credentials' ? username : '',
          keepLoggedIn,
          lastUsed: new Date().toISOString(),
          hardwareInfo,
        };
        if (idx >= 0) allHosts[idx] = updatedHost;
        else allHosts.push(updatedHost);

        await config.set('hosts', allHosts);
        await config.save();

        authService.currentHostname = hostname;
        const token = authService.getToken(hostname);
        const tokenPayload = token ? decodeToken(token) ?? undefined : undefined;

        setSession({
          serverUrl: normalizedUrl,
          hostname,
          username: authType === 'credentials' ? username : '',
          authType,
          hostId: updatedHost.id,
          connectedAt: new Date().toISOString(),
          tokenPayload,
          hardwareInfo,
        });

        navigate('/', { replace: true });
      } catch (error: unknown) {
        setIsSaving(false);
        const { title, message: errMessage, details } = friendlyLoginError(error, selectedHost.baseUrl);
        setDialog({ isOpen: true, title, message: errMessage, errorMessage: details, tone: 'danger' });
      }
    };

    void signIn();
  };

  return (
    <>
      <div className="flex min-h-screen w-screen flex-col items-center justify-center gap-6 p-6">
        <Panel maxWidth={460} variant="elevated" bodyClassName="h-full">
          {/* Brand */}
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              <div className="h-10 w-10 flex items-center justify-center">
                <img className="h-full" src={parallelsBars} alt="Parallels DevOps" />
              </div>
              <div className="flex items-start font-medium ml-2.5 text-xl">
                <span className="text-[#6c757d] dark:text-neutral-400 pr-1.5">Parallels</span>
                <span className="text-gray-900 dark:text-gray-300">DevOps</span>
              </div>
            </div>
          </div>
          <div className="text-center text-base font-semibold text-neutral-900 dark:text-neutral-100">Welcome back!</div>
          <div className="text-center text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            {isLocked ? `Sign in to ${lockedHostName ?? lockedHostname ?? hostUrl}.` : 'Select a server and sign in.'}
          </div>

          {hostsLoading ? (
            <div className="py-8 text-center text-sm text-neutral-400">Loading…</div>
          ) : !isLocked && hosts.length === 0 ? (
            <div className="py-6 text-center space-y-3">
              <p className="text-sm text-neutral-500">No servers configured.</p>
              <Button variant="solid" color="blue" onClick={() => navigate('/onboarding', { state: { prefill: { fromLogin: true } } })}>
                Add a Server
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <FormLayout columns={1} gap="sm">
                {/* Server — selector in normal mode, read-only badge in locked mode */}
                {isLocked ? (
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 dark:border-neutral-700 dark:bg-neutral-800/60">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500 mb-0.5">Server</p>
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">{hostUrl}</p>
                  </div>
                ) : (
                    <FormField label="Server" required width="full">
                      <Picker
                        items={hostPickerItems}
                        selectedId={selectedHostId}
                        onSelect={(value) => setSelectedHostId(value.id)}
                        loading={hostsLoading}
                        placeholder="Select a server"
                        color="blue"
                      />
                  </FormField>
                )}

                {/* Credentials fields */}
                {authType === 'credentials' && (
                  <>
                    <FormField label="Username" required width="full" error={hasError('username') ? errors.username : undefined}>
                      <Input
                        type="text"
                        tone="blue"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onBlur={() => handleBlur('username')}
                        required
                        placeholder="Enter your username"
                        autoComplete="username"
                        disabled={isSaving || (isLocked && !!lockedUsername)}
                      />
                    </FormField>
                    {!hasPassword && (
                      <FormField label="Password" required width="full" error={hasError('password') ? errors.password : undefined}>
                        <PasswordInput
                          tone="blue"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onBlur={() => handleBlur('password')}
                          required
                          placeholder="Enter your password"
                          autoComplete="current-password"
                          disabled={isSaving}
                        />
                      </FormField>
                    )}
                  </>
                )}

                {authType === 'api_key' && !isLocked && (
                  <FormField label="API Key" required width="full" error={hasError('apiKey') ? errors.apiKey : undefined}>
                    <PasswordInput
                      tone="blue"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      onBlur={() => handleBlur('apiKey')}
                      required
                      placeholder="Enter your API key"
                      autoComplete="off"
                      disabled={isSaving}
                    />
                  </FormField>
                )}

                {authType === 'credentials' && (
                  <div className="py-1">
                    <Toggle
                      label="Keep me logged in"
                      description={keepLoggedIn ? 'Credentials will be stored securely' : 'You will need to re-enter credentials on next launch'}
                      checked={keepLoggedIn}
                      onChange={(e) => setKeepLoggedIn(e.target.checked)}
                      size="sm"
                      color="blue"
                    />
                  </div>
                )}
              </FormLayout>

              <div className="mt-4 space-y-2">
                <Button
                  trailingIcon="Login"
                  variant="solid"
                  color="blue"
                      fullWidth
                  size='sm'
                  disabled={isSaving || !isFormValid || !selectedHost}
                  type="submit"
                >
                  {isSaving ? `Signing in… (${elapsedSeconds}s)` : 'Login'}
                </Button>
                {!isLocked && (
                  <div className="text-center py-1">
                    <button
                      type="button"
                      onClick={() => navigate('/onboarding', { state: { prefill: { fromLogin: true } } })}
                      className="text-xs text-neutral-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                    >
                      + Add a new server
                    </button>
                  </div>
                )}
              </div>
            </form>
          )}
        </Panel>
      </div>

      <Modal
        title={dialog.title}
        isOpen={dialog.isOpen}
        onClose={() => setDialog((p) => ({ ...p, isOpen: false }))}
      >
        <div>
          <Alert variant="outline" tone={dialog.tone} title={dialog.message} description={dialog.errorMessage} />
          <div className="flex justify-end pt-3">
            <Button variant="solid" onClick={() => setDialog((p) => ({ ...p, isOpen: false }))}>OK</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
