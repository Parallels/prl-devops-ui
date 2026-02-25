/**
 * DevOps API related interfaces
 */

import { VirtualMachine } from "./VirtualMachine";

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
 * Resource counters returned by /api/v1/config/hardware and /api/v1/orchestrator/resources.
 * memory_size is in MB; logical_cpu_count is cores.
 * disk_count is used by the hardware endpoint; disk_size (also MB) by the orchestrator endpoint.
 */
export interface HardwareResourceStats {
  logical_cpu_count?: number;
  memory_size?: number;
  disk_count?: number;
  disk_size?: number;
}

export interface HardwareReverseProxy {
  enabled?: boolean;
  host?: string;
  port?: string;
}

/**
 * Hardware information from /api/v1/config/hardware
 */
export interface HostHardwareInfo {
  cpu_type?: string;
  cpu_brand?: string;
  devops_version?: string;
  os_name?: string;
  os_version?: string;
  parallels_desktop_version?: string;
  parallels_desktop_licensed?: boolean;
  external_ip_address?: string;
  is_reverse_proxy_enabled?: boolean;
  is_log_streaming_enabled?: boolean;
  reverse_proxy?: HardwareReverseProxy;
  system_reserved?: HardwareResourceStats;
  total?: HardwareResourceStats;
  total_available?: HardwareResourceStats;
  total_in_use?: HardwareResourceStats;
  total_reserved?: HardwareResourceStats;
  enabled_modules?: string[];
  cache_config?: CacheConfig;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  enabled: boolean;
  folder: string;
  keep_free_disk_space: number;
  max_size: number;
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
  enabled: boolean;
  host: string;
  architecture?: string;
  cpu_model?: string;
  os_version?: string;
  os_name?: string;
  external_ip_address?: string;
  devops_version?: string;
  description?: string;
  tags?: string[];
  state: "healthy" | "unhealthy";
  parallels_desktop_version?: string;
  parallels_desktop_licensed?: boolean;
  has_websocket_events?: boolean;
  is_reverse_proxy_enabled?: boolean;
  resources?: DevOpsRemoteHostResource[];
  detailed_resources?: DevOpsRemoteHostResourceDetailed;
  vms?: VirtualMachine[];
  [key: string]: unknown;
}

export interface DevOpsRemoteHostResourceDetailed {
  total_apple_vms?: number;
  system_reserved?: HardwareResourceStats;
  total?: HardwareResourceStats;
  total_available?: HardwareResourceStats;
  total_in_use?: HardwareResourceStats;
  total_reserved?: HardwareResourceStats;
  [key: string]: unknown;
}

/**
 * DevOps remote host resource
 */
export interface DevOpsRemoteHostResource {
  total_apple_vms?: number;
  logical_cpu_count?: number;
  memory_size?: number;
  disk_size?: number;
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
  users?: DevOpsUser[];
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
 * API Key entity
 */
export interface DevOpsApiKey {
  id?: string;
  name?: string;
  /** Full key value — only present on creation */
  key?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  last_used?: string;
  expires_at?: string;
  [key: string]: unknown;
}

/**
 * Request body for creating an API key
 */
export interface DevOpsApiKeyCreateRequest {
  name: string;
  key: string;
  secret: string;
  expires_at?: string;
}

export interface DevOpsApiKeyCreateResponse {
  id: string;
  name: string;
  key: string;
  encoded: string;
  expires_at: string;
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
 * Virtual machine clone request
 */
export interface VmCloneRequest {
  clone_name: string;
  destination_path?: string;
}

/**
 * Virtual machine configuration request
 */
export interface VmConfigureRequest {
  operations: VmOperation[];
}