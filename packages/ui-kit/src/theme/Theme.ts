import type { ButtonVariant } from "../components/Button";

export type ThemeColor =
  | "red"
  | "orange"
  | "amber"
  | "yellow"
  | "lime"
  | "green"
  | "emerald"
  | "teal"
  | "cyan"
  | "sky"
  | "blue"
  | "indigo"
  | "violet"
  | "purple"
  | "fuchsia"
  | "pink"
  | "rose"
  | "slate"
  | "gray"
  | "zinc"
  | "neutral"
  | "stone"
  | "white"
  | "brand"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "theme";

export type ThemeSize = "xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "xxxl" | "2xl" | "3xl" | "full";

export type ModalSize = "xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "xxxl" | "2xl" | "3xl" | "full";

type ButtonTheme = Record<ButtonVariant, Record<ThemeColor, string>>;
type ToggleTheme = Record<ThemeColor, string>;
type CheckboxTheme = Record<ThemeColor, string>;
type SpinnerTheme = Record<ThemeColor, [string, string, string, string]>;
type LoaderTheme = Record<ThemeColor, { track: string; bar: string }>;
type MultiToggleTheme = Record<ThemeColor, { active: string; activeText: string; indicator: string; hover: string }>;

type TabsColorTokens = {
  hoverText: string;
  activeText: string;
  onAccentText: string;
  focusRing: string;
  accentBg: string;
  subtleBg: string;
  subtleHoverBg: string;
  segmentedContainer: string;
  badgeSubtle: string;
  badgeStrong: string;
  badgeOnAccent: string;
  underlineActive: string;
};

type TabsTheme = Record<ThemeColor, TabsColorTokens>;

type PanelToneConfig = {
  border: string;
  heading: string;
  muted: string;
  badge: string;
  subtleBg: string;
  tonalBg: string;
  overlayGradient: string;
};

type PanelTheme = Record<ThemeColor, PanelToneConfig>;

type StepperToneConfig = {
  activeBg: string;
  activeText: string;
  completedBg: string;
  completedText: string;
  pendingBorder: string;
  pendingText: string;
  underlineBase: string;
};

type StepperTheme = Record<ThemeColor, StepperToneConfig>;

type BadgeTheme = Record<ThemeColor, string>;
type PillTheme = Record<ThemeColor, Record<"solid" | "soft" | "outline", { base: string; border?: string }>>;
type AlertTheme = Record<
  ThemeColor,
  {
    subtle: string;
    solid: string;
    outline: string;
    icon: string;
    text: string;
    border: string;
    dismiss: string;
  }
>;

type StatTileTheme = Record<
  ThemeColor,
  {
    decorationBg: string;
    iconColor: string;
    divider: string;
  }
>;

interface ThemeDefinition {
  button: ButtonTheme;
  toggle: ToggleTheme;
  checkbox: CheckboxTheme;
  spinner: SpinnerTheme;
  loader: LoaderTheme;
  multiToggle: MultiToggleTheme;
  tabs: TabsTheme;
  panel: PanelTheme;
  stepper: StepperTheme;
  badge: BadgeTheme;
  pill: PillTheme;
  alert: AlertTheme;
  statTile: StatTileTheme;
}

const colors: ThemeColor[] = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "white",
  "brand",
  "info",
  "success",
  "warning",
  "danger",
  "theme",
];

// Helper to map semantic colors to Tailwind colors
const resolveColor = (color: ThemeColor): string => {
  switch (color) {
    case "brand":
      return "blue";
    case "info":
      return "sky";
    case "success":
      return "emerald";
    case "warning":
      return "amber";
    case "danger":
      return "rose";
    case "theme":
      return "neutral";
    default:
      return color;
  }
};

const createTheme = (): ThemeDefinition => {
  const theme: ThemeDefinition = {
    button: { solid: {} as Record<ThemeColor, string>, soft: {} as Record<ThemeColor, string>, outline: {} as Record<ThemeColor, string>, ghost: {} as Record<ThemeColor, string>, link: {} as Record<ThemeColor, string>, clear: {} as Record<ThemeColor, string>, icon: {} as Record<ThemeColor, string> },
    toggle: {} as ToggleTheme,
    checkbox: {} as CheckboxTheme,
    spinner: {} as SpinnerTheme,
    loader: {} as LoaderTheme,
    multiToggle: {} as MultiToggleTheme,
    tabs: {} as TabsTheme,
    panel: {} as PanelTheme,
    stepper: {} as StepperTheme,
    badge: {} as BadgeTheme,
    pill: {} as PillTheme,
    alert: {} as AlertTheme,
    statTile: {} as StatTileTheme,
  };

  colors.forEach((color) => {
    const c = resolveColor(color);
    const isWhite = color === "white";
    const isTheme = color === "theme";

    // Button
    if (isWhite) {
      theme.button.solid[color] =
        "bg-white text-slate-900 shadow-sm hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700";
      theme.button.soft[color] =
        "bg-white/80 text-slate-800 ring-1 ring-inset ring-slate-200 hover:bg-white focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 dark:bg-white/10 dark:text-white dark:ring-white/20";
      theme.button.outline[color] =
        "border border-white/60 text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 dark:border-white/20 dark:text-white";
      theme.button.ghost[color] = "text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 dark:text-white/90";
      theme.button.link[color] = "text-white hover:text-white/80 hover:underline dark:text-white";
      theme.button.clear[color] = "text-white hover:text-white/80 dark:text-white";
      theme.button.icon[color] = "text-white bg-white/20 hover:bg-white/30 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 dark:text-white";
    } else if (isTheme) {
      theme.button.solid[color] =
        "bg-white text-neutral-800 border border-neutral-200 shadow-sm hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-700 dark:focus-visible:ring-neutral-500";
      theme.button.soft[color] =
        "bg-theme-background text-theme-foreground ring-1 ring-inset ring-theme-border hover:bg-theme-muted focus-visible:ring-2 focus-visible:ring-theme-secondary focus-visible:ring-offset-2 dark:bg-theme-surface dark:text-theme-foreground dark:ring-theme-border/60";
      theme.button.outline[color] =
        "border border-theme-border text-theme-foreground hover:bg-theme-muted focus-visible:ring-2 focus-visible:ring-theme-secondary focus-visible:ring-offset-2 dark:border-theme-border/80 dark:text-theme-foreground dark:hover:bg-theme-surface";
      theme.button.ghost[color] =
        "text-theme-foreground hover:bg-theme-muted focus-visible:ring-2 focus-visible:ring-theme-secondary focus-visible:ring-offset-2 dark:text-theme-foreground dark:hover:bg-theme-surface/80";
      theme.button.link[color] = "text-theme-foreground hover:text-theme-primary hover:underline";
      theme.button.clear[color] = "text-theme-foreground hover:text-theme-primary";
      theme.button.icon[color] =
        "text-theme-foreground bg-theme-muted hover:bg-theme-muted/80 focus-visible:ring-2 focus-visible:ring-theme-secondary focus-visible:ring-offset-2 dark:bg-theme-surface dark:text-theme-foreground";
    } else {
      theme.button.solid[color] =
        `bg-${c}-500 text-white shadow-sm hover:bg-${c}-400 focus-visible:ring-2 focus-visible:ring-${c}-500 focus-visible:ring-offset-2 dark:bg-${c}-400 dark:hover:bg-${c}-300`;
      theme.button.soft[color] =
        `bg-${c}-50 text-${c}-600 ring-1 ring-inset ring-${c}-200 hover:bg-${c}-100 focus-visible:ring-2 focus-visible:ring-${c}-400 focus-visible:ring-offset-2 dark:bg-${c}-500/10 dark:text-${c}-200 dark:ring-${c}-500/40`;
      theme.button.outline[color] =
        `border border-${c}-200 text-${c}-600 hover:bg-${c}-50 focus-visible:ring-2 focus-visible:ring-${c}-400 focus-visible:ring-offset-2 dark:border-${c}-500/50 dark:text-${c}-200 dark:hover:bg-${c}-500/10`;
      theme.button.ghost[color] = `text-${c}-600 hover:bg-${c}-50 focus-visible:ring-2 focus-visible:ring-${c}-400 focus-visible:ring-offset-2 dark:text-${c}-200 dark:hover:bg-${c}-500/10`;
      theme.button.link[color] = `text-${c}-600 hover:text-${c}-500 hover:underline dark:text-${c}-200`;
      theme.button.clear[color] = `text-${c}-600 hover:text-${c}-500 dark:text-${c}-200`;
      theme.button.icon[color] =
        `text-${c}-600 bg-${c}-50 hover:bg-${c}-100 focus-visible:ring-2 focus-visible:ring-${c}-400 focus-visible:ring-offset-2 dark:text-${c}-200 dark:bg-${c}-500/10 dark:hover:bg-${c}-500/20`;
    }

    // Toggle
    if (isWhite) {
      theme.toggle[color] = "peer-checked:bg-white peer-checked:border-white peer-focus:ring-neutral-300 dark:peer-checked:bg-neutral-200";
    } else if (isTheme) {
      theme.toggle[color] = "peer-checked:bg-theme-primary peer-checked:border-theme-primary peer-focus:ring-theme-secondary dark:peer-checked:bg-theme-secondary";
    } else {
      theme.toggle[color] = `peer-checked:bg-${c}-500 peer-checked:border-${c}-500 peer-focus:ring-${c}-400 dark:peer-checked:bg-${c}-400`;
    }

    // Checkbox
    if (isWhite || isTheme) {
      theme.checkbox[color] = "accent-neutral-600 focus-visible:ring-neutral-500 dark:focus-visible:ring-neutral-400";
    } else {
      theme.checkbox[color] = `accent-${c}-600 focus-visible:ring-${c}-500 dark:focus-visible:ring-${c}-400`;
    }

    // Spinner
    if (isWhite || isTheme) {
      theme.spinner[color] = [
        "border-t-white dark:border-t-neutral-300",
        "border-r-neutral-300 dark:border-r-neutral-200",
        "border-b-neutral-200 dark:border-b-neutral-100/60",
        "border-l-neutral-100 dark:border-l-neutral-100/40",
      ];
    } else {
      theme.spinner[color] = [
        `border-t-${c}-500 dark:border-t-${c}-300`,
        `border-r-${c}-300 dark:border-r-${c}-200`,
        `border-b-${c}-200 dark:border-b-${c}-100/60`,
        `border-l-${c}-100 dark:border-l-${c}-100/40`,
      ];
    }

    // Loader
    if (isWhite || isTheme) {
      theme.loader[color] = { track: "bg-neutral-100/60 dark:bg-neutral-800/60", bar: "bg-neutral-500" };
    } else {
      theme.loader[color] = { track: `bg-${c}-100/60 dark:bg-${c}-900/40`, bar: `bg-${c}-500` };
    }

    // MultiToggle
    if (isWhite || isTheme) {
      theme.multiToggle[color] = {
        active: "bg-white/90 dark:bg-neutral-200/90",
        activeText: "text-neutral-900 dark:text-neutral-900",
        indicator: "bg-neutral-500/15 dark:bg-neutral-200/20 border border-neutral-500/40 dark:border-neutral-200/30",
        hover: "hover:text-neutral-700 dark:hover:text-neutral-200",
      };
    } else {
      theme.multiToggle[color] = {
        active: `bg-${c}-500/90 dark:bg-${c}-400/90`,
        activeText: "text-white dark:text-white",
        indicator: `bg-${c}-500/15 dark:bg-${c}-400/20 border border-${c}-400/40 dark:border-${c}-300/20`,
        hover: `hover:text-${c}-600 dark:hover:text-${c}-300`,
      };
    }

    // Tabs
    if (isWhite) {
      theme.tabs[color] = {
        hoverText: "hover:text-slate-700 dark:hover:text-slate-200",
        activeText: "text-slate-900 dark:text-slate-100",
        onAccentText: "text-slate-900 dark:text-slate-100",
        focusRing: "focus-visible:ring-slate-400",
        accentBg: "bg-white dark:bg-slate-900/80",
        subtleBg: "bg-slate-100 dark:bg-slate-800/70",
        subtleHoverBg: "hover:bg-slate-200 dark:hover:bg-slate-800/60",
        segmentedContainer: "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/40",
        badgeSubtle: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
        badgeStrong: "bg-slate-300 text-slate-800 dark:bg-white/20 dark:text-white",
        badgeOnAccent: "bg-white text-slate-700 dark:bg-white/20 dark:text-white",
        underlineActive: "after:bg-slate-400 dark:after:bg-slate-200",
      };
    } else if (isTheme) {
      theme.tabs[color] = {
        hoverText: "hover:text-neutral-700 dark:hover:text-neutral-200",
        activeText: "text-neutral-800 dark:text-neutral-100",
        onAccentText: "text-neutral-900 dark:text-neutral-100",
        focusRing: "focus-visible:ring-neutral-400",
        accentBg: "bg-white dark:bg-neutral-800",
        subtleBg: "bg-neutral-100 dark:bg-neutral-800/70",
        subtleHoverBg: "hover:bg-neutral-200 dark:hover:bg-neutral-700/60",
        segmentedContainer: "border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/40",
        badgeSubtle: "bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200",
        badgeStrong: "bg-neutral-300 text-neutral-800 dark:bg-neutral-600/60 dark:text-white",
        badgeOnAccent: "bg-white/20 text-neutral-800 dark:bg-white/20 dark:text-white",
        underlineActive: "after:bg-neutral-500 dark:after:bg-neutral-200",
      };
    } else {
      theme.tabs[color] = {
        hoverText: `hover:text-${c}-500 dark:hover:text-${c}-200`,
        activeText: `text-${c}-600 dark:text-${c}-300`,
        onAccentText: "text-white dark:text-white",
        focusRing: `focus-visible:ring-${c}-400`,
        accentBg: `bg-${c}-500 dark:bg-${c}-400`,
        subtleBg: `bg-${c}-50 dark:bg-${c}-500/10`,
        subtleHoverBg: `hover:bg-${c}-100 dark:hover:bg-${c}-500/20`,
        segmentedContainer: `border-${c}-200 bg-${c}-50 dark:border-${c}-500/40 dark:bg-${c}-700/10`,
        badgeSubtle: `bg-${c}-100 text-${c}-600 dark:bg-${c}-500/20 dark:text-${c}-200`,
        badgeStrong: `bg-${c}-200 text-${c}-700 dark:bg-${c}-500/40 dark:text-${c}-100`,
        badgeOnAccent: "bg-white/20 text-white",
        underlineActive: `after:bg-${c}-500 dark:after:bg-${c}-400`,
      };
    }

    // Panel
    if (isTheme || isWhite || color === "neutral") {
      theme.panel[color] = {
        border: "border-neutral-200 dark:border-neutral-700",
        heading: "text-neutral-900 dark:text-neutral-100",
        muted: "text-neutral-600 dark:text-neutral-300",
        badge: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
        subtleBg: "bg-neutral-50/80 dark:bg-neutral-900/70",
        tonalBg: "bg-neutral-100/80 dark:bg-neutral-800/70",
        overlayGradient: "from-neutral-900/70 via-neutral-900/30 to-neutral-900/20",
      };
    } else {
      theme.panel[color] = {
        border: `border-${c}-300 dark:border-${c}-500/50`,
        heading: `text-${c}-700 dark:text-${c}-200`,
        muted: `text-${c}-600/90 dark:text-${c}-200/85`,
        badge: `bg-${c}-100 text-${c}-700 dark:bg-${c}-500/20 dark:text-${c}-100`,
        subtleBg: `bg-${c}-50/80 dark:bg-${c}-500/10`,
        tonalBg: `bg-${c}-100/80 dark:bg-${c}-500/15`,
        overlayGradient: `from-${c}-900/70 via-${c}-900/40 to-${c}-900/15`,
      };
    }

    // Stepper
    if (isTheme || isWhite || color === "neutral") {
      theme.stepper[color] = {
        activeBg: "bg-neutral-900 dark:bg-neutral-100",
        activeText: "text-white dark:text-neutral-900",
        completedBg: "bg-neutral-200 dark:bg-neutral-700",
        completedText: "text-neutral-800 dark:text-neutral-100",
        pendingBorder: "border-neutral-300 dark:border-neutral-700",
        pendingText: "text-neutral-500 dark:text-neutral-400",
        underlineBase: "bg-neutral-200 dark:bg-neutral-700",
      };
    } else {
      theme.stepper[color] = {
        activeBg: `bg-${c}-600 dark:bg-${c}-400`,
        activeText: "text-white",
        completedBg: `bg-${c}-100 dark:bg-${c}-600/60`,
        completedText: `text-${c}-700 dark:text-${c}-100`,
        pendingBorder: `border-${c}-200 dark:border-${c}-700/60`,
        pendingText: `text-${c}-500 dark:text-${c}-200`,
        underlineBase: `bg-${c}-100 dark:bg-${c}-700/40`,
      };
    }

    // Badge
    if (isWhite || isTheme) {
      theme.badge[color] = "bg-slate-600 text-white dark:bg-slate-500";
    } else {
      theme.badge[color] = `bg-${c}-500 text-white dark:bg-${c}-400`;
    }

    // Pill
    if (isWhite || isTheme || color === "neutral") {
      theme.pill[color] = {
        solid: { base: "bg-neutral-800 text-white" },
        soft: { base: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800/80 dark:text-neutral-100" },
        outline: {
          base: "text-neutral-700 dark:text-neutral-100",
          border: "border border-neutral-300 dark:border-neutral-600",
        },
      };
    } else {
      theme.pill[color] = {
        solid: { base: `bg-${c}-500 text-white` },
        soft: { base: `bg-${c}-50 text-${c}-700 dark:bg-${c}-500/15 dark:text-${c}-100` },
        outline: {
          base: `text-${c}-600 dark:text-${c}-200`,
          border: `border border-${c}-200 dark:border-${c}-500/40`,
        },
      };
    }

    // Alert
    if (isWhite || isTheme || color === "neutral") {
      theme.alert[color] = {
        subtle: "bg-neutral-100 text-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-100",
        solid: "bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-800",
        outline: "bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-100",
        icon: "text-neutral-500 dark:text-neutral-300",
        text: "text-neutral-700 dark:text-neutral-200",
        border: "border-neutral-200 dark:border-neutral-700",
        dismiss: "hover:text-neutral-900 dark:hover:text-white",
      };
    } else {
      theme.alert[color] = {
        subtle: `bg-${c}-50 text-${c}-800 dark:bg-${c}-900/40 dark:text-${c}-100`,
        solid: `bg-${c}-600 text-white dark:bg-${c}-500 dark:text-white`,
        outline: `bg-white text-${c}-700 dark:bg-${c}-900/60 dark:text-${c}-100`,
        icon: `text-${c}-500 dark:text-${c}-300`,
        text: `text-${c}-700 dark:text-${c}-100`,
        border: `border-${c}-200 dark:border-${c}-700`,
        dismiss: `hover:text-${c}-700 dark:hover:text-${c}-100`,
      };
    }

    // StatTile
    if (isWhite || isTheme || color === "neutral") {
      theme.statTile[color] = {
        decorationBg: "bg-neutral-300/40 dark:bg-neutral-600/20",
        iconColor: "text-neutral-800 dark:text-neutral-200",
        divider: "border-neutral-200 dark:border-neutral-700",
      };
    } else {
      theme.statTile[color] = {
        decorationBg: `bg-${c}-300/40 dark:bg-${c}-400/20`,
        iconColor: `text-${c}-800 dark:text-${c}-300`,
        divider: `border-${c}-200 dark:border-${c}-800`,
      };
    }
  });

  return theme;
};

const defaultTheme: ThemeDefinition = createTheme();

let currentTheme: ThemeDefinition = defaultTheme;

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Record<string, unknown> ? DeepPartial<T[K]> : T[K];
};

type PlainObject = Record<string, unknown>;

const isPlainObject = (value: unknown): value is PlainObject => typeof value === "object" && value !== null && !Array.isArray(value);

const deepMerge = (base: PlainObject, overrides?: DeepPartial<PlainObject>): PlainObject => {
  if (!overrides) {
    return base;
  }

  const result: PlainObject = { ...base };
  const overrideEntries = Object.entries(overrides as PlainObject);

  for (const [key, overrideValue] of overrideEntries) {
    if (overrideValue === undefined) {
      continue;
    }

    const baseValue = base[key];
    if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
      result[key] = deepMerge(baseValue, overrideValue as DeepPartial<PlainObject>);
    } else {
      result[key] = overrideValue;
    }
  }

  return result;
};

const mergeTheme = <T extends object>(base: T, overrides?: DeepPartial<T>): T => {
  if (!overrides) {
    return base;
  }

  return deepMerge(base as PlainObject, overrides as DeepPartial<PlainObject>) as T;
};

export const configureTheme = (overrides: DeepPartial<ThemeDefinition>): void => {
  currentTheme = mergeTheme(defaultTheme, overrides);
};

export const resetTheme = (): void => {
  currentTheme = defaultTheme;
};

export const getButtonColorClasses = (variant: ButtonVariant, color: ThemeColor): string => {
  const variantTheme = currentTheme.button[variant] ?? currentTheme.button.solid;
  const fallbackVariant = currentTheme.button.solid;
  return variantTheme[color] ?? variantTheme.blue ?? fallbackVariant[color] ?? fallbackVariant.blue;
};

export const getToggleColorClasses = (color: ThemeColor): string => currentTheme.toggle[color] ?? currentTheme.toggle.blue;

export const getCheckboxColorClasses = (color: ThemeColor): string => currentTheme.checkbox[color] ?? currentTheme.checkbox.blue;

export const getSpinnerColorTokens = (color: ThemeColor): [string, string, string, string] => currentTheme.spinner[color] ?? currentTheme.spinner.blue;

export const getLoaderProgressColors = (color: ThemeColor): { track: string; bar: string } => currentTheme.loader[color] ?? currentTheme.loader.blue;

export const getMultiToggleColorTokens = (color: ThemeColor): { active: string; activeText: string; indicator: string; hover: string } =>
  currentTheme.multiToggle[color] ?? currentTheme.multiToggle.blue;

export const getTabsColorTokens = (color: ThemeColor): TabsColorTokens => currentTheme.tabs[color] ?? currentTheme.tabs.blue;

export const getPanelToneStyles = (tone: ThemeColor): PanelToneConfig => currentTheme.panel[tone] ?? currentTheme.panel.neutral;

export const getStepperTonePalette = (tone: ThemeColor): StepperToneConfig => currentTheme.stepper[tone] ?? currentTheme.stepper.brand;

export const getBadgeColorClasses = (color: ThemeColor): string => currentTheme.badge[color] ?? currentTheme.badge.danger;

export const getPillColorClasses = (color: ThemeColor, variant: "solid" | "soft" | "outline"): { base: string; border?: string } =>
  currentTheme.pill[color]?.[variant] ?? currentTheme.pill.info[variant];

export const getAlertColorClasses = (color: ThemeColor): AlertTheme[ThemeColor] => currentTheme.alert[color] ?? currentTheme.alert.neutral;

export const getStatTileColorClasses = (color: ThemeColor): StatTileTheme[ThemeColor] => currentTheme.statTile[color] ?? currentTheme.statTile.blue;
