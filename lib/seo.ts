/**
 * SEO utilities and structured data generators
 */
import { BRAND } from "./brand";

export type ArticleSchemaProps = {
  title: string;
  description: string;
  slug: string;
  datePublished?: string;
  dateModified?: string;
};

/**
 * Generate Article JSON-LD schema for Learn pages
 */
export function generateArticleSchema({
  title,
  description,
  slug,
  datePublished = "2024-01-15",
  dateModified = new Date().toISOString().split("T")[0],
}: ArticleSchemaProps): object {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: `${BRAND.url}/learn/${slug}`,
    datePublished,
    dateModified,
    author: {
      "@type": "Organization",
      name: BRAND.name,
      url: BRAND.url,
    },
    publisher: {
      "@type": "Organization",
      name: BRAND.name,
      url: BRAND.url,
      logo: {
        "@type": "ImageObject",
        url: `${BRAND.url}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${BRAND.url}/learn/${slug}`,
    },
  };
}

/**
 * Generate BreadcrumbList JSON-LD schema
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

