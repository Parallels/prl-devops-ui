import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@prl/ui-kit';
import { useEventsHub } from '@/contexts/EventsHubContext';
import { useSession } from '@/contexts/SessionContext';
import { WebSocketState } from '@/types/WebSocket';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';

// How long to wait before showing the overlay after a disconnect is detected.
// This prevents a flash during the normal initial connection sequence.
const SHOW_DELAY_MS = 2500;

/**
 * Full-screen glass overlay shown when the WebSocket connection to the
 * selected host is not open. Appears after a short grace period so the
 * normal initial connection sequence doesn't trigger it. Disappears
 * automatically when the connection is restored or the session is cleared.
 */
export const HostOfflineOverlay: React.FC = () => {
  const { connectionState } = useEventsHub();
  const { isConnected: hasSession } = useSession();
  const { themeColor } = useSystemSettings();

  const [show, setShow] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const isOnline = connectionState === WebSocketState.OPEN;

    if (isOnline || !hasSession) {
      // Clear any pending timer and hide immediately
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setShow(false);
    } else {
      // Offline + has session: wait before showing so a brief CONNECTING
      // phase during initial load or reconnect doesn't flash the overlay.
      if (!timerRef.current) {
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          setShow(true);
        }, SHOW_DELAY_MS);
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [connectionState, hasSession]);

  if (!show) return null;

  const isReconnecting = connectionState === WebSocketState.CONNECTING;

  return (
    <div className="fixed inset-0 z-[49] flex flex-col items-center justify-center backdrop-blur-md bg-white/60 dark:bg-neutral-900/70">
      <div className="flex flex-col items-center gap-5 rounded-2xl border border-neutral-200/80 bg-white/80 px-10 py-8 shadow-2xl dark:border-neutral-700/60 dark:bg-neutral-900/80">
        <Loader
          variant="spinner"
          spinnerVariant="segments"
          size="lg"
          color={themeColor}
          overlay={false}
        />
        <div className="text-center space-y-1">
          <p className="text-base font-semibold text-neutral-800 dark:text-neutral-100">
            Lost Connection
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {isReconnecting ? 'Attempting to reconnect…' : 'Connection to the host was lost.'}
          </p>
        </div>
      </div>
    </div>
  );
};
