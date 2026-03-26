/**
 * DevOps Service Module - Modular API service for Parallels DevOps
 * 
 * This module provides a composition-based architecture for accessing
 * various DevOps API operations organized by domain:
 * 
 * - catalog: Catalog management and versioning
 * - machines: Virtual machine lifecycle operations
 * - users: User management and authentication
 * - roles: Role management
 * - claims: Claim management  
 * - orchestrator: Orchestrator and host management
 * - config: Configuration and system information
 * - cache: Catalog cache operations
 * - reverseProxy: Reverse proxy configuration and routing

 * 
 * Usage:
 * ```typescript
 * import { devopsService } from '@/services/devops';
 * 
 * // Access catalog operations
 * const manifests = await devopsService.catalog.getCatalogManifests(hostname);
 * 
 * // Access machine operations
 * const vms = await devopsService.machines.getVirtualMachines(hostname);
 * 
 * // Access user operations
 * const users = await devopsService.users.getUsers(hostname);
 * ```
 */

import { apiKeysService } from './apiKeysService';
import { cacheService } from './cacheService';
import { catalogManagerService } from './catalogManagerService';
import { catalogService } from './catalogService';
import { claimsService } from './claimsService';
import { configService } from './configService';
import { machinesService } from './machinesService';
import { orchestratorService } from './orchestratorService';
import { reverseProxyService } from './reverseProxyService';
import { rolesService } from './rolesService';
import { userConfigService } from './userConfigService';
import { snapshotsService } from './snapshotsService';
import { usersService } from './usersService';

/**
 * Unified DevOps service with composition pattern
 * Provides access to all DevOps API operations through organized sub-services
 */
export const devopsService = {
  /** API key management */
  apiKeys: apiKeysService,

  /** Catalog cache operations */
  cache: cacheService,
  
  /** Catalog management operations */
  catalog: catalogService,

  /** External catalog manager operations */
  catalogManagers: catalogManagerService,
  
  /** Claim management operations */
  claims: claimsService,
  
  /** Configuration and system information */
  config: configService,
  
  /** Virtual machine lifecycle operations */
  machines: machinesService,
  
  /** Orchestrator and host management operations */
  orchestrator: orchestratorService,

  /** Reverse proxy configuration and management */
  reverseProxy: reverseProxyService,

  /** Role management operations */
  roles: rolesService,

  /** User config persistence operations */
  userConfig: userConfigService,

  /** VM snapshot operations */
  snapshots: snapshotsService,

  /** User management operations */
  users: usersService,
};

/**
 * Export individual services for direct access if needed
 */
export {
  apiKeysService,
  cacheService,
  catalogManagerService,
  catalogService,
  claimsService,
  configService,
  machinesService,
  orchestratorService,
  reverseProxyService,
  rolesService,
  snapshotsService,
  userConfigService,
  usersService,
};

/**
 * Export as default for convenience
 */
export default devopsService;
