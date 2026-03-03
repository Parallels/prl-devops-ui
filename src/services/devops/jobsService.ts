import { apiService } from '../api';
import { Job } from '@/interfaces/Jobs';
/**
 * Config Service - Handles configuration and system information operations
 * Manages hardware info, version, and general system config
 */
class JobsService {
  /**
   * Get all jobs from remote host
   * 
   * @param hostname - The hostname identifier for the target server
   * @returns Array of jobs or undefined
   * @throws ApiError
   */
  async getJobs(hostname: string): Promise<Job[] | undefined> {
    try {
      const hwInfo = await apiService.get<Job[]>(
        hostname,
        '/api/v1/jobs',
        { errorPrefix: 'Failed to get jobs' }
      );

      return hwInfo;
    } catch (error) {
      console.error('Failed to get jobs:', error);
      throw error;
    }
  }

  /**
   * Get a specific job by ID
   * 
   * @param hostname - The hostname identifier for the target server
   * @param id - The ID of the job to retrieve
   * @returns Job or undefined
   */
  async getJob(hostname: string, id: string): Promise<Job | undefined> {
    try {
      if (!id) {
        throw new Error('Job ID is required');
      }
      const response = await apiService.get<Job>(
        hostname,
        `/api/v1/jobs/${id}`,
        { errorPrefix: 'Failed to get job' }
      );

      return response;
    } catch (error) {
      console.error('Failed to get job:', error);
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
  async cleanUpJobs(hostname: string): Promise<boolean> {
    try {
      await apiService.delete(
        hostname,
        `/api/v1/jobs/cleanup`,
        { errorPrefix: 'Failed to clean up jobs' }
      );

      return true;
    } catch (error) {
      console.error('Failed to clean up jobs:', error);
      return false;
    }
  }
}

// Export singleton instance
export const jobsService = new JobsService();
export default jobsService;
