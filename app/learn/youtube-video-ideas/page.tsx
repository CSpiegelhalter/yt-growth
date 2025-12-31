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

const ARTICLE = LEARN_ARTICLES["youtube-video-ideas"];

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

export default function YouTubeVideoIdeasPage() {
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
          YouTube Video Ideas: Data-Driven Content Planning
        </h1>
        <p className={s.subtitle}>
          Learn data-driven methods to generate video ideas that your audience
          actually wants to watch—and never run out of content again.
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
        {/* Why Ideas Fail */}
        <section id="why-ideas-fail" className={s.section}>
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
                <path d="M12 16v-4M12 8h.01" />
              </svg>
            </span>
            Why Most Video Ideas Fail
          </h2>
          <p className={s.sectionText}>
            Most creators brainstorm video ideas based on gut feeling or what
            they personally find interesting. The problem? Your interests don't
            always align with what your audience searches for or what the
            algorithm promotes.
          </p>
          <p className={s.sectionText}>
            Data-driven idea generation flips this approach: start with what
            your audience already engages with, then create content that meets
            that proven demand.
          </p>
        </section>

        {/* 5 Data-Driven Sources */}
        <section id="idea-sources" className={s.section}>
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
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </span>
            5 Data-Driven Sources for Video Ideas
          </h2>
          <ol className={s.numberedList}>
            <li>
              <strong>Your own best performers:</strong> Analyze which of your
              videos got the most views, subscribers, and engagement. Create
              follow-ups, sequels, or deeper dives on those topics.
            </li>
            <li>
              <strong>Competitor outliers:</strong> Find videos that performed
              2-3x above a competitor's average. These indicate topics your
              shared audience cares about.
            </li>
            <li>
              <strong>YouTube search suggestions:</strong> Start typing your
              topic in YouTube search and note the autocomplete suggestions.
              These are queries people actually search for.
            </li>
            <li>
              <strong>Comments on popular videos:</strong> Read comments on top
              videos in your niche. What questions do people ask? What do they
              wish the video covered?
            </li>
            <li>
              <strong>Trending topics in adjacent niches:</strong> Look for
              successful formats or topics in related niches that haven't been
              applied to yours yet.
            </li>
          </ol>
        </section>

        {/* Validating Ideas */}
        <section id="validation" className={s.section}>
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
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            How to Validate an Idea Before You Create
          </h2>
          <p className={s.sectionText}>
            Not every idea is worth your time. Before spending hours creating,
            validate that there's demand and that you can compete.
          </p>
          <ul className={s.list}>
            <li>
              <strong>Search volume check:</strong> Does anyone search for this
              topic? Use YouTube autocomplete to gauge interest
            </li>
            <li>
              <strong>Competition assessment:</strong> How many videos exist on
              this topic? Can you offer something different?
            </li>
            <li>
              <strong>Recency test:</strong> Have recent videos on this topic
              performed well? Old successful videos may indicate saturated
              topics
            </li>
            <li>
              <strong>Audience fit:</strong> Does this align with what your
              current subscribers expect from you?
            </li>
            <li>
              <strong>Packaging potential:</strong> Can you write a compelling
              title and visualize an eye-catching thumbnail?
            </li>
          </ul>
        </section>

        {/* From Idea to Video */}
        <section id="idea-to-video" className={s.section}>
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
                <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </span>
            From Idea to Clickable Video
          </h2>
          <p className={s.sectionText}>
            A good idea needs great packaging to succeed on YouTube. The idea is
            just the starting point.
          </p>
          <ol className={s.numberedList}>
            <li>
              <strong>Start with the title:</strong> If you can't write a
              compelling title, reconsider the idea
            </li>
            <li>
              <strong>Design the thumbnail concept:</strong> What image would
              make someone stop scrolling?
            </li>
            <li>
              <strong>Write the hook:</strong> What are the first words out of
              your mouth? Make them count
            </li>
            <li>
              <strong>Outline the content:</strong> Structure the video to
              deliver value while maintaining retention
            </li>
            <li>
              <strong>Plan the payoff:</strong> What will viewers remember and
              tell others about?
            </li>
          </ol>
        </section>

        {/* ChannelBoost CTA */}
        <div className={s.highlight}>
          <p>
            <strong>{BRAND.name}'s Video Ideas Engine</strong> generates
            personalized content ideas based on what's working in your niche.
            Get proven topics with title options, hook suggestions, and
            thumbnail concepts—all backed by data.
          </p>
        </div>

        {/* FAQ */}
        <section id="faq" className={s.faqSection}>
          <h2 className={s.faqTitle}>Frequently Asked Questions</h2>
          <div className={s.faqList}>
            {ARTICLE.faqs.map((faq, index) => (
              <div key={index} className={s.faqItem}>
                <h3 className={s.faqQuestion}>{faq.question}</h3>
                <p className={s.faqAnswer}>{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Related Articles - Full Cross-Linking */}
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
          title="Never Run Out of Video Ideas"
          description="Get AI-powered video ideas based on what's working in your niche."
        />
      </article>
    </main>
  );
}
