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
        <div className={s.hubBadge}>Learning Center</div>
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
              <span className={s.articleCategory}>{article.category}</span>
              <h2 className={s.articleTitle}>{article.title}</h2>
              <p className={s.articleDescription}>{article.description}</p>
              <div className={s.articleMeta}>
                <span className={s.readTime}>{article.readingTime}</span>
                <span className={s.readMore}>{article.ctaLabel} →</span>
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
