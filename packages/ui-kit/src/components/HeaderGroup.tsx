import React, { type ReactNode } from "react";

export interface HeaderGroupProps {
  children: ReactNode;
  className?: string;
}

export const HeaderGroup: React.FC<HeaderGroupProps> = ({ children, className = "" }) => {
  return (
    <div
      className={`flex
        items-center
        text-black
        dark:text-white
        h-full
        relative
        [&+&]:ml-2
        [&+&::before]:content-['']
        [&+&::before]:absolute
        [&+&::before]:left-[-4px]
        [&+&::before]:top-1/2
        [&+&::before]:-translate-y-1/2
        [&+&::before]:transform
        [&+&::before]:h-1/2
        [&+&::before]:w-[2px]
        [&+&::before]:bg-neutral-300
        ${className}`}
    >
      <div className="flex items-center px-1">{children}</div>
    </div>
  );
};

HeaderGroup.displayName = "HeaderGroup";

export default HeaderGroup;
