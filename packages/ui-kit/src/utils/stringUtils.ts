export function toBoolean(value: string | undefined): boolean {
  if (value === undefined) {
    return false;
  }
  return (
    value.toLowerCase() === "true" ||
    value === "1" ||
    value === "yes" ||
    value === "on" ||
    value === "enabled" ||
    value === "y" ||
    value === "t"
  );
}

export function normalizeString(subject: string): string {
  return subject.replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}


export function normalizeStringToUpper(name: string): string {
  return normalizeString(name.toUpperCase());
}

export function isDevelopment(environment: string): boolean {
  return environment === "development" || environment === "staging" || environment === "beta";
}


export function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

export function formatLogTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return iso.slice(11, 19);
  }
}

export function formatMB(mb?: number): string {
  if (mb == null) return '—';
  if (mb >= 1024 * 1024) return `${(mb / (1024 * 1024)).toFixed(1)} TB`;
  if (mb >= 1024) return `${Math.round(mb / 1024)} GB`;
  return `${mb} MB`;
}
