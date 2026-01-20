/**
 * DevOps API related interfaces
 */

/**
 * Catalog manifest item from API
 */
export interface CatalogManifestItem {
  name: string;
  description: string;
  items: CatalogManifestItemDetail[];
}

/**
 * Catalog manifest item details
 */
export interface CatalogManifestItemDetail {
  id?: string;
  name?: string;
  version?: string;
  description?: string;
  architecture?: string;
  size?: number;
  compressed_size?: number;
  created_at?: string;
  updated_at?: string;
  tags?: string[];
  [key: string]: unknown;
}

/**
 * Hardware information from remote host
 */
export interface HostHardwareInfo {
  total_memory?: string;
  total_available?: string;
  cpu_type?: string;
  cpu_brand?: string;
  logical_cpu_count?: number;
  physical_cpu_count?: number;
  [key: string]: unknown;
}

/**
 * Virtual machine from API
 */
export interface VirtualMachine {
  ID?: string;
  Name?: string;
  Description?: string;
  State?: string;
  OS?: string;
  host_id?: string;
  user?: string;
  [key: string]: unknown;
}

/**
 * Virtual machine configuration request
 */
export interface VirtualMachineConfigureRequest {
  operation: string;
  [key: string]: unknown;
}

/**
 * DevOps remote host
 */
export interface DevOpsRemoteHost {
  id?: string;
  host?: string;
  description?: string;
  enabled?: boolean;
  resources?: DevOpsRemoteHostResource[];
  [key: string]: unknown;
}

/**
 * DevOps remote host resource
 */
export interface DevOpsRemoteHostResource {
  id?: string;
  type?: string;
  state?: string;
  [key: string]: unknown;
}

/**
 * DevOps user
 */
export interface DevOpsUser {
  id?: string;
  name?: string;
  email?: string;
  username?: string;
  roles?: string[];
  claims?: string[];
  isSuperUser?: boolean;
  [key: string]: unknown;
}

/**
 * Create user request
 */
export interface DevOpsCreateUserRequest {
  name: string;
  email: string;
  password: string;
  username: string;
}

/**
 * Update user request
 */
export interface DevOpsUpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
}

/**
 * Catalog pull request
 */
export interface CatalogPullRequest {
  catalog_id: string;
  version?: string;
  architecture?: string;
  machine_name?: string;
  owner?: string;
  [key: string]: unknown;
}

/**
 * Catalog push request
 */
export interface CatalogPushRequest {
  catalog_id: string;
  version: string;
  architecture?: string;
  description?: string;
  [key: string]: unknown;
}

/**
 * Roles and claims entity
 */
export interface DevOpsRolesAndClaims {
  id?: string;
  name?: string;
  description?: string;
  [key: string]: unknown;
}

/**
 * Create role or claim request
 */
export interface DevOpsRolesAndClaimsCreateRequest {
  name: string;
  description?: string;
}

/**
 * Add orchestrator host request
 */
export interface AddOrchestratorHostRequest {
  host: string;
  description?: string;
  authentication?: {
    username?: string;
    password?: string;
    api_key?: string;
  };
  [key: string]: unknown;
}

/**
 * Update orchestrator host request
 */
export interface UpdateOrchestratorHostRequest {
  host?: string;
  description?: string;
  authentication?: {
    username?: string;
    password?: string;
    api_key?: string;
  };
  [key: string]: unknown;
}

/**
 * Catalog cache manifest item
 */
export interface CatalogCacheManifestItem {
  catalog_id?: string;
  version?: string;
  architecture?: string;
  size?: number;
  path?: string;
  [key: string]: unknown;
}

/**
 * Catalog cache response
 */
export interface CatalogCacheResponse {
  total_size?: number;
  manifests?: CatalogCacheManifestItem[];
  [key: string]: unknown;
}

/**
 * Version response from API
 */
export interface VersionResponse {
  version: string;
}

/**
 * Virtual machine operation interface
 */
export interface VmOperation {
  group: string;
  operation: string;
  value?: string;
  options?: Array<{ flag: string; value: string }>;
}

/**
 * Virtual machine configuration request
 */
export interface VmConfigureRequest {
  operations: VmOperation[];
}

/**
 * Reverse Proxy Configuration
 */
export interface ReverseProxyConfig {
  enabled?: boolean;
  host?: string;
  port?: string;
}

/**
 * Reverse Proxy Host HTTP Route
 */
export interface ReverseProxyHostHttpRoute {
  id?: string;
  path?: string;
  pattern?: string;
  schema?: string;
  target_host?: string;
  target_port?: string;
  target_vm_id?: string;
  request_headers?: Record<string, string>;
  response_headers?: Record<string, string>;
}

/**
 * Reverse Proxy Host TCP Route
 */
export interface ReverseProxyHostTcpRoute {
  id?: string;
  target_host?: string;
  target_port?: string;
  target_vm_id?: string;
}

/**
 * Reverse Proxy Host CORS Configuration
 */
export interface ReverseProxyHostCors {
  enabled?: boolean;
  allowed_origins?: string[];
  allowed_methods?: string[];
  allowed_headers?: string[];
}

/**
 * Reverse Proxy Host TLS Configuration
 */
export interface ReverseProxyHostTls {
  enabled?: boolean;
  cert?: string;
  key?: string;
}

/**
 * Reverse Proxy Host
 */
export interface ReverseProxyHost {
  id?: string;
  host?: string;
  port?: string;
  http_routes?: ReverseProxyHostHttpRoute[];
  tcp_route?: ReverseProxyHostTcpRoute;
  cors?: ReverseProxyHostCors;
  tls?: ReverseProxyHostTls;
}

/**
 * Complete Reverse Proxy Response
 */
export interface ReverseProxyResponse {
  reverse_proxy_config?: ReverseProxyConfig;
  reverse_proxy_hosts?: ReverseProxyHost[];
}

