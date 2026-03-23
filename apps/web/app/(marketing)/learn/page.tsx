import type { Metadata } from "next";
import Link from "next/link";

import { MarketingHeroBand } from "@/components/marketing/MarketingHeroBand";
import { FaqSection } from "@/components/ui/FaqSection";
import { LEARN_INDEX_CONTENT } from "@/lib/content/learn-index";
import { BRAND } from "@/lib/shared/brand";

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

export default function LearnPage() {
  const content = LEARN_INDEX_CONTENT;

  // Get article by slug helper
  const getArticle = (slug: string) =>
    learnArticles.find((a) => a.slug === slug);

  return (
    <main className={s.learnHub}>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      {/* Hero */}
      <MarketingHeroBand>
        <p className={s.heroBadge}>{BRAND.name} Blog Posts</p>
        <h1 className={s.heroTitle}>
          {content.hero.title}{" "}
          <span className={s.heroTitleAccent}>{content.hero.titleAccent}</span>
        </h1>
      </MarketingHeroBand>

      {/* Subtitle */}
      <section className={s.subtitleSection}>
        <p className={s.subtitleText}>{content.hero.subtitle}</p>
      </section>

      {/* Intro + Value Props */}
      <section className={s.introSection}>
        <p className={s.introText}>{content.intro.text}</p>
        <div className={s.highlightsGrid}>
          {content.intro.highlights.map((h, i) => (
            <div key={i} className={s.highlightItem}>
              <svg
                className={s.highlightIcon}
                width="30"
                height="30"
                viewBox="0 0 30 30"
                fill="none"
              >
                <circle
                  cx="15"
                  cy="15"
                  r="14"
                  stroke="var(--color-hot-rose)"
                  strokeWidth="1.5"
                />
                <path
                  d="M10 15.5l3.5 3.5 6.5-7"
                  stroke="var(--color-hot-rose)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className={s.highlightText}>{h}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Start Here */}
      <section className={s.startHereCard}>
        <h2 className={s.startHereTitle}>{content.startHere.title}</h2>
        <p className={s.startHereDesc}>{content.startHere.description}</p>
        <div className={s.startHerePills}>
          {content.startHere.guides.map((guide) => {
            const article = getArticle(guide.slug);
            return (
              <div key={guide.slug} className={s.startHerePillGroup}>
                <Link
                  href={`/learn/${guide.slug}`}
                  className={s.startHerePill}
                >
                  {article?.title ?? guide.slug}
                </Link>
                <p className={s.startHerePillDesc}>{guide.reason}</p>
              </div>
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
              <h2 className={s.articleTitle}>{article.title}</h2>
              <span className={s.articleCategory}>{article.category}</span>
              <p className={s.articleDescription}>{article.description}</p>
              <div className={s.articleMeta}>
                <span className={s.readTime}>{article.readingTime}</span>
                <span className={s.readMore}>
                  {article.ctaLabel}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
                </span>
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
      <FaqSection
        title={content.faq.title}
        items={content.faq.items}
        classes={{
          section: s.learnFaqSection,
          title: s.learnFaqTitle,
          list: s.learnFaqList,
          item: s.learnFaqItem,
          question: s.learnFaqQuestion,
          answer: s.learnFaqAnswer,
        }}
      />

      {/* Bottom CTA */}
      <section className={s.hubCta}>
        <h2 className={s.hubCtaTitle}>{content.cta.title}</h2>
        <p className={s.hubCtaText}>{content.cta.description}</p>
        <div className={s.hubCtaButtons}>
          <Link
            href={content.cta.primaryButton.href}
            className={s.hubCtaPrimary}
          >
            {content.cta.primaryButton.label}
          </Link>
          <Link
            href={content.cta.secondaryButton.href}
            className={s.hubCtaSecondary}
          >
            {content.cta.secondaryButton.label}
          </Link>
        </div>
      </section>
    </main>
  );
}
