/**
 * Uniform API error interface for consistent error handling across the UI
 */
export interface ApiError {
  /** Error message suitable for display to users */
  message: string;
  /** HTTP status code if applicable */
  statusCode?: number;
  /** Error code for programmatic handling */
  code?: string;
  /** Original error details (for debugging) */
  details?: unknown;
}

/**
 * API error response formats from backend
 */
export interface ApiErrorResponse {
  error?: {
    message: string;
    code?: string;
  };
  message?: string;
  statusCode?: number;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

/**
 * Options for API requests
 */
export interface ApiRequestOptions extends RequestInit {
  /** Skip authentication for this request */
  skipAuth?: boolean;
  /** Custom error message prefix */
  errorPrefix?: string;
}
