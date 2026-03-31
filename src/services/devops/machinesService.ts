import { apiService } from '../api';
import { VirtualMachine } from '../../interfaces/VirtualMachine';
import { VmCloneRequest } from '../../interfaces/devops';
import { authService } from '../authService';
import { CreateMachineAsyncRequest, MachineStateResponse } from '@/interfaces/Machine';


/**
 * Machines Service - Handles virtual machine operations for Parallels DevOps API
 * Manages VM lifecycle (start, stop, pause, etc.) and VM management operations
 */
class MachinesService {
  /**
   * Get all virtual machines from remote host
   * 
   * @param hostname - The hostname identifier for the target server (optional, uses current session if omitted)
   * @param isOrchestrator - Whether this is an orchestrator endpoint
   * @returns Array of virtual machines
   * @throws ApiError
   */
  async getVirtualMachines(hostname?: string, isOrchestrator = false): Promise<VirtualMachine[]> {
    try {
      const targetHost = hostname || authService.currentHostname;
      if (!targetHost) {
        throw new Error('No hostname provided and no active session found');
      }

      const endpoint = isOrchestrator
        ? '/api/v1/orchestrator/machines'
        : '/api/v1/machines';

      const vms = await apiService.get<VirtualMachine[]>(
        targetHost,
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
   * Get a single virtual machine by ID
   *
   * @param hostname - The hostname identifier for the target server
   * @param vmId - Virtual machine ID
   * @param isOrchestrator - Whether this is an orchestrator endpoint
   * @returns The virtual machine
   * @throws ApiError
   */
  async getVirtualMachine(hostname: string | undefined, vmId: string, isOrchestrator = false): Promise<VirtualMachine> {
    const targetHost = hostname || authService.currentHostname;
    if (!targetHost) throw new Error('No hostname provided and no active session found');

    const endpoint = isOrchestrator
      ? `/api/v1/orchestrator/machines/${vmId}`
      : `/api/v1/machines/${vmId}`;

    return apiService.get<VirtualMachine>(targetHost, endpoint, {
      errorPrefix: `Failed to get VM ${vmId}`,
    });
  }

  /**
   * Execute a state operation on a virtual machine
   * Helper method for common state operations
   */
  private async executeVmStateOperation(
    hostname: string | undefined,
    vmId: string,
    operation: string,
    force = false,
    isOrchestrator = false
  ): Promise<MachineStateResponse> {
    try {
      const targetHost = hostname || authService.currentHostname;
      if (!targetHost) {
        throw new Error('No hostname provided and no active session found');
      }

      let endpoint = isOrchestrator
        ? `/api/v1/orchestrator/machines/${vmId}/${operation}`
        : `/api/v1/machines/${vmId}/${operation}`;

      if (force) {
        endpoint += '?force=true';
      }
      if (isOrchestrator) {
        const response = await apiService.put<MachineStateResponse>(
          targetHost,
          endpoint,
          { errorPrefix: `Failed to ${operation} VM ${vmId}` }
        );
        return response;
      } else {
        const response = await apiService.get<MachineStateResponse>(
          targetHost,
          endpoint,
          { errorPrefix: `Failed to ${operation} VM ${vmId}` }
        );
        return response;
      }

    } catch (error) {
      console.error(`Failed to ${operation} VM ${vmId}:`, error);
      throw error;
    }
  }

  /**
   * Start a virtual machine
   * 
   * @param hostname - The hostname identifier for the target server (optional, uses current session if omitted)
   * @param vmId - Virtual machine ID
   * @param isOrchestrator - Whether this is an orchestrator endpoint
   * @returns true if successful
   * @throws ApiError
   */
  async startVirtualMachine(hostname: string | undefined, vmId: string, isOrchestrator = false): Promise<MachineStateResponse> {
    return this.executeVmStateOperation(hostname, vmId, 'start', false, isOrchestrator);
  }

  /**
   * Stop a virtual machine
   * 
   * @param hostname - The hostname identifier for the target server (optional, uses current session if omitted)
   * @param vmId - Virtual machine ID
   * @param isOrchestrator - Whether this is an orchestrator endpoint
   * @returns true if successful
   * @throws ApiError
   */
  async stopVirtualMachine(hostname: string | undefined, vmId: string, force = false, isOrchestrator = false): Promise<MachineStateResponse> {
    return this.executeVmStateOperation(hostname, vmId, 'stop', force, isOrchestrator);
  }

  /**
   * Pause a virtual machine
   * 
   * @param hostname - The hostname identifier for the target server (optional, uses current session if omitted)
   * @param vmId - Virtual machine ID
   * @param isOrchestrator - Whether this is an orchestrator endpoint
   * @returns true if successful
   * @throws ApiError
   */
  async pauseVirtualMachine(hostname: string | undefined, vmId: string, isOrchestrator = false): Promise<MachineStateResponse> {
    return this.executeVmStateOperation(hostname, vmId, 'pause', false, isOrchestrator);
  }

  /**
   * Resume a virtual machine
   * 
   * @param hostname - The hostname identifier for the target server (optional, uses current session if omitted)
   * @param vmId - Virtual machine ID
   * @param isOrchestrator - Whether this is an orchestrator endpoint
   * @returns true if successful
   * @throws ApiError
   */
  async resumeVirtualMachine(hostname: string | undefined, vmId: string, isOrchestrator = false): Promise<MachineStateResponse> {
    return this.executeVmStateOperation(hostname, vmId, 'resume', false, isOrchestrator);
  }

  /**
   * Suspend a virtual machine
   * 
   * @param hostname - The hostname identifier for the target server (optional, uses current session if omitted)
   * @param vmId - Virtual machine ID
   * @param isOrchestrator - Whether this is an orchestrator endpoint
   * @returns true if successful
   * @throws ApiError
   */
  async suspendVirtualMachine(hostname: string | undefined, vmId: string, isOrchestrator = false): Promise<MachineStateResponse> {
    return this.executeVmStateOperation(hostname, vmId, 'suspend', false, isOrchestrator);
  }

  /**
   * Remove a virtual machine
   * 
   * @param hostname - The hostname identifier for the target server (optional, uses current session if omitted)
   * @param vmId - Virtual machine ID
   * @param isOrchestrator - Whether this is an orchestrator endpoint
   * @returns true if successful
   * @throws ApiError
   */
  async removeVirtualMachine(hostname: string | undefined, vmId: string, isOrchestrator = false, force = false): Promise<boolean> {
    try {
      const targetHost = hostname || authService.currentHostname;
      if (!targetHost) {
        throw new Error('No hostname provided and no active session found');
      }

      const base = isOrchestrator
        ? `/api/v1/orchestrator/machines/${vmId}`
        : `/api/v1/machines/${vmId}`;
      const endpoint = force ? `${base}?force=true` : base;

      await apiService.delete(
        targetHost,
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
   * @param hostname - The hostname identifier for the target server (optional, uses current session if omitted)
   * @param vmId - Virtual machine ID
   * @param hostId - Host ID (required for orchestrator mode)
   * @param isOrchestrator - Whether this is an orchestrator endpoint
   * @param cleanSourceUuid - Whether to clean the source UUID
   * @returns true if successful
   * @throws ApiError
   */
  async unregisterVirtualMachine(
    hostname: string | undefined,
    vmId: string,
    hostId?: string,
    isOrchestrator = false,
    cleanSourceUuid = true
  ): Promise<boolean> {
    try {
      const targetHost = hostname || authService.currentHostname;
      if (!targetHost) {
        throw new Error('No hostname provided and no active session found');
      }

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
        targetHost,
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
   * @param hostname - The hostname identifier for the target server (optional, uses current session if omitted)
   * @param vmId - Virtual machine ID to clone
   * @param cloneName - Name for the new cloned VM
   * @param isOrchestrator - Whether this is an orchestrator endpoint
   * @returns true if successful
   * @throws ApiError
   */
  async cloneVirtualMachine(
    hostname: string | undefined,
    vmId: string,
    cloneName: string,
    destinationPath: string,
    isOrchestrator = false
  ): Promise<boolean> {
    try {
      const targetHost = hostname || authService.currentHostname;
      if (!targetHost) {
        throw new Error('No hostname provided and no active session found');
      }

      if (!cloneName) {
        throw new Error('Clone name is required');
      }

      const endpoint = isOrchestrator
        ? `/api/v1/orchestrator/machines/${vmId}/clone`
        : `/api/v1/machines/${vmId}/clone`;

      const request: VmCloneRequest = {
        clone_name: cloneName,
        destination_path: destinationPath,
      };

      await apiService.put(
        targetHost,
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
   * @param hostname - The hostname identifier for the target server (optional, uses current session if omitted)
   * @param request - Catalog machine creation request
   * @param isOrchestrator - Whether this is an orchestrator endpoint
   * @returns Created virtual machine
   * @throws ApiError
   */
  async createVirtualMachineFromCatalog(
    hostname: string | undefined,
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
      const targetHost = hostname || authService.currentHostname;
      if (!targetHost) {
        throw new Error('No hostname provided and no active session found');
      }

      const endpoint = isOrchestrator
        ? '/api/v1/orchestrator/machines'
        : '/api/v1/machines';

      const vm = await apiService.post<VirtualMachine>(
        targetHost,
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

  /**
   * Create/download a virtual machine asynchronously from a catalog manifest.
   *
   * Endpoint: POST /api/v1/machines/async  (host)
   *           POST /api/v1/orchestrator/machines/async  (orchestrator)
   */
  async createVirtualMachineFromCatalogAsync(
    hostname: string | undefined,
    request: CreateMachineAsyncRequest,
    isOrchestrator = false
  ): Promise<void> {
    try {
      const targetHost = hostname || authService.currentHostname;
      if (!targetHost) {
        throw new Error('No hostname provided and no active session found');
      }

      const endpoint = isOrchestrator
        ? '/api/v1/orchestrator/machines/async'
        : '/api/v1/machines/async';

      await apiService.post<void>(
        targetHost,
        endpoint,
        request,
        { errorPrefix: 'Failed to start VM download from catalog', expectNoContent: true }
      );
    } catch (error) {
      console.error('Failed to create VM asynchronously from catalog:', error);
      throw error;
    }
  }

  /**
   * Create/download a virtual machine asynchronously on a specific orchestrator host.
   *
   * Endpoint: POST /api/v1/orchestrator/hosts/{hostId}/machines/async
   */
  async createVirtualMachineFromCatalogAsyncOnHost(
    hostname: string | undefined,
    hostId: string,
    request: CreateMachineAsyncRequest,
  ): Promise<void> {
    try {
      const targetHost = hostname || authService.currentHostname;
      if (!targetHost) {
        throw new Error('No hostname provided and no active session found');
      }

      await apiService.post<void>(
        targetHost,
        `/api/v1/orchestrator/hosts/${hostId}/machines/async`,
        request,
        { errorPrefix: 'Failed to start VM download from catalog on host', expectNoContent: true },
      );
    } catch (error) {
      console.error('Failed to create VM asynchronously from catalog on host:', error);
      throw error;
    }
  }

  
}

// Export singleton instance
export const machinesService = new MachinesService();
export default machinesService;
