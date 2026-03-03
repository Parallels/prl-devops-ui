import type { ThemeColor } from '@prl/ui-kit';

export interface SystemSettings {
    themeColor: ThemeColor;
}

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
    themeColor: 'parallels',
};
