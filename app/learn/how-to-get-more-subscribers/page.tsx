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

const ARTICLE = LEARN_ARTICLES["how-to-get-more-subscribers"];

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

export default function HowToGetMoreSubscribersPage() {
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
        <h1 className={s.title}>How to Get More YouTube Subscribers</h1>
        <p className={s.subtitle}>
          Proven, data-driven strategies to turn viewers into loyal subscribers
          and grow your channel faster.
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
        {/* Why Subscribers Matter */}
        <section id="why-subscribers-matter" className={s.section}>
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
                <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            Why Subscribers Matter for YouTube Growth
          </h2>
          <p className={s.sectionText}>
            Subscribers are more than a vanity metric. They're your built-in
            audience—people who've signaled they want to see more from you.
            Subscribers get notified of new uploads and are more likely to
            watch, like, and comment, all of which boost your videos in the
            algorithm.
          </p>
          <div className={s.statsGrid}>
            <div className={s.stat}>
              <div className={s.statValue}>2-5x</div>
              <div className={s.statLabel}>Higher Engagement from Subs</div>
            </div>
            <div className={s.stat}>
              <div className={s.statValue}>1-3%</div>
              <div className={s.statLabel}>Typical View-to-Sub Rate</div>
            </div>
            <div className={s.stat}>
              <div className={s.statValue}>24-48h</div>
              <div className={s.statLabel}>Critical Period for New Videos</div>
            </div>
          </div>
        </section>

        {/* What Converts Viewers */}
        <section id="what-converts" className={s.section}>
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
            What Actually Converts Viewers to Subscribers
          </h2>
          <p className={s.sectionText}>
            Not all views are equal for subscriber growth. Understanding what
            drives conversions helps you create content that builds your
            audience, not just your view count.
          </p>
          <ul className={s.list}>
            <li>
              <strong>Demonstrated expertise:</strong> Videos that teach
              something valuable make viewers want more
            </li>
            <li>
              <strong>Unique perspective:</strong> Content they can't get
              elsewhere creates loyalty
            </li>
            <li>
              <strong>Consistent quality:</strong> One great video can get
              views; consistent quality gets subscribers
            </li>
            <li>
              <strong>Clear niche identity:</strong> Viewers subscribe when they
              know what to expect from future videos
            </li>
            <li>
              <strong>Personal connection:</strong> Creators who show
              personality build stronger subscriber relationships
            </li>
          </ul>
        </section>

        {/* Growth Strategies */}
        <section id="growth-strategies" className={s.section}>
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
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            Proven Subscriber Growth Strategies
          </h2>
          <ol className={s.numberedList}>
            <li>
              <strong>Ask for the subscription (strategically):</strong> Don't
              ask in the intro—ask after you've delivered value. "If this
              tip helped you, consider subscribing for more."
            </li>
            <li>
              <strong>Create series content:</strong> Multi-part series give
              viewers a reason to subscribe so they don't miss the next episode.
            </li>
            <li>
              <strong>Optimize your channel page:</strong> Your channel trailer
              should clearly communicate who you help and why they should
              subscribe.
            </li>
            <li>
              <strong>Use end screens effectively:</strong> Promote your best
              converting videos in end screens to keep viewers on your channel.
            </li>
            <li>
              <strong>Double down on what works:</strong> Identify your highest
              subscriber-per-view videos and create more content like them.
            </li>
            <li>
              <strong>Maintain posting consistency:</strong> Regular uploads
              train your audience to expect and look for your content.
            </li>
          </ol>
        </section>

        {/* Subscriber Drivers */}
        <section id="subscriber-drivers" className={s.section}>
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
            Finding Your Subscriber Driver Videos
          </h2>
          <p className={s.sectionText}>
            Some videos convert viewers to subscribers at 2-3x your channel
            average. These "subscriber driver" videos are gold—they're
            the content your audience values most.
          </p>
          <ul className={s.list}>
            <li>Check YouTube Studio: Analytics → Subscribers → See more</li>
            <li>
              Sort by "Subscribers gained" to find your top converting
              videos
            </li>
            <li>
              Calculate subscribers per 1,000 views for each video to normalize
              for view count
            </li>
            <li>
              Analyze what your top subscriber drivers have in common (topic,
              format, length, style)
            </li>
            <li>Create more content that matches those patterns</li>
          </ul>
        </section>

        {/* Mistakes to Avoid */}
        <section id="mistakes" className={s.section}>
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
            Subscriber Growth Mistakes to Avoid
          </h2>
          <ul className={s.list}>
            <li>
              <strong>Begging for subscribers in the intro:</strong> Viewers
              haven't seen value yet—earn the ask first
            </li>
            <li>
              <strong>Sub4Sub schemes:</strong> These subscribers never watch
              your content and hurt your metrics
            </li>
            <li>
              <strong>Giveaway subscribers:</strong> They subscribed for prizes,
              not content—expect high unsubscribe rates
            </li>
            <li>
              <strong>Inconsistent content:</strong> Posting randomly across
              topics confuses potential subscribers
            </li>
            <li>
              <strong>Ignoring analytics:</strong> Not knowing what converts
              means you can't optimize for it
            </li>
          </ul>
        </section>

        {/* ChannelBoost CTA */}
        <div className={s.highlight}>
          <p>
            <strong>{BRAND.name}'s Subscriber Drivers feature</strong>{" "}
            automatically identifies your highest-converting videos and shows
            you the patterns that turn viewers into subscribers. Stop guessing
            and start growing.
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
          title="Find Your Subscriber Drivers"
          description={`Discover which videos convert viewers to subscribers with ${BRAND.name}.`}
        />
      </article>
    </main>
  );
}
