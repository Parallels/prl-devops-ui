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
  return subject.toLowerCase().replace(/[^a-zA-Z0-9]/g, "_");
}

export function isDevelopment(environment: string): boolean {
  return environment === "development" || environment === "staging" || environment === "beta";
}
