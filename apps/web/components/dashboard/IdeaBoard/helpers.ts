/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) {return text;}
  return `${text.slice(0, maxLen - 3)  }...`;
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

