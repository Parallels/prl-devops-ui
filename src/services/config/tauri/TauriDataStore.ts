import { Store } from '@tauri-apps/plugin-store';
import { IDataStore } from '../interfaces';

export class TauriDataStore implements IDataStore {
    private store: Store | null = null;
    private initPromise: Promise<void>;

    constructor(storeName = 'settings.json') {
        this.initPromise = this.initialize(storeName);
    }

    private async initialize(storeName: string) {
        this.store = await Store.load(storeName);
    }

    async get<T>(key: string): Promise<T | null> {
        await this.initPromise;
        if (!this.store) return null;
        const val = await this.store.get<T>(key);
        return val ?? null;
    }

    async set<T>(key: string, value: T): Promise<void> {
        await this.initPromise;
        if (!this.store) return;
        await this.store.set(key, value);
    }

    async remove(key: string): Promise<void> {
        await this.initPromise;
        if (!this.store) return;
        await this.store.delete(key);
    }

    async clear(): Promise<void> {
        await this.initPromise;
        if (!this.store) return;
        await this.store.clear();
    }

    async save(): Promise<void> {
        await this.initPromise;
        if (!this.store) return;
        await this.store.save();
    }
}
