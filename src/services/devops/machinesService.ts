import { apiService } from '../api';
import { VirtualMachine } from '../../interfaces/devops';

/**
 * Virtual machine operation interface
 */
interface VmOperation {
  group: string;
  operation: string;
  value?: string;
  options?: Array<{ flag: string; value: string }>;
}

/**
 * Virtual machine configuration request
 */
interface VmConfigureRequest {
  operations: VmOperation[];
}

/**
 * Machines Service - Handles virtual machine operations for Parallels DevOps API
 * Manages VM lifecycle (start, stop, pause, etc.) and VM management operations
 */
class MachinesService {
  /**
   * Get all virtual machines from remote host
   * 
   * @param hostname - The hostname identifier for the target server
   * @param isOrchestrator - Whether this is an orchestrator endpoint
   * @returns Array of virtual machines
   * @throws ApiError
   */
  async getVirtualMachines(hostname: string, isOrchestrator = false): Promise<VirtualMachine[]> {
    try {
      const endpoint = isOrchestrator 
        ? '/api/v1/orchestrator/machines'
        : '/api/v1/machines';

      const vms = await apiService.get<VirtualMachine[]>(
        hostname,
        endpoint,
        { errorPrefix: 'Failed to get virtual machines' }
      );

      return vms || [];
    } catch (error) {
      console.error('Failed to get virtual machines:', error);
      throw error;
    }
  }

  /**
   * Execute a state operation on a virtual machine
   * Helper method for common state operations
   */
  private async executeVmStateOperation(
    hostname: string,
    vmId: string,
    operation: string,
    isOrchestrator = false
  ): Promise<boolean> {
    try {
      const endpoint = isOrchestrator
        ? `/api/v1/orchestrator/machines/${vmId}/set`
        : `/api/v1/machines/${vmId}/set`;

      const request: VmConfigureRequest = {
        operations: [
          {
            group: 'state',
            operation,
            value: ''
          }
        ]
      };

      await apiService.put(
        hostname,
        endpoint,
        request,
        { errorPrefix: `Failed to ${operation} VM ${vmId}` }
      );

      return true;
    } catch (error) {
      console.error(`Failed to ${operation} VM ${vmId}:`, error);
      throw error;
    }
  }

  /**
   * Start a virtual machine
   * 
   * @param hostname - The hostname identifier for the target server
   * @param vmId - Virtual machine ID
   * @param isOrchestrator - Whether this is an orchestrator endpoint
   * @returns true if successful
   * @throws ApiError
   */
  async startVirtualMachine(hostname: string, vmId: string, isOrchestrator = false): Promise<boolean> {
    return this.executeVmStateOperation(hostname, vmId, 'start', isOrchestrator);
  }

  /**
   * Stop a virtual machine
   * 
   * @param hostname - The hostname identifier for the target server
   * @param vmId - Virtual machine ID
   * @param isOrchestrator - Whether this is an orchestrator endpoint
   * @returns true if successful
   * @throws ApiError
   */
  async stopVirtualMachine(hostname: string, vmId: string, isOrchestrator = false): Promise<boolean> {
    return this.executeVmStateOperation(hostname, vmId, 'stop', isOrchestrator);
  }

  /**
   * Pause a virtual machine
   * 
   * @param hostname - The hostname identifier for the target server
   * @param vmId - Virtual machine ID
   * @param isOrchestrator - Whether this is an orchestrator endpoint
   * @returns true if successful
   * @throws ApiError
   */
  async pauseVirtualMachine(hostname: string, vmId: string, isOrchestrator = false): Promise<boolean> {
    return this.executeVmStateOperation(hostname, vmId, 'pause', isOrchestrator);
  }

  /**
   * Resume a virtual machine
   * 
   * @param hostname - The hostname identifier for the target server
   * @param vmId - Virtual machine ID
   * @param isOrchestrator - Whether this is an orchestrator endpoint
   * @returns true if successful
   * @throws ApiError
   */
  async resumeVirtualMachine(hostname: string, vmId: string, isOrchestrator = false): Promise<boolean> {
    return this.executeVmStateOperation(hostname, vmId, 'resume', isOrchestrator);
  }

  /**
   * Suspend a virtual machine
   * 
   * @param hostname - The hostname identifier for the target server
   * @param vmId - Virtual machine ID
   * @param isOrchestrator - Whether this is an orchestrator endpoint
   * @returns true if successful
   * @throws ApiError
   */
  async suspendVirtualMachine(hostname: string, vmId: string, isOrchestrator = false): Promise<boolean> {
    return this.executeVmStateOperation(hostname, vmId, 'suspend', isOrchestrator);
  }

  /**
   * Remove a virtual machine
   * 
   * @param hostname - The hostname identifier for the target server
   * @param vmId - Virtual machine ID
   * @param isOrchestrator - Whether this is an orchestrator endpoint
   * @returns true if successful
   * @throws ApiError
   */
  async removeVirtualMachine(hostname: string, vmId: string, isOrchestrator = false): Promise<boolean> {
    try {
      const endpoint = isOrchestrator
        ? `/api/v1/orchestrator/machines/${vmId}`
        : `/api/v1/machines/${vmId}`;

      await apiService.delete(
        hostname,
        endpoint,
        { errorPrefix: `Failed to remove VM ${vmId}` }
      );

      return true;
    } catch (error) {
      console.error(`Failed to remove VM ${vmId}:`, error);
      throw error;
    }
  }

  /**
   * Unregister a virtual machine (remove from API without deleting)
   * 
   * @param hostname - The hostname identifier for the target server
   * @param vmId - Virtual machine ID
   * @param hostId - Host ID (required for orchestrator mode)
   * @param isOrchestrator - Whether this is an orchestrator endpoint
   * @param cleanSourceUuid - Whether to clean the source UUID
   * @returns true if successful
   * @throws ApiError
   */
  async unregisterVirtualMachine(
    hostname: string,
    vmId: string,
    hostId?: string,
    isOrchestrator = false,
    cleanSourceUuid = true
  ): Promise<boolean> {
    try {
      let endpoint = `/api/v1/machines/${vmId}/unregister`;
      
      if (isOrchestrator) {
        if (!hostId) {
          throw new Error('Host ID is required for orchestrator mode');
        }
        endpoint = `/api/v1/orchestrator/hosts/${hostId}/machines/${vmId}/unregister`;
      }

      const request = {
        id: vmId,
        clean_source_uuid: cleanSourceUuid
      };

      await apiService.post(
        hostname,
        endpoint,
        request,
        { errorPrefix: `Failed to unregister VM ${vmId}` }
      );

      return true;
    } catch (error) {
      console.error(`Failed to unregister VM ${vmId}:`, error);
      throw error;
    }
  }

  /**
   * Clone a virtual machine
   * 
   * @param hostname - The hostname identifier for the target server
   * @param vmId - Virtual machine ID to clone
   * @param cloneName - Name for the new cloned VM
   * @param isOrchestrator - Whether this is an orchestrator endpoint
   * @returns true if successful
   * @throws ApiError
   */
  async cloneVirtualMachine(
    hostname: string,
    vmId: string,
    cloneName: string,
    isOrchestrator = false
  ): Promise<boolean> {
    try {
      if (!cloneName) {
        throw new Error('Clone name is required');
      }

      const endpoint = isOrchestrator
        ? `/api/v1/orchestrator/machines/${vmId}/set`
        : `/api/v1/machines/${vmId}/set`;

      const request: VmConfigureRequest = {
        operations: [
          {
            group: 'machine',
            operation: 'clone',
            options: [
              {
                flag: 'name',
                value: cloneName
              }
            ]
          }
        ]
      };

      await apiService.put(
        hostname,
        endpoint,
        request,
        { errorPrefix: `Failed to clone VM ${vmId}` }
      );

      return true;
    } catch (error) {
      console.error(`Failed to clone VM ${vmId}:`, error);
      throw error;
    }
  }

  /**
   * Create a virtual machine from catalog
   * 
   * @param hostname - The hostname identifier for the target server
   * @param request - Catalog machine creation request
   * @param isOrchestrator - Whether this is an orchestrator endpoint
   * @returns Created virtual machine
   * @throws ApiError
   */
  async createVirtualMachineFromCatalog(
    hostname: string,
    request: {
      catalog_id: string;
      version?: string;
      architecture?: string;
      machine_name?: string;
      owner?: string;
      [key: string]: unknown;
    },
    isOrchestrator = false
  ): Promise<VirtualMachine> {
    try {
      const endpoint = isOrchestrator
        ? '/api/v1/orchestrator/machines'
        : '/api/v1/machines';

      const vm = await apiService.post<VirtualMachine>(
        hostname,
        endpoint,
        request,
        { errorPrefix: 'Failed to create VM from catalog' }
      );

      return vm;
    } catch (error) {
      console.error('Failed to create VM from catalog:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const machinesService = new MachinesService();
export default machinesService;
