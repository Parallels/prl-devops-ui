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
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  __ENV__?: {
    APP_ENV?: string;
    VITE_DEFAULT_HOST_URL?: string;
    VITE_DEFAULT_HOST_NAME?: string;
    VITE_DEFAULT_USERNAME?: string;
    VITE_DEFAULT_PASSWORD?: string;
  };
}
