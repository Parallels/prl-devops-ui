import classNames from "classnames";
import React, { type ReactNode } from "react";

type FormLayoutColumns = 1 | 2 | 3;
type FormLayoutGap = "sm" | "md" | "lg";

const columnClasses: Record<FormLayoutColumns, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
};

const gapClasses: Record<FormLayoutGap, string> = {
  sm: "gap-x-4 gap-y-4",
  md: "gap-x-6 gap-y-6",
  lg: "gap-x-8 gap-y-8",
};

const verticalPaddingClasses: Record<FormLayoutGap, string> = {
  sm: "py-2",
  md: "py-4",
  lg: "py-6",
};

export interface FormLayoutProps {
  columns?: FormLayoutColumns;
  gap?: FormLayoutGap;
  verticalPadding?: FormLayoutGap;
  children: ReactNode;
  className?: string;
}

const alignItemsClasses: Record<FormLayoutColumns, string> = {
  1: "items-start",
  2: "items-center",
  3: "items-center",
};

const FormLayout: React.FC<FormLayoutProps> = ({ columns = 1, gap = "md", children, className, verticalPadding = "sm" }) => (
  <div className={classNames("grid px-2", verticalPaddingClasses[verticalPadding], alignItemsClasses[columns], columnClasses[columns], gapClasses[gap], className)}>{children}</div>
);

export default FormLayout;
