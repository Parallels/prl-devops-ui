import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Alert, CollapsiblePanel, FormField, Input, MultiToggle, Panel, PasswordInput } from '@prl/ui-kit';
import { devopsService } from '@/services/devops';
import type { AddOrchestratorHostRequest } from '@/interfaces/devops';
import { TagInput } from './TagInput';
import type { AuthType, ConnectFormHandle, ConnectFormState } from './types';

export interface ConnectToHostFormProps {
  hostname: string;
  color: string;
  onConnected: () => void;
  onStateChange?: (state: ConnectFormState) => void;
}

export const ConnectToHostForm = forwardRef<ConnectFormHandle, ConnectToHostFormProps>(function ConnectForm({ hostname, color, onConnected, onStateChange }, ref) {
  const formRef = useRef<HTMLFormElement>(null);

  const [hostUrl, setHostUrl] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [authType, setAuthType] = useState<AuthType>('credentials');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ hostUrl: false, username: false, password: false, apiKey: false });

  // ── Imperative handle ───────────────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    submit: () => formRef.current?.requestSubmit(),
  }));

  // ── Validation ──────────────────────────────────────────────────────────────
  const touch = (f: keyof typeof touched) => setTouched((p) => ({ ...p, [f]: true }));

  const urlError =
    touched.hostUrl && !hostUrl.trim()
      ? 'Host URL is required'
      : touched.hostUrl &&
          (() => {
            try {
              new URL(hostUrl);
              return false;
            } catch {
              return true;
            }
          })()
        ? 'Enter a valid URL'
        : undefined;

  const usernameError = authType === 'credentials' && touched.username && !username.trim() ? 'Username is required' : undefined;
  const passwordError = authType === 'credentials' && touched.password && !password.trim() ? 'Password is required' : undefined;
  const apiKeyError = authType === 'api_key' && touched.apiKey && !apiKey.trim() ? 'API Key is required' : undefined;

  const isValid = !!hostUrl.trim() && !urlError && (authType === 'credentials' ? !!username.trim() && !!password.trim() : !!apiKey.trim());

  // ── Report state to parent ──────────────────────────────────────────────────
  useEffect(() => {
    onStateChange?.({ canSubmit: isValid, isSubmitting: submitting });
  }, [isValid, submitting]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ hostUrl: true, username: true, password: true, apiKey: true });
    if (!isValid) return;

    setSubmitting(true);
    setError(null);
    try {
      const request: AddOrchestratorHostRequest = {
        host: hostUrl.replace(/\/+$/, ''),
        description: description.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        authentication: authType === 'credentials' ? { username, password } : { api_key: apiKey },
      };
      await devopsService.orchestrator.addOrchestratorHost(hostname, request);
      onConnected();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to add host');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <form ref={formRef} onSubmit={(e) => void handleSubmit(e)} noValidate className="flex flex-col gap-3">
      <Panel variant="glass" padding="xs">
        <FormField label="Host URL" required width="full" error={urlError}>
          <Input
            tone={color as any}
            type="url"
            value={hostUrl}
            onChange={(e) => setHostUrl(e.target.value)}
            onBlur={() => {
              if (hostUrl && !/^https?:\/\//i.test(hostUrl)) setHostUrl('http://' + hostUrl);
              touch('hostUrl');
            }}
            placeholder="http://10.0.4.3:5680"
          />
        </FormField>
        <FormField label="Description" width="full">
          <Input tone={color as any} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mac Mini M1 (optional)" />
        </FormField>
      </Panel>

      <Panel variant="glass" padding="xs">
        <MultiToggle
          color={color as any}
          size="md"
          value={authType}
          variant="solid"
          adaptiveWidth
          onChange={(v) => setAuthType(v as AuthType)}
          options={[
            { value: 'credentials', label: 'Credentials' },
            { value: 'api_key', label: 'API Key' },
          ]}
        />

        {authType === 'credentials' && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <FormField label="Username" required width="full" error={usernameError}>
              <Input tone={color as any} value={username} onChange={(e) => setUsername(e.target.value)} onBlur={() => touch('username')} placeholder="root" autoComplete="username" />
            </FormField>
            <FormField label="Password" required width="full" error={passwordError}>
              <PasswordInput
                tone={color as any}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => touch('password')}
                placeholder="Password"
                autoComplete="current-password"
              />
            </FormField>
          </div>
        )}

        {authType === 'api_key' && (
          <div className="mt-3">
            <FormField label="API Key" required width="full" error={apiKeyError}>
              <PasswordInput tone={color as any} value={apiKey} onChange={(e) => setApiKey(e.target.value)} onBlur={() => touch('apiKey')} placeholder="Enter API key" autoComplete="off" />
            </FormField>
          </div>
        )}
      </Panel>

      <CollapsiblePanel title="Tags" variant="glass" padding="xs">
        <TagInput value={tags} onChange={setTags} color={color} />
      </CollapsiblePanel>

      {error && <Alert variant="subtle" tone="danger" title="Error" description={error} />}
    </form>
  );
});
