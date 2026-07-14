import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getBinaryServiceStatus, BinaryServiceStatus as BinaryServiceStatusType } from '../services/BinaryService';

interface BinaryServiceContextType {
  isAvailable: boolean;
  status: BinaryServiceStatusType | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const BinaryServiceContext = createContext<BinaryServiceContextType | null>(null);

export const BinaryServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<BinaryServiceStatusType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStatus = useCallback(async () => {
    console.log('[BinaryServiceContext] Loading binary service status...');
    try {
      const result = await getBinaryServiceStatus();
      console.log('[BinaryServiceContext] Status loaded:', result);
      setStatus(result);
    } catch (err) {
      console.warn('[BinaryService] Failed to initialize:', err);
      setStatus({
        available: false,
        local_version: null,
        latest_version: null,
        binary_path: '',
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getBinaryServiceStatus();
      setStatus(result);
    } catch (err) {
      console.warn('[BinaryService] Refresh failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: BinaryServiceContextType = {
    isAvailable: status?.available ?? false,
    status,
    isLoading,
    refresh,
  };

  return (
    <BinaryServiceContext.Provider value={value}>
      {children}
    </BinaryServiceContext.Provider>
  );
};

export const useBinaryService = (): BinaryServiceContextType => {
  const context = useContext(BinaryServiceContext);
  if (!context) {
    throw new Error('useBinaryService must be used within BinaryServiceProvider');
  }
  return context;
};