import { apiService } from '../api';
import { CatalogManager, CatalogManagerCreateRequest, CatalogManagerUpdateRequest } from '@/interfaces/CatalogManager';
import { CatalogManifestItem, CatalogPullRequest, CatalogPushRequest } from '@/interfaces/devops';
/**
 * Catalog Manager Service - Handles catalog manager operations
 */
class CatalogManagerService {
  private getCatalogBasePath(catalogManagerId: string): string {
    if (!catalogManagerId) {
      throw new Error('Catalog Manager ID is required');
    }
    return `/api/v1/catalog-managers/${catalogManagerId}/catalog`;
  }

  /**
   * Get all catalog managers from remote host
   * 
   * @param hostname - The hostname identifier for the target server
   * @returns Array of catalog managers or undefined
   * @throws ApiError
   */
  async getCatalogManagers(hostname: string): Promise<CatalogManager[] | undefined> {
    try {
      const catalogManagers = await apiService.get<CatalogManager[]>(
        hostname,
        '/api/v1/catalog-managers',
        { errorPrefix: 'Failed to get catalog managers' }
      );

      return catalogManagers;
    } catch (error) {
      console.error('Failed to get catalog managers:', error);
      throw error;
    }
  }

  /**
   * Get a specific catalog manager by ID
   * 
   * @param hostname - The hostname identifier for the target server
   * @param id - The ID of the catalog manager to retrieve
   * @returns Catalog manager or undefined
   */
  async getCatalogManager(hostname: string, id: string): Promise<CatalogManager | undefined> {
    try {
      if (!id) {
        throw new Error('Catalog Manager ID is required');
      }
      const response = await apiService.get<CatalogManager>(
        hostname,
        `/api/v1/catalog-managers/${id}`,
        { errorPrefix: 'Failed to get catalog manager' }
      );

      return response;
    } catch (error) {
      console.error('Failed to get catalog manager:', error);
      // Don't throw - version is optional
      return undefined;
    }
  }

  /**
   * Update a specific catalog manager by ID
   * 
   * @param hostname - The hostname identifier for the target server
   * @param id - The ID of the catalog manager to update
   * @param catalogManager - The catalog manager object to update
   * @returns true if update was successful
   */
  async updateCatalogManager(hostname: string, id: string, catalogManager: CatalogManagerUpdateRequest): Promise<boolean> {
    try {
      await apiService.put(
        hostname,
        `/api/v1/catalog-managers/${id}`,
        catalogManager,
        { errorPrefix: 'Failed to update catalog manager' }
      );

      return true;
    } catch (error) {
      console.error('Failed to update catalog manager:', error);
      return false;
    }
  }

  /**
   * Create a new catalog manager
   * 
   * @param hostname - The hostname identifier for the target server
   * @param catalogManager - The catalog manager object to create
   * @returns true if creation was successful
   */
  async createCatalogManager(hostname: string, catalogManager: CatalogManagerCreateRequest): Promise<boolean> {
    try {
      await apiService.post(
        hostname,
        '/api/v1/catalog-managers',
        catalogManager,
        { errorPrefix: 'Failed to create catalog manager' }
      );

      return true;
    } catch (error) {
      console.error('Failed to create catalog manager:', error);
      return false;
    }
  }

  /**
   * Delete a specific catalog manager by ID
   * 
   * @param hostname - The hostname identifier for the target server
   * @param id - The ID of the catalog manager to delete
   * @returns true if deletion was successful
   */
  async deleteCatalogManager(hostname: string, id: string): Promise<boolean> {
    try {
      await apiService.delete(
        hostname,
        `/api/v1/catalog-managers/${id}`,
        { errorPrefix: 'Failed to delete catalog manager' }
      );

      return true;
    } catch (error) {
      console.error('Failed to delete catalog manager:', error);
      return false;
    }
  }

  /**
   * Push (upload) a local VM to the catalog via a specific catalog manager.
   *
   * Endpoint: POST /api/v1/catalog-managers/:id/catalog/push
   */
  async pushCatalog(hostname: string, catalogManagerId: string, request: CatalogPushRequest): Promise<void> {
    try {
      const base = this.getCatalogBasePath(catalogManagerId);
      await apiService.post<void>(
        hostname,
        `${base}/push`,
        request,
        { errorPrefix: 'Failed to push catalog via manager', expectNoContent: true }
      );
    } catch (error) {
      console.error('Failed to push catalog via manager:', error);
      throw error;
    }
  }

  /**
   * Pull (download) a catalog manifest to the local host via a specific catalog manager.
   *
   * Endpoint: POST /api/v1/catalog-managers/:id/catalog/pull
   */
  async pullCatalog(hostname: string, catalogManagerId: string, request: CatalogPullRequest): Promise<void> {
    try {
      const base = this.getCatalogBasePath(catalogManagerId);
      await apiService.post<void>(
        hostname,
        `${base}/pull`,
        request,
        { errorPrefix: 'Failed to pull catalog via manager', expectNoContent: true }
      );
    } catch (error) {
      console.error('Failed to pull catalog via manager:', error);
      throw error;
    }
  }

  /**
   * Push (upload) a local VM to the catalog via a specific catalog manager asynchronously.
   *
   * Endpoint: POST /api/v1/catalog-managers/:id/catalog/push/async
   */
  async pushCatalogAsync(hostname: string, catalogManagerId: string, request: CatalogPushRequest): Promise<void> {
    try {
      const base = this.getCatalogBasePath(catalogManagerId);
      await apiService.post<void>(
        hostname,
        `${base}/push/async`,
        request,
        { errorPrefix: 'Failed to push catalog async via manager', expectNoContent: true }
      );
    } catch (error) {
      console.error('Failed to push catalog async via manager:', error);
      throw error;
    }
  }

  /**
   * Pull (download) a catalog manifest via a specific catalog manager asynchronously.
   *
   * Endpoint: POST /api/v1/catalog-managers/:id/catalog/pull/async
   */
  async pullCatalogAsync(hostname: string, catalogManagerId: string, request: CatalogPullRequest): Promise<void> {
    try {
      const base = this.getCatalogBasePath(catalogManagerId);
      await apiService.post<void>(
        hostname,
        `${base}/pull/async`,
        request,
        { errorPrefix: 'Failed to pull catalog async via manager', expectNoContent: true }
      );
    } catch (error) {
      console.error('Failed to pull catalog async via manager:', error);
      throw error;
    }
  }

  /**
   * Get all catalog manifests through a specific catalog manager
   */
  async getCatalogManifests(hostname: string, catalogManagerId: string): Promise<CatalogManifestItem[]> {
    try {
      const endpoint = this.getCatalogBasePath(catalogManagerId);
      const manifests = await apiService.get<unknown[]>(
        hostname,
        endpoint,
        { errorPrefix: 'Failed to get catalog manifests from manager' }
      );

      const items: CatalogManifestItem[] = [];
      for (const manifest of manifests) {
        const manifestKey = Object.keys(manifest as object)[0];
        const item: CatalogManifestItem = {
          name: manifestKey,
          description: '',
          items: (manifest as Record<string, unknown>)[manifestKey] as never[] || []
        };

        if (item.items.length > 0 && item.items[0].description) {
          item.description = item.items[0].description;
        }

        items.push(item);
      }

      return items;
    } catch (error) {
      console.error('Failed to get catalog manifests from manager:', error);
      throw error;
    }
  }

  /**
   * Remove a catalog manifest through a specific catalog manager
   */
  async removeCatalogManifest(
    hostname: string,
    catalogManagerId: string,
    manifestId: string,
    versionId?: string
  ): Promise<boolean> {
    try {
      const base = this.getCatalogBasePath(catalogManagerId);
      const endpoint = versionId
        ? `${base}/${manifestId}/${versionId}`
        : `${base}/${manifestId}`;

      await apiService.delete(
        hostname,
        endpoint,
        { errorPrefix: `Failed to remove catalog manifest ${manifestId} from manager` }
      );

      return true;
    } catch (error) {
      console.error(`Failed to remove catalog manifest ${manifestId} from manager:`, error);
      throw error;
    }
  }

  async taintCatalogManifest(
    hostname: string,
    catalogManagerId: string,
    manifestId: string,
    versionId: string,
    architecture: string
  ): Promise<boolean> {
    try {
      if (!versionId || !architecture) {
        throw new Error('Version and architecture are required');
      }

      const base = this.getCatalogBasePath(catalogManagerId);
      await apiService.patch(
        hostname,
        `${base}/${manifestId}/${versionId}/${architecture}/taint`,
        undefined,
        { errorPrefix: `Failed to taint catalog manifest ${manifestId} in manager` }
      );

      return true;
    } catch (error) {
      console.error(`Failed to taint catalog manifest ${manifestId} in manager:`, error);
      throw error;
    }
  }

  async untaintCatalogManifest(
    hostname: string,
    catalogManagerId: string,
    manifestId: string,
    versionId: string,
    architecture: string
  ): Promise<boolean> {
    try {
      if (!versionId || !architecture) {
        throw new Error('Version and architecture are required');
      }

      const base = this.getCatalogBasePath(catalogManagerId);
      await apiService.patch(
        hostname,
        `${base}/${manifestId}/${versionId}/${architecture}/untaint`,
        undefined,
        { errorPrefix: `Failed to untaint catalog manifest ${manifestId} in manager` }
      );

      return true;
    } catch (error) {
      console.error(`Failed to untaint catalog manifest ${manifestId} in manager:`, error);
      throw error;
    }
  }

  async revokeCatalogManifest(
    hostname: string,
    catalogManagerId: string,
    manifestId: string,
    versionId: string,
    architecture: string
  ): Promise<boolean> {
    try {
      if (!versionId || !architecture) {
        throw new Error('Version and architecture are required');
      }

      const base = this.getCatalogBasePath(catalogManagerId);
      await apiService.patch(
        hostname,
        `${base}/${manifestId}/${versionId}/${architecture}/revoke`,
        undefined,
        { errorPrefix: `Failed to revoke catalog manifest ${manifestId} in manager` }
      );

      return true;
    } catch (error) {
      console.error(`Failed to revoke catalog manifest ${manifestId} in manager:`, error);
      throw error;
    }
  }

  async addCatalogManifestRoles(
    hostname: string,
    catalogManagerId: string,
    manifestId: string,
    versionId: string,
    architecture: string,
    roles: string[]
  ): Promise<boolean> {
    try {
      if (!versionId || !architecture) {
        throw new Error('Version and architecture are required');
      }

      const base = this.getCatalogBasePath(catalogManagerId);
      await apiService.patch(
        hostname,
        `${base}/${manifestId}/${versionId}/${architecture}/roles`,
        { required_roles: roles },
        { errorPrefix: `Failed to add roles to catalog manifest ${manifestId} in manager` }
      );

      return true;
    } catch (error) {
      console.error(`Failed to add roles to catalog manifest ${manifestId} in manager:`, error);
      throw error;
    }
  }

  async removeCatalogManifestRoles(
    hostname: string,
    catalogManagerId: string,
    manifestId: string,
    versionId: string,
    architecture: string,
    roles: string[]
  ): Promise<boolean> {
    try {
      if (!versionId || !architecture) {
        throw new Error('Version and architecture are required');
      }

      const base = this.getCatalogBasePath(catalogManagerId);
      await apiService.request(
        hostname,
        `${base}/${manifestId}/${versionId}/${architecture}/roles`,
        {
          method: 'DELETE',
          body: JSON.stringify({ required_roles: roles }),
          headers: { 'Content-Type': 'application/json' },
          errorPrefix: `Failed to remove roles from catalog manifest ${manifestId} in manager`
        }
      );

      return true;
    } catch (error) {
      console.error(`Failed to remove roles from catalog manifest ${manifestId} in manager:`, error);
      throw error;
    }
  }

  async addCatalogManifestClaims(
    hostname: string,
    catalogManagerId: string,
    manifestId: string,
    versionId: string,
    architecture: string,
    claims: string[]
  ): Promise<boolean> {
    try {
      if (!versionId || !architecture) {
        throw new Error('Version and architecture are required');
      }

      const base = this.getCatalogBasePath(catalogManagerId);
      await apiService.patch(
        hostname,
        `${base}/${manifestId}/${versionId}/${architecture}/claims`,
        { required_claims: claims },
        { errorPrefix: `Failed to add claims to catalog manifest ${manifestId} in manager` }
      );

      return true;
    } catch (error) {
      console.error(`Failed to add claims to catalog manifest ${manifestId} in manager:`, error);
      throw error;
    }
  }

  async removeCatalogManifestClaims(
    hostname: string,
    catalogManagerId: string,
    manifestId: string,
    versionId: string,
    architecture: string,
    claims: string[]
  ): Promise<boolean> {
    try {
      if (!versionId || !architecture) {
        throw new Error('Version and architecture are required');
      }

      const base = this.getCatalogBasePath(catalogManagerId);
      await apiService.request(
        hostname,
        `${base}/${manifestId}/${versionId}/${architecture}/claims`,
        {
          method: 'DELETE',
          body: JSON.stringify({ required_claims: claims }),
          headers: { 'Content-Type': 'application/json' },
          errorPrefix: `Failed to remove claims from catalog manifest ${manifestId} in manager`
        }
      );

      return true;
    } catch (error) {
      console.error(`Failed to remove claims from catalog manifest ${manifestId} in manager:`, error);
      throw error;
    }
  }

  async addCatalogManifestTags(
    hostname: string,
    catalogManagerId: string,
    manifestId: string,
    versionId: string,
    architecture: string,
    tags: string[]
  ): Promise<boolean> {
    try {
      if (!versionId || !architecture) {
        throw new Error('Version and architecture are required');
      }

      const base = this.getCatalogBasePath(catalogManagerId);
      await apiService.patch(
        hostname,
        `${base}/${manifestId}/${versionId}/${architecture}/tags`,
        { tags },
        { errorPrefix: `Failed to add tags to catalog manifest ${manifestId} in manager` }
      );

      return true;
    } catch (error) {
      console.error(`Failed to add tags to catalog manifest ${manifestId} in manager:`, error);
      throw error;
    }
  }

  async removeCatalogManifestTags(
    hostname: string,
    catalogManagerId: string,
    manifestId: string,
    versionId: string,
    architecture: string,
    tags: string[]
  ): Promise<boolean> {
    try {
      if (!versionId || !architecture) {
        throw new Error('Version and architecture are required');
      }

      const base = this.getCatalogBasePath(catalogManagerId);
      await apiService.request(
        hostname,
        `${base}/${manifestId}/${versionId}/${architecture}/tags`,
        {
          method: 'DELETE',
          body: JSON.stringify({ tags }),
          headers: { 'Content-Type': 'application/json' },
          errorPrefix: `Failed to remove tags from catalog manifest ${manifestId} in manager`
        }
      );

      return true;
    } catch (error) {
      console.error(`Failed to remove tags from catalog manifest ${manifestId} in manager:`, error);
      throw error;
    }
  }

  /**
   * Update the metadata (description) of a specific catalog manifest item via a catalog manager
   *
   * Endpoint: PUT /api/v1/catalog-managers/{managerId}/catalog/{manifestId}/{version}/{architecture}/metadata
   */
  async updateCatalogManifestDescription(
    hostname: string,
    managerId: string,
    manifestId: string,
    versionId: string,
    architecture: string,
    description: string
  ): Promise<boolean> {
    try {
      const base = this.getCatalogBasePath(managerId);
      await apiService.put(
        hostname,
        `${base}/${manifestId}/${versionId}/${architecture}/metadata`,
        { description },
        { errorPrefix: `Failed to update metadata for catalog manifest ${manifestId}` }
      );
      return true;
    } catch (error) {
      console.error(`Failed to update metadata for catalog manifest ${manifestId}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const catalogManagerService = new CatalogManagerService();
export default catalogManagerService;
