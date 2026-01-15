import { apiService } from '../api';
import { DevOpsRolesAndClaims, DevOpsRolesAndClaimsCreateRequest } from '../../interfaces/devops';

/**
 * Roles Service - Handles role management operations for Parallels DevOps API
 * Manages role CRUD operations
 */
class RolesService {
  /**
   * Get all roles from DevOps API
   * 
   * @param hostname - The hostname identifier for the target server
   * @returns Array of roles
   * @throws ApiError
   */
  async getRoles(hostname: string): Promise<DevOpsRolesAndClaims[]> {
    try {
      const roles = await apiService.get<DevOpsRolesAndClaims[]>(
        hostname,
        '/api/v1/auth/roles',
        { errorPrefix: 'Failed to get roles' }
      );

      return roles || [];
    } catch (error) {
      console.error('Failed to get roles:', error);
      throw error;
    }
  }

  /**
   * Create a new role
   * 
   * @param hostname - The hostname identifier for the target server
   * @param request - Role creation request
   * @returns Created role
   * @throws ApiError
   */
  async createRole(
    hostname: string,
    request: DevOpsRolesAndClaimsCreateRequest
  ): Promise<DevOpsRolesAndClaims> {
    try {
      const role = await apiService.post<DevOpsRolesAndClaims>(
        hostname,
        '/api/v1/auth/roles',
        request,
        { errorPrefix: 'Failed to create role' }
      );

      return role;
    } catch (error) {
      console.error('Failed to create role:', error);
      throw error;
    }
  }

  /**
   * Remove a role from DevOps API
   * 
   * @param hostname - The hostname identifier for the target server
   * @param roleId - Role ID to remove
   * @returns true if successful
   * @throws ApiError
   */
  async removeRole(hostname: string, roleId: string): Promise<boolean> {
    try {
      await apiService.delete(
        hostname,
        `/api/v1/auth/roles/${roleId}`,
        { errorPrefix: `Failed to remove role ${roleId}` }
      );

      return true;
    } catch (error) {
      console.error(`Failed to remove role ${roleId}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const rolesService = new RolesService();
export default rolesService;
