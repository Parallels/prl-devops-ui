import { Link, useLocation } from "react-router-dom";
import React, { useMemo, useState } from "react";
import CustomIcon from "./CustomIcon";
import { type IconName } from "../icons/registry";
import { ThemeColor } from "@/theme";

export type SideMenuItemType = "link" | "group" | "divider";

export interface SideMenuGuardClaim { type: 'claim'; claim: string }
export interface SideMenuGuardAnyClaim { type: 'anyClaim'; claims: string[] }
export interface SideMenuGuardAllClaims { type: 'allClaims'; claims: string[] }
export interface SideMenuGuardRole { type: 'role'; role: string }
export interface SideMenuGuardAnyRole { type: 'anyRole'; roles: string[] }
export interface SideMenuGuardModule { type: 'module'; module: string }
export interface SideMenuGuardAnyModule { type: 'anyModule'; modules: string[] }
export interface SideMenuGuardCustom { type: 'custom'; fn: () => boolean }

export type SideMenuItemGuard =
  | SideMenuGuardClaim | SideMenuGuardAnyClaim | SideMenuGuardAllClaims
  | SideMenuGuardRole | SideMenuGuardAnyRole
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
  color?: ThemeColor;
  type?: "link";
  label: string;
  path: string;
  icon?: IconName;
  groupName?: string;
  /** Optional badge rendered to the right of the label (e.g. active job count). */
  badge?: React.ReactNode;
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
  color?: ThemeColor;
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
  /**
   * Active module view filter (e.g. 'all' | 'host' | 'orchestrator').
   * When set to a non-'all' value, items whose module/anyModule guards reference
   * a module listed in `moduleViewOptions` must match this value to be shown.
   * Modules NOT in `moduleViewOptions` (e.g. 'reverse_proxy', 'api') are never
   * subject to the view filter and behave as before.
   * Items with no module guard are always shown.
   */
  activeModuleView?: string;
  /**
   * The set of module names that are treated as view-selectable
   * (e.g. ['host', 'orchestrator']). Only module guards whose value appears
   * in this list are subject to the activeModuleView filter.
   * Defaults to [] (no view filtering on any module).
   */
  moduleViewOptions?: readonly string[];
}


const getSideMenuColorTokens = (color: ThemeColor) => {
  switch (color) {
    case 'white':
      return {
        bg: 'bg-white dark:bg-neutral-800',
        text: 'text-neutral-900 dark:text-white',
        hoverBg: 'hover:bg-neutral-100 dark:hover:bg-neutral-700/50',
        hoverText: 'hover:text-neutral-900 dark:hover:text-white',
        iconActive: 'text-neutral-900 dark:text-white',
        iconHover: 'group-hover:text-neutral-900 dark:group-hover:text-white',
      };
    case 'neutral':
    case 'theme':
      return {
        bg: 'bg-neutral-100 dark:bg-neutral-800/60',
        text: 'text-neutral-900 dark:text-neutral-100',
        hoverBg: 'hover:bg-neutral-200 dark:hover:bg-neutral-700/50',
        hoverText: 'hover:text-neutral-900 dark:hover:text-neutral-100',
        iconActive: 'text-neutral-900 dark:text-neutral-100',
        iconHover: 'group-hover:text-neutral-900 dark:group-hover:text-neutral-100',
      };
    case 'brand':
    case 'blue':
      return {
        bg: 'bg-blue-50 dark:bg-blue-500/10',
        text: 'text-blue-700 dark:text-blue-400',
        hoverBg: 'hover:bg-blue-100 dark:hover:bg-blue-500/20',
        hoverText: 'hover:text-blue-900 dark:hover:text-blue-300',
        iconActive: 'text-blue-600 dark:text-blue-400',
        iconHover: 'group-hover:text-blue-700 dark:group-hover:text-blue-300',
      };
    case 'info':
    case 'sky':
      return {
        bg: 'bg-sky-50 dark:bg-sky-500/10',
        text: 'text-sky-700 dark:text-sky-400',
        hoverBg: 'hover:bg-sky-100 dark:hover:bg-sky-500/20',
        hoverText: 'hover:text-sky-900 dark:hover:text-sky-300',
        iconActive: 'text-sky-600 dark:text-sky-400',
        iconHover: 'group-hover:text-sky-700 dark:group-hover:text-sky-300',
      };
    case 'success':
    case 'emerald':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-500/10',
        text: 'text-emerald-700 dark:text-emerald-400',
        hoverBg: 'hover:bg-emerald-100 dark:hover:bg-emerald-500/20',
        hoverText: 'hover:text-emerald-900 dark:hover:text-emerald-300',
        iconActive: 'text-emerald-600 dark:text-emerald-400',
        iconHover: 'group-hover:text-emerald-700 dark:group-hover:text-emerald-300',
      };
    case 'warning':
    case 'amber':
      return {
        bg: 'bg-amber-50 dark:bg-amber-500/10',
        text: 'text-amber-700 dark:text-amber-400',
        hoverBg: 'hover:bg-amber-100 dark:hover:bg-amber-500/20',
        hoverText: 'hover:text-amber-900 dark:hover:text-amber-300',
        iconActive: 'text-amber-600 dark:text-amber-400',
        iconHover: 'group-hover:text-amber-700 dark:group-hover:text-amber-300',
      };
    case 'danger':
    case 'rose':
      return {
        bg: 'bg-rose-50 dark:bg-rose-500/10',
        text: 'text-rose-700 dark:text-rose-400',
        hoverBg: 'hover:bg-rose-100 dark:hover:bg-rose-500/20',
        hoverText: 'hover:text-rose-900 dark:hover:text-rose-300',
        iconActive: 'text-rose-600 dark:text-rose-400',
        iconHover: 'group-hover:text-rose-700 dark:group-hover:text-rose-300',
      };
    case 'parallels':
    case 'red':
      return {
        bg: 'bg-red-50 dark:bg-red-500/10',
        text: 'text-red-700 dark:text-red-400',
        hoverBg: 'hover:bg-red-100 dark:hover:bg-red-500/20',
        hoverText: 'hover:text-red-900 dark:hover:text-red-300',
        iconActive: 'text-red-600 dark:text-red-400',
        iconHover: 'group-hover:text-red-700 dark:group-hover:text-red-300',
      };
    case 'orange':
      return {
        bg: 'bg-orange-50 dark:bg-orange-500/10',
        text: 'text-orange-700 dark:text-orange-400',
        hoverBg: 'hover:bg-orange-100 dark:hover:bg-orange-500/20',
        hoverText: 'hover:text-orange-900 dark:hover:text-orange-300',
        iconActive: 'text-orange-600 dark:text-orange-400',
        iconHover: 'group-hover:text-orange-700 dark:group-hover:text-orange-300',
      };
    case 'yellow':
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-500/10',
        text: 'text-yellow-700 dark:text-yellow-400',
        hoverBg: 'hover:bg-yellow-100 dark:hover:bg-yellow-500/20',
        hoverText: 'hover:text-yellow-900 dark:hover:text-yellow-300',
        iconActive: 'text-yellow-600 dark:text-yellow-400',
        iconHover: 'group-hover:text-yellow-700 dark:group-hover:text-yellow-300',
      };
    case 'lime':
      return {
        bg: 'bg-lime-50 dark:bg-lime-500/10',
        text: 'text-lime-700 dark:text-lime-400',
        hoverBg: 'hover:bg-lime-100 dark:hover:bg-lime-500/20',
        hoverText: 'hover:text-lime-900 dark:hover:text-lime-300',
        iconActive: 'text-lime-600 dark:text-lime-400',
        iconHover: 'group-hover:text-lime-700 dark:group-hover:text-lime-300',
      };
    case 'green':
      return {
        bg: 'bg-green-50 dark:bg-green-500/10',
        text: 'text-green-700 dark:text-green-400',
        hoverBg: 'hover:bg-green-100 dark:hover:bg-green-500/20',
        hoverText: 'hover:text-green-900 dark:hover:text-green-300',
        iconActive: 'text-green-600 dark:text-green-400',
        iconHover: 'group-hover:text-green-700 dark:group-hover:text-green-300',
      };
    case 'teal':
      return {
        bg: 'bg-teal-50 dark:bg-teal-500/10',
        text: 'text-teal-700 dark:text-teal-400',
        hoverBg: 'hover:bg-teal-100 dark:hover:bg-teal-500/20',
        hoverText: 'hover:text-teal-900 dark:hover:text-teal-300',
        iconActive: 'text-teal-600 dark:text-teal-400',
        iconHover: 'group-hover:text-teal-700 dark:group-hover:text-teal-300',
      };
    case 'cyan':
      return {
        bg: 'bg-cyan-50 dark:bg-cyan-500/10',
        text: 'text-cyan-700 dark:text-cyan-400',
        hoverBg: 'hover:bg-cyan-100 dark:hover:bg-cyan-500/20',
        hoverText: 'hover:text-cyan-900 dark:hover:text-cyan-300',
        iconActive: 'text-cyan-600 dark:text-cyan-400',
        iconHover: 'group-hover:text-cyan-700 dark:group-hover:text-cyan-300',
      };
    case 'indigo':
      return {
        bg: 'bg-indigo-50 dark:bg-indigo-500/10',
        text: 'text-indigo-700 dark:text-indigo-400',
        hoverBg: 'hover:bg-indigo-100 dark:hover:bg-indigo-500/20',
        hoverText: 'hover:text-indigo-900 dark:hover:text-indigo-300',
        iconActive: 'text-indigo-600 dark:text-indigo-400',
        iconHover: 'group-hover:text-indigo-700 dark:group-hover:text-indigo-300',
      };
    case 'violet':
      return {
        bg: 'bg-violet-50 dark:bg-violet-500/10',
        text: 'text-violet-700 dark:text-violet-400',
        hoverBg: 'hover:bg-violet-100 dark:hover:bg-violet-500/20',
        hoverText: 'hover:text-violet-900 dark:hover:text-violet-300',
        iconActive: 'text-violet-600 dark:text-violet-400',
        iconHover: 'group-hover:text-violet-700 dark:group-hover:text-violet-300',
      };
    case 'purple':
      return {
        bg: 'bg-purple-50 dark:bg-purple-500/10',
        text: 'text-purple-700 dark:text-purple-400',
        hoverBg: 'hover:bg-purple-100 dark:hover:bg-purple-500/20',
        hoverText: 'hover:text-purple-900 dark:hover:text-purple-300',
        iconActive: 'text-purple-600 dark:text-purple-400',
        iconHover: 'group-hover:text-purple-700 dark:group-hover:text-purple-300',
      };
    case 'fuchsia':
      return {
        bg: 'bg-fuchsia-50 dark:bg-fuchsia-500/10',
        text: 'text-fuchsia-700 dark:text-fuchsia-400',
        hoverBg: 'hover:bg-fuchsia-100 dark:hover:bg-fuchsia-500/20',
        hoverText: 'hover:text-fuchsia-900 dark:hover:text-fuchsia-300',
        iconActive: 'text-fuchsia-600 dark:text-fuchsia-400',
        iconHover: 'group-hover:text-fuchsia-700 dark:group-hover:text-fuchsia-300',
      };
    case 'pink':
      return {
        bg: 'bg-pink-50 dark:bg-pink-500/10',
        text: 'text-pink-700 dark:text-pink-400',
        hoverBg: 'hover:bg-pink-100 dark:hover:bg-pink-500/20',
        hoverText: 'hover:text-pink-900 dark:hover:text-pink-300',
        iconActive: 'text-pink-600 dark:text-pink-400',
        iconHover: 'group-hover:text-pink-700 dark:group-hover:text-pink-300',
      };
    case 'slate':
      return {
        bg: 'bg-slate-50 dark:bg-slate-500/10',
        text: 'text-slate-700 dark:text-slate-400',
        hoverBg: 'hover:bg-slate-100 dark:hover:bg-slate-500/20',
        hoverText: 'hover:text-slate-900 dark:hover:text-slate-300',
        iconActive: 'text-slate-600 dark:text-slate-400',
        iconHover: 'group-hover:text-slate-700 dark:group-hover:text-slate-300',
      };
    case 'gray':
      return {
        bg: 'bg-gray-50 dark:bg-gray-500/10',
        text: 'text-gray-700 dark:text-gray-400',
        hoverBg: 'hover:bg-gray-100 dark:hover:bg-gray-500/20',
        hoverText: 'hover:text-gray-900 dark:hover:text-gray-300',
        iconActive: 'text-gray-600 dark:text-gray-400',
        iconHover: 'group-hover:text-gray-700 dark:group-hover:text-gray-300',
      };
    case 'zinc':
      return {
        bg: 'bg-zinc-50 dark:bg-zinc-500/10',
        text: 'text-zinc-700 dark:text-zinc-400',
        hoverBg: 'hover:bg-zinc-100 dark:hover:bg-zinc-500/20',
        hoverText: 'hover:text-zinc-900 dark:hover:text-zinc-300',
        iconActive: 'text-zinc-600 dark:text-zinc-400',
        iconHover: 'group-hover:text-zinc-700 dark:group-hover:text-zinc-300',
      };
    case 'stone':
      return {
        bg: 'bg-stone-50 dark:bg-stone-500/10',
        text: 'text-stone-700 dark:text-stone-400',
        hoverBg: 'hover:bg-stone-100 dark:hover:bg-stone-500/20',
        hoverText: 'hover:text-stone-900 dark:hover:text-stone-300',
        iconActive: 'text-stone-600 dark:text-stone-400',
        iconHover: 'group-hover:text-stone-700 dark:group-hover:text-stone-300',
      };
    default:
      return {
        bg: 'bg-blue-50 dark:bg-blue-500/10',
        text: 'text-blue-700 dark:text-blue-400',
        hoverBg: 'hover:bg-blue-100 dark:hover:bg-blue-500/20',
        hoverText: 'hover:text-blue-900 dark:hover:text-blue-300',
        iconActive: 'text-blue-600 dark:text-blue-400',
        iconHover: 'group-hover:text-blue-700 dark:group-hover:text-blue-300',
      };
  }
};

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
  activeModuleView,
  moduleViewOptions = [],
  color = 'blue',
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
    const isViewFiltered = !!activeModuleView && activeModuleView !== 'all';

    const passesModuleViewFilter = (guards: SideMenuItemGuard[]): boolean => {
      if (!isViewFiltered || moduleViewOptions.length === 0) return true;
      for (const guard of guards) {
        if (guard.type === 'module') {
          // Only view-filter this guard if the module is a known view option
          if (moduleViewOptions.includes(guard.module) && guard.module !== activeModuleView) return false;
        } else if (guard.type === 'anyModule') {
          // Only look at the subset of modules that are view options
          const viewModulesInGuard = guard.modules.filter((m) => moduleViewOptions.includes(m));
          if (viewModulesInGuard.length > 0 && !viewModulesInGuard.includes(activeModuleView!)) return false;
        }
      }
      return true;
    };

    const passesGuard = (item: SideMenuItem): boolean => {
      if (item.hidden) return false;
      if (item.guards?.length) {
        if (!passesModuleViewFilter(item.guards)) return false;
        if (guardEvaluator) return guardEvaluator(item.guards);
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
      if (item.type === 'group') return groupsWithVisibleLinks.has(item.slug);
      // Standalone dividers: hide if groupName set but that group has no visible links
      if (item.type === 'divider') return !item.groupName || groupsWithVisibleLinks.has(item.groupName);
      return true;
    });
  }, [items, guardEvaluator, activeModuleView, moduleViewOptions]);

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
    <div className={`flex items-center border-b border-gray-500/60 dark:border-neutral-700/60 px-4 py-4 ${isCollapsed ? "justify-center" : ""}`}>
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
        <div className="flex-1 px-3 py-1 overflow-y-auto w-full">
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
                    <div className={`px-3 py-1 mb-1 text-xs font-semibold text-gray-400 dark:text-neutral-500 uppercase tracking-wider ${index === 0 ? 'mt-1' : 'mt-4'}`}>
                      {item.label}
                    </div>
                  </React.Fragment>
                );
              }

              // Link (Default)
              const linkItem = item as SideMenuItemLink;
              const active = isActive(linkItem.path);
              const itemColor = linkItem.color || color;
              const tokens = getSideMenuColorTokens(itemColor);

              return (
                <Link
                  key={linkItem.path}
                  to={linkItem.path}
                  onClick={() => mobileOpen && onCloseMobile?.()}
                  title={isCollapsed && !isMobile ? linkItem.label : undefined}
                  className={`relative group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 ${active
                    ? `${tokens.bg} ${tokens.text} shadow-sm`
                    : `text-gray-600 dark:text-neutral-400 ${tokens.hoverBg} ${tokens.hoverText}`
                    } ${isCollapsed && !isMobile ? "justify-center" : ""}`}
                >
                  {linkItem.icon && (
                    <div className={`flex items-center justify-center relative flex-shrink-0 ${isCollapsed && !isMobile ? "" : "mr-3"}`}>
                      <CustomIcon
                        icon={linkItem.icon}
                        className={`h-5 w-5 transition-colors duration-150 ${active ? tokens.iconActive : `text-gray-400 dark:text-neutral-500 ${tokens.iconHover}`}`}
                      />
                      {/* Badge in collapsed mode: small dot over the icon */}
                      {isCollapsed && !isMobile && linkItem.badge && (
                        <span className="absolute -top-1 -right-1">{linkItem.badge}</span>
                      )}
                    </div>
                  )}
                  {!(isCollapsed && !isMobile) && (
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis flex-1">
                      {linkItem.label}
                    </span>
                  )}
                  {/* Badge in expanded mode: right-aligned next to label */}
                  {!(isCollapsed && !isMobile) && linkItem.badge && (
                    <span className="ml-auto flex-shrink-0 pl-2">{linkItem.badge}</span>
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
