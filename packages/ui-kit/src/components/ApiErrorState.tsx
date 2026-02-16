import React from "react";
import { EmptyState, type EmptyStateProps } from ".";
import { type IconName } from "../icons/registry";

export interface ApiErrorStateProps extends Omit<EmptyStateProps, "title" | "tone" | "icon" | "onAction" | "buttonText"> {
  onRetry?: () => void;
  title?: React.ReactNode;
  isError?: boolean;
  buttonText?: string;
}

const ApiErrorState: React.FC<ApiErrorStateProps> = ({
  onRetry,
  title = "Connection Error",
  buttonText = "Try Again",
  subtitle = "We couldn't connect to the server. Please check your internet connection and try again.",
  isError = true,
  actionLeadingIcon = "Restart" as IconName,
  ...rest
}) => {
  if (!isError) return null;

  return (
    <EmptyState
      title={title}
      subtitle={subtitle}
      icon={"CloudOff" as IconName}
      tone="danger"
      onAction={onRetry}
      buttonText={onRetry ? buttonText : undefined}
      actionLeadingIcon={actionLeadingIcon}
      {...rest}
    />
  );
};

export default ApiErrorState;
