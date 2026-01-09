import React, { useMemo } from 'react';
import classNames from 'classnames';
import IconButton from './IconButton';
import Loader, { type LoaderProps } from './Loader';
import { useAccordion, type UseAccordionOptions } from './useAccordion';
import type { PanelTone } from './Panel';
import { IconName } from '@/types/Icon';
import { renderIcon } from '@/utils/icon';

export type AccordionVariant = 'default' | 'bordered' | 'minimal' | 'tonal' | 'ghost';
export type AccordionSize = 'sm' | 'md' | 'lg';
export type AccordionIndicator = 'chevron' | 'plus-minus' | 'caret' | 'none';
export type AccordionChevronPlacement = 'left' | 'right';

export interface AccordionItem {
  id: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
  icon?: IconName | React.ReactElement;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
}

export interface AccordionProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
  UseAccordionOptions {
  items: AccordionItem[];
  variant?: AccordionVariant;
  tone?: PanelTone;
  size?: AccordionSize;
  indicator?: AccordionIndicator;
  chevronPlacement?: AccordionChevronPlacement;
  divider?: boolean;
  animated?: boolean;
  transitionMs?: number;
  onItemToggle?: (id: string, isOpen: boolean) => void;
  iconClassName?: string;
  itemClassName?: string;
  headerClassName?: string;
  contentClassName?: string;
  ariaLabel?: string;
  loading?: boolean;
  loaderTitle?: React.ReactNode;
  loaderMessage?: React.ReactNode;
  loaderType?: LoaderProps['variant'];
  loaderProgress?: number;
  loaderColor?: LoaderProps['color'];
}

const sizeTokens: Record<
  AccordionSize,
  {
    header: string;
    title: string;
    subtitle: string;
    description: string;
    content: string;
    badge: string;
    iconSize: number;
  }
> = {
  sm: {
    header: 'px-4 py-3 gap-3',
    title: 'text-sm font-semibold',
    subtitle: 'text-xs font-medium text-neutral-500 dark:text-neutral-400',
    description: 'text-xs text-neutral-500 dark:text-neutral-400',
    content: 'px-4 pb-4',
    badge: 'text-xs',
    iconSize: 16,
  },
  md: {
    header: 'px-5 py-4 gap-3',
    title: 'text-base font-semibold',
    subtitle: 'text-sm font-medium text-neutral-500 dark:text-neutral-400',
    description: 'text-sm text-neutral-500 dark:text-neutral-400',
    content: 'px-5 pb-5',
    badge: 'text-xs',
    iconSize: 20,
  },
  lg: {
    header: 'px-6 py-5 gap-4',
    title: 'text-lg font-semibold',
    subtitle: 'text-base font-medium text-neutral-500 dark:text-neutral-400',
    description: 'text-sm text-neutral-500 dark:text-neutral-400',
    content: 'px-6 pb-6',
    badge: 'text-sm',
    iconSize: 24,
  },
};

const variantClasses: Record<
  AccordionVariant,
  {
    root: string;
    item: string;
    header: string;
    content: string;
  }
> = {
  default: {
    root: 'rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900/90',
    item: 'border-b border-neutral-200 last:border-0 dark:border-neutral-800',
    header:
      'hover:bg-neutral-50/80 dark:hover:bg-neutral-800/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500',
    content: 'bg-neutral-50/60 dark:bg-neutral-900/40',
  },
  bordered: {
    root: 'rounded-2xl border border-neutral-300 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900',
    item: 'border-t first:border-t-0 border-neutral-300 dark:border-neutral-700',
    header:
      'hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500',
    content: 'bg-white dark:bg-neutral-900/60',
  },
  minimal: {
    root: 'rounded-xl border border-transparent bg-transparent',
    item: 'border-b border-neutral-200 last:border-0 dark:border-neutral-800',
    header:
      'hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500',
    content: 'bg-transparent',
  },
  tonal: {
    root: 'rounded-2xl border border-transparent bg-neutral-50/80 dark:bg-neutral-900/80',
    item: 'border-b border-neutral-200 last:border-0 dark:border-neutral-800/80',
    header:
      'hover:bg-white/60 dark:hover:bg-neutral-800/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500',
    content: 'bg-white/60 dark:bg-neutral-900/60',
  },
  ghost: {
    root: 'rounded-xl border border-transparent bg-transparent',
    item: 'border-b border-transparent',
    header:
      'hover:bg-neutral-100/50 dark:hover:bg-neutral-800/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500',
    content: 'bg-transparent',
  },
};

const toneClasses: Record<
  PanelTone,
  { header: string; indicator: string; icon: string; badge: string }
> = {
  neutral: {
    header: 'text-neutral-900 dark:text-neutral-100',
    indicator: 'text-neutral-400',
    icon: 'text-neutral-500 dark:text-neutral-300',
    badge: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200',
  },
  info: {
    header: 'text-sky-800 dark:text-sky-200',
    indicator: 'text-sky-400',
    icon: 'text-sky-500 dark:text-sky-300',
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-100',
  },
  success: {
    header: 'text-emerald-800 dark:text-emerald-200',
    indicator: 'text-emerald-400',
    icon: 'text-emerald-500 dark:text-emerald-300',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100',
  },
  warning: {
    header: 'text-amber-800 dark:text-amber-200',
    indicator: 'text-amber-400',
    icon: 'text-amber-500 dark:text-amber-300',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100',
  },
  danger: {
    header: 'text-rose-800 dark:text-rose-200',
    indicator: 'text-rose-400',
    icon: 'text-rose-500 dark:text-rose-300',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-100',
  },
  brand: {
    header: 'text-indigo-800 dark:text-indigo-200',
    indicator: 'text-indigo-400',
    icon: 'text-indigo-500 dark:text-indigo-300',
    badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-100',
  },
};

const indicatorIconMap: Record<AccordionIndicator, IconName | undefined> = {
  chevron: 'ArrowDown',
  caret: 'ArrowDown',
  'plus-minus': 'Plus',
  none: undefined,
};

const indicatorRotationClass: Record<AccordionIndicator, string> = {
  chevron: 'transition-transform duration-200',
  caret: 'transition-transform duration-200',
  'plus-minus': 'transition-transform duration-200',
  none: '',
};

const contentTransitionClass = 'transition-all duration-200 ease-out';

export const Accordion: React.FC<AccordionProps> = ({
  items,
  variant = 'default',
  tone = 'neutral',
  size = 'md',
  indicator = 'chevron',
  chevronPlacement = 'right',
  divider = false,
  animated = true,
  transitionMs = 220,
  onItemToggle,
  iconClassName,
  itemClassName,
  headerClassName,
  contentClassName,
  ariaLabel,
  loading = false,
  loaderTitle,
  loaderMessage,
  loaderType = 'spinner',
  loaderProgress,
  loaderColor,
  defaultOpenIds,
  openIds,
  onChange,
  multiple,
  className,
  style,
  ...rest
}) => {
  const accordion = useAccordion({ defaultOpenIds, openIds, onChange, multiple });

  const sizeToken = sizeTokens[size];
  const variantToken = variantClasses[variant];
  const toneToken = toneClasses[tone];

  const indicatorIcon = indicatorIconMap[indicator];
  const showIndicator = indicator !== 'none';

  const computedItems = useMemo(() => items ?? [], [items]);

  return (
    <div
      className={classNames(
        'relative flex w-full flex-col overflow-hidden',
        variantToken.root,
        divider && 'divide-y divide-neutral-200 dark:divide-neutral-800',
        className
      )}
      style={style}
      aria-busy={loading}
      role="presentation"
      {...rest}
    >
      <div role="group" aria-label={ariaLabel} className="flex flex-col">
        {computedItems.map((item) => {
          const isOpen = accordion.isOpen(item.id);
          const isDisabled = Boolean(item.disabled);
          const isLoading = Boolean(item.loading);

          const indicatorRotation =
            indicator === 'plus-minus'
              ? isOpen
                ? 'rotate-45'
                : ''
              : isOpen
                ? '-rotate-180'
                : '';

          const indicatorButton =
            showIndicator && indicatorIcon ? (
              <IconButton
                icon={indicatorIcon}
                size="sm"
                variant="icon"
                color="slate"
                rounded="full"
                className={classNames(
                  'pointer-events-none text-neutral-400 dark:text-neutral-300',
                  toneToken.indicator,
                  indicatorRotationClass[indicator],
                  indicatorRotation
                )}
                aria-hidden="true"
                tabIndex={-1}
              />
            ) : null;

          return (
            <div
              key={item.id}
              data-item-id={item.id}
              className={classNames(
                'relative flex flex-col',
                variantToken.item,
                isDisabled && 'opacity-60',
                itemClassName
              )}
            >
              <button
                type="button"
                className={classNames(
                  'flex w-full items-start gap-4 text-left transition-colors duration-150',
                  sizeToken.header,
                  variantToken.header,
                  toneToken.header,
                  headerClassName,
                  isDisabled && 'cursor-not-allowed'
                )}
                aria-expanded={isOpen}
                aria-controls={`${item.id}-content`}
                id={`${item.id}-trigger`}
                disabled={isDisabled}
                onClick={() => {
                  accordion.toggle(item.id);
                  onItemToggle?.(item.id, !isOpen);
                }}
              >
                {chevronPlacement === 'left' && indicatorButton ? (
                  <div className="mt-1 flex items-center">{indicatorButton}</div>
                ) : null}
                <div className="flex flex-1 items-start gap-3">
                  {item.icon ? (
                    <div
                      className={classNames(
                        'mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800',
                        toneToken.icon,
                        iconClassName
                      )}
                    >
                      {renderIcon(item.icon, 'md')}
                    </div>
                  ) : null}
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={sizeToken.title}>{item.title}</span>
                      {item.badge ? (
                        <span
                          className={classNames(
                            'inline-flex items-center rounded-full px-2 py-0.5 font-medium',
                            sizeToken.badge,
                            toneToken.badge
                          )}
                        >
                          {item.badge}
                        </span>
                      ) : null}
                    </div>
                    {item.subtitle ? (
                      <div className={classNames(sizeToken.subtitle)}>{item.subtitle}</div>
                    ) : null}
                    {item.description ? (
                      <div className={classNames(sizeToken.description)}>{item.description}</div>
                    ) : null}
                  </div>
                </div>
                {item.actions ? (
                  <div className="flex shrink-0 items-center gap-2 text-neutral-500 dark:text-neutral-300">
                    {item.actions}
                  </div>
                ) : null}
                {chevronPlacement === 'right' && indicatorButton ? (
                  <div className="mt-1 flex items-center">{indicatorButton}</div>
                ) : null}
              </button>
              <div
                id={`${item.id}-content`}
                role="region"
                aria-labelledby={`${item.id}-trigger`}
                className={classNames(
                  'overflow-hidden',
                  animated && contentTransitionClass,
                  contentClassName,
                  animated && `duration-[${transitionMs}ms]`
                )}
                style={animated ? { maxHeight: undefined } : undefined}
                data-open={isOpen}
              >
                <div
                  className={classNames(
                    'grid transition-all duration-200 ease-out',
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  )}
                >
                  <div className={classNames('min-h-0', variantToken.content)}>
                    <div
                      className={classNames(
                        'overflow-hidden',
                        sizeToken.content,
                        'text-sm leading-6 text-neutral-600 dark:text-neutral-300'
                      )}
                    >
                      {item.content}
                    </div>
                  </div>
                </div>
              </div>
              {isLoading && (
                <Loader
                  overlay
                  title="Loading"
                  className="rounded-none"
                  size="md"
                  color="blue"
                />
              )}
            </div>
          );
        })}
      </div>
      {loading && (
        <Loader
          overlay
          title={loaderTitle}
          label={loaderMessage}
          variant={loaderType}
          progress={loaderProgress}
          color={loaderColor}
        />
      )}
    </div>
  );
};

export default Accordion;
