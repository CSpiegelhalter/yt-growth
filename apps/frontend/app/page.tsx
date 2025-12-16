import Link from "next/link";
import type { Metadata } from "next";
import s from "./home.module.css";

export const metadata: Metadata = {
  title: "YouTube Growth Consultant - AI-Powered Channel Growth",
  description:
    "Stop guessing what video to make next. Get AI-powered content plans, retention analysis, and subscriber insights to grow your YouTube channel 10x faster.",
};

export default function HomePage() {
  return (
    <main className={s.page}>
      {/* Hero Section */}
      <section className={s.hero}>
        <div className={s.badge}>🚀 For YouTube Creators</div>
        <h1 className={s.title}>
          Stop Guessing What
          <br />
          <span className={s.highlight}>Video to Make Next</span>
        </h1>
        <p className={s.subtitle}>
          AI-powered content plans, retention analysis, and subscriber insights.
          Grow your channel 10x faster with data-driven decisions.
        </p>
        <div className={s.ctas}>
          <Link href="/auth/signup" className={s.btnPrimary}>
            Start Free Trial
          </Link>
          <Link href="/auth/login" className={s.btnSecondary}>
            Sign In
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className={s.features}>
        <div className={s.feature}>
          <div className={s.featureIcon}>📋</div>
          <h3 className={s.featureTitle}>Decide-for-Me Plans</h3>
          <p className={s.featureDesc}>
            Get AI-generated content plans with topic ideas, title options,
            thumbnail guidance, and a week-by-week checklist.
          </p>
        </div>

        <div className={s.feature}>
          <div className={s.featureIcon}>📉</div>
          <h3 className={s.featureTitle}>Retention Cliff Finder</h3>
          <p className={s.featureDesc}>
            Discover exactly where viewers drop off and get AI-powered
            hypotheses with actionable fixes.
          </p>
        </div>

        <div className={s.feature}>
          <div className={s.featureIcon}>🧲</div>
          <h3 className={s.featureTitle}>Subscriber Magnet Audit</h3>
          <p className={s.featureDesc}>
            Find your best-converting videos and learn the patterns that turn
            viewers into loyal subscribers.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className={s.howItWorks}>
        <h2 className={s.sectionTitle}>How It Works</h2>
        <div className={s.steps}>
          <div className={s.step}>
            <div className={s.stepNumber}>1</div>
            <h4 className={s.stepTitle}>Connect YouTube</h4>
            <p className={s.stepDesc}>
              Securely link your channel with Google OAuth. We only request
              read-only access.
            </p>
          </div>

          <div className={s.step}>
            <div className={s.stepNumber}>2</div>
            <h4 className={s.stepTitle}>Analyze Your Data</h4>
            <p className={s.stepDesc}>
              We fetch your video metrics, retention curves, and subscriber
              patterns.
            </p>
          </div>

          <div className={s.step}>
            <div className={s.stepNumber}>3</div>
            <h4 className={s.stepTitle}>Get Actionable Insights</h4>
            <p className={s.stepDesc}>
              Receive AI-powered recommendations tailored to your channel&apos;s
              performance.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={s.ctaSection}>
        <h2 className={s.ctaTitle}>Ready to Grow Your Channel?</h2>
        <p className={s.ctaSubtitle}>
          Join thousands of creators using data-driven strategies.
        </p>
        <Link href="/auth/signup" className={s.btnPrimary}>
          Get Started Free
        </Link>
      </section>

      {/* Footer */}
      <footer className={s.footer}>
        <p>© {new Date().getFullYear()} YouTube Growth Consultant</p>
        <div className={s.footerLinks}>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </div>
      </footer>
    </main>
  );
}
