export interface IDataStore {
    /**
     * Get a value from the store.
     * @param key The key to retrieve.
     */
    get<T>(key: string): Promise<T | null>;

    /**
     * Set a value in the store.
     * @param key The key to set.
     * @param value The value to store.
     */
    set<T>(key: string, value: T): Promise<void>;

    /**
     * Remove a value from the store.
     * @param key The key to remove.
     */
    remove(key: string): Promise<void>;

    /**
     * Clear all values from the store.
     */
    clear(): Promise<void>;

    /**
     * Saves the store to disk (explicit save for some backends).
     */
    save(): Promise<void>;
}

export interface ISecretStore {
    /**
     * Get a secret value.
     * @param key The key of the secret.
     */
    getSecret(key: string): Promise<string | null>;

    /**
     * Set a secret value.
     * @param key The key of the secret.
     * @param value The secret value.
     */
    setSecret(key: string, value: string): Promise<void>;

    /**
     * Remove a secret.
     * @param key The key of the secret to remove.
     */
    removeSecret(key: string): Promise<void>;

    /**
     * Flush any pending secret writes to disk.
     * For backends that batch writes (e.g. Stronghold), this triggers
     * a single save. For auto-committing backends, this is a no-op.
     */
    flushSecrets(): Promise<void>;
}

export interface IConfigService extends IDataStore, ISecretStore {
    /**
     * Initialize the configuration service.
     */
    initialize(): Promise<void>;
}
