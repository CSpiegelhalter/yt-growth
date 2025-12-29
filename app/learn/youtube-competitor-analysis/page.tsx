import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { LearnCTA } from "@/components/LearnCTA";
import { learnArticles } from "../articles";
import s from "../style.module.css";

export const metadata: Metadata = {
  title: "YouTube Competitor Analysis: Find What Works in Your Niche",
  description:
    "Learn how to analyze YouTube competitors effectively. Find trending topics, discover outlier videos, and understand what content strategies drive growth in your niche.",
  alternates: {
    canonical: `${BRAND.url}/learn/youtube-competitor-analysis`,
  },
  openGraph: {
    title: "YouTube Competitor Analysis: Complete Guide",
    description:
      "Discover what's working for similar channels and apply those insights to grow your own YouTube channel.",
    url: `${BRAND.url}/learn/youtube-competitor-analysis`,
    type: "article",
  },
};

export default function YouTubeCompetitorAnalysisPage() {
  const currentSlug = "youtube-competitor-analysis";

  return (
    <main className={s.page}>
      {/* Article Navigation */}
      <nav className={s.articleNav}>
        <span className={s.articleNavLabel}>Topics:</span>
        {learnArticles.map((article) => (
          <Link
            key={article.slug}
            href={`/learn/${article.slug}`}
            className={`${s.articleNavLink} ${
              article.slug === currentSlug ? s.articleNavLinkActive : ""
            }`}
          >
            {article.label}
          </Link>
        ))}
      </nav>

      {/* Hero */}
      <header className={s.hero}>
        <nav className={s.breadcrumb}>
          <Link href="/">Home</Link> / <Link href="/learn">Learn</Link> /
          Competitor Analysis
        </nav>
        <h1 className={s.title}>YouTube Competitor Analysis</h1>
        <p className={s.subtitle}>
          Learn what's working for similar channels in your niche and apply
          those insights to accelerate your own growth.
        </p>
      </header>

      {/* Content */}
      <div className={s.content}>
        {/* Why Competitor Analysis */}
        <section className={s.section}>
          <h2 className={s.sectionTitle}>
            <span className={s.sectionIcon}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            Why Competitor Analysis Matters
          </h2>
          <p className={s.sectionText}>
            Competitor analysis isn't about copying—it's about understanding
            what your audience already responds to. Channels in your niche have
            tested ideas, formats, and topics. Learn from their experiments to
            avoid their mistakes and build on their successes.
          </p>
          <p className={s.sectionText}>
            The goal is to identify patterns, not individual videos. What topics
            consistently perform well? What video lengths work? What thumbnail
            styles get clicks? These insights inform your content strategy
            without requiring you to copy anyone.
          </p>
        </section>

        {/* What to Analyze */}
        <section className={s.section}>
          <h2 className={s.sectionTitle}>
            <span className={s.sectionIcon}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </span>
            What to Analyze in Competitor Videos
          </h2>
          <ul className={s.list}>
            <li>
              <strong>Outlier videos:</strong> Videos that perform 2-3x above
              the channel's average indicate resonant topics
            </li>
            <li>
              <strong>Title patterns:</strong> What structures do they use?
              Numbers? Questions? How-tos?
            </li>
            <li>
              <strong>Thumbnail styles:</strong> Colors, faces, text usage—what
              gets clicks in your niche?
            </li>
            <li>
              <strong>Video length:</strong> What duration performs best for
              your topic type?
            </li>
            <li>
              <strong>Posting frequency:</strong> How often do successful
              channels upload?
            </li>
            <li>
              <strong>Hook strategies:</strong> Watch the first 30 seconds of
              top videos—how do they open?
            </li>
          </ul>
        </section>

        {/* Finding Outliers */}
        <section className={s.section}>
          <h2 className={s.sectionTitle}>
            <span className={s.sectionIcon}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </span>
            How to Find Outlier Videos
          </h2>
          <p className={s.sectionText}>
            Outlier videos are the gold mine of competitor analysis. These are
            videos that significantly outperform a channel's average—often
            indicating a topic, format, or approach that resonates strongly with
            audiences.
          </p>
          <ol className={s.numberedList}>
            <li>
              <strong>Calculate the channel's average views</strong> over the
              last 20-30 videos to establish a baseline
            </li>
            <li>
              <strong>Identify videos with 2x+ the average</strong>—these are
              your outliers worth studying
            </li>
            <li>
              <strong>Look for patterns</strong> across multiple outliers:
              common topics, formats, or title structures
            </li>
            <li>
              <strong>Check recency</strong>—recent outliers are more relevant
              than year-old hits
            </li>
            <li>
              <strong>Analyze velocity</strong>—how fast did the video gain
              views? This indicates algorithm favor
            </li>
          </ol>
        </section>

        {/* What NOT to Do */}
        <section className={s.section}>
          <h2 className={s.sectionTitle}>
            <span className={s.sectionIcon}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M15 9l-6 6M9 9l6 6" />
              </svg>
            </span>
            Common Competitor Analysis Mistakes
          </h2>
          <ul className={s.list}>
            <li>
              <strong>Copying titles directly:</strong> Learn the pattern, then
              create your own original version
            </li>
            <li>
              <strong>Only looking at top creators:</strong> Mega-channels play
              by different rules. Study channels similar to your size
            </li>
            <li>
              <strong>Ignoring context:</strong> A video might have gone viral
              for reasons unrelated to its content quality
            </li>
            <li>
              <strong>Focusing on views only:</strong> High views with low
              engagement might indicate clickbait that doesn't convert
            </li>
            <li>
              <strong>Analysis paralysis:</strong> Don't spend so much time
              researching that you never create
            </li>
          </ul>
        </section>

        {/* ChannelBoost CTA */}
        <div className={s.highlight}>
          <p>
            <strong>{BRAND.name} automates competitor tracking</strong> by
            monitoring channels similar to yours and surfacing their
            top-performing videos. Get alerts for outliers, trending topics, and
            emerging opportunities in your niche.
          </p>
        </div>

        {/* FAQ */}
        <section className={s.faqSection}>
          <h2 className={s.faqTitle}>Frequently Asked Questions</h2>
          <div className={s.faqList}>
            <div className={s.faqItem}>
              <h3 className={s.faqQuestion}>
                How do I find competitor channels to analyze?
              </h3>
              <p className={s.faqAnswer}>
                Search for your main topics on YouTube and note which channels
                appear consistently. Look at your &quot;suggested videos&quot;
                sidebar—these are channels YouTube considers similar. Also check
                channels your audience follows.
              </p>
            </div>
            <div className={s.faqItem}>
              <h3 className={s.faqQuestion}>
                What are outlier videos and why do they matter?
              </h3>
              <p className={s.faqAnswer}>
                Outlier videos are videos that perform significantly better than
                a channel's average (usually 2x+). They indicate topics or
                formats that resonate strongly with audiences. Studying outliers
                helps you identify proven opportunities.
              </p>
            </div>
            <div className={s.faqItem}>
              <h3 className={s.faqQuestion}>
                How many competitors should I track?
              </h3>
              <p className={s.faqAnswer}>
                Start with 5-10 channels of varying sizes in your niche. Include
                some at your level and some aspirational channels. Quality of
                analysis matters more than quantity.
              </p>
            </div>
          </div>
        </section>

        {/* Related Links */}
        <nav className={s.related}>
          <h3 className={s.relatedTitle}>Related Topics</h3>
          <div className={s.relatedLinks}>
            <Link href="/learn/youtube-video-ideas" className={s.relatedLink}>
              Video Ideas
            </Link>
            <Link href="/learn/youtube-channel-audit" className={s.relatedLink}>
              Channel Audit
            </Link>
            <Link
              href="/learn/how-to-get-more-subscribers"
              className={s.relatedLink}
            >
              Get More Subscribers
            </Link>
          </div>
        </nav>

        {/* CTA */}
        <LearnCTA
          title="Track Your Competitors Automatically"
          description={`Get real-time insights on what's working in your niche with ${BRAND.name}.`}
          className={s.cta}
        />
      </div>
    </main>
  );
}
