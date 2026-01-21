import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { LEARN_INDEX_CONTENT } from "@/lib/content/learn-index";
import { learnArticles } from "./articles";
import s from "./style.module.css";

export const metadata: Metadata = {
  title: "YouTube Growth Guides (2026)",
  description:
    "Free YouTube growth guides and tutorials. Learn channel auditing, retention analysis, competitor research, video ideas, and proven strategies to get more subscribers.",
  keywords: [
    "youtube growth",
    "youtube tutorials",
    "youtube guides",
    "channel audit",
    "retention analysis",
    "get more subscribers",
  ],
  alternates: {
    canonical: `${BRAND.url}/learn`,
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
    title: "YouTube Growth Guides (2026)",
    description:
      "Free guides to help you grow your YouTube channel with data-driven strategies.",
    url: `${BRAND.url}/learn`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "YouTube Growth Guides (2026)",
    description:
      "Free guides to help you grow your YouTube channel with data-driven strategies.",
  },
};

// ItemList schema for the article collection
const itemListSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "YouTube Growth Guides",
  description:
    "Free YouTube growth guides and tutorials covering channel audits, retention analysis, competitor research, and subscriber growth strategies.",
  url: `${BRAND.url}/learn`,
  publisher: {
    "@type": "Organization",
    name: BRAND.name,
    url: BRAND.url,
  },
  mainEntity: {
    "@type": "ItemList",
    itemListElement: learnArticles.map((article, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${BRAND.url}/learn/${article.slug}`,
      name: article.title,
      description: article.description,
    })),
  },
};

function ArticleIcon({ type }: { type: string }) {
  const props = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (type) {
    case "youtube-channel-audit":
      return (
        <svg {...props}>
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 12h6M9 16h6" />
        </svg>
      );
    case "youtube-retention-analysis":
      return (
        <svg {...props}>
          <path d="M3 3v18h18" />
          <path d="M18 9l-5 5-4-4-3 3" />
        </svg>
      );
    case "how-to-get-more-subscribers":
      return (
        <svg {...props}>
          <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M19 8v6M22 11h-6" />
        </svg>
      );
    case "youtube-competitor-analysis":
      return (
        <svg {...props}>
          <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 1012 0V2z" />
        </svg>
      );
    case "youtube-video-ideas":
      // Lightbulb icon
      return (
        <svg {...props}>
          <path d="M9 18h6" />
          <path d="M10 22h4" />
          <path d="M12 2a7 7 0 00-4 12.9V16a1 1 0 001 1h6a1 1 0 001-1v-1.1A7 7 0 0012 2z" />
        </svg>
      );
    case "how-to-make-a-youtube-channel":
      // Play button with plus
      return (
        <svg {...props}>
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          <path d="M10 8l6 4-6 4V8z" />
        </svg>
      );
    case "youtube-monetization-requirements":
      // Checkmark badge
      return (
        <svg {...props}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case "how-much-does-youtube-pay":
      // Dollar sign
      return (
        <svg {...props}>
          <path d="M12 2v20" />
          <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
      );
    case "youtube-seo":
      // Search/magnifying glass
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
          <path d="M11 8v6M8 11h6" />
        </svg>
      );
    case "free-youtube-subscribers":
      // Users with heart
      return (
        <svg {...props}>
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87" />
          <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
      );
    case "how-to-promote-youtube-videos":
      // Megaphone/promotion icon
      return (
        <svg {...props}>
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      );
    case "how-to-see-your-subscribers-on-youtube":
      // Eye/view icon
      return (
        <svg {...props}>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "how-to-go-live-on-youtube":
      // Live/broadcast icon
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="2" />
          <path d="M16.24 7.76a6 6 0 010 8.49m-8.48-.01a6 6 0 010-8.49m11.31-2.82a10 10 0 010 14.14m-14.14 0a10 10 0 010-14.14" />
        </svg>
      );
    case "buy-youtube-subscribers":
    case "buy-youtube-views":
      // Warning icon
      return (
        <svg {...props}>
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case "youtube-analytics-tools":
      // Analytics/chart icon
      return (
        <svg {...props}>
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      );
    case "find-similar-youtube-channels":
      // Search/discover icon
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      );
    case "how-to-be-a-youtuber":
      // Star icon
      return (
        <svg {...props}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    case "youtube-tag-generator":
      // Tag icon
      return (
        <svg {...props}>
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      );
    case "youtube-shorts-length":
      // Clock/duration icon
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case "youtube-shorts-monetization":
      // Shorts + money icon
      return (
        <svg {...props}>
          <rect x="6" y="2" width="12" height="20" rx="2" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <path d="M14 10h-3a1 1 0 000 2h2a1 1 0 010 2h-3" />
        </svg>
      );
    case "youtube-algorithm":
      // Algorithm/network icon
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      );
    default:
      // Default document icon
      return (
        <svg {...props}>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M16 13H8M16 17H8M10 9H8" />
        </svg>
      );
  }
}

export default function LearnPage() {
  const content = LEARN_INDEX_CONTENT;

  // Get article by slug helper
  const getArticle = (slug: string) => learnArticles.find((a) => a.slug === slug);

  return (
    <main className={s.learnHub}>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      {/* Hero */}
      <header className={s.hubHero}>
        <div className={s.hubBadge}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
          </svg>
          Learning Center
        </div>
        <h1 className={s.hubTitle}>
          {content.hero.title}
          <br />
          <span className={s.hubTitleAccent}>{content.hero.titleAccent}</span>
        </h1>
        <p className={s.hubSubtitle}>{content.hero.subtitle}</p>
      </header>

      {/* Intro Section - SEO text content */}
      <section className={s.introSection}>
        <p className={s.introText}>{content.intro.text}</p>
        <ul className={s.introHighlights}>
          {content.intro.highlights.map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ul>
      </section>

      {/* Start Here Section */}
      <section className={s.startHereSection}>
        <h2 className={s.startHereTitle}>{content.startHere.title}</h2>
        <p className={s.startHereDesc}>{content.startHere.description}</p>
        <div className={s.startHereGuides}>
          {content.startHere.guides.map((guide) => {
            const article = getArticle(guide.slug);
            return (
              <Link
                key={guide.slug}
                href={`/learn/${guide.slug}`}
                className={s.startHereGuide}
              >
                <span className={s.startHereGuideTitle}>
                  {article?.title ?? guide.slug}
                </span>
                <p className={s.startHereGuideReason}>{guide.reason}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Articles Grid */}
      <section className={s.articlesSection} aria-label="YouTube growth guides">
        <div className={s.articlesGrid}>
          {learnArticles.map((article) => (
            <Link
              key={article.slug}
              href={`/learn/${article.slug}`}
              className={s.articleCard}
            >
              <div className={s.articleIcon}>
                <ArticleIcon type={article.slug} />
              </div>
              <div className={s.articleContent}>
                <span className={s.articleCategory}>{article.category}</span>
                <h2 className={s.articleTitle}>{article.title}</h2>
                <p className={s.articleDescription}>{article.description}</p>
                <div className={s.articleMeta}>
                  <span className={s.readTime}>{article.readingTime}</span>
                  <span className={s.readMore}>
                    {article.ctaLabel}
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* What You'll Learn */}
      <section className={s.valueSection}>
        <h2 className={s.valueSectionTitle}>What You&apos;ll Learn</h2>
        <div className={s.valueGrid}>
          <div className={s.valueItem}>
            <h3>Understand Your Analytics</h3>
            <p>
              Learn to read retention curves, identify drop-off patterns, and
              understand which metrics actually matter for growth.
            </p>
          </div>
          <div className={s.valueItem}>
            <h3>Find Content That Works</h3>
            <p>
              Discover data-driven methods to generate video ideas your audience
              wants and learn from competitor successes.
            </p>
          </div>
          <div className={s.valueItem}>
            <h3>Grow Your Audience</h3>
            <p>
              Apply proven strategies to turn viewers into subscribers and build
              a loyal audience that watches your content.
            </p>
          </div>
        </div>
      </section>

      {/* Categories Section - Browse by Topic */}
      <section className={s.categoriesSection}>
        <h2 className={s.categoriesSectionTitle}>Browse Guides by Topic</h2>
        <div className={s.categoriesGrid}>
          {content.categories.map((cat) => (
            <div key={cat.id} className={s.categoryCard}>
              <h3 className={s.categoryTitle}>{cat.title}</h3>
              <p className={s.categoryDesc}>{cat.description}</p>
              <div className={s.categoryLinks}>
                {cat.relatedSlugs.map((slug) => {
                  const article = getArticle(slug);
                  return (
                    <Link
                      key={slug}
                      href={`/learn/${slug}`}
                      className={s.categoryLink}
                    >
                      {article?.title ?? article?.label ?? slug}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className={s.learnFaqSection}>
        <h2 className={s.learnFaqTitle}>{content.faq.title}</h2>
        <div className={s.learnFaqList}>
          {content.faq.items.map((faq, idx) => (
            <details key={idx} className={s.learnFaqItem}>
              <summary className={s.learnFaqQuestion}>{faq.question}</summary>
              <p className={s.learnFaqAnswer}>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className={s.hubCta}>
        <h2 className={s.hubCtaTitle}>{content.cta.title}</h2>
        <p className={s.hubCtaText}>{content.cta.description}</p>
        <div className={s.hubCtaButtons}>
          <Link href={content.cta.primaryButton.href} className={s.hubCtaPrimary}>
            {content.cta.primaryButton.label}
          </Link>
          <Link href={content.cta.secondaryButton.href} className={s.hubCtaSecondary}>
            {content.cta.secondaryButton.label}
          </Link>
        </div>
      </section>
    </main>
  );
}
