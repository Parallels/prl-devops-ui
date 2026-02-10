import { Link, useLocation } from "react-router-dom";
import React, { useState } from "react";
import CustomIcon from "./CustomIcon";
import { type IconName } from "../icons/registry";

export type SideMenuItemType = "link" | "group" | "divider";

export interface SideMenuItemBase {
  /** When true, the item is not rendered in the menu */
  hidden?: boolean;
}

export interface SideMenuItemLink extends SideMenuItemBase {
  type?: "link";
  label: string;
  path: string;
  icon?: IconName;
}

export interface SideMenuItemGroup extends SideMenuItemBase {
  type: "group";
  label: string;
}

export interface SideMenuItemDivider extends SideMenuItemBase {
  type: "divider";
}

export type SideMenuItem = SideMenuItemLink | SideMenuItemGroup | SideMenuItemDivider;

export interface SideMenuProps {
  title?: string;
  /** Icon element shown in the logo area (always visible, collapsed or expanded) */
  logoIcon?: React.ReactNode;
  /** Text element shown next to the logoIcon when expanded */
  logoText?: React.ReactNode;
  items: SideMenuItem[];
  className?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  /** When true, the desktop sidebar uses h-full instead of a fixed calc height. */
  fullHeight?: boolean;
}

export const SideMenu = ({
  title,
  logoIcon,
  logoText,
  items,
  className = "",
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
  fullHeight = false,
}: SideMenuProps) => {
  const location = useLocation();
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  const isCollapsed = onToggleCollapse ? collapsed : internalCollapsed;
  const toggleCollapse = onToggleCollapse || (() => setInternalCollapsed(!internalCollapsed));

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const visibleItems = items.filter((item) => !item.hidden);

  // Mobile Overlay Classes
  const mobileClasses = `
    fixed inset-y-0 left-0 z-[60] w-64 bg-white/90 backdrop-blur-xl transition-transform duration-300 ease-in-out md:hidden
    ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
  `;

  // Desktop Classes
  const desktopClasses = `
    hidden md:flex flex-col flex-shrink-0 ${fullHeight ? "h-full" : "sticky top-16 h-[calc(100vh-64px)]"}
    transition-all duration-300 backdrop-blur-2xl bg-white/70 border-r border-white/20
    shadow-[10px_0_30px_-10px_rgba(0,0,0,0.1)] overflow-hidden
    ${isCollapsed ? "w-[68px]" : "w-64"}
  `;

  const logoSection = (logoIcon || logoText) && (
    <div className={`flex items-center border-b border-gray-200/60 px-4 py-4 ${isCollapsed ? "justify-center" : ""}`}>
      {logoIcon && (
        <div className="flex-shrink-0">{logoIcon}</div>
      )}
      {logoText && (
        <div
          className={`overflow-hidden transition-all duration-300 ${isCollapsed ? "w-0 opacity-0 ml-0" : "w-auto opacity-100 ml-3"
            }`}
        >
          <div className="whitespace-nowrap">{logoText}</div>
        </div>
      )}
    </div>
  );

  const renderContent = (isMobile: boolean) => (
    <>
      {/* Dither Noise Overlay */}
      <div
        className="absolute inset-0 opacity-[0.4] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative h-full flex flex-col w-full">
        {/* Logo Header */}
        {logoSection}

        {/* Title + Mobile Close */}
        {(title || isMobile) && (
          <div className={`px-6 pt-4 pb-2 flex items-center ${isCollapsed && !isMobile ? "justify-center px-3" : "justify-between"}`}>
            {title && !(isCollapsed && !isMobile) && (
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                {title}
              </h2>
            )}
            {/* Mobile Close Button */}
            {isMobile && (
              <button
                onClick={onCloseMobile}
                className="p-1 rounded-lg hover:bg-white/50 text-gray-400 hover:text-gray-700 transition-colors ml-auto"
              >
                <CustomIcon icon="Close" className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Navigation Items */}
        <div className="flex-1 px-3 py-2 overflow-y-auto w-full">
          <nav className="space-y-1 w-full">
            {visibleItems.map((item, index) => {
              // Divider
              if (item.type === "divider") {
                return (
                  <div
                    key={`divider-${index}`}
                    className={`my-2 border-t border-gray-200/60 ${isCollapsed && !isMobile ? "mx-1" : "mx-0"
                      }`}
                  />
                );
              }

              // Group Header
              if (item.type === "group") {
                // If collapsed, we generally don't show group headers (labels are hidden)
                // We also don't show a line because 'divider' items should be used for that.
                if (isCollapsed && !isMobile) {
                  return null;
                }
                return (
                  <div
                    key={`group-${index}-${item.label}`}
                    className="px-3 py-2 mt-4 mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider"
                  >
                    {item.label}
                  </div>
                );
              }

              // Link (Default)
              const linkItem = item as SideMenuItemLink;
              const active = isActive(linkItem.path);
              return (
                <Link
                  key={linkItem.path}
                  to={linkItem.path}
                  onClick={() => mobileOpen && onCloseMobile?.()}
                  title={isCollapsed && !isMobile ? linkItem.label : undefined}
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 ${active
                    ? "bg-red-50 text-red-700 shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    } ${isCollapsed && !isMobile ? "justify-center" : ""}`}
                >
                  {linkItem.icon && (
                    <CustomIcon
                      icon={linkItem.icon}
                      className={`h-5 w-5 flex-shrink-0 transition-colors duration-150 ${isCollapsed && !isMobile ? "" : "mr-3"
                        } ${active ? "text-red-500" : "text-gray-400 group-hover:text-gray-600"}`}
                    />
                  )}
                  {!(isCollapsed && !isMobile) && (
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                      {linkItem.label}
                    </span>
                  )}
                  {active && !(isCollapsed && !isMobile) && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Collapse Toggle (desktop only) */}
        {
          !isMobile && (
            <div className="flex-shrink-0 border-t border-gray-200/60 px-3 py-3">
              <button
                onClick={toggleCollapse}
                className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors ${isCollapsed ? "justify-center" : ""
                  }`}
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <CustomIcon
                  icon={isCollapsed ? "ChevronRight" : "ChevronLeft"}
                  className="w-4 h-4 flex-shrink-0"
                />
                {!isCollapsed && <span className="ml-3 whitespace-nowrap">Collapse</span>}
              </button>
            </div>
          )
        }
      </div >
    </>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`${mobileClasses} ${className}`}>
        {renderContent(true)}
      </aside>

      {/* Desktop Sidebar */}
      <aside className={`${desktopClasses} ${className}`}>
        {renderContent(false)}
      </aside>
    </>
  );
};

export default SideMenu;
