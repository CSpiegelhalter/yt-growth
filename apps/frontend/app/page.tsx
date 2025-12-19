import type { Metadata } from "next";
import s from "./home.module.css";
import { HeroCTAs } from "@/components/HeroCTAs";

export const metadata: Metadata = {
  title: "YouTube Growth Consultant - Grow Your Channel Faster",
  description:
    "Stop guessing what video to make next. Get data-driven content ideas, retention insights, and subscriber analysis to grow your YouTube channel 10x faster.",
};

export default function HomePage() {
  return (
    <main className={s.page}>
      {/* Hero Section */}
      <section className={s.hero}>
        <div className={s.badge}>For YouTube Creators</div>
        <h1 className={s.title}>
          Stop Guessing What
          <br />
          <span className={s.highlight}>Video to Make Next</span>
        </h1>
        <p className={s.subtitle}>
          Data-driven video ideas, retention insights, and subscriber analysis.
          Grow your channel 10x faster with smarter decisions.
        </p>
        {/* Auth-aware CTAs */}
        <HeroCTAs />
      </section>

      {/* Features Grid */}
      <section className={s.features}>
        <div className={s.feature}>
          <div className={s.featureIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
          </div>
          <h3 className={s.featureTitle}>Idea Engine</h3>
          <p className={s.featureDesc}>
            Get content ideas based on what&apos;s working in your niche, with 
            title options, thumbnail guidance, and hooks that convert.
          </p>
        </div>

        <div className={s.feature}>
          <div className={s.featureIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </div>
          <h3 className={s.featureTitle}>Video Analysis</h3>
          <p className={s.featureDesc}>
            Discover exactly where viewers leave and get clear
            hypotheses with actionable fixes.
          </p>
        </div>

        <div className={s.feature}>
          <div className={s.featureIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </div>
          <h3 className={s.featureTitle}>Subscriber Drivers</h3>
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
              Receive personalized recommendations tailored to your channel&apos;s
              performance.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section - Also auth-aware */}
      <section className={s.ctaSection}>
        <h2 className={s.ctaTitle}>Ready to Grow Your Channel?</h2>
        <p className={s.ctaSubtitle}>
          Join thousands of creators using data-driven strategies.
        </p>
        <HeroCTAs />
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
