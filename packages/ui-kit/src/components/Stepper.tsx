/* eslint-disable react-hooks/exhaustive-deps */
import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import classNames from "classnames";
import { type PanelTone, Loader, type LoaderProps } from ".";
import { useStepper } from "../hooks";
import { getStepperTonePalette } from "../theme";
import { type IconName } from "../icons/registry";
import { renderIcon } from "../utils/renderIcon";

export type StepStatus = "pending" | "active" | "completed" | "error";

export interface StepperStep {
  id?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
  content?: React.ReactNode;
  icon?: IconName | React.ReactElement;
  optionalLabel?: React.ReactNode;
  status?: StepStatus;
  disabled?: boolean;
}

export type Step = StepperStep;

export type StepperOrientation = "horizontal" | "vertical";
export type StepperVariant = "card" | "minimal";
export type StepperSize = "sm" | "md" | "lg";
export type StepperConnector = "line" | "progress" | "none";
export type StepperProgressBarPosition = "top" | "bottom";
export type StepperConnectorAlign = "left" | "center" | "right";

export interface StepperProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  steps: StepperStep[];
  currentIndex?: number;
  currentStepId?: string;
  defaultCurrentIndex?: number;
  defaultCurrentStepId?: string;
  completedStepIds?: string[];
  orientation?: StepperOrientation;
  variant?: StepperVariant;
  size?: StepperSize;
  tone?: PanelTone;
  connector?: StepperConnector;
  interactive?: boolean;
  readOnly?: boolean;
  animated?: boolean;
  transitionMs?: number;
  showProgressSummary?: boolean;
  showProgressBar?: boolean;
  progressBarPosition?: "top" | "bottom";
  progressPrecision?: number;
  progressLabel?: React.ReactNode;
  onChange?: (index: number, stepId?: string) => void;
  onStepClick?: (step: StepperStep, index: number) => void;
  renderActions?: (step: StepperStep, index: number) => React.ReactNode;
  loaderStepIds?: string[];
  loading?: boolean;
  loaderTitle?: React.ReactNode;
  loaderMessage?: React.ReactNode;
  loaderType?: LoaderProps["variant"];
  loaderProgress?: number;
  loaderColor?: LoaderProps["color"];
  wrapperClassName?: string;
  headerClassName?: string;
  stepClassName?: string;
  contentClassName?: string;
  stepMaxHeight?: number | string;
  connectNodes?: boolean;
  connectorAlign?: StepperConnectorAlign;
}

const sizeTokens: Record<
  StepperSize,
  {
    node: string;
    nodeText: string;
    title: string;
    subtitle: string;
    description: string;
    optional: string;
    gap: string;
    underlineHeight: string;
  }
> = {
  sm: {
    node: "h-9 w-9 text-xs",
    nodeText: "text-xs",
    title: "text-sm font-semibold",
    subtitle: "text-xs font-medium text-neutral-500 dark:text-neutral-400",
    description: "text-xs text-neutral-500 dark:text-neutral-400",
    optional: "text-[11px] italic text-neutral-400 dark:text-neutral-500",
    gap: "gap-2.5",
    underlineHeight: "h-0.5",
  },
  md: {
    node: "h-10 w-10 text-sm",
    nodeText: "text-sm",
    title: "text-base font-semibold",
    subtitle: "text-sm font-medium text-neutral-500 dark:text-neutral-400",
    description: "text-sm text-neutral-500 dark:text-neutral-400",
    optional: "text-xs italic text-neutral-400 dark:text-neutral-500",
    gap: "gap-3",
    underlineHeight: "h-[3px]",
  },
  lg: {
    node: "h-12 w-12 text-base",
    nodeText: "text-base",
    title: "text-lg font-semibold",
    subtitle: "text-sm font-medium text-neutral-500 dark:text-neutral-400",
    description: "text-sm text-neutral-500 dark:text-neutral-400",
    optional: "text-sm italic text-neutral-400 dark:text-neutral-500",
    gap: "gap-4",
    underlineHeight: "h-1",
  },
};

const variantConfig: Record<StepperVariant, { headerPadding: string; showDescription: boolean; emphasizeActiveTitle: boolean }> = {
  card: { headerPadding: "px-2 py-1.5", showDescription: true, emphasizeActiveTitle: true },
  minimal: { headerPadding: "px-1 py-1", showDescription: false, emphasizeActiveTitle: true },
};

const statusIcon: Record<StepStatus, IconName | undefined> = {
  pending: undefined,
  active: undefined,
  completed: "CheckCircle",
  error: "Error",
};

const convertToBg = (value: string): string =>
  value
    .split(" ")
    .map((token) => {
      if (token.startsWith("bg-") || token.startsWith("dark:bg-")) {
        return token;
      }
      if (token.startsWith("border-")) {
        return token.replace("border-", "bg-");
      }
      if (token.startsWith("dark:border-")) {
        return token.replace("dark:border-", "dark:bg-");
      }
      return "";
    })
    .filter(Boolean)
    .join(" ");

const nodeRadii: Record<StepperSize, number> = {
  sm: 18,
  md: 20,
  lg: 24,
};

const connectorThickness: Record<StepperSize, string> = {
  sm: "h-[3px]",
  md: "h-1",
  lg: "h-[5px]",
};

const verticalConnectorThickness: Record<StepperSize, string> = {
  sm: "w-[3px]",
  md: "w-1",
  lg: "w-[5px]",
};
export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentIndex,
  currentStepId,
  defaultCurrentIndex,
  defaultCurrentStepId,
  completedStepIds,
  orientation = "horizontal",
  variant = "card",
  size = "md",
  tone = "brand",
  connector = "progress",
  interactive = true,
  readOnly,
  showProgressSummary = false,
  showProgressBar = false,
  progressPrecision = 0,
  progressLabel,
  onChange,
  onStepClick,
  loaderStepIds,
  loading = false,
  loaderTitle,
  loaderMessage,
  loaderType = "spinner",
  loaderProgress,
  loaderColor,
  wrapperClassName,
  headerClassName,
  stepClassName,
  contentClassName,
  stepMaxHeight,
  connectNodes = false,
  connectorAlign = "center",
  className,
  style,
  ...rest
}) => {
  const state = useStepper(steps, {
    currentIndex,
    currentStepId,
    defaultCurrentIndex,
    defaultCurrentStepId,
    completedStepIds,
    onChange,
  });
  const nodeRefs = useRef<(HTMLDivElement | HTMLButtonElement | null)[]>([]);
  const verticalContainerRef = useRef<HTMLDivElement | null>(null);
  const [verticalSegments, setVerticalSegments] = useState<number[]>([]);

  const palette = getStepperTonePalette(tone);
  const sizeToken = sizeTokens[size];
  const connectorThicknessClass = connectorThickness[size];
  const verticalConnectorThicknessClass = verticalConnectorThickness[size];
  const variantToken = variantConfig[variant];
  const isInteractive = interactive && !readOnly;
  const loaderSet = useMemo(() => new Set(loaderStepIds ?? []), [loaderStepIds]);
  const connectorBaseClasses = convertToBg(palette.underlineBase);
  const connectorActiveClasses = convertToBg(palette.activeBg);

  const progressPercent = Math.min(100, Math.max(0, state.progressPercent));
  const formattedProgress = Math.round(progressPercent * Math.pow(10, progressPrecision)) / Math.pow(10, progressPrecision);

  const activeStep = steps[state.currentIndex];

  const stepMeta = steps.map((step, index) => {
    const resolvedId = step.id ?? String(index);
    const derivedActive = state.isActive(resolvedId, index);
    const derivedCompleted = state.isCompleted(resolvedId, index);
    const status: StepStatus = step.status ?? (derivedActive ? "active" : derivedCompleted ? "completed" : "pending");

    const isCompleted = step.status ? step.status === "completed" : derivedCompleted;

    const nodeBaseClass =
      variant === "minimal"
        ? "rounded-md border flex items-center justify-center font-semibold transition-all duration-200"
        : "rounded-full border flex items-center justify-center font-semibold transition-all duration-200";

    const nodeClasses = classNames(
      nodeBaseClass,
      sizeToken.node,
      sizeToken.nodeText,
      step.disabled && "opacity-60",
      status === "active" && [palette.activeBg, palette.activeText, "border-transparent shadow-sm"],
      status === "completed" && [palette.completedBg, palette.completedText, "border-transparent shadow-sm"],
      status === "pending" && ["bg-white dark:bg-neutral-900", palette.pendingBorder, palette.pendingText],
      status === "error" && "bg-rose-500 text-white border-transparent shadow-sm",
    );

    const underlineClasses = connector !== "none" ? classNames("w-full transition-all duration-200 ease-out rounded-full", sizeToken.underlineHeight, palette.underlineBase) : "";

    const textStyle = stepMaxHeight !== undefined ? { maxHeight: typeof stepMaxHeight === "number" ? `${stepMaxHeight}px` : stepMaxHeight } : undefined;

    const nodeIcon = step.icon ?? statusIcon[status];
    const isLoadingStep = loaderSet.has(resolvedId);

    return {
      step,
      index,
      resolvedId,
      status,
      nodeClasses,
      underlineClasses,
      textStyle,
      nodeIcon,
      isLoadingStep,
      isCompleted,
    };
  });
  nodeRefs.current.length = stepMeta.length;

  useLayoutEffect(() => {
    if (orientation !== "vertical") {
      if (verticalSegments.length !== 0) {
        setVerticalSegments([]);
      }
      return;
    }

    const measure = () => {
      const container = verticalContainerRef.current;
      if (!container) return;
      const nodes = nodeRefs.current;
      if (nodes.length < 2) {
        setVerticalSegments([]);
        return;
      }
      const containerRect = container.getBoundingClientRect();
      const centers: number[] = [];
      for (const node of nodes) {
        if (!node) {
          return;
        }
        const rect = node.getBoundingClientRect();
        centers.push(rect.top + rect.height / 2 - containerRect.top);
      }
      const segments = centers.slice(0, -1).map((value, idx) => centers[idx + 1] - value);
      setVerticalSegments((prev) => {
        if (prev.length === segments.length && prev.every((value, idx) => value === segments[idx])) {
          return prev;
        }
        return segments;
      });
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [orientation, steps, completedStepIds, loaderStepIds, state.currentIndex]);

  const progressBlock =
    showProgressBar || showProgressSummary ? (
      <div className="mt-6 flex w-full flex-col gap-2">
        {showProgressSummary && (
          <div className="flex items-center justify-between text-sm font-medium text-neutral-500 dark:text-neutral-400">
            <span>{progressLabel ?? "Progress"}</span>
            <span>{formattedProgress}%</span>
          </div>
        )}
        {showProgressBar && (
          <div className="relative h-1 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
            <div className={classNames("absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-out", palette.completedBg)} style={{ width: `${progressPercent}%` }} />
          </div>
        )}
      </div>
    ) : null;

  const renderNodeRow = () => {
    const rowGapClass = connectNodes ? "gap-0" : "gap-2";
    const nodeRadius = nodeRadii[size];
    let connectorWidth = `calc(50% + ${nodeRadius}px)`;
    let leftNodeStyle = connectorAlign === "left" ? "calc(50% * -1)" : connectorAlign === "right" ? `${nodeRadius * 4}px` : `-${nodeRadius}px`;
    let rightNodeStyle = connectorAlign === "left" ? "unset" : connectorAlign === "right" ? "calc(50% * -1)" : `-${nodeRadius}px`;

    return (
      <div className={classNames("flex items-center", rowGapClass)}>
        {stepMeta.map((meta, idx) => {
          const { resolvedId, nodeClasses, nodeIcon, isLoadingStep, step, isCompleted } = meta;
          const NodeTag = isInteractive && !step.disabled ? "button" : "div";

          const handleClick = () => {
            if (!isInteractive || step.disabled) return;
            state.goToIndex(idx);
            onStepClick?.(step, idx);
          };

          let showLeft = connectNodes && connector !== "none" && idx > 0;
          let showRight = connectNodes && connector !== "none" && idx < stepMeta.length - 1;
          let segmentSize = "pl-4 pr-2";
          if (!connectNodes) {
            if (connectorAlign === "left") {
              showRight = false;
              showLeft = false;
              segmentSize = "pl-4 pr-2 flex-1";
              leftNodeStyle = "0px";
            }
            if (connectorAlign === "center") {
              showLeft = idx > 0;
              showRight = idx < stepMeta.length - 1;
              connectorWidth = `calc(50% - ${nodeRadius}px)`;
              rightNodeStyle = `0px`;
            }
            if (connectorAlign === "right") {
              showLeft = idx > 0;
              showRight = false;
              segmentSize = "";
              rightNodeStyle = "0px";
              leftNodeStyle = `${nodeRadius}px`;
              connectorWidth = `calc(50% + ${nodeRadius * 2}px)`;
              segmentSize = "";
            }
          }
          const previousStep = stepMeta[idx - 1];
          const previousCompleted = previousStep?.isCompleted ?? false;
          const currentCompleted = isCompleted;
          const detachedSegment = !connectNodes && connector !== "none" && idx < stepMeta.length - 1;
          const segmentIsCompleted = isCompleted;

          const connectorSegment = detachedSegment ? (
            <div className={`flex items-center  ${segmentSize}`}>
              <div className={classNames("relative w-full overflow-hidden rounded-full transition-colors duration-200", connectorThicknessClass, connectorBaseClasses)}>
                {connector === "progress" && (
                  <div
                    className={classNames("absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-out", connectorActiveClasses)}
                    style={{ width: segmentIsCompleted ? "100%" : "0%" }}
                  />
                )}
              </div>
            </div>
          ) : null;

          const leftConnector = showLeft ? (
            <span
              className={classNames(
                "pointer-events-none  absolute top-1/2 -translate-y-1/2 rounded-full transition-colors duration-200",
                connectorThicknessClass,
                connector === "progress" && previousCompleted ? connectorActiveClasses : connectorBaseClasses,
              )}
              style={{ left: `${leftNodeStyle}`, width: connectorWidth }}
            />
          ) : null;

          const rightConnector = showRight ? (
            <span
              className={classNames(
                "pointer-events-none absolute top-1/2 -translate-y-1/2 rounded-full transition-colors duration-200",
                connectorThicknessClass,
                connector === "progress" && currentCompleted ? connectorActiveClasses : connectorBaseClasses,
              )}
              style={{ right: `${rightNodeStyle}`, width: connectorWidth }}
            />
          ) : null;

          return (
            <div
              key={`${resolvedId}-node`}
              className={`relative flex flex-1  ${connectorAlign === "left" ? "items-center" : connectorAlign === "right" ? "justify-end" : "items-center justify-center"}`}
            >
              {leftConnector}
              <NodeTag
                type={NodeTag === "button" ? "button" : undefined}
                className={classNames(
                  "relative z-10 flex items-center justify-center focus-visible:outline-none",
                  nodeClasses,
                  NodeTag === "button" && !step.disabled && "hover:brightness-95",
                  NodeTag === "button" && step.disabled && "cursor-not-allowed opacity-60",
                )}
                onClick={handleClick}
                aria-current={state.isActive(resolvedId, idx) ? "step" : undefined}
                disabled={step.disabled}
              >
                {nodeIcon ? renderIcon(nodeIcon, "sm") : idx + 1}
                {isLoadingStep && <Loader overlay variant="spinner" size="sm" className="rounded-full" title={null} label={null} />}
              </NodeTag>
              {rightConnector}
              {connectorSegment}
            </div>
          );
        })}
      </div>
    );
  };

  const renderHorizontal = () => {
    const gridColumns = Math.max(1, steps.length);

    return (
      <div className={classNames("relative flex flex-col", headerClassName)}>
        {renderNodeRow()}
        <div className="mt-4 grid items-stretch gap-6" style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}>
          {stepMeta.map((meta) => {
            const { resolvedId, status, textStyle, underlineClasses, step, index } = meta;
            const TextTag = isInteractive && !step.disabled ? "button" : "div";

            const handleClick = () => {
              if (!isInteractive || step.disabled) return;
              state.goToIndex(index);
              onStepClick?.(step, index);
            };

            return (
              <TextTag
                key={`${resolvedId}-body`}
                type={TextTag === "button" ? "button" : undefined}
                className={classNames(
                  "flex h-full flex-col justify-between rounded-xl px-2 text-left transition-colors duration-150 focus-visible:outline-none",
                  step.disabled && "cursor-not-allowed opacity-60",
                  isInteractive && !step.disabled && "hover:bg-neutral-50 dark:hover:bg-neutral-800/30",
                )}
                onClick={handleClick}
                aria-current={state.isActive(resolvedId, index) ? "step" : undefined}
                disabled={step.disabled}
              >
                <div className="flex min-w-0 flex-col gap-1 overflow-hidden break-words" style={textStyle}>
                  <div className={classNames(sizeToken.title, variantToken.emphasizeActiveTitle && status === "active" && "text-neutral-900 dark:text-neutral-100")}>{step.title}</div>
                  {step.subtitle && <div className={sizeToken.subtitle}>{step.subtitle}</div>}
                  {variantToken.showDescription && step.description ? <div className={sizeToken.description}>{step.description}</div> : null}
                </div>
                <div className="mt-3 flex flex-col gap-1">
                  {step.optionalLabel ? <div className={sizeToken.optional}>{step.optionalLabel}</div> : null}
                  {connector !== "none" && <div className={underlineClasses} />}
                </div>
              </TextTag>
            );
          })}
        </div>
      </div>
    );
  };

  const renderVertical = () => (
    <div ref={verticalContainerRef} className={classNames("relative flex flex-col gap-0", headerClassName)}>
      {stepMeta.map((meta, index) => {
        const { step, resolvedId, nodeClasses, textStyle, nodeIcon, isLoadingStep, isCompleted } = meta;
        const StepTag = isInteractive && !step.disabled ? "button" : "div";
        const NodeTag = isInteractive && !step.disabled ? "button" : "div";
        const segmentLength = verticalSegments[index] ?? 0;
        const showConnector = connector !== "none" && index < stepMeta.length - 1 && segmentLength > 0;

        return (
          <div key={resolvedId} className={classNames("relative flex items-start gap-4 py-4", index === 0 && "pt-0", index === stepMeta.length - 1 && "pb-0", stepClassName)}>
            <div className="relative flex flex-col items-center">
              <div
                className="relative flex items-center justify-center"
                ref={(el) => {
                  if (orientation === "vertical") {
                    nodeRefs.current[index] = el;
                  }
                }}
              >
                <NodeTag
                  type={NodeTag === "button" ? "button" : undefined}
                  className={classNames(
                    "relative z-10 flex items-center justify-center focus-visible:outline-none",
                    nodeClasses,
                    NodeTag === "button" && !step.disabled && "hover:brightness-95",
                    NodeTag === "button" && step.disabled && "cursor-not-allowed opacity-60",
                  )}
                  onClick={() => {
                    if (!isInteractive || step.disabled) return;
                    state.goToIndex(index);
                    onStepClick?.(step, index);
                  }}
                  aria-current={state.isActive(resolvedId, index) ? "step" : undefined}
                  disabled={step.disabled}
                >
                  {nodeIcon ? renderIcon(nodeIcon, "sm") : index + 1}
                  {isLoadingStep && <Loader overlay variant="spinner" size="sm" className="rounded-full" title={null} label={null} />}
                </NodeTag>
              </div>
              {showConnector && (
                <span
                  className={classNames("pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-full transition-colors duration-200", verticalConnectorThicknessClass, connectorBaseClasses)}
                  style={{
                    top: `${nodeRadii[size]}px`,
                    height: `${segmentLength}px`,
                  }}
                >
                  {connector === "progress" && isCompleted && <span className={classNames("absolute inset-0 rounded-full", connectorActiveClasses)} />}
                </span>
              )}
            </div>
            <StepTag
              type={StepTag === "button" ? "button" : undefined}
              className="flex flex-1 flex-col text-left"
              onClick={() => {
                if (!isInteractive || step.disabled) return;
                state.goToIndex(index);
                onStepClick?.(step, index);
              }}
              aria-current={state.isActive(resolvedId, index) ? "step" : undefined}
              disabled={step.disabled}
            >
              <div className={sizeToken.title} style={textStyle}>
                {step.title}
              </div>
              {step.subtitle && <div className={sizeToken.subtitle}>{step.subtitle}</div>}
              {step.description && <div className={sizeToken.description}>{step.description}</div>}
              {step.optionalLabel && <div className={sizeToken.optional}>{step.optionalLabel}</div>}
            </StepTag>
          </div>
        );
      })}
    </div>
  );

  const horizontal = orientation === "horizontal";

  const content = activeStep?.content ?? <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-300">{activeStep?.description}</div>;

  const alignmentMarginClass = connectorAlign === "left" ? "mr-auto" : connectorAlign === "right" ? "ml-auto" : "mx-auto";

  return (
    <div className={classNames("relative flex w-full flex-col", horizontal ? "gap-6" : "gap-4", alignmentMarginClass, wrapperClassName, className)} aria-busy={loading} style={style} {...rest}>
      {horizontal ? (
        <>
          {renderHorizontal()}
          {progressBlock}
        </>
      ) : (
        <>
          {renderVertical()}
          {progressBlock}
        </>
      )}

      <div className={classNames("rounded-2xl border border-neutral-200 bg-white/95 p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/80", contentClassName)}>{content}</div>

      {loading && <Loader overlay title={loaderTitle} label={loaderMessage} variant={loaderType} progress={loaderProgress} color={loaderColor} />}
    </div>
  );
};

export default Stepper;
