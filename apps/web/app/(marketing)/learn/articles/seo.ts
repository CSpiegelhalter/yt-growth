import type { Metadata } from "next";
import { BRAND } from "@/lib/shared/brand";
import { generateBreadcrumbSchema } from "@/lib/shared/seo";
import {
  type LearnArticle,
  generateLearnArticleSchema,
  generateFaqSchema,
} from "../articles";

/**
 * Build Next.js Metadata object for a learn article.
 * Produces identical output to current per-page metadata exports.
 */
export function buildLearnMetadata(article: LearnArticle): Metadata {
  return {
    title: article.title,
    description: article.metaDescription,
    keywords: [...article.keywords],
    alternates: {
      canonical: `${BRAND.url}/learn/${article.slug}`,
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
      title: article.title,
      description: article.metaDescription,
      url: `${BRAND.url}/learn/${article.slug}`,
      type: "article",
      publishedTime: article.datePublished,
      modifiedTime: article.dateModified,
      authors: [`${BRAND.name} Team`],
    },
    twitter: {
      card: "summary_large_image",
      title: article.shortTitle,
      description: article.metaDescription,
    },
  };
}

/**
 * Build all JSON-LD schemas for a learn article.
 * Returns objects ready to be serialized and rendered in <script> tags.
 */
export function buildLearnSchemas(article: LearnArticle) {
  const articleSchema = generateLearnArticleSchema(article);
  const faqSchema = generateFaqSchema(article.faqs);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: BRAND.url },
    { name: "Learn", url: `${BRAND.url}/learn` },
    { name: article.shortTitle, url: `${BRAND.url}/learn/${article.slug}` },
  ]);

  return { articleSchema, faqSchema, breadcrumbSchema };
}
