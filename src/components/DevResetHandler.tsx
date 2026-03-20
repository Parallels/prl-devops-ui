import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../contexts/ConfigContext';
import { useSession } from '../contexts/SessionContext';
import { authService } from '../services/authService';
import { HostConfig } from '../interfaces/Host';
import { getPasswordKey, getApiKeyKey } from '../utils/secretKeys';

/**
 * Developer utility: press Ctrl+Shift+R to wipe all saved hosts and return
 * to the onboarding screen. Useful for testing the first-run flow without
 * manually clearing app storage.
 *
 * This component renders nothing; it only attaches a global keydown listener.
 * Mount it inside the router tree (so useNavigate is available) but outside
 * any page component.
 */
export const DevResetHandler: React.FC = () => {
  const config = useConfig();
  const { clearSession } = useSession();
  const navigate = useNavigate();
  const [banner, setBanner] = useState(false);

  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      if (!(e.ctrlKey && e.shiftKey && e.key === 'R')) return;

      // Prevent browser hard-reload from also firing
      e.preventDefault();

      const hosts = (await config.get<HostConfig[]>('hosts')) ?? [];

      // Remove stored secrets for every host
      for (const h of hosts) {
        await config.removeSecret(getPasswordKey(h.hostname));
        await config.removeSecret(getApiKeyKey(h.hostname));
      }
      await config.flushSecrets();

      // Clear host list and persist
      await config.set('hosts', []);
      await config.save();

      authService.logout();
      clearSession();

      setBanner(true);
      setTimeout(() => setBanner(false), 2500);

      navigate('/onboarding', { replace: true });
    };

    window.addEventListener('keydown', (e) => { void handler(e); });
    return () => window.removeEventListener('keydown', (e) => { void handler(e); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!banner) return null;

  return (
    <div className="fixed left-1/2 top-4 z-[9999] -translate-x-1/2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-xl">
      Dev reset — all hosts cleared
    </div>
  );
};
