import { ButtonColor } from './Button';

export const iconAccentRing: Record<ButtonColor, string> = {
  indigo: 'focus-visible:ring-indigo-500',
  blue: 'focus-visible:ring-blue-400',
  emerald: 'focus-visible:ring-emerald-500',
  amber: 'focus-visible:ring-amber-500',
  rose: 'focus-visible:ring-rose-500',
  slate: 'focus-visible:ring-slate-500',
  white: 'focus-visible:ring-slate-200',
  theme: 'focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500',
};

export const iconAccentHover: Record<ButtonColor, string> = {
  indigo: 'hover:text-indigo-500 dark:hover:text-indigo-300',
  blue: 'hover:text-blue-500 dark:hover:text-blue-300',
  emerald: 'hover:text-emerald-500 dark:hover:text-emerald-300',
  amber: 'hover:text-amber-500 dark:hover:text-amber-300',
  rose: 'hover:text-rose-500 dark:hover:text-rose-300',
  slate: 'hover:text-slate-600 dark:hover:text-slate-200',
  white: 'hover:text-white dark:hover:text-neutral-100',
  theme: 'hover:text-neutral-800 dark:hover:text-neutral-100',
};

export const iconAccentActive: Record<ButtonColor, string> = {
  indigo: '!text-indigo-500 !dark:text-indigo-300',
  blue: '!text-blue-500 !dark:text-blue-300',
  emerald: '!text-emerald-500 !dark:text-emerald-300',
  amber: '!text-amber-500 !dark:text-amber-300',
  rose: '!text-rose-500 !dark:text-rose-300',
  slate: '!text-slate-600 !dark:text-slate-200',
  white: '!text-white !dark:text-neutral-100',
  theme: '!text-neutral-800 !dark:text-neutral-100',
};
