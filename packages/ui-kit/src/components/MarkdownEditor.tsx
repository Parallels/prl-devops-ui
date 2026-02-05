import React, { useMemo, useState, useRef } from "react";
import MDEditor, { commands } from "@uiw/react-md-editor";
import classNames from "classnames";
import { VariablePicker } from "./VariablePicker";
import { createPortal } from "react-dom";
import { SMART_VAR_REGEX } from "../utils/smartVariables";
import { type CapsuleBlueprintParameter } from "../types/CapsuleBlueprint";
import { type SmartVariable } from "../types/Variables";

/**
 * MarkdownEditor Component
 * Wraps @uiw/react-md-editor and adds Smart Variable support.
 */

interface MarkdownEditorProps {
  value?: string;
  onChange?: (value: string | undefined) => void;
  height?: number;
  className?: string;
  placeholder?: string;
  readOnly?: boolean;
  preview?: "live" | "edit" | "preview";
  globalParameters?: CapsuleBlueprintParameter[];
  serviceNames?: string[];
  context?: {
    slug?: string;
    enable_https?: boolean;
  };
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value = "",
  onChange,
  height = 200,
  className,
  placeholder,
  readOnly = false,
  preview = "live",
  globalParameters = [],
  serviceNames = [],
  context = {},
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });
  const selectionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  const resolveVariable = (source: string, name: string): { value: string; isResolved: boolean; isRuntime?: boolean } => {
    if (source === "global" || source === "env") {
      let param = globalParameters.find((p) => p.key === name);
      if (!param) {
        // Fallback: Try case-insensitive comparison (URLs might lowercase the name)
        param = globalParameters.find((p) => p.key.toLowerCase() === name.toLowerCase());
      }

      if (param) {
        return { value: param.default_value || "", isResolved: true };
      }
      return { value: "", isResolved: false };
    }
    if (source === "service") {
      // Service names might be case sensitive but typically lowercase?
      // If strict match fails, maybe try insensitive?
      // For now assume strict or direct return
      return { value: name, isResolved: true };
    }
    if (source === "system") {
      const lowerName = name.toLowerCase();
      // Derived Variables
      if (lowerName === "sub_domain") {
        // Context slug might be lowercase already
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

  const SAFE_VAR_PATTERN = "SVAR(\\w+)SVAR(\\w+)SVAR([a-zA-Z0-9_\\-\\.]+)END";
  //const SAFE_VAR_REGEX = useMemo(() => new RegExp(SAFE_VAR_PATTERN, 'g'), []);

  // Helper to preprocess text for preview (fix link parsing)
  // Replaces {{...}} with SVAR...END so markdown parser treats it as simple text/link
  const preprocess = React.useCallback((text: string) => {
    const regex = new RegExp(SMART_VAR_REGEX, "gi");
    return text.replace(regex, (_match, type: string, source: string, name: string) => {
      return `SVAR${type}SVAR${source}SVAR${name}END`;
    });
  }, []);

  // Helper to resolve variables in a string (for attributes like href)
  const replaceVariablesInString = React.useCallback(
    (text: string) => {
      const combined = new RegExp(`${SAFE_VAR_PATTERN}|${SMART_VAR_REGEX.source}`, "gi");
      return text.replace(combined, (_match, _t1, s1, n1, _t2, s2, n2) => {
        const source = s1 || s2;
        const name = n1 || n2;
        const { value } = resolveVariable(source, name);
        return value || "";
      });
    },
    [resolveVariable],
  );

  // Helper to render text with variables (for display, utilizing badges)
  const renderWithVariables = (text: string) => {
    if (!text) return null;
    const parts = [];
    let lastIndex = 0;
    let match;

    const combinedRegex = new RegExp(`${SAFE_VAR_PATTERN}|${SMART_VAR_REGEX.source}`, "gi");

    while ((match = combinedRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      // Group 1-3 for SAFE, 4-6 for ORIGINAL (match indexing depends on regex structure)
      const source = match[2] || match[5];
      const name = match[3] || match[6];
      const type = match[1] || match[4]; // Capture type too

      // If we matched something valid
      if (source && name) {
        const { value: resolvedVal, isResolved } = resolveVariable(source, name);

        if (isResolved) {
          // Render resolved value as plain text (with tooltip)
          parts.push(
            <span key={`var-${match.index}`} title={`Variable: ${source}::${name}\nOriginal: ${match[0]}`} className="cursor-help border-b border-dotted border-gray-400 decoration-gray-400">
              {resolvedVal}
            </span>,
          );
        } else {
          // Unresolved variables: show as original text with warning style
          // Reconstruct original token if we have SVAR matches
          const displayToken = match[0].startsWith("SVAR") ? `{{ ${type}::${source}::${name} }}` : match[0];

          const badgeClass = "bg-red-50 text-red-700 border-red-200";
          parts.push(
            <span
              key={`var-${match.index}`}
              className={`mx-0.5 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono border ${badgeClass} select-none align-baseline`}
              title="Variable not found"
            >
              {displayToken}
            </span>,
          );
        }
      } else {
        parts.push(match[0]);
      }

      lastIndex = combinedRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return <>{parts}</>;
  };

  const createVariableRenderer = (TagName: string) => {
    const VariableRenderer = (props: any) => {
      const { children, node, ...rest } = props; // Extract node to prevent DOM warning
      return (
        <TagName {...rest}>
          {React.Children.map(children, (child) => {
            if (typeof child === "string") {
              return renderWithVariables(child);
            }
            return child;
          })}
        </TagName>
      );
    };
    return VariableRenderer;
  };

  const ListRenderer = (TagName: "ul" | "ol", defaultClass: string) => {
    return (props: any) => {
      const { children, className, node, ...rest } = props;
      return (
        <TagName className={classNames(defaultClass, className)} {...rest}>
          {children}
        </TagName>
      );
    };
  };

  const CodeRenderer = ({ children, className, node, ...props }: any) => {
    // For inline code or code blocks, we now want to RESOLVE variables if present,
    // rather than just reverting them.

    // Helper to resolve variables specifically for code (maybe without the span/badge wrapper if logical?)
    // But renderWithVariables returns spans. Spans inside <code> are valid.

    return (
      <code className={className} {...props}>
        {React.Children.map(children, (child) => {
          if (typeof child === "string") {
            return renderWithVariables(child);
          }
          return child;
        })}
      </code>
    );
  };

  const LinkRenderer = (props: any) => {
    const { href, children, ...rest } = props;
    const resolvedHref = href ? replaceVariablesInString(href) : href;

    // Ensure children are also processed for variables
    return (
      <a href={resolvedHref} {...rest}>
        {React.Children.map(children, (child) => {
          if (typeof child === "string") {
            return renderWithVariables(child);
          }
          return child;
        })}
      </a>
    );
  };

  const components = useMemo(
    () => ({
      p: createVariableRenderer("p"),
      li: createVariableRenderer("li"),
      ul: ListRenderer("ul", "list-disc pl-6 mb-4"),
      ol: ListRenderer("ol", "list-decimal pl-6 mb-4"),
      h1: createVariableRenderer("h1"),
      h2: createVariableRenderer("h2"),
      h3: createVariableRenderer("h3"),
      h4: createVariableRenderer("h4"),
      h5: createVariableRenderer("h5"),
      h6: createVariableRenderer("h6"),
      blockquote: createVariableRenderer("blockquote"),
      a: LinkRenderer,
      strong: createVariableRenderer("strong"),
      em: createVariableRenderer("em"),
      del: createVariableRenderer("del"),
      span: createVariableRenderer("span"),
      code: CodeRenderer,
    }),
    [globalParameters, serviceNames, context],
  );

  const variableCommand = useMemo(
    () => ({
      name: "variable",
      keyCommand: "variable",
      buttonProps: { "aria-label": "Insert Variable", title: "Insert Variable" },
      icon: (
        <svg width="12" height="12" viewBox="0 0 20 20" style={{ marginTop: "2px" }}>
          <path
            fill="currentColor"
            d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z"
          />
        </svg>
        // Generic 'variable' icon (circle with dot/plus?). Replaced with simple circle-dot path or similar.
        // Using a simple 'V' or similar might be clearer.
        // Let's use @uiw/react-md-editor's way: just an SVM.
        // Used a generic "record" icon path here.
      ),
      execute: (state: any) => {
        // Save selection
        selectionRef.current = { start: state.selection.start, end: state.selection.end };

        // Position picker?
        // This is hard since toolbar button click event isn't easily passed here for coordinates.
        // We can center it or use a fixed position relative to editor.
        // For now, center screen or top of editor.
        // Let's rely on standard modal centering or fixed absolute.
        const textarea = document.querySelector(".w-md-editor-text-input");
        if (textarea) {
          const rect = textarea.getBoundingClientRect();
          setPickerPos({
            top: rect.top + window.scrollY + 50,
            left: rect.left + window.scrollX + 50,
          });
        } else {
          setPickerPos({ top: window.scrollY + 100, left: window.scrollX + 100 });
        }

        setShowPicker(true);
      },
    }),
    [],
  );

  const handleSelectVariable = (variable: SmartVariable) => {
    const token = variable.fullToken;
    const start = selectionRef.current.start;
    const end = selectionRef.current.end;

    const newValue = value.substring(0, start) + token + value.substring(end);
    onChange?.(newValue);
    setShowPicker(false);
  };

  return (
    <div className={classNames("markdown-editor-wrapper relative", className)} data-color-mode="light">
      <MDEditor
        value={value}
        onChange={onChange}
        height={height}
        preview={preview}
        visibleDragbar={false}
        commands={[
          commands.bold,
          commands.italic,
          commands.strikethrough,
          commands.hr,
          commands.title,
          commands.divider,
          commands.link,
          commands.quote,
          commands.code,
          commands.divider,
          commands.unorderedListCommand,
          commands.orderedListCommand,
          commands.checkedListCommand,
          commands.divider,
          variableCommand, // Plug our custom command here
        ]}
        textareaProps={{
          placeholder: placeholder,
          disabled: readOnly,
        }}
        previewOptions={{
          components: components,
        }}
        // @ts-ignore
        renderPreview={React.useCallback(
          (source: string) => (
            <MDEditor.Markdown source={preprocess(source)} components={components} style={{ backgroundColor: "white", color: "#334155", minHeight: "100%" }} />
          ),
          [preprocess, components],
        )}
        className={classNames("rounded-lg overflow-hidden border border-slate-300", {
          "pointer-events-none opacity-60": readOnly,
        })}
        style={{
          backgroundColor: "white",
          color: "#334155", // slate-700
        }}
      />

      {showPicker &&
        createPortal(
          <div
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

export default MarkdownEditor;
