import React from 'react';

export interface NotificationPopoverContextValue {
  channel: string;
  setOpen: (open: boolean) => void;
  isOpen: boolean;
}

const NotificationPopoverContext =
  React.createContext<NotificationPopoverContextValue | null>(null);

export const NotificationPopoverProvider: React.FC<{
  value: NotificationPopoverContextValue;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return (
    <NotificationPopoverContext.Provider value={value}>
      {children}
    </NotificationPopoverContext.Provider>
  );
};

export const useNotificationPopover = () => {
  const context = React.useContext(NotificationPopoverContext);
  if (!context) {
    throw new Error('useNotificationPopover must be used within a NotificationPopoverProvider');
  }
  return context;
};

