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

import { catalogService } from './catalogService';
import { machinesService } from './machinesService';
import { usersService } from './usersService';
import { rolesService } from './rolesService';
import { claimsService } from './claimsService';
import { orchestratorService } from './orchestratorService';
import { configService } from './configService';
import { cacheService } from './cacheService';

/**
 * Unified DevOps service with composition pattern
 * Provides access to all DevOps API operations through organized sub-services
 */
export const devopsService = {
  /** Catalog management operations */
  catalog: catalogService,
  
  /** Virtual machine lifecycle operations */
  machines: machinesService,
  
  /** User management operations */
  users: usersService,
  
  /** Role management operations */
  roles: rolesService,
  
  /** Claim management operations */
  claims: claimsService,
  
  /** Orchestrator and host management operations */
  orchestrator: orchestratorService,
  
  /** Configuration and system information */
  config: configService,
  
  /** Catalog cache operations */
  cache: cacheService,
};

/**
 * Export individual services for direct access if needed
 */
export {
  catalogService,
  machinesService,
  usersService,
  rolesService,
  claimsService,
  orchestratorService,
  configService,
  cacheService,
};

/**
 * Export as default for convenience
 */
export default devopsService;
