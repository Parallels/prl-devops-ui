import React, { useCallback, useEffect, useState } from 'react';
import { Table, Pill, Button, EmptyState, type Column } from '@prl/ui-kit';
import { devopsService } from '@/services/devops';
import { DevOpsRemoteHost } from '@/interfaces/devops';
import { useSession } from '@/contexts/SessionContext';

export const Hosts: React.FC = () => {
    const [hosts, setHosts] = useState<DevOpsRemoteHost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { session } = useSession();

    const fetchHosts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await devopsService.orchestrator.getOrchestratorHosts(session?.hostname ?? '');
            setHosts(data);
        } catch (err: any) {
            const message = err?.message ?? 'Failed to load hosts';
            setError(message);
            console.error('Failed to fetch hosts:', err);
        } finally {
            setLoading(false);
        }
    }, [session?.hostname]);

    useEffect(() => {
        void fetchHosts();
    }, [fetchHosts]);

    const columns: Column<DevOpsRemoteHost>[] = [
        {
            id: 'host',
            header: 'Host',
            accessor: 'host',
            sortable: true,
            render: (row) => (
                <span className="font-medium">{row.host ?? '—'}</span>
            ),
        },
        {
            id: 'status',
            header: 'Status',
            accessor: 'enabled',
            sortable: true,
            width: 140,
            render: (row) => (
                <Pill size="sm" tone={row.enabled ? 'success' : 'neutral'} variant="soft">
                    {row.enabled ? 'Enabled' : 'Disabled'}
                </Pill>
            ),
        },
        {
            id: 'description',
            header: 'Description',
            accessor: 'description',
            render: (row) => (
                <span className="text-muted truncate max-w-[300px] block">
                    {row.description || '—'}
                </span>
            ),
        },
        {
            id: 'id',
            header: 'ID',
            accessor: 'id',
            width: 280,
            render: (row) => (
                <span className="text-muted font-mono text-xs">{row.id ?? '—'}</span>
            ),
        },
    ];

    return (
        <div className="flex flex-col gap-4 p-6 h-full">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Orchestrator Hosts</h1>
                <Button variant="outline" color="blue" size="sm" onClick={() => void fetchHosts()}>
                    Refresh
                </Button>
            </div>

            {error ? (
                <div className="flex-1 flex items-center justify-center">
                    <EmptyState
                        icon="Error"
                        title="Failed to load hosts"
                        subtitle={error}
                        buttonText="Retry"
                        onAction={() => void fetchHosts()}
                        actionVariant="solid"
                        actionColor="blue"
                        tone="danger"
                    />
                </div>
            ) : (
                <Table<DevOpsRemoteHost>
                    columns={columns}
                    data={hosts}
                    rowKey={(row) => row.id ?? Math.random().toString()}
                    loading={loading}
                    loadingMessage="Loading hosts..."
                    hoverable
                    striped
                    stickyHeader
                    fullHeight
                    emptyState={
                        <EmptyState
                            icon="Server"
                            title="No hosts found"
                            subtitle="No orchestrator hosts found."
                        />
                    }
                />
            )}
        </div>
    );
};
