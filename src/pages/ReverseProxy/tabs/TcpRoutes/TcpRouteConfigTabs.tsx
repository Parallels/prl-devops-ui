import React from 'react';
import { Button, Tabs } from '@prl/ui-kit';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';

interface TcpRouteConfigTabsProps {
    routePanel: React.ReactNode;
    settingsPanel?: React.ReactNode;
    canEdit: boolean;
    canClear: boolean;
    canSave: boolean;
    saveLabel: string;
    saving: boolean;
    panelIdPrefix: string;
    onSave: () => void;
    onClear?: () => void;
}

const TcpRouteConfigTabs: React.FC<TcpRouteConfigTabsProps> = ({
    routePanel,
    settingsPanel,
    canEdit,
    canClear,
    canSave,
    saveLabel,
    saving,
    panelIdPrefix,
    onSave,
    onClear,
}) => {
    const { themeColor } = useSystemSettings();
    const items = [
        {
            id: 'route',
            label: 'Route',
            panel: <div className="px-4 pt-3 pb-4">{routePanel}</div>,
        },
        ...(settingsPanel ? [
            {
                id: 'settings',
                label: 'Settings',
                panel: <div className="px-4 pt-3 pb-4">{settingsPanel}</div>,
            },
        ] : []),
    ];

    return (
        <div>
            <Tabs
                variant="underline"
                color={themeColor}
                size="sm"
                listClassName="bg-transparent px-1"
                panelIdPrefix={panelIdPrefix}
                items={items}
            />

            {canEdit && (canSave || canClear) && (
                <div className="flex items-center justify-between px-4 pb-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    <div>
                        {canClear && onClear && (
                            <Button
                                variant="outline"
                                color="rose"
                                size="sm"
                                leadingIcon="Trash"
                                onClick={onClear}
                            >
                                Clear TCP Route
                            </Button>
                        )}
                    </div>
                    {canSave && (
                        <Button
                            variant="solid"
                            color={themeColor}
                            size="sm"
                            loading={saving}
                            onClick={onSave}
                        >
                            {saveLabel}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};

export default TcpRouteConfigTabs;
