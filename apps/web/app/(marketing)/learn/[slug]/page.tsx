import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LEARN_ARTICLES, getRelatedArticles } from "../articles";
import { buildLearnMetadata, buildLearnSchemas } from "../articles/seo";
import {
  StructuredData,
  LearnTopicsNav,
  LearnHero,
  LearnFAQ,
  RelatedArticles,
} from "@/components/learn/server";
import { LearnStaticCTA, LearnToc, normalizeItems } from "@/components/learn";
import { BRAND } from "@/lib/brand";
import s from "../style.module.css";

// Import body components dynamically
import { BODY_COMPONENTS } from "../articles/bodies";

/**
 * Generate static params for all learn articles.
 * This enables SSG - all pages are pre-rendered at build time.
 */
export function generateStaticParams() {
  return Object.values(LEARN_ARTICLES).map((article) => ({
    slug: article.slug,
  }));
}

/**
 * Prevent dynamic rendering for unknown slugs.
 * Returns 404 for any slug not in LEARN_ARTICLES.
 */
export const dynamicParams = false;

/**
 * Generate metadata for each article page.
 */
type ArticleSlug = keyof typeof LEARN_ARTICLES;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = LEARN_ARTICLES[slug as ArticleSlug];
  if (!article) return {};
  return buildLearnMetadata(article);
}

interface LearnArticlePageProps {
  params: Promise<{ slug: string }>;
}

export default async function LearnArticlePage({ params }: LearnArticlePageProps) {
  const { slug } = await params;
  const article = LEARN_ARTICLES[slug as ArticleSlug];

  if (!article) {
    notFound();
  }

  const { articleSchema, faqSchema, breadcrumbSchema } = buildLearnSchemas(article);
  const relatedArticles = getRelatedArticles(article.slug);
  const BodyComponent = BODY_COMPONENTS[slug];

  if (!BodyComponent) {
    notFound();
  }

  const breadcrumb = [
    { label: "Home", href: "/" },
    { label: "Learn", href: "/learn" },
    { label: article.shortTitle },
  ];

  const heroStyles = {
    hero: s.hero,
    breadcrumb: s.breadcrumb,
    title: s.title,
    subtitle: s.subtitle,
  };

  const navStyles = {
    articleNav: s.articleNav,
    articleNavLabel: s.articleNavLabel,
    articleNavLink: s.articleNavLink,
    articleNavLinkActive: s.articleNavLinkActive,
  };

  const faqStyles = {
    faqSection: s.faqSection,
    faqTitle: s.faqTitle,
    faqList: s.faqList,
    faqItem: s.faqItem,
    faqQuestion: s.faqQuestion,
    faqQuestionText: s.faqQuestionText,
    faqChevron: s.faqChevron,
    faqAnswer: s.faqAnswer,
  };

  const relatedStyles = {
    related: s.related,
    relatedTitle: s.relatedTitle,
    relatedLinks: s.relatedLinks,
    relatedLink: s.relatedLink,
  };

  return (
    <main className={s.page}>
      {/* Structured Data - Server rendered for SEO */}
      <StructuredData
        schemas={[articleSchema, faqSchema, breadcrumbSchema]}
      />

      {/* Article Navigation */}
      <LearnTopicsNav styles={navStyles} />

      {/* Hero */}
      <LearnHero
        breadcrumb={breadcrumb}
        title={article.title}
        subtitle={article.metaDescription}
        readingTime={article.readingTime}
        styles={heroStyles}
      />

      {/* Table of Contents - Mobile collapsible, desktop visible */}
      <LearnToc items={normalizeItems(article.toc)} />

      {/* Article Content */}
      <article className={s.content}>
        {/* Main body sections */}
        <BodyComponent s={s} article={article} />

        {/* FAQ Section */}
        <LearnFAQ
          faqs={article.faqs}
          sectionId="faq"
          styles={faqStyles}
        />

        {/* Related Articles */}
        <RelatedArticles
          items={relatedArticles.map((a) => ({ slug: a.slug, title: a.title }))}
          styles={relatedStyles}
        />

        {/* CTA */}
        <LearnStaticCTA
          title={`Learn More About ${article.shortTitle}`}
          description={`${BRAND.name} helps you understand what's working and make better content decisions.`}
        />
      </article>
    </main>
  );
}
