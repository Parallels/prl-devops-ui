import { apiService } from './api';
import {
  CatalogManifestItem,
  HostHardwareInfo,
  VirtualMachine
} from '../interfaces/devops';

/**
 * DevOps Service - Handles all API calls to Parallels DevOps API
 * Uses apiService for authenticated requests
 * 
 * Note: hostname is required for all API calls - the UI manages the active/selected host
 */
class DevOpsService {
  /**
   * Get catalog manifests from DevOps API
   * 
   * @param hostname - The hostname identifier for the target server (required)
   * @returns Array of catalog manifest items
   * @throws ApiError
   */
  async getCatalogManifests(hostname: string): Promise<CatalogManifestItem[]> {
    
    try {
      const manifests = await apiService.get<unknown[]>(
        hostname,
        '/api/v1/catalog',
        { errorPrefix: 'Failed to get catalog manifests' }
      );

      // Transform response to match expected format
      const items: CatalogManifestItem[] = [];
      
      for (const manifest of manifests) {
        const manifestKey = Object.keys(manifest as object)[0];
        const item: CatalogManifestItem = {
          name: manifestKey,
          description: '',
          items: (manifest as Record<string, unknown>)[manifestKey] as never[] || []
        };

        // Extract description from first item if available
        if (item.items.length > 0 && item.items[0].description) {
          item.description = item.items[0].description;
        }

        items.push(item);
      }

      return items;
    } catch (error) {
      console.error('Failed to get catalog manifests:', error);
      throw error;
    }
  }

  /**
   * Get hardware information from remote host
   * 
   * @param hostname - The hostname identifier for the target server (required)
   * @returns Hardware information or undefined
   * @throws ApiError
   */
  async getHardwareInfo(hostname: string): Promise<HostHardwareInfo | undefined> {
    try {
      const hwInfo = await apiService.get<HostHardwareInfo>(
        hostname,
        '/api/v1/config/hardware',
        { errorPrefix: 'Failed to get hardware info' }
      );

      return hwInfo;
    } catch (error) {
      console.error('Failed to get hardware info:', error);
      throw error;
    }
  }

  /**
   * Test connectivity to the DevOps API
   * 
   * @param hostname - The hostname identifier for the target server (required)
   * @returns true if host is reachable and authenticated
   */
  async testConnection(hostname: string): Promise<boolean> {
    try {
      // Try to get hardware info as a simple test
      await this.getHardwareInfo(hostname);
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * Get all virtual machines from remote host
   * 
   * @param hostname - The hostname identifier for the target server (required)
   * @returns Array of virtual machines
   * @throws ApiError
   */
  async getVirtualMachines(hostname: string): Promise<VirtualMachine[]> {
    try {
      const vms = await apiService.get<VirtualMachine[]>(
        hostname,
        '/api/v1/machines',
        { errorPrefix: 'Failed to get virtual machines' }
      );

      return vms || [];
    } catch (error) {
      console.error('Failed to get virtual machines:', error);
      throw error;
    }
  }

  /**
   * Start a virtual machine
   * 
   * @param hostname - The hostname identifier for the target server (required)
   * @param vmId - Virtual machine ID
   * @returns true if successful
   * @throws ApiError
   */
  async startVirtualMachine(hostname: string, vmId: string): Promise<boolean> {
    try {
      await apiService.put(
        hostname,
        `/api/v1/machines/${vmId}/start`,
        undefined,
        { errorPrefix: `Failed to start VM ${vmId}` }
      );

      return true;
    } catch (error) {
      console.error(`Failed to start VM ${vmId}:`, error);
      return false;
    }
  }

  /**
   * Stop a virtual machine
   * 
   * @param hostname - The hostname identifier for the target server (required)
   * @param vmId - Virtual machine ID
   * @returns true if successful
   * @throws ApiError
   */
  async stopVirtualMachine(hostname: string, vmId: string): Promise<boolean> {
    try {
      await apiService.put(
        hostname,
        `/api/v1/machines/${vmId}/stop`,
        undefined,
        { errorPrefix: `Failed to stop VM ${vmId}` }
      );

      return true;
    } catch (error) {
      console.error(`Failed to stop VM ${vmId}:`, error);
      return false;
    }
  }
}

// Export singleton instance
export const devopsService = new DevOpsService();
export default devopsService;
