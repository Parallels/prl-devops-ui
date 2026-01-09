/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaInfoCircle,
} from 'react-icons/fa';
import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown';
import { Toast as ToastType, ToastAction } from '../../types/Toast';
import { getToastTimestamp } from '../../utils/toastUtils';
import IconButton from '../../controls/IconButton';
import Button from '../../controls/Button';
import type { ButtonColor } from '../../controls/Button';
import type { IconName } from '@/types/Icon';
import type { Components as MarkdownComponents } from 'react-markdown';
import { Progress } from '../../controls';

interface ToastProps {
  toast: ToastType;
  onRemove: (id: string) => void;
  duration?: number;
}

const toneMap: Record<
  ToastType['type'],
  {
    border: string;
    iconBg: string;
    iconText: string;
    progress: string;
    accent: string;
    indeterminatePrimary: string;
    indeterminateSecondary: string;
  }
> = {
  success: {
    border: 'border-emerald-400',
    iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
    iconText: 'text-emerald-600 dark:text-emerald-300',
    progress: 'bg-emerald-500 dark:bg-emerald-400',
    accent: 'text-emerald-500 dark:text-emerald-300',
    indeterminatePrimary: 'bg-emerald-400/40 dark:bg-emerald-400/30',
    indeterminateSecondary: 'bg-emerald-300/30 dark:bg-emerald-300/20',
  },
  error: {
    border: 'border-rose-400',
    iconBg: 'bg-rose-100 dark:bg-rose-500/20',
    iconText: 'text-rose-600 dark:text-rose-300',
    progress: 'bg-rose-500 dark:bg-rose-400',
    accent: 'text-rose-500 dark:text-rose-300',
    indeterminatePrimary: 'bg-rose-400/50 dark:bg-rose-400/30',
    indeterminateSecondary: 'bg-rose-300/30 dark:bg-rose-300/20',
  },
  warning: {
    border: 'border-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-500/20',
    iconText: 'text-amber-600 dark:text-amber-300',
    progress: 'bg-amber-500 dark:bg-amber-400',
    accent: 'text-amber-500 dark:text-amber-300',
    indeterminatePrimary: 'bg-amber-400/50 dark:bg-amber-400/30',
    indeterminateSecondary: 'bg-amber-300/30 dark:bg-amber-300/20',
  },
  info: {
    border: 'border-sky-400',
    iconBg: 'bg-sky-100 dark:bg-sky-500/20',
    iconText: 'text-sky-600 dark:text-sky-300',
    progress: 'bg-sky-500 dark:bg-sky-400',
    accent: 'text-sky-500 dark:text-sky-300',
    indeterminatePrimary: 'bg-sky-400/40 dark:bg-sky-400/30',
    indeterminateSecondary: 'bg-sky-300/25 dark:bg-sky-300/20',
  },
};

const iconMap: Record<ToastType['type'], React.ComponentType<{ className?: string }>> = {
  success: FaCheckCircle,
  error: FaExclamationCircle,
  warning: FaExclamationTriangle,
  info: FaInfoCircle,
};

const actionColorMap: Record<NonNullable<ToastAction['variant']>, ButtonColor> = {
  primary: 'blue',
  secondary: 'slate',
  danger: 'rose',
};

const markdownComponents: MarkdownComponents = {
  p: ({ children, ...props }) => (
    <p className="text-sm leading-6 text-neutral-800 dark:text-neutral-200" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul
      className="ml-5 list-disc text-sm leading-6 text-neutral-800 dark:text-neutral-200"
      {...props}
    >
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol
      className="ml-5 list-decimal text-sm leading-6 text-neutral-800 dark:text-neutral-200"
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="mt-1 first:mt-0" {...props}>
      {children}
    </li>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-neutral-900 dark:text-neutral-100" {...props}>
      {children}
    </strong>
  ),
  code: ({ children, ...props }) => (
    <code
      className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[0.75rem] text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
      {...props}
    >
      {children}
    </code>
  ),
  pre: ({ children, ...props }) => (
    <pre
      className="overflow-x-auto rounded-lg bg-neutral-100 px-4 py-3 text-xs leading-2 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
      {...props}
    >
      {children}
    </pre>
  ),
  h1: ({ children, ...props }) => (
    <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100" {...props}>
      {children}
    </h4>
  ),
  h5: ({ children, ...props }) => (
    <h5
      className="text-xs font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-300"
      {...props}
    >
      {children}
    </h5>
  ),
  h6: ({ children, ...props }) => (
    <h6
      className="text-xs font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-300"
      {...props}
    >
      {children}
    </h6>
  ),
  a: ({ children, ...props }) => (
    <a
      className="font-medium text-blue-600 underline hover:text-blue-500 dark:text-blue-400"
      {...props}
    >
      {children}
    </a>
  ),
};

const MARKDOWN_CONTAINER = 'space-y-2';
const DETAILS_SCROLL_CONTAINER = 'max-h-[50vh] overflow-y-auto pr-1 space-y-2';

export const Toast: React.FC<ToastProps> = ({ toast, onRemove, duration = 5000 }) => {
  const resolvedDuration = toast.autoCloseDuration ?? duration;
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const remainingTimeRef = useRef<number>(resolvedDuration);
  const startTimeRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(getToastTimestamp(toast));

  useEffect(() => {
    const animationTimeout = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    return () => clearTimeout(animationTimeout);
  }, []);

  useEffect(() => {
    const currentTimestamp = getToastTimestamp(toast);

    if (currentTimestamp > lastUpdateRef.current) {
      lastUpdateRef.current = currentTimestamp;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      remainingTimeRef.current = resolvedDuration;
      startTimeRef.current = null;

      if (isLeaving) {
        setIsLeaving(false);
      }
    }
  }, [toast, isLeaving, resolvedDuration]);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const isProgressBlockingClose =
      toast.progress &&
      toast.progress.percent < 100 &&
      toast.progress.status !== 'completed' &&
      !toast.progress.indeterminate;

    if (
      toast.autoClose !== false &&
      !isProgressBlockingClose &&
      resolvedDuration > 0 &&
      !isHovered
    ) {
      startTimeRef.current = Date.now();

      timerRef.current = setTimeout(() => {
        handleClose(false);
      }, remainingTimeRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [resolvedDuration, toast.autoClose, toast.progress, toast._updateTimestamp, isHovered]);

  const tone = toneMap[toast.type] ?? toneMap.info;
  const IconComponent = iconMap[toast.type] ?? iconMap.info;

  const isProgressBlockingClose =
    toast.progress &&
    toast.progress.percent < 100 &&
    toast.progress.status !== 'completed' &&
    !toast.progress.indeterminate;

  const isCloseDisabled = toast.dismissible === false || isProgressBlockingClose;

  const toastClasses = classNames(
    'pointer-events-auto w-full max-w-sm translate-x-6 overflow-hidden rounded-xl border bg-white/90 text-neutral-900 shadow-lg backdrop-blur transition-all duration-200 dark:bg-neutral-900/90 dark:text-neutral-100',
    tone.border,
    isVisible && 'translate-x-0 opacity-100',
    !isVisible && 'opacity-0',
    isLeaving && 'translate-x-6 opacity-0',
    isHovered ? 'shadow-2xl' : 'shadow-lg'
  );

  const handleClose = (isManualClose = false) => {
    if (isProgressBlockingClose) {
      return;
    }

    if (isManualClose && toast.dismissible === false) {
      return;
    }

    setIsLeaving(true);

    setTimeout(() => {
      onRemove(toast.id);
    }, 200);
  };

  const handleActionClick = (action: ToastAction) => {
    if (action.onClick) {
      action.onClick();
    }

    if (!action.keepOpen) {
      handleClose(true);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);

    if (timerRef.current && startTimeRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;

      const elapsedTime = Date.now() - startTimeRef.current;
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsedTime);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);

    if (toast.autoClose === false || isProgressBlockingClose || remainingTimeRef.current <= 0) {
      return;
    }

    startTimeRef.current = Date.now();

    timerRef.current = setTimeout(() => {
      handleClose(false);
    }, remainingTimeRef.current);
  };

  const messageObj =
    typeof toast.message === 'string' ? (
      <div className="break-words text-sm font-lg leading-tight text-neutral-800 dark:text-neutral-100">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {toast.message}
        </ReactMarkdown>
      </div>
    ) : (
      <div className="break-words text-sm font-medium leading-tight text-neutral-800 dark:text-neutral-100">
        {toast.message}
      </div>
    );

  const detailsObj =
    typeof toast.details === 'string' ? (
      <div className={MARKDOWN_CONTAINER}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {toast.details}
        </ReactMarkdown>
      </div>
    ) : (
      <div className={MARKDOWN_CONTAINER}>{toast.details}</div>
    );

  const progressStatusLabel = (() => {
    if (!toast.progress) {
      return '';
    }
    if (toast.progress.indeterminate) {
      return 'Working...';
    }
    switch (toast.progress.status) {
      case 'paused':
        return 'Paused';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Failed';
      default:
        return 'In progress';
    }
  })();

  return (
    <div
      className={toastClasses}
      data-toast-id={toast.id}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3 px-4 py-3">
        {IconComponent && toast.showIcon ? (
          <span
            className={classNames(
              'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-lg',
              tone.iconBg,
              tone.iconText
            )}
            aria-hidden="true"
          >
            <IconComponent />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div className="flex gap-2 items-center min-w-0  text-lg  font-semibold flex-1">
              {messageObj}
            </div>
            {!isCloseDisabled && (
              <IconButton
                icon="Close"
                variant="icon"
                color="slate"
                rounded="full"
                size="sm"
                className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                onClick={() => handleClose(true)}
                aria-label="Close notification"
                title="Close notification"
              />
            )}
          </div>
          {toast.progress && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                <span>{progressStatusLabel}</span>
                {!toast.progress.indeterminate && (
                  <span className={classNames('text-xs font-bold', tone.accent)}>
                    {toast.progress.percent.toFixed(0)}%
                  </span>
                )}
              </div>
              <Progress
                size="md"
                value={toast.progress.indeterminate ? 100 : toast.progress.percent}
                showShimmer={toast.progress.indeterminate}
              />
              <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                {detailsObj}
              </div>
            </div>
          )}
        </div>
      </div>

      {toast.details && !toast.progress && (
        <div className="px-4 pb-3">
          <div className={DETAILS_SCROLL_CONTAINER}>{detailsObj}</div>
        </div>
      )}

      {toast.actions && toast.actions.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-neutral-200 px-4 py-3 dark:border-neutral-700">
          {toast.actions.map((action, index) => {
            const actionVariant = action.variant ?? 'secondary';
            const color = actionColorMap[actionVariant] ?? 'blue';
            let leadingIcon: IconName | React.ReactElement | undefined;

            if (action.customIcon && React.isValidElement(action.customIcon)) {
              leadingIcon = action.customIcon;
            } else if (action.icon) {
              leadingIcon = action.icon as IconName;
            }

            return (
              <Button
                key={index}
                size="sm"
                variant="soft"
                color={color}
                className="px-3 py-1 text-sm font-medium"
                leadingIcon={leadingIcon}
                onClick={() => handleActionClick(action)}
              >
                {action.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
};
