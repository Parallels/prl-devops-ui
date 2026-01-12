import axios, { AxiosError } from 'axios';
import type { LoginCredentials, LoginResponse, ApiError, User } from '@/types/auth';
import { configService } from './ConfigService';
import LogService from './LogService';
import { Subject } from 'rxjs';

import { secretsService } from './secretsService';

// enum to define the type of storage
export enum StorageType {
  ApplicationAgent = 'application_agent',
  RegistrationAgent = 'registration_agent',
}

export interface TokenType {
  type: StorageType;
  url: string;
  token: string;
  refresh_token: string;
  expires_at: string;
}

// API_BASE_URL is no longer needed as URLs are configured per token type
const AUTH_STORAGE_KEY = 'auth_tokens';

interface JwtPayload {
  username: string;
  role: string;
  tenant_id: string;
  exp: number;
  iat: number;
  iss: string;
  is_admin: boolean;
}

class AuthService {
  private tokens: Map<StorageType, TokenType> = new Map();
  private tokenConfigs: Map<
    StorageType,
    {
      url: string;
      username: string;
      password: string;
      tenant_id: string;
      license_key?: string;
      email?: string;
    }
  > = new Map();

  private logoutSubject = new Subject<void>();
  public readonly onLogout$ = this.logoutSubject.asObservable();

  constructor() {
    void configService.get<string>('backend::capsule_agent_url').then((url) => {
      this.tokenConfigs.set(StorageType.ApplicationAgent, {
        url: url ?? '',
        username: (import.meta.env.VITE_APPLICATION_AGENT_USERNAME as string) || 'root',
        password: (import.meta.env.VITE_APPLICATION_AGENT_PASSWORD as string) || 'root',
        tenant_id: 'global',
      });
      console.info('agentUrl set for token type', StorageType.ApplicationAgent, url);
      this.loadTokensFromStorage();
    });
    void configService.get<string>('backend::marketplace_url').then(async (url) => {
      const buildSecretUrl = await secretsService.getBuildSecret('marketplace_url');
      if (buildSecretUrl) {
        url = buildSecretUrl;
        // Update config to ensure consistency
        void configService.set('backend::marketplace_url', url);
      } else if (!url) {
        // Fallback if no config and no build secret (unlikely in prod)
        url = '';
      }

      const username = await configService.get<string>('app::username');
      const password = await configService.get<string>('app::password');
      const email = await configService.get<string>('app::email_address');
      const license_key = await configService.get<string>('app::license_key');
      void LogService.info(
        'Fetched registration agent credentials from config service',
        username,
        email,
        license_key
      );
      this.tokenConfigs.set(StorageType.RegistrationAgent, {
        url: url ?? '',
        username: username ?? 'root',
        password: password ?? 'root',
        tenant_id: 'global',
        license_key: license_key ?? '',
        email: email ?? '',
      });
      void LogService.info(
        'marketplaceUrl set for token type',
        StorageType.RegistrationAgent,
        url,
        username,
        password
      );
      this.loadTokensFromStorage();
    });
  }

  private async getUrl(tokenType: StorageType): Promise<string> {
    switch (tokenType) {
      case StorageType.ApplicationAgent: {
        const agentUrl = (await configService.get<string>('backend::capsule_agent_url')) ?? '';
        void LogService.info('ApplicationsAgentService using agentUrl:', agentUrl);
        return agentUrl;
      }
      case StorageType.RegistrationAgent: {
        let marketplaceUrl = (await configService.get<string>('backend::marketplace_url')) ?? '';
        if (!marketplaceUrl) {
          marketplaceUrl = (await secretsService.getBuildSecret('marketplace_url')) ?? '';
        }
        void LogService.info('ApplicationsAgentService using marketplaceUrl:', marketplaceUrl);
        return marketplaceUrl;
      }
    }
  }

  // Token storage management
  private saveTokensToStorage(tokenType: StorageType, tokenData: TokenType): void {
    this.tokens.set(tokenType, tokenData);
    const allTokens = Array.from(this.tokens.entries());
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(allTokens));
  }

  private loadTokensFromStorage(): void {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const allTokens = JSON.parse(stored) as [StorageType, TokenType][];
        this.tokens = new Map(allTokens);
      }
    } catch (error) {
      console.error('Failed to load tokens from storage:', error);
      this.clearTokens();
    }
  }

  private clearTokens(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    this.tokens.clear();
  }

  private clearTokenByType(tokenType: StorageType): void {
    this.tokens.delete(tokenType);
    const allTokens = Array.from(this.tokens.entries());
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(allTokens));
  }

  // JWT token parsing
  private parseJwtPayload(token: string): JwtPayload | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload) as JwtPayload;
    } catch (error) {
      console.error('Failed to parse JWT:', error);
      return null;
    }
  }

  // Check if token is expired
  private isTokenExpired(token: string): boolean {
    const payload = this.parseJwtPayload(token);
    if (!payload || !payload.exp) {
      return true;
    }
    return Date.now() >= payload.exp * 1000;
  }

  // Public API
  async login(tokenType: StorageType, ignoreCache: boolean = true): Promise<User> {
    try {
      let config = this.tokenConfigs.get(tokenType);
      void LogService.debug('AuthService login called for tokenType:', tokenType, config);
      if (!config) {
        throw new Error(`No configuration found for token type: ${tokenType}`);
      }

      if (!ignoreCache) {
        // Check if we already have a valid token
        if (this.isAuthenticated(tokenType)) {
          // Check if token is about to expire and refresh it
          if (this.shouldRefreshToken(tokenType)) {
            void LogService.info(`Token for ${tokenType} is about to expire, refreshing...`);
            const refreshSuccess = await this.refreshToken(tokenType);
            if (refreshSuccess) {
              const user = this.getCurrentUser(tokenType);
              if (user) {
                return user;
              }
            }
          }

          void LogService.info(`Already authenticated for ${tokenType}, returning cached user`);
          const user = this.getCurrentUser(tokenType);
          if (user) {
            return user;
          }
        }

        // Check if token is about to expire and refresh it
        if (this.shouldRefreshToken(tokenType)) {
          void LogService.info(`Token for ${tokenType} is about to expire, refreshing...`);
          const refreshSuccess = await this.refreshToken(tokenType);
          if (refreshSuccess) {
            const user = this.getCurrentUser(tokenType);
            if (user) {
              return user;
            }
          }
        }
      }

      const loginBaseUrl = await this.getUrl(tokenType);
      if (!loginBaseUrl) {
        throw new Error(`Login URL is not configured for token type: ${tokenType}`);
      }

      let loginUrl = loginBaseUrl.endsWith('/') ? loginBaseUrl.slice(0, -1) : loginBaseUrl;
      loginUrl = `${loginUrl}/api/v1/auth/login`;
      // If we get here, we need to authenticate
      if (!config.username || !config.password) {
        void LogService.info('Username or password is not configured, attempting to reload credentials');
        await this.reloadCredentials();
        config = this.tokenConfigs.get(tokenType)!;

        if (!config.username || !config.password) {
          throw new Error(`Username or password is not configured for token type: ${tokenType}`);
        }
      }
      void LogService.info(`Logging in as ${config.username} for ${tokenType}(url: ${loginUrl})`);
      const credentials: LoginCredentials = {
        username: config.username,
        password: config.password,
        license_key: config.license_key,
        email: config.email,
      };

      const response = await axios.post<LoginResponse>(loginUrl, credentials, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const tokenData: TokenType = {
        type: tokenType,
        url: loginUrl,
        token: response.data.token,
        refresh_token: response.data.refresh_token,
        expires_at: response.data.expires_at,
      };

      this.saveTokensToStorage(tokenType, tokenData);
      void LogService.info('Tokens saved to storage:', tokenData);

      // Parse user info from token
      const user = this.getCurrentUser(tokenType);
      if (!user) {
        throw new Error('Failed to parse user information from token');
      }
      void LogService.info('User information parsed successfully:', user);

      return user;
    } catch (error) {
      void LogService.error('Login failed:', error);
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;
        if (axiosError.response?.data?.error) {
          throw new Error(axiosError.response.data.error.message);
        }
      }
      throw new Error('Login failed. Please try again.');
    }
  }

  async loginWithCredentials(
    tokenType: StorageType,
    authCredentials: LoginCredentials,
    ignoreCache: boolean = false
  ): Promise<User> {
    try {
      const config = this.tokenConfigs.get(tokenType);
      if (!config) {
        throw new Error(`Token configuration not found for type: ${tokenType}`);
      }

      if (!ignoreCache) {
        // Check if we already have a valid token
        if (this.isAuthenticated(tokenType)) {
          // Check if token is about to expire and refresh it
          if (this.shouldRefreshToken(tokenType)) {
            void LogService.info(`Token for ${tokenType} is about to expire, refreshing...`);
            const refreshSuccess = await this.refreshToken(tokenType);
            if (refreshSuccess) {
              const user = this.getCurrentUser(tokenType);
              if (user) {
                return user;
              }
            }
          }

          void LogService.info(`Already authenticated for ${tokenType}, returning cached user`);
          const user = this.getCurrentUser(tokenType);
          if (user) {
            return user;
          }
        }

        // Check if token is about to expire and refresh it
        if (this.shouldRefreshToken(tokenType)) {
          void LogService.info(`Token for ${tokenType} is about to expire, refreshing...`);
          const refreshSuccess = await this.refreshToken(tokenType);
          if (refreshSuccess) {
            const user = this.getCurrentUser(tokenType);
            if (user) {
              return user;
            }
          }
        }
      }

      const loginBaseUrl = await this.getUrl(tokenType);
      if (!loginBaseUrl) {
        throw new Error(`Login URL is not configured for token type: ${tokenType}`);
      }

      let loginUrl = loginBaseUrl.endsWith('/') ? loginBaseUrl.slice(0, -1) : loginBaseUrl;
      loginUrl = `${loginUrl}/api/v1/auth/login`;
      if (authCredentials.username === "" || authCredentials.password === "") {
        void LogService.info('Username or password is not configured, attempting to reload credentials');
        await this.reloadCredentials();
        const config = this.tokenConfigs.get(tokenType);

        if (config && config.username && config.password) {
          authCredentials.username = config.username;
          authCredentials.password = config.password;
        } else {
          void LogService.info(`Username or password is not configured for token type: ${tokenType}`);
          throw new Error(`Username or password is not configured for token type: ${tokenType}`);
        }
      }
      // If we get here, we need to authenticate
      void LogService.info(
        `Logging in as ${authCredentials.username} for ${tokenType}(url: ${loginUrl})`
      );
      const credentials: LoginCredentials = {
        username: authCredentials.username,
        password: authCredentials.password,
        license_key: authCredentials.license_key,
        email: authCredentials.email,
      };

      const response = await axios.post<LoginResponse>(loginUrl, credentials, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const tokenData: TokenType = {
        type: tokenType,
        url: loginUrl,
        token: response.data.token,
        refresh_token: response.data.refresh_token,
        expires_at: response.data.expires_at,
      };

      this.saveTokensToStorage(tokenType, tokenData);
      void LogService.info('Tokens saved to storage:', tokenData);

      // Parse user info from token
      const user = this.getCurrentUser(tokenType);
      if (!user) {
        throw new Error('Failed to parse user information from token');
      }
      void LogService.info('User information parsed successfully:', user);

      return user;
    } catch (error) {
      void LogService.error('Login failed:', error);
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;
        if (axiosError.response?.data?.error) {
          throw new Error(axiosError.response.data.error.message);
        }
      }
      throw new Error('Login failed. Please try again.');
    }
  }

  async refreshToken(tokenType: StorageType): Promise<boolean> {
    const tokenData = this.tokens.get(tokenType);
    if (!tokenData?.refresh_token) {
      return false;
    }

    try {
      const response = await axios.post<LoginResponse>(
        `${tokenData.url}/api/v1/auth/refresh`,
        {},
        {
          headers: {
            Authorization: `Bearer ${tokenData.refresh_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const newTokenData: TokenType = {
        ...tokenData,
        token: response.data.token,
        refresh_token: response.data.refresh_token,
        expires_at: response.data.expires_at,
      };

      this.saveTokensToStorage(tokenType, newTokenData);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokenByType(tokenType);
      return false;
    }
  }

  logout(tokenType?: StorageType): void {
    // Notify subscribers about logout
    this.logoutSubject.next();

    if (tokenType) {
      this.clearTokenByType(tokenType);
    } else {
      this.clearTokens();
    }
  }

  isAuthenticated(tokenType: StorageType): boolean {
    const tokenData = this.tokens.get(tokenType);
    if (!tokenData?.token) {
      return false;
    }

    // Check if access token is expired
    if (this.isTokenExpired(tokenData.token)) {
      // If access token is expired but we have a refresh token, we could be authenticated
      // The interceptor will handle the refresh
      return !!tokenData.refresh_token && !this.isTokenExpired(tokenData.refresh_token);
    }

    return true;
  }

  getAccessToken(tokenType: StorageType): string | null {
    const tokenData = this.tokens.get(tokenType);
    console.info('tokenData', tokenData);
    return tokenData?.token || null;
  }

  getRefreshToken(tokenType: StorageType): string | null {
    const tokenData = this.tokens.get(tokenType);
    return tokenData?.refresh_token || null;
  }

  getCurrentUser(tokenType: StorageType): User | null {
    const tokenData = this.tokens.get(tokenType);
    if (!tokenData?.token) {
      return null;
    }

    const payload = this.parseJwtPayload(tokenData.token);
    if (!payload) {
      return null;
    }

    return {
      username: payload.username,
      role: payload.role,
      tenant_id: payload.tenant_id,
      is_admin: payload.is_admin,
      token: tokenData.token,
    };
  }

  // Check if current token is about to expire (within 5 minutes)
  shouldRefreshToken(tokenType: StorageType): boolean {
    const tokenData = this.tokens.get(tokenType);
    if (!tokenData?.token) {
      return false;
    }

    const payload = this.parseJwtPayload(tokenData.token);
    if (!payload || !payload.exp) {
      return false;
    }

    // Refresh if token expires within 5 minutes
    const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000;
    return payload.exp * 1000 < fiveMinutesFromNow;
  }

  // Get all stored token types
  getStoredTokenTypes(): StorageType[] {
    return Array.from(this.tokens.keys());
  }

  // Check if a specific token type exists
  hasToken(tokenType: StorageType): boolean {
    return this.tokens.has(tokenType);
  }

  // Re-authenticate using stored credentials
  async reAuthenticate(tokenType: StorageType): Promise<User> {
    return this.login(tokenType);
  }

  // Add a new token type configuration
  addTokenConfig(
    tokenType: StorageType,
    url: string,
    username: string,
    password: string,
    tenant_id: string
  ): void {
    this.tokenConfigs.set(tokenType, { url, username, password, tenant_id });
  }

  public async reloadCredentials(): Promise<void> {
    const username = await configService.get<string>('app::username');
    const password = await configService.get<string>('app::password');
    const email = await configService.get<string>('app::email_address');
    const license_key = await configService.get<string>('app::license_key');
    let url = await configService.get<string>('backend::marketplace_url');
    const buildSecretUrl = await secretsService.getBuildSecret('marketplace_url');

    if (buildSecretUrl) {
      url = buildSecretUrl;
      // Update config to ensure consistency
      void configService.set('backend::marketplace_url', url);
    } else if (!url) {
      url = '';
    }

    void LogService.info(
      'Reloading registration agent credentials from config service',
      username,
      email,
      license_key
    );

    this.tokenConfigs.set(StorageType.RegistrationAgent, {
      url: url ?? '',
      username: username ?? 'root',
      password: password ?? 'root',
      tenant_id: 'global',
      license_key: license_key ?? '',
      email: email ?? '',
    });
  }
}

export const authService = new AuthService();
export default authService;
