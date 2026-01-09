/**
 * Utility functions for handling focus events with intelligent reconnection logic
 */

export interface FocusHandlerOptions {
  debounceMs?: number;
  checkConnection?: () => boolean;
  onReconnect?: () => void;
  onSkip?: () => void;
}

/**
 * Creates a debounced focus handler that only triggers reconnection when necessary
 * @param options Configuration options for the focus handler
 * @returns A function that can be used as an event listener
 */
export function createIntelligentFocusHandler(options: FocusHandlerOptions = {}) {
  const {
    debounceMs = 500,
    checkConnection = () => true,
    onReconnect = () => {},
    onSkip = () => {},
  } = options;

  const enableDebugLogging = false;

  let focusTimeout: NodeJS.Timeout | null = null;

  return () => {
    if (enableDebugLogging) {
      console.info('Window focused - checking connection status');
    }

    // Clear any existing timeout
    if (focusTimeout) {
      clearTimeout(focusTimeout);
    }

    // Debounce the focus event to avoid rapid reconnections
    focusTimeout = setTimeout(() => {
      // Only reconnect if the connection check fails
      if (!checkConnection()) {
        if (enableDebugLogging) {
          console.info('Connection lost, attempting to reconnect...');
        }
        onReconnect();
      } else {
        if (enableDebugLogging) {
          console.info('Already connected, no need to reconnect');
        }
        onSkip();
      }
    }, debounceMs);
  };
}

/**
 * Cleanup function for focus handlers
 * @param handler The focus handler function
 * @param timeoutRef Reference to the timeout
 */
export function cleanupFocusHandler(handler: () => void, timeoutRef: NodeJS.Timeout | null) {
  window.removeEventListener('focus', handler);
  if (timeoutRef) {
    clearTimeout(timeoutRef);
  }
}

/**
 * Hook for managing focus events with intelligent reconnection
 * @param options Configuration options
 * @returns Cleanup function
 */
export function useIntelligentFocusHandler(options: FocusHandlerOptions = {}) {
  const handler = createIntelligentFocusHandler(options);

  return () => {
    window.removeEventListener('focus', handler);
  };
}
