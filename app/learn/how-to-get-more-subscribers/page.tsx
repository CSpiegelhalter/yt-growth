import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { LearnCTA } from "@/components/LearnCTA";
import { learnArticles } from "../articles";
import s from "../style.module.css";

export const metadata: Metadata = {
  title: "How to Get More Subscribers on YouTube: Proven Strategies",
  description:
    "Learn proven strategies to get more YouTube subscribers. Discover which content converts viewers into subscribers and how to optimize your channel for growth.",
  alternates: {
    canonical: `${BRAND.url}/learn/how-to-get-more-subscribers`,
  },
  openGraph: {
    title: "How to Get More Subscribers on YouTube",
    description:
      "Proven strategies to grow your YouTube subscriber count based on data and real channel analysis.",
    url: `${BRAND.url}/learn/how-to-get-more-subscribers`,
    type: "article",
  },
};

export default function HowToGetMoreSubscribersPage() {
  const currentSlug = "how-to-get-more-subscribers";

  return (
    <main className={s.page}>
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
          <Link href="/">Home</Link> / <Link href="/learn">Learn</Link> / Get
          More Subscribers
        </nav>
        <h1 className={s.title}>How to Get More Subscribers on YouTube</h1>
        <p className={s.subtitle}>
          Proven, data-driven strategies to turn viewers into loyal subscribers
          and grow your channel faster.
        </p>
      </header>

      {/* Content */}
      <div className={s.content}>
        {/* Why Subscribers Matter */}
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
                <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            Why Subscribers Matter for YouTube Growth
          </h2>
          <p className={s.sectionText}>
            Subscribers are more than a vanity metric. They&apos;re your
            built-in audience—people who&apos;ve signaled they want to see more
            from you. Subscribers get notified of new uploads and are more
            likely to watch, like, and comment, all of which boost your videos
            in the algorithm.
          </p>
          <div className={s.statsGrid}>
            <div className={s.stat}>
              <div className={s.statValue}>2-5x</div>
              <div className={s.statLabel}>Higher Engagement from Subs</div>
            </div>
            <div className={s.stat}>
              <div className={s.statValue}>1-3%</div>
              <div className={s.statLabel}>Typical View-to-Sub Rate</div>
            </div>
            <div className={s.stat}>
              <div className={s.statValue}>24-48h</div>
              <div className={s.statLabel}>Critical Period for New Videos</div>
            </div>
          </div>
        </section>

        {/* What Converts Viewers */}
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
                <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </span>
            What Actually Converts Viewers to Subscribers
          </h2>
          <p className={s.sectionText}>
            Not all views are equal for subscriber growth. Understanding what
            drives conversions helps you create content that builds your
            audience, not just your view count.
          </p>
          <ul className={s.list}>
            <li>
              <strong>Demonstrated expertise:</strong> Videos that teach
              something valuable make viewers want more
            </li>
            <li>
              <strong>Unique perspective:</strong> Content they can&apos;t get
              elsewhere creates loyalty
            </li>
            <li>
              <strong>Consistent quality:</strong> One great video can get
              views; consistent quality gets subscribers
            </li>
            <li>
              <strong>Clear niche identity:</strong> Viewers subscribe when they
              know what to expect from future videos
            </li>
            <li>
              <strong>Personal connection:</strong> Creators who show
              personality build stronger subscriber relationships
            </li>
          </ul>
        </section>

        {/* Optimization Strategies */}
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
            Proven Subscriber Growth Strategies
          </h2>
          <ol className={s.numberedList}>
            <li>
              <strong>Ask for the subscription (strategically):</strong>{" "}
              Don&apos;t ask in the intro—ask after you&apos;ve delivered value.
              &quot;If this tip helped you, consider subscribing for more.&quot;
            </li>
            <li>
              <strong>Create series content:</strong> Multi-part series give
              viewers a reason to subscribe so they don&apos;t miss the next
              episode.
            </li>
            <li>
              <strong>Optimize your channel page:</strong> Your channel trailer
              should clearly communicate who you help and why they should
              subscribe.
            </li>
            <li>
              <strong>Use end screens effectively:</strong> Promote your best
              converting videos in end screens to keep viewers on your channel.
            </li>
            <li>
              <strong>Double down on what works:</strong> Identify your highest
              subscriber-per-view videos and create more content like them.
            </li>
            <li>
              <strong>Maintain posting consistency:</strong> Regular uploads
              train your audience to expect and look for your content.
            </li>
          </ol>
        </section>

        {/* Subscriber Drivers */}
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
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </span>
            Finding Your Subscriber Driver Videos
          </h2>
          <p className={s.sectionText}>
            Some videos convert viewers to subscribers at 2-3x your channel
            average. These &quot;subscriber driver&quot; videos are
            gold—they&apos;re the content your audience values most.
          </p>
          <ul className={s.list}>
            <li>Check YouTube Studio → Analytics → Subscribers → See more</li>
            <li>
              Sort by &quot;Subscribers gained&quot; to find your top converting
              videos
            </li>
            <li>
              Calculate subscribers per 1,000 views for each video to normalize
              for view count
            </li>
            <li>
              Analyze what your top converters have in common (topic, format,
              length, style)
            </li>
            <li>Create more content that matches those patterns</li>
          </ul>
        </section>

        {/* What NOT to Do */}
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
                <path d="M15 9l-6 6M9 9l6 6" />
              </svg>
            </span>
            Subscriber Growth Mistakes to Avoid
          </h2>
          <ul className={s.list}>
            <li>
              <strong>Begging for subscribers in the intro:</strong> Viewers
              haven&apos;t seen value yet—earn the ask first
            </li>
            <li>
              <strong>Sub4Sub schemes:</strong> These subscribers never watch
              your content and hurt your metrics
            </li>
            <li>
              <strong>Giveaway subscribers:</strong> They subscribed for prizes,
              not content—expect high unsubscribe rates
            </li>
            <li>
              <strong>Inconsistent content:</strong> Posting randomly across
              topics confuses potential subscribers
            </li>
            <li>
              <strong>Ignoring analytics:</strong> Not knowing what converts
              means you can&apos;t optimize for it
            </li>
          </ul>
        </section>

        {/* ChannelBoost CTA */}
        <div className={s.highlight}>
          <p>
            <strong>{BRAND.name}&apos;s Subscriber Drivers feature</strong>{" "}
            automatically identifies your highest-converting videos and shows
            you the patterns that turn viewers into subscribers. Stop guessing
            and start growing.
          </p>
        </div>

        {/* FAQ */}
        <section className={s.faqSection}>
          <h2 className={s.faqTitle}>Frequently Asked Questions</h2>
          <div className={s.faqList}>
            <div className={s.faqItem}>
              <h3 className={s.faqQuestion}>
                What&apos;s a good subscriber-to-view ratio?
              </h3>
              <p className={s.faqAnswer}>
                On average, 1-3% of views convert to subscribers. Higher rates
                indicate content that resonates strongly. If you&apos;re below
                1%, focus on creating content that demonstrates ongoing value.
              </p>
            </div>
            <div className={s.faqItem}>
              <h3 className={s.faqQuestion}>
                How long does it take to get 1,000 subscribers?
              </h3>
              <p className={s.faqAnswer}>
                It varies widely based on niche, content quality, and
                consistency. Some channels reach 1K in months, others take
                years. Focus on creating valuable content
                consistently—subscriber growth follows.
              </p>
            </div>
            <div className={s.faqItem}>
              <h3 className={s.faqQuestion}>Should I buy subscribers?</h3>
              <p className={s.faqAnswer}>
                Never. Bought subscribers don&apos;t watch your content, which
                tanks your engagement metrics. YouTube may also penalize or ban
                channels for artificial inflation. Build real subscribers with
                real content.
              </p>
            </div>
          </div>
        </section>

        {/* Related Links */}
        <nav className={s.related}>
          <h3 className={s.relatedTitle}>Related Topics</h3>
          <div className={s.relatedLinks}>
            <Link href="/learn/youtube-channel-audit" className={s.relatedLink}>
              Channel Audit
            </Link>
            <Link
              href="/learn/youtube-retention-analysis"
              className={s.relatedLink}
            >
              Retention Analysis
            </Link>
            <Link href="/learn/youtube-video-ideas" className={s.relatedLink}>
              Video Ideas
            </Link>
          </div>
        </nav>

        {/* CTA */}
        <LearnCTA
          title="Find Your Subscriber Drivers"
          description={`Discover which videos convert viewers to subscribers with ${BRAND.name}.`}
          className={s.cta}
        />
      </div>
    </main>
  );
}
