import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./analytics/trackEvent', () => ({ trackEvent: vi.fn(), classifyApiFailure: vi.fn() }));

import { AuthService } from './authService';

const AUTH_STORAGE_KEY = 'auth_tokens';
const HOST = 'prl-devops-orchestrator.myparallels.com';
const RUNTIME_URL = 'https://prl-devops-orchestrator.myparallels.com';

/** Seed the persisted token store the way a completed login leaves it. */
const seedStoredToken = (url: string) => {
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify([[HOST, { hostname: HOST, url, token: 't', expires_at: String(Date.now() + 3_600_000) }]])
  );
};

describe('AuthService base URL resolution', () => {
  beforeEach(() => {
    localStorage.clear();
    delete window.__ENV__;
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_DEVOPS_API_URL', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    localStorage.clear();
    delete window.__ENV__;
  });

  it('uses the credentials registered for the host during this session', async () => {
    window.__ENV__ = { VITE_DEFAULT_HOST_URL: 'https://should-not-be-used.example' };
    const service = new AuthService();

    service.setCredentials(HOST, { url: `${RUNTIME_URL}/`, username: 'u', password: 'p', email: 'u', api_key: '' });

    await expect(service.getHostUrl(HOST)).resolves.toBe(RUNTIME_URL);
  });

  it('reuses the base URL persisted with the last login after a reload', async () => {
    seedStoredToken(RUNTIME_URL);
    // A brand new instance models a page reload: the in-memory cache is empty.
    const service = new AuthService();

    await expect(service.getHostUrl(HOST)).resolves.toBe(RUNTIME_URL);
  });

  it('repairs the legacy form where the login URL was stored instead of the base URL', async () => {
    seedStoredToken(`${RUNTIME_URL}/api/v1/auth/token`);
    const service = new AuthService();

    await expect(service.getHostUrl(HOST)).resolves.toBe(RUNTIME_URL);
  });

  it('falls back to the runtime configured host when the host is unknown to this browser', async () => {
    // The staging case: Helm runtimeEnv.defaultHostUrl, no prior login stored.
    window.__ENV__ = { VITE_DEFAULT_HOST_URL: RUNTIME_URL };
    const service = new AuthService();

    await expect(service.getHostUrl(HOST)).resolves.toBe(RUNTIME_URL);
  });

  it('keeps requests same-origin in dev so the Vite proxy owns /api', async () => {
    vi.stubEnv('DEV', true);
    const service = new AuthService();

    await expect(service.getHostUrl(HOST)).resolves.toBe('');
  });

  it('refuses to invent an address instead of calling the visitor’s own localhost', async () => {
    const service = new AuthService();

    await expect(service.getHostUrl('never-seen-host.example')).rejects.toThrow(/Refusing to fall back to a local address/);
  });
});
