import React, { useState } from "react";
import classNames from "classnames";
import SideMenu, { type SideMenuProps } from "./SideMenu";
import CustomIcon from "./CustomIcon";

export interface SideMenuLayoutProps {
  /** Props passed to the SideMenu component */
  sideMenuProps: SideMenuProps;
  /** Content rendered in the fixed header bar at the top of the main area */
  header?: React.ReactNode;
  /** Main scrollable body content */
  children?: React.ReactNode;
  /** Additional class name for the root container */
  className?: string;
  /** Additional class name for the header section */
  headerClassName?: string;
  /** Additional class name for the scrollable body */
  bodyClassName?: string;
}

export const SideMenuLayout = ({
  sideMenuProps,
  header,
  children,
  className,
  headerClassName,
  bodyClassName,
}: SideMenuLayoutProps) => {
  const [collapsed, setCollapsed] = useState(sideMenuProps.collapsed ?? false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggleCollapse = () => {
    if (sideMenuProps.onToggleCollapse) {
      sideMenuProps.onToggleCollapse();
    } else {
      setCollapsed((prev) => !prev);
    }
  };

  const isCollapsed = sideMenuProps.onToggleCollapse
    ? (sideMenuProps.collapsed ?? false)
    : collapsed;

  const handleCloseMobile = () => {
    if (sideMenuProps.onCloseMobile) {
      sideMenuProps.onCloseMobile();
    } else {
      setMobileOpen(false);
    }
  };

  const isMobileOpen = sideMenuProps.onCloseMobile
    ? (sideMenuProps.mobileOpen ?? false)
    : mobileOpen;

  return (
    <div className={classNames("flex h-full w-full overflow-hidden bg-gray-50", className)}>
      {/* Side Menu */}
      <SideMenu
        {...sideMenuProps}
        collapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        mobileOpen={isMobileOpen}
        onCloseMobile={handleCloseMobile}
        fullHeight
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 h-full">
        {/* Mobile menu toggle */}
        <div className="md:hidden flex items-center px-4 py-2 border-b border-gray-200 bg-white">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            aria-label="Open menu"
          >
            <CustomIcon icon="ViewRows" className="w-5 h-5" />
          </button>
        </div>

        {/* Header */}
        {header && (
          <div
            className={classNames(
              "flex-shrink-0",
              headerClassName,
            )}
          >
            {header}
          </div>
        )}

        {/* Scrollable Body */}
        <main
          className={classNames(
            "flex-1 overflow-y-auto",
            bodyClassName,
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default SideMenuLayout;
