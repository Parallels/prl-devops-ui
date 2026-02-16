import { IconName } from '@prl/ui-kit';

export interface HeaderNavigationItem {
  id: string;
  label: string;
  title?: string;
  description?: string;
  icon: IconName;
  show: boolean;
  isPressed?: () => boolean;
  onClick?: () => void;
}
