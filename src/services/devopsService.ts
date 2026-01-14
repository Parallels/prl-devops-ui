import { authService } from './authService';

/**
 * DevOps Service - Handles all API calls to Parallels DevOps API
 * Uses authService for authentication (JWT tokens)
 */

// ============================================================================
// Types/Interfaces
// ============================================================================

/**
 * Catalog manifest item from API
 */
export interface CatalogManifestItem {
  name: string;
  description: string;
  items: Array<{
    id?: string;
    name?: string;
    version?: string;
    description?: string;
    architecture?: string;
    [key: string]: any;
  }>;
}

/**
 * Hardware information from remote host
 */
export interface HostHardwareInfo {
  total_memory?: string;
  total_available?: string;
  cpu_type?: string;
  cpu_brand?: string;
  logical_cpu_count?: number;
  physical_cpu_count?: number;
  [key: string]: any;
}

/**
 * Virtual machine from API
 */
export interface VirtualMachine {
  ID?: string;
  Name?: string;
  Description?: string;
  State?: string;
  OS?: string;
  host_id?: string;
  user?: string;
  [key: string]: any;
}

/**
 * API error response
 */
interface ApiError {
  error?: {
    message: string;
  };
  message?: string;
}

// ============================================================================
// DevOps Service Class
// ============================================================================

class DevOpsService {
  private defaultHostname = 'devops-api';

  /**
   * Build full API URL
   * @param hostname - The hostname identifier for auth
   * @param endpoint - API endpoint path (e.g., '/api/v1/catalog')
   * @returns Full URL
   */
  private async buildUrl(hostname: string, endpoint: string): Promise<string> {
    // In development mode (browser), use relative URL to leverage Vite proxy
    // In production (Tauri app), use absolute URL
    const isDev = window.location.hostname === 'localhost' && window.location.port === '1421';
    const baseUrl = isDev ? '' : 'http://localhost:5680';
    
    // Ensure endpoint starts with /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${normalizedEndpoint}`;
  }

  /**
   * Make authenticated API request
   * @param hostname - The hostname identifier for auth
   * @param endpoint - API endpoint path
   * @param options - Fetch options
   * @returns Response data
   */
  private async request<T>(
    hostname: string,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      // Get access token from authService
      const token = await authService.getAccessToken(hostname);
      
      // Build full URL
      const url = await this.buildUrl(hostname, endpoint);

      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-SOURCE-ID': 'DEVOPS_UI',
        ...((options.headers as Record<string, string>) || {})
      };

      // Make request
      const response = await fetch(url, {
        ...options,
        headers
      });

      // Handle non-OK responses
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `API request failed: ${response.statusText}`;
        
        try {
          const errorData = JSON.parse(errorText) as ApiError;
          if (errorData.error?.message) {
            errorMessage = errorData.error.message;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // Parsing failed, use default error message
        }
        
        throw new Error(errorMessage);
      }

      // Parse and return response
      const data = await response.json();
      return data as T;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`API request failed: ${String(error)}`);
    }
  }

  // ============================================================================
  // Catalog API Methods
  // ============================================================================

  /**
   * Get catalog manifests from DevOps API
   * Example usage:
   *   const manifests = await devopsService.getCatalogManifests();
   *   
   * @param hostname - Optional hostname identifier (defaults to 'devops-api')
   * @returns Array of catalog manifest items
   */
  async getCatalogManifests(hostname?: string): Promise<CatalogManifestItem[]> {
    const host = hostname || this.defaultHostname;
    
    try {
      const manifests = await this.request<any[]>(
        host,
        '/api/v1/catalog',
        {
          method: 'GET'
        }
      );

      // Transform response to match expected format
      const items: CatalogManifestItem[] = [];
      
      for (const manifest of manifests) {
        const manifestKey = Object.keys(manifest)[0];
        const item: CatalogManifestItem = {
          name: manifestKey,
          description: '',
          items: manifest[manifestKey] || []
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
   * Example usage:
   *   const hwInfo = await devopsService.getHardwareInfo();
   *   
   * @param hostname - Optional hostname identifier (defaults to 'devops-api')
   * @returns Hardware information or undefined
   */
  async getHardwareInfo(hostname?: string): Promise<HostHardwareInfo | undefined> {
    const host = hostname || this.defaultHostname;
    
    try {
      const hwInfo = await this.request<HostHardwareInfo>(
        host,
        '/api/v1/config/hardware',
        {
          method: 'GET'
        }
      );

      return hwInfo;
    } catch (error) {
      console.error('Failed to get hardware info:', error);
      throw error;
    }
  }

  /**
   * Test connectivity to the DevOps API
   * @param hostname - Optional hostname identifier
   * @returns true if host is reachable and authenticated
   */
  async testConnection(hostname?: string): Promise<boolean> {
    const host = hostname || this.defaultHostname;
    
    try {
      // Try to get hardware info as a simple test
      await this.getHardwareInfo(host);
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  // ============================================================================
  // Virtual Machine API Methods
  // ============================================================================

  /**
   * Get all virtual machines from remote host
   * Example usage:
   *   const vms = await devopsService.getVirtualMachines();
   *   
   * @param hostname - Optional hostname identifier (defaults to 'devops-api')
   * @returns Array of virtual machines
   */
  async getVirtualMachines(hostname?: string): Promise<VirtualMachine[]> {
    const host = hostname || this.defaultHostname;
    
    try {
      const vms = await this.request<VirtualMachine[]>(
        host,
        '/api/v1/machines',
        {
          method: 'GET'
        }
      );

      return vms || [];
    } catch (error) {
      console.error('Failed to get virtual machines:', error);
      throw error;
    }
  }

  /**
   * Start a virtual machine
   * @param vmId - Virtual machine ID
   * @param hostname - Optional hostname identifier
   * @returns true if successful
   */
  async startVirtualMachine(vmId: string, hostname?: string): Promise<boolean> {
    const host = hostname || this.defaultHostname;
    
    try {
      await this.request(
        host,
        `/api/v1/machines/${vmId}/start`,
        {
          method: 'PUT'
        }
      );

      return true;
    } catch (error) {
      console.error(`Failed to start VM ${vmId}:`, error);
      return false;
    }
  }

  /**
   * Stop a virtual machine
   * @param vmId - Virtual machine ID
   * @param hostname - Optional hostname identifier
   * @returns true if successful
   */
  async stopVirtualMachine(vmId: string, hostname?: string): Promise<boolean> {
    const host = hostname || this.defaultHostname;
    
    try {
      await this.request(
        host,
        `/api/v1/machines/${vmId}/stop`,
        {
          method: 'PUT'
        }
      );

      return true;
    } catch (error) {
      console.error(`Failed to stop VM ${vmId}:`, error);
      return false;
    }
  }

  /**
   * Set default hostname for all API calls
   * @param hostname - The hostname identifier
   */
  setDefaultHostname(hostname: string): void {
    this.defaultHostname = hostname;
  }

  /**
   * Get current default hostname
   * @returns Current default hostname
   */
  getDefaultHostname(): string {
    return this.defaultHostname;
  }
}

// Export singleton instance
export const devopsService = new DevOpsService();
export default devopsService;
