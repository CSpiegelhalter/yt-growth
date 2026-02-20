/**
 * YouTube API Error Handling
 *
 * Normalized error types and detection utilities.
 */

/**
 * Check if error indicates comments are disabled on a video.
 */
export function isCommentsDisabled(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.includes("commentsDisabled") ||
    message.includes("disabled comments")
  );
}

/**
 * Check if error indicates YouTube API quota has been exceeded.
 */
export function isQuotaExceeded(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return message.includes("quotaExceeded");
}

/**
 * Check if error indicates insufficient OAuth scopes.
 */
export function isInsufficientScope(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.includes("ACCESS_TOKEN_SCOPE_INSUFFICIENT") ||
    message.includes("insufficientPermissions") ||
    message.includes("insufficient authentication scopes")
  );
}

/**
 * Error message for missing YouTube comments scope.
 * Preserved exactly as used in fetchVideoComments.
 */
export const MISSING_COMMENTS_SCOPE_ERROR =
  "Google account is missing the YouTube comments scope. Reconnect Google (it will prompt for updated permissions), then try again.";
