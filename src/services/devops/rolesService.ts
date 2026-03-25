import { apiService } from '../api';
import { ClaimResponse, RoleClaimRequest, RoleRequest, RoleResponse } from '../../interfaces/devops';

/**
 * Roles Service - Handles role management operations for Parallels DevOps API
 * Manages role CRUD operations and role claim sub-resource
 */
class RolesService {
  /**
   * Get all roles from DevOps API
   *
   * @param hostname - The hostname identifier for the target server
   * @returns Array of roles with their claims and users
   * @throws ApiError
   */
  async getRoles(hostname: string): Promise<RoleResponse[]> {
    try {
      const roles = await apiService.get<RoleResponse[]>(
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
  async createRole(hostname: string, request: RoleRequest): Promise<RoleResponse> {
    try {
      const role = await apiService.post<RoleResponse>(
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

  /**
   * Get all claims for a role
   *
   * @param hostname - The hostname identifier for the target server
   * @param roleId - Role ID
   * @returns Array of claims assigned to the role
   * @throws ApiError
   */
  async getRoleClaims(hostname: string, roleId: string): Promise<ClaimResponse[]> {
    try {
      const claims = await apiService.get<ClaimResponse[]>(
        hostname,
        `/api/v1/auth/roles/${roleId}/claims`,
        { errorPrefix: `Failed to get claims for role ${roleId}` }
      );

      return claims || [];
    } catch (error) {
      console.error(`Failed to get claims for role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Add a claim to a role
   *
   * @param hostname - The hostname identifier for the target server
   * @param roleId - Role ID
   * @param request - Claim request containing the claim name/ID
   * @returns The added ClaimResponse
   * @throws ApiError
   */
  async addRoleClaim(hostname: string, roleId: string, request: RoleClaimRequest): Promise<ClaimResponse> {
    try {
      const claim = await apiService.post<ClaimResponse>(
        hostname,
        `/api/v1/auth/roles/${roleId}/claims`,
        request,
        { errorPrefix: `Failed to add claim to role ${roleId}` }
      );

      return claim;
    } catch (error) {
      console.error(`Failed to add claim to role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Remove a claim from a role
   *
   * @param hostname - The hostname identifier for the target server
   * @param roleId - Role ID
   * @param claimId - Claim ID to remove
   * @returns true if successful
   * @throws ApiError
   */
  async removeRoleClaim(hostname: string, roleId: string, claimId: string): Promise<boolean> {
    try {
      await apiService.delete(
        hostname,
        `/api/v1/auth/roles/${roleId}/claims/${claimId}`,
        { errorPrefix: `Failed to remove claim ${claimId} from role ${roleId}` }
      );

      return true;
    } catch (error) {
      console.error(`Failed to remove claim ${claimId} from role ${roleId}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const rolesService = new RolesService();
export default rolesService;
