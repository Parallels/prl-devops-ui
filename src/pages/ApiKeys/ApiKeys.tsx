import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, CustomIcon, DeleteConfirmModal, EmptyState, IconButton, SearchBar, SplitView, normalizeStringToUpper, type SplitViewItem } from '@prl/ui-kit';
import { devopsService } from '@/services/devops';
import { DevOpsApiKey } from '@/interfaces/devops';
import { useSession } from '@/contexts/SessionContext';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { PageHeaderIcon } from '@/components/PageHeader';
import { ApiKeysPanel } from './ApiKeysPanel';
import { CreateApiKeyModal, type CreateApiKeyModalPayload } from './CreateApiKeyModal';
import { NewApiKeyRevealModal } from './NewApiKeyRevealModal';

const API_KEYS_PANEL_ID = 'api-keys-main';

/**
 * Generate a cryptographically-random secret in the form:
 * devops_{64 alphanumeric characters}
 */
function generateSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return (
    'devops_' +
    Array.from(bytes)
      .map((b) => chars[b % chars.length])
      .join('')
  );
}

export const ApiKeys: React.FC = () => {
  const { session, hasClaim } = useSession();
  const { themeColor } = useSystemSettings();
  const hostname = session?.hostname ?? '';

  const [keys, setKeys] = useState<DevOpsApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>(API_KEYS_PANEL_ID);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [keyToDelete, setKeyToDelete] = useState<DevOpsApiKey | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [revealedEncoded, setRevealedEncoded] = useState<string | null>(null);

  const canCreate = hasClaim('CREATE_API_KEY');
  const canDelete = hasClaim('DELETE_API_KEY');

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await devopsService.apiKeys.getApiKeys(hostname);
      setKeys(result);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, [hostname]);

  useEffect(() => {
    void fetchKeys();
  }, [fetchKeys]);

  const handleCreate = useCallback(
    async (payload: CreateApiKeyModalPayload) => {
      setCreating(true);
      try {
        const created = await devopsService.apiKeys.createApiKey(hostname, {
          name: payload.name,
          key: normalizeStringToUpper(payload.name),
          secret: generateSecret(),
          ...(payload.expiresAt ? { expires_at: `${payload.expiresAt}T23:59:59Z` } : {}),
        });

        setKeys((prev) => [
          ...prev,
          {
            id: created.id,
            name: created.name,
            key: created.key,
            expires_at: created.expires_at || undefined,
          },
        ]);

        setShowCreateModal(false);
        setRevealedEncoded(created.encoded);
      } catch (err: any) {
        throw new Error(err?.message ?? 'Failed to create API key');
      } finally {
        setCreating(false);
      }
    },
    [hostname],
  );

  const handleDelete = useCallback(
    async (key: DevOpsApiKey) => {
      if (!key.id) return;
      setDeleting(true);
      try {
        await devopsService.apiKeys.deleteApiKey(hostname, key.id);
        setKeys((prev) => prev.filter((k) => k.id !== key.id));
        setKeyToDelete(null);
      } catch (err: any) {
        console.error('Failed to delete API key:', err);
      } finally {
        setDeleting(false);
      }
    },
    [hostname],
  );

  const filteredKeys = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return keys;
    return keys.filter((k) => (k.name ?? '').toLowerCase().includes(q) || (k.key ?? '').toLowerCase().includes(q) || (k.user_id ?? '').toLowerCase().includes(q));
  }, [keys, search]);

  const items = useMemo<SplitViewItem[]>(
    () => [
      {
        id: API_KEYS_PANEL_ID,
        label: 'API Keys',
        subtitle: `${filteredKeys.length} key${filteredKeys.length === 1 ? '' : 's'}`,
        icon: 'KeyManagement',
        panel: (
          <div className="flex-1 min-h-0 w-full h-full">
            <ApiKeysPanel onCreate={() => setShowCreateModal(true)} keys={filteredKeys} loading={loading} canCreate={canCreate} canDelete={canDelete} onDelete={setKeyToDelete} />
          </div>
        ),
      },
    ],
    [filteredKeys, loading, canCreate, canDelete],
  );

  const panelHeaderProps = useMemo(
    () => ({
      icon: (
        <PageHeaderIcon color={themeColor}>
          <CustomIcon icon="KeyManagement" className="w-5 h-5" />
        </PageHeaderIcon>
      ),
      title: 'API Keys',
      subtitle: loading ? 'Loading…' : `${keys.length} key${keys.length !== 1 ? 's' : ''} · Manage programmatic access tokens`,
      search: <SearchBar leadingIcon="Search" color={themeColor} variant="gradient" glowIntensity="soft" onSearch={(q) => setSearch(q)} placeholder="Search keys…" />,
      searchWidth: 'sm:w-20 md:w-70',
      actions: (
        <>
          {canCreate && (
            <Button variant="soft" color={themeColor} size="sm" leadingIcon="Add" onClick={() => setShowCreateModal(true)}>
              New API Key
            </Button>
          )}
          <IconButton icon="Refresh" variant="ghost" color={themeColor} size="xs" onClick={() => void fetchKeys()} aria-label="Refresh" />
        </>
      ),
    }),
    [themeColor, loading, keys.length, fetchKeys, canCreate],
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
        <SplitView
          className="h-full"
          items={items}
          value={selectedId}
          onChange={(id) => setSelectedId(id)}
          loading={loading}
          error={error ?? undefined}
          onRetry={() => void fetchKeys()}
          panelHeaderProps={panelHeaderProps}
          color={themeColor}
          autoHideList
          panelScrollable={false}
          emptyState={<EmptyState disableBorder icon="Key" title="No API Keys" subtitle="We couldn't find any API keys to display." tone="neutral" />}
          panelEmptyState={<EmptyState disableBorder icon="Key" title="There are no API keys" subtitle="We couldn't find any API keys to display." tone="neutral" />}
        />
      </div>

      <CreateApiKeyModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onCreate={handleCreate} saving={creating} themeColor={themeColor} />

      <DeleteConfirmModal
        isOpen={!!keyToDelete}
        onClose={() => setKeyToDelete(null)}
        onConfirm={() => keyToDelete && void handleDelete(keyToDelete)}
        title="Delete API Key"
        icon="Trash"
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        isConfirmDisabled={deleting}
        confirmValue={keyToDelete?.name ?? ''}
        confirmValueLabel="key name"
        size="md"
      >
        <p className="text-sm text-neutral-500 dark:text-neutral-400">This action is irreversible. Any applications using this key will immediately lose access.</p>
      </DeleteConfirmModal>

      {revealedEncoded && <NewApiKeyRevealModal encodedKey={revealedEncoded} onClose={() => setRevealedEncoded(null)} />}
    </div>
  );
};
