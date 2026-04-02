import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../contexts/ConfigContext';
import { useSession } from '../contexts/SessionContext';
import { useLockedHost } from '../contexts/LockedHostContext';
import { HostConfig } from '../interfaces/Host';
import { authService } from '../services/authService';
import { getPasswordKey, getApiKeyKey } from '../utils/secretKeys';
import { LoginPrefill } from '../pages/Login/Login';
import { decodeToken } from '../utils/tokenUtils';
import { devopsService } from '../services/devops';
import { getActiveHostId } from '../utils/activeHost';

export const StartupGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const config = useConfig();
    const { session, setSession } = useSession();
    const { isLocked, hostUrl, lockedHostname, username: lockedUsername, password: lockedPassword, clearLockedPassword } = useLockedHost();
    const navigate = useNavigate();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const redirectToOnboarding = (reason: string) => {
            console.log('[StartupGuard] → onboarding:', reason);
            if (cancelled) return;
            navigate('/onboarding', { replace: true });
        };

        const redirectToLogin = (reason: string, host?: HostConfig) => {
            console.log('[StartupGuard] → login:', reason);
            if (cancelled) return;
            if (host) {
                const prefill: LoginPrefill = { hostId: host.id };
                navigate('/login', { replace: true, state: { prefill } });
            } else {
                navigate('/login', { replace: true });
            }
        };

        const checkConfig = async () => {
            try {
                const buildSession = (host: HostConfig, tokenPayload?: ReturnType<typeof decodeToken>) => ({
                    serverUrl: host.baseUrl,
                    hostname: host.hostname,
                    username: host.username,
                    authType: host.authType,
                    hostId: host.id,
                    connectedAt: new Date().toISOString(),
                    tokenPayload: tokenPayload ?? undefined,
                    hardwareInfo: host.hardwareInfo,
                });

                const hydrateCredentials = async (host: HostConfig) => {
                    const secretKey = host.authType === 'credentials'
                        ? getPasswordKey(host.hostname)
                        : getApiKeyKey(host.hostname);
                    const secret = await config.getSecret(secretKey);

                    if (!secret) return false;

                    authService.setCredentials(host.hostname, {
                        url: host.baseUrl,
                        username: host.authType === 'credentials' ? host.username : '',
                        password: host.authType === 'credentials' ? secret : '',
                        email: host.authType === 'credentials' ? host.username : '',
                        api_key: host.authType === 'api_key' ? secret : '',
                    });

                    return true;
                };

                const hasValidStoredToken = (host: HostConfig) => {
                    const token = authService.getToken(host.hostname);
                    const tokenPayload = token ? decodeToken(token) ?? undefined : undefined;
                    if (!tokenPayload?.exp) return null;
                    if ((tokenPayload.exp * 1000) <= Date.now()) return null;
                    return tokenPayload;
                };

                // ── Locked-host auto-login (all three env vars set) ───────────────
                if (isLocked && lockedHostname) {
                    const savedHosts = (await config.get<HostConfig[]>('hosts')) ?? [];
                    const savedHost = savedHosts.find((host) => host.hostname === lockedHostname);
                    const loginUsername = lockedUsername ?? savedHost?.username ?? '';
                    const savedPassword = await config.getSecret(getPasswordKey(lockedHostname));
                    const loginPassword = lockedPassword ?? savedPassword;

                    if (!loginUsername || !loginPassword) {
                        if (session) {
                            if (!cancelled) setIsReady(true);
                            return;
                        }
                        redirectToLogin('locked mode — no auto-login credentials');
                        return;
                    }

                    if (session) {
                        // Already have a session — proceed immediately
                        if (!cancelled) setIsReady(true);
                        return;
                    }
                    console.log('[StartupGuard] locked mode — attempting auto-login for', lockedHostname);
                    try {
                        authService.setCredentials(lockedHostname, {
                            url: hostUrl!,
                            username: loginUsername,
                            password: loginPassword,
                            email: loginUsername,
                            api_key: '',
                        });
                        await authService.forceReauth(lockedHostname);

                        let hardwareInfo;
                        try { hardwareInfo = await devopsService.config.getHardwareInfo(lockedHostname); } catch { /* non-fatal */ }

                        authService.currentHostname = lockedHostname;
                        const token = authService.getToken(lockedHostname);
                        const tokenPayload = token ? decodeToken(token) ?? undefined : undefined;

                        if (!cancelled) {
                            setSession({
                                serverUrl: hostUrl!,
                                hostname: lockedHostname,
                                username: loginUsername,
                                authType: 'credentials',
                                hostId: `locked:${lockedHostname}`,
                                connectedAt: new Date().toISOString(),
                                tokenPayload,
                                hardwareInfo,
                            });
                            setIsReady(true);
                        }
                    } catch (error) {
                        console.error('[StartupGuard] locked auto-login failed:', error);
                        clearLockedPassword();
                        await config.removeSecret(getPasswordKey(lockedHostname));
                        await config.flushSecrets();
                        redirectToLogin('locked auto-login failed');
                    }
                    return;
                }

                // ── Locked-host without password — go straight to login ───────────
                if (isLocked) {
                    if (session) {
                        if (!cancelled) setIsReady(true);
                        return;
                    }
                    redirectToLogin('locked mode — no auto-login credentials');
                    return;
                }

                // ── Normal multi-host flow ────────────────────────────────────────
                const hosts = await config.get<HostConfig[]>('hosts');

                if (!Array.isArray(hosts) || hosts.length === 0) {
                    redirectToOnboarding('no hosts');
                    return;
                }

                // If there's already an active session (e.g. just set by Onboarding),
                // validate the host still exists in config and proceed without re-selecting.
                if (session) {
                    const sessionHost = hosts.find((h) => h.hostname === session.hostname);
                    if (sessionHost) {
                        console.log('[StartupGuard] reusing active session for', session.hostname);
                        authService.currentHostname = session.hostname;
                        if (!cancelled) setIsReady(true);
                        return;
                    }
                    console.log('[StartupGuard] active session host removed from config, re-selecting');
                }

                const activeHostId = getActiveHostId();
                const activeHost = activeHostId ? hosts.find((h) => h.id === activeHostId) : undefined;

                if (activeHost) {
                    const tokenPayload = hasValidStoredToken(activeHost);
                    if (tokenPayload) {
                        console.log('[StartupGuard] restoring active host from stored token', activeHost.hostname);
                        await hydrateCredentials(activeHost);
                        authService.currentHostname = activeHost.hostname;
                        if (!cancelled) {
                            setSession(buildSession(activeHost, tokenPayload));
                            setIsReady(true);
                        }
                        return;
                    }
                }

                // Prefer the active host, then the default host, then most recently used
                const defaultHost = hosts.find((h) => h.isDefault);
                const sorted = [...hosts].sort((a, b) =>
                    (b.lastUsed ?? '').localeCompare(a.lastUsed ?? '')
                );
                const hostCandidates = [activeHost, defaultHost, ...sorted].filter(
                    (candidate, index, list): candidate is HostConfig =>
                        !!candidate && list.findIndex((item) => item?.id === candidate.id) === index
                );
                const host = hostCandidates[0];

                console.log('[StartupGuard] checking host', host.hostname, 'keepLoggedIn=', host.keepLoggedIn);

                const existingTokenPayload = hasValidStoredToken(host);
                if (existingTokenPayload) {
                    console.log('[StartupGuard] restoring session from stored token for', host.hostname);
                    await hydrateCredentials(host);
                    authService.currentHostname = host.hostname;
                    if (!cancelled) {
                        setSession(buildSession(host, existingTokenPayload));
                        setIsReady(true);
                    }
                    return;
                }

                if (host.keepLoggedIn === false) {
                    redirectToLogin('keepLoggedIn is false', host);
                    return;
                }

                // keepLoggedIn is true or undefined (old entries) — load secret
                const secretKey = host.authType === 'credentials'
                    ? getPasswordKey(host.hostname)
                    : getApiKeyKey(host.hostname);
                const secret = await config.getSecret(secretKey);

                if (!secret) {
                    redirectToLogin('secret missing', host);
                    return;
                }

                authService.setCredentials(host.hostname, {
                    url: host.baseUrl,
                    username: host.authType === 'credentials' ? host.username : '',
                    password: host.authType === 'credentials' ? secret : '',
                    email: host.authType === 'credentials' ? host.username : '',
                    api_key: host.authType === 'api_key' ? secret : '',
                });

                if (!cancelled) {
                    authService.currentHostname = host.hostname;

                    const token = authService.getToken(host.hostname);
                    const tokenPayload = token ? decodeToken(token) ?? undefined : undefined;

                    if (!tokenPayload) {
                        console.warn('[StartupGuard] Failed to decode token, session will have limited functionality');
                    }

                    setSession(buildSession(host, tokenPayload));
                    console.log('[StartupGuard] ready');
                    setIsReady(true);
                }
            } catch (error) {
                console.error('[StartupGuard] error:', error);
                if (isLocked) redirectToLogin('exception in locked mode');
                else redirectToOnboarding('exception');
            }
        };

        checkConfig();

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!isReady) return null;
    return <>{children}</>;
};
