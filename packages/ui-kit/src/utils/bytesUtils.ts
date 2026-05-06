/**
 * Byte / data-size formatting utilities.
 *
 * All functions that accept a unit parameter use `DataSizeUnit` which maps
 * directly to the `action_value_unit` field returned by the API.
 */

export type DataSizeUnit = "B" | "KB" | "MB" | "GB" | "TB";

/** Maps common full names and abbreviations (any case) to a canonical DataSizeUnit. */
const UNIT_ALIASES: Record<string, DataSizeUnit> = {
  b: "B",
  byte: "B",
  bytes: "B",
  kb: "KB",
  kilobyte: "KB",
  kilobytes: "KB",
  mb: "MB",
  megabyte: "MB",
  megabytes: "MB",
  gb: "GB",
  gigabyte: "GB",
  gigabytes: "GB",
  tb: "TB",
  terabyte: "TB",
  terabytes: "TB",
};

/**
 * Normalize a raw unit string from the API (e.g. `"bytes"`, `"MB"`, `"Gigabytes"`)
 * to a canonical `DataSizeUnit`. Falls back to `'B'` for unknown values.
 */
export function normalizeDataSizeUnit(raw: string | undefined): DataSizeUnit {
  if (!raw) return "B";
  return UNIT_ALIASES[raw.trim().toLowerCase()] ?? "B";
}

/** Conversion factors relative to bytes. */
const BYTES_PER_UNIT: Record<DataSizeUnit, number> = {
  B: 1,
  KB: 1_024,
  MB: 1_048_576,
  GB: 1_073_741_824,
  TB: 1_099_511_627_776,
};

/** Ordered from largest to smallest — used when picking the best display unit. */
const DISPLAY_ORDER: DataSizeUnit[] = ["TB", "GB", "MB", "KB", "B"];

/**
 * Convert a value from `fromUnit` to bytes.
 */
function toBytes(value: number, fromUnit: DataSizeUnit): number {
  return value * BYTES_PER_UNIT[fromUnit];
}

/**
 * Pick the largest unit in which `referenceBytes` is >= 1.
 * Falls back to 'B' when the value is 0 or less.
 */
export function pickBestUnit(referenceBytes: number): DataSizeUnit {
  for (const unit of DISPLAY_ORDER) {
    if (referenceBytes >= BYTES_PER_UNIT[unit]) return unit;
  }
  return "B";
}

/**
 * Format a raw byte value using the given display unit, up to `decimals`
 * significant decimal places (trailing zeros are stripped).
 */
export function formatBytesAs(
  bytes: number,
  unit: DataSizeUnit,
  decimals = 2,
): string {
  const converted = bytes / BYTES_PER_UNIT[unit];
  // Round to the requested precision then strip trailing zeros.
  const rounded = parseFloat(converted.toFixed(decimals));
  return `${rounded}`;
}

/**
 * Format `value` and `total` — both expressed in `inputUnit` — using the
 * same human-friendly display unit derived from `total`.
 *
 * @example
 * // total = 1.5 GB → picks GB
 * formatProgressBytes(0.45, 1.5, 'GB')
 * // → { valueLabel: '0.45', totalLabel: '1.5', unit: 'GB', line: '0.45 / 1.5 GB' }
 *
 * // total = 1_500_000_000 bytes → picks GB
 * formatProgressBytes(450_000_000, 1_500_000_000, 'B')
 * // → { valueLabel: '0.42', totalLabel: '1.4', unit: 'GB', line: '0.42 / 1.4 GB' }
 */
export function formatProgressBytes(
  value: number,
  total: number,
  inputUnit: DataSizeUnit = "B",
  decimals = 2,
): {
  valueLabel: string;
  totalLabel: string;
  unit: DataSizeUnit;
  line: string;
} {
  const totalBytes = toBytes(total, inputUnit);
  const unit = pickBestUnit(totalBytes);

  const valueLabel = formatBytesAs(toBytes(value, inputUnit), unit, decimals);
  const totalLabel = formatBytesAs(totalBytes, unit, decimals);

  return {
    valueLabel,
    totalLabel,
    unit,
    line: `${valueLabel} / ${totalLabel} ${unit}`,
  };
}

/**
 * Format a single byte value to the most appropriate unit, with up to
 * `decimals` decimal places.
 *
 * @example
 * formatBytes(1_500_000)   // "1.43 MB"
 * formatBytes(2_684_354_560) // "2.5 GB"
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes <= 0) return `0 B`;
  const unit = pickBestUnit(bytes);
  return `${formatBytesAs(bytes, unit, decimals)} ${unit}`;
}
