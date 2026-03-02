export function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `0:00 - ${mins}:${String(secs).padStart(2, "0")}`;
}
