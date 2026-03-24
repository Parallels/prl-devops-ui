import React, { useCallback, useEffect, useState } from 'react';
import { Button, FormField, Input, Panel, Section, Toggle } from '@prl/ui-kit';
import { ReverseProxyHost } from '@/interfaces/ReverseProxy';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';

// ── Tag input (for CORS arrays) ───────────────────────────────────────────────

interface TagInputProps {
  values: string[];
  placeholder?: string;
  onChange: (values: string[]) => void;
  disabled?: boolean;
  suggestions?: string[];
}

const TagInput: React.FC<TagInputProps> = ({ values, placeholder, onChange, disabled, suggestions = [] }) => {
  const [draft, setDraft] = useState('');

  const commit = (raw: string) => {
    const v = raw.trim();
    if (!v || values.includes(v)) {
      setDraft('');
      return;
    }
    onChange([...values, v]);
    setDraft('');
  };

  return (
    <div
      className={`rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 p-1.5 min-h-[38px] flex flex-wrap gap-1 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      {values.map((v) => (
        <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300">
          {v}
          <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} className="hover:text-rose-500">
            ×
          </button>
        </span>
      ))}
      <input
        className="flex-1 min-w-[100px] bg-transparent text-sm text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 outline-none px-1"
        placeholder={values.length === 0 ? placeholder : ''}
        value={draft}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commit(draft);
          }
          if (e.key === 'Backspace' && !draft && values.length) onChange(values.slice(0, -1));
        }}
        onBlur={() => draft && commit(draft)}
        list="tag-suggestions"
      />
      {suggestions.length > 0 && (
        <datalist id="tag-suggestions">
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      )}
    </div>
  );
};

// ── Component ─────────────────────────────────────────────────────────────────

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];

interface SettingsTabProps {
  proxyHost: ReverseProxyHost;
  canUpdate: boolean;
  onSave: (updated: Partial<ReverseProxyHost>) => Promise<void>;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ proxyHost, canUpdate, onSave }) => {
  const { themeColor } = useSystemSettings();
  const hasTcpRoute = !!proxyHost.tcp_route;

  const [name, setName] = useState(proxyHost.name ?? '');
  const [host, setHost] = useState(proxyHost.host ?? '');
  const [port, setPort] = useState(proxyHost.port ?? '80');
  const [corsEnabled, setCorsEnabled] = useState(proxyHost.cors?.enabled ?? false);
  const [origins, setOrigins] = useState<string[]>(proxyHost.cors?.allowed_origins ?? []);
  const [methods, setMethods] = useState<string[]>(proxyHost.cors?.allowed_methods ?? []);
  const [headers, setHeaders] = useState<string[]>(proxyHost.cors?.allowed_headers ?? []);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setName(proxyHost.name ?? '');
    setHost(proxyHost.host ?? '');
    setPort(proxyHost.port ?? '80');
    setCorsEnabled(proxyHost.cors?.enabled ?? false);
    setOrigins(proxyHost.cors?.allowed_origins ?? []);
    setMethods(proxyHost.cors?.allowed_methods ?? []);
    setHeaders(proxyHost.cors?.allowed_headers ?? []);
    setIsDirty(false);
  }, [proxyHost]);

  const markDirty = () => setIsDirty(true);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        host: host.trim(),
        port: port.trim(),
        ...(!hasTcpRoute && {
          cors: {
            enabled: corsEnabled,
            allowed_origins: origins,
            allowed_methods: methods,
            allowed_headers: headers,
          },
        }),
      });
      setIsDirty(false);
    } finally {
      setSaving(false);
    }
  }, [name, host, port, corsEnabled, origins, methods, headers, onSave]);

  const corsDisabled = !corsEnabled;

  return (
    <div className="p-4 space-y-6">
      {/* General */}
      <Panel variant="glass" backgroundColor="white" padding="xs">
        <Section title="General Settings" noPadding>
          <FormField className="pt-2" label="Name" description="Friendly display name (falls back to host if left blank)">
            <Input
              value={name}
              required
              onChange={(e) => {
                setName(e.target.value);
                markDirty();
              }}
              tone={themeColor}
              placeholder="e.g. My API Gateway"
              disabled={!canUpdate}
            />
          </FormField>
          <div className="grid pt-2 grid-cols-[1fr_90px] gap-3">
            <FormField label="Listen Host / IP">
              <Input
                value={host}
                onChange={(e) => {
                  setHost(e.target.value);
                  markDirty();
                }}
                tone={themeColor}
                placeholder="api.domain.local or 0.0.0.0"
                disabled={!canUpdate}
              />
            </FormField>
            <FormField label="Listen Port">
              <Input
                value={port}
                onChange={(e) => {
                  setPort(e.target.value);
                  markDirty();
                }}
                placeholder="80"
                tone={themeColor}
                className="font-mono"
                disabled={!canUpdate}
              />
            </FormField>
          </div>
        </Section>
      </Panel>

      {/* CORS — hidden for TCP routes */}
      {!hasTcpRoute && (
        <Panel variant="glass" backgroundColor="white" padding="xs">
          <Section title="CORS Settings" noPadding>
            <div className="flex items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Enable CORS</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Applies cross-origin headers to all HTTP responses from this host</p>
              </div>
              <Toggle
                checked={corsEnabled}
                onChange={(e) => {
                  setCorsEnabled(e.target.checked);
                  markDirty();
                }}
                disabled={!canUpdate}
                color={themeColor}
              />
            </div>

            {corsEnabled && (
              <div className="pl-3 border-l-2 border-sky-200 dark:border-sky-700 space-y-3">
                <FormField label="Allowed Origins" description="Enter origins and press Enter. Use * for all.">
                  <TagInput
                    values={origins}
                    placeholder="https://example.com"
                    onChange={(v) => {
                      setOrigins(v);
                      markDirty();
                    }}
                    disabled={!canUpdate || corsDisabled}
                  />
                </FormField>

                <FormField label="Allowed Methods">
                  <div className="flex flex-wrap gap-1.5">
                    {HTTP_METHODS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setMethods((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
                          markDirty();
                        }}
                        disabled={!canUpdate || corsDisabled}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                          methods.includes(m) ? 'bg-sky-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </FormField>

                <FormField label="Allowed Headers" description="Enter header names and press Enter.">
                  <TagInput
                    values={headers}
                    placeholder="Content-Type"
                    onChange={(v) => {
                      setHeaders(v);
                      markDirty();
                    }}
                    disabled={!canUpdate || corsDisabled}
                    suggestions={['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']}
                  />
                </FormField>
              </div>
            )}
          </Section>
        </Panel>
      )}

      {/* Save */}
      {canUpdate && isDirty && (
        <div className="flex justify-end pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <Button variant="solid" color={themeColor} size="sm" loading={saving} onClick={() => void handleSave()}>
            Save Settings
          </Button>
        </div>
      )}
    </div>
  );
};
