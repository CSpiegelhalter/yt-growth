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

const ARTICLE = LEARN_ARTICLES["youtube-retention-analysis"];

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

function SidebarTOC() {
  return (
    <nav className={s.sidebarToc} aria-label="Table of contents">
      <p className={s.sidebarTocTitle}>In this guide</p>
      <ol className={s.sidebarTocList}>
        {ARTICLE.toc.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className={s.sidebarTocLink}>
              {item.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default function YouTubeRetentionAnalysisPage() {
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
        <h1 className={s.title}>YouTube Retention Analysis: Keep Viewers Watching</h1>
        <p className={s.subtitle}>
          Understand where viewers drop off and learn proven strategies to keep
          them watching until the end.
        </p>
        <ArticleMeta
          dateModified={ARTICLE.dateModified}
          readingTime={ARTICLE.readingTime}
        />

        {/* Quick Summary */}
        <div className={s.quickSummaryBox}>
          <div className={s.quickSummaryHeader}>
            <p className={s.quickSummaryLabel}>Quick Summary</p>
            <div className={s.quickSummaryMeta}>
              <span className={s.quickSummaryMetaItem}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {ARTICLE.readingTime}
              </span>
            </div>
          </div>
          <ul className={s.quickSummaryList}>
            <li className={s.quickSummaryPoint}>Retention is the most important metric for YouTube's algorithm</li>
            <li className={s.quickSummaryPoint}>The first 30 seconds are critical for hooking viewers</li>
            <li className={s.quickSummaryPoint}>Learn to read retention curves to diagnose specific problems</li>
            <li className={s.quickSummaryPoint}>Use pattern interrupts and open loops to keep attention</li>
          </ul>
        </div>
      </header>

      {/* Article Layout with Sidebar */}
      <div className={s.articleLayout}>
        <aside className={s.articleSidebar}>
          <SidebarTOC />
        </aside>

        <div className={s.articleMain}>
          <div className={s.mobileToc}>
            <TableOfContents items={ARTICLE.toc} />
          </div>

          <article className={s.content}>
            {/* Why Retention Matters */}
            <section id="why-retention-matters" className={s.section}>
              <h2 className={s.sectionTitle}>
                <span className={s.sectionIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </span>
                Why Retention Matters for YouTube Growth
              </h2>
              <p className={s.sectionText}>
                Audience retention is the most important metric for YouTube growth.
                It directly affects how the algorithm promotes your videos. High
                retention signals to YouTube that viewers find your content
                valuable, leading to more impressions and suggested video placements.
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
                  <div className={s.statValue}>Higher</div>
                  <div className={s.statLabel}>Views with Better Retention</div>
                </div>
              </div>

              <div className={s.keyTakeaways}>
                <p className={s.keyTakeawaysLabel}>Key takeaways</p>
                <ul className={s.keyTakeawaysList}>
                  <li>Retention directly impacts how YouTube promotes your videos</li>
                  <li>Higher retention leads to more suggested video placements</li>
                  <li>Focus on the first 30 seconds to hook viewers</li>
                </ul>
              </div>
            </section>

            {/* Reading Retention Curves */}
            <section id="reading-curves" className={s.section}>
              <h2 className={s.sectionTitle}>
                <span className={s.sectionIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </span>
                How to Read Retention Curves
              </h2>
              <p className={s.sectionText}>
                YouTube Studio shows your retention graph as a line that starts at
                100% and decreases over time. Understanding this curve reveals
                exactly where and why viewers leave.
              </p>

              <ul className={s.twoColList}>
                <li>
                  <strong>Steep initial drop (0 to 30 sec)</strong>
                  Your hook isn't compelling enough or doesn't match your title/thumbnail
                </li>
                <li>
                  <strong>Gradual decline</strong>
                  Normal behavior. Content is engaging but some viewers naturally leave
                </li>
                <li>
                  <strong>Sharp mid-video drops</strong>
                  Specific section is boring, confusing, or off-topic. Review that timestamp.
                </li>
                <li>
                  <strong>Spikes above 100%</strong>
                  Viewers are rewatching specific sections. This content resonates!
                </li>
                <li>
                  <strong>Cliff at the end</strong>
                  Normal. Viewers leave before end screens play.
                </li>
              </ul>

              <aside className={`${s.callout} ${s.calloutTip}`}>
                <div className={s.calloutIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v1M4.22 4.22l.71.71M1 12h2M18.36 4.93l.71-.71M23 12h-2" />
                    <path d="M15.5 15a3.5 3.5 0 10-7 0c0 1.57.75 2.97 1.91 3.85.34.26.59.63.59 1.06V21h4v-1.09c0-.43.25-.8.59-1.06A3.98 3.98 0 0015.5 15z" />
                  </svg>
                </div>
                <div className={s.calloutContent}>
                  <p className={s.calloutTitle}>Compare to similar videos</p>
                  <div className={s.calloutBody}>
                    <p>Compare retention curves across your videos of similar length and topic. This reveals patterns in what's working and what isn't.</p>
                  </div>
                </div>
              </aside>
            </section>

            {/* Drop-Off Patterns */}
            <section id="drop-off-patterns" className={s.section}>
              <h2 className={s.sectionTitle}>
                <span className={s.sectionIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </span>
                Common Drop-Off Patterns and Fixes
              </h2>
              <p className={s.sectionText}>
                Each drop-off pattern has a specific cause and fix. Identify yours and apply the solution.
              </p>

              <ol className={s.numberedList}>
                <li>
                  <strong>The Early Exit (0 to 30 seconds):</strong> Viewers click away immediately. Fix: Start with a stronger hook. State the value proposition in the first 5 seconds.
                </li>
                <li>
                  <strong>The Intro Death (30 to 60 seconds):</strong> Long intros kill retention. Fix: Cut unnecessary intro footage. Get to the main content faster.
                </li>
                <li>
                  <strong>The Mid-Video Cliff:</strong> Sharp drop at a specific point. Fix: Review that section. Is it slow? Off-topic? Cut or restructure it.
                </li>
                <li>
                  <strong>The Slow Bleed:</strong> Gradual decline throughout. Fix: Add pattern interrupts. Change camera angles, insert B-roll, use on-screen graphics.
                </li>
                <li>
                  <strong>The Premature End:</strong> Big drop before your video ends. Fix: Deliver your main value earlier. Save "extra" content for the end.
                </li>
              </ol>

              <div className={s.keyTakeaways}>
                <p className={s.keyTakeawaysLabel}>Key takeaways</p>
                <ul className={s.keyTakeawaysList}>
                  <li>Match the fix to your specific drop-off pattern</li>
                  <li>Watch your video at the exact timestamp of drops</li>
                  <li>Test one change at a time to see what works</li>
                </ul>
              </div>
            </section>

            {/* Strategies to Improve */}
            <section id="improvement-strategies" className={s.section}>
              <h2 className={s.sectionTitle}>
                <span className={s.sectionIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </span>
                Proven Strategies to Improve Retention
              </h2>
              <p className={s.sectionText}>
                These techniques work across different content types. Apply them to your next video.
              </p>

              <ul className={s.twoColList}>
                <li>
                  <strong>Open with a hook</strong>
                  State what viewers will learn or see in the first 5 seconds. Create immediate curiosity.
                </li>
                <li>
                  <strong>Use pattern interrupts</strong>
                  Change something every 30 to 60 seconds: camera angle, graphics, music, energy level.
                </li>
                <li>
                  <strong>Create open loops</strong>
                  Tease upcoming content to keep viewers watching for the payoff. "Later I'll show you..."
                </li>
                <li>
                  <strong>Deliver on your promise fast</strong>
                  Don't make viewers wait for what they clicked for. Get to the value quickly.
                </li>
                <li>
                  <strong>Cut ruthlessly</strong>
                  If a section doesn't add value, remove it. Every minute should deliver or build tension.
                </li>
                <li>
                  <strong>Use chapters</strong>
                  Help viewers find what they want. Chapters improve both retention and watch time.
                </li>
              </ul>

              <p className={s.sectionText}>
                For more on improving your content strategy, see our <Link href="/learn/youtube-video-ideas">video ideas guide</Link> and <Link href="/learn/youtube-channel-audit">channel audit guide</Link>.
              </p>
            </section>

            {/* CTA */}
            <div className={s.highlight}>
              <p>
                <strong>{BRAND.name} analyzes your retention curves</strong> and
                shows you exactly where viewers drop off. Get specific, actionable
                insights for each video instead of guessing what went wrong.
              </p>
            </div>

            {/* FAQ */}
            <section id="faq" className={s.faqSection}>
              <h2 className={s.faqTitle}>Frequently Asked Questions</h2>
              <div className={s.faqList}>
                {ARTICLE.faqs.map((faq, index) => (
                  <details key={index} className={s.faqItem}>
                    <summary className={s.faqQuestion}>
                      <span className={s.faqQuestionText}>{faq.question}</span>
                      <svg className={s.faqChevron} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </summary>
                    <p className={s.faqAnswer}>{faq.answer}</p>
                  </details>
                ))}
              </div>
            </section>

            {/* Related Articles */}
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
              title="Improve Your Retention Today"
              description={`Get detailed retention analysis for your videos with ${BRAND.name}.`}
            />
          </article>
        </div>
      </div>
    </main>
  );
}
