import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { learnArticles } from "./articles";
import s from "./style.module.css";

export const metadata: Metadata = {
  title: `YouTube Growth Guides: Free Tutorials for Creators (2025) | ${BRAND.name}`,
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
    title: `YouTube Growth Guides | ${BRAND.name}`,
    description:
      "Free guides to help you grow your YouTube channel with data-driven strategies.",
    url: `${BRAND.url}/learn`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `YouTube Growth Guides | ${BRAND.name}`,
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
          Grow Your YouTube Channel
          <br />
          <span className={s.hubTitleAccent}>With Data-Driven Strategies</span>
        </h1>
        <p className={s.hubSubtitle}>
          Free guides and tutorials to help you understand your analytics,
          optimize your content, and grow faster. No fluff, just actionable
          insights.
        </p>
      </header>

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
                    Read guide
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
        <h2 className={s.valueSectionTitle}>What You'll Learn</h2>
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

      {/* Bottom CTA */}
      <section className={s.hubCta}>
        <h2 className={s.hubCtaTitle}>Ready to Put This Into Practice?</h2>
        <p className={s.hubCtaText}>
          {BRAND.name} automates these analyses and gives you personalized
          insights for your channel.
        </p>
        <div className={s.hubCtaButtons}>
          <Link href="/dashboard" className={s.hubCtaPrimary}>
            Get Started Free
          </Link>
          <Link href="/" className={s.hubCtaSecondary}>
            Learn More
          </Link>
        </div>
      </section>
    </main>
  );
}
