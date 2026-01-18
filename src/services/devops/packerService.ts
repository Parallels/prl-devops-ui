import { apiService } from '../api';

/**
 * Packer Template Addon
 */
export interface PackerTemplateAddon {
  name?: string;
  version?: string;
  [key: string]: unknown;
}

/**
 * Packer Template Request/Response
 */
export interface PackerTemplate {
  id?: string;
  name?: string;
  description?: string;
  packer_folder?: string;
  internal?: boolean;
  created_at?: string;
  updated_at?: string;
  addons?: PackerTemplateAddon[];
  defaults?: Record<string, string>;
  variables?: Record<string, string>;
  specs?: Record<string, string>;
  required_roles?: string[];
  required_claims?: string[];
}

/**
 * Create Packer Template Request
 */
export interface CreatePackerTemplateRequest {
  name: string;
  description?: string;
  packer_folder?: string;
  internal?: boolean;
  addons?: PackerTemplateAddon[];
  defaults?: Record<string, string>;
  variables?: Record<string, string>;
  specs?: Record<string, string>;
  required_roles?: string[];
  required_claims?: string[];
}

/**
 * Update Packer Template Request
 */
export interface UpdatePackerTemplateRequest {
  name?: string;
  description?: string;
  packer_folder?: string;
  internal?: boolean;
  addons?: PackerTemplateAddon[];
  defaults?: Record<string, string>;
  variables?: Record<string, string>;
  specs?: Record<string, string>;
  required_roles?: string[];
  required_claims?: string[];
}

/**
 * Packer Service - Handles Packer template operations for Parallels DevOps API
 * Manages Packer template CRUD operations
 */
class PackerService {
  /**
   * Get all packer templates
   * 
   * @param hostname - The hostname identifier for the target server
   * @returns Array of packer templates
   * @throws ApiError
   */
  async getPackerTemplates(hostname: string): Promise<PackerTemplate[]> {
    try {
      const templates = await apiService.get<PackerTemplate[]>(
        hostname,
        '/api/v1/templates/packer',
        { errorPrefix: 'Failed to get packer templates' }
      );

      return templates || [];
    } catch (error) {
      console.error('Failed to get packer templates:', error);
      throw error;
    }
  }

  /**
   * Get a specific packer template by ID or name
   * 
   * @param hostname - The hostname identifier for the target server
   * @param idOrName - The template ID or name
   * @returns Packer template details
   * @throws ApiError
   */
  async getPackerTemplate(hostname: string, idOrName: string): Promise<PackerTemplate> {
    try {
      const template = await apiService.get<PackerTemplate>(
        hostname,
        `/api/v1/templates/packer/${idOrName}`,
        { errorPrefix: 'Failed to get packer template' }
      );

      return template;
    } catch (error) {
      console.error('Failed to get packer template:', error);
      throw error;
    }
  }

  /**
   * Create a new packer template
   * 
   * @param hostname - The hostname identifier for the target server
   * @param template - The packer template data
   * @returns Created packer template
   * @throws ApiError
   */
  async createPackerTemplate(hostname: string, template: CreatePackerTemplateRequest): Promise<PackerTemplate> {
    try {
      const createdTemplate = await apiService.post<PackerTemplate>(
        hostname,
        '/api/v1/templates/packer',
        template,
        { errorPrefix: 'Failed to create packer template' }
      );

      return createdTemplate;
    } catch (error) {
      console.error('Failed to create packer template:', error);
      throw error;
    }
  }

  /**
   * Update an existing packer template
   * 
   * @param hostname - The hostname identifier for the target server
   * @param idOrName - The template ID or name
   * @param template - The packer template update data
   * @returns Updated packer template
   * @throws ApiError
   */
  async updatePackerTemplate(hostname: string, idOrName: string, template: UpdatePackerTemplateRequest): Promise<PackerTemplate> {
    try {
      const updatedTemplate = await apiService.put<PackerTemplate>(
        hostname,
        `/api/v1/templates/packer/${idOrName}`,
        template,
        { errorPrefix: 'Failed to update packer template' }
      );

      return updatedTemplate;
    } catch (error) {
      console.error('Failed to update packer template:', error);
      throw error;
    }
  }

  /**
   * Delete a packer template
   * 
   * @param hostname - The hostname identifier for the target server
   * @param idOrName - The template ID or name
   * @returns Success status
   * @throws ApiError
   */
  async deletePackerTemplate(hostname: string, idOrName: string): Promise<boolean> {
    try {
      await apiService.delete(
        hostname,
        `/api/v1/templates/packer/${idOrName}`,
        { errorPrefix: 'Failed to delete packer template' }
      );

      return true;
    } catch (error) {
      console.error('Failed to delete packer template:', error);
      throw error;
    }
  }
}

export const packerService = new PackerService();
export default packerService;
