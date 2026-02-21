/**
 * Google OAuth Port — contract for Google OAuth token operations.
 *
 * Ports are pure TypeScript interfaces — no runtime code, no implementations.
 * They define what features need from Google OAuth without specifying the provider.
 *
 * Imported by:
 *   - lib/features/ (to declare dependency on Google OAuth capabilities)
 *   - lib/adapters/google/ (to implement)
 *   - app/ or lib/server/ (to wire adapter to features)
 */

// ─── Token Types ───────────────────────────────────────────

export interface OAuthTokenSet {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  scope?: string;
}

export interface OAuthRefreshResult {
  accessToken: string;
  expiresIn: number;
  scope?: string;
}

// ─── User Info Types ───────────────────────────────────────

export interface OAuthUserInfo {
  /** Google account subject identifier. */
  providerAccountId: string;
  email?: string;
  name?: string;
}

// ─── Analytics Access Types ────────────────────────────────

export interface AnalyticsAccessResult {
  ok: boolean;
}

// ─── Port Interface ────────────────────────────────────────

export interface GoogleOAuthPort {
  // ── Token Exchange ───────────────────────────────────────

  /** Exchange an authorization code for an access/refresh token pair. */
  exchangeCode(code: string, redirectUri: string): Promise<OAuthTokenSet>;

  // ── Token Refresh ────────────────────────────────────────

  /** Use a refresh token to obtain a new access token. */
  refreshToken(refreshToken: string): Promise<OAuthRefreshResult>;

  // ── User Info ────────────────────────────────────────────

  /** Retrieve basic profile information for the authenticated user. */
  getUserInfo(accessToken: string): Promise<OAuthUserInfo>;

  // ── Analytics Verification ───────────────────────────────

  /**
   * Verify that the access token grants YouTube Analytics access
   * for the given channel.
   */
  verifyAnalyticsAccess(
    accessToken: string,
    channelId: string,
  ): Promise<AnalyticsAccessResult>;
}
