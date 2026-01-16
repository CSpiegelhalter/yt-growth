import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import {
  LearnStaticCTA,
  TableOfContents,
  ArticleMeta,
} from "@/components/learn";
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
        <h1 className={s.title}>
          YouTube Channel Audit: How to Find and Fix What's Killing Your Growth
        </h1>
        <p className={s.subtitle}>
          Your channel isn't growing and you don't know why. This guide walks
          you through your YouTube analytics step by step, shows you what
          healthy metrics look like, and gives you a 30 day plan to turn things
          around.
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
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {ARTICLE.readingTime}
              </span>
              <span className={s.quickSummaryMetaItem}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
                For all creators
              </span>
            </div>
          </div>
          <ul className={s.quickSummaryList}>
            <li className={s.quickSummaryPoint}>
              Focus on 6 key metrics: impressions, CTR, average view duration,
              retention curve, traffic sources, and subscribers per view
            </li>
            <li className={s.quickSummaryPoint}>
              Different metric combinations point to specific problems with
              specific fixes
            </li>
            <li className={s.quickSummaryPoint}>
              Use the 15 minute checklist to diagnose your channel quickly
            </li>
            <li className={s.quickSummaryPoint}>
              Follow the 30 day action plan to systematically improve
              performance
            </li>
          </ul>
        </div>
      </header>

      {/* Article Layout with Sidebar */}
      <div className={s.articleLayout}>
        {/* Sidebar TOC (Desktop only) */}
        <aside className={s.articleSidebar}>
          <SidebarTOC />
        </aside>

        {/* Main Content */}
        <div className={s.articleMain}>
          {/* Mobile TOC */}
          <div className={s.mobileToc}>
            <TableOfContents items={ARTICLE.toc} />
          </div>

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
                    <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                    <circle cx="12" cy="17" r="0.5" fill="currentColor" />
                  </svg>
                </span>
                What is a YouTube Channel Audit?
              </h2>
              <p className={s.sectionText}>
                You're posting consistently, your content is good, but your
                views are flat and subscribers aren't growing. Sound familiar? A
                channel audit is how you figure out exactly what's going wrong
                and what to fix first.
              </p>
              <p className={s.sectionText}>
                An audit is a systematic review of your YouTube analytics to
                find the specific bottleneck holding you back. Maybe your
                thumbnails aren't getting clicks. Maybe viewers are leaving in
                the first 30 seconds. Maybe YouTube isn't showing your videos to
                anyone. Each problem has a different fix, and the only way to
                know which one applies to you is to look at the data.
              </p>
              <p className={s.sectionText}>
                This guide gives you a complete framework. You'll learn which
                metrics actually matter, where to find them in YouTube Studio,
                what healthy numbers look like, how to diagnose your specific
                problem, and what to do about it.
              </p>
            </section>

            {/* Key Metrics */}
            <section id="key-metrics" className={s.section}>
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
                The 6 Metrics That Actually Matter
              </h2>
              <p className={s.sectionText}>
                YouTube tracks dozens of numbers, but only a handful tell you
                what's actually happening with your channel. Focus on these six.
              </p>

              <ul className={s.twoColList}>
                <li>
                  <strong>Impressions</strong>
                  How many times YouTube showed your thumbnail. Under 1,000 per
                  video after a week means YouTube isn't recommending your
                  content.
                </li>
                <li>
                  <strong>Click Through Rate (CTR)</strong>
                  Percentage who clicked your thumbnail. Below 4% indicates
                  packaging problems. Learn more in our{" "}
                  <Link href="/learn/youtube-video-ideas">
                    video planning guide
                  </Link>
                  .
                </li>
                <li>
                  <strong>Average View Duration</strong>
                  How long viewers watch. Under 40% of video length means
                  content isn't holding attention. The most important algorithm
                  signal.
                </li>
                <li>
                  <strong>Retention Curve</strong>
                  Graph showing when viewers leave. Cliffs = weak hooks. Gradual
                  decline = normal. See our{" "}
                  <Link href="/learn/youtube-retention-analysis">
                    retention guide
                  </Link>
                  .
                </li>
                <li>
                  <strong>Traffic Sources</strong>
                  Where views come from (Browse, Suggested, Search). Heavy
                  search = titles work but YouTube isn't recommending broadly.
                </li>
                <li>
                  <strong>Subscribers Per 1K Views</strong>
                  How many viewers become subscribers. Healthy: 10 to 30. Under
                  10 = content doesn't signal ongoing value. See{" "}
                  <Link href="/learn/how-to-get-more-subscribers">
                    subscriber guide
                  </Link>
                  .
                </li>
              </ul>

              <div className={s.keyTakeaways}>
                <p className={s.keyTakeawaysLabel}>Key takeaways</p>
                <ul className={s.keyTakeawaysList}>
                  <li>
                    CTR measures your packaging; retention measures your content
                  </li>
                  <li>
                    Average view duration is the most important algorithm signal
                  </li>
                  <li>
                    Traffic sources reveal whether YouTube trusts your content
                  </li>
                </ul>
              </div>
            </section>

            {/* YouTube Studio Guide */}
            <section id="youtube-studio-guide" className={s.section}>
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
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <path d="M3 9h18M9 21V9" />
                  </svg>
                </span>
                Where to Find Each Metric in YouTube Studio
              </h2>
              <p className={s.sectionText}>
                All the data you need is free in YouTube Studio. Here's exactly
                where to click.
              </p>
              <ol className={s.numberedList}>
                <li>
                  <strong>Open YouTube Studio:</strong> Go to studio.youtube.com
                  or click your profile picture and select "YouTube Studio."
                </li>
                <li>
                  <strong>Impressions and CTR:</strong> Analytics → Reach tab.
                  Use the date picker for last 90 days.
                </li>
                <li>
                  <strong>Average View Duration:</strong> Analytics → Engagement
                  tab. Click "See More" for individual videos.
                </li>
                <li>
                  <strong>Retention Curves:</strong> Content → select video →
                  Analytics → Engagement tab → scroll to "Audience Retention."
                </li>
                <li>
                  <strong>Traffic Sources:</strong> Analytics → Reach tab →
                  scroll to "Traffic source types" → "See More."
                </li>
                <li>
                  <strong>Subscribers Per Video:</strong> Analytics → Audience
                  tab → "See More" under subscribers → view by video.
                </li>
              </ol>

              <aside className={`${s.callout} ${s.calloutTip}`}>
                <div className={s.calloutIcon}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2v1M4.22 4.22l.71.71M1 12h2M18.36 4.93l.71-.71M23 12h-2" />
                    <path d="M15.5 15a3.5 3.5 0 10-7 0c0 1.57.75 2.97 1.91 3.85.34.26.59.63.59 1.06V21h4v-1.09c0-.43.25-.8.59-1.06A3.98 3.98 0 0015.5 15z" />
                  </svg>
                </div>
                <div className={s.calloutContent}>
                  <p className={s.calloutTitle}>Pro tip</p>
                  <div className={s.calloutBody}>
                    <p>
                      Use Advanced Mode (top right corner) to build custom
                      reports. You can compare up to 4 videos or time periods
                      side by side.
                    </p>
                  </div>
                </div>
              </aside>
            </section>

            {/* What Good Looks Like */}
            <section id="what-good-looks-like" className={s.section}>
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
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </span>
                What Good Looks Like (Benchmarks)
              </h2>
              <p className={s.sectionText}>
                These ranges are based on patterns across many channels. Your
                specific numbers will vary by niche. Use these as reference
                points, not absolute targets.
              </p>
              <div className={s.statsGrid}>
                <div className={s.stat}>
                  <div className={s.statValue}>4-10%</div>
                  <div className={s.statLabel}>Click Through Rate</div>
                </div>
                <div className={s.stat}>
                  <div className={s.statValue}>40-60%</div>
                  <div className={s.statLabel}>Avg View Duration</div>
                </div>
                <div className={s.stat}>
                  <div className={s.statValue}>10-30</div>
                  <div className={s.statLabel}>Subs per 1K Views</div>
                </div>
              </div>

              <h3 className={s.subheading}>Detailed Benchmarks</h3>
              <ul className={s.list}>
                <li>
                  <strong>CTR:</strong> 2% to 10% is typical. Below 4% often
                  indicates packaging problems. Search traffic has higher CTR;
                  browse traffic has lower.
                </li>
                <li>
                  <strong>View Duration:</strong> Short videos (under 5 min):
                  aim for 60%+. Medium (5 to 15 min): 50%+. Long (15+ min): 40%+
                  is common.
                </li>
                <li>
                  <strong>30-Second Retention:</strong> Losing 20% to 30% is
                  normal. More than 40% loss signals a hook problem or thumbnail
                  mismatch.
                </li>
                <li>
                  <strong>Impressions Growth:</strong> Flat or declining
                  impressions over 3+ months suggests YouTube is limiting reach
                  based on past performance.
                </li>
              </ul>
            </section>

            {/* Diagnose Your Problem */}
            <section id="diagnose-problem" className={s.section}>
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
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                </span>
                Diagnose Your Problem
              </h2>
              <p className={s.sectionText}>
                Different metric combinations point to different problems. Find
                your pattern below.
              </p>

              <ul className={s.twoColList}>
                <li>
                  <strong>Low Impressions + Low CTR</strong>
                  YouTube isn't showing your videos, and those who see them
                  don't click. Focus on CTR first (better thumbnails/titles).
                  Once CTR improves, impressions should follow.
                </li>
                <li>
                  <strong>High Impressions + Low CTR</strong>
                  YouTube is giving you chances, but viewers scroll past. This
                  is a packaging problem. Test new thumbnail styles: brighter
                  colors, clearer faces, larger text.
                </li>
                <li>
                  <strong>Good CTR + Low Retention</strong>
                  People click but leave quickly. Either thumbnail/title
                  mismatch or weak hooks. Watch your first 60 seconds. See{" "}
                  <Link href="/learn/youtube-retention-analysis">
                    retention fixes
                  </Link>
                  .
                </li>
                <li>
                  <strong>Good CTR + Good Retention + Low Views</strong>
                  Content is solid but YouTube isn't showing it. Double down on
                  search content, keep publishing. Sometimes takes 50 to 100
                  videos.
                </li>
                <li>
                  <strong>Mostly Search Traffic</strong>
                  Titles work for discoverability but retention needs
                  improvement. Search viewers are motivated; suggested viewers
                  are passive and leave at dull moments.
                </li>
                <li>
                  <strong>Good Metrics + Few Subscribers</strong>
                  Not asking for subscribe, asking at wrong time, or content
                  doesn't signal ongoing value. See{" "}
                  <Link href="/learn/how-to-get-more-subscribers">
                    subscriber strategies
                  </Link>
                  .
                </li>
              </ul>
            </section>

            {/* 15 Minute Checklist */}
            <section id="checklist" className={s.section}>
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
                15 Minute Channel Audit Checklist
              </h2>
              <p className={s.sectionText}>
                Use this quick checklist for a rapid health check. Open YouTube
                Studio and work through each item.
              </p>
              <ol className={s.numberedList}>
                <li>
                  <strong>Compare last 28 days vs previous 28 days:</strong> Are
                  views, watch time, and subscribers up or down?
                </li>
                <li>
                  <strong>Check impressions trend:</strong> Is YouTube showing
                  your content to more or fewer people?
                </li>
                <li>
                  <strong>Check channel CTR:</strong> Is it above 4%? Trending
                  up or down?
                </li>
                <li>
                  <strong>Review top 5 videos by views:</strong> What do they
                  have in common (topic, length, thumbnail)?
                </li>
                <li>
                  <strong>Review bottom 5 videos:</strong> What's different from
                  your top performers?
                </li>
                <li>
                  <strong>Open most recent video's retention graph:</strong>{" "}
                  Where's the biggest drop? What's at that timestamp?
                </li>
                <li>
                  <strong>Check traffic sources:</strong> What % is Search vs
                  Browse vs Suggested? Changed recently?
                </li>
                <li>
                  <strong>Check subscriber source:</strong> Which videos drive
                  the most new subscribers?
                </li>
                <li>
                  <strong>Check returning viewers:</strong> What % of views come
                  from subscribers vs new viewers?
                </li>
                <li>
                  <strong>Review upload consistency:</strong> Are you posting
                  regularly? Gaps correlate with reach drops.
                </li>
              </ol>
            </section>

            {/* Why Your Channel Isn't Growing */}
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
                Why Your YouTube Channel Isn't Growing
              </h2>
              <p className={s.sectionText}>
                Here are the most common issues found in channel audits, along
                with how to fix each one.
              </p>

              <ul className={s.twoColList}>
                <li>
                  <strong>Hooks are too slow</strong>
                  40%+ retention drop in first 30 seconds. Fix: Start with the
                  payoff. Cut intro. Get to point in first 5 seconds.
                </li>
                <li>
                  <strong>Thumbnails don't stand out</strong>
                  Low CTR. Fix: High contrast colors, emotion on faces, large
                  readable text. Do something noticeably different.
                </li>
                <li>
                  <strong>Title/thumbnail don't match content</strong>
                  High CTR, low retention. Fix: Deliver thumbnail promise in
                  first 30 seconds, not at end.
                </li>
                <li>
                  <strong>Content too scattered</strong>
                  Gaming, then vlogs, then tutorials confuses YouTube. Fix: Pick
                  one topic for at least 20 videos.
                </li>
                <li>
                  <strong>Videos drag in middle</strong>
                  Mid-video drops from tangents/filler. Fix: Watch at 2x, cut
                  every moment you'd skip.
                </li>
                <li>
                  <strong>Not asking for subscribers</strong>
                  Good views, low growth. Fix: Ask after delivering value,
                  explain what future videos cover.
                </li>
                <li>
                  <strong>Inconsistent posting</strong>
                  Gaps cause reduced impressions. Fix: Pick a realistic schedule
                  and stick to it.
                </li>
              </ul>
            </section>

            {/* Quick Wins */}
            <section id="quick-wins" className={s.section}>
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
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </span>
                Quick Wins You Can Fix Today
              </h2>
              <p className={s.sectionText}>
                These changes take 30 minutes or less and can move the needle
                immediately.
              </p>

              <ul className={s.twoColList}>
                <li>
                  <strong>Update 3 worst-performing thumbnails</strong>
                  Find videos with lowest CTR and create new thumbnails. YouTube
                  will re-test with fresh impressions.
                </li>
                <li>
                  <strong>Add end screens to last 10 videos</strong>
                  Link to your best related video. Increases session time and
                  signals content keeps people watching.
                </li>
                <li>
                  <strong>Add cards at retention drop points</strong>
                  If viewers leave at specific timestamps, add cards linking to
                  related videos to save them.
                </li>
                <li>
                  <strong>Rewrite 5 most-viewed video titles</strong>
                  Make them clearer, more specific, more curiosity-driven.
                  Better titles on high-impression videos boost CTR.
                </li>
                <li>
                  <strong>Update channel description</strong>
                  Does it clearly explain what viewers get? Include relevant
                  keywords. Be specific about your value.
                </li>
                <li>
                  <strong>Create/update channel trailer</strong>
                  Hook in 5 seconds, explain why to subscribe in 30 seconds.
                  Keep under 60 seconds total.
                </li>
                <li>
                  <strong>Organize videos into playlists</strong>
                  Group content by topic with keyword-rich titles. Helps
                  discoverability and watch time.
                </li>
                <li>
                  <strong>Pin subscriber-driving comment</strong>
                  On top videos, pin a comment asking viewers to subscribe and
                  explaining upcoming content.
                </li>
              </ul>
            </section>

            {/* Common Mistakes */}
            <section id="common-mistakes" className={s.section}>
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
                Mistakes Creators Make During Audits
              </h2>
              <p className={s.sectionText}>
                Avoid these common traps when analyzing your channel.
              </p>

              <aside className={`${s.callout} ${s.calloutWarning}`}>
                <div className={s.calloutIcon}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div className={s.calloutContent}>
                  <p className={s.calloutTitle}>
                    Don't compare to other channels
                  </p>
                  <div className={s.calloutBody}>
                    <p>
                      Your CTR being lower than a larger channel doesn't matter.
                      Track your own progress and whether your metrics are
                      improving over time.
                    </p>
                  </div>
                </div>
              </aside>

              <ul className={s.list}>
                <li>
                  <strong>Looking at too short a time period.</strong> Daily
                  fluctuations are noise. Look at 28 day or 90 day trends to see
                  real patterns.
                </li>
                <li>
                  <strong>
                    Focusing on views instead of leading indicators.
                  </strong>{" "}
                  Views are a result. Focus on CTR, retention, and impressions.
                  Improve those, views follow.
                </li>
                <li>
                  <strong>Making multiple changes at once.</strong> You won't
                  know what helped. Test one variable at a time.
                </li>
                <li>
                  <strong>Ignoring your successful videos.</strong> Your top 10%
                  contain the formula you should be repeating. Study them.
                </li>
                <li>
                  <strong>Expecting immediate results.</strong> YouTube takes
                  time to recalibrate. A thumbnail update might need 2 weeks to
                  show true CTR.
                </li>
                <li>
                  <strong>Only looking at latest videos.</strong> Older videos
                  with steady traffic are worth optimizing too.
                </li>
              </ul>
            </section>

            {/* 30 Day Action Plan */}
            <section id="action-plan" className={s.section}>
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
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                </span>
                30 Day Action Plan
              </h2>
              <p className={s.sectionText}>
                After completing your audit, follow this week by week plan to
                systematically improve your channel.
              </p>

              <div className={s.highlight}>
                <p>
                  <strong>Week 1: Fix your packaging.</strong> Update thumbnails
                  on your 5 lowest CTR videos (that still have impressions).
                  Rewrite titles on your 5 most-viewed videos. Document your
                  changes so you can track what works.
                </p>
              </div>
              <div className={s.highlight}>
                <p>
                  <strong>Week 2: Fix your hooks.</strong> Watch first 60
                  seconds of your 5 most recent videos at 2x speed. Note where
                  you'd click away. For your next video, write 3 hook options
                  and pick the most compelling. Cut intros over 5 seconds.
                </p>
              </div>
              <div className={s.highlight}>
                <p>
                  <strong>Week 3: Optimize back catalog.</strong> Add end
                  screens to 10 most-viewed videos. Create or update playlists
                  by topic. Add cards at retention drop points on 5 videos.
                </p>
              </div>
              <div className={s.highlight}>
                <p>
                  <strong>Week 4: Review and plan.</strong> Compare metrics to
                  before you started. Which changes improved CTR? Retention?
                  Plan next month based on what you learned. Double down on
                  what's working.
                </p>
              </div>
            </section>

            {/* Case Study */}
            <section id="case-study" className={s.section}>
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
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </span>
                Example: Diagnosing a Stuck Channel
              </h2>

              <aside className={`${s.callout} ${s.calloutExample}`}>
                <div className={s.calloutIcon}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                  </svg>
                </div>
                <div className={s.calloutContent}>
                  <p className={s.calloutTitle}>
                    Tutorial channel: 5,000 subscribers, stuck for 4 months
                  </p>
                  <div className={s.calloutBody}>
                    <p>
                      Posts weekly but views plateaued at 500 per video. CTR:
                      3.2%. View duration: 35% of length. Traffic: 60% search,
                      25% suggested, 15% browse. 45% drop in first 30 seconds.
                      Subs per 1K: 8.
                    </p>
                  </div>
                </div>
              </aside>

              <h3 className={s.subheading}>The Diagnosis</h3>
              <p className={s.sectionText}>
                This channel has a hook and retention problem. The 45%
                first-30-second drop is too high. CTR at 3.2% is borderline but
                not the main issue. Heavy search traffic means titles work, but
                YouTube isn't suggesting videos because retention is weak.
              </p>

              <h3 className={s.subheading}>The Fix Priority</h3>
              <ol className={s.numberedList}>
                <li>
                  Rewrite hooks on all new videos to deliver value in the first
                  10 seconds.
                </li>
                <li>Cut intros and get straight to the content.</li>
                <li>
                  After retention improves, test new thumbnails to lift CTR.
                </li>
                <li>
                  Add clearer subscribe CTAs after delivering value, not at the
                  start.
                </li>
              </ol>
              <p className={s.sectionText}>
                If this channel improves first-30-second retention to only lose
                25%, average view duration should increase, signaling to YouTube
                that content keeps people watching. That unlocks more suggested
                traffic.
              </p>
            </section>

            {/* YouTube SEO Basics */}
            <section id="youtube-seo" className={s.section}>
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
                YouTube SEO Basics: What Actually Matters
              </h2>
              <p className={s.sectionText}>
                YouTube SEO is different from website SEO. While keywords
                matter, YouTube heavily weights engagement signals. A video with
                perfect metadata but poor retention will not rank.
              </p>

              <h3 className={s.subheading}>SEO Factors That Matter Most</h3>
              <ol className={s.numberedList}>
                <li>
                  <strong>Retention and watch time:</strong> YouTube wants
                  viewers on the platform. Videos that hold attention get
                  recommended. Most important factor.
                </li>
                <li>
                  <strong>Click through rate:</strong> Higher CTR tells YouTube
                  your packaging resonates. Increases impressions over time.
                </li>
                <li>
                  <strong>Title optimization:</strong> Include target keyword in
                  first 60 characters. Be specific about what the video
                  delivers.
                </li>
                <li>
                  <strong>Thumbnail:</strong> Visual SEO. Determines whether
                  people click when your video appears.
                </li>
                <li>
                  <strong>Description:</strong> First 2 to 3 sentences matter
                  most. Include main keyword and explain what viewers learn.
                </li>
              </ol>

              <h3 className={s.subheading}>What Matters Less Than You Think</h3>
              <ul className={s.list}>
                <li>
                  <strong>Tags:</strong> Minimal impact in 2026. YouTube uses
                  them mainly for misspellings. Don't obsess.
                </li>
                <li>
                  <strong>Keyword stuffing:</strong> Repeating keywords doesn't
                  help and hurts readability. Use natural language.
                </li>
                <li>
                  <strong>Exact match titles:</strong> YouTube understands
                  synonyms. Writing for humans matters more.
                </li>
              </ul>
              <p className={s.sectionText}>
                For deeper SEO strategy, see our{" "}
                <Link href="/learn/youtube-seo">
                  complete YouTube SEO guide
                </Link>
                . For title and thumbnail patterns, check our{" "}
                <Link href="/learn/youtube-video-ideas">video ideas guide</Link>
                .
              </p>
            </section>

            {/* CTA */}
            <div className={s.highlight}>
              <p>
                <strong>Want help with your audit?</strong> {BRAND.name}{" "}
                connects to your YouTube analytics and automatically surfaces
                what is working and what needs attention. Get a clear picture of
                your channel health and specific recommendations for what to
                improve next.
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
              title="Ready to Audit Your Channel?"
              description={`${BRAND.name} analyzes your YouTube data and shows you exactly where to focus. No spreadsheets required.`}
            />
          </article>
        </div>
      </div>
    </main>
  );
}
