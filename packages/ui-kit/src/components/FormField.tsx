import classNames from "classnames";
import React, { type ReactNode, useId } from "react";

type FormFieldLayout = "stacked" | "inline";
type FormFieldValidationStatus = "none" | "error" | "success";
type FormFieldWidth = "auto" | "full";

export interface FormFieldProps {
  label?: ReactNode;
  labelFor?: string;
  description?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  validationStatus?: FormFieldValidationStatus;
  required?: boolean;
  optionalLabel?: ReactNode;
  labelAction?: ReactNode;
  layout?: FormFieldLayout;
  children: ReactNode;
  className?: string;
  helpText?: ReactNode;
  width?: FormFieldWidth;
}

const descriptionColor = "text-neutral-600 dark:text-neutral-300";
const hintColor = "text-neutral-500 dark:text-neutral-400";
const errorColor = "text-rose-600 dark:text-rose-400";
const successColor = "text-emerald-600 dark:text-emerald-400";

const FormField: React.FC<FormFieldProps> = ({
  label,
  labelFor,
  description,
  hint,
  error,
  validationStatus = "none",
  required = false,
  optionalLabel,
  labelAction,
  layout = "stacked",
  children,
  className,
  helpText,
  width = "auto",
}) => {
  const fieldId = useId();
  type ChildElementProps = {
    id?: string;
    "aria-describedby"?: string;
    "aria-invalid"?: string;
  };

  const childElement = React.isValidElement(children) ? (children as React.ReactElement<ChildElementProps>) : null;

  const controlId = labelFor ?? childElement?.props?.id ?? `field-${fieldId}`;

  const descriptionId = description ? `${controlId}-description` : undefined;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const helpId = helpText ? `${controlId}-help` : undefined;

  const describedBy = [descriptionId, hintId, errorId, helpId].filter(Boolean).join(" ").trim();

  const child =
    childElement && describedBy
      ? React.cloneElement(childElement, {
          id: controlId,
          "aria-describedby": classNames(childElement.props["aria-describedby"], describedBy),
          "aria-invalid": validationStatus === "error" ? "true" : (childElement.props["aria-invalid"] ?? undefined),
        })
      : children;

  const layoutClasses = layout === "inline" ? "sm:grid sm:grid-cols-3 sm:items-start sm:gap-6" : "flex flex-col gap-2";

  const widthClasses = width === "full" ? "w-full" : "w-auto";

  const labelWrapperClasses = layout === "inline" ? "sm:col-span-1 flex flex-col" : "flex items-center justify-between gap-2";

  const controlWrapperClasses = layout === "inline" ? "sm:col-span-2 mt-2 sm:mt-0" : "p-1 flex flex-col gap-2";

  const statusColor = validationStatus === "error" ? errorColor : validationStatus === "success" ? successColor : hintColor;

  return (
    <div className={classNames(layoutClasses, widthClasses, className)}>
      <div className={labelWrapperClasses}>
        {(label || optionalLabel) && (
          <div className="flex items-center gap-2">
            {label && (
              <label htmlFor={controlId} className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {label}
                {required && (
                  <span className="ml-1 text-rose-500 dark:text-rose-400" aria-hidden="true">
                    *
                  </span>
                )}
              </label>
            )}
            {!required && optionalLabel && <span className="text-sm text-neutral-500 dark:text-neutral-400">{optionalLabel}</span>}
          </div>
        )}
        {description && (
          <p id={descriptionId} className={classNames("mt-1 text-sm", descriptionColor)}>
            {description}
          </p>
        )}
        {labelAction && <div className="mt-2 sm:mt-4">{labelAction}</div>}
      </div>

      <div className={controlWrapperClasses}>
        <div className="flex flex-col gap-2">{child}</div>
        {helpText && (
          <p id={helpId} className={classNames("text-sm", hintColor)}>
            {helpText}
          </p>
        )}
        {error ? (
          <p id={errorId} className={classNames("text-sm", errorColor)}>
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className={classNames("text-sm", statusColor)}>
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default FormField;
