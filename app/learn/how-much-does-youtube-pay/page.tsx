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

const ARTICLE = LEARN_ARTICLES["how-much-does-youtube-pay"];

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

export default function HowMuchDoesYouTubePayPage() {
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
          How Much Does YouTube Pay? Understanding RPM, CPM, and Real Earnings
        </h1>
        <p className={s.subtitle}>
          Curious about YouTube creator earnings? This guide breaks down how
          much YouTube pays per view, per 1,000 views, and what factors affect
          your actual income.
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
        {/* Overview */}
        <section id="overview" className={s.section}>
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
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
            </span>
            How YouTube Pay Works
          </h2>
          <p className={s.sectionText}>
            YouTube does not pay a fixed rate per view. Your earnings depend on
            many factors: your niche, your audience location, the time of year,
            how engaged your viewers are with ads, and more. This makes
            &ldquo;how much does YouTube pay&rdquo; a complicated question with
            no single answer.
          </p>
          <p className={s.sectionText}>
            To earn money from ads, you must first join the{" "}
            <Link href="/learn/youtube-monetization-requirements">
              YouTube Partner Program
            </Link>
            . This requires 1,000 subscribers and 4,000 watch hours (or 10M
            Shorts views). Once accepted, YouTube shows ads on your videos and
            shares a portion of that revenue with you.
          </p>
          <p className={s.sectionText}>
            YouTube keeps 45% of ad revenue. You receive 55%. But not all views
            generate ad revenue since some viewers use ad blockers, some watch
            from regions with low ad spend, and some videos may have limited
            advertiser appeal.
          </p>
        </section>

        {/* RPM vs CPM */}
        <section id="rpm-vs-cpm" className={s.section}>
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
                <path d="M18 20V10M12 20V4M6 20v-6" />
              </svg>
            </span>
            RPM vs CPM Explained
          </h2>
          <p className={s.sectionText}>
            Two metrics matter for understanding YouTube pay:
          </p>
          <h3 className={s.subheading}>CPM (Cost Per Mille)</h3>
          <p className={s.sectionText}>
            CPM is what advertisers pay for 1,000 ad impressions. This number
            appears in YouTube Studio but is not what you actually earn. It
            reflects the advertising market, not your revenue.
          </p>
          <h3 className={s.subheading}>RPM (Revenue Per Mille)</h3>
          <p className={s.sectionText}>
            RPM is what you actually earn per 1,000 video views. This accounts
            for YouTube&apos;s 45% cut, views without ads, and multiple revenue
            sources (ads, Premium, memberships). RPM is the number that matters
            for your actual income.
          </p>
          <h3 className={s.subheading}>Why They Differ</h3>
          <p className={s.sectionText}>
            CPM might be $10, but your RPM could be $3. The gap exists because:
          </p>
          <ul className={s.list}>
            <li>Not every view shows an ad</li>
            <li>YouTube takes 45% of ad revenue</li>
            <li>Some viewers skip ads, reducing revenue</li>
            <li>Ad blockers prevent ad impressions entirely</li>
          </ul>
          <p className={s.sectionText}>
            When estimating earnings, use RPM, not CPM.
          </p>
        </section>

        {/* Pay Per View */}
        <section id="pay-per-view" className={s.section}>
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
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </span>
            How Much Does YouTube Pay Per View
          </h2>
          <p className={s.sectionText}>
            There is no fixed per-view rate. Earnings per view typically range
            from $0.001 to $0.01, depending on your RPM. That means:
          </p>
          <ul className={s.list}>
            <li>
              <strong>Low RPM ($1):</strong> About $0.001 per view (0.1 cents)
            </li>
            <li>
              <strong>Average RPM ($3):</strong> About $0.003 per view (0.3
              cents)
            </li>
            <li>
              <strong>High RPM ($10):</strong> About $0.01 per view (1 cent)
            </li>
          </ul>
          <p className={s.sectionText}>
            These ranges are typical, but individual results vary significantly.
            A finance video with US viewers might earn $0.02 per view, while a
            gaming video might earn $0.001.
          </p>
        </section>

        {/* Pay Per Million */}
        <section id="pay-per-million" className={s.section}>
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
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
            </span>
            How Much Does YouTube Pay for 1 Million Views
          </h2>
          <p className={s.sectionText}>
            For 1 million views, multiply your RPM by 1,000. Here are typical
            ranges:
          </p>
          <ul className={s.list}>
            <li>
              <strong>Low RPM niche ($1 to $2):</strong> $1,000 to $2,000 per
              million views
            </li>
            <li>
              <strong>Average niche ($3 to $5):</strong> $3,000 to $5,000 per
              million views
            </li>
            <li>
              <strong>High RPM niche ($8 to $15):</strong> $8,000 to $15,000 per
              million views
            </li>
          </ul>
          <h3 className={s.subheading}>Example Calculation</h3>
          <p className={s.sectionText}>
            A cooking channel with $4 RPM gets 1 million views:
          </p>
          <p className={s.sectionText}>
            1,000,000 views × ($4 ÷ 1,000) = <strong>$4,000</strong>
          </p>
          <p className={s.sectionText}>
            This is a rough estimate. Actual earnings depend on which videos got
            the views, audience demographics, seasonality, and more. Q4
            (October to December) typically pays more due to holiday
            advertising.
          </p>
        </section>

        {/* What Affects Pay */}
        <section id="what-affects-pay" className={s.section}>
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
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
            </span>
            What Affects Your Earnings
          </h2>
          <ul className={s.list}>
            <li>
              <strong>Niche:</strong> Finance, business, and software pay more
              because advertisers bid higher for those audiences. Entertainment
              and gaming pay less.
            </li>
            <li>
              <strong>Audience location:</strong> Viewers in the US, UK,
              Canada, and Australia generate higher ad rates than viewers in
              lower-income countries.
            </li>
            <li>
              <strong>Video length:</strong> Videos over 8 minutes can have
              multiple ad breaks, increasing revenue per view.
            </li>
            <li>
              <strong>Seasonality:</strong> Q4 (October to December) pays more
              due to holiday advertising spend. January often sees a drop.
            </li>
            <li>
              <strong>Content type:</strong> Some topics are
              &ldquo;advertiser-friendly&rdquo; and get more ads. Controversial
              or sensitive content may get limited ads.
            </li>
            <li>
              <strong>Viewer engagement:</strong> Videos with higher watch time
              can show more ads and often have engaged viewers who do not skip.
            </li>
          </ul>
        </section>

        {/* Niche Differences */}
        <section id="niche-differences" className={s.section}>
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
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </span>
            Earnings by Niche
          </h2>
          <p className={s.sectionText}>
            Here are typical RPM ranges by niche. These are estimates based on
            publicly reported data and can vary significantly:
          </p>
          <h3 className={s.subheading}>Higher Paying Niches ($5 to $15+ RPM)</h3>
          <ul className={s.list}>
            <li>Personal finance and investing</li>
            <li>Business and entrepreneurship</li>
            <li>Software and technology tutorials</li>
            <li>Legal and medical topics</li>
            <li>Real estate</li>
          </ul>
          <h3 className={s.subheading}>Medium Paying Niches ($2 to $5 RPM)</h3>
          <ul className={s.list}>
            <li>Education and how-to content</li>
            <li>Cooking and food</li>
            <li>Travel</li>
            <li>Fitness and health</li>
            <li>DIY and crafts</li>
          </ul>
          <h3 className={s.subheading}>Lower Paying Niches ($1 to $3 RPM)</h3>
          <ul className={s.list}>
            <li>Gaming and let&apos;s plays</li>
            <li>Entertainment and commentary</li>
            <li>Music</li>
            <li>Vlogs</li>
            <li>Kids content</li>
          </ul>
          <p className={s.sectionText}>
            Lower RPM does not mean you cannot make money. Gaming channels can
            earn well through volume, sponsorships, and Twitch streaming. Niche
            matters, but it is one factor among many.
          </p>
        </section>

        {/* Realistic Numbers */}
        <section id="realistic-numbers" className={s.section}>
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
            Realistic Expectations
          </h2>
          <p className={s.sectionText}>
            How much do YouTubers actually make? It varies enormously:
          </p>
          <ul className={s.list}>
            <li>
              <strong>Small channels (1K to 10K subscribers):</strong> Often $0
              to $100 per month from ads. Most income comes from other sources.
            </li>
            <li>
              <strong>Growing channels (10K to 100K subscribers):</strong>{" "}
              Typically $100 to $1,000 per month from ads, depending on views
              and niche.
            </li>
            <li>
              <strong>Established channels (100K+ subscribers):</strong> Can
              earn $1,000 to $10,000+ monthly from ads. Top creators in high-RPM
              niches earn much more.
            </li>
          </ul>
          <p className={s.sectionText}>
            These are ad revenue estimates only. Many creators earn more from
            sponsorships, affiliate marketing, merchandise, and their own
            products than from ads. Diversifying income is important since ad
            revenue alone rarely supports full-time creation until you have
            substantial views.
          </p>
        </section>

        {/* Beyond Ads */}
        <section id="beyond-ads" className={s.section}>
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
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </span>
            Income Beyond Ads
          </h2>
          <p className={s.sectionText}>
            Smart creators do not rely only on ad revenue. Other income streams
            often pay better:
          </p>
          <ul className={s.list}>
            <li>
              <strong>Sponsorships:</strong> Brands pay creators directly. Rates
              vary from $20 per 1,000 views for small channels to $50+ for
              established ones. A 100K view video could earn $2,000 to $5,000
              from a single sponsor.
            </li>
            <li>
              <strong>Affiliate marketing:</strong> Commission on products you
              recommend. No threshold required.
            </li>
            <li>
              <strong>Merchandise:</strong> Sell branded products to your
              audience. Works best with engaged communities.
            </li>
            <li>
              <strong>Memberships and Patreon:</strong> Monthly support from
              dedicated fans. Even 100 members at $5 is $500 monthly.
            </li>
            <li>
              <strong>Digital products:</strong> Courses, templates, or ebooks
              related to your expertise. High margins, no inventory.
            </li>
          </ul>
          <p className={s.sectionText}>
            For more on earning money, see our{" "}
            <Link href="/learn/youtube-monetization-requirements">
              monetization guide
            </Link>
            .
          </p>
        </section>

        {/* Mistakes */}
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
            Common Misconceptions
          </h2>
          <ul className={s.list}>
            <li>
              <strong>&ldquo;Everyone can make money on YouTube&rdquo;:</strong>{" "}
              Most channels never reach monetization thresholds. Of those that
              do, most earn modest amounts.
            </li>
            <li>
              <strong>&ldquo;Views equal money&rdquo;:</strong> Views from
              non-monetized regions or with ad blockers generate little revenue.
              Engagement quality matters.
            </li>
            <li>
              <strong>&ldquo;More subscribers means more money&rdquo;:</strong>{" "}
              Revenue comes from views, not subscriber count. A channel with
              fewer subscribers but more views earns more.
            </li>
            <li>
              <strong>&ldquo;YouTube pay is consistent&rdquo;:</strong> RPM
              fluctuates monthly. January pays less than December. Some months
              are better than others.
            </li>
            <li>
              <strong>
                &ldquo;Buying views or subscribers helps earnings&rdquo;:
              </strong>{" "}
              Fake engagement destroys your channel. YouTube detects it and may
              terminate your account. See our{" "}
              <Link href="/learn/free-youtube-subscribers">
                guide on why fake growth hurts
              </Link>
              .
            </li>
          </ul>
        </section>

        {/* CTA Highlight */}
        <div className={s.highlight}>
          <p>
            <strong>Track what actually earns.</strong> {BRAND.name} helps you
            see which videos drive revenue, where your best traffic comes from,
            and how to make content that performs. Get insights to grow smarter.
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
          title="Understand Your Channel Performance"
          description={`${BRAND.name} shows you what content drives results. Connect your channel to see which videos perform best.`}
        />
      </article>
    </main>
  );
}
