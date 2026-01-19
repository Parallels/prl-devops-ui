import { apiService } from '../api';
import {ReverseProxyResponse, ReverseProxyConfig, ReverseProxyHost, ReverseProxyHostHttpRoute, ReverseProxyHostTcpRoute} from '../../interfaces/devops';

/**
 * Reverse Proxy Service - Handles reverse proxy operations for Parallels DevOps API
 * Manages reverse proxy configuration and host routing
 */
class ReverseProxyService {
  /**
   * Get reverse proxy configuration and hosts
   * 
   * @param hostname - The hostname identifier for the target server
   * @param hostId - Optional orchestrator host ID (for orchestrator endpoints)
   * @returns Reverse proxy configuration and hosts
   * @throws ApiError
   */
  async getReverseProxy(hostname: string, hostId?: string): Promise<ReverseProxyResponse> {
    try {
      const response: ReverseProxyResponse = {};

      // Determine config endpoint based on whether this is orchestrator
      const configEndpoint = hostId
        ? `/api/v1/orchestrator/hosts/${hostId}/reverse-proxy`
        : '/api/v1/reverse-proxy';

      // Get reverse proxy config
      const config = await apiService.get<ReverseProxyConfig>(
        hostname,
        configEndpoint,
        { errorPrefix: 'Failed to get reverse proxy configuration' }
      );
      response.reverse_proxy_config = config;

      // Determine hosts endpoint
      const hostsEndpoint = hostId
        ? `/api/v1/orchestrator/hosts/${hostId}/reverse-proxy/hosts`
        : '/api/v1/reverse-proxy/hosts';

      // Get reverse proxy hosts
      const hosts = await apiService.get<ReverseProxyHost[]>(
        hostname,
        hostsEndpoint,
        { errorPrefix: 'Failed to get reverse proxy hosts' }
      );
      response.reverse_proxy_hosts = hosts;

      return response;
    } catch (error) {
      console.error('Failed to get reverse proxy:', error);
      throw error;
    }
  }

  /**
   * Enable reverse proxy
   * 
   * @param hostname - The hostname identifier for the target server
   * @param hostId - Optional orchestrator host ID (for orchestrator endpoints)
   * @returns Success status
   * @throws ApiError
   */
  async enableReverseProxy(hostname: string, hostId?: string): Promise<boolean> {
    try {
      const endpoint = hostId
        ? `/api/v1/orchestrator/hosts/${hostId}/reverse-proxy/enable`
        : '/api/v1/reverse-proxy/enable';

      await apiService.put(
        hostname,
        endpoint,
        {},
        { errorPrefix: 'Failed to enable reverse proxy' }
      );

      return true;
    } catch (error) {
      console.error('Failed to enable reverse proxy:', error);
      throw error;
    }
  }

  /**
   * Disable reverse proxy
   * 
   * @param hostname - The hostname identifier for the target server
   * @param hostId - Optional orchestrator host ID (for orchestrator endpoints)
   * @returns Success status
   * @throws ApiError
   */
  async disableReverseProxy(hostname: string, hostId?: string): Promise<boolean> {
    try {
      const endpoint = hostId
        ? `/api/v1/orchestrator/hosts/${hostId}/reverse-proxy/disable`
        : '/api/v1/reverse-proxy/disable';

      await apiService.put(
        hostname,
        endpoint,
        {},
        { errorPrefix: 'Failed to disable reverse proxy' }
      );

      return true;
    } catch (error) {
      console.error('Failed to disable reverse proxy:', error);
      throw error;
    }
  }

  /**
   * Restart reverse proxy
   * 
   * @param hostname - The hostname identifier for the target server
   * @param hostId - Optional orchestrator host ID (for orchestrator endpoints)
   * @returns Success status
   * @throws ApiError
   */
  async restartReverseProxy(hostname: string, hostId?: string): Promise<boolean> {
    try {
      const endpoint = hostId
        ? `/api/v1/orchestrator/hosts/${hostId}/reverse-proxy/restart`
        : '/api/v1/reverse-proxy/restart';

      await apiService.put(
        hostname,
        endpoint,
        {},
        { errorPrefix: 'Failed to restart reverse proxy' }
      );

      return true;
    } catch (error) {
      console.error('Failed to restart reverse proxy:', error);
      throw error;
    }
  }

  /**
   * Get reverse proxy hosts
   * 
   * @param hostname - The hostname identifier for the target server
   * @param hostId - Optional orchestrator host ID (for orchestrator endpoints)
   * @returns Array of reverse proxy hosts
   * @throws ApiError
   */
  async getReverseProxyHosts(hostname: string, hostId?: string): Promise<ReverseProxyHost[]> {
    try {
      const endpoint = hostId
        ? `/api/v1/orchestrator/hosts/${hostId}/reverse-proxy/hosts`
        : '/api/v1/reverse-proxy/hosts';

      const hosts = await apiService.get<ReverseProxyHost[]>(
        hostname,
        endpoint,
        { errorPrefix: 'Failed to get reverse proxy hosts' }
      );

      return hosts || [];
    } catch (error) {
      console.error('Failed to get reverse proxy hosts:', error);
      throw error;
    }
  }

  /**
   * Get specific reverse proxy host
   * 
   * @param hostname - The hostname identifier for the target server
   * @param reverseProxyHostId - The reverse proxy host ID
   * @param hostId - Optional orchestrator host ID (for orchestrator endpoints)
   * @returns Reverse proxy host details
   * @throws ApiError
   */
  async getReverseProxyHost(hostname: string, reverseProxyHostId: string, hostId?: string): Promise<ReverseProxyHost> {
    try {
      const endpoint = hostId
        ? `/api/v1/orchestrator/hosts/${hostId}/reverse-proxy/hosts/${reverseProxyHostId}`
        : `/api/v1/reverse-proxy/hosts/${reverseProxyHostId}`;

      const host = await apiService.get<ReverseProxyHost>(
        hostname,
        endpoint,
        { errorPrefix: 'Failed to get reverse proxy host' }
      );

      return host;
    } catch (error) {
      console.error('Failed to get reverse proxy host:', error);
      throw error;
    }
  }

  /**
   * Create reverse proxy host
   * 
   * @param hostname - The hostname identifier for the target server
   * @param hostConfig - The reverse proxy host configuration
   * @param hostId - Optional orchestrator host ID (for orchestrator endpoints)
   * @returns Created reverse proxy host
   * @throws ApiError
   */
  async createReverseProxyHost(hostname: string, hostConfig: Partial<ReverseProxyHost>, hostId?: string): Promise<ReverseProxyHost> {
    try {
      const endpoint = hostId
        ? `/api/v1/orchestrator/hosts/${hostId}/reverse-proxy/hosts`
        : '/api/v1/reverse-proxy/hosts';

      const host = await apiService.post<ReverseProxyHost>(
        hostname,
        endpoint,
        hostConfig,
        { errorPrefix: 'Failed to create reverse proxy host' }
      );

      return host;
    } catch (error) {
      console.error('Failed to create reverse proxy host:', error);
      throw error;
    }
  }

  /**
   * Update reverse proxy host
   * 
   * @param hostname - The hostname identifier for the target server
   * @param reverseProxyHostId - The reverse proxy host ID
   * @param hostConfig - The reverse proxy host configuration
   * @param hostId - Optional orchestrator host ID (for orchestrator endpoints)
   * @returns Updated reverse proxy host
   * @throws ApiError
   */
  async updateReverseProxyHost(hostname: string, reverseProxyHostId: string, hostConfig: Partial<ReverseProxyHost>, hostId?: string): Promise<ReverseProxyHost> {
    try {
      const endpoint = hostId
        ? `/api/v1/orchestrator/hosts/${hostId}/reverse-proxy/hosts/${reverseProxyHostId}`
        : `/api/v1/reverse-proxy/hosts/${reverseProxyHostId}`;

      const host = await apiService.put<ReverseProxyHost>(
        hostname,
        endpoint,
        hostConfig,
        { errorPrefix: 'Failed to update reverse proxy host' }
      );

      return host;
    } catch (error) {
      console.error('Failed to update reverse proxy host:', error);
      throw error;
    }
  }

  /**
   * Delete reverse proxy host
   * 
   * @param hostname - The hostname identifier for the target server
   * @param reverseProxyHostId - The reverse proxy host ID
   * @param hostId - Optional orchestrator host ID (for orchestrator endpoints)
   * @returns Success status
   * @throws ApiError
   */
  async deleteReverseProxyHost(hostname: string, reverseProxyHostId: string, hostId?: string): Promise<boolean> {
    try {
      const endpoint = hostId
        ? `/api/v1/orchestrator/hosts/${hostId}/reverse-proxy/hosts/${reverseProxyHostId}`
        : `/api/v1/reverse-proxy/hosts/${reverseProxyHostId}`;

      await apiService.delete(
        hostname,
        endpoint,
        { errorPrefix: 'Failed to delete reverse proxy host' }
      );

      return true;
    } catch (error) {
      console.error('Failed to delete reverse proxy host:', error);
      throw error;
    }
  }

  /**
   * Create or update HTTP route for reverse proxy host
   * 
   * @param hostname - The hostname identifier for the target server
   * @param reverseProxyHostId - The reverse proxy host ID
   * @param route - The HTTP route configuration
   * @param hostId - Optional orchestrator host ID (for orchestrator endpoints)
   * @returns Created/updated route
   * @throws ApiError
   */
  async upsertHttpRoute(hostname: string, reverseProxyHostId: string, route: Partial<ReverseProxyHostHttpRoute>, hostId?: string): Promise<ReverseProxyHostHttpRoute> {
    try {
      const endpoint = hostId
        ? `/api/v1/orchestrator/hosts/${hostId}/reverse-proxy/hosts/${reverseProxyHostId}/http_routes`
        : `/api/v1/reverse-proxy/hosts/${reverseProxyHostId}/http_routes`;

      const createdRoute = await apiService.post<ReverseProxyHostHttpRoute>(
        hostname,
        endpoint,
        route,
        { errorPrefix: 'Failed to create/update HTTP route' }
      );

      return createdRoute;
    } catch (error) {
      console.error('Failed to create/update HTTP route:', error);
      throw error;
    }
  }

  /**
   * Delete HTTP route from reverse proxy host
   * 
   * @param hostname - The hostname identifier for the target server
   * @param reverseProxyHostId - The reverse proxy host ID
   * @param routeId - The HTTP route ID
   * @param hostId - Optional orchestrator host ID (for orchestrator endpoints)
   * @returns Success status
   * @throws ApiError
   */
  async deleteHttpRoute(hostname: string, reverseProxyHostId: string, routeId: string, hostId?: string): Promise<boolean> {
    try {
      const endpoint = hostId
        ? `/api/v1/orchestrator/hosts/${hostId}/reverse-proxy/hosts/${reverseProxyHostId}/http_routes/${routeId}`
        : `/api/v1/reverse-proxy/hosts/${reverseProxyHostId}/http_routes/${routeId}`;

      await apiService.delete(
        hostname,
        endpoint,
        { errorPrefix: 'Failed to delete HTTP route' }
      );

      return true;
    } catch (error) {
      console.error('Failed to delete HTTP route:', error);
      throw error;
    }
  }

  /**
   * Create or update TCP route for reverse proxy host
   * 
   * @param hostname - The hostname identifier for the target server
   * @param reverseProxyHostId - The reverse proxy host ID
   * @param route - The TCP route configuration
   * @param hostId - Optional orchestrator host ID (for orchestrator endpoints)
   * @returns Created/updated route
   * @throws ApiError
   */
  async upsertTcpRoute(hostname: string, reverseProxyHostId: string, route: Partial<ReverseProxyHostTcpRoute>, hostId?: string): Promise<ReverseProxyHostTcpRoute> {
    try {
      const endpoint = hostId
        ? `/api/v1/orchestrator/hosts/${hostId}/reverse-proxy/hosts/${reverseProxyHostId}/tcp_route`
        : `/api/v1/reverse-proxy/hosts/${reverseProxyHostId}/tcp_route`;

      const createdRoute = await apiService.post<ReverseProxyHostTcpRoute>(
        hostname,
        endpoint,
        route,
        { errorPrefix: 'Failed to create/update TCP route' }
      );

      return createdRoute;
    } catch (error) {
      console.error('Failed to create/update TCP route:', error);
      throw error;
    }
  }
}

export const reverseProxyService = new ReverseProxyService();
export default reverseProxyService;
