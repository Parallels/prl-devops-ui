import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../contexts/ConfigContext';
import { useSession } from '../contexts/SessionContext';
import { HostConfig } from '../interfaces/Host';
import { authService } from '../services/authService';
import { getPasswordKey, getApiKeyKey } from '../utils/secretKeys';
import { OnboardingPrefill } from '../pages/Onboarding/Onboarding';

export const StartupGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const config = useConfig();
    const { setSession } = useSession();
    const navigate = useNavigate();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const redirectToOnboarding = (reason: string, host?: HostConfig) => {
            console.log('[StartupGuard] → onboarding:', reason);
            if (cancelled) return;
            const prefill: OnboardingPrefill | undefined = host
                ? { serverUrl: host.baseUrl, authType: host.authType, username: host.username, hostId: host.id }
                : undefined;
            navigate('/onboarding', { replace: true, state: prefill ? { prefill } : undefined });
        };

        const checkConfig = async () => {
            try {
                const hosts = await config.get<HostConfig[]>('hosts');

                if (!Array.isArray(hosts) || hosts.length === 0) {
                    redirectToOnboarding('no hosts');
                    return;
                }

                // Prefer the default host, fall back to most recently used
                const defaultHost = hosts.find((h) => h.isDefault);
                const sorted = [...hosts].sort((a, b) =>
                    (b.lastUsed ?? '').localeCompare(a.lastUsed ?? '')
                );
                const host = defaultHost ?? sorted[0];

                console.log('[StartupGuard] checking host', host.hostname, 'keepLoggedIn=', host.keepLoggedIn);

                if (host.keepLoggedIn === false) {
                    redirectToOnboarding('keepLoggedIn is false', host);
                    return;
                }

                // keepLoggedIn is true or undefined (old entries) — load secret
                const secretKey = host.authType === 'credentials'
                    ? getPasswordKey(host.hostname)
                    : getApiKeyKey(host.hostname);
                const secret = await config.getSecret(secretKey);

                if (!secret) {
                    redirectToOnboarding('secret missing', host);
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
                    // Set session data for the connected host
                    authService.currentHostname = host.hostname;
                    setSession({
                        serverUrl: host.baseUrl,
                        hostname: host.hostname,
                        username: host.username,
                        authType: host.authType,
                        hostId: host.id,
                        connectedAt: new Date().toISOString(),
                    });
                    console.log('[StartupGuard] ready');
                    setIsReady(true);
                }
            } catch (error) {
                console.error('[StartupGuard] error:', error);
                redirectToOnboarding('exception');
            }
        };

        checkConfig();

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!isReady) return null;
    return <>{children}</>;
};
