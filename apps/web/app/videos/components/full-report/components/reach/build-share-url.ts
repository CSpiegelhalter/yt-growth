import { getPlatformKey } from "./parse-platform";

export function buildShareUrl(
  platform: string,
  target: string,
  draftText: string,
): string | null {
  const key = getPlatformKey(platform);

  if (key === "twitter") {
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(draftText)}`;
  }

  if (key === "reddit" && target) {
    const sub = target.startsWith("r/") ? target : `r/${target}`;
    return `https://reddit.com/${sub}`;
  }

  return null;
}
