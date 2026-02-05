// Re-export from @prl/ui-kit for migrated pure UI components
export {
  // Primitives
  Alert,
  AppDivider,
  Badge,
  BadgeIcon,
  Pill,
  Progress,
  Spinner,
  StatusSpinner,
  Loader,
  EmptyState,
  DynamicImg,
  // Buttons
  Button,
  IconButton,
  DropdownButton,
  // Form Controls
  Input,
  Textarea,
  Select,
  Combobox,
  Checkbox,
  Toggle,
  MultiToggle,
  FormField,
  FormLayout,
  FormSection,
  InputGroup,
  MultiSelectPills,
  SearchBar,
  // Layout
  Panel,
  CollapsiblePanel,
  HeaderGroup,
  DetailItemCard,
  InfiniteScrollPanel,
  CollapsibleHelpText,
  // Dropdown
  DropdownMenu,
  // Complex
  Accordion,
  Tabs,
  // Hooks
  useAccordion,
  useStepper,
} from "@prl/ui-kit";

// Re-export types from @prl/ui-kit
export type {
  AlertProps,
  BadgeProps,
  ButtonProps,
  ButtonVariant,
  ButtonColor,
  ButtonSize,
  PanelProps,
  TabsProps,
  TabItem,
  AccordionProps,
  AccordionItem,
  DropdownMenuOption,
  MultiToggleOption,
} from "@prl/ui-kit";

// Local app-specific components that depend on app code
// Local app-specific components that depend on app code
// Re-export moved components
export {
  Modal, ModalActions as UIModalActions, ConfirmModal as UIModalConfirm,
  ApiErrorState,
  CustomIcon,
  DynamicFormField,
  NotificationModal,
  Table,
  Stepper,
  KeyValueArrayField,
  StatTile,
  StatGoalTile,
  type StatGoalTileProps,
  StatChartTile,
  type StatChartTileProps, type StatChartDataset, type StatChartItem,
  StatGraphTile,
  type StatGraphTileProps, type StatGraphSeries,
  StatCountTile,
  type StatCountTileProps, type StatCountTileBreakdown,
  StartupStageStepper,
  MarkdownEditor,
  UserAvatar,
  VariablePicker,
  SmartInput,
  SmartValue
} from "@prl/ui-kit";


// Context exports
export { BottomSheetProvider, useBottomSheet } from "@prl/ui-kit";
