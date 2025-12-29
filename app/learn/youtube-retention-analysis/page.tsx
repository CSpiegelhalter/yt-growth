import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { LearnCTA } from "@/components/LearnCTA";
import { learnArticles } from "../articles";
import s from "../style.module.css";

export const metadata: Metadata = {
  title: "YouTube Retention Analysis: How to Keep Viewers Watching",
  description:
    "Master YouTube audience retention analysis. Learn to identify drop-off points, understand viewer behavior, and improve watch time with proven strategies.",
  alternates: {
    canonical: `${BRAND.url}/learn/youtube-retention-analysis`,
  },
  openGraph: {
    title: "YouTube Retention Analysis: Complete Guide",
    description:
      "Learn how to analyze and improve your YouTube audience retention to keep viewers watching longer.",
    url: `${BRAND.url}/learn/youtube-retention-analysis`,
    type: "article",
  },
};

export default function YouTubeRetentionAnalysisPage() {
  const currentSlug = "youtube-retention-analysis";

  return (
    <main className={s.page}>
      {/* Article Navigation */}
      <nav className={s.articleNav}>
        <span className={s.articleNavLabel}>Topics:</span>
        {learnArticles.map((article) => (
          <Link
            key={article.slug}
            href={`/learn/${article.slug}`}
            className={`${s.articleNavLink} ${article.slug === currentSlug ? s.articleNavLinkActive : ""}`}
          >
            {article.label}
          </Link>
        ))}
      </nav>

      {/* Hero */}
      <header className={s.hero}>
        <nav className={s.breadcrumb}>
          <Link href="/">Home</Link> / <Link href="/learn">Learn</Link> / Retention Analysis
        </nav>
        <h1 className={s.title}>YouTube Retention Analysis</h1>
        <p className={s.subtitle}>
          Understand where viewers drop off and learn proven strategies to keep them watching until the end.
        </p>
      </header>

      {/* Content */}
      <div className={s.content}>
        {/* Why Retention Matters */}
        <section className={s.section}>
          <h2 className={s.sectionTitle}>
            <span className={s.sectionIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </span>
            Why Retention Matters for YouTube Growth
          </h2>
          <p className={s.sectionText}>
            Audience retention is the most important metric for YouTube growth. It directly affects how the algorithm promotes your videos. High retention signals to YouTube that viewers find your content valuable, leading to more impressions and suggested video placements.
          </p>
          <div className={s.statsGrid}>
            <div className={s.stat}>
              <div className={s.statValue}>50%+</div>
              <div className={s.statLabel}>Good Retention Target</div>
            </div>
            <div className={s.stat}>
              <div className={s.statValue}>30 sec</div>
              <div className={s.statLabel}>Critical Hook Window</div>
            </div>
            <div className={s.stat}>
              <div className={s.statValue}>2-3x</div>
              <div className={s.statLabel}>Views Increase w/ Better Retention</div>
            </div>
          </div>
        </section>

        {/* Reading Retention Curves */}
        <section className={s.section}>
          <h2 className={s.sectionTitle}>
            <span className={s.sectionIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </span>
            How to Read Retention Curves
          </h2>
          <p className={s.sectionText}>
            YouTube Studio shows your retention graph as a line that starts at 100% and decreases over time. Understanding this curve reveals exactly where and why viewers leave.
          </p>
          <ul className={s.list}>
            <li><strong>Steep initial drop (0-30 sec):</strong> Your hook isn&apos;t compelling enough or doesn&apos;t match your title/thumbnail</li>
            <li><strong>Gradual decline:</strong> Normal behavior—content is engaging but some viewers naturally leave</li>
            <li><strong>Sharp mid-video drops:</strong> Specific section is boring, confusing, or off-topic</li>
            <li><strong>Spikes above 100%:</strong> Viewers are rewatching specific sections—this content resonates</li>
            <li><strong>Cliff at the end:</strong> Normal—viewers leave before end screens</li>
          </ul>
        </section>

        {/* Common Drop-Off Patterns */}
        <section className={s.section}>
          <h2 className={s.sectionTitle}>
            <span className={s.sectionIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
            Common Drop-Off Patterns and Fixes
          </h2>
          <ol className={s.numberedList}>
            <li>
              <strong>The Early Exit (0-30 seconds):</strong> Viewers click away immediately. Fix: Start with a stronger hook—state the value proposition in the first 5 seconds.
            </li>
            <li>
              <strong>The Intro Death (30-60 seconds):</strong> Long intros kill retention. Fix: Cut unnecessary intro footage. Get to the main content faster.
            </li>
            <li>
              <strong>The Mid-Video Cliff:</strong> Sharp drop at a specific point. Fix: Review that section. Is it slow? Off-topic? Cut or restructure it.
            </li>
            <li>
              <strong>The Slow Bleed:</strong> Gradual decline throughout. Fix: Add pattern interrupts—change camera angles, insert B-roll, or use on-screen graphics.
            </li>
            <li>
              <strong>The Premature End:</strong> Big drop before your video ends. Fix: Deliver your main value earlier. Save the &quot;extra&quot; content for the end.
            </li>
          </ol>
        </section>

        {/* Strategies to Improve */}
        <section className={s.section}>
          <h2 className={s.sectionTitle}>
            <span className={s.sectionIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </span>
            Proven Strategies to Improve Retention
          </h2>
          <ul className={s.list}>
            <li><strong>Open with a hook:</strong> State what viewers will learn/see in the first 5 seconds</li>
            <li><strong>Use pattern interrupts:</strong> Change something every 30-60 seconds (camera angle, graphics, music)</li>
            <li><strong>Create open loops:</strong> Tease upcoming content to keep viewers watching for payoff</li>
            <li><strong>Deliver on your promise fast:</strong> Don&apos;t make viewers wait for what they clicked for</li>
            <li><strong>Cut ruthlessly:</strong> If a section doesn&apos;t add value, remove it</li>
            <li><strong>Use chapters:</strong> Help viewers find what they want (and stay longer overall)</li>
          </ul>
        </section>

        {/* ChannelBoost CTA */}
        <div className={s.highlight}>
          <p>
            <strong>{BRAND.name} analyzes your retention curves</strong> and provides AI-powered hypotheses for why viewers leave. Get specific, actionable fixes for each video instead of guessing what went wrong.
          </p>
        </div>

        {/* FAQ */}
        <section className={s.faqSection}>
          <h2 className={s.faqTitle}>Frequently Asked Questions</h2>
          <div className={s.faqList}>
            <div className={s.faqItem}>
              <h3 className={s.faqQuestion}>What&apos;s a good audience retention rate on YouTube?</h3>
              <p className={s.faqAnswer}>
                It varies by video length and niche, but 50%+ average view duration is generally good. For longer videos (15+ min), 40%+ is solid. Focus on improving your own baseline rather than comparing to others.
              </p>
            </div>
            <div className={s.faqItem}>
              <h3 className={s.faqQuestion}>How do I find where viewers drop off?</h3>
              <p className={s.faqAnswer}>
                In YouTube Studio, go to Analytics → Engagement → Audience Retention. The graph shows exactly where viewers leave. Look for steep drops and investigate what&apos;s happening at those timestamps.
              </p>
            </div>
            <div className={s.faqItem}>
              <h3 className={s.faqQuestion}>Does video length affect retention?</h3>
              <p className={s.faqAnswer}>
                Yes. Longer videos typically have lower percentage retention but can still have high absolute watch time. Make your video as long as it needs to be—no longer. Cut filler content ruthlessly.
              </p>
            </div>
          </div>
        </section>

        {/* Related Links */}
        <nav className={s.related}>
          <h3 className={s.relatedTitle}>Related Topics</h3>
          <div className={s.relatedLinks}>
            <Link href="/learn/youtube-channel-audit" className={s.relatedLink}>
              Channel Audit
            </Link>
            <Link href="/learn/youtube-video-ideas" className={s.relatedLink}>
              Video Ideas
            </Link>
            <Link href="/learn/how-to-get-more-subscribers" className={s.relatedLink}>
              Get More Subscribers
            </Link>
          </div>
        </nav>

        {/* CTA */}
        <LearnCTA
          title="Improve Your Retention Today"
          description={`Get AI-powered analysis of your retention curves with ${BRAND.name}.`}
          className={s.cta}
        />
      </div>
    </main>
  );
}

