import React, { createContext, useCallback, useContext, useState } from "react";

export interface SideMenuActionsContextValue {
  /** Per-item / list actions (e.g. "Add" button in the list panel header). */
  sideItemActions?: React.ReactNode;
  /** Detail panel actions (e.g. PageHeader action buttons). */
  sidePanelActions?: React.ReactNode;
  /** Push new list/item actions into the header. Pass `undefined` to clear. */
  setSideItemActions: (actions: React.ReactNode | undefined) => void;
  /** Push new panel actions into the header. Pass `undefined` to clear. */
  setSidePanelActions: (actions: React.ReactNode | undefined) => void;
}

const noop = () => {};

const SideMenuActionsContext = createContext<SideMenuActionsContextValue>({
  setSideItemActions: noop,
  setSidePanelActions: noop,
});

export interface SideMenuActionsProviderProps {
  initialSideItemActions?: React.ReactNode;
  initialSidePanelActions?: React.ReactNode;
  children: React.ReactNode;
}

export const SideMenuActionsProvider: React.FC<
  SideMenuActionsProviderProps
> = ({ initialSideItemActions, initialSidePanelActions, children }) => {
  const [sideItemActions, setSideItemActionsState] = useState<React.ReactNode>(
    initialSideItemActions,
  );
  const [sidePanelActions, setSidePanelActionsState] =
    useState<React.ReactNode>(initialSidePanelActions);

  const setSideItemActions = useCallback(
    (actions: React.ReactNode | undefined) => {
      setSideItemActionsState(actions);
    },
    [],
  );

  const setSidePanelActions = useCallback(
    (actions: React.ReactNode | undefined) => {
      setSidePanelActionsState(actions);
    },
    [],
  );

  return (
    <SideMenuActionsContext.Provider
      value={{
        sideItemActions,
        sidePanelActions,
        setSideItemActions,
        setSidePanelActions,
      }}
    >
      {children}
    </SideMenuActionsContext.Provider>
  );
};

export const useSideMenuActions = (): SideMenuActionsContextValue =>
  useContext(SideMenuActionsContext);
