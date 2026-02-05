import React, { useEffect, useMemo, useState } from "react";
import classNames from "classnames";
import type { StartupStage, StartupStageStatus } from "../types/App";
import { Progress } from ".";
import "./StartupStageStepper.css";

export type StartupStageStepperProps = {
  stages: StartupStage[];
  currentStageId?: string;
  className?: string;
  detailClassName?: string;
  onStageSelect?: (stage: StartupStage) => void;
  showHistoryToggle?: boolean;
  defaultShowHistory?: boolean;
  title?: string;
  variant?: "minimal" | "panel";
  size?: StartupStageStepperSize;
};

type StartupStageStepperSize = "sm" | "md" | "lg";

const SIZE_TOKENS: Record<
  StartupStageStepperSize,
  {
    nodeDimension: string;
    nodeFont: string;
    icon: string;
    headerTitle: string;
    bodyText: string;
    badgeText: string;
    detailPadding: string;
    trackGap: string;
    trackPadding: string;
    connectorThickness: string;
    historyText: string;
  }
> = {
  sm: {
    nodeDimension: "size-9",
    nodeFont: "text-xs",
    icon: "h-3.5 w-3.5",
    headerTitle: "text-base",
    bodyText: "text-xs",
    badgeText: "text-[11px]",
    detailPadding: "p-3",
    trackGap: "gap-1.5",
    trackPadding: "px-0.5",
    connectorThickness: "h-[2px]",
    historyText: "text-xs",
  },
  md: {
    nodeDimension: "size-11",
    nodeFont: "text-sm",
    icon: "h-4 w-4",
    headerTitle: "text-lg",
    bodyText: "text-sm",
    badgeText: "text-xs",
    detailPadding: "p-4",
    trackGap: "gap-2",
    trackPadding: "px-1",
    connectorThickness: "h-[3px]",
    historyText: "text-sm",
  },
  lg: {
    nodeDimension: "size-13",
    nodeFont: "text-base",
    icon: "h-5 w-5",
    headerTitle: "text-xl",
    bodyText: "text-base",
    badgeText: "text-sm",
    detailPadding: "p-5",
    trackGap: "gap-3",
    trackPadding: "px-2",
    connectorThickness: "h-[5px]",
    historyText: "text-base",
  },
};

const STATUS_TOKENS: Record<
  StartupStageStatus,
  {
    label: string;
    pillBg: string;
    pillBorder: string;
    pillText: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  pending: {
    label: "Pending",
    pillBg: "bg-neutral-50/70 dark:bg-neutral-900/40",
    pillBorder: "border-neutral-200/80 dark:border-neutral-700/70",
    pillText: "text-neutral-500 dark:text-neutral-400",
    badgeBg: "bg-neutral-100 dark:bg-neutral-800",
    badgeText: "text-neutral-500 dark:text-neutral-300",
  },
  "in-progress": {
    label: "In Progress",
    pillBg: "bg-sky-50/80 dark:bg-sky-400/10",
    pillBorder: "border-sky-200/80 dark:border-sky-500/60",
    pillText: "text-sky-700 dark:text-sky-300",
    badgeBg: "bg-sky-100 dark:bg-sky-400/30",
    badgeText: "text-sky-700 dark:text-sky-100",
  },
  "is-ok": {
    label: "Completed",
    pillBg: "bg-emerald-50/80 dark:bg-emerald-400/10",
    pillBorder: "border-emerald-200/80 dark:border-emerald-500/60",
    pillText: "text-emerald-700 dark:text-emerald-200",
    badgeBg: "bg-emerald-100 dark:bg-emerald-400/30",
    badgeText: "text-emerald-700 dark:text-emerald-50",
  },
  "has-error": {
    label: "Needs Attention",
    pillBg: "bg-rose-50/80 dark:bg-rose-500/10",
    pillBorder: "border-rose-200/70 dark:border-rose-500/60",
    pillText: "text-rose-600 dark:text-rose-200",
    badgeBg: "bg-rose-100 dark:bg-rose-500/30",
    badgeText: "text-rose-700 dark:text-rose-50",
  },
};

const renderStatusIcon = (status: StartupStageStatus, sizeClass: string): React.ReactElement => {
  switch (status) {
    case "pending":
      return (
        <svg viewBox="0 0 24 24" className={sizeClass} aria-hidden="true">
          <circle cx="12" cy="12" r="5" fill="currentColor" />
        </svg>
      );
    case "in-progress":
      return (
        <svg viewBox="0 0 24 24" className={classNames(sizeClass, "animate-spin")} aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeDasharray="42" strokeLinecap="round" fill="none" className="opacity-30" />
          <path d="M12 3a9 9 0 019 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
      );
    case "is-ok":
      return (
        <svg viewBox="0 0 24 24" className={sizeClass} aria-hidden="true">
          <path d="M5 12.5 9.5 17l9-10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "has-error":
    default:
      return (
        <svg viewBox="0 0 24 24" className={sizeClass} aria-hidden="true">
          <path d="M12 7v5m0 4h.01M12 2 2 22h20L12 2Z" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
};

const getFriendlyStageMessage = (stage: StartupStage): string => stage.statusMessage ?? stage.progress?.currentMessage ?? stage.description ?? stage.errorMessage ?? "Awaiting status…";

type ConnectorTone = "complete" | "active" | "error" | "pending";

const CONNECTOR_STYLES: Record<ConnectorTone, { base: string; animated?: boolean }> = {
  complete: { base: "bg-emerald-400 dark:bg-emerald-500" },
  active: {
    base: "bg-sky-300/70 dark:bg-sky-400/70",
    animated: true,
  },
  error: { base: "bg-rose-400 dark:bg-rose-500" },
  pending: { base: "bg-neutral-200 dark:bg-neutral-700" },
};

const getConnectorTone = (stage?: StartupStage): ConnectorTone => {
  if (!stage) {
    return "pending";
  }
  if (stage.status === "is-ok") {
    return "complete";
  }
  if (stage.status === "has-error") {
    return "error";
  }
  if (stage.status === "in-progress") {
    return "active";
  }
  return "pending";
};

export const StartupStageStepper: React.FC<StartupStageStepperProps> = ({
  stages,
  currentStageId,
  className,
  detailClassName,
  onStageSelect,
  showHistoryToggle = true,
  defaultShowHistory = false,
  title = "Startup progress",
  variant = "minimal",
  size = "md",
}) => {
  const orderedStages = useMemo(() => stages.filter(Boolean), [stages]);
  const sizeToken = SIZE_TOKENS[size] ?? SIZE_TOKENS.md;

  const derivedStageId = useMemo(() => {
    if (currentStageId) {
      return currentStageId;
    }
    const inProgress = orderedStages.find((stage) => stage.status === "in-progress");
    if (inProgress) {
      return inProgress.id;
    }
    const pending = orderedStages.find((stage) => stage.status === "pending");
    return pending?.id ?? orderedStages[0]?.id;
  }, [currentStageId, orderedStages]);

  const [selectedStageId, setSelectedStageId] = useState<string | undefined>(derivedStageId);
  const [historyOpen, setHistoryOpen] = useState(defaultShowHistory);
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  useEffect(() => {
    setSelectedStageId((prev) => {
      if (!derivedStageId) {
        return prev;
      }
      if (!prev) {
        return derivedStageId;
      }
      // Always snap back to the derived active stage when status changes
      if (prev !== derivedStageId) {
        return derivedStageId;
      }
      return prev;
    });
  }, [derivedStageId]);

  useEffect(() => {
    setShowErrorDetails(false);
  }, [selectedStageId]);

  if (orderedStages.length === 0) {
    return null;
  }

  const selectedStage = orderedStages.find((stage) => stage.id === selectedStageId) ?? orderedStages[0];
  const selectedStatus = STATUS_TOKENS[selectedStage.status];
  const historyCandidates = orderedStages.filter((stage) => ["is-ok", "has-error"].includes(stage.status));
  const showHistory = showHistoryToggle && historyCandidates.length > 0;
  const isErrorStage = selectedStage.status === "has-error";
  const hasTechnicalDetails = Boolean(selectedStage.errorMessage || selectedStage.errorType);
  const detailBgClass = isErrorStage ? "bg-rose-50/80 text-rose-900 dark:bg-rose-500/10 dark:text-rose-100" : "bg-neutral-50/60 text-neutral-600 dark:bg-neutral-900/50 dark:text-neutral-200";
  const detailBorderClass =
    variant === "panel"
      ? isErrorStage
        ? "border border-rose-200/70 dark:border-rose-500/60"
        : "border border-neutral-100/60 dark:border-neutral-700/60"
      : isErrorStage
        ? "border border-rose-100/60 dark:border-rose-500/40"
        : "border border-transparent";
  const containerClasses = variant === "panel" ? "rounded-3xl border border-neutral-200/70 bg-white/80 p-4 shadow-sm dark:border-neutral-700/70 dark:bg-neutral-900/70" : undefined;

  return (
    <section className={classNames("flex w-full flex-col gap-3", containerClasses, className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{title}</p>
          <p className={classNames(sizeToken.headerTitle, "font-semibold text-neutral-900 dark:text-neutral-50")}>{selectedStage.title}</p>
        </div>
        <div className={classNames("rounded-full px-3 py-1 font-semibold uppercase tracking-wide", sizeToken.badgeText, selectedStatus.badgeBg, selectedStatus.badgeText)}>{selectedStatus.label}</div>
      </div>

      <div className="overflow-x-auto  py-2">
        <div className={classNames("flex min-w-full items-center", sizeToken.trackGap, sizeToken.trackPadding)}>
          {orderedStages.map((stage, index) => {
            const token = STATUS_TOKENS[stage.status];
            const isActive = stage.id === selectedStage.id;
            const connectorTone = getConnectorTone(orderedStages[index - 1]);
            return (
              <React.Fragment key={stage.id}>
                {index > 0 && (
                  <div
                    className={classNames(
                      "flex-1 rounded-full transition-colors",
                      sizeToken.connectorThickness,
                      CONNECTOR_STYLES[connectorTone].base,
                      CONNECTOR_STYLES[connectorTone].animated && "startup-stage-connector--animated",
                    )}
                  />
                )}
                <button
                  type="button"
                  title={stage.title}
                  aria-label={stage.title}
                  onClick={() => {
                    setSelectedStageId(stage.id);
                    onStageSelect?.(stage);
                  }}
                  className={classNames(
                    "flex flex-none items-center justify-center rounded-full border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900",
                    sizeToken.nodeDimension,
                    sizeToken.nodeFont,
                    token.pillText,
                    {
                      "border-emerald-400 bg-emerald-50 dark:border-emerald-500/80 dark:bg-emerald-400/10": stage.status === "is-ok",
                      "border-sky-400 bg-sky-50 dark:border-sky-500/80 dark:bg-sky-400/10": stage.status === "in-progress",
                      "border-rose-400 bg-rose-50 dark:border-rose-500/80 dark:bg-rose-500/10": stage.status === "has-error",
                      "border-neutral-300 bg-white dark:border-neutral-600 dark:bg-neutral-900": stage.status === "pending",
                      "ring-2 ring-sky-300 dark:ring-sky-500": isActive,
                    },
                  )}
                  aria-current={isActive}
                >
                  {renderStatusIcon(stage.status, classNames("text-current", sizeToken.icon))}
                  <span className="sr-only">
                    {stage.title} · {token.label}
                  </span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className={classNames("rounded-2xl", detailBgClass, detailBorderClass, sizeToken.detailPadding, sizeToken.bodyText, detailClassName)}>
        <p>{getFriendlyStageMessage(selectedStage)}</p>

        {typeof selectedStage.progress?.percentage === "number" && (
          <div className="mt-4">
            <Progress size="md" value={selectedStage.progress.percentage} color="blue" />
            {selectedStage.progress?.details && <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">{selectedStage.progress.details}</p>}
          </div>
        )}

        {selectedStage.retryCount !== undefined && selectedStage.maxRetryCount !== undefined && selectedStage.retryCount > 1 && (
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-300">
            Retry {selectedStage.retryCount} of {selectedStage.maxRetryCount}
          </p>
        )}

        {isErrorStage && hasTechnicalDetails && (
          <div className="mt-4 rounded-xl border border-rose-100/70 bg-white/80 p-3 text-sm text-neutral-700 dark:border-rose-500/40 dark:bg-neutral-950/40 dark:text-neutral-100">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-500 dark:text-rose-300">Technical details</p>
                {!showErrorDetails && <p className="text-xs text-neutral-500 dark:text-neutral-400">Tap to reveal diagnostic info</p>}
              </div>
              <button
                type="button"
                className="text-xs font-semibold uppercase tracking-wide text-rose-600 transition-colors hover:text-rose-500 dark:text-rose-300 dark:hover:text-rose-200"
                onClick={() => setShowErrorDetails((prev) => !prev)}
                aria-expanded={showErrorDetails}
              >
                {showErrorDetails ? "Hide" : "Show"}
              </button>
            </div>
            {showErrorDetails && (
              <div className="mt-3 space-y-2">
                {selectedStage.errorMessage && (
                  <pre className="whitespace-pre-wrap rounded-lg bg-rose-100/70 px-3 py-2 font-mono text-xs text-rose-900 dark:bg-rose-500/20 dark:text-rose-100">{selectedStage.errorMessage}</pre>
                )}
                {selectedStage.errorType && <p className="text-xs font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-300">Type: {selectedStage.errorType}</p>}
              </div>
            )}
          </div>
        )}
      </div>

      {showHistory && (
        <div className={classNames("rounded-2xl bg-neutral-50/40 dark:bg-neutral-900/40", sizeToken.detailPadding)}>
          <button
            type="button"
            className={classNames(
              "flex w-full items-center justify-between font-semibold text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100",
              sizeToken.bodyText,
            )}
            onClick={() => setHistoryOpen((prev) => !prev)}
          >
            <span>
              Completed steps <span className="font-normal text-neutral-400 dark:text-neutral-500">({historyCandidates.length})</span>
            </span>
            <span
              className={classNames("size-6 rounded-full border border-neutral-300/60 p-1 text-neutral-500 transition-transform dark:border-neutral-600/70", historyOpen ? "rotate-180" : "")}
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24" className="h-full w-full">
                <path d="m6 10 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
          {historyOpen && (
            <ol className={classNames("mt-3 divide-y divide-neutral-100 dark:divide-neutral-800", sizeToken.historyText)}>
              {historyCandidates.map((stage) => {
                const token = STATUS_TOKENS[stage.status];
                return (
                  <li key={stage.id} className="flex items-center justify-between py-2">
                    <span className="font-medium text-neutral-800 dark:text-neutral-100">{stage.title}</span>
                    <span className={classNames("text-xs font-semibold uppercase", token.pillText)}>{token.label}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
    </section>
  );
};

export default StartupStageStepper;
