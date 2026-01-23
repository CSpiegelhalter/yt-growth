import Link from "next/link";
import { BRAND } from "@/lib/brand";
import s from "./style.module.css";

/**
 * LoggedOutDashboardPreview - Preview page for unauthenticated users
 *
 * Renders a conversion-focused landing page that:
 * - Shows what the dashboard offers
 * - Has clear CTAs to login/signup with redirect back to dashboard
 * - Includes preview cards, how-it-works, and FAQ
 * - Is fully server-rendered (no client JS required)
 */
export function LoggedOutDashboardPreview() {
  const loginUrl = "/auth/login?redirect=/dashboard";
  const signupUrl = "/auth/signup?redirect=/dashboard";

  return (
    <main className={s.page}>
      {/* Hero Section */}
      <section className={s.hero}>
        <h1 className={s.heroTitle}>Your {BRAND.name} Dashboard</h1>
        <p className={s.heroSubtitle}>
          Track your channel performance, analyze video metrics, and get
          AI-powered content ideas — all in one place.
        </p>
        <div className={s.heroCtas}>
          <Link
            href={loginUrl}
            className={s.primaryCta}
            data-cta="dashboard-preview-login"
          >
            Sign in to your dashboard
          </Link>
          <Link
            href={signupUrl}
            className={s.secondaryCta}
            data-cta="dashboard-preview-signup"
          >
            Create free account
          </Link>
        </div>
      </section>

      {/* Preview Cards */}
      <section className={s.previewSection}>
        <h2 className={s.sectionTitle}>What you&apos;ll see inside</h2>
        <div className={s.previewGrid}>
          <PreviewCard
            icon={<ChannelHealthIcon />}
            title="Channel Health"
            description="See your subscriber growth, view trends, and engagement metrics at a glance."
          />
          <PreviewCard
            icon={<RecentVideosIcon />}
            title="Recent Videos"
            description="Track performance of your latest uploads with views, likes, and retention data."
          />
          <PreviewCard
            icon={<IdeasIcon />}
            title="Ideas Queue"
            description="AI-generated video ideas based on what's working in your niche."
          />
          <PreviewCard
            icon={<CompetitorIcon />}
            title="Competitor Snapshot"
            description="Monitor top performers in your niche and discover trending topics."
          />
        </div>
      </section>

      {/* How It Works */}
      <section className={s.howItWorks}>
        <h2 className={s.sectionTitle}>Get started in 3 steps</h2>
        <div className={s.stepsGrid}>
          <Step
            number={1}
            title="Connect your channel"
            description="Sign in with Google and connect your YouTube channel in seconds."
          />
          <Step
            number={2}
            title="See your insights"
            description="Instantly see analytics, performance trends, and growth opportunities."
          />
          <Step
            number={3}
            title="Grow faster"
            description="Use AI recommendations to create better content and attract more subscribers."
          />
        </div>
      </section>

      {/* Social Proof / Testimonial Strip */}
      <section className={s.socialProof}>
        <div className={s.testimonial}>
          <blockquote className={s.testimonialQuote}>
            &ldquo;{BRAND.name} helped me understand exactly which videos drive
            subscribers. My channel grew 40% in 3 months.&rdquo;
          </blockquote>
          <p className={s.testimonialAuthor}>— YouTube creator, 50K subscribers</p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={s.faqSection}>
        <h2 className={s.sectionTitle}>Frequently Asked Questions</h2>
        <div className={s.faqList}>
          <FaqItem
            question="Is ChannelBoost free to use?"
            answer="Yes! You can connect one channel for free and access basic analytics. Upgrade to Pro for unlimited video analysis, AI-powered ideas, and more advanced features."
          />
          <FaqItem
            question="How do I connect my YouTube channel?"
            answer="Simply sign in with your Google account and authorize ChannelBoost to read your YouTube analytics. We only request read-only access and never post on your behalf."
          />
          <FaqItem
            question="What data do you collect?"
            answer="We only access your YouTube analytics data (views, subscribers, watch time, etc.) to provide insights. We never share your data with third parties or use it for advertising."
          />
          <FaqItem
            question="Can I use this for multiple channels?"
            answer="Free accounts can connect 1 channel. Pro accounts can connect up to 3 channels and analyze unlimited competitor videos."
          />
          <FaqItem
            question="How are video ideas generated?"
            answer="Our AI analyzes what's working in your niche — trending topics, successful formats, and gaps in existing content — to suggest video ideas tailored to your channel."
          />
        </div>
      </section>

      {/* Final CTA */}
      <section className={s.finalCta}>
        <h2 className={s.finalCtaTitle}>Ready to grow your channel?</h2>
        <p className={s.finalCtaSubtitle}>
          Join thousands of creators using data to make better content.
        </p>
        <div className={s.heroCtas}>
          <Link
            href={signupUrl}
            className={s.primaryCta}
            data-cta="dashboard-preview-signup-bottom"
          >
            Get started free
          </Link>
          <Link
            href={loginUrl}
            className={s.secondaryCta}
            data-cta="dashboard-preview-login-bottom"
          >
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}

/* ---------- Subcomponents ---------- */

function PreviewCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className={s.previewCard}>
      <div className={s.previewCardIcon}>{icon}</div>
      <h3 className={s.previewCardTitle}>{title}</h3>
      <p className={s.previewCardDesc}>{description}</p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className={s.step}>
      <div className={s.stepNumber}>{number}</div>
      <h3 className={s.stepTitle}>{title}</h3>
      <p className={s.stepDesc}>{description}</p>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className={s.faqItem}>
      <summary className={s.faqQuestion}>
        <span className={s.faqQuestionText}>{question}</span>
        <svg
          className={s.faqChevron}
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <p className={s.faqAnswer}>{answer}</p>
    </details>
  );
}

/* ---------- Icons ---------- */

function ChannelHealthIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function RecentVideosIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M10 9l5 3-5 3V9z" />
    </svg>
  );
}

function IdeasIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M9 18h6M10 22h4M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 01-1 1H9a1 1 0 01-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z" />
    </svg>
  );
}

function CompetitorIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16l4-4-4-4M8 12h8" />
    </svg>
  );
}
