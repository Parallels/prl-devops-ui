import React from 'react';
import { MultiToggle, type MultiToggleOption } from '@prl/ui-kit';
import { useHostSettings } from '@/contexts/HostSettingsContext';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';

export type ModuleViewOption = 'all' | 'host' | 'orchestrator';

const VIEW_OPTIONS: MultiToggleOption[] = [
    { value: 'all', label: 'All' },
    { value: 'host', label: 'Local' },
    { value: 'orchestrator', label: 'Orchestrator' },
];

/** The module names that correspond to a selectable view (everything except 'all'). */
export const MODULE_VIEW_NAMES: readonly string[] = ['host', 'orchestrator'];

const SETTINGS_KEY = 'activeModuleView';

/** Hook — any page can call this to read the active module view filter. */
export const useModuleView = (): ModuleViewOption => {
    const { getGlobal } = useHostSettings();
    return getGlobal<ModuleViewOption>(SETTINGS_KEY, 'all');
};

/** Segmented pill control rendered in the Header when the host has both 'host' and 'orchestrator' modules. */
export const ModuleViewSwitcher: React.FC = () => {
    const { getGlobal, setGlobal } = useHostSettings();
    const { themeColor } = useSystemSettings();
    const active = getGlobal<ModuleViewOption>(SETTINGS_KEY, 'all');

    const handleChange = (value: string) => {
        void setGlobal(SETTINGS_KEY, value as ModuleViewOption);
    };

    return (
        <MultiToggle
            options={VIEW_OPTIONS}
            value={active}
            onChange={handleChange}
            variant="solid"
            color={themeColor}
            size="sm"
            rounded="md"
            adaptiveWidth
            truncateOverflow={false}
        />
    );
};
