import { apiService } from '../api';
import { DevOpsApiKey, DevOpsApiKeyCreateRequest, DevOpsApiKeyCreateResponse } from '../../interfaces/devops';
import { authService } from '../authService';

class ApiKeysService {
  async getApiKeys(hostname: string): Promise<DevOpsApiKey[]> {
    const target = hostname || authService.currentHostname;
    if (!target) throw new Error('No hostname provided');
    const result = await apiService.get<DevOpsApiKey[]>(target, '/api/v1/auth/api_keys', {
      errorPrefix: 'Failed to get API keys',
    });
    return result ?? [];
  }

  async createApiKey(hostname: string, request: DevOpsApiKeyCreateRequest): Promise<DevOpsApiKeyCreateResponse> {
    const target = hostname || authService.currentHostname;
    if (!target) throw new Error('No hostname provided');
    return apiService.post<DevOpsApiKeyCreateResponse>(target, '/api/v1/auth/api_keys', request, {
      errorPrefix: 'Failed to create API key',
    });
  }

  async deleteApiKey(hostname: string, id: string): Promise<void> {
    const target = hostname || authService.currentHostname;
    if (!target) throw new Error('No hostname provided');
    await apiService.delete(target, `/api/v1/auth/api_keys/${id}`, {
      errorPrefix: `Failed to delete API key ${id}`,
    });
  }
}

export const apiKeysService = new ApiKeysService();
export default apiKeysService;
