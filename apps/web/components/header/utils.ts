/**
 * Helper utilities for the Header component.
 */

export function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function truncateEmail(email: string): string {
  if (!email) return "";
  const atIndex = email.indexOf("@");
  if (atIndex <= 0) return email;
  const localPart = email.substring(0, atIndex);
  if (localPart.length <= 8) return localPart;
  return localPart.substring(0, 8) + "…";
}

export function isChannelScopedPath(pathname: string): boolean {
  // Pages where data is scoped to the "active channel" and should respond to channel changes.
  if (pathname === "/dashboard") return true;
  if (pathname === "/ideas") return true;
  if (pathname === "/goals") return true;
  if (pathname === "/subscriber-insights") return true;
  if (pathname === "/competitors") return true;
  if (pathname.startsWith("/video/")) return true;
  if (pathname.startsWith("/competitors/video/")) return true;
  return false;
}

export function isVideoPath(pathname: string): boolean {
  // Video detail pages - should redirect to dashboard on channel switch.
  return (
    pathname.startsWith("/video/") || pathname.startsWith("/competitors/video/")
  );
}

export function withChannelId(href: string, channelId: string | null): string {
  if (!channelId) return href;
  // Only append channelId for channel-scoped pages.
  if (!isChannelScopedPath(href)) return href;

  const [path, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  params.set("channelId", channelId);
  return `${path}?${params.toString()}`;
}
