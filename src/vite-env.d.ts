/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEVOPS_API_URL: string;
  readonly VITE_DEVOPS_USERNAME: string;
  readonly VITE_DEVOPS_PASSWORD: string;
  readonly VITE_DEVOPS_EMAIL: string;
  readonly VITE_DEV_PORT: string;
  readonly VITE_DEFAULT_HOST_URL: string;
  readonly VITE_DEFAULT_HOST_NAME: string;
  readonly VITE_DEFAULT_USERNAME: string;
  readonly VITE_DEFAULT_PASSWORD: string;
  readonly VITE_IS_DEVELOPMENT?: string;
  readonly VITE_CHANNEL?: string;
  /** Plaintext Amplitude ingestion key — local development only; Docker/Tauri builds use AMPLITUDE_API_KEY build arg. */
  readonly VITE_AMPLITUDE_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * Obfuscated Amplitude ingestion key baked in by vite.config.ts from the
 * AMPLITUDE_API_KEY build-time env var ('' when not provided).
 * Use via the __BAKED_AMPLITUDE_API_KEY__ identifier — replaced at build time.
 */
declare const __BAKED_AMPLITUDE_API_KEY__: string;

interface Window {
  __ENV__?: {
    APP_ENV?: string;
    VITE_DEFAULT_HOST_URL?: string;
    VITE_DEFAULT_HOST_NAME?: string;
    VITE_DEFAULT_USERNAME?: string;
    VITE_DEFAULT_PASSWORD?: string;
    ALLOW_INSECURE_STORAGE?: boolean;
    /** Pre-obfuscated Amplitude ingestion key; see scripts/obfuscate-amplitude-key.mjs. */
    AMPLITUDE_API_KEY_OBFUSCATED?: string;
  };
}
