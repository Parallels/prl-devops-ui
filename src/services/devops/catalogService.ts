import { apiService } from '../api';
import { CatalogManifestItem } from '../../interfaces/devops';

/**
 * Catalog Service - Handles catalog-related operations for Parallels DevOps API
 * Manages catalog manifests, versioning, permissions, and metadata
 */
class CatalogService {
  /**
   * Get all catalog manifests from DevOps API
   * 
   * @param hostname - The hostname identifier for the target server
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
   * Remove a catalog manifest
   * 
   * @param hostname - The hostname identifier for the target server
   * @param manifestId - Catalog manifest ID
   * @param versionId - Optional version ID to remove specific version
   * @returns true if successful
   * @throws ApiError
   */
  async removeCatalogManifest(
    hostname: string,
    manifestId: string,
    versionId?: string
  ): Promise<boolean> {
    try {
      const endpoint = versionId 
        ? `/api/v1/catalog/${manifestId}/${versionId}`
        : `/api/v1/catalog/${manifestId}`;

      await apiService.delete(
        hostname,
        endpoint,
        { errorPrefix: `Failed to remove catalog manifest ${manifestId}` }
      );

      return true;
    } catch (error) {
      console.error(`Failed to remove catalog manifest ${manifestId}:`, error);
      throw error;
    }
  }

  /**
   * Taint a catalog manifest version (mark as problematic)
   * 
   * @param hostname - The hostname identifier for the target server
   * @param manifestId - Catalog manifest ID
   * @param versionId - Version ID
   * @param architecture - Architecture (e.g., 'arm64', 'amd64')
   * @returns true if successful
   * @throws ApiError
   */
  async taintCatalogManifest(
    hostname: string,
    manifestId: string,
    versionId: string,
    architecture: string
  ): Promise<boolean> {
    try {
      if (!versionId || !architecture) {
        throw new Error('Version and architecture are required');
      }

      await apiService.patch(
        hostname,
        `/api/v1/catalog/${manifestId}/${versionId}/${architecture}/taint`,
        undefined,
        { errorPrefix: `Failed to taint catalog manifest ${manifestId}` }
      );

      return true;
    } catch (error) {
      console.error(`Failed to taint catalog manifest ${manifestId}:`, error);
      throw error;
    }
  }

  /**
   * Untaint a catalog manifest version (remove problematic mark)
   * 
   * @param hostname - The hostname identifier for the target server
   * @param manifestId - Catalog manifest ID
   * @param versionId - Version ID
   * @param architecture - Architecture (e.g., 'arm64', 'amd64')
   * @returns true if successful
   * @throws ApiError
   */
  async untaintCatalogManifest(
    hostname: string,
    manifestId: string,
    versionId: string,
    architecture: string
  ): Promise<boolean> {
    try {
      if (!versionId || !architecture) {
        throw new Error('Version and architecture are required');
      }

      await apiService.patch(
        hostname,
        `/api/v1/catalog/${manifestId}/${versionId}/${architecture}/untaint`,
        undefined,
        { errorPrefix: `Failed to untaint catalog manifest ${manifestId}` }
      );

      return true;
    } catch (error) {
      console.error(`Failed to untaint catalog manifest ${manifestId}:`, error);
      throw error;
    }
  }

  /**
   * Revoke a catalog manifest version (disable access)
   * 
   * @param hostname - The hostname identifier for the target server
   * @param manifestId - Catalog manifest ID
   * @param versionId - Version ID
   * @param architecture - Architecture (e.g., 'arm64', 'amd64')
   * @returns true if successful
   * @throws ApiError
   */
  async revokeCatalogManifest(
    hostname: string,
    manifestId: string,
    versionId: string,
    architecture: string
  ): Promise<boolean> {
    try {
      if (!versionId || !architecture) {
        throw new Error('Version and architecture are required');
      }

      await apiService.patch(
        hostname,
        `/api/v1/catalog/${manifestId}/${versionId}/${architecture}/revoke`,
        undefined,
        { errorPrefix: `Failed to revoke catalog manifest ${manifestId}` }
      );

      return true;
    } catch (error) {
      console.error(`Failed to revoke catalog manifest ${manifestId}:`, error);
      throw error;
    }
  }

  /**
   * Add required roles to a catalog manifest
   * 
   * @param hostname - The hostname identifier for the target server
   * @param manifestId - Catalog manifest ID
   * @param versionId - Version ID
   * @param architecture - Architecture (e.g., 'arm64', 'amd64')
   * @param roles - Array of role names to add
   * @returns true if successful
   * @throws ApiError
   */
  async addCatalogManifestRoles(
    hostname: string,
    manifestId: string,
    versionId: string,
    architecture: string,
    roles: string[]
  ): Promise<boolean> {
    try {
      if (!versionId || !architecture) {
        throw new Error('Version and architecture are required');
      }

      await apiService.patch(
        hostname,
        `/api/v1/catalog/${manifestId}/${versionId}/${architecture}/roles`,
        { required_roles: roles },
        { errorPrefix: `Failed to add roles to catalog manifest ${manifestId}` }
      );

      return true;
    } catch (error) {
      console.error(`Failed to add roles to catalog manifest ${manifestId}:`, error);
      throw error;
    }
  }

  /**
   * Remove required roles from a catalog manifest
   * 
   * @param hostname - The hostname identifier for the target server
   * @param manifestId - Catalog manifest ID
   * @param versionId - Version ID
   * @param architecture - Architecture (e.g., 'arm64', 'amd64')
   * @param roles - Array of role names to remove
   * @returns true if successful
   * @throws ApiError
   */
  async removeCatalogManifestRoles(
    hostname: string,
    manifestId: string,
    versionId: string,
    architecture: string,
    roles: string[]
  ): Promise<boolean> {
    try {
      if (!versionId || !architecture) {
        throw new Error('Version and architecture are required');
      }

      await apiService.request(
        hostname,
        `/api/v1/catalog/${manifestId}/${versionId}/${architecture}/roles`,
        {
          method: 'DELETE',
          body: JSON.stringify({ required_roles: roles }),
          headers: { 'Content-Type': 'application/json' }
        },
        { errorPrefix: `Failed to remove roles from catalog manifest ${manifestId}` }
      );

      return true;
    } catch (error) {
      console.error(`Failed to remove roles from catalog manifest ${manifestId}:`, error);
      throw error;
    }
  }

  /**
   * Add required claims to a catalog manifest
   * 
   * @param hostname - The hostname identifier for the target server
   * @param manifestId - Catalog manifest ID
   * @param versionId - Version ID
   * @param architecture - Architecture (e.g., 'arm64', 'amd64')
   * @param claims - Array of claim names to add
   * @returns true if successful
   * @throws ApiError
   */
  async addCatalogManifestClaims(
    hostname: string,
    manifestId: string,
    versionId: string,
    architecture: string,
    claims: string[]
  ): Promise<boolean> {
    try {
      if (!versionId || !architecture) {
        throw new Error('Version and architecture are required');
      }

      await apiService.patch(
        hostname,
        `/api/v1/catalog/${manifestId}/${versionId}/${architecture}/claims`,
        { required_claims: claims },
        { errorPrefix: `Failed to add claims to catalog manifest ${manifestId}` }
      );

      return true;
    } catch (error) {
      console.error(`Failed to add claims to catalog manifest ${manifestId}:`, error);
      throw error;
    }
  }

  /**
   * Remove required claims from a catalog manifest
   * 
   * @param hostname - The hostname identifier for the target server
   * @param manifestId - Catalog manifest ID
   * @param versionId - Version ID
   * @param architecture - Architecture (e.g., 'arm64', 'amd64')
   * @param claims - Array of claim names to remove
   * @returns true if successful
   * @throws ApiError
   */
  async removeCatalogManifestClaims(
    hostname: string,
    manifestId: string,
    versionId: string,
    architecture: string,
    claims: string[]
  ): Promise<boolean> {
    try {
      if (!versionId || !architecture) {
        throw new Error('Version and architecture are required');
      }

      await apiService.request(
        hostname,
        `/api/v1/catalog/${manifestId}/${versionId}/${architecture}/claims`,
        {
          method: 'DELETE',
          body: JSON.stringify({ required_claims: claims }),
          headers: { 'Content-Type': 'application/json' }
        },
        { errorPrefix: `Failed to remove claims from catalog manifest ${manifestId}` }
      );

      return true;
    } catch (error) {
      console.error(`Failed to remove claims from catalog manifest ${manifestId}:`, error);
      throw error;
    }
  }

  /**
   * Add tags to a catalog manifest
   * 
   * @param hostname - The hostname identifier for the target server
   * @param manifestId - Catalog manifest ID
   * @param versionId - Version ID
   * @param architecture - Architecture (e.g., 'arm64', 'amd64')
   * @param tags - Array of tags to add
   * @returns true if successful
   * @throws ApiError
   */
  async addCatalogManifestTags(
    hostname: string,
    manifestId: string,
    versionId: string,
    architecture: string,
    tags: string[]
  ): Promise<boolean> {
    try {
      if (!versionId || !architecture) {
        throw new Error('Version and architecture are required');
      }

      await apiService.patch(
        hostname,
        `/api/v1/catalog/${manifestId}/${versionId}/${architecture}/tags`,
        { tags },
        { errorPrefix: `Failed to add tags to catalog manifest ${manifestId}` }
      );

      return true;
    } catch (error) {
      console.error(`Failed to add tags to catalog manifest ${manifestId}:`, error);
      throw error;
    }
  }

  /**
   * Remove tags from a catalog manifest
   * 
   * @param hostname - The hostname identifier for the target server
   * @param manifestId - Catalog manifest ID
   * @param versionId - Version ID
   * @param architecture - Architecture (e.g., 'arm64', 'amd64')
   * @param tags - Array of tags to remove
   * @returns true if successful
   * @throws ApiError
   */
  async removeCatalogManifestTags(
    hostname: string,
    manifestId: string,
    versionId: string,
    architecture: string,
    tags: string[]
  ): Promise<boolean> {
    try {
      if (!versionId || !architecture) {
        throw new Error('Version and architecture are required');
      }

      await apiService.request(
        hostname,
        `/api/v1/catalog/${manifestId}/${versionId}/${architecture}/tags`,
        {
          method: 'DELETE',
          body: JSON.stringify({ tags }),
          headers: { 'Content-Type': 'application/json' }
        },
        { errorPrefix: `Failed to remove tags from catalog manifest ${manifestId}` }
      );

      return true;
    } catch (error) {
      console.error(`Failed to remove tags from catalog manifest ${manifestId}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const catalogService = new CatalogService();
export default catalogService;
