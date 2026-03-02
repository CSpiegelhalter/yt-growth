function parseNumericValue(value: string): number {
  const cleaned = value.trim().toLowerCase();
  if (cleaned.endsWith("k")) {
    return Number.parseFloat(cleaned) * 1000;
  }
  return Number.parseFloat(cleaned);
}

export function getStatClass(
  key: string,
  value: string,
  styles: Record<string, string>,
): string {
  const lowerKey = key.toLowerCase();
  const num = parseNumericValue(value);

  if (!Number.isNaN(num)) {
    if (lowerKey === "volume") {
      if (num >= 10000) { return styles.statHigh; }
      if (num >= 3000) { return styles.statMedium; }
      return styles.statLow;
    }
    if (lowerKey === "difficulty") {
      if (num <= 30) { return styles.statHigh; }
      if (num <= 60) { return styles.statMedium; }
      return styles.statLow;
    }
  }

  const lower = value.toLowerCase();
  if (lower === "high") { return styles.statHigh; }
  if (lower === "low") { return styles.statLow; }
  return styles.statMedium;
}
