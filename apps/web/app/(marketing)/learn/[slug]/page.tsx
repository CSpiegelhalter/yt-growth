import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LEARN_ARTICLES, getRelatedArticles } from "../articles";
import { buildLearnMetadata, buildLearnSchemas } from "../articles/seo";
import { ARTICLE_REGISTRY } from "../articles/registry";
import { ArticleShell } from "../articles/_components/ArticleShell";
import {
  StructuredData,
  LearnTopicsNav,
  LearnFAQ,
  RelatedArticles,
} from "@/components/learn/server";
import { LearnStaticCTA, normalizeItems } from "@/components/learn";
import { BRAND } from "@/lib/brand";
import s from "../style.module.css";

export function generateStaticParams() {
  return Object.values(LEARN_ARTICLES).map((article) => ({
    slug: article.slug,
  }));
}

export const dynamicParams = false;

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

  const loader = ARTICLE_REGISTRY[slug];
  if (!loader) {
    notFound();
  }

  const { Body: BodyComponent } = await loader();

  const { articleSchema, faqSchema, breadcrumbSchema } = buildLearnSchemas(article);
  const relatedArticles = getRelatedArticles(article.slug);
  const tocItems = normalizeItems(article.toc);

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
      <StructuredData
        schemas={[articleSchema, faqSchema, breadcrumbSchema]}
      />

      <LearnTopicsNav styles={navStyles} />

      <ArticleShell
        title={article.title}
        description={article.metaDescription}
        toc={tocItems}
      >
        <article className={s.content}>
          <BodyComponent s={s} article={article} />

          <LearnFAQ
            faqs={article.faqs}
            sectionId="faq"
            styles={faqStyles}
          />

          <RelatedArticles
            items={relatedArticles.map((a) => ({ slug: a.slug, title: a.title }))}
            styles={relatedStyles}
          />

          <LearnStaticCTA
            title={`Learn More About ${article.shortTitle}`}
            description={`${BRAND.name} helps you understand what's working and make better content decisions.`}
          />
        </article>
      </ArticleShell>
    </main>
  );
}
