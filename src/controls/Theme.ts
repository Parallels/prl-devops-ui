import type { ButtonColor, ButtonVariant } from './Button';
import type { PanelTone } from './Panel';
import type { MultiToggleColor } from './MultiToggle';
import type { SpinnerColor } from './Spinner';
import type { CheckboxColor } from './Checkbox';

export type ThemeColor =
  | 'indigo'
  | 'blue'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'slate'
  | 'white'
  | 'theme';

export type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl' | '2xl' | '3xl' | 'full';

type ButtonTheme = Record<ButtonVariant, Record<ButtonColor, string>>;
type ToggleTheme = Record<ThemeColor, string>;
type CheckboxTheme = Record<CheckboxColor, string>;
type SpinnerTheme = Record<SpinnerColor, [string, string, string, string]>;
type LoaderTheme = Record<SpinnerColor, { track: string; bar: string }>;
type MultiToggleTheme = Record<
  MultiToggleColor,
  { active: string; activeText: string; indicator: string; hover: string }
>;

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

type TabsTheme = Record<ButtonColor, TabsColorTokens>;

type PanelToneConfig = {
  border: string;
  heading: string;
  muted: string;
  badge: string;
  subtleBg: string;
  tonalBg: string;
  overlayGradient: string;
};

type PanelTheme = Record<PanelTone, PanelToneConfig>;
type StepperTheme = Record<PanelTone, StepperToneConfig>;

type StepperToneConfig = {
  activeBg: string;
  activeText: string;
  completedBg: string;
  completedText: string;
  pendingBorder: string;
  pendingText: string;
  underlineBase: string;
};

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
}

const defaultTheme: ThemeDefinition = {
  button: {
    solid: {
      indigo:
        'bg-indigo-500 text-white shadow-sm hover:bg-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:bg-indigo-400 dark:hover:bg-indigo-300',
      blue: 'bg-blue-500 text-white shadow-sm hover:bg-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 dark:bg-blue-400 dark:hover:bg-blue-300',
      emerald:
        'bg-emerald-500 text-white shadow-sm hover:bg-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:bg-emerald-400 dark:hover:bg-emerald-300',
      amber:
        'bg-amber-500 text-white shadow-sm hover:bg-amber-400 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:bg-amber-500 dark:hover:bg-amber-400',
      rose: 'bg-rose-500 text-white shadow-sm hover:bg-rose-400 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:bg-rose-400 dark:hover:bg-rose-300',
      slate:
        'bg-slate-800 text-white shadow-sm hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-slate-600 focus-visible:ring-offset-2 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-100',
      white:
        'bg-white text-slate-900 shadow-sm hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
      theme:
        'bg-white text-neutral-800 border border-neutral-200 shadow-sm hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-700 dark:focus-visible:ring-neutral-500',
    },
    soft: {
      indigo:
        'bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-200 hover:bg-indigo-100 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 dark:bg-indigo-500/10 dark:text-indigo-200 dark:ring-indigo-500/40',
      blue: 'bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-200 hover:bg-blue-100 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 dark:bg-blue-300/10 dark:text-blue-200 dark:ring-blue-300/40',
      emerald:
        'bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-100 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/40',
      amber:
        'bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-200 hover:bg-amber-100 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 dark:bg-amber-500/10 dark:text-amber-100 dark:ring-amber-500/40',
      rose: 'bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-200 hover:bg-rose-100 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-500/40',
      slate:
        'bg-slate-800/10 text-slate-800 ring-1 ring-inset ring-slate-200 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 dark:bg-slate-200/15 dark:text-slate-100 dark:ring-slate-200/40',
      white:
        'bg-white/80 text-slate-800 ring-1 ring-inset ring-slate-200 hover:bg-white focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 dark:bg-white/10 dark:text-white dark:ring-white/20',
      theme:
        'bg-theme-background text-theme-foreground ring-1 ring-inset ring-theme-border hover:bg-theme-muted focus-visible:ring-2 focus-visible:ring-theme-secondary focus-visible:ring-offset-2 dark:bg-theme-surface dark:text-theme-foreground dark:ring-theme-border/60',
    },
    outline: {
      indigo:
        'border border-indigo-200 text-indigo-600 hover:bg-indigo-50 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 dark:border-indigo-500/50 dark:text-indigo-200 dark:hover:bg-indigo-500/10',
      blue: 'border border-blue-200 text-blue-600 hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 dark:border-blue-500/50 dark:text-blue-200 dark:hover:bg-blue-500/10',
      emerald:
        'border border-emerald-200 text-emerald-600 hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 dark:border-emerald-500/50 dark:text-emerald-200 dark:hover:bg-emerald-500/10',
      amber:
        'border border-amber-200 text-amber-600 hover:bg-amber-50 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 dark:border-amber-500/50 dark:text-amber-100 dark:hover:bg-amber-500/10',
      rose: 'border border-rose-200 text-rose-600 hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 dark:border-rose-500/50 dark:text-rose-200 dark:hover:bg-rose-500/10',
      slate:
        'border border-slate-200 text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800/30',
      white:
        'border border-white/60 text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 dark:border-white/20 dark:text-white',
      theme:
        'border border-theme-border text-theme-foreground hover:bg-theme-muted focus-visible:ring-2 focus-visible:ring-theme-secondary focus-visible:ring-offset-2 dark:border-theme-border/80 dark:text-theme-foreground dark:hover:bg-theme-surface',
    },
    ghost: {
      indigo:
        'text-indigo-600 hover:bg-indigo-50 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 dark:text-indigo-200 dark:hover:bg-indigo-500/10',
      blue: 'text-blue-600 hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 dark:text-blue-200 dark:hover:bg-blue-500/10',
      emerald:
        'text-emerald-600 hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 dark:text-emerald-200 dark:hover:bg-emerald-500/10',
      amber:
        'text-amber-600 hover:bg-amber-50 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 dark:text-amber-200 dark:hover:bg-amber-500/10',
      rose: 'text-rose-600 hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 dark:text-rose-200 dark:hover:bg-rose-500/10',
      slate:
        'text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 dark:text-slate-200 dark:hover:bg-slate-800/40',
      white:
        'text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 dark:text-white/90',
      theme:
        'text-theme-foreground hover:bg-theme-muted focus-visible:ring-2 focus-visible:ring-theme-secondary focus-visible:ring-offset-2 dark:text-theme-foreground dark:hover:bg-theme-surface/80',
    },
    link: {
      indigo: 'text-indigo-600 hover:text-indigo-500 hover:underline dark:text-indigo-200',
      blue: 'text-blue-600 hover:text-blue-500 hover:underline dark:text-blue-200',
      emerald: 'text-emerald-600 hover:text-emerald-500 hover:underline dark:text-emerald-200',
      amber: 'text-amber-600 hover:text-amber-500 hover:underline dark:text-amber-200',
      rose: 'text-rose-600 hover:text-rose-500 hover:underline dark:text-rose-200',
      slate: 'text-slate-700 hover:text-slate-600 hover:underline dark:text-slate-200',
      white: 'text-white hover:text-white/80 hover:underline dark:text-white',
      theme: 'text-theme-foreground hover:text-theme-primary hover:underline',
    },
    clear: {
      indigo: 'text-indigo-600 hover:text-indigo-500 dark:text-indigo-200',
      blue: 'text-blue-600 hover:text-blue-500 dark:text-blue-200',
      emerald: 'text-emerald-600 hover:text-emerald-500 dark:text-emerald-200',
      amber: 'text-amber-600 hover:text-amber-500 dark:text-amber-200',
      rose: 'text-rose-600 hover:text-rose-500 dark:text-rose-200',
      slate: 'text-slate-700 hover:text-slate-600 dark:text-slate-200',
      white: 'text-white hover:text-white/80 dark:text-white',
      theme: 'text-theme-foreground hover:text-theme-primary',
    },
    icon: {
      indigo:
        'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 dark:text-indigo-200 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20',
      blue: 'text-blue-600 bg-blue-50 hover:bg-blue-100 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 dark:text-blue-200 dark:bg-blue-500/10 dark:hover:bg-blue-500/20',
      emerald:
        'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 dark:text-emerald-200 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20',
      amber:
        'text-amber-600 bg-amber-50 hover:bg-amber-100 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 dark:text-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20',
      rose: 'text-rose-600 bg-rose-50 hover:bg-rose-100 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 dark:text-rose-200 dark:bg-rose-500/10 dark:hover:bg-rose-500/20',
      slate:
        'text-slate-700 bg-slate-100 hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 dark:text-slate-200 dark:bg-slate-800/40 dark:hover:bg-slate-800/60',
      white:
        'text-white bg-white/20 hover:bg-white/30 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 dark:text-white',
      theme:
        'text-theme-foreground bg-theme-muted hover:bg-theme-muted/80 focus-visible:ring-2 focus-visible:ring-theme-secondary focus-visible:ring-offset-2 dark:bg-theme-surface dark:text-theme-foreground',
    },
  },
  toggle: {
    indigo:
      'peer-checked:bg-indigo-500 peer-checked:border-indigo-500 peer-focus:ring-indigo-400 dark:peer-checked:bg-indigo-400',
    blue: 'peer-checked:bg-blue-500 peer-checked:border-blue-500 peer-focus:ring-blue-400 dark:peer-checked:bg-blue-400',
    emerald:
      'peer-checked:bg-emerald-500 peer-checked:border-emerald-500 peer-focus:ring-emerald-400 dark:peer-checked:bg-emerald-400',
    amber:
      'peer-checked:bg-amber-400 peer-checked:border-amber-400 peer-focus:ring-amber-400 dark:peer-checked:bg-amber-300',
    rose: 'peer-checked:bg-rose-500 peer-checked:border-rose-500 peer-focus:ring-rose-400 dark:peer-checked:bg-rose-400',
    slate:
      'peer-checked:bg-slate-800 peer-checked:border-slate-800 peer-focus:ring-slate-500 dark:peer-checked:bg-slate-400',
    white:
      'peer-checked:bg-white peer-checked:border-white peer-focus:ring-neutral-300 dark:peer-checked:bg-neutral-200',
    theme:
      'peer-checked:bg-theme-primary peer-checked:border-theme-primary peer-focus:ring-theme-secondary dark:peer-checked:bg-theme-secondary',
  },
  checkbox: {
    indigo: 'accent-indigo-600 focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400',
    blue: 'accent-blue-600 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400',
    emerald:
      'accent-emerald-600 focus-visible:ring-emerald-500 dark:focus-visible:ring-emerald-400',
    amber: 'accent-amber-500 focus-visible:ring-amber-500 dark:focus-visible:ring-amber-400',
    rose: 'accent-rose-600 focus-visible:ring-rose-500 dark:focus-visible:ring-rose-400',
    slate: 'accent-slate-700 focus-visible:ring-slate-600 dark:focus-visible:ring-slate-400',
  },
  spinner: {
    indigo: [
      'border-t-indigo-500 dark:border-t-indigo-300',
      'border-r-indigo-300 dark:border-r-indigo-200',
      'border-b-indigo-200 dark:border-b-indigo-100/60',
      'border-l-indigo-100 dark:border-l-indigo-100/40',
    ],
    blue: [
      'border-t-blue-500 dark:border-t-blue-300',
      'border-r-blue-300 dark:border-r-blue-200',
      'border-b-blue-200 dark:border-b-blue-100/60',
      'border-l-blue-100 dark:border-l-blue-100/40',
    ],
    emerald: [
      'border-t-emerald-500 dark:border-t-emerald-300',
      'border-r-emerald-200 dark:border-r-emerald-200',
      'border-b-emerald-200 dark:border-b-emerald-100/60',
      'border-l-emerald-100 dark:border-l-emerald-100/40',
    ],
    amber: [
      'border-t-amber-500 dark:border-t-amber-300',
      'border-r-amber-300 dark:border-r-amber-200',
      'border-b-amber-200 dark:border-b-amber-100/60',
      'border-l-amber-100 dark:border-l-amber-100/40',
    ],
    rose: [
      'border-t-rose-500 dark:border-t-rose-300',
      'border-r-rose-300 dark:border-r-rose-200',
      'border-b-rose-200 dark:border-b-rose-100/60',
      'border-l-rose-100 dark:border-l-rose-100/40',
    ],
    slate: [
      'border-t-slate-500 dark:border-t-slate-300',
      'border-r-slate-300 dark:border-r-slate-200',
      'border-b-slate-200 dark:border-b-slate-100/60',
      'border-l-slate-100 dark:border-l-slate-100/40',
    ],
  },
  loader: {
    indigo: {
      track: 'bg-indigo-100/60 dark:bg-indigo-900/40',
      bar: 'bg-indigo-500',
    },
    blue: {
      track: 'bg-blue-100/60 dark:bg-blue-900/40',
      bar: 'bg-blue-500',
    },
    emerald: {
      track: 'bg-emerald-100/60 dark:bg-emerald-900/40',
      bar: 'bg-emerald-500',
    },
    amber: {
      track: 'bg-amber-100/60 dark:bg-amber-900/40',
      bar: 'bg-amber-500',
    },
    rose: {
      track: 'bg-rose-100/60 dark:bg-rose-900/40',
      bar: 'bg-rose-500',
    },
    slate: {
      track: 'bg-slate-100/60 dark:bg-slate-800/60',
      bar: 'bg-slate-500',
    },
  },
  multiToggle: {
    indigo: {
      active: 'bg-indigo-500/90 dark:bg-indigo-400/90',
      activeText: 'text-white dark:text-white',
      indicator:
        'bg-indigo-500/15 dark:bg-indigo-400/20 border border-indigo-400/40 dark:border-indigo-300/20',
      hover: 'hover:text-indigo-600 dark:hover:text-indigo-300',
    },
    blue: {
      active: 'bg-blue-500/90 dark:bg-blue-400/90',
      activeText: 'text-white dark:text-white',
      indicator:
        'bg-blue-500/20 dark:bg-blue-400/20 border border-blue-400/40 dark:border-blue-300/20',
      hover: 'hover:text-blue-500 dark:hover:text-blue-300',
    },
    emerald: {
      active: 'bg-emerald-500/90 dark:bg-emerald-400/90',
      activeText: 'text-white dark:text-white',
      indicator:
        'bg-emerald-500/15 dark:bg-emerald-400/20 border border-emerald-400/40 dark:border-emerald-300/20',
      hover: 'hover:text-emerald-600 dark:hover:text-emerald-300',
    },
    amber: {
      active: 'bg-amber-500/90 dark:bg-amber-400/90',
      activeText: 'text-slate-900 dark:text-slate-900',
      indicator:
        'bg-amber-500/20 dark:bg-amber-400/20 border border-amber-400/40 dark:border-amber-300/20',
      hover: 'hover:text-amber-600 dark:hover:text-amber-300',
    },
    rose: {
      active: 'bg-rose-500/90 dark:bg-rose-400/90',
      activeText: 'text-white dark:text-white',
      indicator:
        'bg-rose-500/15 dark:bg-rose-400/20 border border-rose-400/40 dark:border-rose-300/20',
      hover: 'hover:text-rose-600 dark:hover:text-rose-300',
    },
    slate: {
      active: 'bg-slate-700/90 dark:bg-slate-200/90',
      activeText: 'text-white dark:text-slate-900',
      indicator:
        'bg-slate-500/15 dark:bg-slate-200/20 border border-slate-500/40 dark:border-slate-200/30',
      hover: 'hover:text-slate-700 dark:hover:text-slate-200',
    },
  },
  tabs: {
    indigo: {
      hoverText: 'hover:text-indigo-400 dark:hover:text-indigo-200',
      activeText: 'text-indigo-500 dark:text-indigo-300',
      onAccentText: 'text-white dark:text-white',
      focusRing: 'focus-visible:ring-indigo-400',
      accentBg: 'bg-indigo-500 dark:bg-indigo-400',
      subtleBg: 'bg-indigo-50 dark:bg-indigo-500/10',
      subtleHoverBg: 'hover:bg-indigo-100 dark:hover:bg-indigo-500/20',
      segmentedContainer:
        'border-indigo-200 bg-indigo-50 dark:border-indigo-500/40 dark:bg-indigo-700/10',
      badgeSubtle: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200',
      badgeStrong: 'bg-indigo-200 text-indigo-700 dark:bg-indigo-500/40 dark:text-indigo-100',
      badgeOnAccent: 'bg-white/20 text-white',
      underlineActive: 'after:bg-indigo-500 dark:after:bg-indigo-400',
    },
    blue: {
      hoverText: 'hover:text-blue-500 dark:hover:text-blue-400',
      activeText: 'text-blue-500 dark:text-blue-300',
      onAccentText: 'text-white dark:text-white',
      focusRing: 'focus-visible:ring-blue-400',
      accentBg: 'bg-blue-500 dark:bg-blue-400',
      subtleBg: 'bg-blue-50 dark:bg-blue-500/10',
      subtleHoverBg: 'hover:bg-blue-100 dark:hover:bg-blue-500/20',
      segmentedContainer: 'border-blue-200 bg-blue-50 dark:border-blue-500/40 dark:bg-blue-700/10',
      badgeSubtle: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-200',
      badgeStrong: 'bg-blue-200 text-blue-700 dark:bg-blue-500/40 dark:text-blue-100',
      badgeOnAccent: 'bg-white/20 text-white',
      underlineActive: 'after:bg-blue-500 dark:after:bg-blue-400',
    },
    emerald: {
      hoverText: 'hover:text-emerald-400 dark:hover:text-emerald-200',
      activeText: 'text-emerald-500 dark:text-emerald-300',
      onAccentText: 'text-white dark:text-white',
      focusRing: 'focus-visible:ring-emerald-400',
      accentBg: 'bg-emerald-500 dark:bg-emerald-400',
      subtleBg: 'bg-emerald-50 dark:bg-emerald-500/10',
      subtleHoverBg: 'hover:bg-emerald-100 dark:hover:bg-emerald-500/20',
      segmentedContainer:
        'border-emerald-200 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-700/10',
      badgeSubtle: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200',
      badgeStrong: 'bg-emerald-200 text-emerald-700 dark:bg-emerald-500/40 dark:text-emerald-100',
      badgeOnAccent: 'bg-white/20 text-white',
      underlineActive: 'after:bg-emerald-500 dark:after:bg-emerald-800',
    },
    amber: {
      hoverText: 'hover:text-amber-400 dark:hover:text-amber-200',
      activeText: 'text-amber-500 dark:text-amber-200',
      onAccentText: 'text-white dark:text-slate-900',
      focusRing: 'focus-visible:ring-amber-400',
      accentBg: 'bg-amber-500 dark:bg-amber-400',
      subtleBg: 'bg-amber-50 dark:bg-amber-500/10',
      subtleHoverBg: 'hover:bg-amber-100 dark:hover:bg-amber-500/20',
      segmentedContainer:
        'border-amber-200 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-700/10',
      badgeSubtle: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-200',
      badgeStrong: 'bg-amber-200 text-amber-700 dark:bg-amber-500/40 dark:text-amber-100',
      badgeOnAccent: 'bg-white/20 text-white dark:text-amber-900',
      underlineActive: 'after:bg-amber-500 dark:after:bg-amber-400',
    },
    rose: {
      hoverText: 'hover:text-rose-400 dark:hover:text-rose-200',
      activeText: 'text-rose-500 dark:text-rose-300',
      onAccentText: 'text-white dark:text-white',
      focusRing: 'focus-visible:ring-rose-400',
      accentBg: 'bg-rose-500 dark:bg-rose-400',
      subtleBg: 'bg-rose-50 dark:bg-rose-500/10',
      subtleHoverBg: 'hover:bg-rose-100 dark:hover:bg-rose-500/20',
      segmentedContainer: 'border-rose-200 bg-rose-50 dark:border-rose-500/40 dark:bg-rose-700/10',
      badgeSubtle: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200',
      badgeStrong: 'bg-rose-200 text-rose-700 dark:bg-rose-500/40 dark:text-rose-100',
      badgeOnAccent: 'bg-white/20 text-white',
      underlineActive: 'after:bg-rose-500 dark:after:bg-rose-400',
    },
    slate: {
      hoverText: 'hover:text-slate-500 dark:hover:text-slate-200',
      activeText: 'text-slate-700 dark:text-slate-200',
      onAccentText: 'text-white dark:text-slate-900',
      focusRing: 'focus-visible:ring-slate-300',
      accentBg: 'bg-slate-700 dark:bg-slate-200',
      subtleBg: 'bg-slate-100 dark:bg-slate-900/40',
      subtleHoverBg: 'hover:bg-slate-200 dark:hover:bg-slate-800/60',
      segmentedContainer: 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40',
      badgeSubtle: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
      badgeStrong: 'bg-slate-300 text-slate-800 dark:bg-slate-600/60 dark:text-white',
      badgeOnAccent: 'bg-white/20 text-neutral-800 dark:bg-white/20 dark:text-white',
      underlineActive: 'after:bg-slate-500 dark:after:bg-slate-200',
    },
    white: {
      hoverText: 'hover:text-slate-700 dark:hover:text-slate-200',
      activeText: 'text-slate-900 dark:text-slate-100',
      onAccentText: 'text-slate-900 dark:text-slate-100',
      focusRing: 'focus-visible:ring-slate-400',
      accentBg: 'bg-white dark:bg-slate-900/80',
      subtleBg: 'bg-slate-100 dark:bg-slate-800/70',
      subtleHoverBg: 'hover:bg-slate-200 dark:hover:bg-slate-800/60',
      segmentedContainer: 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/40',
      badgeSubtle: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
      badgeStrong: 'bg-slate-300 text-slate-800 dark:bg-white/20 dark:text-white',
      badgeOnAccent: 'bg-white text-slate-700 dark:bg-white/20 dark:text-white',
      underlineActive: 'after:bg-slate-400 dark:after:bg-slate-200',
    },
    theme: {
      hoverText: 'hover:text-neutral-700 dark:hover:text-neutral-200',
      activeText: 'text-neutral-800 dark:text-neutral-100',
      onAccentText: 'text-neutral-900 dark:text-neutral-100',
      focusRing: 'focus-visible:ring-neutral-400',
      accentBg: 'bg-white dark:bg-neutral-800',
      subtleBg: 'bg-neutral-100 dark:bg-neutral-800/70',
      subtleHoverBg: 'hover:bg-neutral-200 dark:hover:bg-neutral-700/60',
      segmentedContainer:
        'border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/40',
      badgeSubtle: 'bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200',
      badgeStrong: 'bg-neutral-300 text-neutral-800 dark:bg-neutral-600/60 dark:text-white',
      badgeOnAccent: 'bg-white/20 text-neutral-800 dark:bg-white/20 dark:text-white',
      underlineActive: 'after:bg-neutral-500 dark:after:bg-neutral-200',
    },
  },
  panel: {
    neutral: {
      border: 'border-neutral-200 dark:border-neutral-700',
      heading: 'text-neutral-900 dark:text-neutral-100',
      muted: 'text-neutral-600 dark:text-neutral-300',
      badge: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200',
      subtleBg: 'bg-neutral-50/80 dark:bg-neutral-900/70',
      tonalBg: 'bg-neutral-100/80 dark:bg-neutral-800/70',
      overlayGradient: 'from-neutral-900/70 via-neutral-900/30 to-neutral-900/20',
    },
    info: {
      border: 'border-sky-300 dark:border-sky-500/50',
      heading: 'text-sky-700 dark:text-sky-200',
      muted: 'text-sky-600/90 dark:text-sky-200/85',
      badge: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-100',
      subtleBg: 'bg-sky-50/80 dark:bg-sky-500/10',
      tonalBg: 'bg-sky-100/80 dark:bg-sky-500/15',
      overlayGradient: 'from-sky-900/70 via-sky-900/35 to-sky-900/10',
    },
    success: {
      border: 'border-emerald-300 dark:border-emerald-500/50',
      heading: 'text-emerald-700 dark:text-emerald-200',
      muted: 'text-emerald-600/90 dark:text-emerald-200/85',
      badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100',
      subtleBg: 'bg-emerald-50/80 dark:bg-emerald-500/10',
      tonalBg: 'bg-emerald-100/80 dark:bg-emerald-500/15',
      overlayGradient: 'from-emerald-900/70 via-emerald-900/35 to-emerald-900/10',
    },
    warning: {
      border: 'border-amber-300 dark:border-amber-500/50',
      heading: 'text-amber-700 dark:text-amber-200',
      muted: 'text-amber-600/95 dark:text-amber-200/85',
      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100',
      subtleBg: 'bg-amber-50/80 dark:bg-amber-500/10',
      tonalBg: 'bg-amber-100/80 dark:bg-amber-500/20',
      overlayGradient: 'from-amber-900/70 via-amber-900/40 to-amber-900/15',
    },
    danger: {
      border: 'border-rose-300 dark:border-rose-500/50',
      heading: 'text-rose-700 dark:text-rose-200',
      muted: 'text-rose-600/90 dark:text-rose-200/85',
      badge: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-100',
      subtleBg: 'bg-rose-50/80 dark:bg-rose-500/10',
      tonalBg: 'bg-rose-100/80 dark:bg-rose-500/15',
      overlayGradient: 'from-rose-900/70 via-rose-900/40 to-rose-900/15',
    },
    brand: {
      border: 'border-indigo-300 dark:border-indigo-500/50',
      heading: 'text-indigo-700 dark:text-indigo-200',
      muted: 'text-indigo-600/90 dark:text-indigo-200/85',
      badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-100',
      subtleBg: 'bg-indigo-50/80 dark:bg-indigo-500/10',
      tonalBg: 'bg-indigo-100/80 dark:bg-indigo-500/15',
      overlayGradient: 'from-indigo-900/70 via-indigo-900/40 to-indigo-900/15',
    },
  },
  stepper: {
    neutral: {
      activeBg: 'bg-neutral-900 dark:bg-neutral-100',
      activeText: 'text-white dark:text-neutral-900',
      completedBg: 'bg-neutral-200 dark:bg-neutral-700',
      completedText: 'text-neutral-800 dark:text-neutral-100',
      pendingBorder: 'border-neutral-300 dark:border-neutral-700',
      pendingText: 'text-neutral-500 dark:text-neutral-400',
      underlineBase: 'bg-neutral-200 dark:bg-neutral-700',
    },
    info: {
      activeBg: 'bg-sky-600 dark:bg-sky-400',
      activeText: 'text-white',
      completedBg: 'bg-sky-100 dark:bg-sky-600/60',
      completedText: 'text-sky-700 dark:text-sky-100',
      pendingBorder: 'border-sky-200 dark:border-sky-700/60',
      pendingText: 'text-sky-500 dark:text-sky-200',
      underlineBase: 'bg-sky-100 dark:bg-sky-700/40',
    },
    success: {
      activeBg: 'bg-emerald-600 dark:bg-emerald-400',
      activeText: 'text-white',
      completedBg: 'bg-emerald-100 dark:bg-emerald-600/60',
      completedText: 'text-emerald-700 dark:text-emerald-100',
      pendingBorder: 'border-emerald-200 dark:border-emerald-700/60',
      pendingText: 'text-emerald-500 dark:text-emerald-200',
      underlineBase: 'bg-emerald-100 dark:bg-emerald-700/40',
    },
    warning: {
      activeBg: 'bg-amber-500 dark:bg-amber-400',
      activeText: 'text-white',
      completedBg: 'bg-amber-100 dark:bg-amber-600/60',
      completedText: 'text-amber-700 dark:text-amber-100',
      pendingBorder: 'border-amber-200 dark:border-amber-700/60',
      pendingText: 'text-amber-500 dark:text-amber-200',
      underlineBase: 'bg-amber-100 dark:bg-amber-700/40',
    },
    danger: {
      activeBg: 'bg-rose-500 dark:bg-rose-400',
      activeText: 'text-white',
      completedBg: 'bg-rose-100 dark:bg-rose-600/60',
      completedText: 'text-rose-700 dark:text-rose-100',
      pendingBorder: 'border-rose-200 dark:border-rose-700/60',
      pendingText: 'text-rose-500 dark:text-rose-200',
      underlineBase: 'bg-rose-100 dark:bg-rose-700/40',
    },
    brand: {
      activeBg: 'bg-indigo-600 dark:bg-indigo-400',
      activeText: 'text-white',
      completedBg: 'bg-indigo-100 dark:bg-indigo-600/60',
      completedText: 'text-indigo-700 dark:text-indigo-100',
      pendingBorder: 'border-indigo-200 dark:border-indigo-700/60',
      pendingText: 'text-indigo-500 dark:text-indigo-200',
      underlineBase: 'bg-indigo-100 dark:bg-indigo-700/40',
    },
  },
};

let currentTheme: ThemeDefinition = defaultTheme;

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Record<string, unknown> ? DeepPartial<T[K]> : T[K];
};

type PlainObject = Record<string, unknown>;

const isPlainObject = (value: unknown): value is PlainObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

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

export const getButtonColorClasses = (variant: ButtonVariant, color: ButtonColor): string => {
  const variantTheme = currentTheme.button[variant] ?? currentTheme.button.solid;
  const fallbackVariant = currentTheme.button.solid;
  return (
    variantTheme[color] ?? variantTheme.indigo ?? fallbackVariant[color] ?? fallbackVariant.indigo
  );
};

export const getToggleColorClasses = (color: ThemeColor): string =>
  currentTheme.toggle[color] ?? currentTheme.toggle.indigo;

export const getCheckboxColorClasses = (color: CheckboxColor): string =>
  currentTheme.checkbox[color] ?? currentTheme.checkbox.indigo;

export const getSpinnerColorTokens = (color: SpinnerColor): [string, string, string, string] =>
  currentTheme.spinner[color] ?? currentTheme.spinner.indigo;

export const getLoaderProgressColors = (color: SpinnerColor): { track: string; bar: string } =>
  currentTheme.loader[color] ?? currentTheme.loader.indigo;

export const getMultiToggleColorTokens = (
  color: MultiToggleColor
): { active: string; activeText: string; indicator: string; hover: string } =>
  currentTheme.multiToggle[color] ?? currentTheme.multiToggle.indigo;

export const getTabsColorTokens = (color: ButtonColor): TabsColorTokens =>
  currentTheme.tabs[color] ?? currentTheme.tabs.indigo;

export const getPanelToneStyles = (tone: PanelTone): PanelTheme[PanelTone] =>
  currentTheme.panel[tone] ?? currentTheme.panel.neutral;

export const getStepperTonePalette = (tone: PanelTone): StepperToneConfig =>
  currentTheme.stepper[tone] ?? currentTheme.stepper.brand;
