import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { ISecretStore } from '../interfaces';

interface UnencryptedSecretDB extends DBSchema {
    unencrypted: {
        key: string;
        value: string;
    };
}

export class UnencryptedSecretStore implements ISecretStore {
    private dbPromise: Promise<IDBPDatabase<UnencryptedSecretDB>>;

    constructor() {
        this.dbPromise = openDB<UnencryptedSecretDB>('app-secrets', 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('unencrypted')) {
                    db.createObjectStore('unencrypted');
                }
            },
        });
    }

    async getSecret(key: string): Promise<string | null> {
        const db = await this.dbPromise;
        const val = await db.get('unencrypted', key);
        return val ?? null;
    }

    async setSecret(key: string, value: string): Promise<void> {
        const db = await this.dbPromise;
        await db.put('unencrypted', value, key);
    }

    async removeSecret(key: string): Promise<void> {
        const db = await this.dbPromise;
        await db.delete('unencrypted', key);
    }

    async flushSecrets(): Promise<void> {
        // IndexedDB auto-commits
    }
}