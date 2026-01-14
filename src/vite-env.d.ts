/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEVOPS_API_URL: string
  readonly VITE_DEVOPS_USERNAME: string
  readonly VITE_DEVOPS_PASSWORD: string
  readonly VITE_DEVOPS_EMAIL: string
  readonly VITE_DEV_PORT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
