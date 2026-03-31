import React, { useCallback, useEffect, useState } from 'react';
import { Button, ConfirmModal, FormField, Input, MultiSelectPills, Panel, Section, TagPicker, Toggle, type TagPickerItem } from '@prl/ui-kit';
import { ReverseProxyHost } from '@/interfaces/ReverseProxy';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';

// ── Constants ─────────────────────────────────────────────────────────────────

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];

const COMMON_HEADERS: TagPickerItem[] = [
  { id: 'Content-Type', label: 'Content-Type' },
  { id: 'Authorization', label: 'Authorization' },
  { id: 'Accept', label: 'Accept' },
  { id: 'X-Requested-With', label: 'X-Requested-With' },
  { id: 'Origin', label: 'Origin' },
  { id: 'Cache-Control', label: 'Cache-Control' },
];

// ── Component ─────────────────────────────────────────────────────────────────

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
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

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

  const handleDiscard = () => {
    setName(proxyHost.name ?? '');
    setHost(proxyHost.host ?? '');
    setPort(proxyHost.port ?? '80');
    setCorsEnabled(proxyHost.cors?.enabled ?? false);
    setOrigins(proxyHost.cors?.allowed_origins ?? []);
    setMethods(proxyHost.cors?.allowed_methods ?? []);
    setHeaders(proxyHost.cors?.allowed_headers ?? []);
    setIsDirty(false);
    setShowDiscardConfirm(false);
  };

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
            {/* Enable toggle */}
            <div className="flex items-center justify-between px-3 py-2.5">
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
              <div className="px-3 pb-3 space-y-4">
                {/* Allowed Origins */}
                <FormField label="Allowed Origins" description='Enter origins and press Enter. Use "*" to allow all.'>
                  <TagPicker
                    items={[{ id: '*', label: '*' }]}
                    value={origins}
                    onChange={(v: string[]) => {
                      setOrigins(v);
                      markDirty();
                    }}
                    allowCreate
                    placeholder="https://example.com"
                    searchPlaceholder="Add origin…"
                    color={themeColor}
                    disabled={!canUpdate}
                  />
                </FormField>

                {/* Allowed Methods */}
                <FormField label="Allowed Methods">
                  <MultiSelectPills
                    name="allowed_methods"
                    options={HTTP_METHODS.map((m) => ({ value: m, label: m }))}
                    value={methods}
                    onChange={(selected) => {
                      setMethods(selected);
                      markDirty();
                    }}
                    color={themeColor}
                    rounded="md"
                    gap="1.5"
                    size="xs"
                    disabled={!canUpdate}
                  />
                </FormField>

                {/* Allowed Headers */}
                <FormField label="Allowed Headers" description="Select common headers or type a custom one and press Enter.">
                  <TagPicker
                    items={COMMON_HEADERS}
                    value={headers}
                    onChange={(v: string[]) => {
                      setHeaders(v);
                      markDirty();
                    }}
                    allowCreate
                    placeholder="Content-Type, Authorization…"
                    searchPlaceholder="Search or add header…"
                    color={themeColor}
                    disabled={!canUpdate}
                  />
                </FormField>
              </div>
            )}
          </Section>
        </Panel>
      )}

      {/* Save / Discard */}
      {canUpdate && isDirty && (
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <Button variant="soft" color="slate" size="sm" onClick={() => setShowDiscardConfirm(true)}>
            Discard Changes
          </Button>
          <Button variant="solid" color={themeColor} size="sm" loading={saving} onClick={() => void handleSave()}>
            Save Settings
          </Button>
        </div>
      )}

      <ConfirmModal
        isOpen={showDiscardConfirm}
        title="Discard Changes"
        description="You have unsaved changes. Are you sure you want to discard them?"
        confirmLabel="Discard"
        confirmColor="rose"
        onConfirm={handleDiscard}
        onClose={() => setShowDiscardConfirm(false)}
      />
    </div>
  );
};
