import React, { useCallback, useEffect, useMemo } from 'react';
import classNames from 'classnames';
import NotificationPanel from './NotificationPanel';
import { useNotificationWrapper } from '../../hooks/useNotificationWrapper';
import { Popover } from '@base-ui-components/react/popover';
import { type ButtonColor, type ButtonVariant } from '../Controls/Button';
import { useLayout } from '@/contexts/LayoutContext';
import { type LayoutModal } from '@/interfaces/LayoutContext';
import { useNotifications } from '@/contexts/NotificationContext';
import {
  NotificationPopoverProvider,
  type NotificationPopoverContextValue,
} from './NotificationPopoverContext';
import LogService from '@/services/LogService';
import type { ComponentPropsWithoutRef, MutableRefObject } from 'react';
import Badge from '../Controls/Badge';
import { renderIcon } from '@/utils/icon';
import type { IconSize } from '../Controls/CustomIcon';
import { getButtonColorClasses } from '../Controls/Theme';
import { iconAccentHover, iconAccentRing } from '../Controls/ButtonTypes';

interface NotificationWrapperProps {
  channelFilter: string;
  variant?: 'header' | 'card';
  buttonVariant?: ButtonVariant;
  buttonClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  activeColor?: string;
  onlyDot?: boolean;
  hideOnScroll?: boolean;
  animation?: 'slide-down' | 'slide-up' | 'fade';
  zIndex?: number;
  layoutKey?: LayoutModal;
  buttonColor?: ButtonColor;
}

export const NotificationWrapper: React.FC<NotificationWrapperProps> = ({
  channelFilter,
  variant = 'header',
  buttonVariant = 'ghost',
  buttonClassName = '',
  onlyDot = false,
  size = 'md',
  animation = 'slide-down',
  zIndex = 1000,
  layoutKey,
  buttonColor = 'theme',
}) => {
  const layout = useLayout();
  const { togglePanel: togglePanelContext } = useNotifications();
  const layoutEnabled = Boolean(layoutKey);

  const handleOpenState = useCallback(
    (open: boolean) => {
      void LogService.debug('NotificationWrapper', 'handleOpenState', {
        channel: channelFilter,
        open,
        layoutKey,
      });
      togglePanelContext(channelFilter, open);
      if (layoutEnabled) {
        layout.setModalState(layoutKey!, open);
      }
    },
    [togglePanelContext, channelFilter, layoutEnabled, layout, layoutKey]
  );

  const {
    wrapperRef,
    buttonRef,
    panelRef,
    isOpen,
    unreadCount,
    togglePanel: requestOpenState,
  } = useNotificationWrapper(channelFilter, zIndex, handleOpenState);

  const layoutOpen = layoutEnabled ? layout.isModalOpen(layoutKey!) : undefined;
  const resolvedIsOpen = layoutEnabled ? Boolean(layoutOpen) : isOpen;

  useEffect(() => {
    if (!layoutEnabled || typeof layoutOpen !== 'boolean') {
      return;
    }
    if (layoutOpen !== isOpen) {
      void LogService.debug('NotificationWrapper', 'sync layout->context', {
        channel: channelFilter,
        layoutOpen,
        contextOpen: isOpen,
      });
      togglePanelContext(channelFilter, layoutOpen);
    }
  }, [layoutEnabled, layoutOpen, isOpen, togglePanelContext, channelFilter]);

  useEffect(() => {
    void LogService.debug('NotificationWrapper', 'resolvedIsOpen changed', {
      channel: channelFilter,
      resolvedIsOpen,
      layoutKey: layoutEnabled ? layoutKey : null,
      contextOpen: isOpen,
      layoutOpen,
    });
  }, [resolvedIsOpen, channelFilter, layoutEnabled, layoutKey, isOpen, layoutOpen]);

  const contextValue = useMemo<NotificationPopoverContextValue>(
    () => ({
      channel: channelFilter,
      setOpen: handleOpenState,
      isOpen: resolvedIsOpen,
    }),
    [channelFilter, resolvedIsOpen, handleOpenState]
  );

  const showBadge = unreadCount > 0;
  const showDot = showBadge && onlyDot;
  const showCount = showBadge && !onlyDot;

  const sizeTokens: Record<'sm' | 'md' | 'lg', { button: string; icon: string }> = {
    sm: { button: 'h-8 w-8 text-sm', icon: 'h-5 w-5' },
    md: { button: 'h-10 w-10 text-base', icon: 'h-6 w-6' },
    lg: { button: 'h-12 w-12 text-lg', icon: 'h-7 w-7' },
  };

  const sizeConfig = sizeTokens[size] ?? sizeTokens.md;

  const iconSizeMap: Record<'sm' | 'md' | 'lg', IconSize> = {
    sm: 'sm',
    md: 'md',
    lg: 'lg',
  };

  const accentRingClass = iconAccentRing[buttonColor] ?? iconAccentRing.theme;
  const accentHoverClass = iconAccentHover[buttonColor] ?? iconAccentHover.theme;
  const paletteClass = getButtonColorClasses(buttonVariant, buttonColor);

  const buttonClasses = classNames(
    'inline-flex items-center justify-center select-none transition-colors duration-150 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
    sizeConfig.button,
    paletteClass,
    'bg-transparent text-inherit hover:bg-transparent focus-visible:ring-2 focus-visible:ring-offset-2',
    accentRingClass,
    accentHoverClass,
    buttonClassName
  );

  const iconNode = renderIcon(
    'Notification',
    iconSizeMap[size] ?? 'md',
    classNames('flex-shrink-0', sizeConfig.icon)
  );

  return (
    <NotificationPopoverProvider value={contextValue}>
      <div
        ref={wrapperRef}
        data-channel={channelFilter}
        className="relative inline-flex items-center justify-center"
      >
        <Popover.Root
          open={resolvedIsOpen}
          onOpenChange={(next) => {
            void LogService.debug('NotificationWrapper', 'onOpenChange', {
              channel: channelFilter,
              next,
              resolvedIsOpen,
            });
            requestOpenState(next);
          }}
        >
          <div className="relative">
            <Popover.Trigger
              render={(triggerProps) => {
                const {
                  ref: triggerRef,
                  className: triggerClassName,
                  style: triggerStyle,
                  onClick: triggerOnClick,
                  onPointerDown,
                  onPointerUp,
                  onKeyDown,
                  onKeyUp,
                  ...restTriggerProps
                } = triggerProps as ComponentPropsWithoutRef<'button'> & {
                  ref?:
                  | MutableRefObject<HTMLButtonElement | null>
                  | ((node: HTMLButtonElement | null) => void);
                };

                const assignRef = (node: HTMLButtonElement | null) => {
                  if (typeof triggerRef === 'function') {
                    triggerRef(node);
                  } else if (
                    triggerRef &&
                    typeof triggerRef === 'object' &&
                    'current' in triggerRef
                  ) {
                    triggerRef.current = node;
                  }
                  buttonRef.current = node;
                };

                void LogService.debug('NotificationWrapper', 'trigger render', {
                  channel: channelFilter,
                  resolvedIsOpen,
                });

                return (
                  <button
                    {...restTriggerProps}
                    ref={assignRef}
                    style={triggerStyle}
                    className={classNames(
                      buttonClasses,
                      triggerClassName,
                      resolvedIsOpen
                        ? 'data-[open=true]:text-blue-600 data-[open=true]:dark:text-blue-300'
                        : ''
                    )}
                    data-open={resolvedIsOpen}
                    aria-expanded={resolvedIsOpen}
                    aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                    title={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                    onPointerDown={(event) => {
                      onPointerDown?.(event);
                    }}
                    onPointerUp={(event) => {
                      onPointerUp?.(event);
                    }}
                    onKeyDown={(event) => {
                      onKeyDown?.(event);
                    }}
                    onKeyUp={(event) => {
                      onKeyUp?.(event);
                    }}
                    onClick={(event) => {
                      triggerOnClick?.(event);
                      if (event.defaultPrevented) {
                        return;
                      }
                      const nextState = !resolvedIsOpen;
                      void LogService.debug('NotificationWrapper', 'manual toggle via trigger', {
                        channel: channelFilter,
                        next: nextState,
                      });
                      handleOpenState(nextState);
                    }}
                  >
                    {iconNode}
                    <span className="sr-only relative">Notifications</span>
                    {showBadge && (
                      <span className="pointer-events-none absolute top-0 right-1">
                        <Badge
                          dot={showDot}
                          count={showCount ? unreadCount : undefined}
                          variant="danger"
                        />
                      </span>
                    )}
                  </button>
                );
              }}
            >
              {null}
            </Popover.Trigger>
          </div>
          <Popover.Portal>
            <Popover.Positioner
              sideOffset={2}
              align="end"
              collisionPadding={2}
              className="z-[1000]"
            >
              <Popover.Popup>
                <NotificationPanel
                  channelFilter={channelFilter}
                  variant={variant}
                  ref={panelRef}
                  animation={animation}
                />
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </NotificationPopoverProvider>
  );
};
