/**
 * JWT Token Payload structure from the DevOps API
 */
export interface JwtTokenPayload {
  /** Array of permission claims (e.g., "CREATE_USER", "DELETE_VM") */
  claims: string[];
  /** User email address */
  email: string;
  /** Username */
  username: string;
  /** Token expiration timestamp (Unix epoch in seconds) */
  exp: number;
  /** Array of user roles (e.g., "SUPER_USER") */
  roles: string[];
  /** User unique identifier */
  uid: string;
  /** API key identifier (when authenticated with API key) */
  api_key_id: string | null;
}

/**
 * Common claim types used in the application
 */
export const Claims = {
  // General permissions
  READ_ONLY: 'READ_ONLY',
  CREATE: 'CREATE',
  DELETE: 'DELETE',
  UPDATE: 'UPDATE',
  LIST: 'LIST',

  // User management
  LIST_USER: 'LIST_USER',
  CREATE_USER: 'CREATE_USER',
  DELETE_USER: 'DELETE_USER',
  UPDATE_USER: 'UPDATE_USER',

  // API Key management
  LIST_API_KEY: 'LIST_API_KEY',
  CREATE_API_KEY: 'CREATE_API_KEY',
  DELETE_API_KEY: 'DELETE_API_KEY',
  UPDATE_API_KEY: 'UPDATE_API_KEY',

  // Claim management
  LIST_CLAIM: 'LIST_CLAIM',
  CREATE_CLAIM: 'CREATE_CLAIM',
  DELETE_CLAIM: 'DELETE_CLAIM',
  UPDATE_CLAIM: 'UPDATE_CLAIM',

  // Role management
  LIST_ROLE: 'LIST_ROLE',
  CREATE_ROLE: 'CREATE_ROLE',
  DELETE_ROLE: 'DELETE_ROLE',
  UPDATE_ROLE: 'UPDATE_ROLE',

  // VM management
  CREATE_VM: 'CREATE_VM',
  DELETE_VM: 'DELETE_VM',
  LIST_VM: 'LIST_VM',
  UPDATE_VM_STATES: 'UPDATE_VM_STATES',
  UPDATE_VM: 'UPDATE_VM',
  EXECUTE_COMMAND_VM: 'EXECUTE_COMMAND_VM',

  // Packer templates
  CREATE_PACKER_TEMPLATE: 'CREATE_PACKER_TEMPLATE',
  DELETE_PACKER_TEMPLATE: 'DELETE_PACKER_TEMPLATE',
  LIST_PACKER_TEMPLATE: 'LIST_PACKER_TEMPLATE',
  UPDATE_PACKER_TEMPLATE: 'UPDATE_PACKER_TEMPLATE',

  // Catalog management
  CREATE_CATALOG_MANIFEST: 'CREATE_CATALOG_MANIFEST',
  DELETE_CATALOG_MANIFEST: 'DELETE_CATALOG_MANIFEST',
  LIST_CATALOG_MANIFEST: 'LIST_CATALOG_MANIFEST',
  UPDATE_CATALOG_MANIFEST: 'UPDATE_CATALOG_MANIFEST',
  PULL_CATALOG_MANIFEST: 'PULL_CATALOG_MANIFEST',
  PUSH_CATALOG_MANIFEST: 'PUSH_CATALOG_MANIFEST',
  IMPORT_CATALOG_MANIFEST: 'IMPORT_CATALOG_MANIFEST',
  CATALOG_MANAGER_CREATE: 'CATALOG_MANAGER_CREATE',
  CATALOG_MANAGER_CREATE_OWN: 'CATALOG_MANAGER_CREATE_OWN',
  CATALOG_MANAGER_UPDATE: 'CATALOG_MANAGER_UPDATE',
  CATALOG_MANAGER_UPDATE_OWN: 'CATALOG_MANAGER_UPDATE_OWN',
  CATALOG_MANAGER_DELETE: 'CATALOG_MANAGER_DELETE',
  CATALOG_MANAGER_DELETE_OWN: 'CATALOG_MANAGER_DELETE_OWN',

  // Reverse proxy
  LIST_REVERSE_PROXY_HOSTS: 'LIST_REVERSE_PROXY_HOSTS',
  CREATE_REVERSE_PROXY_HOST: 'CREATE_REVERSE_PROXY_HOST',
  DELETE_REVERSE_PROXY_HOST: 'DELETE_REVERSE_PROXY_HOST',
  UPDATE_REVERSE_PROXY_HOST: 'UPDATE_REVERSE_PROXY_HOST',
  LIST_REVERSE_PROXY_HOST_HTTP_ROUTES: 'LIST_REVERSE_PROXY_HOST_HTTP_ROUTES',
  CREATE_REVERSE_PROXY_HOST_HTTP_ROUTE: 'CREATE_REVERSE_PROXY_HOST_HTTP_ROUTE',
  DELETE_REVERSE_PROXY_HOST_HTTP_ROUTE: 'DELETE_REVERSE_PROXY_HOST_HTTP_ROUTE',
  UPDATE_REVERSE_PROXY_HOST_HTTP_ROUTE: 'UPDATE_REVERSE_PROXY_HOST_HTTP_ROUTE',
  LIST_REVERSE_PROXY_HOST_TCP_ROUTES: 'LIST_REVERSE_PROXY_HOST_TCP_ROUTES',
  CREATE_REVERSE_PROXY_HOST_TCP_ROUTE: 'CREATE_REVERSE_PROXY_HOST_TCP_ROUTE',
  DELETE_REVERSE_PROXY_HOST_TCP_ROUTE: 'DELETE_REVERSE_PROXY_HOST_TCP_ROUTE',
  UPDATE_REVERSE_PROXY_HOST_TCP_ROUTE: 'UPDATE_REVERSE_PROXY_HOST_TCP_ROUTE',
} as const;

/**
 * Common role types used in the application
 */
export const Roles = {
  SUPER_USER: 'SUPER_USER',
} as const;

/**
 * Host feature modules reported via HostHardwareInfo.enabled_modules
 * and/or the dedicated boolean flags on HostHardwareInfo.
 *
 * Use with SessionContext.hasModule() to gate UI features at runtime.
 */
export const Modules = {
  /** Reverse-proxy routing engine (is_reverse_proxy_enabled / enabled_modules) */
  REVERSE_PROXY: 'reverse_proxy',

  /* Host Virtualization Engine (is_virtualization_enabled / enabled_modules) */
  HOST: 'host',

  /** Catalog / artifact registry */
  CATALOG: 'catalog',

  /** External catalog manager endpoints */
  CATALOG_MANAGERS: 'catalog_manager',

  /** API Key Management */
  API: 'api',

  /** Remote orchestration of other DevOps hosts */
  ORCHESTRATOR: 'orchestrator',
} as const;

export type ClaimType = (typeof Claims)[keyof typeof Claims];
export type RoleType = (typeof Roles)[keyof typeof Roles];
export type ModuleType = (typeof Modules)[keyof typeof Modules];
