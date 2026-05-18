export function formatTimeRange(timestamps: number[]): string {
  if (timestamps.length === 0) return 'No data';
  if (timestamps.length === 1) return 'Recent data';

  const oldest = Math.min(...timestamps);
  const newest = Math.max(...timestamps);
  const diffMs = newest - oldest;
  const diffSeconds = Math.round(diffMs / 1000);

  if (diffSeconds < 60) {
    return `in the last ${diffSeconds} seconds`;
  }

  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `in the last ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  return `in the last ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
}