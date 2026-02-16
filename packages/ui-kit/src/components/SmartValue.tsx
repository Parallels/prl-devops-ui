import React, { useState } from "react";
import { IconButton } from ".";
import { type CapsuleBlueprintParameter } from "../types/CapsuleBlueprint";
import { resolveVariable, SMART_VAR_REGEX } from "../utils/smartVariables";

export interface SmartValueProps {
  value: string;
  globalParameters?: CapsuleBlueprintParameter[];
  serviceNames?: string[];
  context?: {
    slug?: string;
    enable_https?: boolean;
  };
  className?: string;
}

export const SmartValue: React.FC<SmartValueProps> = ({ value = "", globalParameters = [], serviceNames = [], context = {}, className = "" }) => {
  const [viewMode, setViewMode] = useState<"token" | "value">("token");

  // Case insensitive regex match
  const regex = new RegExp(SMART_VAR_REGEX, "gi");
  const hasVariables = regex.test(value);

  // Reset regex index
  regex.lastIndex = 0;

  const renderParts = () => {
    const parts = [];
    let lastIndex = 0;
    let match;

    // Reset regex again for the loop
    regex.lastIndex = 0;

    while ((match = regex.exec(value)) !== null) {
      // Text before match
      if (match.index > lastIndex) {
        parts.push(<span key={`text-${lastIndex}`}>{value.substring(lastIndex, match.index)}</span>);
      }

      const fullToken = match[0];
      const type = match[1]; // var | env
      const source = match[2]; // global | system | service
      const name = match[3];

      if (viewMode === "value") {
        const ctx = { globalParameters, serviceNames, context };
        // resolveVariable expects the full token usually, or we can adapt logic.
        // The utils resolveVariable expects the full token string to match its regex.
        const { value: resolvedVal, isResolved, isRuntime } = resolveVariable(fullToken, ctx);
        const isEmpty = !resolvedVal;

        let badgeClass = "bg-green-50 text-green-700 border-green-200";
        if (isEmpty) {
          badgeClass = "bg-red-50 text-red-700 border-red-200";
        }

        if (isResolved && isRuntime) {
          badgeClass = "bg-purple-50 text-purple-700 border-purple-200";
        } else if (source === "system" && !isEmpty) {
          badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
        }

        parts.push(
          <span
            key={`token-${match.index}`}
            className={`mx-0.5 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono border ${badgeClass} select-none cursor-help align-middle`}
            title={isResolved ? `Value: ${resolvedVal}` : "Variable not found"}
          >
            {isEmpty ? "empty" : resolvedVal}
          </span>,
        );
      } else {
        let badgeClass = "bg-slate-100 text-slate-700 border-slate-200";
        if (source === "global") badgeClass = "bg-indigo-50 text-indigo-700 border-indigo-200";
        if (source === "system") badgeClass = "bg-amber-50 text-amber-900 border-amber-200";
        if (source === "service") badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";

        parts.push(
          <span
            key={`token-${match.index}`}
            className={`mx-0.5 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono border ${badgeClass} select-none cursor-help align-middle`}
            title={`${type}::${source}`}
          >
            {source === "global" ? "G" : source === "system" ? "S" : "SVC"}:{name}
          </span>,
        );
      }

      lastIndex = regex.lastIndex;
    }

    // Remaining text
    if (lastIndex < value.length) {
      parts.push(<span key={`text-${lastIndex}`}>{value.substring(lastIndex)}</span>);
    }

    return parts;
  };

  if (!hasVariables) {
    return <span className={className}>{value}</span>;
  }

  return (
    <div className={`flex items-start gap-1 group ${className}`}>
      <div className="flex-1 min-w-0 flex flex-wrap items-center gap-y-1 max-h-[80px] overflow-y-auto">{renderParts()}</div>
      <IconButton
        icon={viewMode === "token" ? "EyeOpen" : "EyeClosed"}
        variant="ghost"
        size="xs"
        onClick={(e) => {
          e.stopPropagation();
          setViewMode((prev) => (prev === "token" ? "value" : "token"));
        }}
        className="text-slate-400 hover:text-slate-600 hidden group-hover:inline-flex"
        title={viewMode === "token" ? "Show Values" : "Show Tokens"}
      />
    </div>
  );
};

export default SmartValue;
