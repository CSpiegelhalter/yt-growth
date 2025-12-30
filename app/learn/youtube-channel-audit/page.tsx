import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { LearnCTA } from "@/components/LearnCTA";
import { learnArticles } from "../articles";
import { generateArticleSchema, generateBreadcrumbSchema } from "@/lib/seo";
import s from "../style.module.css";

const ARTICLE = {
  slug: "youtube-channel-audit",
  title: "YouTube Channel Audit: How to Analyze Your Channel Performance",
  description:
    "Learn how to perform a comprehensive YouTube channel audit. Identify underperforming content, analyze growth patterns, and get actionable insights to improve your channel.",
};

export const metadata: Metadata = {
  title: ARTICLE.title,
  description: ARTICLE.description,
  alternates: {
    canonical: `${BRAND.url}/learn/${ARTICLE.slug}`,
  },
  openGraph: {
    title: "YouTube Channel Audit: Complete Guide for Creators",
    description:
      "Learn how to audit your YouTube channel performance and identify growth opportunities.",
    url: `${BRAND.url}/learn/${ARTICLE.slug}`,
    type: "article",
  },
};

const articleSchema = generateArticleSchema(ARTICLE);
const breadcrumbSchema = generateBreadcrumbSchema([
  { name: "Home", url: BRAND.url },
  { name: "Learn", url: `${BRAND.url}/learn` },
  { name: "Channel Audit", url: `${BRAND.url}/learn/${ARTICLE.slug}` },
]);

export default function YouTubeChannelAuditPage() {
  const currentSlug = ARTICLE.slug;

  return (
    <main className={s.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
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
          Channel Audit
        </nav>
        <h1 className={s.title}>YouTube Channel Audit</h1>
        <p className={s.subtitle}>
          How to analyze your channel's performance and identify growth
          opportunities with data-driven insights.
        </p>
      </header>

      {/* Content */}
      <div className={s.content}>
        {/* What is a Channel Audit */}
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
                <path d="M12 16v-4M12 8h.01" />
              </svg>
            </span>
            What is a YouTube Channel Audit?
          </h2>
          <p className={s.sectionText}>
            A YouTube channel audit is a comprehensive analysis of your
            channel's performance, content strategy, and growth patterns. It
            examines what's working, what's not, and identifies specific
            opportunities to improve.
          </p>
          <p className={s.sectionText}>
            Unlike surface-level metrics, a proper audit goes deeper—looking at
            retention patterns, subscriber conversion rates, content gaps, and
            how your channel compares to similar creators in your niche.
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
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </span>
            Key Areas to Analyze
          </h2>
          <ul className={s.list}>
            <li>
              <strong>Content Performance:</strong> Which videos get views vs.
              which don't? Are there patterns in your top performers?
            </li>
            <li>
              <strong>Audience Retention:</strong> Where do viewers drop off?
              Are your hooks working? Is pacing an issue?
            </li>
            <li>
              <strong>Subscriber Conversion:</strong> Which videos turn viewers
              into subscribers? What makes them convert?
            </li>
            <li>
              <strong>Click-Through Rate (CTR):</strong> Are your thumbnails and
              titles compelling enough to earn clicks?
            </li>
            <li>
              <strong>Traffic Sources:</strong> Where do your views come from?
              Search, suggested, browse, or external?
            </li>
            <li>
              <strong>Posting Consistency:</strong> How does your upload
              frequency affect performance?
            </li>
          </ul>
        </section>

        {/* How to Perform an Audit */}
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
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </span>
            How to Perform a Channel Audit
          </h2>
          <ol className={s.numberedList}>
            <li>
              <strong>Export your analytics data</strong> from YouTube Studio
              for the last 90 days to get a meaningful sample size.
            </li>
            <li>
              <strong>Identify your top 10%</strong> of videos by views and
              analyze what they have in common (topic, format, length, thumbnail
              style).
            </li>
            <li>
              <strong>Analyze your bottom 10%</strong> to understand what didn't
              work and avoid repeating those patterns.
            </li>
            <li>
              <strong>Check retention curves</strong> for your recent videos.
              Note where the biggest drop-offs occur.
            </li>
            <li>
              <strong>Compare subscriber conversion</strong> rates across
              videos. Which ones drive the most subscriptions per 1K views?
            </li>
            <li>
              <strong>Review your CTR trends</strong> over time. Is your
              packaging (titles/thumbnails) improving or declining?
            </li>
          </ol>
        </section>

        {/* Common Issues */}
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
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
            Common Issues Revealed by Audits
          </h2>
          <ul className={s.list}>
            <li>
              <strong>Weak hooks:</strong> High drop-off in the first 30 seconds
              means your intro isn't compelling enough
            </li>
            <li>
              <strong>Title/thumbnail mismatch:</strong> High CTR but low
              retention suggests you're overpromising
            </li>
            <li>
              <strong>Inconsistent content:</strong> Topic variety confuses the
              algorithm and your audience
            </li>
            <li>
              <strong>Poor pacing:</strong> Mid-video drop-offs indicate slow
              sections or filler content
            </li>
            <li>
              <strong>Missing CTAs:</strong> Low subscriber conversion despite
              good views means you're not asking
            </li>
          </ul>
        </section>

        {/* ChannelBoost CTA */}
        <div className={s.highlight}>
          <p>
            <strong>{BRAND.name} automates channel audits</strong> by analyzing
            your YouTube analytics and providing personalized insights. See
            exactly what's working, what needs improvement, and get specific
            recommendations to grow faster.
          </p>
        </div>

        {/* FAQ */}
        <section className={s.faqSection}>
          <h2 className={s.faqTitle}>Frequently Asked Questions</h2>
          <div className={s.faqList}>
            <div className={s.faqItem}>
              <h3 className={s.faqQuestion}>
                How often should I audit my channel?
              </h3>
              <p className={s.faqAnswer}>
                A comprehensive audit every 3-6 months is ideal. For active
                channels, monthly check-ins on key metrics help catch issues
                early. Tools like {BRAND.name} provide ongoing analysis so you
                always know where you stand.
              </p>
            </div>
            <div className={s.faqItem}>
              <h3 className={s.faqQuestion}>
                What metrics matter most in a channel audit?
              </h3>
              <p className={s.faqAnswer}>
                Focus on audience retention (especially the first 30 seconds),
                subscriber conversion rate per video, and click-through rate.
                These directly impact how YouTube promotes your content.
              </p>
            </div>
            <div className={s.faqItem}>
              <h3 className={s.faqQuestion}>
                Can I audit my channel without special tools?
              </h3>
              <p className={s.faqAnswer}>
                Yes, YouTube Studio provides the raw data. However, identifying
                patterns across many videos and getting actionable insights is
                much faster with dedicated tools that automate the analysis.
              </p>
            </div>
          </div>
          {/* FAQ Schema */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: [
                  {
                    "@type": "Question",
                    name: "How often should I audit my channel?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "A comprehensive audit every 3-6 months is ideal. For active channels, monthly check-ins on key metrics help catch issues early.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "What metrics matter most in a channel audit?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Focus on audience retention, subscriber conversion rate per video, and click-through rate.",
                    },
                  },
                ],
              }),
            }}
          />
        </section>

        {/* Related Links */}
        <nav className={s.related}>
          <h3 className={s.relatedTitle}>Related Topics</h3>
          <div className={s.relatedLinks}>
            <Link
              href="/learn/youtube-retention-analysis"
              className={s.relatedLink}
            >
              Retention Analysis
            </Link>
            <Link
              href="/learn/how-to-get-more-subscribers"
              className={s.relatedLink}
            >
              Get More Subscribers
            </Link>
            <Link
              href="/learn/youtube-competitor-analysis"
              className={s.relatedLink}
            >
              Competitor Analysis
            </Link>
          </div>
        </nav>

        {/* CTA */}
        <LearnCTA
          title="Ready to Audit Your Channel?"
          description={`Get automated insights and personalized recommendations with ${BRAND.name}.`}
          className={s.cta}
        />
      </div>
    </main>
  );
}
