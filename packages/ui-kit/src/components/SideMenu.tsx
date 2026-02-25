import { Link, useLocation } from "react-router-dom";
import React, { useMemo, useState } from "react";
import CustomIcon from "./CustomIcon";
import { type IconName } from "../icons/registry";

export type SideMenuItemType = "link" | "group" | "divider";

export interface SideMenuGuardClaim     { type: 'claim';     claim: string }
export interface SideMenuGuardAnyClaim  { type: 'anyClaim';  claims: string[] }
export interface SideMenuGuardAllClaims { type: 'allClaims'; claims: string[] }
export interface SideMenuGuardRole      { type: 'role';      role: string }
export interface SideMenuGuardAnyRole   { type: 'anyRole';   roles: string[] }
export interface SideMenuGuardModule    { type: 'module';    module: string }
export interface SideMenuGuardAnyModule { type: 'anyModule'; modules: string[] }
export interface SideMenuGuardCustom    { type: 'custom';    fn: () => boolean }

export type SideMenuItemGuard =
  | SideMenuGuardClaim | SideMenuGuardAnyClaim | SideMenuGuardAllClaims
  | SideMenuGuardRole  | SideMenuGuardAnyRole
  | SideMenuGuardModule | SideMenuGuardAnyModule
  | SideMenuGuardCustom;

export interface SideMenuItemBase {
  /** When true, the item is not rendered in the menu */
  hidden?: boolean;
  slug: string;
  /** Guard rules — ALL must pass (AND logic). */
  guards?: SideMenuItemGuard[];
}

export interface SideMenuItemLink extends SideMenuItemBase {
  type?: "link";
  label: string;
  path: string;
  icon?: IconName;
  groupName?: string;
}

export interface SideMenuItemGroup extends SideMenuItemBase {
  type: "group";
  label: string;
  /** When true, renders a divider line immediately before the group header. */
  hasDivider?: boolean;
}

export interface SideMenuItemDivider extends SideMenuItemBase {
  type: "divider";
  groupName?: string;
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
  /** Called with item.guards; return true = show. Omit to show all. */
  guardEvaluator?: (guards: SideMenuItemGuard[]) => boolean;
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
  guardEvaluator,
}: SideMenuProps) => {
  const location = useLocation();
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  const isCollapsed = onToggleCollapse ? collapsed : internalCollapsed;
  const toggleCollapse = onToggleCollapse || (() => setInternalCollapsed(!internalCollapsed));

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const visibleItems = useMemo(() => {
    const passesGuard = (item: SideMenuItem): boolean => {
      if (item.hidden) return false;
      if (item.guards?.length && guardEvaluator) {
        return guardEvaluator(item.guards);
      }
      return true;
    };

    // Which group slugs have ≥1 visible link?
    const groupsWithVisibleLinks = new Set<string>();
    items.forEach((item) => {
      if (item.type !== 'group' && item.type !== 'divider' && passesGuard(item)) {
        const link = item as SideMenuItemLink;
        if (link.groupName) groupsWithVisibleLinks.add(link.groupName);
      }
    });

    return items.filter((item) => {
      if (!passesGuard(item)) return false;
      if (item.type === 'group')   return groupsWithVisibleLinks.has(item.slug);
      // Standalone dividers: hide if groupName set but that group has no visible links
      if (item.type === 'divider') return !item.groupName || groupsWithVisibleLinks.has(item.groupName);
      return true;
    });
  }, [items, guardEvaluator]);

  // Mobile Overlay Classes
  const mobileClasses = `
    fixed inset-y-0 left-0 z-[60] w-64 bg-white/90 dark:bg-neutral-900/95 backdrop-blur-xl transition-transform duration-300 ease-in-out md:hidden
    ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
  `;

  // Desktop Classes
  const desktopClasses = `
    hidden md:flex flex-col flex-shrink-0 ${fullHeight ? "h-full" : "sticky top-16 h-[calc(100vh-64px)]"}
    transition-all duration-300 backdrop-blur-2xl bg-white/70 dark:bg-neutral-900/90 border-r border-white/20 dark:border-neutral-700/60
    shadow-[10px_0_30px_-10px_rgba(0,0,0,0.1)] dark:shadow-[10px_0_30px_-10px_rgba(0,0,0,0.4)] overflow-hidden
    ${isCollapsed ? "w-[68px]" : "w-64"}
  `;

  const logoSection = (logoIcon || logoText) && (
    <div className={`flex items-center border-b border-gray-200/60 dark:border-neutral-700/60 px-4 py-4 ${isCollapsed ? "justify-center" : ""}`}>
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
              <h2 className="text-xs font-semibold text-gray-400 dark:text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                {title}
              </h2>
            )}
            {/* Mobile Close Button */}
            {isMobile && (
              <button
                onClick={onCloseMobile}
                className="p-1 rounded-lg hover:bg-white/50 dark:hover:bg-neutral-700/50 text-gray-400 dark:text-neutral-500 hover:text-gray-700 dark:hover:text-neutral-200 transition-colors ml-auto"
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
                    className={`my-2 border-t border-gray-200/60 dark:border-neutral-700/60 ${isCollapsed && !isMobile ? "mx-1" : "mx-0"
                      }`}
                  />
                );
              }

              // Group Header
              if (item.type === "group") {
                if (isCollapsed && !isMobile) return null;
                return (
                  <React.Fragment key={`group-${index}-${item.label}`}>
                    {item.hasDivider && (
                      <div className={`my-2 border-t border-gray-200/60 ${isCollapsed && !isMobile ? "mx-1" : "mx-0"}`} />
                    )}
                    <div className="px-3 py-2 mt-4 mb-1 text-xs font-semibold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">
                      {item.label}
                    </div>
                  </React.Fragment>
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
                    ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 shadow-sm"
                    : "text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700/50 hover:text-gray-900 dark:hover:text-neutral-100"
                    } ${isCollapsed && !isMobile ? "justify-center" : ""}`}
                >
                  {linkItem.icon && (
                    <CustomIcon
                      icon={linkItem.icon}
                      className={`h-5 w-5 flex-shrink-0 transition-colors duration-150 ${isCollapsed && !isMobile ? "" : "mr-3"
                        } ${active ? "text-red-500 dark:text-red-400" : "text-gray-400 dark:text-neutral-500 group-hover:text-gray-600 dark:group-hover:text-neutral-300"}`}
                    />
                  )}
                  {!(isCollapsed && !isMobile) && (
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                      {linkItem.label}
                    </span>
                  )}

                </Link>
              );
            })}
          </nav>
        </div>

        {/* Collapse Toggle (desktop only) */}
        {
          !isMobile && (
            <div className="flex-shrink-0 border-t border-gray-200/60 dark:border-neutral-700/60 px-3 py-3">
              <button
                onClick={toggleCollapse}
                className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg text-gray-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-700/50 hover:text-gray-700 dark:hover:text-neutral-200 transition-colors ${isCollapsed ? "justify-center" : ""
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
