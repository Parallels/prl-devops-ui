import { CapsuleAPIErrorResponse, CapsulePaginatedResponse } from '../interfaces/Capsule';
import {
  Capsule,
  CapsuleInstallRequest,
  CapsuleInstallResponse,
  CapsuleStateChangeResponse,
} from '@/interfaces/Capsule';
import authService, { StorageType } from './authService';
import { configService, DEFAULT_CONFIG } from './ConfigService';
import LogService from './LogService';

async function getApiBaseUrl() {
  const agentUrl =
    (await configService.get<string>('backend::capsule_agent_url')) ??
    DEFAULT_CONFIG.backend.capsule_agent_url ??
    '';
  void LogService.debug('ApplicationsAgentService using agentUrl:', agentUrl);
  return `${agentUrl}/api/v1`;
}

export class ApplicationsAgentService {
  private static instance: ApplicationsAgentService;

  private constructor() {}

  public static getInstance(): ApplicationsAgentService {
    if (!ApplicationsAgentService.instance) {
      ApplicationsAgentService.instance = new ApplicationsAgentService();
    }
    return ApplicationsAgentService.instance;
  }

  public async getApplications(
    page: number = 1,
    pageSize: number = 20
  ): Promise<CapsulePaginatedResponse<Capsule>> {
    const agentToken = await authService.login(StorageType.ApplicationAgent);

    const API_BASE_URL = await getApiBaseUrl();
    const url = new URL(`${API_BASE_URL}/capsules`);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('page_size', pageSize.toString());

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${agentToken.token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch applications');
    }

    const data = (await response.json()) as CapsulePaginatedResponse<Capsule>;
    for (const capsule of data.results) {
      capsule.is_installed = true;
    }

    return data;
  }

  public async getApplicationsList(): Promise<Capsule[]> {
    const agentToken = await authService.login(StorageType.ApplicationAgent);

    const API_BASE_URL = await getApiBaseUrl();
    const url = new URL(`${API_BASE_URL}/capsules/list`);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${agentToken.token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch applications');
    }

    const data = (await response.json()) as Capsule[];
    for (const capsule of data) {
      capsule.is_installed = true;
    }

    return data;
  }

  public async getApplication(applicationId: string): Promise<Capsule> {
    const agentToken = await authService.login(StorageType.ApplicationAgent);
    const API_BASE_URL = await getApiBaseUrl();
    const response = await fetch(`${API_BASE_URL}/capsules/${applicationId}`, {
      headers: {
        Authorization: `Bearer ${agentToken.token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch application');
    }

    return response.json() as Promise<Capsule>;
  }

  public async installApplication(
    installRequest: CapsuleInstallRequest
  ): Promise<CapsuleInstallResponse> {
    const agentToken = await authService.login(StorageType.ApplicationAgent);
    const API_BASE_URL = await getApiBaseUrl();
    const response = await fetch(`${API_BASE_URL}/capsules`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${agentToken.token}`,
      },
      body: JSON.stringify(installRequest),
    });

    if (!response.ok) {
      const error = await response.text();
      console.info(`installApplication rejected with error: ${error}`);
      const apiError = JSON.parse(error) as CapsuleAPIErrorResponse;
      if (apiError.error && apiError.error.message) {
        console.info(`installApplication rejected with error: ${apiError.error.message}`);
        const error = new Error(apiError.error.message) as Error & { apiError?: typeof apiError };
        error.apiError = apiError; // Attach original API error data
        return Promise.reject(error);
      }

      throw new Error('Failed to install application');
    }

    return response.json() as Promise<CapsuleInstallResponse>;
  }

  public async searchApplications(
    query: string,
    page: number = 1,
    limit: number = 20,
    signal?: AbortSignal
  ): Promise<CapsulePaginatedResponse<Capsule>> {
    const API_BASE_URL = await getApiBaseUrl();
    const agentToken = await authService.login(StorageType.RegistrationAgent);

    const url = new URL(`${API_BASE_URL}/capsules/search`);
    url.searchParams.append('q', query);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('limit', limit.toString());

    const fetchOptions: RequestInit = {
      headers: {
        Authorization: `Bearer ${agentToken.token}`,
      },
    };

    if (signal) {
      fetchOptions.signal = signal;
    }

    const response = await fetch(url.toString(), fetchOptions);

    if (!response.ok) {
      throw new Error('Failed to search applications');
    }

    const data = (await response.json()) as CapsulePaginatedResponse<Capsule>;
    for (const capsule of data.results) {
      capsule.is_installed = true;
    }

    return data;
  }

  public async deleteApplication(applicationId: string): Promise<void> {
    const agentToken = await authService.login(StorageType.ApplicationAgent);
    console.info('agentToken', agentToken);
    const API_BASE_URL = await getApiBaseUrl();
    const response = await fetch(`${API_BASE_URL}/capsules/${applicationId}?force=true`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${agentToken.token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete application');
    }

    return response.json() as Promise<void>;
  }

  public async startApplication(applicationId: string): Promise<CapsuleStateChangeResponse> {
    const agentToken = await authService.login(StorageType.ApplicationAgent);
    const API_BASE_URL = await getApiBaseUrl();
    const response = await fetch(`${API_BASE_URL}/capsules/${applicationId}/start`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${agentToken.token}`,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      const apiError = JSON.parse(body) as CapsuleAPIErrorResponse;
      if (apiError.error && apiError.error.message) {
        void LogService.debug(
          'ApplicationsAgentService',
          'startApplication',
          'apiError message',
          apiError.error.message
        );
        throw new Error(apiError.error.message);
      }
      throw new Error('Failed to start application');
    }

    return response.json() as Promise<CapsuleStateChangeResponse>;
  }

  public async stopApplication(applicationId: string): Promise<boolean> {
    const agentToken = await authService.login(StorageType.ApplicationAgent);
    const API_BASE_URL = await getApiBaseUrl();
    void LogService.debug('Stopping app with id', applicationId);
    const response = await fetch(`${API_BASE_URL}/capsules/${applicationId}/stop`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${agentToken.token}`,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      const apiError = JSON.parse(body) as CapsuleAPIErrorResponse;
      if (apiError.error && apiError.error.message) {
        void LogService.debug(
          'ApplicationsAgentService',
          'stopApplication',
          'apiError message',
          apiError.error.message
        );
        throw new Error(apiError.error.message);
      }
      throw new Error('Failed to stop application');
    }

    return true;
  }

  public async restartApplication(applicationId: string): Promise<CapsuleStateChangeResponse> {
    const agentToken = await authService.login(StorageType.ApplicationAgent);
    const API_BASE_URL = await getApiBaseUrl();
    const response = await fetch(`${API_BASE_URL}/capsules/${applicationId}/restart`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${agentToken.token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to restart application');
    }

    return response.json() as Promise<CapsuleStateChangeResponse>;
  }
  public async setCredentialsVisibility(capsuleId: string, show: boolean): Promise<void> {
    const agentToken = await authService.login(StorageType.ApplicationAgent);
    const API_BASE_URL = await getApiBaseUrl();
    const response = await fetch(`${API_BASE_URL}/capsules/${capsuleId}/credentials/visibility`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${agentToken.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ show }),
    });

    if (!response.ok) {
      throw new Error('Failed to update credentials visibility');
    }
  }
}
