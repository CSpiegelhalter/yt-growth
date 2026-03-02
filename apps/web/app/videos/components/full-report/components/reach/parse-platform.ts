export function getPlatformKey(platform: string): string {
  const lower = platform.toLowerCase();
  if (lower.includes("twitter") || lower.includes(" x") || lower === "x") {
    return "twitter";
  }
  if (lower.includes("reddit")) { return "reddit"; }
  if (lower.includes("youtube")) { return "youtube"; }
  return "";
}
