import React from 'react';
import classNames from 'classnames';
import Button, { type ButtonProps } from './Button';
import Loader, { type LoaderProps } from './Loader';
import { getPanelToneStyles, resolveColor, type ThemeColor } from '../theme/Theme';

export type PanelVariant = 'elevated' | 'outlined' | 'subtle' | 'tonal' | 'default' | 'glass' | 'simple';
export type PanelTone = ThemeColor;
export type PanelDecoration = 'none' | 'gradient' | 'shapes' | 'both';
export type PanelMediaPlacement = 'top' | 'start' | 'end' | 'overlay';
export type PanelPadding = 'none' | 'xs' | 'sm' | 'md' | 'lg';
export type PanelCorner = 'rounded' | 'rounded-sm' | 'rounded-md' | 'rounded-lg' | 'rounded-full' | 'pill' | 'none';
export type PanelActionLayout = 'auto' | 'stacked' | 'inline';
export type PanelLoaderType = Exclude<LoaderProps['variant'], undefined>;

export interface PanelAction extends Pick<ButtonProps, 'variant' | 'color' | 'size' | 'weight' | 'leadingIcon' | 'trailingIcon' | 'loading' | 'disabled' | 'accent' | 'accentColor'> {
  id?: string;
  label: React.ReactNode;
  onClick?: ButtonProps['onClick'];
  className?: string;
}

export interface PanelProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title?: React.ReactNode;
  titleClassName?: string;
  subtitle?: React.ReactNode;
  subtitleClassName?: string;
  description?: React.ReactNode;
  descriptionClassName?: string;
  badge?: React.ReactNode;
  media?: React.ReactNode;
  mediaPlacement?: PanelMediaPlacement;
  actions?: PanelAction[];
  actionLayout?: PanelActionLayout;
  variant?: PanelVariant;
  tone?: ThemeColor;
  padding?: PanelPadding;
  corner?: PanelCorner;
  fullWidth?: boolean;
  disabled?: boolean;
  flexBody?: boolean;
  maxWidth?: string | number;
  minHeight?: string | number;
  bodyClassName?: string;
  bodyStyle?: React.CSSProperties;
  children?: React.ReactNode;
  loading?: boolean;
  loaderType?: PanelLoaderType;
  loaderTitle?: React.ReactNode;
  loaderMessage?: React.ReactNode;
  loaderProgress?: number;
  loaderColor?: LoaderProps['color'];
  hoverShadow?: boolean;
  decoration?: PanelDecoration;
  /**
   * Adds a subtle background tint on hover and lightens any decoration elements.
   * Defaults to `true` when an `onClick` handler is present, otherwise `false`.
   */
  hoverable?: boolean;
  color?: ThemeColor;
  /**
   * Override the default hover color.
   * If not provided, it defaults to the `color` prop if available, or a neutral tint.
   */
  hoverColor?: ThemeColor;
  /**
   * Override the default border color.
   * If not provided, it defaults to the `tone` or `color` prop depending on variant.
   */
  borderColor?: ThemeColor;
  /**
   * Override the default background color.
   */
  backgroundColor?: ThemeColor;
  /**
   * controls if the panel body should be scrollable
   * @default true
   */
  scrollable?: boolean;
}

const variantBaseStyles: Record<PanelVariant, string> = {
  elevated: 'bg-white shadow-xl ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10 text-neutral-900 dark:text-neutral-100',
  outlined: 'bg-white/90 text-neutral-900 ring-1 dark:bg-neutral-900/80 dark:text-neutral-100 dark:ring-white/10',
  subtle: 'text-neutral-900 shadow-sm ring-1 ring-transparent dark:text-neutral-100 dark:ring-white/5',
  tonal: 'text-neutral-900 shadow-sm ring-1 ring-transparent dark:text-neutral-100 dark:ring-white/5',
  default: 'bg-white/80 backdrop-blur-xl text-neutral-900 shadow-2xl ring-1 ring-transparent dark:text-neutral-100 dark:ring-white/5',
  glass: 'backdrop-blur-xl text-neutral-900 ring-1 ring-transparent dark:text-neutral-100 dark:ring-white/5',
  simple: 'text-neutral-900  ring-transparent dark:text-neutral-100 dark:ring-white/5',
};

export const paddingStyles: Record<PanelPadding, string> = {
  none: 'p-0',
  xs: 'p-2 sm:p-3',
  sm: 'p-4 sm:p-5',
  md: 'p-6 sm:p-8',
  lg: 'p-8 sm:p-10',
};

const cornerStyles: Record<PanelCorner, string> = {
  rounded: 'rounded-sm',
  'rounded-sm': 'rounded-lg',
  'rounded-md': 'rounded-2xl',
  'rounded-lg': 'rounded-3xl',
  'rounded-full': 'rounded-full',
  pill: 'rounded-3xl',
  none: 'rounded-none',
};

const actionButtonWidth: Record<PanelActionLayout, string> = {
  auto: 'w-full sm:w-auto',
  stacked: 'w-full',
  inline: 'w-auto',
};

const actionWrapperLayout: Record<PanelActionLayout, string> = {
  auto: 'flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center',
  stacked: 'flex-col gap-3',
  inline: 'flex-wrap items-center gap-3',
};

const defaultActionColor: ThemeColor = 'theme';

const Panel: React.FC<PanelProps> = ({
  title,
  subtitle,
  description,
  badge,
  media,
  mediaPlacement = 'top',
  actions,
  actionLayout = 'auto',
  variant = 'elevated',
  tone = 'neutral',
  padding = 'md',
  corner = 'rounded-sm',
  fullWidth,
  maxWidth,
  minHeight,
  className,
  bodyClassName,
  bodyStyle,
  style,
  children,
  loading = false,
  disabled = false,
  flexBody = false,
  loaderType = 'spinner',
  loaderTitle,
  loaderMessage,
  loaderProgress,
  loaderColor,
  hoverShadow = false,
  decoration = 'none',
  hoverable,
  titleClassName,
  subtitleClassName,
  descriptionClassName,
  color,
  hoverColor,
  borderColor,
  backgroundColor,
  scrollable = true,
  ...rest
}) => {
  const palette = getPanelToneStyles(tone);
  const colorPalette = color ? getPanelToneStyles(color) : palette;
  const isHoverable = hoverable ?? Boolean(rest.onClick);

  const effectiveHoverColor = hoverColor ?? (color && color !== 'neutral' ? color : undefined);
  const hoverColorName = effectiveHoverColor ? resolveColor(effectiveHoverColor) : undefined;

  const borderPalette = borderColor ? getPanelToneStyles(borderColor) : undefined;
  const effectiveBorderClass = borderPalette?.border;

  const bgPalette = backgroundColor ? getPanelToneStyles(backgroundColor) : undefined;

  const effectiveBgClass = (() => {
    if (!backgroundColor) return undefined;
    if (backgroundColor === 'white') return 'bg-white dark:bg-neutral-900';
    if (bgPalette) {
      if (variant === 'glass') return bgPalette.glassBg;
      if (variant === 'subtle') return bgPalette.subtleBg;
      if (variant === 'simple') return bgPalette.tonalBg;
      if (variant === 'tonal') return bgPalette.tonalBg;
      // For elevated/outlined, we might want to apply the subtle background
      return bgPalette.tonalBg;
    }
    return undefined;
  })();

  const isOverlay = mediaPlacement === 'overlay' && Boolean(media);
  const hasMedia = Boolean(media);
  // Decoration is suppressed in overlay mode since the image + gradient already provide impact
  const showDecorationGradient = !isOverlay && (decoration === 'gradient' || decoration === 'both');
  const showDecorationShapes = !isOverlay && (decoration === 'shapes' || decoration === 'both');

  const resolvedStyle: React.CSSProperties = (() => {
    const styles: React.CSSProperties = { ...style };
    if (maxWidth !== undefined) {
      styles.maxWidth = typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth;
    }
    if (minHeight !== undefined) {
      styles.minHeight = typeof minHeight === 'number' ? `${minHeight}px` : minHeight;
    }
    return styles;
  })();

  const variantClasses = (() => {
    switch (variant) {
      case 'outlined':
        return classNames(variantBaseStyles.outlined, effectiveBorderClass ?? palette.border);
      case 'subtle':
        return classNames(variantBaseStyles.subtle, effectiveBorderClass ?? palette.border, effectiveBgClass ?? palette.subtleBg);
      case 'tonal':
        return classNames(variantBaseStyles.tonal, effectiveBgClass ?? palette.tonalBg, effectiveBorderClass);
      case 'default':
        return classNames(variantBaseStyles.default, effectiveBorderClass ?? 'border border-white/40');
      case 'glass':
        return classNames(variantBaseStyles.glass, 'border', effectiveBorderClass ?? colorPalette.glassBorder, effectiveBgClass ?? palette.glassBg);
      case 'simple':
        return classNames(variantBaseStyles.simple, effectiveBgClass ?? palette.tonalBg, effectiveBorderClass);
      case 'elevated':
        return classNames(
          !effectiveBgClass && variantBaseStyles.elevated,
          effectiveBgClass && 'text-neutral-900 shadow-xl ring-1 ring-black/5 dark:text-neutral-100 dark:ring-white/10',
          effectiveBorderClass,
          effectiveBgClass,
        );
      default:
        return classNames(
          !effectiveBgClass && variantBaseStyles.elevated,
          effectiveBgClass && 'text-neutral-900 shadow-xl ring-1 ring-black/5 dark:text-neutral-100 dark:ring-white/10',
          effectiveBorderClass,
          effectiveBgClass,
        );
    }
  })();

  const overlayClasses = isOverlay ? 'relative overflow-hidden text-white shadow-xl ring-0' : undefined;

  const headingClass = isOverlay ? 'text-white' : palette.heading;
  const subtitleClass = isOverlay ? 'text-white/80' : palette.muted;
  const descriptionClass = isOverlay ? 'text-white/75' : palette.muted;
  const badgeNode =
    typeof badge === 'string' ? (
      <span className={classNames('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium tracking-wide', isOverlay ? 'bg-white/15 text-white/90 backdrop-blur-sm' : palette.badge)}>
        {badge}
      </span>
    ) : (
      badge
    );

  const titleNode = typeof title === 'string' ? <h3 className={classNames('text-xl font-semibold leading-7', headingClass, titleClassName)}>{title}</h3> : title;

  const subtitleNode = typeof subtitle === 'string' ? <p className={classNames('text-base font-medium leading-6', subtitleClass, subtitleClassName)}>{subtitle}</p> : subtitle;

  const descriptionNode = typeof description === 'string' ? <p className={classNames('text-sm leading-6', descriptionClass, descriptionClassName)}>{description}</p> : description;

  const headerSection =
    badgeNode || titleNode || subtitleNode || descriptionNode ? (
      <div className={`space-y-3${flexBody ? ' flex flex-col' : ''}`}>
        {badge && <div>{badgeNode}</div>}
        {title && <div className="space-y-2">{titleNode}</div>}
        {subtitle && <div>{subtitleNode}</div>}
        {description && <div>{descriptionNode}</div>}
      </div>
    ) : null;

  const bodyContent = children ? (
    <div
      className={classNames(
        padding === 'none' ? '' : 'space-y-3 leading-6',
        flexBody ? 'flex-1 flex flex-col w-full' : '',
        isOverlay ? 'text-white/80' : 'text-neutral-700 dark:text-neutral-300',
        bodyClassName,
      )}
      style={bodyStyle}
    >
      {children}
    </div>
  ) : null;

  const bodySection = bodyContent ? (
    <div
      className={classNames(
        flexBody ? 'flex-1 flex flex-col w-full' : '',
        'min-h-0 flex-1',
        scrollable
          ? 'overflow-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-200 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-700 hover:[&::-webkit-scrollbar-thumb]:bg-neutral-300 dark:hover:[&::-webkit-scrollbar-thumb]:bg-neutral-600 [&::-webkit-scrollbar-track]:bg-transparent'
          : '',
        padding === 'none' ? '' : 'pr-1',
      )}
    >
      {bodyContent}
    </div>
  ) : null;

  const actionsSection =
    actions && actions.length > 0 ? (
      <div className={classNames('flex pt-3', actionWrapperLayout[actionLayout], bodySection ? 'mt-auto' : 'mt-4')}>
        {actions.map((action, index) => {
          const { id, label, className: actionClassName, color, size, ...buttonProps } = action;
          const key = id ?? `${index}`;
          const responsiveWidth = actionButtonWidth[actionLayout];

          return (
            <Button key={key} color={color ?? defaultActionColor} size={size ?? 'md'} className={classNames(responsiveWidth, actionClassName)} {...buttonProps}>
              {label}
            </Button>
          );
        })}
      </div>
    ) : null;

  const mediaTopNode = hasMedia && mediaPlacement === 'top' ? <div className="overflow-hidden">{media}</div> : null;

  const mediaSideNode =
    hasMedia && (mediaPlacement === 'start' || mediaPlacement === 'end') ? (
      <div className="w-full overflow-hidden rounded-xl border border-black/5 dark:border-white/10 sm:w-1/3 sm:min-w-[14rem]">{media}</div>
    ) : null;

  const contentSection = (() => {
    if (mediaPlacement === 'start' || mediaPlacement === 'end') {
      return (
        <div className={classNames('flex min-h-0 flex-1 flex-col gap-6 sm:flex-row', mediaPlacement === 'end' ? 'sm:flex-row-reverse' : 'sm:flex-row', hasMedia ? 'sm:items-start' : undefined)}>
          {mediaSideNode}
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            {headerSection}
            {bodySection}
            {actionsSection}
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {mediaTopNode}
        {headerSection}
        {bodySection}
        {actionsSection}
      </div>
    );
  })();

  return (
    <section
      className={classNames(
        'relative flex w-full min-h-0 flex-col overflow-hidden shrink-0',
        variantClasses,
        paddingStyles[padding],
        cornerStyles[corner],
        fullWidth ? 'w-full' : undefined,
        isOverlay ? overlayClasses : undefined,
        hoverShadow && 'transition-shadow duration-200 hover:shadow-xl hover:-translate-y-[1px]',
        isHoverable && 'group cursor-pointer',
        isHoverable && hoverColorName && `hover:bg-${hoverColorName}-50 dark:hover:bg-${hoverColorName}-900/20`,
        className,
      )}
      style={resolvedStyle}
      data-variant={variant}
      data-tone={tone}
      aria-busy={loading}
      {...rest}
    >
      {isOverlay && (
        <>
          <div className="absolute inset-0 overflow-hidden">
            <div className="h-full w-full">{media}</div>
          </div>
          <div className={classNames('pointer-events-none absolute inset-0 bg-gradient-to-br', palette.overlayGradient)} />
        </>
      )}
      {showDecorationGradient && (
        <div
          className={classNames('pointer-events-none absolute inset-0 bg-gradient-to-br', palette.decorationGradient, isHoverable && 'transition-opacity duration-200 group-hover:opacity-50')}
          aria-hidden="true"
        />
      )}
      {showDecorationShapes && (
        <>
          <div
            className={classNames(
              'pointer-events-none absolute -right-10 -top-10 w-52 h-52 rounded-full',
              palette.decorationShape,
              isHoverable && 'transition-opacity duration-200 group-hover:opacity-50',
            )}
            aria-hidden="true"
          />
          <div
            className={classNames(
              'pointer-events-none absolute -left-8 -bottom-10 w-36 h-36 rounded-full opacity-70',
              palette.decorationShape,
              isHoverable && 'transition-opacity duration-200 group-hover:opacity-40',
            )}
            aria-hidden="true"
          />
          <div
            className={classNames(
              'pointer-events-none absolute right-10 bottom-8 w-16 h-16 rounded-full opacity-50',
              palette.decorationShape,
              isHoverable && 'transition-opacity duration-200 group-hover:opacity-25',
            )}
            aria-hidden="true"
          />
        </>
      )}
      {isHoverable && !hoverColorName && (
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] bg-transparent transition-colors duration-200 group-hover:bg-black/[0.025] dark:group-hover:bg-white/[0.04]"
          aria-hidden="true"
        />
      )}
      <div className={classNames('relative z-10 flex min-h-0 flex-1 flex-col gap-4', isOverlay && 'backdrop-blur-sm')}>
        {disabled && <div className="absolute inset-0 z-10 bg-white/70 dark:bg-slate-900/70" aria-hidden="true" />}
        {contentSection}
      </div>
      {loading && <Loader overlay variant={loaderType} title={loaderTitle} label={loaderMessage} progress={loaderProgress} color={loaderColor} />}
    </section>
  );
};

export default Panel;
