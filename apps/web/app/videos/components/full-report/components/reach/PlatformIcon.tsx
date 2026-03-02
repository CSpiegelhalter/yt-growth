import { getPlatformKey } from "./parse-platform";

type PlatformIconProps = {
  platform: string;
  size?: number;
};

const PLATFORM_SVG: Record<string, string> = {
  reddit: "/socials/reddit.svg",
  twitter: "/socials/x.svg",
  x: "/socials/x.svg",
  youtube: "/socials/youtube.svg",
};

export function PlatformIcon({ platform, size = 16 }: PlatformIconProps) {
  const key = getPlatformKey(platform);
  const src = PLATFORM_SVG[key];

  if (src) {
    return <img src={src} width={size} height={size} alt="" />;
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}
