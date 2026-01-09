import { BaseConfigService } from '../BaseConfigService';
import { SpaDataStore } from './SpaDataStore';
import { SpaSecretStore } from './SpaSecretStore';

export class SpaConfigService extends BaseConfigService {
    constructor() {
        super(new SpaDataStore(), new SpaSecretStore());
    }
}
