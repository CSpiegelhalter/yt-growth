import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { LearnCTA } from "@/components/LearnCTA";
import { learnArticles } from "../articles";
import { generateArticleSchema, generateBreadcrumbSchema } from "@/lib/seo";
import s from "../style.module.css";

const ARTICLE = {
  slug: "youtube-video-ideas",
  title: "YouTube Video Ideas Generator: How to Never Run Out of Content",
  description:
    "Learn proven methods to generate YouTube video ideas that get views. Discover data-driven approaches to find topics your audience actually wants to watch.",
};

export const metadata: Metadata = {
  title: ARTICLE.title,
  description: ARTICLE.description,
  alternates: {
    canonical: `${BRAND.url}/learn/${ARTICLE.slug}`,
  },
  openGraph: {
    title: "YouTube Video Ideas: Complete Guide to Content Planning",
    description:
      "Never run out of video ideas. Learn data-driven methods to find topics that resonate with your audience.",
    url: `${BRAND.url}/learn/${ARTICLE.slug}`,
    type: "article",
  },
};

const articleSchema = generateArticleSchema(ARTICLE);
const breadcrumbSchema = generateBreadcrumbSchema([
  { name: "Home", url: BRAND.url },
  { name: "Learn", url: `${BRAND.url}/learn` },
  { name: "Video Ideas", url: `${BRAND.url}/learn/${ARTICLE.slug}` },
]);

export default function YouTubeVideoIdeasPage() {
  const currentSlug = ARTICLE.slug;

  return (
    <main className={s.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* Article Navigation */}
      <nav className={s.articleNav}>
        <span className={s.articleNavLabel}>Topics:</span>
        {learnArticles.map((article) => (
          <Link
            key={article.slug}
            href={`/learn/${article.slug}`}
            className={`${s.articleNavLink} ${
              article.slug === currentSlug ? s.articleNavLinkActive : ""
            }`}
          >
            {article.label}
          </Link>
        ))}
      </nav>

      {/* Hero */}
      <header className={s.hero}>
        <nav className={s.breadcrumb}>
          <Link href="/">Home</Link> / <Link href="/learn">Learn</Link> / Video
          Ideas
        </nav>
        <h1 className={s.title}>YouTube Video Ideas Generator</h1>
        <p className={s.subtitle}>
          Learn data-driven methods to generate video ideas that your audience
          actually wants to watch—and never run out of content again.
        </p>
      </header>

      {/* Content */}
      <div className={s.content}>
        {/* The Problem with Random Ideas */}
        <section className={s.section}>
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

        {/* Sources for Ideas */}
        <section className={s.section}>
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

        {/* Idea Validation */}
        <section className={s.section}>
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

        {/* Turning Ideas into Videos */}
        <section className={s.section}>
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
        <section className={s.faqSection}>
          <h2 className={s.faqTitle}>Frequently Asked Questions</h2>
          <div className={s.faqList}>
            <div className={s.faqItem}>
              <h3 className={s.faqQuestion}>
                How often should I generate new video ideas?
              </h3>
              <p className={s.faqAnswer}>
                Build a backlog of 10-20 validated ideas so you always have
                options. Spend 1-2 hours weekly on idea research and validation.
                This prevents creative blocks and rushed content decisions.
              </p>
            </div>
            <div className={s.faqItem}>
              <h3 className={s.faqQuestion}>
                Should I follow trends or create evergreen content?
              </h3>
              <p className={s.faqAnswer}>
                Both have value. Trends can spike your channel visibility
                quickly, while evergreen content provides steady long-term
                views. A healthy mix of 30% trendy and 70% evergreen often works
                well.
              </p>
            </div>
            <div className={s.faqItem}>
              <h3 className={s.faqQuestion}>
                How do I know if an idea is too competitive?
              </h3>
              <p className={s.faqAnswer}>
                Search for the topic and check the view counts on recent videos
                from channels your size. If similar-sized channels are getting
                views, you can compete. If only mega-channels rank, find a more
                specific angle.
              </p>
            </div>
          </div>
        </section>

        {/* Related Links */}
        <nav className={s.related}>
          <h3 className={s.relatedTitle}>Related Topics</h3>
          <div className={s.relatedLinks}>
            <Link
              href="/learn/youtube-competitor-analysis"
              className={s.relatedLink}
            >
              Competitor Analysis
            </Link>
            <Link
              href="/learn/youtube-retention-analysis"
              className={s.relatedLink}
            >
              Retention Analysis
            </Link>
            <Link
              href="/learn/how-to-get-more-subscribers"
              className={s.relatedLink}
            >
              Get More Subscribers
            </Link>
          </div>
        </nav>

        {/* CTA */}
        <LearnCTA
          title="Never Run Out of Video Ideas"
          description="Get AI-powered video ideas based on what's working in your niche."
          className={s.cta}
        />
      </div>
    </main>
  );
}
