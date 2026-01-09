import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { IDataStore } from '../interfaces';

interface ConfigDB extends DBSchema {
    config: {
        key: string;
        value: any;
    };
}

export class SpaDataStore implements IDataStore {
    private dbPromise: Promise<IDBPDatabase<ConfigDB>>;

    constructor() {
        this.dbPromise = openDB<ConfigDB>('app-config', 1, {
            upgrade(db) {
                db.createObjectStore('config');
            },
        });
    }

    async get<T>(key: string): Promise<T | null> {
        const db = await this.dbPromise;
        const val = await db.get('config', key);
        return val !== undefined ? val : null;
    }

    async set<T>(key: string, value: T): Promise<void> {
        const db = await this.dbPromise;
        await db.put('config', value, key);
    }

    async remove(key: string): Promise<void> {
        const db = await this.dbPromise;
        await db.delete('config', key);
    }

    async clear(): Promise<void> {
        const db = await this.dbPromise;
        await db.clear('config');
    }

    async save(): Promise<void> {
        // IndexedDB auto-saves
    }
}
