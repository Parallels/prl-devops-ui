import { BaseConfigService } from '../BaseConfigService';
import { SpaDataStore } from './SpaDataStore';
import { UnencryptedSecretStore } from './UnencryptedSecretStore';

export class UnencryptedConfigService extends BaseConfigService {
    constructor() {
        super(new SpaDataStore(), new UnencryptedSecretStore());
    }
}