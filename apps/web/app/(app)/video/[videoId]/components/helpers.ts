/**
 * Format a date as relative time (e.g., "Published yesterday", "3 weeks ago")
 */
export function formatRelativeDate(dateStr: string): string {
  const published = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - published.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Published today";
  if (diffDays === 1) return "Published yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? "1 month ago" : `${months} months ago`;
  }
  const years = Math.floor(diffDays / 365);
  return years === 1 ? "1 year ago" : `${years} years ago`;
}

export { formatDuration } from "@/lib/competitor-utils";

/**
 * Format reset date/time for limit reached messages
 */
export function formatResetAt(resetAt: string): string {
  const d = new Date(resetAt);
  if (Number.isNaN(d.getTime())) return "tomorrow";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}



