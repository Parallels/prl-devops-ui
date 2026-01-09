import { isTauri } from '@tauri-apps/api/core';
import { IConfigService } from './interfaces';
import { TauriConfigService } from './tauri/TauriConfigService';
import { SpaConfigService } from './spa/SpaConfigService';

export class ConfigFactory {
    private static instance: IConfigService | null = null;

    static getConfigService(): IConfigService {
        if (this.instance) {
            return this.instance;
        }

        if (isTauri()) {
            this.instance = new TauriConfigService();
        } else {
            this.instance = new SpaConfigService();
        }

        return this.instance;
    }
}
