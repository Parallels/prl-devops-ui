import { isTauri } from '@tauri-apps/api/core';
import { IConfigService } from './interfaces';
import { TauriConfigService } from './tauri/TauriConfigService';
import { SpaConfigService } from './spa/SpaConfigService';
import { UnencryptedConfigService } from './spa/UnencryptedConfigService';
import { getCryptoMode } from '../../utils/cryptoMode';

export class ConfigFactory {
    private static instance: IConfigService | null = null;

    static getConfigService(): IConfigService {
        if (this.instance) {
            return this.instance;
        }

        if (isTauri()) {
            this.instance = new TauriConfigService();
        } else {
            const mode = getCryptoMode();
            if (mode === 'insecure-trial') {
                this.instance = new UnencryptedConfigService();
            } else {
                this.instance = new SpaConfigService();
            }
        }

        return this.instance;
    }
}
