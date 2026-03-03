/**
 * Constants for the keyword research feature.
 */

export const DATABASE_OPTIONS = [
  { value: "us", label: "United States" },
  { value: "uk", label: "United Kingdom" },
  { value: "ca", label: "Canada" },
  { value: "au", label: "Australia" },
  { value: "de", label: "Germany" },
  { value: "fr", label: "France" },
  { value: "es", label: "Spain" },
  { value: "it", label: "Italy" },
  { value: "br", label: "Brazil" },
  { value: "mx", label: "Mexico" },
  { value: "in", label: "India" },
  { value: "jp", label: "Japan" },
] as const;

export const MAX_KEYWORDS = 10;

export const POLL_INTERVAL_MS = 2000;
export const MAX_POLL_ATTEMPTS = 15;

export const TRENDS_POLL_INTERVAL_MS = 3000;
export const TRENDS_MAX_POLL_ATTEMPTS = 20;
