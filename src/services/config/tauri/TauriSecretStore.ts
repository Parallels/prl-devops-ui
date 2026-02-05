import { Store } from '@tauri-apps/plugin-store';
import { ISecretStore } from '../interfaces';

const SECRETS_STORE_FILE = 'secrets.json';
const ENCRYPTION_KEY_NAME = '_encryption_key';

interface EncryptedValue {
    iv: string;      // base64-encoded IV
    data: string;    // base64-encoded ciphertext
}

export class TauriSecretStore implements ISecretStore {
    private store: Store | null = null;
    private cryptoKey: CryptoKey | null = null;
    private initPromise: Promise<void>;

    constructor() {
        this.initPromise = this.initialize();
    }

    private async initialize() {
        try {
            this.store = await Store.load(SECRETS_STORE_FILE);
            this.cryptoKey = await this.getOrCreateKey();
            console.log('[TauriSecretStore] initialized successfully');
        } catch (e) {
            console.error('[TauriSecretStore] init failed:', e);
        }
    }

    private async getOrCreateKey(): Promise<CryptoKey> {
        // Try to load existing key from store
        const storedKey = await this.store!.get<string>(ENCRYPTION_KEY_NAME);

        if (storedKey) {
            // Import the stored raw key
            const keyBytes = Uint8Array.from(atob(storedKey), c => c.charCodeAt(0));
            return await crypto.subtle.importKey(
                'raw',
                keyBytes,
                { name: 'AES-GCM', length: 256 },
                true,
                ['encrypt', 'decrypt']
            );
        }

        // Generate a new key
        const newKey = await crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            true, // extractable so we can store it
            ['encrypt', 'decrypt']
        );

        // Export and store the raw key
        const rawKey = await crypto.subtle.exportKey('raw', newKey);
        const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(rawKey)));
        await this.store!.set(ENCRYPTION_KEY_NAME, keyBase64);
        await this.store!.save();

        return newKey;
    }

    private async ready(): Promise<boolean> {
        await this.initPromise;
        return this.store !== null && this.cryptoKey !== null;
    }

    async getSecret(key: string): Promise<string | null> {
        if (!(await this.ready())) return null;

        try {
            const encrypted = await this.store!.get<EncryptedValue>(key);
            if (!encrypted) return null;

            const iv = Uint8Array.from(atob(encrypted.iv), c => c.charCodeAt(0));
            const data = Uint8Array.from(atob(encrypted.data), c => c.charCodeAt(0));

            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                this.cryptoKey!,
                data
            );

            return new TextDecoder().decode(decrypted);
        } catch (e) {
            console.error('[TauriSecretStore] getSecret failed:', e);
            return null;
        }
    }

    async setSecret(key: string, value: string): Promise<void> {
        if (!(await this.ready())) {
            throw new Error('Secret store not available');
        }

        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(value);

        const ciphertext = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            this.cryptoKey!,
            encoded
        );

        const encrypted: EncryptedValue = {
            iv: btoa(String.fromCharCode(...iv)),
            data: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
        };

        await this.store!.set(key, encrypted);
    }

    async removeSecret(key: string): Promise<void> {
        if (!(await this.ready())) return;

        try {
            await this.store!.delete(key);
        } catch {
            // Key might not exist
        }
    }

    async flushSecrets(): Promise<void> {
        if (!(await this.ready())) return;
        await this.store!.save();
    }
}
