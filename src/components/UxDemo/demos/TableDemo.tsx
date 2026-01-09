import React, { useState } from 'react';
import { PlaygroundSection } from '../PlaygroundSection';
import { Table, Button, IconButton, MultiToggle, Toggle } from '../../../controls';
import { TableVariant, TableSortState, TableColumn } from '../../../controls/Table';
import { PanelTone } from '../../../controls/Panel';
import { tableVariantOptions, tableToneOptions } from '../constants';

type UserRow = {
    id: string;
    name: string;
    email: string;
    role: 'Admin' | 'Editor' | 'Viewer';
    lastSeen: string;
};

const filledData: UserRow[] = [
    {
        id: '1',
        name: 'Sasha G.',
        email: 'sasha@company.com',
        role: 'Admin',
        lastSeen: '2 hours ago',
    },
    { id: '2', name: 'Kim C.', email: 'kim@company.com', role: 'Editor', lastSeen: 'Yesterday' },
    { id: '3', name: 'Lee R.', email: 'lee@company.com', role: 'Viewer', lastSeen: 'Just now' },
];

const emptyData: UserRow[] = [];

const columns: TableColumn<UserRow>[] = [
    { id: 'name', header: 'User', sortable: true },
    { id: 'email', header: 'Email', sortable: true },
    { id: 'role', header: 'Role', sortable: true },
    { id: 'lastSeen', header: 'Last Seen', sortable: true },
];

export const TableDemo: React.FC = () => {
    const [sort, setSort] = useState<TableSortState | null>({ columnId: 'name', direction: 'asc' });
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<UserRow[]>(filledData);
    const [tableVariant, setTableVariant] = useState<TableVariant>('default');
    const [tableTone, setTableTone] = useState<PanelTone>('neutral');
    const [tableStriped, setTableStriped] = useState(true);
    const [tableHoverable, setTableHoverable] = useState(true);

    return (
        <PlaygroundSection
            title="Table"
            label="[Table]"
            description="Data grid with sorting, loading, and tones."
            controls={
                <div className="space-y-4 text-sm">
                    <label className="flex flex-col gap-2">
                        <span>Variant</span>
                        <MultiToggle
                            fullWidth
                            options={tableVariantOptions}
                            value={tableVariant}
                            size="sm"
                            onChange={(value) => setTableVariant(value as TableVariant)}
                        />
                    </label>
                    <label className="flex flex-col gap-2">
                        <span>Tone</span>
                        <MultiToggle
                            fullWidth
                            options={tableToneOptions}
                            value={tableTone}
                            size="sm"
                            onChange={(value) => setTableTone(value as PanelTone)}
                        />
                    </label>
                    <div className="grid gap-2 md:grid-cols-2">
                        <label className="flex items-center justify-between">
                            <span>Striped rows</span>
                            <Toggle
                                size="sm"
                                checked={tableStriped}
                                onChange={(event) => setTableStriped(event.target.checked)}
                            />
                        </label>
                        <label className="flex items-center justify-between">
                            <span>Hover state</span>
                            <Toggle
                                size="sm"
                                checked={tableHoverable}
                                onChange={(event) => setTableHoverable(event.target.checked)}
                            />
                        </label>
                    </div>
                </div>
            }
            preview={
                <Table<UserRow>
                    columns={columns}
                    data={data}
                    variant={tableVariant}
                    tone={tableTone}
                    striped={tableStriped}
                    hoverable={tableHoverable}
                    maxHeight={360}
                    loading={loading}
                    loadingMessage="Syncing users..."
                    loaderProgress={loading ? 42 : undefined}
                    sortState={sort}
                    onSortChange={setSort}
                    rowKey={(row) => row.id}
                    onRowClick={(row) => console.log('row clicked', row)}
                    headerActions={
                        <>
                            <Button
                                size="sm"
                                variant="soft"
                                color="blue"
                                onClick={() => {
                                    setLoading(true);
                                    if (data.length === 0) {
                                        setData(filledData);
                                    }
                                    setTimeout(() => setLoading(false), 500);
                                }}
                            >
                                Refresh
                            </Button>
                            <IconButton
                                icon="Trash"
                                size="sm"
                                variant="ghost"
                                color="blue"
                                onClick={() => {
                                    setLoading(true);
                                    setData(emptyData);
                                    setTimeout(() => setLoading(false), 500);
                                }}
                            />
                        </>
                    }
                    footer={<span>Showing {data.length} users</span>}
                    emptyState="No users found"
                />
            }
        />
    );
};
