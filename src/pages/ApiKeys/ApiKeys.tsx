import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Button,
    CustomIcon,
    DeleteConfirmModal,
    EmptyState,
    formatDate,
    IconButton,
    Input,
    Modal,
    ModalActions,
    normalizeStringToUpper,
    Pill,
    SearchBar,
    Table,
    ThemeColor,
    type Column,
} from '@prl/ui-kit';
import { devopsService } from '@/services/devops';
import { DevOpsApiKey } from '@/interfaces/devops';
import { useSession } from '@/contexts/SessionContext';
import { PageHeader, PageHeaderIcon } from '@/components/PageHeader';

const NEW_KEY_ID = '__new__';

/**
 * Generate a cryptographically-random secret in the form:
 * devops_{64 alphanumeric characters}
 */
function generateSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return 'devops_' + Array.from(bytes).map((b) => chars[b % chars.length]).join('');
}


// ── Encoded-key reveal modal ──────────────────────────────────────────────────

function NewKeyModal({ encodedKey, onClose }: { encodedKey: string; onClose: () => void }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        void navigator.clipboard.writeText(encodedKey).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <Modal isOpen title="API Key Created" onClose={onClose} size="md">
            <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <CustomIcon icon="Info" className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                        Copy this encoded key now — it will <strong>not</strong> be shown again.
                        Use it as the Bearer token in your API requests.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex-1 font-mono text-xs bg-neutral-100 dark:bg-neutral-800 rounded-lg px-3 py-2.5 text-neutral-800 dark:text-neutral-200 break-all select-all">
                        {encodedKey}
                    </div>
                    <Button
                        variant={copied ? 'solid' : 'outline'}
                        color={copied ? 'emerald' : 'slate'}
                        size="sm"
                        leadingIcon={copied ? 'Checkmark' : 'Copy'}
                        onClick={handleCopy}
                    >
                        {copied ? 'Copied' : 'Copy'}
                    </Button>
                </div>
            </div>
            <ModalActions>
                <Button variant="solid" color="parallels" onClick={onClose}>Done</Button>
            </ModalActions>
        </Modal>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export const ApiKeys: React.FC = () => {
    const { session, hasClaim } = useSession();
    const hostname = session?.hostname ?? '';

    const [keys, setKeys] = useState<DevOpsApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyExpiry, setNewKeyExpiry] = useState('');
    const [saving, setSaving] = useState(false);
    const [nameError, setNameError] = useState('');

    const [keyToDelete, setKeyToDelete] = useState<DevOpsApiKey | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [revealedEncoded, setRevealedEncoded] = useState<string | null>(null);

    const canCreate = hasClaim('CREATE_API_KEY');
    const canDelete = hasClaim('DELETE_API_KEY');

    const nameInputRef = useRef<HTMLInputElement>(null);

    const getExpiredTone = (expiresAt?: string): ThemeColor => {
        if (!expiresAt) return 'emerald';
        const isExpired = new Date(expiresAt) < new Date();
        if (isExpired) {
            return 'rose';
        }
        // if we have less than a month we show warning
        const isWarning = new Date(expiresAt) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        if (isWarning) {
            return 'amber';
        }
        return 'emerald';
    };

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

    useEffect(() => { void fetchKeys(); }, [fetchKeys]);

    const handleAddNew = useCallback(() => {
        setIsAdding(true);
        setNewKeyName('');
        setNewKeyExpiry('');
        setNameError('');
        setTimeout(() => nameInputRef.current?.focus(), 50);
    }, []);

    const handleCancel = useCallback(() => {
        setIsAdding(false);
        setNewKeyName('');
        setNewKeyExpiry('');
        setNameError('');
    }, []);

    const handleSave = useCallback(async () => {
        const trimmedName = newKeyName.trim();
        if (!trimmedName) {
            setNameError('Name is required');
            nameInputRef.current?.focus();
            return;
        }
        setSaving(true);
        try {
            const created = await devopsService.apiKeys.createApiKey(hostname, {
                name: trimmedName,
                key: normalizeStringToUpper(trimmedName),
                secret: generateSecret(),
                ...(newKeyExpiry ? { expires_at: `${newKeyExpiry}T23:59:59Z` } : {}),
            });
            // Add to the list without the encoded token (that's already gone after this call)
            setKeys((prev) => [...prev, {
                id: created.id,
                name: created.name,
                key: created.key,
                expires_at: created.expires_at || undefined,
            }]);
            setIsAdding(false);
            setNewKeyName('');
            setNewKeyExpiry('');
            setRevealedEncoded(created.encoded);
        } catch (err: any) {
            setNameError(err?.message ?? 'Failed to create API key');
        } finally {
            setSaving(false);
        }
    }, [hostname, newKeyName, newKeyExpiry]);

    const handleDelete = useCallback(async (key: DevOpsApiKey) => {
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
    }, [hostname]);

    // ── Filter ──────────────────────────────────────────────────────────────
    const filteredKeys = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return keys;
        return keys.filter((k) =>
            (k.name ?? '').toLowerCase().includes(q) ||
            (k.key ?? '').toLowerCase().includes(q) ||
            (k.user_id ?? '').toLowerCase().includes(q)
        );
    }, [keys, search]);

    // Inject the new-row sentinel at the top when adding
    const tableData = useMemo<DevOpsApiKey[]>(() => {
        if (!isAdding) return filteredKeys;
        return [{ id: NEW_KEY_ID, name: '', key: '' }, ...filteredKeys];
    }, [isAdding, filteredKeys]);

    // ── Columns ─────────────────────────────────────────────────────────────
    const columns = useMemo<Column<DevOpsApiKey>[]>(() => [
        {
            id: 'name',
            header: 'Name',
            accessor: 'name',
            sortable: true,
            sortValue: (row) => row.name ?? '',
            render: (row) => {
                if (row.id === NEW_KEY_ID) {
                    return (
                        <div className="flex flex-col gap-1 py-1">
                            <Input
                                ref={nameInputRef}
                                size="sm"
                                placeholder="e.g. CI/CD Pipeline Key"
                                value={newKeyName}
                                onChange={(e) => { setNewKeyName(e.target.value); setNameError(''); }}
                                onKeyDown={(e) => { if (e.key === 'Enter') void handleSave(); if (e.key === 'Escape') handleCancel(); }}
                                validationStatus={nameError ? 'error' : 'none'}
                            />
                            {nameError && <p className="text-xs text-rose-500">{nameError}</p>}
                        </div>
                    );
                }
                return <span className="font-medium text-neutral-800 dark:text-neutral-200">{row.name ?? '—'}</span>;
            },
        },
        {
            id: 'key',
            header: 'Key ID',
            accessor: 'key',
            width: 260,
            render: (row) => {
                if (row.id === NEW_KEY_ID) {
                    // Live preview of the normalised key identifier
                    const preview = newKeyName.trim() ? normalizeStringToUpper(newKeyName.trim()) : null;
                    return preview
                        ? <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400 tracking-wider">{preview}</span>
                        : <span className="text-xs italic text-neutral-400 dark:text-neutral-500">Auto-generated from name</span>;
                }
                return (
                    <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400 tracking-wider">
                        {row.key ?? '—'}
                    </span>
                );
            },
        },
        {
            id: 'expires',
            header: 'Expires',
            accessor: 'expires_at',
            sortable: true,
            align: 'center',
            sortValue: (row) => row.expires_at ?? '',
            width: 160,
            render: (row) => {
                if (row.id === NEW_KEY_ID) {
                    return (
                        <Input
                            size="sm"
                            type="date"
                            placeholder="Never"
                            value={newKeyExpiry}
                            onChange={(e) => setNewKeyExpiry(e.target.value)}
                        />
                    );
                }
                if (!row.expires_at) return <Pill size="sm" tone="rose" variant="soft">Never</Pill>;
                const tone = getExpiredTone(row.expires_at);
                return (
                    <Pill size="sm" tone={tone} variant="soft">
                        {formatDate(row.expires_at)}
                    </Pill>
                );
            },
        },
        {
            id: 'id',
            header: 'ID',
            accessor: 'id',
            maxWidth: 300,
            render: (row) => {
                if (row.id === NEW_KEY_ID) return <span className="text-neutral-400">—</span>;
                return <span className="text-sm text-neutral-500 dark:text-neutral-400">{row.id}</span>;
            },
        },
        {
            id: 'actions',
            header: '',
            width: 56,
            align: 'center',
            render: (row) => {
                if (row.id === NEW_KEY_ID) return null;
                if (!canDelete) return null;
                return (
                    <IconButton
                        icon="Trash"
                        size="xs"
                        variant="ghost"
                        color="danger"
                        onClick={(e) => { e.stopPropagation(); setKeyToDelete(row); }}
                        aria-label="Delete key"
                    />
                );
            },
        },
    ], [isAdding, newKeyName, newKeyExpiry, nameError, handleSave, handleCancel, canDelete]);

    const renderEmptyState = () => (
        <EmptyState
            tone="neutral"
            iconSize="sm"
            icon="KeyManagement"
            title="No API keys yet"
            subtitle={canCreate ? 'Click "New API Key" to create your first key.' : 'No API keys have been created.'}
            disableBorder
        />
    );

    if (error) {
        return (
            <div className="flex items-center justify-center flex-col w-full h-full bg-white dark:bg-neutral-950">
                <EmptyState
                    tone="danger"
                    showIcon
                    icon="Error"
                    title="Something went wrong"
                    subtitle={typeof error === "string" ? error : "An unexpected error occurred."}
                    disableBorder
                    actionLabel="Retry"
                    actionVariant="solid"
                    actionColor="blue"
                    onAction={() => void fetchKeys()}
                    size="lg"
                />
            </div>
        );
    }

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-950">

            {/* ── Header ──────────────────────────────────────────────── */}
            <PageHeader
                icon={<PageHeaderIcon color="rose"><CustomIcon icon="KeyManagement" className="w-5 h-5" /></PageHeaderIcon>}
                title="API Keys"
                subtitle={loading ? 'Loading…' : `${keys.length} key${keys.length !== 1 ? 's' : ''} · Manage programmatic access tokens`}
                search={<SearchBar leadingIcon="Search" variant="gradient" glowIntensity="soft" onSearch={(q) => setSearch(q)} placeholder="Search keys…" />}
                searchWidth="w-100"
                actions={<>
                    <IconButton
                        icon="Refresh"
                        variant="ghost"
                        color="slate"
                        size="xs"
                        onClick={() => void fetchKeys()}
                        aria-label="Refresh"
                    />
                    {isAdding ? (
                        <>
                            <Button variant="ghost" color="slate" size="sm" onClick={handleCancel}>
                                Cancel
                            </Button>
                            <Button
                                variant="solid"
                                color="parallels"
                                size="sm"
                                loading={saving}
                                leadingIcon="Key"
                                onClick={() => void handleSave()}
                            >
                                Generate Key
                            </Button>
                        </>
                    ) : (
                        canCreate && (
                            <Button
                                variant="soft"
                                color="parallels"
                                size="sm"
                                leadingIcon="Add"
                                onClick={handleAddNew}
                            >
                                New API Key
                            </Button>
                        )
                    )}
                </>}
                className="flex-none bg-white dark:bg-neutral-900"
            />
            <div className="flex-1 min-h-0 p-2">
                <Table<DevOpsApiKey>
                    columns={columns}
                    data={tableData}
                    rowKey={(row) => row.id ?? Math.random().toString()}
                    variant="flat"
                    stickyHeader
                    fullHeight
                    hoverable
                    noBorders
                    loading={loading}
                    loadingMessage="Loading API keys…"
                    defaultSort={{ columnId: 'name', direction: 'asc' }}
                    emptyState={
                        error ? (
                            <div className="flex flex-col items-center gap-3 py-4">
                                <p className="text-sm text-rose-500">{error}</p>
                                <Button variant="outline" color="slate" size="sm" onClick={() => void fetchKeys()}>Retry</Button>
                            </div>
                        ) : renderEmptyState()
                    }
                />
            </div>
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
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    This action is irreversible. Any applications using this key will immediately lose access.
                </p>
            </DeleteConfirmModal>

            {/* ── Reveal encoded key (shown once after creation) ───────── */}
            {revealedEncoded && (
                <NewKeyModal encodedKey={revealedEncoded} onClose={() => setRevealedEncoded(null)} />
            )}
        </div>
    );
};
