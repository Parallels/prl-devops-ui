import React from "react";
import classNames from "classnames";
import Button, { type ButtonProps } from "./Button";
import Loader, { type LoaderProps } from "./Loader";
import { getPanelToneStyles, type ThemeColor } from "../theme/Theme";

export type PanelVariant = "elevated" | "outlined" | "subtle" | "tonal" | "default";
export type PanelTone = ThemeColor;
export type PanelMediaPlacement = "top" | "start" | "end" | "overlay";
export type PanelPadding = "none" | "xs" | "sm" | "md" | "lg";
export type PanelCorner = "rounded" | "pill" | "none";
export type PanelActionLayout = "auto" | "stacked" | "inline";
export type PanelLoaderType = Exclude<LoaderProps["variant"], undefined>;

export interface PanelAction extends Pick<ButtonProps, "variant" | "color" | "size" | "weight" | "leadingIcon" | "trailingIcon" | "loading" | "disabled" | "accent" | "accentColor"> {
  id?: string;
  label: React.ReactNode;
  onClick?: ButtonProps["onClick"];
  className?: string;
}

export interface PanelProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  media?: React.ReactNode;
  mediaPlacement?: PanelMediaPlacement;
  actions?: PanelAction[];
  actionLayout?: PanelActionLayout;
  variant?: PanelVariant;
  tone?: PanelTone;
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
  loaderColor?: LoaderProps["color"];
  hoverShadow?: boolean;
}

const variantBaseStyles: Record<PanelVariant, string> = {
  elevated: "bg-white/95 text-neutral-900 shadow-lg ring-1 ring-black/5 dark:bg-neutral-900/90 dark:text-neutral-100 dark:ring-white/10",
  outlined: "bg-white/90 text-neutral-900 ring-1 dark:bg-neutral-900/80 dark:text-neutral-100 dark:ring-white/10",
  subtle: "text-neutral-900 shadow-sm ring-1 ring-transparent dark:text-neutral-100 dark:ring-white/5",
  tonal: "text-neutral-900 shadow-sm ring-1 ring-transparent dark:text-neutral-100 dark:ring-white/5",
  default: "bg-white/80 backdrop-blur-xl text-neutral-900 shadow-2xl ring-1 ring-transparent dark:text-neutral-100 dark:ring-white/5",
};

const paddingStyles: Record<PanelPadding, string> = {
  none: "p-0",
  xs: "p-2 sm:p-3",
  sm: "p-4 sm:p-5",
  md: "p-6 sm:p-8",
  lg: "p-8 sm:p-10",
};

const cornerStyles: Record<PanelCorner, string> = {
  rounded: "rounded-xl",
  pill: "rounded-3xl",
  none: "rounded-none",
};

const actionButtonWidth: Record<PanelActionLayout, string> = {
  auto: "w-full sm:w-auto",
  stacked: "w-full",
  inline: "w-auto",
};

const actionWrapperLayout: Record<PanelActionLayout, string> = {
  auto: "flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center",
  stacked: "flex-col gap-3",
  inline: "flex-wrap items-center gap-3",
};

const defaultActionColor: ThemeColor = "theme";

const Panel: React.FC<PanelProps> = ({
  title,
  subtitle,
  description,
  badge,
  media,
  mediaPlacement = "top",
  actions,
  actionLayout = "auto",
  variant = "elevated",
  tone = "neutral",
  padding = "md",
  corner = "rounded",
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
  loaderType = "spinner",
  loaderTitle,
  loaderMessage,
  loaderProgress,
  loaderColor,
  hoverShadow = false,
  ...rest
}) => {
  const palette = getPanelToneStyles(tone);
  const isOverlay = mediaPlacement === "overlay" && Boolean(media);
  const hasMedia = Boolean(media);

  const resolvedStyle: React.CSSProperties = (() => {
    const styles: React.CSSProperties = { ...style };
    if (maxWidth !== undefined) {
      styles.maxWidth = typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth;
    }
    if (minHeight !== undefined) {
      styles.minHeight = typeof minHeight === "number" ? `${minHeight}px` : minHeight;
    }
    return styles;
  })();

  const variantClasses = (() => {
    switch (variant) {
      case "outlined":
        return classNames(variantBaseStyles.outlined, palette.border);
      case "subtle":
        return classNames(variantBaseStyles.subtle, palette.border, palette.subtleBg);
      case "tonal":
        return classNames(variantBaseStyles.tonal, palette.tonalBg);
      case "default":
        return classNames(variantBaseStyles.default, "border border-white/40");
      default:
        return classNames(variantBaseStyles.elevated, "border", palette.border);
    }
  })();

  const overlayClasses = isOverlay ? "relative overflow-hidden text-white shadow-xl ring-0" : undefined;

  const headingClass = isOverlay ? "text-white" : palette.heading;
  const subtitleClass = isOverlay ? "text-white/80" : palette.muted;
  const descriptionClass = isOverlay ? "text-white/75" : palette.muted;
  const badgeNode =
    typeof badge === "string" ? (
      <span className={classNames("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium tracking-wide", isOverlay ? "bg-white/15 text-white/90 backdrop-blur-sm" : palette.badge)}>
        {badge}
      </span>
    ) : (
      badge
    );

  const titleNode = typeof title === "string" ? <h3 className={classNames("text-xl font-semibold leading-7", headingClass)}>{title}</h3> : title;

  const subtitleNode = typeof subtitle === "string" ? <p className={classNames("text-base font-medium leading-6", subtitleClass)}>{subtitle}</p> : subtitle;

  const descriptionNode = typeof description === "string" ? <p className={classNames("text-sm leading-6", descriptionClass)}>{description}</p> : description;

  const headerSection =
    badgeNode || titleNode || subtitleNode || descriptionNode ? (
      <div className={`space-y-3${flexBody ? " flex flex-col" : ""}`}>
        {badge && <div>{badgeNode}</div>}
        {title && <div className="space-y-2">{titleNode}</div>}
        {subtitle && <div>{subtitleNode}</div>}
        {description && <div>{descriptionNode}</div>}
      </div>
    ) : null;

  const bodyContent = children ? (
    <div
      className={classNames(
        padding === "none" ? "" : "space-y-3 leading-6",
        flexBody ? "flex-1 flex flex-col w-full" : "",
        isOverlay ? "text-white/80" : "text-neutral-700 dark:text-neutral-300",
        bodyClassName,
      )}
      style={bodyStyle}
    >
      {children}
    </div>
  ) : null;

  const bodySection = bodyContent ? <div className={`${flexBody ? "flex-1 flex flex-col w-full " : ""}min-h-0 flex-1 overflow-auto ${padding === "none" ? "" : "pr-1"}`}>{bodyContent}</div> : null;

  const actionsSection =
    actions && actions.length > 0 ? (
      <div className={classNames("flex pt-3", actionWrapperLayout[actionLayout], bodySection ? "mt-auto" : "mt-4")}>
        {actions.map((action, index) => {
          const { id, label, className: actionClassName, color, size, ...buttonProps } = action;
          const key = id ?? `${index}`;
          const responsiveWidth = actionButtonWidth[actionLayout];

          return (
            <Button key={key} color={color ?? defaultActionColor} size={size ?? "md"} className={classNames(responsiveWidth, actionClassName)} {...buttonProps}>
              {label}
            </Button>
          );
        })}
      </div>
    ) : null;

  const mediaTopNode = hasMedia && mediaPlacement === "top" ? <div className="overflow-hidden">{media}</div> : null;

  const mediaSideNode =
    hasMedia && (mediaPlacement === "start" || mediaPlacement === "end") ? (
      <div className="w-full overflow-hidden rounded-xl border border-black/5 dark:border-white/10 sm:w-1/3 sm:min-w-[14rem]">{media}</div>
    ) : null;

  const contentSection = (() => {
    if (mediaPlacement === "start" || mediaPlacement === "end") {
      return (
        <div className={classNames("flex min-h-0 flex-1 flex-col gap-6 sm:flex-row", mediaPlacement === "end" ? "sm:flex-row-reverse" : "sm:flex-row", hasMedia ? "sm:items-start" : undefined)}>
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
        "relative flex w-full min-h-0 flex-col overflow-hidden",
        variantClasses,
        paddingStyles[padding],
        cornerStyles[corner],
        fullWidth ? "w-full" : undefined,
        isOverlay ? overlayClasses : undefined,
        hoverShadow && "transition-shadow duration-200 hover:shadow-xl hover:-translate-y-[1px]",
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
          <div className={classNames("pointer-events-none absolute inset-0 bg-gradient-to-br", palette.overlayGradient)} />
        </>
      )}
      <div className={classNames("relative z-10 flex min-h-0 flex-1 flex-col gap-4", isOverlay && "backdrop-blur-sm")}>
        {disabled && <div className="absolute inset-0 z-10 bg-white/70 dark:bg-slate-900/70" aria-hidden="true" />}
        {contentSection}
      </div>
      {loading && <Loader overlay variant={loaderType} title={loaderTitle} label={loaderMessage} progress={loaderProgress} color={loaderColor} />}
    </section>
  );
};

export default Panel;
