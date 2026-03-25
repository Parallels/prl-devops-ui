/**
 * DevOps API related interfaces
 */

import { VirtualMachine } from './VirtualMachine';

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
  name?: string;
  id?: string;
  catalog_id?: string;
  description?: string;
  architecture?: string;
  version?: string;
  type?: string;
  tags?: string[];
  size?: number;
  path?: string;
  pack_filename: string;
  metadata_filename: string;
  compressed_size?: number;
  provider: CatalogManifestProvider;
  created_at?: string;
  updated_at?: string;
  required_roles?: string[];
  required_claims?: string[];
  last_downloaded_at?: string;
  last_downloaded_user?: string;
  is_compressed: boolean;
  download_count: number;
  tainted: boolean;
  tainted_by?: string;
  tainted_at?: string;
  untainted_by?: string;
  revoked: boolean;
  revoked_by?: string;
  revoked_at?: string;
  pack_content?: CatalogManifestPackContentItem[];
  [key: string]: unknown;
}

export interface CatalogManifestProvider {
  type: string;
  host: string;
  user: string;
  password: string;
  meta: CatalogManifestProviderMetadata;
  [key: string]: unknown;
}

export interface CatalogManifestProviderMetadata {
  [key: string]: unknown;
}

export interface CatalogManifestPackContentItem {
  path: string;
  name: string;
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
  state: 'healthy' | 'unhealthy';
  parallels_desktop_version?: string;
  parallels_desktop_licensed?: boolean;
  has_websocket_events?: boolean;
  is_reverse_proxy_enabled?: boolean;
  enabled_modules?: string[];
  resources?: DevOpsRemoteHostResource[];
  detailed_resources?: DevOpsRemoteHostResourceDetailed;
  vms?: VirtualMachine[];
  cache_config?: CacheConfig;
  cache_items?: DevOpsRemoteHostItem[];
  is_local?: boolean;
  [key: string]: unknown;
}

export interface DevOpsRemoteHostItem {
  catalog_id: string;
  version: string;
  architecture: string;
  cache_size: number;
  cache_type: string;
  cached_date: string;
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
 * Claim assigned to a role or user (from /auth/claims or embedded in a role/user response)
 */
export interface ClaimResponse {
  id: string;
  name: string;
  description?: string;
  /** Display group (e.g. "Administration", "VMs"). Present on built-in claims. */
  group?: string;
  /** Resource row within the group (e.g. "User", "VM"). */
  resource?: string;
  /** Action column (e.g. "create", "read", "update", "delete"). */
  action?: string;
  /** Users that hold this claim directly. Only populated on /auth/claims endpoints. */
  users?: DevOpsUser[];
}

/**
 * A resource row within a claim group (returned by GET /v1/auth/claims/grouped)
 */
export interface ClaimGroupResourceResponse {
  resource: string;
  claims: ClaimResponse[];
}

/**
 * A top-level group section from GET /v1/auth/claims/grouped
 */
export interface ClaimGroupResponse {
  group: string;
  resources: ClaimGroupResourceResponse[];
}

/**
 * Effective claim on a user — may be directly assigned or inherited from a role
 */
export interface UserClaimResponse {
  id: string;
  name: string;
  /** true → claim comes from a role, not assigned directly */
  is_inherited: boolean;
  /**
   * ID of the first role (in the user's role list) that granted this claim.
   * Only set when is_inherited is true.
   */
  source_role?: string;
}

/**
 * DevOps user
 */
export interface DevOpsUser {
  id?: string;
  name?: string;
  email?: string;
  username?: string;
  /** IDs of roles assigned to this user */
  roles?: string[];
  /** IDs of claims assigned directly to this user */
  claims?: string[];
  /**
   * Merged set of all claims this user actually has (direct + role-inherited).
   * Use this for access checks, not `claims`.
   */
  effective_claims?: UserClaimResponse[];
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
  /** Role IDs to assign. Defaults to ["USER"] if omitted. */
  roles?: string[];
  /** Direct claim IDs to assign. */
  claims?: string[];
  is_super_user?: boolean;
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
 * Minimum hardware requirements for a catalog manifest.
 */
export interface MinimumSpecRequirement {
  cpu?: number;
  memory?: number;
  disk?: number;
}

/**
 * Catalog push request
 */
export interface CatalogPushRequest {
  local_path: string;
  catalog_id: string;
  description?: string;
  version: string;
  architecture: string;
  connection?: string;
  compress?: boolean;
  compress_level?: string;
  uuid?: string;
  required_roles?: string[];
  required_claims?: string[];
  tags?: string[];
  minimum_requirements?: MinimumSpecRequirement;
}

/**
 * Roles and claims entity (legacy — kept for claims service compatibility)
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
 * Role response from API — includes full claims and users lists
 */
export interface RoleResponse {
  id: string;
  name: string;
  description?: string;
  /** All claims that members of this role inherit */
  claims: ClaimResponse[];
  /** All users that currently have this role assigned */
  users: DevOpsUser[];
}

/**
 * Request body for creating or updating a role
 */
export interface RoleRequest {
  name: string;
  description?: string;
  /** Optional claim IDs to attach on creation */
  claims?: string[];
}

/**
 * Request body for adding a claim to a role
 */
export interface RoleClaimRequest {
  /** Claim name / ID to add to the role */
  name: string;
}

/**
 * Add orchestrator host request
 */
export interface AddOrchestratorHostRequest {
  host: string;
  description?: string;
  tags?: string[];
  authentication?: {
    username?: string;
    password?: string;
    api_key?: string;
  };
  [key: string]: unknown;
}

/**
 * Deploy orchestrator host via SSH — async operation (POST /api/v1/orchestrator/hosts/deploy)
 */
export interface DeployOrchestratorHostRequest {
  // SSH connection
  ssh_host: string;
  ssh_port?: string;
  ssh_user: string;
  ssh_password?: string;
  ssh_key?: string;
  ssh_insecure_host_key?: boolean;
  sudo_password?: string;
  // Agent identity in the orchestrator
  host_name: string;
  tags?: string[];
  // Install options
  root_password?: string;
  enabled_modules?: string;
  pd_version?: string;
  agent_version?: string;
  pre_release?: boolean;
  agent_port?: string;
  enrollment_token_ttl?: number;
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

export interface HostAddedEvent {
  host_id: string;
  host: string;
  description?: string;
}

export interface HostRemovedEvent {
  host_id: string;
  host?: string;
}

export interface HostDeployedEvent {
  host_id: string;
  host?: string;
  message?: string;
}
