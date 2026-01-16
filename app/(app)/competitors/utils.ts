export type SortOption = "velocity" | "engagement" | "newest" | "outliers";

export function getSortDescription(sort: SortOption): string {
  switch (sort) {
    case "velocity":
      return "Videos gaining the most views in the last 24 hours";
    case "outliers":
      return "Videos performing significantly above the channel's average";
    case "engagement":
      return "Videos with the highest like and comment rates";
    case "newest":
      return "Most recently published videos";
    default:
      return "";
  }
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffHours < 48) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatTimeUntil(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();

  if (diffMs <= 0) return "now";

  const diffMinutes = Math.ceil(diffMs / (1000 * 60));

  if (diffMinutes < 60) {
    return `in ${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""}`;
  }

  const diffHours = Math.ceil(diffMinutes / 60);
  return `in about ${diffHours} hour${diffHours !== 1 ? "s" : ""}`;
}
