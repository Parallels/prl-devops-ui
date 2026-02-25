/**
 * Duration formatting utilities.
 * All functions operate on whole minutes as the base unit.
 */

// ── Constants ──────────────────────────────────────────────────────────────────

/** Approximate minutes per calendar month (30 days). */
const MINUTES_PER_MONTH = 43_200;  // 30 * 24 * 60

const DURATION_UNITS = [
  { singular: 'year',   plural: 'years',   minutes: 525_960 }, // 365.25 * 24 * 60
  { singular: 'month',  plural: 'months',  minutes: MINUTES_PER_MONTH },
  { singular: 'day',    plural: 'days',    minutes: 1_440 },
  { singular: 'hour',   plural: 'hours',   minutes: 60 },
  { singular: 'minute', plural: 'minutes', minutes: 1 },
] as const;

// ── Options ────────────────────────────────────────────────────────────────────

export interface FormatDurationOptions {
  /**
   * Maximum number of unit parts to include in the output.
   * e.g. maxParts=2 → "1 day and 5 hours" (minutes dropped)
   * Defaults to 3.
   */
  maxParts?: number;

  /**
   * String to return when the input is zero or negative.
   * Defaults to "0 minutes".
   */
  zeroLabel?: string;
}

// ── Core formatter ─────────────────────────────────────────────────────────────

/**
 * Converts a number of minutes into a human-readable duration string.
 *
 * @example
 * formatDuration(1)            // "1 minute"
 * formatDuration(45)           // "45 minutes"
 * formatDuration(60)           // "1 hour"
 * formatDuration(85)           // "1 hour and 25 minutes"
 * formatDuration(1440)         // "1 day"
 * formatDuration(1525)         // "1 day and 25 minutes"
 * formatDuration(1860)         // "1 day and 7 hours"      (maxParts=2 default trims minutes)
 * formatDuration(7785)         // "5 days, 9 hours and 45 minutes"
 * formatDuration(46080)        // "1 month and 2 days"
 * formatDuration(530985)       // "1 year, 1 month and 2 days"
 * formatDuration(0)            // "0 minutes"
 * formatDuration(-5)           // "0 minutes"
 */
export function formatDuration(totalMinutes: number, options?: FormatDurationOptions): string {
  const { maxParts = 3, zeroLabel = '0 minutes' } = options ?? {};

  const minutes = Math.floor(totalMinutes);
  if (minutes <= 0) return zeroLabel;

  const parts: string[] = [];
  let remaining = minutes;

  for (const unit of DURATION_UNITS) {
    if (remaining < unit.minutes) continue;

    const count = Math.floor(remaining / unit.minutes);
    remaining -= count * unit.minutes;

    parts.push(`${count} ${count === 1 ? unit.singular : unit.plural}`);

    if (parts.length >= maxParts) break;
  }

  if (parts.length === 0) return zeroLabel;
  if (parts.length === 1) return parts[0];

  // "a, b and c"  or  "a and b"
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

// ── Convenience wrappers ───────────────────────────────────────────────────────

/**
 * Like `formatDuration` but accepts seconds instead of minutes.
 * Values under 60 seconds are shown as "less than a minute" by default.
 */
export function formatDurationFromSeconds(
  totalSeconds: number,
  options?: FormatDurationOptions & { subMinuteLabel?: string },
): string {
  const { subMinuteLabel = 'less than a minute', ...rest } = options ?? {};
  const mins = Math.floor(totalSeconds / 60);
  if (mins < 1 && totalSeconds > 0) return subMinuteLabel;
  return formatDuration(mins, rest);
}

/**
 * Like `formatDuration` but accepts milliseconds instead of minutes.
 * Values under 60 000 ms are shown as "less than a minute" by default.
 */
export function formatDurationFromMs(
  totalMs: number,
  options?: FormatDurationOptions & { subMinuteLabel?: string },
): string {
  return formatDurationFromSeconds(Math.floor(totalMs / 1000), options);
}
