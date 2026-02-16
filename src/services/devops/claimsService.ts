import { apiService } from '../api';
import { DevOpsRolesAndClaims, DevOpsRolesAndClaimsCreateRequest } from '../../interfaces/devops';

/**
 * Claims Service - Handles claim management operations for Parallels DevOps API
 * Manages claim CRUD operations
 */
class ClaimsService {
  /**
   * Get all claims from DevOps API
   * 
   * @param hostname - The hostname identifier for the target server
   * @returns Array of claims
   * @throws ApiError
   */
  async getClaims(hostname: string): Promise<DevOpsRolesAndClaims[]> {
    try {
      const claims = await apiService.get<DevOpsRolesAndClaims[]>(
        hostname,
        '/api/v1/auth/claims',
        { errorPrefix: 'Failed to get claims' }
      );

      return claims || [];
    } catch (error) {
      console.error('Failed to get claims:', error);
      throw error;
    }
  }

  /**
   * Create a new claim
   * 
   * @param hostname - The hostname identifier for the target server
   * @param request - Claim creation request
   * @returns Created claim
   * @throws ApiError
   */
  async createClaim(
    hostname: string,
    request: DevOpsRolesAndClaimsCreateRequest
  ): Promise<DevOpsRolesAndClaims> {
    try {
      const claim = await apiService.post<DevOpsRolesAndClaims>(
        hostname,
        '/api/v1/auth/claims',
        request,
        { errorPrefix: 'Failed to create claim' }
      );

      return claim;
    } catch (error) {
      console.error('Failed to create claim:', error);
      throw error;
    }
  }

  /**
   * Remove a claim from DevOps API
   * 
   * @param hostname - The hostname identifier for the target server
   * @param claimId - Claim ID to remove
   * @returns true if successful
   * @throws ApiError
   */
  async removeClaim(hostname: string, claimId: string): Promise<boolean> {
    try {
      await apiService.delete(
        hostname,
        `/api/v1/auth/claims/${claimId}`,
        { errorPrefix: `Failed to remove claim ${claimId}` }
      );

      return true;
    } catch (error) {
      console.error(`Failed to remove claim ${claimId}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const claimsService = new ClaimsService();
export default claimsService;
