import React from "react";
import Modal from "./Modal";
import { Button } from ".";
import { type IconName } from "../icons/registry";

export type NotificationType = "success" | "error" | "warning" | "info";

export interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: React.ReactNode;
  type?: NotificationType;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

const typeConfig: Record<NotificationType, { icon: IconName; color: string; titleColor: string }> = {
  success: { icon: "CheckCircle", color: "emerald", titleColor: "text-emerald-900" },
  error: { icon: "Warning" as IconName, color: "rose", titleColor: "text-rose-900" },
  warning: { icon: "Warning" as IconName, color: "amber", titleColor: "text-amber-900" },
  info: { icon: "Info", color: "blue", titleColor: "text-blue-900" },
};

export const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose, title, message, type = "info", actionLabel = "Close", onAction, secondaryActionLabel, onSecondaryAction }) => {
  const config = typeConfig[type];

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      icon={config.icon}
      actions={
        <Modal.Actions>
          {secondaryActionLabel && (
            <Button variant="soft" color="slate" onClick={onSecondaryAction || onClose}>
              {secondaryActionLabel}
            </Button>
          )}
          <Button onClick={handleAction} color={config.color as any}>
            {actionLabel}
          </Button>
        </Modal.Actions>
      }
    >
      <div className={`text-sm text-gray-600`}>{message}</div>
    </Modal>
  );
};

export default NotificationModal;
