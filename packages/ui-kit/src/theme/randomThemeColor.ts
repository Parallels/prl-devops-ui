import { resolveColor, type ThemeColor } from './Theme';

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

const randomFrom = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

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
