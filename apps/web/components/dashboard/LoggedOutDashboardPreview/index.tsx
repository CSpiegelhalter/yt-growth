import Link from "next/link";
import s from "./style.module.css";

/**
 * LoggedOutDashboardPreview - Dashboard view for unauthenticated users
 *
 * Renders the standard dashboard layout shell with:
 * - Same page structure and header as the authenticated dashboard
 * - A centered sign-in CTA card with clear value proposition
 * - Preview cards showing what users will unlock (blurred/disabled)
 * - No redirect, no harsh "sign in wall" - feels like part of the product
 */
export function LoggedOutDashboardPreview() {
  const loginUrl = "/auth/login?redirect=/dashboard";
  const signupUrl = "/auth/signup?redirect=/dashboard";

  return (
    <main className={s.page}>
      {/* Header - matches authenticated dashboard */}
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Your Videos</h1>
          <p className={s.subtitle}>Connect a channel to see your videos</p>
        </div>
      </div>

      {/* Main Content */}
      <div className={s.content}>
        {/* Sign-in CTA Card - Primary action */}
        <section className={s.ctaSection}>
          <div className={s.ctaCard}>
            <div className={s.ctaIcon}>
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </div>
            <h2 className={s.ctaTitle}>Sign in to analyze your channel</h2>
            <p className={s.ctaDesc}>
              Get insights on your videos, discover what drives subscribers, and
              generate content ideas tailored to your niche.
            </p>
            <div className={s.ctaActions}>
              <Link
                href={loginUrl}
                className={s.primaryBtn}
                data-cta="dashboard-signin"
              >
                Sign in
              </Link>
              <Link
                href={signupUrl}
                className={s.secondaryBtn}
                data-cta="dashboard-signup"
              >
                Create account
              </Link>
            </div>
          </div>
        </section>

        {/* Preview Section - Show what users will unlock */}
        <section className={s.previewSection}>
          <h3 className={s.previewTitle}>What you'll unlock</h3>
          <div className={s.previewGrid}>
            {/* Channel Profile Preview */}
            <div className={s.previewCard}>
              <div className={s.previewCardHeader}>
                <svg
                  className={s.previewCardIcon}
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className={s.previewCardLabel}>Channel Profile</span>
              </div>
              <div className={s.previewCardBody}>
                <div className={s.previewBlurredText}>
                  <span className={s.blurredLine} />
                  <span className={s.blurredLineShort} />
                </div>
                <div className={s.previewPills}>
                  <span className={s.previewPill} />
                  <span className={s.previewPill} />
                  <span className={s.previewPill} />
                </div>
              </div>
            </div>

            {/* Video Performance Preview */}
            <div className={s.previewCard}>
              <div className={s.previewCardHeader}>
                <svg
                  className={s.previewCardIcon}
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M10 9l5 3-5 3V9z" />
                </svg>
                <span className={s.previewCardLabel}>Video Analytics</span>
              </div>
              <div className={s.previewCardBody}>
                <div className={s.previewStats}>
                  <div className={s.previewStat}>
                    <span className={s.blurredValue} />
                    <span className={s.previewStatLabel}>Views</span>
                  </div>
                  <div className={s.previewStat}>
                    <span className={s.blurredValue} />
                    <span className={s.previewStatLabel}>Retention</span>
                  </div>
                  <div className={s.previewStat}>
                    <span className={s.blurredValue} />
                    <span className={s.previewStatLabel}>CTR</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ideas Preview */}
            <div className={s.previewCard}>
              <div className={s.previewCardHeader}>
                <svg
                  className={s.previewCardIcon}
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M9 18h6M10 22h4M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 01-1 1H9a1 1 0 01-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z" />
                </svg>
                <span className={s.previewCardLabel}>AI Ideas</span>
              </div>
              <div className={s.previewCardBody}>
                <div className={s.previewIdeas}>
                  <div className={s.previewIdea}>
                    <span className={s.blurredLineMedium} />
                  </div>
                  <div className={s.previewIdea}>
                    <span className={s.blurredLineMedium} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mock Video Grid - Disabled state */}
        <section className={s.mockVideosSection}>
          <div className={s.mockVideosHeader}>
            <span className={s.mockVideosLabel}>Recent uploads</span>
            <span className={s.mockVideosHint}>Sign in to view</span>
          </div>
          <div className={s.mockVideoGrid}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={s.mockVideoCard}>
                <div className={s.mockThumb}>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M10 9l5 3-5 3V9z" />
                  </svg>
                </div>
                <div className={s.mockContent}>
                  <div className={s.blurredLineMedium} />
                  <div className={s.blurredLineShort} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
