import { BaseConfigService } from '../BaseConfigService';
import { TauriDataStore } from './TauriDataStore';
import { TauriSecretStore } from './TauriSecretStore';

export class TauriConfigService extends BaseConfigService {
    constructor() {
        super(new TauriDataStore(), new TauriSecretStore());
    }
}
