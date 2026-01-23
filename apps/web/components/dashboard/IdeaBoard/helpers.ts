/**
 * Format a date string as a relative time (e.g., "just now", "3h ago", "yesterday")
 */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return "just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffHours < 48) return "yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + "...";
}

/**
 * Format remix variant key to human-readable label
 */
export function formatRemixLabel(key: string): string {
  const labels: Record<string, string> = {
    emotional: "Emotional",
    contrarian: "Contrarian",
    beginner: "Beginner-Friendly",
    advanced: "Advanced",
    shortsFirst: "Shorts-First",
  };
  return labels[key] ?? key;
}

/**
 * Return unique strings from an array
 */
export function uniqStrings(arr: string[]): string[] {
  return Array.from(new Set(arr));
}

