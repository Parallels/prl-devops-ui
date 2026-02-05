import { openDB, IDBPDatabase } from 'idb';
import { ISecretStore } from '../interfaces';

interface SecretDB {
    secrets: {
        key: string;
        value: { iv: Uint8Array; data: Uint8Array };
    };
    keys: {
        key: string;
        value: CryptoKey;
    };
}

export class SpaSecretStore implements ISecretStore {
    private dbPromise: Promise<IDBPDatabase<SecretDB>>;
    private keyPromise: Promise<CryptoKey>;

    constructor() {
        this.dbPromise = openDB<SecretDB>('app-secrets', 1, {
            upgrade(db) {
                db.createObjectStore('secrets');
                db.createObjectStore('keys');
            },
        });

        this.keyPromise = this.getOrCreateKey();
    }

    private async getOrCreateKey(): Promise<CryptoKey> {
        const db = await this.dbPromise;
        const existingKey = await db.get('keys', 'master-key');

        if (existingKey) {
            return existingKey;
        }

        const newKey = await window.crypto.subtle.generateKey(
            {
                name: 'AES-GCM',
                length: 256,
            },
            false, // non-extractable
            ['encrypt', 'decrypt']
        );

        await db.put('keys', newKey, 'master-key');
        return newKey;
    }

    async getSecret(key: string): Promise<string | null> {
        const db = await this.dbPromise;
        const encrypted = await db.get('secrets', key);

        if (!encrypted) {
            return null;
        }

        const masterKey = await this.keyPromise;

        try {
            const decryptedBuffer = await window.crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: encrypted.iv,
                },
                masterKey,
                encrypted.data
            );

            const decoder = new TextDecoder();
            return decoder.decode(decryptedBuffer);
        } catch (e) {
            console.error('Failed to decrypt secret:', e);
            return null;
        }
    }

    async setSecret(key: string, value: string): Promise<void> {
        const masterKey = await this.keyPromise;
        const encoder = new TextEncoder();
        const data = encoder.encode(value);
        const iv = window.crypto.getRandomValues(new Uint8Array(12));

        const encryptedData = await window.crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv,
            },
            masterKey,
            data
        );

        const db = await this.dbPromise;
        await db.put(
            'secrets',
            {
                iv: iv,
                data: new Uint8Array(encryptedData),
            },
            key
        );
    }

    async removeSecret(key: string): Promise<void> {
        const db = await this.dbPromise;
        await db.delete('secrets', key);
    }

    async flushSecrets(): Promise<void> {
        // IndexedDB auto-commits — no-op
    }
}
