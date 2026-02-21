/**
 * Shared logic for auth form pages.
 */

/**
 * Determine whether the verification/demo login button should appear.
 * Used by both LoginForm and SignupForm.
 *
 * Shows when:
 * 1. In development mode (for local testing), OR
 * 2. NEXT_PUBLIC_ENABLE_OAUTH_VERIFY_BUTTON env var is "true", OR
 * 3. URL has ?verify=1 query param (for ad-hoc verification demos)
 */
export function shouldShowVerifyButton(sp: URLSearchParams): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_ENABLE_OAUTH_VERIFY_BUTTON === "true" ||
    sp.get("verify") === "1"
  );
}

/**
 * Extract and validate email + password from a form submission.
 * Returns an error message string if validation fails, null otherwise.
 */
export function validateEmailPassword(form: FormData): {
  email: string;
  password: string;
  error: string | null;
} {
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");

  if (!email) return { email, password, error: "Please enter your email address" };
  if (!password) return { email, password, error: "Please enter your password" };

  return { email, password, error: null };
}
