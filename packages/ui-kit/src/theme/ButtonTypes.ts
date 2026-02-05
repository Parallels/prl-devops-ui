import type { ThemeColor } from "./Theme";

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

const resolveColor = (color: ThemeColor): string => {
  switch (color) {
    case "brand":
      return "indigo";
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

const createIconAccentRing = (): Record<ThemeColor, string> => {
  const rings: Record<string, string> = {};
  colors.forEach((color) => {
    const c = resolveColor(color);
    if (color === "white") {
      rings[color] = "focus-visible:ring-slate-200";
    } else if (color === "theme") {
      rings[color] = "focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500";
    } else {
      rings[color] = `focus-visible:ring-${c}-500`;
    }
  });
  return rings as Record<ThemeColor, string>;
};

const createIconAccentHover = (): Record<ThemeColor, string> => {
  const hovers: Record<string, string> = {};
  colors.forEach((color) => {
    const c = resolveColor(color);
    if (color === "white") {
      hovers[color] = "hover:text-white dark:hover:text-neutral-100";
    } else if (color === "theme") {
      hovers[color] = "hover:text-neutral-800 dark:hover:text-neutral-100";
    } else {
      hovers[color] = `hover:text-${c}-500 dark:hover:text-${c}-300`;
    }
  });
  return hovers as Record<ThemeColor, string>;
};

const createIconAccentActive = (): Record<ThemeColor, string> => {
  const actives: Record<string, string> = {};
  colors.forEach((color) => {
    const c = resolveColor(color);
    if (color === "white") {
      actives[color] = "!text-white !dark:text-neutral-100";
    } else if (color === "theme") {
      actives[color] = "!text-neutral-800 !dark:text-neutral-100";
    } else {
      actives[color] = `!text-${c}-500 !dark:text-${c}-300`;
    }
  });
  return actives as Record<ThemeColor, string>;
};

export const iconAccentRing: Record<ThemeColor, string> = createIconAccentRing();
export const iconAccentHover: Record<ThemeColor, string> = createIconAccentHover();
export const iconAccentActive: Record<ThemeColor, string> = createIconAccentActive();
