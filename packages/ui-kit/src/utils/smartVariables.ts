import { type SmartVariable, type SmartVariableType, type SmartVariableSource } from "../types/Variables";

// Regex to match {{ type::source::name }}
// Captures: 1=type, 2=source, 3=name
export const SMART_VAR_REGEX = /\{\{\s*(var|env)::(global|system|service)::([a-zA-Z0-9_\-.]+)\s*\}\}/g;

export const parseSmartVariable = (token: string): SmartVariable | null => {
  // Reset regex index if reusing global regex, but here we just use match
  const match = token.match(/^\{\{\s*(var|env)::(global|system|service)::([a-zA-Z0-9_\-.]+)\s*\}\}$/);

  if (!match) return null;

  return {
    fullToken: token,
    type: match[1] as SmartVariableType,
    source: match[2] as SmartVariableSource,
    name: match[3],
  };
};

export const createSmartToken = (type: SmartVariableType, source: SmartVariableSource, name: string) => {
  return `{{ ${type}::${source}::${name} }}`;
};

/**
 * Extracts all unique variables from a given text string.
 */
export const extractVariables = (text: string): SmartVariable[] => {
  const variables: SmartVariable[] = [];
  const seen = new Set<string>();

  let match;
  // We need to loop because exec with global flag keeps state
  // Create a new regex instance or reset lastIndex if exposed global
  const regex = new RegExp(SMART_VAR_REGEX);

  while ((match = regex.exec(text)) !== null) {
    const fullToken = match[0];
    if (!seen.has(fullToken)) {
      seen.add(fullToken);
      variables.push({
        fullToken,
        type: match[1] as SmartVariableType,
        source: match[2] as SmartVariableSource,
        name: match[3],
      });
    }
  }

  return variables;
};

import { type CapsuleBlueprintParameter } from "../types/CapsuleBlueprint";

interface VariableContext {
  globalParameters?: CapsuleBlueprintParameter[];
  serviceNames?: string[];
  context?: {
    slug?: string;
    enable_https?: boolean;
  };
}

export const resolveVariable = (value: string, ctx: VariableContext): { value: string; isResolved: boolean; isRuntime: boolean } => {
  // Basic regex match for single variable
  const match = value.match(/^\{\{\s*(var|env)::(global|system|service)::([a-zA-Z0-9_\-.]+)\s*\}\}$/);
  if (!match) return { value, isResolved: false, isRuntime: false };

  const [, , source, name] = match;

  if (source === "global" || source === "env") {
    let param = ctx.globalParameters?.find((p) => p.key === name);
    if (!param) {
      // Fallback: Try case-insensitive comparison
      param = ctx.globalParameters?.find((p) => p.key.toLowerCase() === name.toLowerCase());
    }

    if (param) {
      const val = param.default ?? param.default_value;
      return { value: val ? String(val) : "", isResolved: true, isRuntime: false };
    }
    return { value: "", isResolved: false, isRuntime: false };
  }
  if (source === "service") {
    return { value: name, isResolved: true, isRuntime: false };
  }
  if (source === "system") {
    const lowerName = name.toLowerCase();
    // Derived Variables
    if (lowerName === "sub_domain") {
      return { value: ctx.context?.slug || "", isResolved: true, isRuntime: false };
    }
    if (lowerName === "domain") {
      return { value: "parallels.private", isResolved: true, isRuntime: false };
    }
    if (lowerName === "host_url") {
      const protocol = ctx.context?.enable_https ? "https" : "http";
      const domain = "parallels.private";
      const sub = ctx.context?.slug || "";
      if (sub) {
        return { value: `${protocol}://${sub}.${domain}`, isResolved: true, isRuntime: false };
      }
      return { value: "", isResolved: false, isRuntime: false };
    }

    // Runtime Variables
    const runtimeVars = ["name", "reverse_proxy_host", "ip_address", "host_gateway_ip", "capsule_id", "capsule_name", "host_ip", "app_url"];
    if (runtimeVars.includes(lowerName)) {
      return { value: `[${lowerName}]`, isResolved: true, isRuntime: true };
    }

    // Fallback for unknown system vars
    return { value: `[System: ${name}]`, isResolved: true, isRuntime: true };
  }
  return { value: "", isResolved: false, isRuntime: false };
};
