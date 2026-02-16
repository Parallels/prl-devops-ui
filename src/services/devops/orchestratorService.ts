import { apiService } from '../api';
import { 
  DevOpsRemoteHost, 
  DevOpsRemoteHostResource,
  AddOrchestratorHostRequest,
  UpdateOrchestratorHostRequest
} from '../../interfaces/devops';

/**
 * Orchestrator Service - Handles orchestrator and host management operations
 * Manages orchestrator hosts, resources, and host lifecycle operations
 */
class OrchestratorService {
  /**
   * Get all orchestrator hosts
   * 
   * @param hostname - The hostname identifier for the target server
   * @returns Array of orchestrator hosts
   * @throws ApiError
   */
  async getOrchestratorHosts(hostname: string): Promise<DevOpsRemoteHost[]> {
    try {
      const hosts = await apiService.get<DevOpsRemoteHost[]>(
        hostname,
        '/api/v1/orchestrator/hosts',
        { errorPrefix: 'Failed to get orchestrator hosts' }
      );

      return hosts || [];
    } catch (error) {
      console.error('Failed to get orchestrator hosts:', error);
      throw error;
    }
  }

  /**
   * Get orchestrator resources
   * 
   * @param hostname - The hostname identifier for the target server
   * @returns Array of orchestrator resources
   * @throws ApiError
   */
  async getOrchestratorResources(hostname: string): Promise<DevOpsRemoteHostResource[]> {
    try {
      const resources = await apiService.get<DevOpsRemoteHostResource[]>(
        hostname,
        '/api/v1/orchestrator/resources',
        { errorPrefix: 'Failed to get orchestrator resources' }
      );

      return resources || [];
    } catch (error) {
      console.error('Failed to get orchestrator resources:', error);
      throw error;
    }
  }

  /**
   * Add a new orchestrator host
   * 
   * @param hostname - The hostname identifier for the target server
   * @param request - Host configuration request
   * @returns true if successful
   * @throws ApiError
   */
  async addOrchestratorHost(
    hostname: string,
    request: AddOrchestratorHostRequest
  ): Promise<boolean> {
    try {
      if (!request) {
        throw new Error('Request is required');
      }

      await apiService.post(
        hostname,
        '/api/v1/orchestrator/hosts',
        request,
        { errorPrefix: 'Failed to add orchestrator host' }
      );

      return true;
    } catch (error) {
      console.error('Failed to add orchestrator host:', error);
      throw error;
    }
  }

  /**
   * Update an orchestrator host
   * 
   * @param hostname - The hostname identifier for the target server
   * @param hostId - Host ID to update
   * @param request - Host update request
   * @returns true if successful
   * @throws ApiError
   */
  async updateOrchestratorHost(
    hostname: string,
    hostId: string,
    request: UpdateOrchestratorHostRequest
  ): Promise<boolean> {
    try {
      if (!request) {
        throw new Error('Request is required');
      }

      await apiService.put(
        hostname,
        `/api/v1/orchestrator/hosts/${hostId}`,
        request,
        { errorPrefix: `Failed to update orchestrator host ${hostId}` }
      );

      return true;
    } catch (error) {
      console.error(`Failed to update orchestrator host ${hostId}:`, error);
      throw error;
    }
  }

  /**
   * Enable an orchestrator host
   * 
   * @param hostname - The hostname identifier for the target server
   * @param hostId - Host ID to enable
   * @returns true if successful
   * @throws ApiError
   */
  async enableOrchestratorHost(hostname: string, hostId: string): Promise<boolean> {
    try {
      await apiService.put(
        hostname,
        `/api/v1/orchestrator/hosts/${hostId}/enable`,
        undefined,
        { errorPrefix: `Failed to enable orchestrator host ${hostId}` }
      );

      return true;
    } catch (error) {
      console.error(`Failed to enable orchestrator host ${hostId}:`, error);
      throw error;
    }
  }

  /**
   * Disable an orchestrator host
   * 
   * @param hostname - The hostname identifier for the target server
   * @param hostId - Host ID to disable
   * @returns true if successful
   * @throws ApiError
   */
  async disableOrchestratorHost(hostname: string, hostId: string): Promise<boolean> {
    try {
      await apiService.put(
        hostname,
        `/api/v1/orchestrator/hosts/${hostId}/disable`,
        undefined,
        { errorPrefix: `Failed to disable orchestrator host ${hostId}` }
      );

      return true;
    } catch (error) {
      console.error(`Failed to disable orchestrator host ${hostId}:`, error);
      throw error;
    }
  }

  /**
   * Remove an orchestrator host
   * 
   * @param hostname - The hostname identifier for the target server
   * @param hostId - Host ID to remove
   * @returns true if successful
   * @throws ApiError
   */
  async removeOrchestratorHost(hostname: string, hostId: string): Promise<boolean> {
    try {
      await apiService.delete(
        hostname,
        `/api/v1/orchestrator/hosts/${hostId}`,
        { errorPrefix: `Failed to remove orchestrator host ${hostId}` }
      );

      return true;
    } catch (error) {
      console.error(`Failed to remove orchestrator host ${hostId}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const orchestratorService = new OrchestratorService();
export default orchestratorService;
