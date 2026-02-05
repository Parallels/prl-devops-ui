import React, { createContext, useContext, type ReactNode } from "react";
import { defaultIconRenderer, type IconRenderer } from "../types/Icon";

interface IconContextValue {
  renderIcon: IconRenderer;
}

const IconContext = createContext<IconContextValue>({
  renderIcon: defaultIconRenderer,
});

export interface IconProviderProps {
  renderIcon: IconRenderer;
  children: ReactNode;
}

/**
 * Provider for customizing icon rendering in ui-kit components.
 * Wrap your app with this provider to supply a custom icon renderer.
 */
export const IconProvider: React.FC<IconProviderProps> = ({
  renderIcon,
  children,
}) => {
  return (
    <IconContext.Provider value={{ renderIcon }}>
      {children}
    </IconContext.Provider>
  );
};

/**
 * Hook to access the icon renderer from context
 */
export const useIconRenderer = (): IconRenderer => {
  const context = useContext(IconContext);
  return context.renderIcon;
};

export { IconContext };
