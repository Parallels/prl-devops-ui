import React, { useCallback, useEffect, useState } from 'react';
import { Table, Pill, Button, EmptyState, type Column } from '@prl/ui-kit';
import { devopsService } from '@/services/devops';
import { VirtualMachine } from '@/interfaces/devops';
import { useSession } from '@/contexts/SessionContext';

type VmState = 'running' | 'stopped' | 'paused' | 'suspended' | 'error' | string;

const stateTone: Record<VmState, string> = {
    running: 'success',
    stopped: 'neutral',
    paused: 'warning',
    suspended: 'info',
    error: 'danger',
};

function getStateTone(state?: string): string {
    if (!state) return 'neutral';
    return stateTone[state.toLowerCase()] ?? 'neutral';
}

const columns: Column<VirtualMachine>[] = [
    {
        id: 'name',
        header: 'Name',
        accessor: 'Name',
        sortable: true,
        render: (row) => (
            <span className="font-medium">{row.Name ?? '—'}</span>
        ),
    },
    {
        id: 'state',
        header: 'State',
        accessor: 'State',
        sortable: true,
        width: 140,
        render: (row) => (
            <Pill size="sm" tone={getStateTone(row.State) as any} variant="soft">
                {row.State ?? 'Unknown'}
            </Pill>
        ),
    },
    {
        id: 'os',
        header: 'OS',
        accessor: 'OS',
        sortable: true,
        render: (row) => row.OS ?? '—',
    },
    {
        id: 'description',
        header: 'Description',
        accessor: 'Description',
        render: (row) => (
            <span className="text-muted truncate max-w-[300px] block">
                {row.Description || '—'}
            </span>
        ),
    },
    {
        id: 'id',
        header: 'ID',
        accessor: 'ID',
        width: 280,
        render: (row) => (
            <span className="text-muted font-mono text-xs">{row.ID ?? '—'}</span>
        ),
    },
];

export const Vms: React.FC = () => {
    const [vms, setVms] = useState<VirtualMachine[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { session } = useSession();

    const fetchVms = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const machines = await devopsService.machines.getVirtualMachines(session?.hostname ?? '', true);
            setVms(machines);
        } catch (err: any) {
            const message = err?.message ?? 'Failed to load virtual machines';
            setError(message);
            console.error('Failed to fetch VMs:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchVms();
    }, [fetchVms]);

    return (
        <div className="flex flex-col gap-4 p-6 h-full">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Virtual Machines</h1>
                <Button variant="outline" color="blue" size="sm" onClick={() => void fetchVms()}>
                    Refresh
                </Button>
            </div>

            {error ? (
                <div className="flex-1 flex items-center justify-center">
                    <EmptyState
                        icon="Error"
                        title="Failed to load machines"
                        subtitle={error}
                        buttonText="Retry"
                        onAction={() => void fetchVms()}
                        actionVariant="solid"
                        actionColor="blue"
                        tone="danger"
                    />
                </div>
            ) : (
                <Table<VirtualMachine>
                    columns={columns}
                    data={vms}
                    rowKey={(row) => row.ID ?? Math.random().toString()}
                    loading={loading}
                    loadingMessage="Loading virtual machines..."
                    hoverable
                    striped
                    stickyHeader
                    fullHeight
                    emptyState={
                        <EmptyState
                            icon="Container"
                            title="No virtual machines"
                            subtitle="No virtual machines found on the connected host."
                        />
                    }
                />
            )}
        </div>
    );
};
