import { apiService } from '../api';

/**
 * Catalog cache manifest item
 */
interface CatalogCacheManifestItem {
  catalog_id?: string;
  version?: string;
  architecture?: string;
  size?: number;
  path?: string;
  [key: string]: unknown;
}

/**
 * Catalog cache response
 */
interface CatalogCacheResponse {
  total_size?: number;
  manifests?: CatalogCacheManifestItem[];
  [key: string]: unknown;
}

/**
 * Cache Service - Handles catalog cache operations
 * Manages catalog cache retrieval and cleanup
 */
class CacheService {
  /**
   * Get catalog cache information
   * 
   * @param hostname - The hostname identifier for the target server
   * @param hostId - Optional host ID for orchestrator mode
   * @param isOrchestrator - Whether this is an orchestrator endpoint
   * @returns Catalog cache information
   * @throws ApiError
   */
  async getCatalogCache(
    hostname: string,
    hostId?: string,
    isOrchestrator = false
  ): Promise<CatalogCacheResponse> {
    try {
      let endpoint = '/api/v1/catalog/cache';

      if (isOrchestrator) {
        if (!hostId) {
          throw new Error('Host ID is required for orchestrator mode');
        }
        endpoint = `/api/v1/orchestrator/hosts/${hostId}/catalog/cache`;
      }

      const cache = await apiService.get<CatalogCacheResponse>(
        hostname,
        endpoint,
        { errorPrefix: 'Failed to get catalog cache' }
      );

      return cache;
    } catch (error) {
      console.error('Failed to get catalog cache:', error);
      throw error;
    }
  }

  /**
   * Clear catalog cache
   * 
   * @param hostname - The hostname identifier for the target server
   * @param hostId - Optional host ID for orchestrator mode
   * @param catalogId - Optional catalog ID to clear specific catalog
   * @param versionId - Optional version ID to clear specific version
   * @param isOrchestrator - Whether this is an orchestrator endpoint
   * @returns Updated catalog cache information
   * @throws ApiError
   */
  async clearCatalogCache(
    hostname: string,
    hostId?: string,
    catalogId?: string,
    versionId?: string,
    isOrchestrator = false
  ): Promise<CatalogCacheResponse> {
    try {
      let endpoint = '/api/v1/catalog/cache';

      if (isOrchestrator) {
        if (!hostId) {
          throw new Error('Host ID is required for orchestrator mode');
        }
        endpoint = `/api/v1/orchestrator/hosts/${hostId}/catalog/cache`;
      }

      // Add catalog and version to path if provided
      if (catalogId) {
        endpoint += `/${catalogId}`;
      }
      if (versionId) {
        endpoint += `/${versionId}`;
      }

      const cache = await apiService.delete<CatalogCacheResponse>(
        hostname,
        endpoint,
        { errorPrefix: 'Failed to clear catalog cache' }
      );

      return cache;
    } catch (error) {
      console.error('Failed to clear catalog cache:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();
export default cacheService;
