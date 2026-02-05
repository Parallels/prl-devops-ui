import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import CustomIcon from "./CustomIcon";
import { type IconName } from "../icons/registry";

export interface SideMenuItem {
  label: string;
  path: string;
  icon?: IconName;
}

export interface SideMenuProps {
  title?: string;
  items: SideMenuItem[];
  className?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const SideMenu = ({ title, items, className = "", collapsed = false, onToggleCollapse, mobileOpen = false, onCloseMobile }: SideMenuProps) => {
  const location = useLocation();
  // Fallback to internal state if not controlled (though we plan to control it)
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  const isCollapsed = onToggleCollapse ? collapsed : internalCollapsed;
  const toggleCollapse = onToggleCollapse || (() => setInternalCollapsed(!internalCollapsed));

  const isActive = (path: string) => location.pathname.includes(path);

  // Mobile Overlay Classes
  const mobileClasses = `
        fixed inset-y-0 left-0 z-[60] w-64 bg-white/90 backdrop-blur-xl transition-transform duration-300 ease-in-out md:hidden
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
    `;

  // Desktop Classes
  const desktopClasses = `
        hidden md:flex flex-col flex-shrink-0 sticky top-16 h-[calc(100vh-64px)] 
        transition-all duration-300 backdrop-blur-2xl bg-white/70 border-r border-white/20 
        shadow-[10px_0_30px_-10px_rgba(0,0,0,0.1)] overflow-hidden
        ${isCollapsed ? "w-20" : "w-64"}
    `;

  const commonContent = (
    <>
      {/* Dither Noise Overlay */}
      <div
        className="absolute inset-0 opacity-[0.4] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative h-full flex flex-col w-full">
        <div className="flex-1 px-3 py-4 overflow-y-auto w-full">
          <div className={`mb-4 px-3 flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
            {title && !isCollapsed && <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{title}</h2>}
            {/* Only show collapse toggle on desktop */}
            <button onClick={toggleCollapse} className="hidden md:block p-1 rounded-lg hover:bg-white/50 text-gray-400 hover:text-gray-700 transition-colors">
              <CustomIcon icon={isCollapsed ? "ArrowRight" : "ArrowLeft"} className="w-4 h-4" />
            </button>

            {/* Mobile Close Button */}
            <button onClick={onCloseMobile} className="md:hidden p-1 rounded-lg hover:bg-white/50 text-gray-400 hover:text-gray-700 transition-colors ml-auto">
              <CustomIcon icon="Close" className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1 w-full">
            {items.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => mobileOpen && onCloseMobile?.()}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive(item.path) ? "bg-red-50 text-red-700" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  } ${isCollapsed ? "justify-center" : ""}`}
              >
                {item.icon && (
                  <CustomIcon icon={item.icon} className={`h-5 w-5 flex-shrink-0 ${isCollapsed ? "" : "mr-3"} ${isActive(item.path) ? "text-red-500" : "text-gray-400 group-hover:text-gray-500"}`} />
                )}
                {!isCollapsed && <span className="whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      {mobileOpen && <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm md:hidden" onClick={onCloseMobile} />}
      <aside className={`${mobileClasses} ${className}`}>{commonContent}</aside>

      {/* Desktop Sidebar */}
      <aside className={`${desktopClasses} ${className}`}>{commonContent}</aside>
    </>
  );
};

export default SideMenu;
