export type FilterTab = 'all' | 'active' | 'completed' | 'failed';

export const FILTERS: { key: FilterTab; label: string }[] = [
    { key: 'all',       label: 'All' },
    { key: 'active',    label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'failed',    label: 'Failed' },
];
