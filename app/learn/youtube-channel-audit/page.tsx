import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { LearnStaticCTA, TableOfContents, ArticleMeta } from "@/components/learn";
import {
  LEARN_ARTICLES,
  learnArticles,
  generateLearnArticleSchema,
  generateFaqSchema,
  getRelatedArticles,
} from "../articles";
import { generateBreadcrumbSchema } from "@/lib/seo";
import s from "../style.module.css";

const ARTICLE = LEARN_ARTICLES["youtube-channel-audit"];

export const metadata: Metadata = {
  title: ARTICLE.title,
  description: ARTICLE.metaDescription,
  keywords: [...ARTICLE.keywords],
  alternates: {
    canonical: `${BRAND.url}/learn/${ARTICLE.slug}`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: ARTICLE.title,
    description: ARTICLE.metaDescription,
    url: `${BRAND.url}/learn/${ARTICLE.slug}`,
    type: "article",
    publishedTime: ARTICLE.datePublished,
    modifiedTime: ARTICLE.dateModified,
    authors: [`${BRAND.name} Team`],
  },
  twitter: {
    card: "summary_large_image",
    title: ARTICLE.shortTitle,
    description: ARTICLE.metaDescription,
  },
};

const articleSchema = generateLearnArticleSchema(ARTICLE);
const faqSchema = generateFaqSchema(ARTICLE.faqs);
const breadcrumbSchema = generateBreadcrumbSchema([
  { name: "Home", url: BRAND.url },
  { name: "Learn", url: `${BRAND.url}/learn` },
  { name: ARTICLE.shortTitle, url: `${BRAND.url}/learn/${ARTICLE.slug}` },
]);

export default function YouTubeChannelAuditPage() {
  const relatedArticles = getRelatedArticles(ARTICLE.slug);

  return (
    <main className={s.page}>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Article Navigation */}
      <nav className={s.articleNav} aria-label="Learn topics">
        <span className={s.articleNavLabel}>Topics:</span>
        {learnArticles.map((article) => (
          <Link
            key={article.slug}
            href={`/learn/${article.slug}`}
            className={`${s.articleNavLink} ${
              article.slug === ARTICLE.slug ? s.articleNavLinkActive : ""
            }`}
          >
            {article.label}
          </Link>
        ))}
      </nav>

      {/* Hero */}
      <header className={s.hero}>
        <nav className={s.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Home</Link> / <Link href="/learn">Learn</Link> /{" "}
          {ARTICLE.shortTitle}
        </nav>
        <h1 className={s.title}>YouTube Channel Audit: How to Analyze Your Channel</h1>
        <p className={s.subtitle}>
          How to analyze your channel's performance and identify growth
          opportunities with data-driven insights.
        </p>
        <ArticleMeta
          dateModified={ARTICLE.dateModified}
          readingTime={ARTICLE.readingTime}
        />
      </header>

      {/* Table of Contents */}
      <TableOfContents items={ARTICLE.toc} />

      {/* Content */}
      <article className={s.content}>
        {/* What is a Channel Audit */}
        <section id="what-is-audit" className={s.section}>
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

        {/* Key Areas to Analyze */}
        <section id="key-areas" className={s.section}>
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
        <section id="how-to-perform" className={s.section}>
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
        <section id="common-issues" className={s.section}>
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
        <section id="faq" className={s.faqSection}>
          <h2 className={s.faqTitle}>Frequently Asked Questions</h2>
          <div className={s.faqList}>
            {ARTICLE.faqs.map((faq, index) => (
              <div key={index} className={s.faqItem}>
                <h3 className={s.faqQuestion}>{faq.question}</h3>
                <p className={s.faqAnswer}>{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Related Articles - Full Cross-Linking */}
        <nav className={s.related} aria-label="Related articles">
          <h3 className={s.relatedTitle}>Continue Learning</h3>
          <div className={s.relatedLinks}>
            {relatedArticles.map((article) => (
              <Link
                key={article.slug}
                href={`/learn/${article.slug}`}
                className={s.relatedLink}
              >
                {article.title}
              </Link>
            ))}
          </div>
        </nav>

        {/* CTA */}
        <LearnStaticCTA
          title="Ready to Audit Your Channel?"
          description={`Get automated insights and personalized recommendations with ${BRAND.name}.`}
        />
      </article>
    </main>
  );
}
