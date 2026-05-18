import { Subject } from 'rxjs';
import { ApiError, ApiErrorResponse } from '../interfaces/api';

/**
  * Login request matching API specification
  */
interface LoginRequest {
  email: string;
  password: string;
  api_key?: string;
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
  api_key: string;
}

// API_BASE_URL is no longer needed as URLs are configured per host
const AUTH_STORAGE_KEY = 'auth_tokens';

class AuthService {
  private tokens: Map<string, TokenData> = new Map();
  private credentialsCache: Map<string, HostCredentials> = new Map();

  private logoutSubject = new Subject<void>();
  public readonly onLogout$ = this.logoutSubject.asObservable();

  private tokenRefreshedSubject = new Subject<{ hostname: string; token: string }>();
  public readonly onTokenRefreshed$ = this.tokenRefreshedSubject.asObservable();

  private _currentHostname: string | null = null;

  public get currentHostname(): string | null {
    return this._currentHostname;
  }

  public set currentHostname(value: string | null) {
    this._currentHostname = value;
  }

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

    // If hostname looks like a URL, try extracting the actual hostname and look up again.
    // This prevents mismatches when callers pass a full URL instead of a hostname.
    if (hostname.includes('://')) {
      try {
        const extracted = new URL(hostname).hostname;
        if (extracted && this.credentialsCache.has(extracted)) {
          console.warn(`[AuthService] "${hostname}" resolved to cached hostname "${extracted}"`);
          return this.credentialsCache.get(extracted)!;
        }
      } catch {
        // Not a valid URL, continue with normal flow
      }
    }

    // Use Vite's built-in DEV flag — true for any client connecting to the dev
    // server regardless of the hostname they used (localhost, IP, remote domain).
    // When DEV, use an empty base URL so every request goes through the Vite
    // proxy (/api → VITE_DEVOPS_API_URL).  Using window.location.hostname here
    // was wrong: it would be false when connecting remotely, causing the browser
    // to send requests directly to the backend and bypassing the proxy (no CORS
    // handling, no WS Origin rewrite, and "localhost" resolving on the client).
    const url = import.meta.env.DEV ? '' : (import.meta.env.VITE_DEVOPS_API_URL || 'http://localhost:5680');
    const username = import.meta.env.VITE_DEVOPS_USERNAME || 'root';
    const password = import.meta.env.VITE_DEVOPS_PASSWORD || 'VeryStr0ngPassw0rd';
    const api_key = import.meta.env.VITE_DEVOPS_API_KEY || 'VeryStr0ngPassw0rd';
    const email = import.meta.env.VITE_DEVOPS_EMAIL || 'root';

    if (!username || !password) {
      throw new Error(`Credentials not configured for hostname: ${hostname}. Please configure environment variables.`);
    }

    const credentials: HostCredentials = {
      url: url,
      username: username,
      password: password,
      email: email,
      api_key: api_key,
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
    // Normalize: if a full URL was passed, extract the hostname
    hostname = this.normalizeHostname(hostname);

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
      return this.performLogin(hostname, credentials);
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
    email: credentials.email,
    password: credentials.password,
    api_key: credentials.api_key,
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
        let errorMessage = `Login failed: ${response.statusText}`;

        try {
          const errorData = JSON.parse(errorText) as ApiErrorResponse;
          if (errorData.error?.message) {
            errorMessage = errorData.error.message;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // JSON parsing failed, use default error message
        }

        const apiError: ApiError = {
          message: errorMessage,
          statusCode: response.status,
          details: errorText
        };
        throw apiError;
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
      // If it's already an ApiError, re-throw it
      if (this.isApiError(error)) {
        throw error;
      }

      // Convert to ApiError
      const apiError: ApiError = {
        message: error instanceof Error ? error.message : 'Login failed. Please check your credentials.',
        details: error
      };
      throw apiError;
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
      const newToken = await this.performLogin(hostname, credentials);
      this.tokenRefreshedSubject.next({ hostname, token: newToken });
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
      this._currentHostname = null;
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
   * Refresh the session token for a hostname and emit onTokenRefreshed$ so that
   * SessionContext updates its claims/roles without a full logout.
   * Use this when an auth event indicates the current user's permissions changed
   * (e.g. USER_UPDATED, ROLE_CLAIM_ADDED/REMOVED on a role the user holds).
   *
   * @param hostname      The hostname whose session should be refreshed.
   * @param serverUrl     Optional URL override (pass session.serverUrl to ensure
   *                      the request targets the real host in dev proxy setups).
   */
  async refreshSession(hostname: string, serverUrl?: string): Promise<void> {
    hostname = this.normalizeHostname(hostname);
    if (serverUrl) {
      const existing = this.credentialsCache.get(hostname);
      if (existing) {
        this.credentialsCache.set(hostname, { ...existing, url: serverUrl });
      }
    }
    await this.refreshTokenInternal(hostname);
  }

  /**
   * Force re-authentication for a hostname.
   * Clears the cached token, performs a fresh login, and emits tokenRefreshed$
   * so that SessionContext updates its claims/roles without requiring a full
   * page reload.
   *
   * @param serverUrlOverride  When provided, the credential cache entry for this
   *   hostname is updated to use this URL before logging in.  Pass the session's
   *   `serverUrl` to guarantee the request goes to the real host rather than
   *   whatever URL was stored (e.g. an empty string used for the Vite dev proxy).
   */
  async forceReauth(hostname: string, serverUrlOverride?: string): Promise<string> {
    hostname = this.normalizeHostname(hostname);

    // If a URL override is supplied, refresh the cached credentials so the login
    // request targets the correct server.  We keep all other credential fields
    // (username, password, api_key) unchanged.
    if (serverUrlOverride) {
      const existing = this.credentialsCache.get(hostname);
      if (existing) {
        this.credentialsCache.set(hostname, { ...existing, url: serverUrlOverride });
      }
    }

    this.clearTokenByHost(hostname);
    // Use getAccessToken rather than emitting tokenRefreshedSubject here.
    // tokenRefreshedSubject is intentionally reserved for the background proactive
    // refresh path (refreshTokenInternal) so that SessionContext re-renders only
    // when the background refresh fires — not on every WS reconnect, which would
    // cause an infinite session-change → reconnect → session-change loop.
    return this.getAccessToken(hostname);
  }

  /**
   * Get the base URL for a hostname
   * This is used by API services to determine which server to connect to
   */
  async getHostUrl(hostname: string): Promise<string> {
    hostname = this.normalizeHostname(hostname);
    const credentials = await this.fetchCredentialsForHost(hostname);
    return credentials.url;
  }

  /**
   * Normalize a hostname parameter: if a full URL is passed, extract the hostname portion.
   * This prevents cache misses when callers accidentally pass serverUrl instead of hostname.
   */
  private normalizeHostname(hostname: string): string {
    if (hostname.includes('://')) {
      try {
        return new URL(hostname).hostname;
      } catch {
        // Not a valid URL, return as-is
      }
    }
    return hostname;
  }

  /**
   * Get the raw token string for a hostname
   * @param hostname - Optional hostname, uses currentHostname if not provided
   * @returns The token string or null if not found
   */
  getToken(hostname?: string): string | null {
    const targetHostname = hostname ? this.normalizeHostname(hostname) : this._currentHostname;
    if (!targetHostname) {
      return null;
    }

    const tokenData = this.tokens.get(targetHostname);
    return tokenData?.token ?? null;
  }

  /**
   * Check if an object is an ApiError
   */
  private isApiError(error: unknown): error is ApiError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as ApiError).message === 'string'
    );
  }
}

export const authService = new AuthService();
export default authService;
