import { IConfigService, IDataStore, ISecretStore } from './interfaces';

export class BaseConfigService implements IConfigService {
    constructor(
        protected dataStore: IDataStore,
        protected secretStore: ISecretStore
    ) { }

    async initialize(): Promise<void> {
        // No-op by default, can be overridden
    }

    // DataStore delegation
    async get<T>(key: string): Promise<T | null> {
        return this.dataStore.get<T>(key);
    }

    async set<T>(key: string, value: T): Promise<void> {
        await this.dataStore.set(key, value);
    }

    async remove(key: string): Promise<void> {
        await this.dataStore.remove(key);
    }

    async clear(): Promise<void> {
        await this.dataStore.clear();
    }

    async save(): Promise<void> {
        await this.dataStore.save();
    }

    // SecretStore delegation
    async getSecret(key: string): Promise<string | null> {
        return this.secretStore.getSecret(key);
    }

    async setSecret(key: string, value: string): Promise<void> {
        await this.secretStore.setSecret(key, value);
    }

    async removeSecret(key: string): Promise<void> {
        await this.secretStore.removeSecret(key);
    }
}
