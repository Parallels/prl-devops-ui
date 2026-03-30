import { resolveColor, type ThemeColor, type ThemeMultiColor } from './Theme';

type RandomIntensity = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

const RANDOM_INTENSITIES: RandomIntensity[] = [100, 200, 300, 400, 500, 600, 700, 800, 900];

// Keep this aligned with ThemeColor values that resolve to Tailwind palette names.
// `white` is excluded because Tailwind has no `white-100..900` scale.
// `slate`, `neutral`, and `theme` are excluded to avoid neutral/gray outputs.
const RANDOM_THEME_COLORS: ThemeColor[] = [
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
  'gray',
  'zinc',
  'stone',
  'brand',
  'info',
  'success',
  'warning',
  'danger',
  'parallels',
];

const randomFrom = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

export interface RandomThemeColorValue {
  color: string;
  intensity: RandomIntensity;
  token: string;
}

/**
 * Returns a random Tailwind color token based on the ui-kit theme palette,
 * like `blue-500` or `emerald-300`.
 */
export const getRandomThemeColorValue = (): RandomThemeColorValue => {
  const themeColor = randomFrom(RANDOM_THEME_COLORS);
  const color = resolveColor(themeColor);
  const intensity = randomFrom(RANDOM_INTENSITIES);
  return {
    color,
    intensity,
    token: `${color}-${intensity}`,
  };
};

/**
 * Returns a random Tailwind utility class for a theme color token.
 * Example: `getRandomThemeColorClass('bg')` -> `bg-blue-500`.
 */
export const getRandomThemeColorClass = (prefix: 'bg' | 'text' | 'border' = 'bg'): string => {
  const { token } = getRandomThemeColorValue();
  return `${prefix}-${token}`;
};

// Ordered spectrum colors from ThemeMultiColor — used as the primary palette before falling back to random.
const THEME_MULTI_COLORS: ThemeMultiColor[] = [
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal',
  'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'rose',
  'slate', 'gray', 'zinc', 'neutral', 'stone',
];

/**
 * Returns an array of `count` Tailwind color utility classes.
 * Uses ThemeMultiColor values in order (at intensity 500) for the first N items,
 * then falls back to `getRandomThemeColorClass` for any overflow.
 *
 * @example
 * getColorPalette(5)           // ['bg-red-500', 'bg-orange-500', ...]
 * getColorPalette(5, 'text')   // ['text-red-500', 'text-orange-500', ...]
 */
export const getColorPalette = (count: number, prefix: 'bg' | 'text' | 'border' = 'bg'): string[] =>
  Array.from({ length: count }, (_, i) => {
    if (i < THEME_MULTI_COLORS.length) {
      return `${prefix}-${resolveColor(THEME_MULTI_COLORS[i])}-500`;
    }
    return getRandomThemeColorClass(prefix);
  });

/**
 * Returns an array of `count` ThemeColor names (e.g. `'red'`, `'orange'`, `'blue'`).
 * Uses ThemeMultiColor values in order for the first N items,
 * then falls back to random colors from RANDOM_THEME_COLORS for overflow.
 * Useful when components construct their own Tailwind class strings via template literals.
 *
 * @example
 * getColorPaletteNames(3) // ['red', 'orange', 'amber']
 */
export const getColorPaletteNames = (count: number): ThemeColor[] =>
  Array.from({ length: count }, (_, i) => {
    if (i < THEME_MULTI_COLORS.length) {
      return THEME_MULTI_COLORS[i] as ThemeColor;
    }
    return randomFrom(RANDOM_THEME_COLORS);
  });
