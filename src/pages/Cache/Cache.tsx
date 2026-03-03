import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { EmptyState, Pill, SplitView, type SplitViewItem } from '@prl/ui-kit';
import { devopsService } from '@/services/devops';
import { useSession } from '@/contexts/SessionContext';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { DevOpsRemoteHost } from '@/interfaces/devops';
import { CachePanel } from './CachePanel';

// ── Inline label for SplitView list items ─────────────────────────────────────
function CacheItemLabel({ label, state }: { label: string; state?: string }) {
    return (
        <div className="flex gap-2 min-w-0 flex-1 w-full flex-col">
            <span className="flex-grow font-medium truncate">{label}</span>
            {state && (
                <div className="flex items-center">
                    <Pill size="sm" tone={state === 'healthy' ? 'emerald' : 'rose'} variant="soft">
                        {state.charAt(0).toUpperCase() + state.slice(1)}
                    </Pill>
                </div>
            )}
        </div>
    );
}

// ── Page component ────────────────────────────────────────────────────────────
export const Cache: React.FC = () => {
    const { session, hasModule } = useSession();
    const { themeColor } = useSystemSettings();
    const hostname = session?.hostname ?? '';

    const isOrchestratorMode = hasModule('orchestrator');
    const isHostMode = hasModule('host');

    const [hosts, setHosts] = useState<DevOpsRemoteHost[]>([]);
    const [hostsLoading, setHostsLoading] = useState(false);
    const [hostsError, setHostsError] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | undefined>();

    const fetchHosts = useCallback(async () => {
        if (!isOrchestratorMode || !hostname) return;
        setHostsLoading(true);
        setHostsError(null);
        try {
            const data = await devopsService.orchestrator.getOrchestratorHosts(hostname);
            setHosts(data ?? []);
        } catch (err: any) {
            setHostsError(err?.message ?? 'Failed to load hosts');
        } finally {
            setHostsLoading(false);
        }
    }, [hostname, isOrchestratorMode]);

    useEffect(() => { void fetchHosts(); }, [fetchHosts]);

    // Auto-select first item after load
    useEffect(() => {
        if (selectedId) return;
        if (!isOrchestratorMode && isHostMode) {
            setSelectedId('local');
        } else if (isOrchestratorMode && hosts.length > 0) {
            setSelectedId(hosts[0].id);
        }
    }, [isOrchestratorMode, isHostMode, hosts, selectedId]);

    const items = useMemo<SplitViewItem[]>(() => {
        const result: SplitViewItem[] = [];

        if (isOrchestratorMode) {
            for (const host of hosts) {
                const hostName = host.description || host.host;
                result.push({
                    id: host.id ?? '',
                    label: <CacheItemLabel label={`${hostName} Cache`} state={host.state} />,
                    icon: 'Cache',
                    panel: <CachePanel hostname={hostname} hostId={host.id} isOrchestrator />,
                });
            }
        }

        if (isHostMode) {
            result.push({
                id: 'local',
                label: <CacheItemLabel label="Local Cache" />,
                icon: 'Cache',
                panel: <CachePanel hostname={hostname} />,
            });
        }

        return result;
    }, [isOrchestratorMode, isHostMode, hosts, hostname]);

    return (
        <div className="relative flex h-full min-h-0">
            <SplitView
                className="flex-1 min-w-0"
                items={items}
                value={selectedId}
                onChange={(id) => setSelectedId(id)}
                loading={hostsLoading}
                error={hostsError ?? undefined}
                onRetry={() => void fetchHosts()}
                listTitle="Cache"
                autoHideList={false}
                borderLeft
                color={themeColor}
                collapsible
                resizable
                autoExpand={false}
                minListWidth={220}
                searchPlaceholder="Search…"
                panelScrollable={false}
                panelEmptyState={
                    <EmptyState
                        disableBorder
                        icon="Cache"
                        title="Select a source"
                        subtitle="Choose a host from the list to view its cached manifests."
                        tone="neutral"
                    />
                }
            />
        </div>
    );
};
