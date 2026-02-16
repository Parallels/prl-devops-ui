import { apiService } from '../api';
import { DevOpsUser, DevOpsCreateUserRequest, DevOpsUpdateUserRequest } from '../../interfaces/devops';

/**
 * Users Service - Handles user management operations for Parallels DevOps API
 * Manages user CRUD operations, roles, and claims assignments
 */
class UsersService {
  /**
   * Get all users from DevOps API
   * 
   * @param hostname - The hostname identifier for the target server
   * @returns Array of DevOps users
   * @throws ApiError
   */
  async getUsers(hostname: string): Promise<DevOpsUser[]> {
    try {
      const users = await apiService.get<DevOpsUser[]>(
        hostname,
        '/api/v1/auth/users',
        { errorPrefix: 'Failed to get users' }
      );

      return users || [];
    } catch (error) {
      console.error('Failed to get users:', error);
      throw error;
    }
  }

  /**
   * Create a new user
   * 
   * @param hostname - The hostname identifier for the target server
   * @param request - User creation request
   * @returns Created user
   * @throws ApiError
   */
  async createUser(hostname: string, request: DevOpsCreateUserRequest): Promise<DevOpsUser> {
    try {
      const user = await apiService.post<DevOpsUser>(
        hostname,
        '/api/v1/auth/users',
        request,
        { errorPrefix: 'Failed to create user' }
      );

      return user;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }

  /**
   * Update an existing user
   * 
   * @param hostname - The hostname identifier for the target server
   * @param userId - User ID to update
   * @param request - User update request
   * @returns Updated user
   * @throws ApiError
   */
  async updateUser(
    hostname: string,
    userId: string,
    request: DevOpsUpdateUserRequest
  ): Promise<DevOpsUser> {
    try {
      const user = await apiService.put<DevOpsUser>(
        hostname,
        `/api/v1/auth/users/${userId}`,
        request,
        { errorPrefix: `Failed to update user ${userId}` }
      );

      return user;
    } catch (error) {
      console.error(`Failed to update user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Remove a user from DevOps API
   * 
   * @param hostname - The hostname identifier for the target server
   * @param userId - User ID to remove
   * @returns true if successful
   * @throws ApiError
   */
  async removeUser(hostname: string, userId: string): Promise<boolean> {
    try {
      await apiService.delete(
        hostname,
        `/api/v1/auth/users/${userId}`,
        { errorPrefix: `Failed to remove user ${userId}` }
      );

      return true;
    } catch (error) {
      console.error(`Failed to remove user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Add a claim to a user
   * 
   * @param hostname - The hostname identifier for the target server
   * @param userId - User ID
   * @param claimName - Claim name to add
   * @returns true if successful
   * @throws ApiError
   */
  async addUserClaim(hostname: string, userId: string, claimName: string): Promise<boolean> {
    try {
      await apiService.post(
        hostname,
        `/api/v1/auth/users/${userId}/claims`,
        { name: claimName },
        { errorPrefix: `Failed to add claim to user ${userId}` }
      );

      return true;
    } catch (error) {
      console.error(`Failed to add claim to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Remove a claim from a user
   * 
   * @param hostname - The hostname identifier for the target server
   * @param userId - User ID
   * @param claimName - Claim name to remove
   * @returns true if successful
   * @throws ApiError
   */
  async removeUserClaim(hostname: string, userId: string, claimName: string): Promise<boolean> {
    try {
      await apiService.delete(
        hostname,
        `/api/v1/auth/users/${userId}/claims/${claimName}`,
        { errorPrefix: `Failed to remove claim from user ${userId}` }
      );

      return true;
    } catch (error) {
      console.error(`Failed to remove claim from user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Add a role to a user
   * 
   * @param hostname - The hostname identifier for the target server
   * @param userId - User ID
   * @param roleName - Role name to add
   * @returns true if successful
   * @throws ApiError
   */
  async addUserRole(hostname: string, userId: string, roleName: string): Promise<boolean> {
    try {
      await apiService.post(
        hostname,
        `/api/v1/auth/users/${userId}/roles`,
        { name: roleName },
        { errorPrefix: `Failed to add role to user ${userId}` }
      );

      return true;
    } catch (error) {
      console.error(`Failed to add role to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Remove a role from a user
   * 
   * @param hostname - The hostname identifier for the target server
   * @param userId - User ID
   * @param roleName - Role name to remove
   * @returns true if successful
   * @throws ApiError
   */
  async removeUserRole(hostname: string, userId: string, roleName: string): Promise<boolean> {
    try {
      await apiService.delete(
        hostname,
        `/api/v1/auth/users/${userId}/roles/${roleName}`,
        { errorPrefix: `Failed to remove role from user ${userId}` }
      );

      return true;
    } catch (error) {
      console.error(`Failed to remove role from user ${userId}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const usersService = new UsersService();
export default usersService;
