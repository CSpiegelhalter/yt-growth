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

const ARTICLE = LEARN_ARTICLES["youtube-monetization-requirements"];

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

export default function YouTubeMonetizationRequirementsPage() {
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
          YouTube Monetization Requirements: How to Get Monetized
        </h1>
        <p className={s.subtitle}>
          Ready to earn money from your videos? This guide covers the YouTube
          Partner Program requirements, how to apply, and ways to earn while you
          grow.
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
            Monetization Overview
          </h2>
          <p className={s.sectionText}>
            YouTube monetization means earning money from your videos. The
            primary path is the YouTube Partner Program (YPP), which lets you
            earn from ads shown on your content. But ad revenue is just one of
            several ways creators make money.
          </p>
          <p className={s.sectionText}>
            Getting monetized requires meeting specific thresholds. This
            protects the platform from spam and ensures advertisers that their
            ads appear on real channels with real audiences. Once approved, you
            unlock multiple revenue features.
          </p>
          <p className={s.sectionText}>
            Important: Do not try to shortcut these requirements by buying fake
            subscribers or views. YouTube detects this, and it can result in
            channel termination. See our guide on{" "}
            <Link href="/learn/free-youtube-subscribers">
              why fake growth destroys channels
            </Link>
            .
          </p>
        </section>

        {/* Requirements Checklist */}
        <section id="requirements-checklist" className={s.section}>
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
            YouTube Monetization Requirements Checklist
          </h2>
          <p className={s.sectionText}>
            To join the YouTube Partner Program in 2026, you need to meet ALL of
            these requirements:
          </p>
          <ul className={s.list}>
            <li>
              <strong>1,000 subscribers</strong> on your channel
            </li>
            <li>
              <strong>
                4,000 public watch hours in the last 12 months OR 10 million
                public Shorts views in the last 90 days
              </strong>
            </li>
            <li>
              <strong>No active Community Guidelines strikes</strong> on your
              channel
            </li>
            <li>
              <strong>Two-step verification</strong> enabled on your Google
              account
            </li>
            <li>
              <strong>Access to advanced features</strong> in YouTube Studio
            </li>
            <li>
              <strong>An AdSense account</strong> linked to your channel
            </li>
            <li>
              <strong>Live in an eligible country</strong> where the Partner
              Program is available
            </li>
            <li>
              <strong>Follow YouTube monetization policies</strong> and
              advertiser-friendly content guidelines
            </li>
          </ul>
          <p className={s.sectionText}>
            You can track your progress in YouTube Studio under the Earn tab.
            YouTube shows your current subscriber count and watch hour total.
          </p>
        </section>

        {/* Partner Program */}
        <section id="partner-program" className={s.section}>
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
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
            </span>
            YouTube Partner Program
          </h2>
          <p className={s.sectionText}>
            The YouTube Partner Program (YPP) is YouTube&apos;s official creator
            monetization system. Once accepted, you can earn from:
          </p>
          <ul className={s.list}>
            <li>
              <strong>Ad revenue:</strong> Earn a share of advertising shown on
              your videos
            </li>
            <li>
              <strong>YouTube Premium revenue:</strong> Earn when Premium
              members watch your content
            </li>
            <li>
              <strong>Channel memberships:</strong> Offer paid monthly
              memberships to your subscribers
            </li>
            <li>
              <strong>Super Chat and Super Stickers:</strong> Earn from
              highlighted messages during live streams
            </li>
            <li>
              <strong>Super Thanks:</strong> Earn from viewer tips on videos
            </li>
            <li>
              <strong>Shopping:</strong> Sell products directly from your videos
              and channel
            </li>
          </ul>
          <p className={s.sectionText}>
            For actual earnings numbers, see our guide on{" "}
            <Link href="/learn/how-much-does-youtube-pay">
              how much YouTube pays
            </Link>
            .
          </p>
        </section>

        {/* How to Apply */}
        <section id="how-to-apply" className={s.section}>
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
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
              </svg>
            </span>
            How to Apply for Monetization
          </h2>
          <p className={s.sectionText}>
            Once you meet the requirements, here is how to apply:
          </p>
          <ol className={s.numberedList}>
            <li>
              Open YouTube Studio and click <strong>Earn</strong> in the left
              menu
            </li>
            <li>
              Click <strong>Apply</strong> if you see that option (it only
              appears when eligible)
            </li>
            <li>
              Read and agree to the Partner Program terms
            </li>
            <li>
              Sign up for Google AdSense or connect an existing account
            </li>
            <li>
              Set your monetization preferences (ad types you want to show)
            </li>
            <li>
              Submit your channel for review
            </li>
          </ol>
          <p className={s.sectionText}>
            YouTube typically reviews applications within 2 to 4 weeks. During
            review, they check that your channel follows community guidelines
            and that your content is advertiser-friendly. Continue uploading
            quality content while you wait.
          </p>
        </section>

        {/* While You Wait */}
        <section id="while-you-wait" className={s.section}>
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
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </span>
            What to Do While You Wait
          </h2>
          <p className={s.sectionText}>
            If you have not hit the thresholds yet, here is how to get there
            faster:
          </p>
          <h3 className={s.subheading}>For Subscribers</h3>
          <ul className={s.list}>
            <li>
              Create content that gives viewers a reason to come back. Series
              and recurring formats help.
            </li>
            <li>
              Ask for the subscribe after delivering value, not at the start
            </li>
            <li>
              Focus on your niche. Scattered content confuses potential
              subscribers.
            </li>
            <li>
              Check your{" "}
              <Link href="/learn/how-to-get-more-subscribers">
                subscriber conversion rate
              </Link>{" "}
              to see which videos convert best
            </li>
          </ul>
          <h3 className={s.subheading}>For Watch Hours</h3>
          <ul className={s.list}>
            <li>
              Improve{" "}
              <Link href="/learn/youtube-retention-analysis">retention</Link> so
              viewers watch longer
            </li>
            <li>
              Create longer videos if the content supports it (but do not pad
              with filler)
            </li>
            <li>
              Use playlists to encourage viewers to watch multiple videos
            </li>
            <li>
              Focus on evergreen topics that get views for months or years
            </li>
          </ul>
          <h3 className={s.subheading}>For Shorts Views</h3>
          <ul className={s.list}>
            <li>
              Post consistently. Shorts benefit from volume.
            </li>
            <li>
              Hook in the first second. Shorts viewers scroll fast.
            </li>
            <li>
              Link Shorts back to your long form content to build a fuller
              channel
            </li>
          </ul>
        </section>

        {/* Revenue Streams */}
        <section id="revenue-streams" className={s.section}>
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
            Revenue Streams Explained
          </h2>
          <p className={s.sectionText}>
            Here is how to make money on YouTube through different revenue
            streams:
          </p>
          <h3 className={s.subheading}>Ad Revenue</h3>
          <p className={s.sectionText}>
            Once in YPP, you can enable ads on videos. YouTube takes 45%, you
            keep 55%. Earnings vary widely by niche, audience location, and
            seasonality. Finance and business content typically earns more than
            entertainment.
          </p>
          <h3 className={s.subheading}>Sponsorships</h3>
          <p className={s.sectionText}>
            Brands pay creators to feature products or services. Does not
            require YPP. Rates vary from $20 per thousand views for small
            creators to much more for established channels. Always disclose
            sponsored content.
          </p>
          <h3 className={s.subheading}>Affiliate Marketing</h3>
          <p className={s.sectionText}>
            Promote products and earn commission on sales through your links.
            Does not require YPP. Amazon Associates is common, but many
            companies have affiliate programs. Works well for review and
            tutorial content.
          </p>
          <h3 className={s.subheading}>Merchandise</h3>
          <p className={s.sectionText}>
            Sell branded products through YouTube&apos;s merch shelf or external
            stores. Works best when you have an engaged audience who identifies
            with your brand.
          </p>
          <h3 className={s.subheading}>Digital Products and Services</h3>
          <p className={s.sectionText}>
            Sell courses, templates, coaching, or consulting related to your
            expertise. Often the highest earning potential for educational
            creators.
          </p>
        </section>

        {/* Affiliate Basics */}
        <section id="affiliate-basics" className={s.section}>
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
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
              </svg>
            </span>
            Affiliate Marketing Basics for Beginners
          </h2>
          <p className={s.sectionText}>
            Affiliate marketing lets you earn before hitting monetization
            thresholds. Here is how to start:
          </p>
          <ol className={s.numberedList}>
            <li>
              <strong>Join affiliate programs</strong> related to your niche.
              Amazon Associates accepts most creators. Many brands have their
              own programs.
            </li>
            <li>
              <strong>Mention products naturally</strong> in your content when
              relevant. Do not force it.
            </li>
            <li>
              <strong>Add affiliate links</strong> in your video description
              with a clear disclosure
            </li>
            <li>
              <strong>Tell viewers about the links</strong> in the video.
              &ldquo;Links in the description&rdquo; is sufficient.
            </li>
            <li>
              <strong>Track what converts</strong> to focus on products your
              audience actually buys
            </li>
          </ol>
          <p className={s.sectionText}>
            Commission rates vary. Amazon pays 1% to 10% depending on category.
            Software and subscription services often pay higher percentages or
            recurring commissions.
          </p>
        </section>

        {/* Realistic Expectations */}
        <section id="realistic-expectations" className={s.section}>
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
            Realistic Expectations
          </h2>
          <p className={s.sectionText}>
            Be realistic about YouTube income:
          </p>
          <ul className={s.list}>
            <li>
              <strong>Most channels earn little:</strong> The median YouTube
              channel makes very little money. Reaching 1,000 subscribers is an
              accomplishment most creators never achieve.
            </li>
            <li>
              <strong>Ad revenue alone is rarely enough:</strong> Even with
              100,000 subscribers, ad revenue might be $500 to $2,000 per month.
              Successful creators diversify.
            </li>
            <li>
              <strong>Niche matters:</strong> Finance and business content pays
              more per view than entertainment or gaming. Choose your niche
              wisely if income is a priority.
            </li>
            <li>
              <strong>It takes time:</strong> Building a sustainable income
              typically takes years, not months. Plan accordingly.
            </li>
            <li>
              <strong>Consistency compounds:</strong> Channels that upload
              regularly build audiences faster than those that post
              sporadically.
            </li>
          </ul>
          <p className={s.sectionText}>
            For specific numbers, see our guide on{" "}
            <Link href="/learn/how-much-does-youtube-pay">
              how much YouTube pays
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
            Monetization Mistakes to Avoid
          </h2>
          <ul className={s.list}>
            <li>
              <strong>Buying fake subscribers or views:</strong> Gets your
              channel terminated. There are no shortcuts.
            </li>
            <li>
              <strong>Focusing only on ad revenue:</strong> Sponsorships,
              affiliates, and products often pay more. Diversify.
            </li>
            <li>
              <strong>Ignoring community guidelines:</strong> Strikes can delay
              or prevent monetization. Know the rules.
            </li>
            <li>
              <strong>Rushing content to hit thresholds:</strong> Low quality
              videos hurt your channel long term even if they get you monetized
              faster.
            </li>
            <li>
              <strong>Not disclosing sponsorships:</strong> Required by law in
              most countries and by YouTube policy. Always disclose.
            </li>
            <li>
              <strong>Expecting immediate income:</strong> Monetization is a
              milestone, not a destination. Keep improving.
            </li>
          </ul>
        </section>

        {/* CTA Highlight */}
        <div className={s.highlight}>
          <p>
            <strong>Track your path to monetization.</strong> {BRAND.name} shows
            you which videos drive subscribers and watch time, helping you reach
            thresholds faster with data driven decisions.
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
          title="Reach Monetization Faster"
          description={`${BRAND.name} shows you which content drives subscribers and watch time. Make data driven decisions to hit your goals.`}
        />
      </article>
    </main>
  );
}
