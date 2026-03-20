import React, { useState, useEffect } from 'react';
import { Alert, Button, Checkbox, FormField, FormLayout, Input, Modal } from '../../controls';
import { HostConfig } from '@/interfaces/Host';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';

export interface HostLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  host: HostConfig | null;
  onLogin: (credentials: { username: string; password: string; apiKey: string }, keepLoggedIn: boolean) => Promise<void>;
}

export const HostLoginModal: React.FC<HostLoginModalProps> = ({ isOpen, onClose, host, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ username: false, password: false, apiKey: false });
  const { themeColor } = useSystemSettings();

  useEffect(() => {
    if (isOpen && host) {
      setUsername(host.username ?? '');
      setPassword('');
      setApiKey('');
      setKeepLoggedIn(true);
      setError(null);
      setIsLoading(false);
      setTouched({ username: false, password: false, apiKey: false });
    }
  }, [isOpen, host]);

  if (!host) return null;

  const isCredentials = host.authType === 'credentials';

  const isValid = isCredentials ? username.trim() !== '' && password !== '' : apiKey.trim() !== '';

  const getFieldError = (field: 'username' | 'password' | 'apiKey') => {
    if (!touched[field]) return undefined;
    if (field === 'username' && isCredentials && !username.trim()) return 'Username is required';
    if (field === 'password' && isCredentials && !password) return 'Password is required';
    if (field === 'apiKey' && !isCredentials && !apiKey.trim()) return 'API Key is required';
    return undefined;
  };

  const handleSubmit = async () => {
    setTouched({ username: true, password: true, apiKey: true });
    if (!isValid) return;
    setIsLoading(true);
    setError(null);
    try {
      await onLogin({ username: username.trim(), password, apiKey: apiKey.trim() }, keepLoggedIn);
    } catch (err) {
      setError((err as Error)?.message ?? 'Could not connect with the provided credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) void handleSubmit();
  };

  const hostLabel = host.name || host.hostname;

  return (
    <Modal
      title={`Connect to ${hostLabel}`}
      description="Your credentials are required to switch to this host."
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      closeOnBackdropClick={!isLoading}
      closeOnEsc={!isLoading}
      actions={
        <>
          <Button variant="soft" color="slate" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="solid" color={themeColor} onClick={() => void handleSubmit()} disabled={isLoading || !isValid}>
            {isLoading ? 'Connecting...' : 'Connect'}
          </Button>
        </>
      }
    >
      {/* Host info card */}
      <div className={`rounded-lg border border-${themeColor}-200 bg-${themeColor}-50 px-3 py-2.5 dark:border-neutral-700 dark:bg-neutral-800/60`}>
        <div className="flex items-center gap-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-200">{hostLabel}</p>
            <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">{host.baseUrl}</p>
          </div>
        </div>
      </div>

      {error && <Alert variant="outline" tone="danger" title="Connection Failed" description={error} />}

      <FormLayout columns={1} gap="sm">
        {isCredentials ? (
          <>
            <FormField label="Username" required width="full" error={getFieldError('username')}>
              <Input
                type="text"
                tone={themeColor}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, username: true }))}
                onKeyDown={handleKeyDown}
                placeholder="Enter your username"
                autoComplete="username"
              />
            </FormField>
            <FormField label="Password" required width="full" error={getFieldError('password')}>
              <Input
                type="password"
                tone={themeColor}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                onKeyDown={handleKeyDown}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </FormField>
          </>
        ) : (
          <FormField label="API Key" required width="full" error={getFieldError('apiKey')}>
            <Input
              type="password"
              tone={themeColor}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onBlur={() => setTouched((p) => ({ ...p, apiKey: true }))}
              onKeyDown={handleKeyDown}
              placeholder="Enter your API key"
            />
          </FormField>
        )}

        <Checkbox
          label="Keep me logged in"
          description="Save credentials securely for future sessions"
          checked={keepLoggedIn}
          onChange={(e) => setKeepLoggedIn(e.target.checked)}
          color={themeColor}
          size="sm"
        />
      </FormLayout>
    </Modal>
  );
};
