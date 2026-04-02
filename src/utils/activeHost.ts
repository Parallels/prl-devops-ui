const ACTIVE_HOST_STORAGE_KEY = 'active_host_id';

export const getActiveHostId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACTIVE_HOST_STORAGE_KEY);
};

export const setActiveHostId = (hostId: string): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ACTIVE_HOST_STORAGE_KEY, hostId);
};

export const clearActiveHostId = (): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ACTIVE_HOST_STORAGE_KEY);
};
