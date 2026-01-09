import React, { ReactNode } from 'react';

export interface HeaderGroupProps {
  /**
   * Children to render inside the group
   */
  children: ReactNode;

  /**
   * Additional class names
   */
  className?: string;
}

/**
 * A component that displays a group of header elements with horizontal bars on either side
 */
export const HeaderGroup: React.FC<HeaderGroupProps> = ({ children, className = '' }) => {
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
