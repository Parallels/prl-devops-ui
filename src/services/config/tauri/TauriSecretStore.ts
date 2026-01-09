import { Stronghold } from '@tauri-apps/plugin-stronghold';
import { ISecretStore } from '../interfaces';
import { appDataDir, join } from '@tauri-apps/api/path';

const VAULT_FILE = 'secrets.stronghold';
const VAULT_PASSWORD = 'app-secret-placeholder'; // TODO: Replace with OS Keyring fetch
const CLIENT_NAME = 'default';

export class TauriSecretStore implements ISecretStore {
    private stronghold: Stronghold | null = null;
    private initPromise: Promise<void>;

    constructor() {
        this.initPromise = this.initialize();
    }

    private async initialize() {
        try {
            const path = await appDataDir();
            const vaultPath = await join(path, VAULT_FILE);

            this.stronghold = await Stronghold.load(vaultPath, VAULT_PASSWORD);
        } catch (e) {
            console.error('Failed to initialize Stronghold:', e);
            throw e;
        }
    }

    async getSecret(key: string): Promise<string | null> {
        await this.initPromise;
        if (!this.stronghold) return null;

        try {
            const client = await this.stronghold.loadClient(CLIENT_NAME);
            const store = client.getStore();
            const value = await store.get(key);
            if (!value) return null;
            const decoded = new TextDecoder().decode(value as Uint8Array);
            return decoded;
        } catch (e) {
            // Key might not exist or other error
            return null;
        }
    }

    async setSecret(key: string, value: string): Promise<void> {
        await this.initPromise;
        if (!this.stronghold) return;

        try {
            const client = await this.stronghold.loadClient(CLIENT_NAME);
            const store = client.getStore();
            const encoded = new TextEncoder().encode(value);
            await store.insert(key, Array.from(encoded));
            await this.stronghold.save();
        } catch (e) {
            console.error('Failed to set secret:', e);
        }
    }

    async removeSecret(key: string): Promise<void> {
        await this.initPromise;
        if (!this.stronghold) return;

        try {
            const client = await this.stronghold.loadClient(CLIENT_NAME);
            const store = client.getStore();
            await store.remove(key);
            await this.stronghold.save();
        } catch (e) {
            console.error('Failed to remove secret:', e);
        }
    }
}
