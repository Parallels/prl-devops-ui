import { Subject } from 'rxjs';

/**
 * Login request matching API specification
 */
interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login response from API
 */
interface LoginResponse {
  token: string;
  email: string;
  expires_at: string;
}

/**
 * API error response
 */
interface ApiError {
  error: {
    message: string;
  };
}

/**
 * Token data stored for each host
 */
export interface TokenData {
  hostname: string;
  url: string;
  token: string;
  expires_at: string;
}

/**
 * Credentials configuration for a host
 */
export interface HostCredentials {
  url: string;
  username: string;
  password: string;
  email: string;
}

// API_BASE_URL is no longer needed as URLs are configured per host
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
  private tokens: Map<string, TokenData> = new Map();
  private credentialsCache: Map<string, HostCredentials> = new Map();

  private logoutSubject = new Subject<void>();
  public readonly onLogout$ = this.logoutSubject.asObservable();

  constructor() {
    this.loadTokensFromStorage();
  }

  /**
   * Fetch credentials for a hostname from config service or storage service
   * Override this method or extend it to fetch from your config/storage service
   */
  private async fetchCredentialsForHost(hostname: string): Promise<HostCredentials> {
    // Check cache first
    if (this.credentialsCache.has(hostname)) {
      return this.credentialsCache.get(hostname)!;
    }

    // Try to fetch from config service
    // Format: "auth::{hostname}::url", "auth::{hostname}::username", etc.
    // const url = await configService.get<string>(`auth::${hostname}::url`);
    // const username = await configService.get<string>(`auth::${hostname}::username`);
    // const password = await configService.get<string>(`auth::${hostname}::password`);
    // const tenant_id = await configService.get<string>(`auth::${hostname}::tenant_id`);
    // const license_key = await configService.get<string>(`auth::${hostname}::license_key`);
    // const email = await configService.get<string>(`auth::${hostname}::email`);
    
    // In development mode (browser), use relative URL to leverage Vite proxy
    // In production (Tauri app), use absolute URL
    const isDev = window.location.hostname === 'localhost' && window.location.port === '1421';
    const url = isDev ? '' : 'http://localhost:5680'; // Relative URL for dev, absolute for production
    const username = "root"; // Placeholder
    const password = "VeryStr0ngPassw0rd"; // Placeholder
    const email = "root"; // Placeholder

    if (!username || !password) {
      throw new Error(`Credentials not configured for hostname: ${hostname}. Please configure in config service.`);
    }

    const credentials: HostCredentials = {
      url: url,
      username: username,
      password: password,
      email: email,
    };

    // Cache for future use
    this.credentialsCache.set(hostname, credentials);
    return credentials;
  }


  /**
   * Main entry point for getting access token
   * This handles everything: authentication check, login, token refresh, and returns the token
   * 
   * @param hostname - The hostname/identifier for the API endpoint
   * @returns Promise<string> - The access token ready to use in API calls
   * 
   * Usage:
   *   const token = await authService.getAccessToken('my-api-host');
   *   fetch('/api/data', { headers: { Authorization: `Bearer ${token}` } });
   */
  async getAccessToken(hostname: string): Promise<string> {
    try {
      // Check if we have a valid token
      const tokenData = this.tokens.get(hostname);
      
      if (tokenData?.token) {
        // Check if token is expired using expires_at from response
        if (this.isTokenExpired(tokenData)) {
          // Re-authenticate
          const refreshed = await this.refreshTokenInternal(hostname);
          if (refreshed) {
            const newTokenData = this.tokens.get(hostname);
            return newTokenData!.token;
          }
          
          // Re-auth failed
          console.error(`Re-authentication failed for ${hostname}`);
        } else if (this.shouldRefreshToken(tokenData)) {
          // Token is about to expire, re-authenticate proactively in background
          void this.refreshTokenInternal(hostname); // Don't wait for this
          return tokenData.token; // Return current token while re-authenticating
        } else {
          // Token is valid, return it
          return tokenData.token;
        }
      }

      // No valid token, perform login
      const credentials = await this.fetchCredentialsForHost(hostname);
      const token = await this.performLogin(hostname, credentials);
      
      return token;
    } catch (error) {
      console.error(`Failed to get access token for ${hostname}:`, error);
      throw error;
    }
  }

  /**
   * Perform actual login to the host
   */
  private async performLogin(hostname: string, credentials: HostCredentials): Promise<string> {
    const loginUrl = this.buildLoginUrl(credentials.url);

    const loginCredentials: LoginRequest = {
      email: credentials.email ,
      password: credentials.password,
    };

    try {
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginCredentials),
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText) as ApiError;
          if (errorData.error?.message) {
            throw new Error(errorData.error.message);
          }
        } catch (e) {
          // Parsing failed
        }
        throw new Error(`Login failed: ${response.statusText}`);
      }

      const data = await response.json() as LoginResponse;

      const tokenData: TokenData = {
        hostname: hostname,
        url: loginUrl,
        token: data.token,
        expires_at: data.expires_at,
      };

      this.saveTokenToStorage(hostname, tokenData);
      return tokenData.token;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Login failed. Please check your credentials.`);
    }
  }

  /**
   * Build login URL from base URL
   */
  private buildLoginUrl(baseUrl: string): string {
    let url = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${url}/api/v1/auth/token`;
  }

  /**
   * Refresh token by re-authenticating (API doesn't support token refresh)
   */
  private async refreshTokenInternal(hostname: string): Promise<boolean> {
    try {
      this.clearTokenByHost(hostname);
      const credentials = await this.fetchCredentialsForHost(hostname);
      await this.performLogin(hostname, credentials);
      return true;
    } catch (error) {
      console.error(`Re-authentication failed for ${hostname}:`, error);
      return false;
    }
  }

  // Token storage management
  private saveTokenToStorage(hostname: string, tokenData: TokenData): void {
    this.tokens.set(hostname, tokenData);
    const allTokens = Array.from(this.tokens.entries());
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(allTokens));
  }

  private loadTokensFromStorage(): void {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const allTokens = JSON.parse(stored) as [string, TokenData][];
        this.tokens = new Map(allTokens);
      }
    } catch (error) {
      console.error('Failed to load tokens from storage:', error);
      this.clearAllTokens();
    }
  }

  private clearAllTokens(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    this.tokens.clear();
  }

  private clearTokenByHost(hostname: string): void {
    this.tokens.delete(hostname);
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

  // Check if token is expired using expires_at from API response
  private isTokenExpired(tokenData: TokenData): boolean {
    const expiresAt = typeof tokenData.expires_at === 'number' 
      ? tokenData.expires_at * 1000 
      : parseInt(tokenData.expires_at) * 1000;
    
    return Date.now() >= expiresAt;
  }

  // Check if token should be refreshed proactively (1 minute before expiry)
  private shouldRefreshToken(tokenData: TokenData): boolean {
    const expiresAt = typeof tokenData.expires_at === 'number' 
      ? tokenData.expires_at * 1000 
      : parseInt(tokenData.expires_at) * 1000;
    
    const oneMinuteInMs = 60 * 1000;
    return expiresAt < Date.now() + oneMinuteInMs;
  }

  /**
   * Logout from specific hostname or all hosts
   */
  logout(hostname?: string): void {
    this.logoutSubject.next();

    if (hostname) {
      this.clearTokenByHost(hostname);
      this.credentialsCache.delete(hostname);
      console.log(`Logged out from ${hostname}`);
    } else {
      this.clearAllTokens();
      this.credentialsCache.clear();
      console.log('Logged out from all hosts');
    }
  }

  /**
   * Manually set credentials for a hostname (optional - for testing or manual config)
   */
  setCredentials(hostname: string, credentials: HostCredentials): void {
    this.credentialsCache.set(hostname, credentials);
    console.log(`Credentials set for ${hostname}`);
  }

  /**
   * Force re-authentication for a hostname (clears token and re-logins)
   */
  async forceReauth(hostname: string): Promise<string> {
    this.clearTokenByHost(hostname);
    return this.getAccessToken(hostname);
  }
}

export const authService = new AuthService();
export default authService;
