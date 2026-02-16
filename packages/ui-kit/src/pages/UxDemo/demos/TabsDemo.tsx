import React, { useState, useMemo } from 'react';
import { PlaygroundSection } from '../PlaygroundSection';
import { Tabs, MultiToggle, Toggle, Button } from '../../..';
import { TabsVariant, TabsSize, TabsOrientation, TabsJustify, TabItem } from '../../..';
import { ButtonColor } from '../../..';
import type { IconName } from '../../../icons/registry';
import {
    tabVariantOptions,
    tabSizeOptions,
    tabColorOptions,
    tabOrientationOptions,
    tabJustifyOptions,
} from '../constants'


export const TabsDemo: React.FC = () => {
    const [tabsVariant, setTabsVariant] = useState<TabsVariant>('underline');
    const [tabsSize, setTabsSize] = useState<TabsSize>('md');
    const [tabsColor, setTabsColor] = useState<ButtonColor>('indigo');
    const [tabsOrientation, setTabsOrientation] = useState<TabsOrientation>('horizontal');
    const [tabsJustify, setTabsJustify] = useState<TabsJustify>('start');
    const [tabsFullWidth, setTabsFullWidth] = useState<boolean>(true);
    const [tabsShowDividers, setTabsShowDividers] = useState<boolean>(false);
    const [tabsShowActions, setTabsShowActions] = useState<boolean>(true);
    const [tabsActiveAction, setTabsActiveAction] = useState<string>('create-release');
    const [tabsValue, setTabsValue] = useState<string>('deployments');

    const handleTabActionClick = (actionId: string | null) => {
        if (actionId) {
            setTabsActiveAction(actionId);
        }
    };

    const tabsItems = useMemo<TabItem[]>(() => {
        const createActionId = 'create-release';
        const syncActionId = 'sync-status';
        const activeActions = tabsShowActions
            ? [
                {
                    id: createActionId,
                    icon: 'Plus' as IconName,
                    label: 'Create release',
                    active: tabsActiveAction === createActionId,
                    onClick: () => handleTabActionClick(createActionId),
                },
                {
                    id: syncActionId,
                    icon: 'Reset' as IconName,
                    label: 'Sync status',
                    active: tabsActiveAction === syncActionId,
                    onClick: () => handleTabActionClick(syncActionId),
                },
            ]
            : undefined;

        return [
            {
                id: 'deployments',
                label: 'Deployments',
                icon: 'Run',
                description: 'Active release rings',
                badge: 'Live',
                actions: activeActions,
                panel: (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="text-sm font-semibold text-slate-600">Production</p>
                            <p className="text-2xl font-bold text-slate-900">v2.18.4</p>
                            <p className="text-xs text-slate-500">Healthy · last deploy 3 minutes ago</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="text-sm font-semibold text-slate-600">Staging</p>
                            <p className="text-2xl font-bold text-slate-900">v2.19.0-rc1</p>
                            <p className="text-xs text-amber-600">2 checks queued</p>
                        </div>
                    </div>
                ),
            },
            {
                id: 'analytics',
                label: 'Analytics',
                icon: 'ViewGrid',
                description: 'Usage and adoption metrics',
                panel: (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-sm font-semibold text-slate-600">Active seats</p>
                        <div className="mt-2 flex items-end gap-6">
                            <div>
                                <p className="text-3xl font-bold text-slate-900">247</p>
                                <p className="text-xs text-emerald-600">+12 new this week</p>
                            </div>
                            <div className="flex flex-1 items-center gap-2 text-xs text-slate-500">
                                <span className="h-2 flex-1 rounded-full bg-emerald-500/30" />
                                <span className="font-semibold text-emerald-700">74% utilization</span>
                            </div>
                        </div>
                    </div>
                ),
            },
            {
                id: 'alerts',
                label: 'Alerts',
                icon: 'Notification',
                badge: '2',
                description: 'Incidents & change reviews',
                panel: (
                    <div className="mt-4 space-y-3">
                        {[
                            { title: 'Database latency spike', time: '10m ago', severity: 'High' },
                            { title: 'API rate limit warning', time: '1h ago', severity: 'Medium' },
                        ].map((alert) => (
                            <div
                                key={alert.title}
                                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                            >
                                <div>
                                    <p className="text-sm font-medium text-slate-900">{alert.title}</p>
                                    <p className="text-xs text-slate-500">{alert.time}</p>
                                </div>
                                <Button
                                    size="xs"
                                    variant="soft"
                                    color="slate"
                                    onClick={() => handleTabActionClick(null)}
                                >
                                    Ack
                                </Button>
                            </div>
                        ))}
                    </div>
                ),
            },
        ];
    }, [tabsShowActions, tabsActiveAction]);

    return (
        <PlaygroundSection
            title="Tabs"
            label="[Tabs]"
            description="Switch between release dashboards with contextual actions."
            controls={
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-200">
                                Variant
                            </span>
                            <MultiToggle
                                fullWidth
                                options={tabVariantOptions}
                                value={tabsVariant}
                                size="sm"
                                onChange={(value) => setTabsVariant(value as TabsVariant)}
                            />
                        </div>
                        <div className="space-y-2">
                            <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-200">
                                Size
                            </span>
                            <MultiToggle
                                fullWidth
                                options={tabSizeOptions}
                                value={tabsSize}
                                size="sm"
                                onChange={(value) => setTabsSize(value as TabsSize)}
                            />
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-200">
                                Color
                            </span>
                            <MultiToggle
                                fullWidth
                                options={tabColorOptions}
                                value={tabsColor}
                                size="sm"
                                onChange={(value) => setTabsColor(value as ButtonColor)}
                            />
                        </div>
                        <div className="space-y-2">
                            <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-200">
                                Orientation
                            </span>
                            <MultiToggle
                                fullWidth
                                options={tabOrientationOptions}
                                value={tabsOrientation}
                                size="sm"
                                onChange={(value) => setTabsOrientation(value as TabsOrientation)}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-200">
                            Justify
                        </span>
                        <MultiToggle
                            fullWidth
                            options={tabJustifyOptions}
                            value={tabsJustify}
                            size="sm"
                            onChange={(value) => setTabsJustify(value as TabsJustify)}
                        />
                    </div>
                    <div className="grid gap-2 md:grid-cols-3">
                        {[
                            { label: 'Full width', value: tabsFullWidth, setter: setTabsFullWidth },
                            { label: 'Show dividers', value: tabsShowDividers, setter: setTabsShowDividers },
                            { label: 'Show actions', value: tabsShowActions, setter: setTabsShowActions },
                        ].map((item) => (
                            <label key={item.label} className="flex items-center justify-between">
                                <span className="text-sm">{item.label}</span>
                                <Toggle
                                    size="sm"
                                    checked={item.value}
                                    onChange={(event) => item.setter(event.target.checked)}
                                />
                            </label>
                        ))}
                    </div>
                </div>
            }
            preview={
                <div className="space-y-4 rounded-2xl bg-slate-50 p-4">
                    <Tabs
                        items={tabsItems}
                        value={tabsValue}
                        onChange={(id) => setTabsValue(id)}
                        variant={tabsVariant}
                        size={tabsSize}
                        color={tabsColor}
                        orientation={tabsOrientation}
                        justify={tabsJustify}
                        fullWidth={tabsFullWidth}
                        showDividers={tabsShowDividers}
                    />
                </div>
            }
        />
    );
};
