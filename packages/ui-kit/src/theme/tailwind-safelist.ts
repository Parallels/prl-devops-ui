/**
 * Tailwind CSS Dynamic Class Safelist
 *
 * Theme.ts and ButtonTypes.ts construct class names via template literals
 * (e.g., `bg-${c}-500`). Tailwind's JIT compiler cannot detect these at
 * build time because it scans for complete static strings only.
 *
 * This file lists every resolved class name as a full string so the scanner
 * includes them in the generated CSS.
 *
 * Organized by utility type — one line per shade pattern across all 22 base
 * Tailwind color names. Keep in sync with Theme.ts and ButtonTypes.ts.
 *
 * DO NOT DELETE — without this file, most component colors will not render.
 */

const colors = [
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
] as const;

void colors;

/* eslint-disable @typescript-eslint/no-unused-vars */

// ---------- bg ----------
const bg50 =
  "bg-red-50 bg-orange-50 bg-amber-50 bg-yellow-50 bg-lime-50 bg-green-50 bg-emerald-50 bg-teal-50 bg-cyan-50 bg-sky-50 bg-blue-50 bg-indigo-50 bg-violet-50 bg-purple-50 bg-fuchsia-50 bg-pink-50 bg-rose-50 bg-slate-50 bg-gray-50 bg-zinc-50 bg-neutral-50 bg-stone-50";
const bg50_80 =
  "bg-red-50/80 bg-orange-50/80 bg-amber-50/80 bg-yellow-50/80 bg-lime-50/80 bg-green-50/80 bg-emerald-50/80 bg-teal-50/80 bg-cyan-50/80 bg-sky-50/80 bg-blue-50/80 bg-indigo-50/80 bg-violet-50/80 bg-purple-50/80 bg-fuchsia-50/80 bg-pink-50/80 bg-rose-50/80 bg-slate-50/80 bg-gray-50/80 bg-zinc-50/80 bg-neutral-50/80 bg-stone-50/80";
const bg100 =
  "bg-red-100 bg-orange-100 bg-amber-100 bg-yellow-100 bg-lime-100 bg-green-100 bg-emerald-100 bg-teal-100 bg-cyan-100 bg-sky-100 bg-blue-100 bg-indigo-100 bg-violet-100 bg-purple-100 bg-fuchsia-100 bg-pink-100 bg-rose-100 bg-slate-100 bg-gray-100 bg-zinc-100 bg-neutral-100 bg-stone-100";
const bg100_60 =
  "bg-red-100/60 bg-orange-100/60 bg-amber-100/60 bg-yellow-100/60 bg-lime-100/60 bg-green-100/60 bg-emerald-100/60 bg-teal-100/60 bg-cyan-100/60 bg-sky-100/60 bg-blue-100/60 bg-indigo-100/60 bg-violet-100/60 bg-purple-100/60 bg-fuchsia-100/60 bg-pink-100/60 bg-rose-100/60 bg-slate-100/60 bg-gray-100/60 bg-zinc-100/60 bg-neutral-100/60 bg-stone-100/60";
const bg100_80 =
  "bg-red-100/80 bg-orange-100/80 bg-amber-100/80 bg-yellow-100/80 bg-lime-100/80 bg-green-100/80 bg-emerald-100/80 bg-teal-100/80 bg-cyan-100/80 bg-sky-100/80 bg-blue-100/80 bg-indigo-100/80 bg-violet-100/80 bg-purple-100/80 bg-fuchsia-100/80 bg-pink-100/80 bg-rose-100/80 bg-slate-100/80 bg-gray-100/80 bg-zinc-100/80 bg-neutral-100/80 bg-stone-100/80";
const bg200 =
  "bg-red-200 bg-orange-200 bg-amber-200 bg-yellow-200 bg-lime-200 bg-green-200 bg-emerald-200 bg-teal-200 bg-cyan-200 bg-sky-200 bg-blue-200 bg-indigo-200 bg-violet-200 bg-purple-200 bg-fuchsia-200 bg-pink-200 bg-rose-200 bg-slate-200 bg-gray-200 bg-zinc-200 bg-neutral-200 bg-stone-200";
const bg300_40 =
  "bg-red-300/40 bg-orange-300/40 bg-amber-300/40 bg-yellow-300/40 bg-lime-300/40 bg-green-300/40 bg-emerald-300/40 bg-teal-300/40 bg-cyan-300/40 bg-sky-300/40 bg-blue-300/40 bg-indigo-300/40 bg-violet-300/40 bg-purple-300/40 bg-fuchsia-300/40 bg-pink-300/40 bg-rose-300/40 bg-slate-300/40 bg-gray-300/40 bg-zinc-300/40 bg-neutral-300/40 bg-stone-300/40";
const bg400 =
  "bg-red-400 bg-orange-400 bg-amber-400 bg-yellow-400 bg-lime-400 bg-green-400 bg-emerald-400 bg-teal-400 bg-cyan-400 bg-sky-400 bg-blue-400 bg-indigo-400 bg-violet-400 bg-purple-400 bg-fuchsia-400 bg-pink-400 bg-rose-400 bg-slate-400 bg-gray-400 bg-zinc-400 bg-neutral-400 bg-stone-400";
const bg400_10 =
  "bg-red-400/10 bg-orange-400/10 bg-amber-400/10 bg-yellow-400/10 bg-lime-400/10 bg-green-400/10 bg-emerald-400/10 bg-teal-400/10 bg-cyan-400/10 bg-sky-400/10 bg-blue-400/10 bg-indigo-400/10 bg-violet-400/10 bg-purple-400/10 bg-fuchsia-400/10 bg-pink-400/10 bg-rose-400/10 bg-slate-400/10 bg-gray-400/10 bg-zinc-400/10 bg-neutral-400/10 bg-stone-400/10";
const bg500 =
  "bg-red-500 bg-orange-500 bg-amber-500 bg-yellow-500 bg-lime-500 bg-green-500 bg-emerald-500 bg-teal-500 bg-cyan-500 bg-sky-500 bg-blue-500 bg-indigo-500 bg-violet-500 bg-purple-500 bg-fuchsia-500 bg-pink-500 bg-rose-500 bg-slate-500 bg-gray-500 bg-zinc-500 bg-neutral-500 bg-stone-500";
const bg500_10 =
  "bg-red-500/10 bg-orange-500/10 bg-amber-500/10 bg-yellow-500/10 bg-lime-500/10 bg-green-500/10 bg-emerald-500/10 bg-teal-500/10 bg-cyan-500/10 bg-sky-500/10 bg-blue-500/10 bg-indigo-500/10 bg-violet-500/10 bg-purple-500/10 bg-fuchsia-500/10 bg-pink-500/10 bg-rose-500/10 bg-slate-500/10 bg-gray-500/10 bg-zinc-500/10 bg-neutral-500/10 bg-stone-500/10";
const bg500_15 =
  "bg-red-500/15 bg-orange-500/15 bg-amber-500/15 bg-yellow-500/15 bg-lime-500/15 bg-green-500/15 bg-emerald-500/15 bg-teal-500/15 bg-cyan-500/15 bg-sky-500/15 bg-blue-500/15 bg-indigo-500/15 bg-violet-500/15 bg-purple-500/15 bg-fuchsia-500/15 bg-pink-500/15 bg-rose-500/15 bg-slate-500/15 bg-gray-500/15 bg-zinc-500/15 bg-neutral-500/15 bg-stone-500/15";
const bg500_20 =
  "bg-red-500/20 bg-orange-500/20 bg-amber-500/20 bg-yellow-500/20 bg-lime-500/20 bg-green-500/20 bg-emerald-500/20 bg-teal-500/20 bg-cyan-500/20 bg-sky-500/20 bg-blue-500/20 bg-indigo-500/20 bg-violet-500/20 bg-purple-500/20 bg-fuchsia-500/20 bg-pink-500/20 bg-rose-500/20 bg-slate-500/20 bg-gray-500/20 bg-zinc-500/20 bg-neutral-500/20 bg-stone-500/20";
const bg500_40 =
  "bg-red-500/40 bg-orange-500/40 bg-amber-500/40 bg-yellow-500/40 bg-lime-500/40 bg-green-500/40 bg-emerald-500/40 bg-teal-500/40 bg-cyan-500/40 bg-sky-500/40 bg-blue-500/40 bg-indigo-500/40 bg-violet-500/40 bg-purple-500/40 bg-fuchsia-500/40 bg-pink-500/40 bg-rose-500/40 bg-slate-500/40 bg-gray-500/40 bg-zinc-500/40 bg-neutral-500/40 bg-stone-500/40";
const bg500_90 =
  "bg-red-500/90 bg-orange-500/90 bg-amber-500/90 bg-yellow-500/90 bg-lime-500/90 bg-green-500/90 bg-emerald-500/90 bg-teal-500/90 bg-cyan-500/90 bg-sky-500/90 bg-blue-500/90 bg-indigo-500/90 bg-violet-500/90 bg-purple-500/90 bg-fuchsia-500/90 bg-pink-500/90 bg-rose-500/90 bg-slate-500/90 bg-gray-500/90 bg-zinc-500/90 bg-neutral-500/90 bg-stone-500/90";
const bg600 =
  "bg-red-600 bg-orange-600 bg-amber-600 bg-yellow-600 bg-lime-600 bg-green-600 bg-emerald-600 bg-teal-600 bg-cyan-600 bg-sky-600 bg-blue-600 bg-indigo-600 bg-violet-600 bg-purple-600 bg-fuchsia-600 bg-pink-600 bg-rose-600 bg-slate-600 bg-gray-600 bg-zinc-600 bg-neutral-600 bg-stone-600";
const bg600_60 =
  "bg-red-600/60 bg-orange-600/60 bg-amber-600/60 bg-yellow-600/60 bg-lime-600/60 bg-green-600/60 bg-emerald-600/60 bg-teal-600/60 bg-cyan-600/60 bg-sky-600/60 bg-blue-600/60 bg-indigo-600/60 bg-violet-600/60 bg-purple-600/60 bg-fuchsia-600/60 bg-pink-600/60 bg-rose-600/60 bg-slate-600/60 bg-gray-600/60 bg-zinc-600/60 bg-neutral-600/60 bg-stone-600/60";
const bg700_10 =
  "bg-red-700/10 bg-orange-700/10 bg-amber-700/10 bg-yellow-700/10 bg-lime-700/10 bg-green-700/10 bg-emerald-700/10 bg-teal-700/10 bg-cyan-700/10 bg-sky-700/10 bg-blue-700/10 bg-indigo-700/10 bg-violet-700/10 bg-purple-700/10 bg-fuchsia-700/10 bg-pink-700/10 bg-rose-700/10 bg-slate-700/10 bg-gray-700/10 bg-zinc-700/10 bg-neutral-700/10 bg-stone-700/10";
const bg700_40 =
  "bg-red-700/40 bg-orange-700/40 bg-amber-700/40 bg-yellow-700/40 bg-lime-700/40 bg-green-700/40 bg-emerald-700/40 bg-teal-700/40 bg-cyan-700/40 bg-sky-700/40 bg-blue-700/40 bg-indigo-700/40 bg-violet-700/40 bg-purple-700/40 bg-fuchsia-700/40 bg-pink-700/40 bg-rose-700/40 bg-slate-700/40 bg-gray-700/40 bg-zinc-700/40 bg-neutral-700/40 bg-stone-700/40";
const bg900_40 =
  "bg-red-900/40 bg-orange-900/40 bg-amber-900/40 bg-yellow-900/40 bg-lime-900/40 bg-green-900/40 bg-emerald-900/40 bg-teal-900/40 bg-cyan-900/40 bg-sky-900/40 bg-blue-900/40 bg-indigo-900/40 bg-violet-900/40 bg-purple-900/40 bg-fuchsia-900/40 bg-pink-900/40 bg-rose-900/40 bg-slate-900/40 bg-gray-900/40 bg-zinc-900/40 bg-neutral-900/40 bg-stone-900/40";
const bg900_60 =
  "bg-red-900/60 bg-orange-900/60 bg-amber-900/60 bg-yellow-900/60 bg-lime-900/60 bg-green-900/60 bg-emerald-900/60 bg-teal-900/60 bg-cyan-900/60 bg-sky-900/60 bg-blue-900/60 bg-indigo-900/60 bg-violet-900/60 bg-purple-900/60 bg-fuchsia-900/60 bg-pink-900/60 bg-rose-900/60 bg-slate-900/60 bg-gray-900/60 bg-zinc-900/60 bg-neutral-900/60 bg-stone-900/60";

// --------- text ----------
const text50 =
  "text-red-50 text-orange-50 text-amber-50 text-yellow-50 text-lime-50 text-green-50 text-emerald-50 text-teal-50 text-cyan-50 text-sky-50 text-blue-50 text-indigo-50 text-violet-50 text-purple-50 text-fuchsia-50 text-pink-50 text-rose-50 text-slate-50 text-gray-50 text-zinc-50 text-neutral-50 text-stone-50";
const text100 =
  "text-red-100 text-orange-100 text-amber-100 text-yellow-100 text-lime-100 text-green-100 text-emerald-100 text-teal-100 text-cyan-100 text-sky-100 text-blue-100 text-indigo-100 text-violet-100 text-purple-100 text-fuchsia-100 text-pink-100 text-rose-100 text-slate-100 text-gray-100 text-zinc-100 text-neutral-100 text-stone-100";
const text200 =
  "text-red-200 text-orange-200 text-amber-200 text-yellow-200 text-lime-200 text-green-200 text-emerald-200 text-teal-200 text-cyan-200 text-sky-200 text-blue-200 text-indigo-200 text-violet-200 text-purple-200 text-fuchsia-200 text-pink-200 text-rose-200 text-slate-200 text-gray-200 text-zinc-200 text-neutral-200 text-stone-200";
const text300 =
  "text-red-300 text-orange-300 text-amber-300 text-yellow-300 text-lime-300 text-green-300 text-emerald-300 text-teal-300 text-cyan-300 text-sky-300 text-blue-300 text-indigo-300 text-violet-300 text-purple-300 text-fuchsia-300 text-pink-300 text-rose-300 text-slate-300 text-gray -300 text-zinc-300 text-neutral-300 text-stone-300";
const text400 =
  "text-red-400 text-orange-400 text-amber-400 text-yellow-400 text-lime-400 text-green-400 text-emerald-400 text-teal-400 text-cyan-400 text-sky-400 text-blue-400 text-indigo-400 text-violet-400 text-purple-400 text-fuchsia-400 text-pink-400 text-rose-400 text-slate-400 text-gray -400 text-zinc-400 text-neutral-400 text-stone-400";
const text500 =
  "text-red-500 text-orange-500 text-amber-500 text-yellow-500 text-lime-500 text-green-500 text-emerald-500 text-teal-500 text-cyan-500 text-sky-500 text-blue-500 text-indigo-500 text-violet-500 text-purple-500 text-fuchsia-500 text-pink-500 text-rose-500 text-slate -500 text-gray-500 text-zinc-500 text-neutral-500 text-stone-500";
const text600 =
  "text-red-600 text-orange-600 text-amber-600 text-yellow-600 text-lime-600 text-green-600 text-emerald-600 text-teal-600 text-cyan-600 text-sky-600 text-blue-600 text-indigo-600 text-violet-600 text-purple-600 text-fuchsia-600 text-pink-600 text-rose -600 text-slate-600 text-gray -600 text-zinc-600 text-neutral-600 text-stone-600";
const text600_90 =
  "text-red-600/90 text-orange-600/90 text-amber-600/90 text-yellow-600/90 text-lime-600/90 text-green-600/90 text-emerald-600/90 text-teal-600/90 text-cyan-600/90 text-sky-600/90 text-blue-600/90 text-indigo-600/90 text-violet-600/90 text-purple-600/90 text-fuchsia-600/90 text-pink-600/90 text-rose-600/90 text-slate-600/90 text-gray-600/90 text-zinc-600/90 text-neutral-600/90 text-stone-600/90";
const text700 =
  "text-red-700 text-orange-700 text-amber-700 text-yellow-700 text-lime-700 text-green-700 text-emerald-700 text-teal-700 text-cyan-700 text-sky-700 text-blue -700 text-indigo -700 text-violet -700 text-purple -700 text-fuchsia -700 text-pink -700 text-rose -700 text-slate -700 text-gray -700 text-zinc -700 text-neutral -700 text-stone -700";
const text800 =
  "text-red-800 text-orange-800 text-amber-800 text-yellow-800 text-lime-800 text-green-800 text-emerald-800 text-teal-800 text-cyan-800 text-sky-800 text-blue-800 text-indigo-800 text-violet-800 text-purple-800 text-fuchsia-800 text-pink-800 text-rose-800 text-slate -800 text-gray -800 text-zinc -800 text-neutral -800 text-stone -800";
const text900 =
  "text-red-900 text-orange-900 text-amber-900 text-yellow-900 text-lime-900 text-green-900 text-emerald-900 text-teal-900 text-cyan-900 text-sky-900 text-blue -900 text-indigo -900 text-violet -900 text-purple -900 text-fuchsia -900 text-pink -900 text-rose -900 text-slate -900 text-gray -900 text-zinc -900 text-neutral -900 text-stone -900";

// ---------- dark:text ----------
const darkText50 =
  "dark:text-red-50 dark:text-orange-50 dark:text-amber-50 dark:text-yellow-50 dark:text-lime-50 dark:text-green-50 dark:text-emerald-50 dark:text-teal-50 dark:text-cyan-50 dark:text-sky-50 dark:text-blue-50 dark:text-indigo-50 dark:text-violet-50 dark:text-purple-50 dark:text-fuchsia-50 dark:text-pink-50 dark:text-rose-50 dark:text-slate-50 dark:text-gray-50 dark:text-zinc-50 dark:text-neutral-50 dark:text-stone-50";
const darkText100 =
  "dark:text-red-100 dark:text-orange-100 dark:text-amber-100 dark:text-yellow-100 dark:text-lime-100 dark:text-green-100 dark:text-emerald-100 dark:text-teal-100 dark:text-cyan-100 dark:text-sky-100 dark:text-blue-100 dark:text-indigo-100 dark:text-violet-100 dark:text-purple-100 dark:text-fuchsia-100 dark:text-pink-100 dark:text-rose-100 dark:text-slate-100 dark:text-gray-100 dark:text-zinc-100 dark:text-neutral-100 dark:text-stone-100";
const darkText200 =
  "dark:text-red-200 dark:text-orange-200 dark:text-amber-200 dark:text-yellow-200 dark:text-lime-200 dark:text-green-200 dark:text-emerald-200 dark:text-teal-200 dark:text-cyan-200 dark:text-sky-200 dark:text-blue-200 dark:text-indigo-200 dark:text-violet-200 dark:text-purple-200 dark:text-fuchsia-200 dark:text-pink-200 dark:text-rose-200 dark:text-slate-200 dark:text-gray-200 dark:text-zinc-200 dark:text-neutral-200 dark:text-stone-200";
const darkText200_85 =
  "dark:text-red-200/85 dark:text-orange-200/85 dark:text-amber-200/85 dark:text-yellow-200/85 dark:text-lime-200/85 dark:text-green-200/85 dark:text-emerald-200/85 dark:text-teal-200/85 dark:text-cyan-200/85 dark:text-sky-200/85 dark:text-blue-200/85 dark:text-indigo-200/85 dark:text-violet-200/85 dark:text-purple-200/85 dark:text-fuchsia-200/85 dark:text-pink-200/85 dark:text-rose-200/85 dark:text-slate-200/85 dark:text-gray-200/85 dark:text-zinc-200/85 dark:text-neutral-200/85 dark:text-stone-200/85";
const darkText300 =
  "dark:text-red-300 dark:text-orange-300 dark:text-amber-300 dark:text-yellow-300 dark:text-lime-300 dark:text-green-300 dark:text-emerald-300 dark:text-teal-300 dark:text-cyan-300 dark:text-sky-300 dark:text-blue-300 dark:text-indigo-300 dark:text-violet-300 dark:text-purple-300 dark:text-fuchsia-300 dark:text-pink-300 dark:text-rose-300 dark:text-slate-300 dark:text-gray-300 dark:text-zinc-300 dark:text-neutral-300 dark:text-stone-300";
const darkText400 =
  "dark:text-red-400 dark:text-orange-400 dark:text-amber-400 dark:text-yellow-400 dark:text-lime-400 dark:text-green-400 dark:text-emerald-400 dark:text-teal-400 dark:text-cyan-400 dark:text-sky-400 dark:text-blue-400 dark:text-indigo-400 dark:text-violet-400 dark:text-purple-400 dark:text-fuchsia-400 dark:text-pink-400 dark:text-rose-400 dark:text-slate -400 dark:text-gray -400 dark:text-zinc -400 dark:text-neutral -400 dark:text-stone -400";
const darkText500 =
  "dark:text-red-500 dark:text-orange-500 dark:text-amber-500 dark:text-yellow-500 dark:text-lime-500 dark:text-green-500 dark:text-emerald-500 dark:text-teal-500 dark:text-cyan-500 dark:text-sky-500 dark:text-blue-500 dark:text-indigo-500 dark:text-violet-500 dark:text-purple-500 dark:text-fuchsia-500 dark:text-pink-500 dark:text-rose -500 dark:text-slate -500 dark:text-gray -500 dark:text-zinc -500 dark:text-neutral -500 dark:text-stone -500";
const darkText600 =
  "dark:text-red-600 dark:text-orange-600 dark:text-amber-600 dark:text-yellow-600 dark:text-lime-600 dark:text-green-600 dark:text-emerald-600 dark:text-teal-600 dark:text-cyan-600 dark:text-sky-600 dark:text-blue-600 dark:text-indigo-600 dark:text-violet-600 dark:text-purple-600 dark:text-fuchsia-600 dark:text-pink -600 dark:text-rose -600 dark:text-slate -600 dark:text-gray -600 dark:text-zinc -600 dark:text-neutral -600 dark:text-stone -600";
const darkText700 =
  "dark:text-red-700 dark:text-orange-700 dark:text-amber-700 dark:text-yellow-700 dark:text-lime-700 dark:text-green-700 dark:text-emerald-700 dark:text-teal-700 dark:text-cyan-700 dark:text-sky-700 dark:text-blue-700 dark:text-indigo-700 dark:text-violet-700 dark:text-purple-700 dark:text-fuchsia-700 dark:text-pink-700 dark:text-rose-700 dark:text-slate -700 dark:text-gray -700 dark:text-zinc -700 dark:text-neutral -700 dark:text-stone -700";
const darkText800 =
  "dark:text-red-800 dark:text-orange-800 dark:text-amber-800 dark:text-yellow-800 dark:text-lime-800 dark:text-green-800 dark:text-emerald-800 dark:text-teal-800 dark:text-cyan-800 dark:text-sky-800 dark:text-blue-800 dark:text-indigo-800 dark:text-violet-800 dark:text-purple-800 dark:text-fuchsia-800 dark:text-pink -800 dark:text-rose -800 dark:text-slate -800 dark:text-gray -800 dark:text-zinc -800 dark:text-neutral -800 dark:text-stone -800";
const darkText900 =
  "dark:text-red-900 dark:text-orange-900 dark:text-amber-900 dark:text-yellow-900 dark:text-lime-900 dark:text-green-900 dark:text-emerald-900 dark:text-teal-900 dark:text-cyan-900 dark:text-sky-900 dark:text-blue-900 dark:text-indigo-900 dark:text-violet-900 dark:text-purple-900 dark:text-fuchsia-900 dark:text-pink -900 dark:text-rose -900 dark:text-slate -900 dark:text-gray -900 dark:text-zinc -900 dark:text-neutral -900 dark:text-stone -900";

// ---------- hover:bg ----------
const hoverBg50 =
  "hover:bg-red-50 hover:bg-orange-50 hover:bg-amber-50 hover:bg-yellow-50 hover:bg-lime-50 hover:bg-green-50 hover:bg-emerald-50 hover:bg-teal-50 hover:bg-cyan-50 hover:bg-sky-50 hover:bg-blue-50 hover:bg-indigo-50 hover:bg-violet-50 hover:bg-purple-50 hover:bg-fuchsia-50 hover:bg-pink-50 hover:bg-rose-50 hover:bg-slate-50 hover:bg-gray-50 hover:bg-zinc-50 hover:bg-neutral-50 hover:bg-stone-50";
const hoverBg100 =
  "hover:bg-red-100 hover:bg-orange-100 hover:bg-amber-100 hover:bg-yellow-100 hover:bg-lime-100 hover:bg-green-100 hover:bg-emerald-100 hover:bg-teal-100 hover:bg-cyan-100 hover:bg-sky-100 hover:bg-blue-100 hover:bg-indigo-100 hover:bg-violet-100 hover:bg-purple-100 hover:bg-fuchsia-100 hover:bg-pink-100 hover:bg-rose-100 hover:bg-slate-100 hover:bg-gray-100 hover:bg-zinc-100 hover:bg-neutral-100 hover:bg-stone-100";
const hoverBg400 =
  "hover:bg-red-400 hover:bg-orange-400 hover:bg-amber-400 hover:bg-yellow-400 hover:bg-lime-400 hover:bg-green-400 hover:bg-emerald-400 hover:bg-teal-400 hover:bg-cyan-400 hover:bg-sky-400 hover:bg-blue-400 hover:bg-indigo-400 hover:bg-violet-400 hover:bg-purple-400 hover:bg-fuchsia-400 hover:bg-pink-400 hover:bg-rose-400 hover:bg-slate-400 hover:bg-gray-400 hover:bg-zinc-400 hover:bg-neutral-400 hover:bg-stone-400";

// ---------- dark:bg ----------
const darkBg300 =
  "dark:bg-red-300 dark:bg-orange-300 dark:bg-amber-300 dark:bg-yellow-300 dark:bg-lime-300 dark:bg-green-300 dark:bg-emerald-300 dark:bg-teal-300 dark:bg-cyan-300 dark:bg-sky-300 dark:bg-blue-300 dark:bg-indigo-300 dark:bg-violet-300 dark:bg-purple-300 dark:bg-fuchsia-300 dark:bg-pink-300 dark:bg-rose-300 dark:bg-slate-300 dark:bg-gray-300 dark:bg-zinc-300 dark:bg-neutral-300 dark:bg-stone-300";
const darkBg400 =
  "dark:bg-red-400 dark:bg-orange-400 dark:bg-amber-400 dark:bg-yellow-400 dark:bg-lime-400 dark:bg-green-400 dark:bg-emerald-400 dark:bg-teal-400 dark:bg-cyan-400 dark:bg-sky-400 dark:bg-blue-400 dark:bg-indigo-400 dark:bg-violet-400 dark:bg-purple-400 dark:bg-fuchsia-400 dark:bg-pink-400 dark:bg-rose-400 dark:bg-slate-400 dark:bg-gray-400 dark:bg-zinc-400 dark:bg-neutral-400 dark:bg-stone-400";
const darkBg300_5 =
  "dark:bg-red-300/5 dark:bg-orange-300/5 dark:bg-amber-300/5 dark:bg-yellow-300/5 dark:bg-lime-300/5 dark:bg-green-300/5 dark:bg-emerald-300/5 dark:bg-teal-300/5 dark:bg-cyan-300/5 dark:bg-sky-300/5 dark:bg-blue-300/5 dark:bg-indigo-300/5 dark:bg-violet-300/5 dark:bg-purple-300/5 dark:bg-fuchsia-300/5 dark:bg-pink-300/5 dark:bg-rose-300/5 dark:bg-slate-300/5 dark:bg-gray-300/5 dark:bg-zinc-300/5 dark:bg-neutral-300/5 dark:bg-stone-300/5";
const darkBg400_20 =
  "dark:bg-red-400/20 dark:bg-orange-400/20 dark:bg-amber-400/20 dark:bg-yellow-400/20 dark:bg-lime-400/20 dark:bg-green-400/20 dark:bg-emerald-400/20 dark:bg-teal-400/20 dark:bg-cyan-400/20 dark:bg-sky-400/20 dark:bg-blue-400/20 dark:bg-indigo-400/20 dark:bg-violet-400/20 dark:bg-purple-400/20 dark:bg-fuchsia-400/20 dark:bg-pink-400/20 dark:bg-rose-400/20 dark:bg-slate-400/20 dark:bg-gray-400/20 dark:bg-zinc-400/20 dark:bg-neutral-400/20 dark:bg-stone-400/20";
const darkBg400_90 =
  "dark:bg-red-400/90 dark:bg-orange-400/90 dark:bg-amber-400/90 dark:bg-yellow-400/90 dark:bg-lime-400/90 dark:bg-green-400/90 dark:bg-emerald-400/90 dark:bg-teal-400/90 dark:bg-cyan-400/90 dark:bg-sky-400/90 dark:bg-blue-400/90 dark:bg-indigo-400/90 dark:bg-violet-400/90 dark:bg-purple-400/90 dark:bg-fuchsia-400/90 dark:bg-pink-400/90 dark:bg-rose-400/90 dark:bg-slate-400/90 dark:bg-gray-400/90 dark:bg-zinc-400/90 dark:bg-neutral-400/90 dark:bg-stone-400/90";
const darkBg500 =
  "dark:bg-red-500 dark:bg-orange-500 dark:bg-amber-500 dark:bg-yellow-500 dark:bg-lime-500 dark:bg-green-500 dark:bg-emerald-500 dark:bg-teal-500 dark:bg-cyan-500 dark:bg-sky-500 dark:bg-blue-500 dark:bg-indigo-500 dark:bg-violet-500 dark:bg-purple-500 dark:bg-fuchsia-500 dark:bg-pink-500 dark:bg-rose-500 dark:bg-slate-500 dark:bg-gray-500 dark:bg-zinc-500 dark:bg-neutral-500 dark:bg-stone-500";
const darkBg500_10 =
  "dark:bg-red-500/10 dark:bg-orange-500/10 dark:bg-amber-500/10 dark:bg-yellow-500/10 dark:bg-lime-500/10 dark:bg-green-500/10 dark:bg-emerald-500/10 dark:bg-teal-500/10 dark:bg-cyan-500/10 dark:bg-sky-500/10 dark:bg-blue-500/10 dark:bg-indigo-500/10 dark:bg-violet-500/10 dark:bg-purple-500/10 dark:bg-fuchsia-500/10 dark:bg-pink-500/10 dark:bg-rose-500/10 dark:bg-slate-500/10 dark:bg-gray-500/10 dark:bg-zinc-500/10 dark:bg-neutral-500/10 dark:bg-stone-500/10";
const darkBg500_15 =
  "dark:bg-red-500/15 dark:bg-orange-500/15 dark:bg-amber-500/15 dark:bg-yellow-500/15 dark:bg-lime-500/15 dark:bg-green-500/15 dark:bg-emerald-500/15 dark:bg-teal-500/15 dark:bg-cyan-500/15 dark:bg-sky-500/15 dark:bg-blue-500/15 dark:bg-indigo-500/15 dark:bg-violet-500/15 dark:bg-purple-500/15 dark:bg-fuchsia-500/15 dark:bg-pink-500/15 dark:bg-rose-500/15 dark:bg-slate-500/15 dark:bg-gray-500/15 dark:bg-zinc-500/15 dark:bg-neutral-500/15 dark:bg-stone-500/15";
const darkBg500_20 =
  "dark:bg-red-500/20 dark:bg-orange-500/20 dark:bg-amber-500/20 dark:bg-yellow-500/20 dark:bg-lime-500/20 dark:bg-green-500/20 dark:bg-emerald-500/20 dark:bg-teal-500/20 dark:bg-cyan-500/20 dark:bg-sky-500/20 dark:bg-blue-500/20 dark:bg-indigo-500/20 dark:bg-violet-500/20 dark:bg-purple-500/20 dark:bg-fuchsia-500/20 dark:bg-pink-500/20 dark:bg-rose-500/20 dark:bg-slate-500/20 dark:bg-gray-500/20 dark:bg-zinc-500/20 dark:bg-neutral-500/20 dark:bg-stone-500/20";
const darkBg500_40 =
  "dark:bg-red-500/40 dark:bg-orange-500/40 dark:bg-amber-500/40 dark:bg-yellow-500/40 dark:bg-lime-500/40 dark:bg-green-500/40 dark:bg-emerald-500/40 dark:bg-teal-500/40 dark:bg-cyan-500/40 dark:bg-sky-500/40 dark:bg-blue-500/40 dark:bg-indigo-500/40 dark:bg-violet-500/40 dark:bg-purple-500/40 dark:bg-fuchsia-500/40 dark:bg-pink-500/40 dark:bg-rose-500/40 dark:bg-slate-500/40 dark:bg-gray-500/40 dark:bg-zinc-500/40 dark:bg-neutral-500/40 dark:bg-stone-500/40";
const darkBg600_60 =
  "dark:bg-red-600/60 dark:bg-orange-600/60 dark:bg-amber-600/60 dark:bg-yellow-600/60 dark:bg-lime-600/60 dark:bg-green-600/60 dark:bg-emerald-600/60 dark:bg-teal-600/60 dark:bg-cyan-600/60 dark:bg-sky-600/60 dark:bg-blue-600/60 dark:bg-indigo-600/60 dark:bg-violet-600/60 dark:bg-purple-600/60 dark:bg-fuchsia-600/60 dark:bg-pink-600/60 dark:bg-rose-600/60 dark:bg-slate-600/60 dark:bg-gray-600/60 dark:bg-zinc-600/60 dark:bg-neutral-600/60 dark:bg-stone-600/60";
const darkBg700_10 =
  "dark:bg-red-700/10 dark:bg-orange-700/10 dark:bg-amber-700/10 dark:bg-yellow-700/10 dark:bg-lime-700/10 dark:bg-green-700/10 dark:bg-emerald-700/10 dark:bg-teal-700/10 dark:bg-cyan-700/10 dark:bg-sky-700/10 dark:bg-blue-700/10 dark:bg-indigo-700/10 dark:bg-violet-700/10 dark:bg-purple-700/10 dark:bg-fuchsia-700/10 dark:bg-pink-700/10 dark:bg-rose-700/10 dark:bg-slate-700/10 dark:bg-gray-700/10 dark:bg-zinc-700/10 dark:bg-neutral-700/10 dark:bg-stone-700/10";
const darkBg700_40 =
  "dark:bg-red-700/40 dark:bg-orange-700/40 dark:bg-amber-700/40 dark:bg-yellow-700/40 dark:bg-lime-700/40 dark:bg-green-700/40 dark:bg-emerald-700/40 dark:bg-teal-700/40 dark:bg-cyan-700/40 dark:bg-sky-700/40 dark:bg-blue-700/40 dark:bg-indigo-700/40 dark:bg-violet-700/40 dark:bg-purple-700/40 dark:bg-fuchsia-700/40 dark:bg-pink-700/40 dark:bg-rose-700/40 dark:bg-slate-700/40 dark:bg-gray-700/40 dark:bg-zinc-700/40 dark:bg-neutral-700/40 dark:bg-stone-700/40";
const darkBg900_40 =
  "dark:bg-red-900/40 dark:bg-orange-900/40 dark:bg-amber-900/40 dark:bg-yellow-900/40 dark:bg-lime-900/40 dark:bg-green-900/40 dark:bg-emerald-900/40 dark:bg-teal-900/40 dark:bg-cyan-900/40 dark:bg-sky-900/40 dark:bg-blue-900/40 dark:bg-indigo-900/40 dark:bg-violet-900/40 dark:bg-purple-900/40 dark:bg-fuchsia-900/40 dark:bg-pink-900/40 dark:bg-rose-900/40 dark:bg-slate-900/40 dark:bg-gray-900/40 dark:bg-zinc-900/40 dark:bg-neutral-900/40 dark:bg-stone-900/40";
const darkBg900_60 =
  "dark:bg-red-900/60 dark:bg-orange-900/60 dark:bg-amber-900/60 dark:bg-yellow-900/60 dark:bg-lime-900/60 dark:bg-green-900/60 dark:bg-emerald-900/60 dark:bg-teal-900/60 dark:bg-cyan-900/60 dark:bg-sky-900/60 dark:bg-blue-900/60 dark:bg-indigo-900/60 dark:bg-violet-900/60 dark:bg-purple-900/60 dark:bg-fuchsia-900/60 dark:bg-pink-900/60 dark:bg-rose-900/60 dark:bg-slate-900/60 dark:bg-gray-900/60 dark:bg-zinc-900/60 dark:bg-neutral-900/60 dark:bg-stone-900/60";

// ---------- dark:hover:bg ----------
const darkHoverBg300 =
  "dark:hover:bg-red-300 dark:hover:bg-orange-300 dark:hover:bg-amber-300 dark:hover:bg-yellow-300 dark:hover:bg-lime-300 dark:hover:bg-green-300 dark:hover:bg-emerald-300 dark:hover:bg-teal-300 dark:hover:bg-cyan-300 dark:hover:bg-sky-300 dark:hover:bg-blue-300 dark:hover:bg-indigo-300 dark:hover:bg-violet-300 dark:hover:bg-purple-300 dark:hover:bg-fuchsia-300 dark:hover:bg-pink-300 dark:hover:bg-rose-300 dark:hover:bg-slate-300 dark:hover:bg-gray-300 dark:hover:bg-zinc-300 dark:hover:bg-neutral-300 dark:hover:bg-stone-300";
const darkHoverBg500_10 =
  "dark:hover:bg-red-500/10 dark:hover:bg-orange-500/10 dark:hover:bg-amber-500/10 dark:hover:bg-yellow-500/10 dark:hover:bg-lime-500/10 dark:hover:bg-green-500/10 dark:hover:bg-emerald-500/10 dark:hover:bg-teal-500/10 dark:hover:bg-cyan-500/10 dark:hover:bg-sky-500/10 dark:hover:bg-blue-500/10 dark:hover:bg-indigo-500/10 dark:hover:bg-violet-500/10 dark:hover:bg-purple-500/10 dark:hover:bg-fuchsia-500/10 dark:hover:bg-pink-500/10 dark:hover:bg-rose-500/10 dark:hover:bg-slate-500/10 dark:hover:bg-gray-500/10 dark:hover:bg-zinc-500/10 dark:hover:bg-neutral-500/10 dark:hover:bg-stone-500/10";
const darkHoverBg500_20 =
  "dark:hover:bg-red-500/20 dark:hover:bg-orange-500/20 dark:hover:bg-amber-500/20 dark:hover:bg-yellow-500/20 dark:hover:bg-lime-500/20 dark:hover:bg-green-500/20 dark:hover:bg-emerald-500/20 dark:hover:bg-teal-500/20 dark:hover:bg-cyan-500/20 dark:hover:bg-sky-500/20 dark:hover:bg-blue-500/20 dark:hover:bg-indigo-500/20 dark:hover:bg-violet-500/20 dark:hover:bg-purple-500/20 dark:hover:bg-fuchsia-500/20 dark:hover:bg-pink-500/20 dark:hover:bg-rose-500/20 dark:hover:bg-slate-500/20 dark:hover:bg-gray-500/20 dark:hover:bg-zinc-500/20 dark:hover:bg-neutral-500/20 dark:hover:bg-stone-500/20";

// ---------- hover:text ----------
const hoverText100 =
  "hover:text-red-100 hover:text-orange-100 hover:text-amber-100 hover:text-yellow-100 hover:text-lime-100 hover:text-green-100 hover:text-emerald-100 hover:text-teal-100 hover:text-cyan-100 hover:text-sky-100 hover:text-blue-100 hover:text-indigo-100 hover:text-violet-100 hover:text-purple-100 hover:text-fuchsia-100 hover:text-pink-100 hover:text-rose-100 hover:text-slate-100 hover:text-gray-100 hover:text-zinc-100 hover:text-neutral-100 hover:text-stone-100";
const hoverText200 =
  "hover:text-red-200 hover:text-orange-200 hover:text-amber-200 hover:text-yellow-200 hover:text-lime-200 hover:text-green-200 hover:text-emerald-200 hover:text-teal-200 hover:text-cyan-200 hover:text-sky-200 hover:text-blue-200 hover:text-indigo-200 hover:text-violet-200 hover:text-purple-200 hover:text-fuchsia-200 hover:text-pink-200 hover:text-rose-200 hover:text-slate-200 hover:text-gray-200 hover:text-zinc-200 hover:text-neutral-200 hover:text-stone-200";
const hoverText300 =
  "hover:text-red-300 hover:text-orange-300 hover:text-amber-300 hover:text-yellow-300 hover:text-lime-300 hover:text-green-300 hover:text-emerald-300 hover:text-teal-300 hover:text-cyan-300 hover:text-sky-300 hover:text-blue-300 hover:text-indigo-300 hover:text-violet-300 hover:text-purple-300 hover:text-fuchsia-300 hover:text-pink-300 hover:text-rose-300 hover:text-slate-300 hover:text-gray -300 hover:text-zinc -300 hover:text-neutral -300 hover:text-stone -300";
const hoverText400 =
  "hover:text-red-400 hover:text-orange-400 hover:text-amber-400 hover:text-yellow-400 hover:text-lime-400 hover:text-green-400 hover:text-emerald-400 hover:text-teal-400 hover:text-cyan-400 hover:text-sky-400 hover:text-blue-400 hover:text-indigo-400 hover:text-violet-400 hover:text-purple-400 hover:text-fuchsia-400 hover:text-pink-400 hover:text-rose-400 hover:text-slate-400 hover:text-gray-400 hover:text-zinc-400 hover:text-neutral-400 hover:text-stone-400";
const hoverText500 =
  "hover:text-red-500 hover:text-orange-500 hover:text-amber-500 hover:text-yellow-500 hover:text-lime-500 hover:text-green-500 hover:text-emerald-500 hover:text-teal-500 hover:text-cyan-500 hover:text-sky-500 hover:text-blue-500 hover:text-indigo-500 hover:text-violet-500 hover:text-purple-500 hover:text-fuchsia-500 hover:text-pink-500 hover:text-rose-500 hover:text-slate-500 hover:text-gray-500 hover:text-zinc-500 hover:text-neutral-500 hover:text-stone-500";
const hoverText600 =
  "hover:text-red-600 hover:text-orange-600 hover:text-amber-600 hover:text-yellow-600 hover:text-lime-600 hover:text-green-600 hover:text-emerald-600 hover:text-teal-600 hover:text-cyan-600 hover:text-sky-600 hover:text-blue-600 hover:text-indigo-600 hover:text-violet-600 hover:text-purple-600 hover:text-fuchsia-600 hover:text-pink-600 hover:text-rose -600 hover:text-slate -600 hover:text-gray -600 hover:text-zinc -600 hover:text-neutral -600 hover:text-stone -600";
const hoverText700 =
  "hover:text-red-700 hover:text-orange-700 hover:text-amber-700 hover:text-yellow-700 hover:text-lime-700 hover:text-green-700 hover:text-emerald-700 hover:text-teal-700 hover:text-cyan-700 hover:text-sky-700 hover:text-blue-700 hover:text-indigo-700 hover:text-violet-700 hover:text-purple-700 hover:text-fuchsia-700 hover:text-pink-700 hover:text-rose-700 hover:text-slate-700 hover:text-gray-700 hover:text-zinc-700 hover:text-neutral-700 hover:text-stone-700";
const hoverText800 =
  "hover:text-red-800 hover:text-orange-800 hover:text-amber-800 hover:text-yellow-800 hover:text-lime-800 hover:text-green-800 hover:text-emerald-800 hover:text-teal-800 hover:text-cyan-800 hover:text-sky-800 hover:text-blue-800 hover:text-indigo-800 hover:text-violet-800 hover:text-purple-800 hover:text-fuchsia-800 hover:text-pink -800 hover:text-rose -800 hover:text-slate -800 hover:text-gray -800 hover:text-zinc -800 hover:text-neutral -800 hover:text-stone -800";
const hoverText900 =
  "hover:text-red-900 hover:text-orange-900 hover:text-amber-900 hover:text-yellow-900 hover:text-lime-900 hover:text-green-900 hover:text-emerald-900 hover:text-teal-900 hover:text-cyan-900 hover:text-sky-900 hover:text-blue-900 hover:text-indigo-900 hover:text-violet-900 hover:text-purple-900 hover:text-fuchsia-900 hover:text-pink-900 hover:text-rose-900 hover:text-slate-900 hover:text-gray-900 hover:text-zinc-900 hover:text-neutral-900 hover:text-stone-900";

// ---------- dark:hover:text ----------
const darkHoverText100 =
  "dark:hover:text-red-100 dark:hover:text-orange-100 dark:hover:text-amber-100 dark:hover:text-yellow-100 dark:hover:text-lime-100 dark:hover:text-green-100 dark:hover:text-emerald-100 dark:hover:text-teal-100 dark:hover:text-cyan-100 dark:hover:text-sky-100 dark:hover:text-blue-100 dark:hover:text-indigo-100 dark:hover:text-violet-100 dark:hover:text-purple-100 dark:hover:text-fuchsia-100 dark:hover:text-pink-100 dark:hover:text-rose-100 dark:hover:text-slate-100 dark:hover:text-gray-100 dark:hover:text-zinc-100 dark:hover:text-neutral-100 dark:hover:text-stone-100";
const darkHoverText200 =
  "dark:hover:text-red-200 dark:hover:text-orange-200 dark:hover:text-amber-200 dark:hover:text-yellow-200 dark:hover:text-lime-200 dark:hover:text-green-200 dark:hover:text-emerald-200 dark:hover:text-teal-200 dark:hover:text-cyan-200 dark:hover:text-sky-200 dark:hover:text-blue-200 dark:hover:text-indigo-200 dark:hover:text-violet-200 dark:hover:text-purple-200 dark:hover:text-fuchsia-200 dark:hover:text-pink-200 dark:hover:text-rose-200 dark:hover:text-slate-200 dark:hover:text-gray-200 dark:hover:text-zinc-200 dark:hover:text-neutral-200 dark:hover:text-stone-200";
const darkHoverText300 =
  "dark:hover:text-red-300 dark:hover:text-orange-300 dark:hover:text-amber-300 dark:hover:text-yellow-300 dark:hover:text-lime-300 dark:hover:text-green-300 dark:hover:text-emerald-300 dark:hover:text-teal-300 dark:hover:text-cyan-300 dark:hover:text-sky-300 dark:hover:text-blue-300 dark:hover:text-indigo-300 dark:hover:text-violet-300 dark:hover:text-purple-300 dark:hover:text-fuchsia-300 dark:hover:text-pink-300 dark:hover:text-rose-300 dark:hover:text-slate-300 dark:hover:text-gray-300 dark:hover:text-zinc-300 dark:hover:text-neutral-300 dark:hover:text-stone-300";

// ---------- border ----------
const border200 =
  "border-red-200 border-orange-200 border-amber-200 border-yellow-200 border-lime-200 border-green-200 border-emerald-200 border-teal-200 border-cyan-200 border-sky-200 border-blue-200 border-indigo-200 border-violet-200 border-purple-200 border-fuchsia-200 border-pink-200 border-rose-200 border-slate-200 border-gray-200 border-zinc-200 border-neutral-200 border-stone-200";
const border300 =
  "border-red-300 border-orange-300 border-amber-300 border-yellow-300 border-lime-300 border-green-300 border-emerald-300 border-teal-300 border-cyan-300 border-sky-300 border-blue-300 border-indigo-300 border-violet-300 border-purple-300 border-fuchsia-300 border-pink-300 border-rose-300 border-slate-300 border-gray-300 border-zinc-300 border-neutral-300 border-stone-300";
const border400_40 =
  "border-red-400/40 border-orange-400/40 border-amber-400/40 border-yellow-400/40 border-lime-400/40 border-green-400/40 border-emerald-400/40 border-teal-400/40 border-cyan-400/40 border-sky-400/40 border-blue-400/40 border-indigo-400/40 border-violet-400/40 border-purple-400/40 border-fuchsia-400/40 border-pink-400/40 border-rose-400/40 border-slate-400/40 border-gray-400/40 border-zinc-400/40 border-neutral-400/40 border-stone-400/40";

// ---------- dark:border ----------
const darkBorder300_20 =
  "dark:border-red-300/20 dark:border-orange-300/20 dark:border-amber-300/20 dark:border-yellow-300/20 dark:border-lime-300/20 dark:border-green-300/20 dark:border-emerald-300/20 dark:border-teal-300/20 dark:border-cyan-300/20 dark:border-sky-300/20 dark:border-blue-300/20 dark:border-indigo-300/20 dark:border-violet-300/20 dark:border-purple-300/20 dark:border-fuchsia-300/20 dark:border-pink-300/20 dark:border-rose-300/20 dark:border-slate-300/20 dark:border-gray-300/20 dark:border-zinc-300/20 dark:border-neutral-300/20 dark:border-stone-300/20";
const darkBorder500_40 =
  "dark:border-red-500/40 dark:border-orange-500/40 dark:border-amber-500/40 dark:border-yellow-500/40 dark:border-lime-500/40 dark:border-green-500/40 dark:border-emerald-500/40 dark:border-teal-500/40 dark:border-cyan-500/40 dark:border-sky-500/40 dark:border-blue-500/40 dark:border-indigo-500/40 dark:border-violet-500/40 dark:border-purple-500/40 dark:border-fuchsia-500/40 dark:border-pink-500/40 dark:border-rose-500/40 dark:border-slate-500/40 dark:border-gray-500/40 dark:border-zinc-500/40 dark:border-neutral-500/40 dark:border-stone-500/40";
const darkBorder500_50 =
  "dark:border-red-500/50 dark:border-orange-500/50 dark:border-amber-500/50 dark:border-yellow-500/50 dark:border-lime-500/50 dark:border-green-500/50 dark:border-emerald-500/50 dark:border-teal-500/50 dark:border-cyan-500/50 dark:border-sky-500/50 dark:border-blue-500/50 dark:border-indigo-500/50 dark:border-violet-500/50 dark:border-purple-500/50 dark:border-fuchsia-500/50 dark:border-pink-500/50 dark:border-rose-500/50 dark:border-slate-500/50 dark:border-gray-500/50 dark:border-zinc-500/50 dark:border-neutral-500/50 dark:border-stone-500/50";
const darkBorder700 =
  "dark:border-red-700 dark:border-orange-700 dark:border-amber-700 dark:border-yellow-700 dark:border-lime-700 dark:border-green-700 dark:border-emerald-700 dark:border-teal-700 dark:border-cyan-700 dark:border-sky-700 dark:border-blue-700 dark:border-indigo-700 dark:border-violet-700 dark:border-purple-700 dark:border-fuchsia-700 dark:border-pink-700 dark:border-rose-700 dark:border-slate-700 dark:border-gray-700 dark:border-zinc-700 dark:border-neutral-700 dark:border-stone-700";
const darkBorder700_60 =
  "dark:border-red-700/60 dark:border-orange-700/60 dark:border-amber-700/60 dark:border-yellow-700/60 dark:border-lime-700/60 dark:border-green-700/60 dark:border-emerald-700/60 dark:border-teal-700/60 dark:border-cyan-700/60 dark:border-sky-700/60 dark:border-blue-700/60 dark:border-indigo-700/60 dark:border-violet-700/60 dark:border-purple-700/60 dark:border-fuchsia-700/60 dark:border-pink-700/60 dark:border-rose-700/60 dark:border-slate-700/60 dark:border-gray-700/60 dark:border-zinc-700/60 dark:border-neutral-700/60 dark:border-stone-700/60";
const darkBorder800 =
  "dark:border-red-800 dark:border-orange-800 dark:border-amber-800 dark:border-yellow-800 dark:border-lime-800 dark:border-green-800 dark:border-emerald-800 dark:border-teal-800 dark:border-cyan-800 dark:border-sky-800 dark:border-blue-800 dark:border-indigo-800 dark:border-violet-800 dark:border-purple-800 dark:border-fuchsia-800 dark:border-pink-800 dark:border-rose-800 dark:border-slate-800 dark:border-gray-800 dark:border-zinc-800 dark:border-neutral-800 dark:border-stone-800";

// ---------- border-{side} (spinner) ----------
const borderT500 =
  "border-t-red-500 border-t-orange-500 border-t-amber-500 border-t-yellow-500 border-t-lime-500 border-t-green-500 border-t-emerald-500 border-t-teal-500 border-t-cyan-500 border-t-sky-500 border-t-blue-500 border-t-indigo-500 border-t-violet-500 border-t-purple-500 border-t-fuchsia-500 border-t-pink-500 border-t-rose-500 border-t-slate-500 border-t-gray-500 border-t-zinc-500 border-t-neutral-500 border-t-stone-500";
const darkBorderT300 =
  "dark:border-t-red-300 dark:border-t-orange-300 dark:border-t-amber-300 dark:border-t-yellow-300 dark:border-t-lime-300 dark:border-t-green-300 dark:border-t-emerald-300 dark:border-t-teal-300 dark:border-t-cyan-300 dark:border-t-sky-300 dark:border-t-blue-300 dark:border-t-indigo-300 dark:border-t-violet-300 dark:border-t-purple-300 dark:border-t-fuchsia-300 dark:border-t-pink-300 dark:border-t-rose-300 dark:border-t-slate-300 dark:border-t-gray-300 dark:border-t-zinc-300 dark:border-t-neutral-300 dark:border-t-stone-300";
const borderR300 =
  "border-r-red-300 border-r-orange-300 border-r-amber-300 border-r-yellow-300 border-r-lime-300 border-r-green-300 border-r-emerald-300 border-r-teal-300 border-r-cyan-300 border-r-sky-300 border-r-blue-300 border-r-indigo-300 border-r-violet-300 border-r-purple-300 border-r-fuchsia-300 border-r-pink-300 border-r-rose-300 border-r-slate-300 border-r-gray-300 border-r-zinc-300 border-r-neutral-300 border-r-stone-300";
const darkBorderR200 =
  "dark:border-r-red-200 dark:border-r-orange-200 dark:border-r-amber-200 dark:border-r-yellow-200 dark:border-r-lime-200 dark:border-r-green-200 dark:border-r-emerald-200 dark:border-r-teal-200 dark:border-r-cyan-200 dark:border-r-sky-200 dark:border-r-blue-200 dark:border-r-indigo-200 dark:border-r-violet-200 dark:border-r-purple-200 dark:border-r-fuchsia-200 dark:border-r-pink-200 dark:border-r-rose-200 dark:border-r-slate-200 dark:border-r-gray-200 dark:border-r-zinc-200 dark:border-r-neutral-200 dark:border-r-stone-200";
const borderB200 =
  "border-b-red-200 border-b-orange-200 border-b-amber-200 border-b-yellow-200 border-b-lime-200 border-b-green-200 border-b-emerald-200 border-b-teal-200 border-b-cyan-200 border-b-sky-200 border-b-blue-200 border-b-indigo-200 border-b-violet-200 border-b-purple-200 border-b-fuchsia-200 border-b-pink-200 border-b-rose-200 border-b-slate-200 border-b-gray-200 border-b-zinc-200 border-b-neutral-200 border-b-stone-200";
const darkBorderB100_60 =
  "dark:border-b-red-100/60 dark:border-b-orange-100/60 dark:border-b-amber-100/60 dark:border-b-yellow-100/60 dark:border-b-lime-100/60 dark:border-b-green-100/60 dark:border-b-emerald-100/60 dark:border-b-teal-100/60 dark:border-b-cyan-100/60 dark:border-b-sky-100/60 dark:border-b-blue-100/60 dark:border-b-indigo-100/60 dark:border-b-violet-100/60 dark:border-b-purple-100/60 dark:border-b-fuchsia-100/60 dark:border-b-pink-100/60 dark:border-b-rose-100/60 dark:border-b-slate-100/60 dark:border-b-gray-100/60 dark:border-b-zinc-100/60 dark:border-b-neutral-100/60 dark:border-b-stone-100/60";
const borderL100 =
  "border-l-red-100 border-l-orange-100 border-l-amber-100 border-l-yellow-100 border-l-lime-100 border-l-green-100 border-l-emerald-100 border-l-teal-100 border-l-cyan-100 border-l-sky-100 border-l-blue-100 border-l-indigo-100 border-l-violet-100 border-l-purple-100 border-l-fuchsia-100 border-l-pink-100 border-l-rose-100 border-l-slate-100 border-l-gray-100 border-l-zinc-100 border-l-neutral-100 border-l-stone-100";
const darkBorderL100_40 =
  "dark:border-l-red-100/40 dark:border-l-orange-100/40 dark:border-l-amber-100/40 dark:border-l-yellow-100/40 dark:border-l-lime-100/40 dark:border-l-green-100/40 dark:border-l-emerald-100/40 dark:border-l-teal-100/40 dark:border-l-cyan-100/40 dark:border-l-sky-100/40 dark:border-l-blue-100/40 dark:border-l-indigo-100/40 dark:border-l-violet-100/40 dark:border-l-purple-100/40 dark:border-l-fuchsia-100/40 dark:border-l-pink-100/40 dark:border-l-rose-100/40 dark:border-l-slate-100/40 dark:border-l-gray-100/40 dark:border-l-zinc-100/40 dark:border-l-neutral-100/40 dark:border-l-stone-100/40";

// ---------- ring ----------
const ring200 =
  "ring-red-200 ring-orange-200 ring-amber-200 ring-yellow-200 ring-lime-200 ring-green-200 ring-emerald-200 ring-teal-200 ring-cyan-200 ring-sky-200 ring-blue-200 ring-indigo-200 ring-violet-200 ring-purple-200 ring-fuchsia-200 ring-pink-200 ring-rose-200 ring-slate-200 ring-gray-200 ring-zinc-200 ring-neutral-200 ring-stone-200";
const darkRing500_40 =
  "dark:ring-red-500/40 dark:ring-orange-500/40 dark:ring-amber-500/40 dark:ring-yellow-500/40 dark:ring-lime-500/40 dark:ring-green-500/40 dark:ring-emerald-500/40 dark:ring-teal-500/40 dark:ring-cyan-500/40 dark:ring-sky-500/40 dark:ring-blue-500/40 dark:ring-indigo-500/40 dark:ring-violet-500/40 dark:ring-purple-500/40 dark:ring-fuchsia-500/40 dark:ring-pink-500/40 dark:ring-rose-500/40 dark:ring-slate-500/40 dark:ring-gray-500/40 dark:ring-zinc-500/40 dark:ring-neutral-500/40 dark:ring-stone-500/40";

// ---------- focus-visible:ring ----------
const focusRing400 =
  "focus-visible:ring-red-400 focus-visible:ring-orange-400 focus-visible:ring-amber-400 focus-visible:ring-yellow-400 focus-visible:ring-lime-400 focus-visible:ring-green-400 focus-visible:ring-emerald-400 focus-visible:ring-teal-400 focus-visible:ring-cyan-400 focus-visible:ring-sky-400 focus-visible:ring-blue-400 focus-visible:ring-indigo-400 focus-visible:ring-violet-400 focus-visible:ring-purple-400 focus-visible:ring-fuchsia-400 focus-visible:ring-pink-400 focus-visible:ring-rose-400 focus-visible:ring-slate-400 focus-visible:ring-gray-400 focus-visible:ring-zinc-400 focus-visible:ring-neutral-400 focus-visible:ring-stone-400";
const focusRing500 =
  "focus-visible:ring-red-500 focus-visible:ring-orange-500 focus-visible:ring-amber-500 focus-visible:ring-yellow-500 focus-visible:ring-lime-500 focus-visible:ring-green-500 focus-visible:ring-emerald-500 focus-visible:ring-teal-500 focus-visible:ring-cyan-500 focus-visible:ring-sky-500 focus-visible:ring-blue-500 focus-visible:ring-indigo-500 focus-visible:ring-violet-500 focus-visible:ring-purple-500 focus-visible:ring-fuchsia-500 focus-visible:ring-pink-500 focus-visible:ring-rose-500 focus-visible:ring-slate-500 focus-visible:ring-gray-500 focus-visible:ring-zinc-500 focus-visible:ring-neutral-500 focus-visible:ring-stone-500";
const darkFocusRing400 =
  "dark:focus-visible:ring-red-400 dark:focus-visible:ring-orange-400 dark:focus-visible:ring-amber-400 dark:focus-visible:ring-yellow-400 dark:focus-visible:ring-lime-400 dark:focus-visible:ring-green-400 dark:focus-visible:ring-emerald-400 dark:focus-visible:ring-teal-400 dark:focus-visible:ring-cyan-400 dark:focus-visible:ring-sky-400 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-indigo-400 dark:focus-visible:ring-violet-400 dark:focus-visible:ring-purple-400 dark:focus-visible:ring-fuchsia-400 dark:focus-visible:ring-pink-400 dark:focus-visible:ring-rose-400 dark:focus-visible:ring-slate-400 dark:focus-visible:ring-gray-400 dark:focus-visible:ring-zinc-400 dark:focus-visible:ring-neutral-400 dark:focus-visible:ring-stone-400";

// ---------- toggle (peer-checked / peer-focus) ----------
const peerCheckedBg500 =
  "peer-checked:bg-red-500 peer-checked:bg-orange-500 peer-checked:bg-amber-500 peer-checked:bg-yellow-500 peer-checked:bg-lime-500 peer-checked:bg-green-500 peer-checked:bg-emerald-500 peer-checked:bg-teal-500 peer-checked:bg-cyan-500 peer-checked:bg-sky-500 peer-checked:bg-blue-500 peer-checked:bg-indigo-500 peer-checked:bg-violet-500 peer-checked:bg-purple-500 peer-checked:bg-fuchsia-500 peer-checked:bg-pink-500 peer-checked:bg-rose-500 peer-checked:bg-slate-500 peer-checked:bg-gray-500 peer-checked:bg-zinc-500 peer-checked:bg-neutral-500 peer-checked:bg-stone-500";
const darkPeerCheckedBg400 =
  "dark:peer-checked:bg-red-400 dark:peer-checked:bg-orange-400 dark:peer-checked:bg-amber-400 dark:peer-checked:bg-yellow-400 dark:peer-checked:bg-lime-400 dark:peer-checked:bg-green-400 dark:peer-checked:bg-emerald-400 dark:peer-checked:bg-teal-400 dark:peer-checked:bg-cyan-400 dark:peer-checked:bg-sky-400 dark:peer-checked:bg-blue-400 dark:peer-checked:bg-indigo-400 dark:peer-checked:bg-violet-400 dark:peer-checked:bg-purple-400 dark:peer-checked:bg-fuchsia-400 dark:peer-checked:bg-pink-400 dark:peer-checked:bg-rose-400 dark:peer-checked:bg-slate-400 dark:peer-checked:bg-gray-400 dark:peer-checked:bg-zinc-400 dark:peer-checked:bg-neutral-400 dark:peer-checked:bg-stone-400";
const peerCheckedBorder500 =
  "peer-checked:border-red-500 peer-checked:border-orange-500 peer-checked:border-amber-500 peer-checked:border-yellow-500 peer-checked:border-lime-500 peer-checked:border-green-500 peer-checked:border-emerald-500 peer-checked:border-teal-500 peer-checked:border-cyan-500 peer-checked:border-sky-500 peer-checked:border-blue-500 peer-checked:border-indigo-500 peer-checked:border-violet-500 peer-checked:border-purple-500 peer-checked:border-fuchsia-500 peer-checked:border-pink-500 peer-checked:border-rose-500 peer-checked:border-slate-500 peer-checked:border-gray-500 peer-checked:border-zinc-500 peer-checked:border-neutral-500 peer-checked:border-stone-500";
const peerFocusRing400 =
  "peer-focus:ring-red-400 peer-focus:ring-orange-400 peer-focus:ring-amber-400 peer-focus:ring-yellow-400 peer-focus:ring-lime-400 peer-focus:ring-green-400 peer-focus:ring-emerald-400 peer-focus:ring-teal-400 peer-focus:ring-cyan-400 peer-focus:ring-sky-400 peer-focus:ring-blue-400 peer-focus:ring-indigo-400 peer-focus:ring-violet-400 peer-focus:ring-purple-400 peer-focus:ring-fuchsia-400 peer-focus:ring-pink-400 peer-focus:ring-rose-400 peer-focus:ring-slate-400 peer-focus:ring-gray-400 peer-focus:ring-zinc-400 peer-focus:ring-neutral-400 peer-focus:ring-stone-400";

// ---------- checkbox (accent) ----------
const accent600 =
  "accent-red-600 accent-orange-600 accent-amber-600 accent-yellow-600 accent-lime-600 accent-green-600 accent-emerald-600 accent-teal-600 accent-cyan-600 accent-sky-600 accent-blue-600 accent-indigo-600 accent-violet-600 accent-purple-600 accent-fuchsia-600 accent-pink-600 accent-rose-600 accent-slate-600 accent-gray-600 accent-zinc-600 accent-neutral-600 accent-stone-600";

// ---------- after:bg (tabs underline) ----------
const afterBg500 =
  "after:bg-red-500 after:bg-orange-500 after:bg-amber-500 after:bg-yellow-500 after:bg-lime-500 after:bg-green-500 after:bg-emerald-500 after:bg-teal-500 after:bg-cyan-500 after:bg-sky-500 after:bg-blue-500 after:bg-indigo-500 after:bg-violet-500 after:bg-purple-500 after:bg-fuchsia-500 after:bg-pink-500 after:bg-rose-500 after:bg-slate-500 after:bg-gray-500 after:bg-zinc-500 after:bg-neutral-500 after:bg-stone-500";
const darkAfterBg400 =
  "dark:after:bg-red-400 dark:after:bg-orange-400 dark:after:bg-amber-400 dark:after:bg-yellow-400 dark:after:bg-lime-400 dark:after:bg-green-400 dark:after:bg-emerald-400 dark:after:bg-teal-400 dark:after:bg-cyan-400 dark:after:bg-sky-400 dark:after:bg-blue-400 dark:after:bg-indigo-400 dark:after:bg-violet-400 dark:after:bg-purple-400 dark:after:bg-fuchsia-400 dark:after:bg-pink-400 dark:after:bg-rose-400 dark:after:bg-slate-400 dark:after:bg-gray-400 dark:after:bg-zinc-400 dark:after:bg-neutral-400 dark:after:bg-stone-400";

// ---------- gradient stops (panel overlay) ----------
const from900_70 =
  "from-red-900/70 from-orange-900/70 from-amber-900/70 from-yellow-900/70 from-lime-900/70 from-green-900/70 from-emerald-900/70 from-teal-900/70 from-cyan-900/70 from-sky-900/70 from-blue-900/70 from-indigo-900/70 from-violet-900/70 from-purple-900/70 from-fuchsia-900/70 from-pink-900/70 from-rose-900/70 from-slate-900/70 from-gray-900/70 from-zinc-900/70 from-neutral-900/70 from-stone-900/70";
const via900_40 =
  "via-red-900/40 via-orange-900/40 via-amber-900/40 via-yellow-900/40 via-lime-900/40 via-green-900/40 via-emerald-900/40 via-teal-900/40 via-cyan-900/40 via-sky-900/40 via-blue-900/40 via-indigo-900/40 via-violet-900/40 via-purple-900/40 via-fuchsia-900/40 via-pink-900/40 via-rose-900/40 via-slate-900/40 via-gray-900/40 via-zinc-900/40 via-neutral-900/40 via-stone-900/40";
const to900_15 =
  "to-red-900/15 to-orange-900/15 to-amber-900/15 to-yellow-900/15 to-lime-900/15 to-green-900/15 to-emerald-900/15 to-teal-900/15 to-cyan-900/15 to-sky-900/15 to-blue-900/15 to-indigo-900/15 to-violet-900/15 to-purple-900/15 to-fuchsia-900/15 to-pink-900/15 to-rose-900/15 to-slate-900/15 to-gray-900/15 to-zinc-900/15 to-neutral-900/15 to-stone-900/15";

// ---------- gradient stops (panel decoration) ----------
const from100_60 =
  "from-red-100/60 from-orange-100/60 from-amber-100/60 from-yellow-100/60 from-lime-100/60 from-green-100/60 from-emerald-100/60 from-teal-100/60 from-cyan-100/60 from-sky-100/60 from-blue-100/60 from-indigo-100/60 from-violet-100/60 from-purple-100/60 from-fuchsia-100/60 from-pink-100/60 from-rose-100/60 from-slate-100/60 from-gray-100/60 from-zinc-100/60 from-neutral-100/60 from-stone-100/60";
const darkFrom500_10 =
  "dark:from-red-500/10 dark:from-orange-500/10 dark:from-amber-500/10 dark:from-yellow-500/10 dark:from-lime-500/10 dark:from-green-500/10 dark:from-emerald-500/10 dark:from-teal-500/10 dark:from-cyan-500/10 dark:from-sky-500/10 dark:from-blue-500/10 dark:from-indigo-500/10 dark:from-violet-500/10 dark:from-purple-500/10 dark:from-fuchsia-500/10 dark:from-pink-500/10 dark:from-rose-500/10 dark:from-slate-500/10 dark:from-gray-500/10 dark:from-zinc-500/10 dark:from-neutral-500/10 dark:from-stone-500/10";

// ---------- important modifiers (ButtonTypes.ts iconAccentActive) ----------
const importantText500 =
  "!text-red-500 !text-orange-500 !text-amber-500 !text-yellow-500 !text-lime-500 !text-green-500 !text-emerald-500 !text-teal-500 !text-cyan-500 !text-sky-500 !text-blue-500 !text-indigo-500 !text-violet-500 !text-purple-500 !text-fuchsia-500 !text-pink-500 !text-rose-500 !text-slate-500 !text-gray-500 !text-zinc-500 !text-neutral-500 !text-stone-500";
const importantDarkText300 =
  "!dark:text-red-300 !dark:text-orange-300 !dark:text-amber-300 !dark:text-yellow-300 !dark:text-lime-300 !dark:text-green-300 !dark:text-emerald-300 !dark:text-teal-300 !dark:text-cyan-300 !dark:text-sky-300 !dark:text-blue-300 !dark:text-indigo-300 !dark:text-violet-300 !dark:text-purple-300 !dark:text-fuchsia-300 !dark:text-pink-300 !dark:text-rose-300 !dark:text-slate-300 !dark:text-gray-300 !dark:text-zinc-300 !dark:text-neutral-300 !dark:text-stone-300";

// ---------- SplitView subContent grid animation ----------
// Used for the expand/collapse height animation via CSS grid-template-rows trick
const gridRows = "grid-rows-[0fr] grid-rows-[1fr]";
