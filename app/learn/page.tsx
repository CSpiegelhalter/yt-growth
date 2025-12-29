import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import s from "./style.module.css";

export const metadata: Metadata = {
  title: `YouTube Growth Guide: Learn to Grow Your Channel | ${BRAND.name}`,
  description:
    "Free YouTube growth guides and tutorials. Learn channel auditing, retention analysis, competitor research, and proven strategies to get more subscribers.",
  alternates: {
    canonical: `${BRAND.url}/learn`,
  },
  openGraph: {
    title: `YouTube Growth Guide | ${BRAND.name}`,
    description:
      "Free guides to help you grow your YouTube channel with data-driven strategies.",
    url: `${BRAND.url}/learn`,
    type: "website",
  },
};

const articles = [
  {
    slug: "youtube-channel-audit",
    title: "YouTube Channel Audit",
    description:
      "Learn how to analyze your channel's performance and identify growth opportunities with data-driven insights.",
    icon: "audit",
    readTime: "8 min read",
  },
  {
    slug: "youtube-retention-analysis",
    title: "Retention Analysis",
    description:
      "Understand where viewers drop off and how to keep them watching longer to boost your video performance.",
    icon: "retention",
    readTime: "7 min read",
  },
  {
    slug: "how-to-get-more-subscribers",
    title: "Get More Subscribers",
    description:
      "Proven strategies to turn viewers into loyal subscribers and grow your channel faster.",
    icon: "subscribers",
    readTime: "9 min read",
  },
  {
    slug: "youtube-competitor-analysis",
    title: "Competitor Analysis",
    description:
      "Learn how to analyze successful channels in your niche and find content opportunities they're missing.",
    icon: "competitors",
    readTime: "6 min read",
  },
  {
    slug: "youtube-video-ideas",
    title: "Video Ideas Generator",
    description:
      "Data-driven methods to generate video ideas that your audience actually wants to watch.",
    icon: "ideas",
    readTime: "7 min read",
  },
];

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
  };

  switch (type) {
    case "audit":
      return (
        <svg {...props}>
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 12h6M9 16h6" />
        </svg>
      );
    case "retention":
      return (
        <svg {...props}>
          <path d="M3 3v18h18" />
          <path d="M18 9l-5 5-4-4-3 3" />
        </svg>
      );
    case "subscribers":
      return (
        <svg {...props}>
          <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M19 8v6M22 11h-6" />
        </svg>
      );
    case "competitors":
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
    case "ideas":
      return (
        <svg {...props}>
          <path d="M12 2v1M4.22 4.22l.71.71M1 12h2M18.36 4.93l.71-.71M23 12h-2" />
          <path d="M15.5 15a3.5 3.5 0 10-7 0c0 1.57.75 2.97 1.91 3.85.34.26.59.63.59 1.06V21h4v-1.09c0-.43.25-.8.59-1.06A3.98 3.98 0 0015.5 15z" />
          <path d="M9 18h6M10 22h4" />
        </svg>
      );
    default:
      return null;
  }
}

export default function LearnPage() {
  return (
    <main className={s.learnHub}>
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
      <section className={s.articlesSection}>
        <div className={s.articlesGrid}>
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/learn/${article.slug}`}
              className={s.articleCard}
            >
              <div className={s.articleIcon}>
                <ArticleIcon type={article.icon} />
              </div>
              <div className={s.articleContent}>
                <h2 className={s.articleTitle}>{article.title}</h2>
                <p className={s.articleDescription}>{article.description}</p>
                <div className={s.articleMeta}>
                  <span className={s.readTime}>{article.readTime}</span>
                  <span className={s.readMore}>
                    Read guide
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
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

      {/* Bottom CTA */}
      <section className={s.hubCta}>
        <h2 className={s.hubCtaTitle}>Ready to Put This Into Practice?</h2>
        <p className={s.hubCtaText}>
          {BRAND.name} automates these analyses and gives you personalized
          insights for your channel.
        </p>
        <div className={s.hubCtaButtons}>
          <Link href="/auth/signup" className={s.hubCtaPrimary}>
            Get Started Free
          </Link>
          <Link href="/dashboard" className={s.hubCtaSecondary}>
            Go to Dashboard
          </Link>
        </div>
      </section>

      {/* Schema.org for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "YouTube Growth Guide",
            description:
              "Free YouTube growth guides and tutorials covering channel audits, retention analysis, and subscriber growth strategies.",
            url: `${BRAND.url}/learn`,
            mainEntity: {
              "@type": "ItemList",
              itemListElement: articles.map((article, index) => ({
                "@type": "ListItem",
                position: index + 1,
                url: `${BRAND.url}/learn/${article.slug}`,
                name: article.title,
              })),
            },
          }),
        }}
      />
    </main>
  );
}

