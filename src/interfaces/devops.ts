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
