/**
 * YouTube API Error Handling
 *
 * Normalized error types and detection utilities.
 */

/**
 * Normalized YouTube API error for consistent handling.
 */
export class YouTubeApiError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.name = "YouTubeApiError";
    this.code = code;
    this.status = status;
  }
}

/**
 * Normalize any error to a consistent shape.
 */
export function normalizeYouTubeError(err: unknown): {
  message: string;
  code?: string;
  status?: number;
} {
  if (err instanceof YouTubeApiError) {
    return {
      message: err.message,
      code: err.code,
      status: err.status,
    };
  }

  if (err instanceof Error) {
    // Try to extract status from error message pattern: "google_api_error_XXX: ..."
    const statusMatch = err.message.match(/google_api_error_(\d+):/);
    const status = statusMatch ? parseInt(statusMatch[1], 10) : undefined;

    return {
      message: err.message,
      status,
    };
  }

  return {
    message: String(err),
  };
}

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
