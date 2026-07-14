import { invoke } from '@tauri-apps/api/core';
import { isTauri } from '@tauri-apps/api/core';

export interface BinaryServiceStatus {
  available: boolean;
  local_version: string | null;
  latest_version: string | null;
  binary_path: string;
  error: string | null;
}

let cachedStatus: BinaryServiceStatus | null = null;

export async function getBinaryServiceStatus(): Promise<BinaryServiceStatus> {
  if (!isTauri()) {
    console.warn('[BinaryService] Not running in Tauri, skipping binary check');
    return {
      available: false,
      local_version: null,
      latest_version: null,
      binary_path: '',
      error: 'Not running in Tauri',
    };
  }

  if (cachedStatus) {
    console.log('[BinaryService] Returning cached status:', cachedStatus);
    return cachedStatus;
  }

  console.log('[BinaryService] Calling ensure_binary_service Tauri command...');

  try {
    const status = await invoke<BinaryServiceStatus>('ensure_binary_service');
    console.log('[BinaryService] Tauri command returned:', status);
    cachedStatus = status;
    return status;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error('[BinaryService] Tauri command failed:', error);
    const fallback: BinaryServiceStatus = {
      available: false,
      local_version: null,
      latest_version: null,
      binary_path: '',
      error,
    };
    cachedStatus = fallback;
    return fallback;
  }
}

export function invalidateCache(): void {
  cachedStatus = null;
}