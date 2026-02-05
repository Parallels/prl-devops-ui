import React, { useState, useRef, useEffect } from "react";
import { IconButton } from ".";
import { VariablePicker } from "./VariablePicker";
import { type SmartVariable } from "../types/Variables";
import { SMART_VAR_REGEX } from "../utils/smartVariables";
import { type CapsuleBlueprintParameter } from "../types/CapsuleBlueprint";
import { createPortal } from "react-dom";

export interface SmartInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  globalParameters?: CapsuleBlueprintParameter[];
  serviceNames?: string[];
  context?: {
    slug?: string;
    enable_https?: boolean;
  };
  multiline?: boolean; // If true, behaves like a textarea (kinda) or restricted? For now assuming single line mostly.
}

export const SmartInput: React.FC<SmartInputProps> = ({
  value = "",
  onChange,
  placeholder,
  className = "",
  globalParameters = [],
  serviceNames = [],
  context = {},
  // multiline // reserved for future
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [viewMode, setViewMode] = useState<"token" | "value">("token"); // New state
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Calculate picker position (basic implementation)
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });

  const hasVariables = React.useMemo(() => {
    const regex = new RegExp(SMART_VAR_REGEX);
    return regex.test(value);
  }, [value]);

  const handleContainerClick = () => {
    setIsEditing(true);
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Only stop editing if we didn't click into the picker or the toggle button
    if (!containerRef.current?.contains(e.relatedTarget as Node) && !pickerRef.current?.contains(e.relatedTarget as Node)) {
      setIsEditing(false);
      setShowPicker(false);
    }
  };

  const togglePicker = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent container click from focusing input immediately if unnecessary
    if (showPicker) {
      setShowPicker(false);
    } else {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setPickerPos({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
        });
      }
      setShowPicker(true);
      setIsEditing(true); // Ensure we are in edit mode to receive insertion
    }
  };

  const handleSelectVariable = (variable: SmartVariable) => {
    // Insert variable at cursor position or append
    const input = inputRef.current;
    let newValue = value;

    if (input) {
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      newValue = value.substring(0, start) + variable.fullToken + value.substring(end);

      // Restore focus and cursor?
      // Setting state is async, so cursor restoration is tricky without effect.
      // For now simple append/replace.
    } else {
      newValue += variable.fullToken;
    }

    onChange(newValue);
    setShowPicker(false);
    // keep editing
    input?.focus();
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // Close picker if clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showPicker && pickerRef.current && !pickerRef.current.contains(event.target as Node) && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPicker]);

  const resolveVariable = (type: string, source: string, name: string): { value: string; isResolved: boolean; isRuntime?: boolean } => {
    if (source === "global" || source === "env") {
      // NOTE: Current regex match groups: 1=type, 2=source, 3=name
      // But typically we see {{ var::global::NAME }}.
      // 'source' argument here comes from the second part.
      // If the user types {{ env::global::NAME }}, source is 'global'.

      let param = globalParameters.find((p) => p.key === name);
      if (!param) {
        // Fallback: Try case-insensitive comparison
        param = globalParameters.find((p) => p.key.toLowerCase() === name.toLowerCase());
      }

      if (param) {
        // Strict Type Check
        if (param.type !== type) {
          return { value: "", isResolved: false };
        }
        return { value: param.default_value || "", isResolved: true };
      }
      return { value: "", isResolved: false };
    }
    if (source === "service") {
      return { value: name, isResolved: true };
    }
    if (source === "system") {
      const lowerName = name.toLowerCase();
      // Derived Variables
      if (lowerName === "sub_domain") {
        return { value: context.slug || "", isResolved: true };
      }
      if (lowerName === "domain") {
        return { value: "parallels.private", isResolved: true };
      }
      if (lowerName === "host_url") {
        const protocol = context.enable_https ? "https" : "http";
        const domain = "parallels.private";
        const sub = context.slug || "";
        if (sub) {
          return { value: `${protocol}://${sub}.${domain}`, isResolved: true };
        }
        return { value: "", isResolved: false };
      }

      // Runtime Variables
      const runtimeVars = ["name", "reverse_proxy_host", "ip_address", "host_gateway_ip", "capsule_id", "capsule_name", "host_ip", "app_url"];
      if (runtimeVars.includes(lowerName)) {
        return { value: `[${lowerName}]`, isResolved: true, isRuntime: true };
      }

      // Fallback for unknown system vars
      return { value: `[System: ${name}]`, isResolved: true, isRuntime: true };
    }
    return { value: "", isResolved: false };
  };

  // Render parsed view
  const renderView = () => {
    if (!value) {
      return <span className="text-slate-400 italic">{placeholder || "Empty"}</span>;
    }

    const parts = [];
    let lastIndex = 0;
    let match;
    // Case insensitive regex match to align with MarkdownEditor
    const regex = new RegExp(SMART_VAR_REGEX, "gi");

    while ((match = regex.exec(value)) !== null) {
      // Text before match
      if (match.index > lastIndex) {
        parts.push(<span key={`text-${lastIndex}`}>{value.substring(lastIndex, match.index)}</span>);
      }

      // The variable token
      // const fullToken = match[0];
      const type = match[1]; // var | env
      const source = match[2]; // global | system | service
      const name = match[3];

      if (viewMode === "value") {
        const { value: resolvedVal, isResolved, isRuntime } = resolveVariable(type, source, name);
        const isEmpty = !resolvedVal;

        let badgeClass = "bg-green-50 text-green-700 border-green-200";
        if (isEmpty) {
          badgeClass = "bg-red-50 text-red-700 border-red-200";
        }

        if (isResolved && isRuntime) {
          badgeClass = "bg-purple-50 text-purple-700 border-purple-200";
        } else if (source === "system" && !isEmpty) {
          // Derived or resolved system vars (green/amber)
          badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
        }

        parts.push(
          <span
            key={`token-${match.index}`}
            className={`mx-0.5 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono border ${badgeClass} select-none cursor-help`}
            title={isResolved ? `Value: ${resolvedVal}` : "Variable not found"}
          >
            {isEmpty ? "empty" : resolvedVal}
          </span>,
        );
      } else {
        let badgeClass = "bg-slate-100 text-slate-700 border-slate-200";
        if (source === "global") {
          if (type === "var") {
            badgeClass = "bg-indigo-50 text-indigo-700 border-indigo-200";
          } else if (type === "env") {
            badgeClass = "bg-teal-50 text-teal-700 border-teal-200";
          } else {
            badgeClass = "bg-indigo-50 text-indigo-700 border-indigo-200";
          }
        }
        if (source === "system") badgeClass = "bg-amber-50 text-amber-900 border-amber-200";
        if (source === "service") badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";

        let labelPrefix = "G";
        if (source === "global") {
          labelPrefix = type === "env" ? "ENV" : "VAR";
        } else if (source === "system") {
          labelPrefix = "SYS";
        } else if (source === "service") {
          labelPrefix = "SVC";
        }

        parts.push(
          <span
            key={`token-${match.index}`}
            className={`mx-0.5 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono border ${badgeClass} select-none cursor-help`}
            title={`${type}::${source}`}
          >
            {labelPrefix}:{name}
          </span>,
        );
      }

      lastIndex = regex.lastIndex;
    }

    // Remaining text
    if (lastIndex < value.length) {
      parts.push(<span key={`text-${lastIndex}`}>{value.substring(lastIndex)}</span>);
    }

    return <div className="truncate">{parts}</div>;
  };

  return (
    <div
      ref={containerRef}
      className={`relative min-h-[38px] flex items-center rounded-lg border bg-white ${isEditing ? "border-blue-500 ring-1 ring-blue-500/20" : "border-slate-300 hover:border-slate-400"} ${className}`}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          className="flex-1 w-full h-full px-3 py-2 bg-transparent border-none outline-none text-sm font-mono placeholder:font-sans"
          placeholder={placeholder}
          autoComplete="off"
        />
      ) : (
        <div onClick={handleContainerClick} className="flex-1 px-3 py-2 text-sm cursor-text h-full flex items-center">
          {renderView()}
        </div>
      )}

      <div className="flex items-center pr-1 border-l border-transparent gap-0.5">
        {hasVariables && (
          <IconButton
            icon={viewMode === "token" ? "EyeOpen" : ("EyeClosed" as any)}
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(false); // Force exit edit mode to see changes
              setViewMode((prev) => (prev === "token" ? "value" : "token"));
            }}
            className="text-slate-400 hover:text-slate-600"
            title={viewMode === "token" ? "Show Values" : "Show Tokens"}
          />
        )}
        <IconButton icon="Plus" variant="ghost" size="sm" onClick={togglePicker} className={showPicker ? "text-blue-600 bg-blue-50" : "text-slate-400 hover:text-slate-600"} title="Insert Variable" />
      </div>

      {/* Portal for Variable Picker to avoid z-index/overflow issues */}
      {showPicker &&
        createPortal(
          <div
            ref={pickerRef}
            style={{
              position: "absolute",
              top: pickerPos.top,
              left: pickerPos.left,
              zIndex: 9999,
            }}
          >
            <VariablePicker onSelect={handleSelectVariable} onClose={() => setShowPicker(false)} globalParameters={globalParameters} serviceNames={serviceNames} />
          </div>,
          document.body,
        )}
    </div>
  );
};

export default SmartInput;
