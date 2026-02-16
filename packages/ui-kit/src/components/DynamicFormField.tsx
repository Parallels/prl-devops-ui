import React, { useMemo } from "react";
import type { CapsuleBlueprintParameter } from "@prl/ui-kit";
import { CapsuleBlueprintValueType } from "@prl/ui-kit";
import { CollapsibleHelpText, Input, Checkbox, Select } from "@prl/ui-kit";
import classNames from "classnames";

type DynamicValue = string | boolean;

export interface DynamicFormFieldProps {
  parameter: CapsuleBlueprintParameter;
  value: DynamicValue;
  onChange: (serviceName: string, key: string, value: DynamicValue, triggerDependencyEvaluation?: boolean) => void;
  error?: string;
  className?: string;
  isVisible?: boolean;
}

const normalizeOptions = (options: CapsuleBlueprintParameter["options"]): Array<{ id: string; label: string; value: string }> => {
  if (!options) {
    return [];
  }
  if (Array.isArray(options)) {
    return options.map((option, index) => {
      if (typeof option === "string") {
        return {
          id: `opt-${index}-${option}`,
          label: option,
          value: option,
        };
      }
      return {
        id: `opt-${index}-${option.key ?? option.value}`,
        label: String(option.value ?? option.key ?? ""),
        value: String(option.key ?? option.value ?? ""),
      };
    });
  }
  return Object.entries(options).map(([key, label], index) => ({
    id: `opt-${index}-${key}`,
    label: String(label),
    value: key,
  }));
};

const DynamicFormField: React.FC<DynamicFormFieldProps> = ({ parameter, value, onChange, error, className, isVisible = true }) => {
  const { name, key, hint, is_required, options, is_secret, help } = parameter;
  const normalizedOptions = useMemo(() => normalizeOptions(options), [options]);

  const handleChange = (fieldValue: DynamicValue, trigger?: boolean) => {
    onChange(parameter.service_name || "global", key, fieldValue, trigger ?? true);
  };

  const handleBlur = () => {
    const hasDependencies = parameter.depends_on && parameter.depends_on.length > 0;
    if (hasDependencies && parameter.value_type === CapsuleBlueprintValueType.String) {
      handleChange(value, true);
    }
  };

  const renderTextField = (type: "text" | "password" | "number") => (
    <div className={classNames("w-full space-y-1", className)}>
      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
        {name}
        {is_required && <span className="ml-1 text-rose-500">*</span>}
      </label>
      <Input
        className="w-full"
        type={type}
        value={String(value ?? "")}
        onChange={(event) => handleChange(event.target.value)}
        onBlur={handleBlur}
        required={is_required}
        validationStatus={error ? "error" : "none"}
      />
      {(error || hint) && <p className={`text-xs ${error ? "text-rose-500" : "text-neutral-500"}`}>{error || hint}</p>}
    </div>
  );

  const renderField = () => {
    switch (parameter.value_type) {
      case CapsuleBlueprintValueType.String:
        return renderTextField(is_secret ? "password" : "text");
      case CapsuleBlueprintValueType.Int:
        return renderTextField("number");
      case CapsuleBlueprintValueType.Boolean:
        return <Checkbox checked={Boolean(value)} onChange={(event) => handleChange(event.target.checked)} label={name} description={hint} />;
      case CapsuleBlueprintValueType.Select:
        return (
          <div className="w-full space-y-1">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
              {name}
              {is_required && <span className="ml-1 text-rose-500">*</span>}
            </label>
            <Select value={String(value ?? "")} onChange={(event) => handleChange(event.target.value ?? "")} required={is_required} validationStatus={error ? "error" : "none"}>
              {normalizedOptions.map((option) => (
                <option key={option.id} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            {(error || hint) && <p className={`text-xs ${error ? "text-rose-500" : "text-neutral-500"}`}>{error || hint}</p>}
          </div>
        );
      default:
    }
  };

  if (!isVisible) {
    return null;
  }

  if (!parameter.value_type) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/50">
      {renderField()}
      {help && <CollapsibleHelpText title="What is this?" text={help} tone="emerald" maxLength={180} showIcon />}
    </div>
  );
};

export default DynamicFormField;
