import { useRef, useState, useEffect, useCallback } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import LogService from '@/services/LogService';

export const useNotificationWrapper = (
  channelFilter: string,
  zIndex: number,
  setOpenState?: (open: boolean) => void
) => {
  const { state, togglePanel } = useNotifications();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);

  const applyOpenState = useCallback(
    (open: boolean) => {
      void LogService.debug('useNotificationWrapper', 'applyOpenState', {
        channel: channelFilter,
        open,
        hasExternalHandler: Boolean(setOpenState),
      });
      if (setOpenState) {
        setOpenState(open);
      } else {
        togglePanel(channelFilter, open);
      }
    },
    [setOpenState, togglePanel, channelFilter]
  );

  // Portal container effect
  useEffect(() => {
    const div = document.createElement('div');
    div.className = 'pointer-events-none fixed top-0 left-0 z-[1000] h-0 w-0 overflow-visible';
    div.setAttribute('data-channel', channelFilter);
    void LogService.debug('useNotificationWrapper', 'create portal container', {
      channel: channelFilter,
    });

    const currentWrapper = wrapperRef.current;
    if (currentWrapper) {
      currentWrapper.appendChild(div);
      setPortalContainer(div);
    }

    return () => {
      if (div && div.parentElement === currentWrapper) {
        currentWrapper?.removeChild(div);
      }
    };
  }, [channelFilter]);

  // Click outside effect
  useEffect(() => {
    if (!state.openPanels[channelFilter]) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        panelRef.current &&
        !panelRef.current.contains(target)
      ) {
        void LogService.debug('useNotificationWrapper', 'click outside detected', {
          channel: channelFilter,
        });
        applyOpenState(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [state.openPanels, channelFilter, applyOpenState]);

  // Position update effect
  useEffect(() => {
    if (state.openPanels[channelFilter] && buttonRef.current && portalContainer) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const margin = 8;

      portalContainer.style.top = `${buttonRect.y + buttonRect.height - 5}px`;
      portalContainer.style.zIndex = `${zIndex}`;

      const rightPosition = Math.max(margin, window.innerWidth - buttonRect.x + buttonRect.width);
      portalContainer.style.right = `${rightPosition}px`;

      const minLeft = margin;
      const maxRight = window.innerWidth - minLeft;
      if (buttonRect.right > maxRight) {
        portalContainer.style.right = `${minLeft}px`;
      }

      void LogService.debug('useNotificationWrapper', 'position update', {
        channel: channelFilter,
        top: portalContainer.style.top,
        right: portalContainer.style.right,
      });
    }
  }, [state.openPanels, channelFilter, portalContainer, zIndex]);

  return {
    wrapperRef,
    buttonRef,
    panelRef,
    portalContainer,
    state,
    togglePanel: applyOpenState,
    isOpen: !!state.openPanels[channelFilter],
    unreadCount: state.unreadCount[channelFilter] || 0,
  };
};
