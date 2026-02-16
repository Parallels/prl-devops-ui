import { authService } from './authService';
import { ApiError, ApiErrorResponse, ApiRequestOptions } from '../interfaces/api';

/**
 * Generic API service for making authenticated requests
 * Uses authService for authentication
 */
class ApiService {
  /**
   * Parse API error response into uniform ApiError
   */
  parseApiError(error: unknown, statusCode?: number, fallbackMessage = 'An error occurred'): ApiError {
    // If it's already an ApiError, return it
    if (this.isApiError(error)) {
      return error;
    }

    // If it's an Error object
    if (error instanceof Error) {
      return {
        message: error.message || fallbackMessage,
        statusCode,
        details: error
      };
    }

    // Try to parse as ApiErrorResponse
    if (typeof error === 'object' && error !== null) {
      const errorResponse = error as ApiErrorResponse;
      
      // Check for nested error object
      if (errorResponse.error?.message) {
        return {
          message: errorResponse.error.message,
          code: errorResponse.error.code,
          statusCode: statusCode || errorResponse.statusCode,
          details: error
        };
      }
      
      // Check for direct message
      if (errorResponse.message) {
        return {
          message: errorResponse.message,
          statusCode: statusCode || errorResponse.statusCode,
          details: error
        };
      }
    }

    // Fallback
    return {
      message: fallbackMessage,
      statusCode,
      details: error
    };
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

  /**
   * Build full API URL for a hostname
   * @param hostname - The hostname identifier to get URL for
   * @param endpoint - API endpoint path (e.g., '/api/v1/catalog')
   * @returns Full URL
   */
  async buildUrl(hostname: string, endpoint: string): Promise<string> {
    // Get the base URL for this hostname from authService
    const baseUrl = await authService.getHostUrl(hostname);
    
    // Ensure endpoint starts with /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // If baseUrl is empty (dev mode with Vite proxy), return just the endpoint
    if (!baseUrl) {
      return normalizedEndpoint;
    }
    
    // Remove trailing slash from baseUrl
    const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    
    return `${normalizedBaseUrl}${normalizedEndpoint}`;
  }

  /**
   * Make authenticated API request
   * @param hostname - The hostname identifier for auth
   * @param endpoint - API endpoint path
   * @param options - Request options
   * @returns Response data
   * @throws ApiError
   */
  async request<T>(
    hostname: string,
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const { skipAuth, errorPrefix, ...fetchOptions } = options;

    try {
      // Get access token from authService (unless skipAuth is true)
      let token: string | undefined;
      if (!skipAuth) {
        token = await authService.getAccessToken(hostname);
      }
      
      // Build full URL using hostname
      const url = await this.buildUrl(hostname, endpoint);

      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-SOURCE-ID': 'DEVOPS_UI',
        ...((fetchOptions.headers as Record<string, string>) || {})
      };

      // Add authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Make request
      const response = await fetch(url, {
        ...fetchOptions,
        headers
      });

      // Handle non-OK responses
      if (!response.ok) {
        const errorText = await response.text();
        let apiError: ApiError;
        
        try {
          const errorData = JSON.parse(errorText) as ApiErrorResponse;
          apiError = this.parseApiError(errorData, response.status);
        } catch (e) {
          // JSON parsing failed
          apiError = this.parseApiError(
            new Error(errorText || response.statusText),
            response.status
          );
        }

        // Add error prefix if provided
        if (errorPrefix) {
          apiError.message = `${errorPrefix}: ${apiError.message}`;
        }
        
        throw apiError;
      }

      // Parse and return response
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        return data as T;
      }
      
      // For non-JSON responses, return as text
      const text = await response.text();
      return text as unknown as T;
    } catch (error) {
      // If it's already an ApiError, re-throw it
      if (this.isApiError(error)) {
        throw error;
      }
      
      // Parse and throw as ApiError
      const apiError = this.parseApiError(
        error,
        undefined,
        errorPrefix ? `${errorPrefix}: Request failed` : 'Request failed'
      );
      throw apiError;
    }
  }

  /**
   * Make GET request
   */
  async get<T>(hostname: string, endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(hostname, endpoint, {
      ...options,
      method: 'GET'
    });
  }

  /**
   * Make POST request
   */
  async post<T>(
    hostname: string,
    endpoint: string,
    body?: unknown,
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.request<T>(hostname, endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  /**
   * Make PUT request
   */
  async put<T>(
    hostname: string,
    endpoint: string,
    body?: unknown,
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.request<T>(hostname, endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  /**
   * Make DELETE request
   */
  async delete<T>(hostname: string, endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(hostname, endpoint, {
      ...options,
      method: 'DELETE'
    });
  }

  /**
   * Make PATCH request
   */
  async patch<T>(
    hostname: string,
    endpoint: string,
    body?: unknown,
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.request<T>(hostname, endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined
    });
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
