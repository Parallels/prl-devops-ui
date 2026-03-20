import { apiService } from '../api';
import { authService } from '../authService';
import { ApiError } from '@/interfaces/api';

/** Backend data model — value is always a string; JSON values are JSON.stringify'd */
export interface UserConfig {
  id?: string;
  user_id?: string;
  slug: string;
  name?: string;
  type?: 'string' | 'bool' | 'int' | 'json';
  value?: string;
  created_at?: string;
  updated_at?: string;
}

function isNotFound(err: unknown): boolean {
  return (err as ApiError)?.statusCode === 404;
}

class UserConfigService {
  async getAllUserConfigs(hostname?: string): Promise<UserConfig[]> {
    try {
      const targetHost = hostname || authService.currentHostname;
      if (!targetHost) {
        throw new Error('No hostname provided and no active session found');
      }

      const configs = await apiService.get<UserConfig[]>(targetHost, '/api/v1/user/configs', { errorPrefix: 'Failed to get user configs' });

      return configs || [];
    } catch (error) {
      console.error('Failed to get user configs:', error);
      throw error;
    }
  }

  async getUserConfig(hostname: string | undefined, slug: string): Promise<UserConfig | null> {
    try {
      const targetHost = hostname || authService.currentHostname;
      if (!targetHost) {
        throw new Error('No hostname provided and no active session found');
      }

      const config = await apiService.get<UserConfig>(targetHost, `/api/v1/user/configs/${encodeURIComponent(slug)}`, { errorPrefix: `Failed to get user config ${slug}` });

      return config ?? null;
    } catch (error) {
      if (isNotFound(error)) return null;
      console.error(`Failed to get user config ${slug}:`, error);
      throw error;
    }
  }

  /**
   * Upsert a user config: tries PUT first; falls back to POST on 404.
   * Values are always serialized as JSON strings with type='json'.
   */
  async saveUserConfig(hostname: string | undefined, slug: string, value: unknown): Promise<void> {
    const targetHost = hostname || authService.currentHostname;
    if (!targetHost) {
      throw new Error('No hostname provided and no active session found');
    }

    const serialized = JSON.stringify(value);

    // Try update first
    try {
      await apiService.put(targetHost, `/api/v1/user/configs/${encodeURIComponent(slug)}`, { type: 'json', value: serialized }, { errorPrefix: `Failed to update user config ${slug}` });
      return;
    } catch (updateErr) {
      if (!isNotFound(updateErr)) {
        console.error(`Failed to save user config ${slug}:`, updateErr);
        throw updateErr;
      }
    }

    // 404 → create
    try {
      await apiService.post(targetHost, '/api/v1/user/configs', { slug, name: slug, type: 'json', value: serialized }, { errorPrefix: `Failed to create user config ${slug}` });
    } catch (createErr) {
      console.error(`Failed to create user config ${slug}:`, createErr);
      throw createErr;
    }
  }

  async deleteUserConfig(hostname: string | undefined, slug: string): Promise<void> {
    try {
      const targetHost = hostname || authService.currentHostname;
      if (!targetHost) {
        throw new Error('No hostname provided and no active session found');
      }

      await apiService.delete(targetHost, `/api/v1/user/configs/${encodeURIComponent(slug)}`, { errorPrefix: `Failed to delete user config ${slug}` });
    } catch (error) {
      console.error(`Failed to delete user config ${slug}:`, error);
      throw error;
    }
  }
}

export const userConfigService = new UserConfigService();
export default userConfigService;
