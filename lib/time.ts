/** Human-friendly relative timestamp, e.g. "2m ago", "1h 30m ago". */
export function timeAgo(timestamp: number, base: number = Date.now()): string {
  const diffMs = Math.max(0, base - timestamp);
  const totalMinutes = Math.floor(diffMs / 60_000);

  if (totalMinutes < 1) return 'just now';
  if (totalMinutes < 60) return `${totalMinutes}m ago`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) return `${hours}h ago`;
  return `${hours}h ${minutes}m ago`;
}

/** Format minutes as "2h 15m" / "45m". */
export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}
