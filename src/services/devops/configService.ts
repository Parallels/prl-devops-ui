import { apiService } from '../api';
import { HostHardwareInfo } from '../../interfaces/devops';
import { VersionResponse } from '../../interfaces/devops';
/**
 * Config Service - Handles configuration and system information operations
 * Manages hardware info, version, and general system config
 */
class ConfigService {
  /**
   * Get hardware information from remote host
   * 
   * @param hostname - The hostname identifier for the target server
   * @returns Hardware information or undefined
   * @throws ApiError
   */
  async getHardwareInfo(hostname: string): Promise<HostHardwareInfo | undefined> {
    try {
      const hwInfo = await apiService.get<HostHardwareInfo>(
        hostname,
        '/api/v1/config/hardware',
        { errorPrefix: 'Failed to get hardware info' }
      );

      return hwInfo;
    } catch (error) {
      console.error('Failed to get hardware info:', error);
      throw error;
    }
  }

  /**
   * Get DevOps service version
   * 
   * @param hostname - The hostname identifier for the target server
   * @returns Version string or undefined
   */
  async getVersion(hostname: string): Promise<string | undefined> {
    try {
      const response = await apiService.get<VersionResponse>(
        hostname,
        '/api/v1/version',
        { errorPrefix: 'Failed to get version' }
      );

      return response?.version;
    } catch (error) {
      console.error('Failed to get version:', error);
      // Don't throw - version is optional
      return undefined;
    }
  }

  /**
   * Test connectivity to the DevOps API
   * 
   * @param hostname - The hostname identifier for the target server
   * @returns true if host is reachable and authenticated
   */
  async testConnection(hostname: string): Promise<boolean> {
    try {
      // Try to get hardware info as a simple test
      await this.getHardwareInfo(hostname);
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const configService = new ConfigService();
export default configService;
