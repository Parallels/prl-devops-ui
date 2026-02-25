import React, { useState, useEffect } from 'react';
import { Alert, Button, FormField, FormLayout, Input, Toggle } from '../../controls';
import { Modal } from '../../controls';
import { useConfig } from '@/contexts/ConfigContext';
import { useSession } from '@/contexts/SessionContext';
import { authService } from '@/services/authService';
import { HostAuthType, HostConfig } from '@/interfaces/Host';
import { getPasswordKey, getApiKeyKey } from '@/utils/secretKeys';
import { decodeToken } from '@/utils/tokenUtils';
import { devopsService } from '@/services/devops';

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

export interface AddHostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (host: HostConfig) => void;
}

export const AddHostModal: React.FC<AddHostModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const config = useConfig();
  const { setSession } = useSession();
  const [isConnecting, setIsConnecting] = useState(false);
  const [name, setName] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [authType, setAuthType] = useState<HostAuthType>('credentials');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [formTouched, setFormTouched] = useState<TouchedFields>({
    serverUrl: false,
    username: false,
    password: false,
    apiKey: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [connectError, setConnectError] = useState<string | null>(null);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setServerUrl('');
      setAuthType('credentials');
      setUsername('');
      setPassword('');
      setApiKey('');
      setFormTouched({ serverUrl: false, username: false, password: false, apiKey: false });
      setErrors({});
      setConnectError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    validateForm();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      if (!username.trim()) newErrors.username = 'Username is required';
      if (!password.trim()) newErrors.password = 'Password is required';
    } else {
      if (!apiKey.trim()) newErrors.apiKey = 'API Key is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: keyof TouchedFields) => {
    setFormTouched((prev) => ({ ...prev, [field]: true }));
  };

  const hasError = (field: keyof FormErrors) =>
    formTouched[field as keyof TouchedFields] && !!errors[field];

  const isFormValid = Object.keys(errors).length === 0;

  const handleConnect = async () => {
    setFormTouched({ serverUrl: true, username: true, password: true, apiKey: true });
    if (!validateForm()) return;

    setIsConnecting(true);
    setConnectError(null);

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

      // Save secrets
      if (authType === 'credentials') {
        await config.setSecret(getPasswordKey(hostname), password);
        await config.removeSecret(getApiKeyKey(hostname));
      } else {
        await config.setSecret(getApiKeyKey(hostname), apiKey);
        await config.removeSecret(getPasswordKey(hostname));
      }
      await config.flushSecrets();

      // Fetch hardware info (non-fatal)
      let hardwareInfo: HostConfig['hardwareInfo'];
      try {
        hardwareInfo = await devopsService.config.getHardwareInfo(hostname);
      } catch { /* non-fatal */ }

      // Upsert host
      const existingHosts = (await config.get<HostConfig[]>('hosts')) ?? [];
      const existingIndex = existingHosts.findIndex((h) => h.hostname === hostname);
      const willBeOnlyHost = existingIndex >= 0
        ? existingHosts.length === 1
        : existingHosts.length === 0;

      const hostEntry: HostConfig = {
        id: existingIndex >= 0 ? existingHosts[existingIndex].id : crypto.randomUUID(),
        name: name.trim() || undefined,
        hostname,
        baseUrl: normalizedUrl,
        authType,
        username: authType === 'credentials' ? username : '',
        keepLoggedIn: true,
        lastUsed: new Date().toISOString(),
        isDefault: willBeOnlyHost
          ? true
          : existingIndex >= 0
            ? existingHosts[existingIndex].isDefault
            : undefined,
        type: 'Orchestrator',
        hardwareInfo,
      };

      if (existingIndex >= 0) {
        existingHosts[existingIndex] = hostEntry;
      } else {
        existingHosts.push(hostEntry);
      }

      await config.set('hosts', existingHosts);
      await config.save();

      authService.currentHostname = hostname;
      const token = authService.getToken(hostname);
      const tokenPayload = token ? decodeToken(token) ?? undefined : undefined;

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

      onSuccess?.(hostEntry);
      onClose();
    } catch (error) {
      setConnectError((error as Error)?.message ?? 'Could not connect to the server. Please check the URL and credentials.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Modal
      title="Add New Host"
      description="Connect to a Parallels DevOps server"
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      actions={
        <>
          <Button variant="soft" color="slate" onClick={onClose} disabled={isConnecting}>
            Cancel
          </Button>
          <Button
            variant="solid"
            color="blue"
            onClick={() => void handleConnect()}
            disabled={isConnecting || !isFormValid}
          >
            {isConnecting ? 'Connecting...' : 'Connect'}
          </Button>
        </>
      }
    >
      {connectError && (
        <Alert
          variant="outline"
          tone="danger"
          title="Connection Failed"
          description={connectError}
        />
      )}

      <FormLayout columns={1} gap="sm">
        <FormField label="Display Name" width="full">
          <Input
            type="text"
            tone="blue"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Production Server (optional)"
          />
        </FormField>

        <FormField
          label="Server URL"
          required
          width="full"
          error={hasError('serverUrl') ? errors.serverUrl : undefined}
        >
          <Input
            type="url"
            tone="blue"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            onBlur={() => {
              if (serverUrl && !/^https?:\/\//i.test(serverUrl)) {
                setServerUrl('https://' + serverUrl);
              }
              handleBlur('serverUrl');
            }}
            required
            placeholder="https://your-server.example.com"
          />
        </FormField>

        <div className="py-1">
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
              required
              width="full"
              error={hasError('username') ? errors.username : undefined}
            >
              <Input
                type="text"
                tone="blue"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={() => handleBlur('username')}
                required
                placeholder="Enter your username"
              />
            </FormField>
            <FormField
              label="Password"
              required
              width="full"
              error={hasError('password') ? errors.password : undefined}
            >
              <Input
                type="password"
                tone="blue"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur('password')}
                required
                placeholder="Enter your password"
              />
            </FormField>
          </>
        )}

        {authType === 'api_key' && (
          <FormField
            label="API Key"
            required
            width="full"
            error={hasError('apiKey') ? errors.apiKey : undefined}
          >
            <Input
              type="password"
              tone="blue"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onBlur={() => handleBlur('apiKey')}
              required
              placeholder="Enter your API key"
            />
          </FormField>
        )}
      </FormLayout>
    </Modal>
  );
};
