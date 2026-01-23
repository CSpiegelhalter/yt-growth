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

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

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

/**
 * Calculate performance level based on video metrics
 */
export function getPerformanceLevel(
  avgViewed: number,
  engagementRate: number,
  subsPer1k: number
): { level: string; label: string } {
  let score = 0;
  if (avgViewed >= 50) score += 2;
  else if (avgViewed >= 40) score += 1;
  if (engagementRate >= 5) score += 2;
  else if (engagementRate >= 3) score += 1;
  if (subsPer1k >= 2.5) score += 2;
  else if (subsPer1k >= 1.5) score += 1;

  if (score >= 5) return { level: "excellent", label: "Performing Well" };
  if (score >= 3) return { level: "good", label: "Solid Performance" };
  if (score >= 1) return { level: "fair", label: "Room to Grow" };
  return { level: "needs-work", label: "Needs Attention" };
}

