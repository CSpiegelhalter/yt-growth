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

const ARTICLE = LEARN_ARTICLES["how-to-get-more-subscribers"];

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

export default function HowToGetMoreSubscribersPage() {
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
        <h1 className={s.title}>How to Get More Subscribers on YouTube</h1>
        <p className={s.subtitle}>
          You're getting views but not subscribers. This guide shows you how to
          check your YouTube analytics, find what actually converts viewers, and
          build an audience that comes back for every video.
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
        {/* Why Subscribers Matter */}
        <section id="why-subscribers-matter" className={s.section}>
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
            Your subscriber count is not just a vanity metric. Subscribers are
            people who told YouTube they want to see more from you. When you
            upload a new video, subscribers often watch it first, giving your
            content early momentum that signals quality to the algorithm.
          </p>
          <p className={s.sectionText}>
            Channels with engaged subscribers typically see faster initial
            velocity on new uploads. Those early views, likes, and comments help
            YouTube decide whether to show your video to a broader audience.
            Without subscribers, every video starts from zero.
          </p>
          <div className={s.statsGrid}>
            <div className={s.stat}>
              <div className={s.statValue}>Early Views</div>
              <div className={s.statLabel}>
                Subscribers often watch within 24 hours
              </div>
            </div>
            <div className={s.stat}>
              <div className={s.statValue}>1 to 3%</div>
              <div className={s.statLabel}>
                Typical viewer to subscriber rate (varies by niche)
              </div>
            </div>
            <div className={s.stat}>
              <div className={s.statValue}>Predictable</div>
              <div className={s.statLabel}>
                Subscribers create baseline views you can count on
              </div>
            </div>
          </div>
          <p className={s.sectionText}>
            The real value is predictability. A channel with 10,000 engaged
            subscribers has a built-in audience for every video. A channel with
            10,000 one-time viewers has to find a new audience every time. If
            you want to understand why some videos take off while others don't,
            read our{" "}
            <Link href="/learn/youtube-channel-audit">channel audit guide</Link>{" "}
            for a full breakdown.
          </p>
        </section>

        {/* 15 Minute Checklist */}
        <section id="subscriber-checklist" className={s.section}>
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
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </span>
            How to Get More Subscribers on YouTube (15 Minute Checklist)
          </h2>
          <p className={s.sectionText}>
            If you want to get subscribers faster, run through this checklist.
            Each item takes a few minutes and addresses a common reason viewers
            watch but don't subscribe.
          </p>
          <ol className={s.numberedList}>
            <li>
              <strong>Check your subscriber count trend.</strong> In YouTube
              Studio, look at Analytics and see if your subscriber count is
              growing, flat, or declining over the last 28 days.
            </li>
            <li>
              <strong>Find your best converting video.</strong> Go to Analytics,
              then Audience, then Subscribers. Sort by "Subscribers gained" to
              see which video brought in the most subscribers.
            </li>
            <li>
              <strong>Watch your top video's first 30 seconds.</strong> Does it
              clearly explain what the video delivers? Viewers decide quickly
              whether this channel is for them.
            </li>
            <li>
              <strong>Check if you ask for the subscribe.</strong> Most creators
              either never ask or ask too early. The best time is after you have
              delivered your first piece of value.
            </li>
            <li>
              <strong>Review your channel page.</strong> If someone clicks your
              profile, does your banner and about section explain who you help
              and what content you make?
            </li>
            <li>
              <strong>Look at your recent video titles.</strong> Do they make it
              clear what your channel is about? Consistency helps viewers
              understand what subscribing means.
            </li>
            <li>
              <strong>Check your end screens.</strong> Are you promoting another
              video that keeps viewers on your channel? End screens drive both
              watch time and subscriptions.
            </li>
            <li>
              <strong>Review your posting consistency.</strong> Subscribers
              expect regular content. If you post randomly, viewers may not see
              the point in subscribing.
            </li>
          </ol>
        </section>

        {/* How to See Subscribers */}
        <section id="see-subscribers" className={s.section}>
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
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </span>
            How to See Your Subscribers on YouTube
          </h2>
          <p className={s.sectionText}>
            YouTube gives you several ways to check your subscriber count and
            understand who is subscribing. Here's exactly where to find each
            piece of information.
          </p>
          <ul className={s.list}>
            <li>
              <strong>Total subscriber count:</strong> Open YouTube Studio and
              look at the dashboard. Your subscriber count appears at the top.
              You can also see it in the Analytics section under Overview.
            </li>
            <li>
              <strong>Subscribers gained over time:</strong> In YouTube Studio,
              go to Analytics, then click the Audience tab. You'll see a graph
              of subscriber growth and can change the date range.
            </li>
            <li>
              <strong>Subscribers by video:</strong> In Analytics, go to
              Audience, then click "See more" under Subscribers. Change the view
              to show subscribers by content. This reveals which videos drive
              the most new subscribers.
            </li>
            <li>
              <strong>Who subscribed to you:</strong> You can see some
              subscriber names in YouTube Studio under Recent Subscribers, but
              only those who set their subscriptions to public. Most subscribers
              keep this private, so you will only see a fraction.
            </li>
          </ul>
          <p className={s.sectionText}>
            Understanding where subscribers come from helps you create more of
            what works. If one video brings in 10x more subscribers than others,
            that's a signal worth following.
          </p>
        </section>

        {/* YouTube Analytics */}
        <section id="youtube-analytics" className={s.section}>
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
            Analytics in YouTube: The Numbers That Predict Subscriber Growth
          </h2>
          <p className={s.sectionText}>
            YouTube stats can be overwhelming, but only a few metrics directly
            predict subscriber growth. Focus on these numbers in your YouTube
            analytics and ignore the rest until you have these dialed in.
          </p>
          <ul className={s.list}>
            <li>
              <strong>Subscribers per 1,000 views:</strong> Calculate this by
              dividing subscribers gained by views, then multiply by 1,000. Many
              channels see 10 to 30 subscribers per 1,000 views. Below 10
              suggests your content doesn't give viewers a reason to return.
              Above 30 means you're doing something right.
            </li>
            <li>
              <strong>Returning viewers:</strong> In Analytics under Audience,
              check what percentage of views come from returning viewers vs new
              viewers. High returning viewer percentage means subscribers are
              actually watching. If it's very low, your subscribers may have
              gone inactive.
            </li>
            <li>
              <strong>Average view duration:</strong> Viewers who watch longer
              are more likely to subscribe. If your average view duration is
              below 40% of video length, work on{" "}
              <Link href="/learn/youtube-retention-analysis">
                improving retention
              </Link>{" "}
              before worrying about subscriber CTAs.
            </li>
            <li>
              <strong>Click through rate (CTR):</strong> This measures how often
              people click your thumbnail. CTR doesn't directly cause
              subscriptions, but low CTR means fewer people see your content in
              the first place.
            </li>
          </ul>
          <p className={s.sectionText}>
            The most important insight from analytics: find which videos convert
            viewers to subscribers at a higher rate than your average, then
            figure out what those videos have in common.
          </p>
        </section>

        {/* What Converts Viewers */}
        <section id="what-converts" className={s.section}>
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
            Views and subscribers are different outcomes. A video can get
            millions of views and convert almost no one. Understanding what
            makes viewers subscribe helps you create content that builds your
            audience.
          </p>
          <ul className={s.list}>
            <li>
              <strong>Demonstrated expertise:</strong> Videos that teach
              something valuable make viewers think "I want more of this." For
              example, a tutorial that solves a specific problem signals you can
              solve future problems too.
            </li>
            <li>
              <strong>Unique perspective:</strong> If viewers can get the same
              information anywhere, they have no reason to subscribe to you
              specifically. Find an angle, format, or style that is yours.
            </li>
            <li>
              <strong>Consistent theme:</strong> Viewers subscribe when they
              know what future videos will be about. A channel that posts gaming
              one week and cooking the next makes it hard for viewers to commit.
            </li>
            <li>
              <strong>Clear promise:</strong> The best converting videos make it
              obvious what subscribing means. "I post a new editing tutorial
              every Tuesday" is a clear promise. "I make videos" is not.
            </li>
            <li>
              <strong>Personal connection:</strong> Creators who show
              personality, share their journey, or acknowledge their audience
              build stronger subscriber relationships than faceless content.
            </li>
          </ul>
        </section>

        {/* Growth Strategies */}
        <section id="growth-strategies" className={s.section}>
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
          <p className={s.sectionText}>
            These strategies work across different niches. Test them one at a
            time so you can measure what moves the needle for your channel.
          </p>
          <ol className={s.numberedList}>
            <li>
              <strong>Ask after value, not before.</strong> Don't ask for
              subscribers in your intro. Wait until you've delivered your first
              useful piece of content, then say something like "If this helped,
              subscribe for more." Test this on your next 3 videos and compare
              subscriber conversion.
            </li>
            <li>
              <strong>Create series content.</strong> Multi-part series give
              viewers a reason to subscribe so they don't miss the next episode.
              Works especially well for tutorials, challenges, or ongoing
              projects. Use playlists to group episodes together.
            </li>
            <li>
              <strong>Optimize your channel page.</strong> Your channel trailer
              plays for non-subscribers visiting your page. Make it short (30 to
              60 seconds), explain what you make and who it's for, and end with
              a subscribe CTA. Update it every few months.
            </li>
            <li>
              <strong>Use end screens strategically.</strong> Promote your best
              converting videos in end screens, not just your newest video.
              Check your analytics to find which videos turn viewers into
              subscribers, then feature those.
            </li>
            <li>
              <strong>Double down on what works.</strong> Look at your top 5
              subscriber driving videos. What do they have in common? Topic?
              Format? Length? Make more content that matches those patterns.
            </li>
            <li>
              <strong>Post consistently.</strong> Subscribers expect regular
              content. Pick a schedule you can maintain (weekly is common) and
              stick to it. Consistency builds trust and trains your audience to
              look for your videos.
            </li>
          </ol>
        </section>

        {/* Subscriber Drivers */}
        <section id="subscriber-drivers" className={s.section}>
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
            Finding Your Subscriber Driver Videos
          </h2>
          <p className={s.sectionText}>
            Some videos convert viewers to subscribers at much higher rates than
            others. Finding these "subscriber driver" videos tells you what your
            audience values most.
          </p>
          <p className={s.sectionText}>
            <strong>How to calculate subscribers per 1,000 views:</strong>
          </p>
          <ol className={s.numberedList}>
            <li>
              Go to YouTube Studio, click Analytics, then Audience, then "See
              more" under Subscribers.
            </li>
            <li>
              Change the view to show subscribers by content. Note subscribers
              gained for each video.
            </li>
            <li>
              For each video, divide subscribers gained by views, then multiply
              by 1,000. For example: 50 subscribers from 5,000 views = 10
              subscribers per 1,000 views.
            </li>
            <li>
              Compare this number across your videos. Videos converting at 2x or
              3x your average are subscriber drivers.
            </li>
          </ol>
          <p className={s.sectionText}>
            Once you identify your subscriber drivers, analyze what makes them
            different. Common patterns include: tutorial content, videos that
            solve a specific problem, videos where you show your process, or
            content that promises ongoing value.
          </p>
        </section>

        {/* Get More Viewers */}
        <section id="get-more-viewers" className={s.section}>
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
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </span>
            How to Get More Viewers and Turn Them Into Subscribers
          </h2>
          <p className={s.sectionText}>
            Before you can get subscribers, you need viewers. The viewer to
            subscriber funnel looks like this: Impressions (thumbnail shown) →
            Click (viewer watches) → Retention (viewer stays) → Return (viewer
            comes back) → Subscribe. Here's how to improve each stage.
          </p>
          <p className={s.sectionText}>
            <strong>Packaging (Impressions to Clicks):</strong>
          </p>
          <ul className={s.list}>
            <li>
              Use high contrast thumbnails with readable text and clear faces
            </li>
            <li>
              Write titles that create curiosity without clickbait. See our{" "}
              <Link href="/learn/youtube-video-ideas">video ideas guide</Link>{" "}
              for title strategies.
            </li>
            <li>Test different thumbnail styles and track CTR changes</li>
          </ul>
          <p className={s.sectionText}>
            <strong>Retention (Clicks to Full Watches):</strong>
          </p>
          <ul className={s.list}>
            <li>
              Hook viewers in the first 10 seconds with a clear promise or
              payoff
            </li>
            <li>Cut intros and filler. Get to the value fast.</li>
            <li>
              Use pattern interrupts (changes in visuals, pacing, or energy) to
              maintain attention
            </li>
          </ul>
          <p className={s.sectionText}>
            <strong>Return Visits (One-Time Viewers to Regulars):</strong>
          </p>
          <ul className={s.list}>
            <li>End videos by teasing what's coming next</li>
            <li>
              Use end screens to send viewers to related content on your channel
            </li>
            <li>Respond to comments to build community</li>
          </ul>
          <p className={s.sectionText}>
            <strong>Subscribe (Regulars to Subscribers):</strong>
          </p>
          <ul className={s.list}>
            <li>Ask for the subscribe after delivering value, not before</li>
            <li>
              Explain what subscribing means: "I post a new tutorial every
              Friday"
            </li>
            <li>Pin a comment with a subscribe reminder on your best videos</li>
          </ul>
        </section>

        {/* Get Traffic */}
        <section id="get-traffic" className={s.section}>
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
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span>
            How to Get Traffic to Your Channel
          </h2>
          <p className={s.sectionText}>
            YouTube traffic comes from several sources. Understanding each helps
            you focus your efforts where they'll have the most impact.
          </p>
          <ul className={s.list}>
            <li>
              <strong>YouTube Search:</strong> People searching for specific
              topics. Optimize by using clear, keyword-rich titles and
              descriptions. Best for tutorial and how-to content. Search traffic
              tends to have higher intent and often converts well to
              subscribers.
            </li>
            <li>
              <strong>Suggested Videos:</strong> YouTube recommends your video
              alongside other videos. Improve this by creating content similar
              to videos already getting suggested traffic in your niche, and by
              maximizing retention. Check our{" "}
              <Link href="/learn/youtube-competitor-analysis">
                competitor analysis guide
              </Link>{" "}
              to understand what's getting suggested.
            </li>
            <li>
              <strong>Browse (Homepage):</strong> YouTube shows your video on
              the homepage to subscribers and people it thinks might be
              interested. Strong early performance (from subscribers) helps you
              reach browse traffic.
            </li>
            <li>
              <strong>Shorts:</strong> Short-form vertical videos shown in the
              Shorts feed. Can drive massive views but typically lower
              subscriber conversion. Use Shorts to get discovered, then funnel
              viewers to longer content.
            </li>
            <li>
              <strong>External:</strong> Traffic from social media, websites,
              and other platforms. Useful for new channels building initial
              momentum. Share in communities where your target audience already
              hangs out.
            </li>
          </ul>
          <p className={s.sectionText}>
            Check your traffic sources in Analytics under Reach. If you're
            heavily dependent on one source, diversifying can protect your
            channel from algorithm changes.
          </p>
        </section>

        {/* Trending Videos */}
        <section id="trending-videos" className={s.section}>
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
                <path d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                <path d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
              </svg>
            </span>
            How to Find Trending Videos (Without Copying)
          </h2>
          <p className={s.sectionText}>
            Finding trending topics helps you create content people are actively
            searching for. The key is finding trends early enough that you can
            add value, not just copy what already exists.
          </p>
          <ol className={s.numberedList}>
            <li>
              <strong>Check the Trending tab:</strong> YouTube's Trending page
              shows what's popular right now. Most of this is from huge
              channels, but it reveals topics getting attention.
            </li>
            <li>
              <strong>Search with filters:</strong> Search for topics in your
              niche and filter by "Upload date" then "This week" or "This
              month." Look for videos getting unusual traction from smaller
              channels.
            </li>
            <li>
              <strong>Watch competitors:</strong> Keep a list of 5 to 10
              channels in your niche. When one of them posts something that gets
              unusually high views, that's a signal the topic has demand. See
              our{" "}
              <Link href="/learn/youtube-competitor-analysis">
                competitor analysis guide
              </Link>{" "}
              for a systematic approach.
            </li>
            <li>
              <strong>Find your angle:</strong> Don't copy the trending video.
              Ask: "What's missing from existing videos on this topic? What
              perspective can I add? What would I want to know that they didn't
              cover?"
            </li>
          </ol>
          <p className={s.sectionText}>
            For generating video ideas based on what's working in your niche,
            check our{" "}
            <Link href="/learn/youtube-video-ideas">video ideas guide</Link>.
          </p>
        </section>

        {/* Best Time to Post */}
        <section id="best-time-to-post" className={s.section}>
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
                <path d="M12 6v6l4 2" />
              </svg>
            </span>
            What Is the Best Time to Post on YouTube
          </h2>
          <p className={s.sectionText}>
            The best time to post depends on when your specific audience is
            online. There's no universal answer, but you can find the best time
            for your channel using your analytics.
          </p>
          <p className={s.sectionText}>
            <strong>How to find when your viewers are online:</strong>
          </p>
          <ol className={s.numberedList}>
            <li>Go to YouTube Studio, then Analytics, then Audience tab.</li>
            <li>
              Scroll down to "When your viewers are on YouTube." This shows a
              heatmap of days and times.
            </li>
            <li>
              Post 2 to 3 hours before your audience peak. This gives the video
              time to process and allows early viewers to generate initial
              engagement.
            </li>
          </ol>
          <p className={s.sectionText}>
            <strong>2 week posting time test:</strong>
          </p>
          <ul className={s.list}>
            <li>
              Week 1: Post at your current time. Track views and subscribers in
              the first 24 and 48 hours.
            </li>
            <li>
              Week 2: Post 3 hours earlier or later than usual. Track the same
              metrics.
            </li>
            <li>
              Compare results. The time slot with better early performance is
              likely closer to your optimal posting time.
            </li>
          </ul>
          <p className={s.sectionText}>
            Note: posting time matters most when you have an active subscriber
            base. For new channels, content quality matters more than exact
            timing.
          </p>
        </section>

        {/* Advertise Channel */}
        <section id="advertise-channel" className={s.section}>
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
                <path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </span>
            How to Advertise My Channel (Without Wasting Money)
          </h2>
          <p className={s.sectionText}>
            Most new creators should focus on free promotion before spending
            money. Paid ads rarely convert well for subscriber growth because
            people who click ads often aren't your target audience.
          </p>
          <p className={s.sectionText}>
            <strong>Free promotion strategies that work:</strong>
          </p>
          <ul className={s.list}>
            <li>
              <strong>Communities:</strong> Share your videos in relevant
              subreddits, Discord servers, or forums. Follow community rules and
              contribute value, don't just spam links.
            </li>
            <li>
              <strong>Collaborations:</strong> Partner with creators at a
              similar level. Guest appearances, reaction videos, or shoutouts
              expose you to aligned audiences.
            </li>
            <li>
              <strong>Social media:</strong> Clip highlights for TikTok,
              Instagram Reels, or Twitter. Use these to drive viewers to your
              full videos.
            </li>
            <li>
              <strong>Comments:</strong> Leave thoughtful comments on larger
              channels in your niche. Don't promote yourself, just add value.
              Curious viewers will click your profile.
            </li>
          </ul>
          <p className={s.sectionText}>
            <strong>When paid promotion makes sense:</strong>
          </p>
          <p className={s.sectionText}>
            Consider YouTube ads only after you have a video that already
            converts viewers to subscribers well organically. Amplifying a video
            with a 2% conversion rate is more efficient than promoting one with
            0.5%.
          </p>
          <p className={s.sectionText}>
            <strong>What to avoid:</strong> Never buy subscribers or use Sub4Sub
            schemes. These inflate your number but destroy your engagement
            metrics. YouTube may also penalize channels for artificial growth.
          </p>
        </section>

        {/* Start Channel */}
        <section id="start-channel" className={s.section}>
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
                <path d="M12 4v16m8-8H4" />
              </svg>
            </span>
            How to Start a YouTube Channel That Actually Grows
          </h2>
          <p className={s.sectionText}>
            Creating a YouTube channel is easy. Building one that grows requires
            clarity about your niche, your audience, and your content strategy.
          </p>
          <p className={s.sectionText}>
            <strong>The basics:</strong> To create a YouTube channel, sign in to
            YouTube with a Google account, click your profile icon, then "Create
            a channel." Choose a name that reflects your content. You can change
            the name later if needed.
          </p>
          <p className={s.sectionText}>
            <strong>What actually matters for growth:</strong>
          </p>
          <ul className={s.list}>
            <li>
              <strong>Pick a niche:</strong> Channels that focus on one topic
              grow faster than general channels. You can expand later, but start
              focused.
            </li>
            <li>
              <strong>Define your promise:</strong> What will subscribers get
              from your channel? "Weekly guitar tutorials for beginners" is
              clear. "Music videos" is not.
            </li>
            <li>
              <strong>Plan your first 10 videos:</strong> Before you publish,
              outline 10 video ideas that fit your niche. This ensures you have
              content direction and can post consistently.
            </li>
            <li>
              <strong>Invest in audio first:</strong> Viewers tolerate mediocre
              video quality but leave quickly for bad audio. A decent USB
              microphone makes a bigger difference than a better camera.
            </li>
          </ul>
          {/* TODO: Link to dedicated "How to start a YouTube channel" guide when created */}
        </section>

        {/* Rename and Brand */}
        <section id="rename-and-brand" className={s.section}>
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
                <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </span>
            YouTube Name Ideas and How to Rename Your Channel
          </h2>
          <p className={s.sectionText}>
            Your channel name matters, but don't overthink it. A clear,
            memorable name that relates to your content is better than something
            clever but confusing.
          </p>
          <p className={s.sectionText}>
            <strong>How to rename your YouTube channel:</strong>
          </p>
          <ol className={s.numberedList}>
            <li>
              Go to YouTube Studio and click Customization in the left menu.
            </li>
            <li>Click Basic Info.</li>
            <li>Click the pencil icon next to your channel name.</li>
            <li>
              Enter your new name and save. Changes may take a few days to
              appear everywhere.
            </li>
          </ol>
          <p className={s.sectionText}>
            <strong>What makes a good YouTube name:</strong>
          </p>
          <ul className={s.list}>
            <li>Easy to spell and remember</li>
            <li>Gives a hint about your content or niche</li>
            <li>Works as a brand across platforms</li>
            <li>Not too long (aim for 2 to 4 words)</li>
          </ul>
          <p className={s.sectionText}>
            <strong>YouTube name generator tips:</strong> Instead of using a
            random generator, combine words related to your niche. Mix a
            descriptive word with your name, a verb with a topic, or create a
            made-up word that sounds good. Test options by saying them out loud
            and imagining them in a YouTube search result.
          </p>
          <p className={s.sectionText}>
            <strong>Playlist names:</strong> Use clear, searchable playlist
            names that describe the content. "Beginner Guitar Lessons" is better
            than "My First Playlist." Good playlist names help viewers find your
            content and understand what subscribing means.
          </p>
          {/* TODO: Link to name generator tool if one exists */}
        </section>

        {/* Monetization */}
        <section id="monetization" className={s.section}>
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
                <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            How to Make Money on YouTube (and the Monetization Requirements)
          </h2>
          <p className={s.sectionText}>
            Monetization is directly tied to subscriber growth. You need
            subscribers to join the YouTube Partner Program, and more
            subscribers generally means more revenue from every source.
          </p>
          <p className={s.sectionText}>
            <strong>YouTube Partner Program requirements (2026):</strong>
          </p>
          <ul className={s.list}>
            <li>1,000 subscribers</li>
            <li>
              Either 4,000 public watch hours in the last 12 months OR 10
              million public Shorts views in the last 90 days
            </li>
            <li>
              Follow YouTube's monetization policies and community guidelines
            </li>
            <li>Have an AdSense account linked to your channel</li>
          </ul>
          <p className={s.sectionText}>
            <strong>How creators actually make money:</strong>
          </p>
          <ul className={s.list}>
            <li>
              <strong>Ad revenue:</strong> Requires Partner Program. Payment
              varies wildly by niche (finance topics pay more than gaming, for
              example).
            </li>
            <li>
              <strong>Sponsorships:</strong> Brands pay you to mention or
              feature products. Often pays better than ads per view, but
              requires audience trust.
            </li>
            <li>
              <strong>Affiliate links:</strong> Earn commission when viewers buy
              products you recommend. Works well for review and tutorial
              content.
            </li>
            <li>
              <strong>Memberships and Patreon:</strong> Subscribers pay monthly
              for exclusive content or perks.
            </li>
            <li>
              <strong>Your own products:</strong> Courses, merchandise, or
              services. Often the highest revenue per subscriber for established
              creators.
            </li>
          </ul>
          <p className={s.sectionText}>
            <strong>How much do YouTube channels make?</strong> It varies
            enormously. A pet channel with 100,000 subscribers might make a few
            hundred dollars per month from ads, or thousands from sponsorships,
            depending on engagement and niche. Don't focus on income projections
            until you have consistent viewership.
          </p>
        </section>

        {/* Most Views */}
        <section id="most-views" className={s.section}>
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
            Most Views for a YouTube Video: What It Really Tells You
          </h2>
          <p className={s.sectionText}>
            Viral videos with hundreds of millions of views are fun to watch,
            but they're often misleading for creators trying to grow. Here's
            what those numbers actually mean.
          </p>
          <p className={s.sectionText}>
            <strong>Why outliers don't matter much:</strong>
          </p>
          <ul className={s.list}>
            <li>
              Viral hits are often unrepeatable. The same creator may never
              match that performance again.
            </li>
            <li>
              High view counts don't equal high subscriber conversion. Many
              viral videos get watched once and forgotten.
            </li>
            <li>
              Chasing virality leads to inconsistent content that confuses your
              core audience.
            </li>
          </ul>
          <p className={s.sectionText}>
            <strong>What to focus on instead:</strong>
          </p>
          <ul className={s.list}>
            <li>
              Repeatable results. A channel that gets 10,000 views on every
              video is healthier than one that gets 1 million once and 500
              usually.
            </li>
            <li>
              Subscriber conversion rate. A video with 50,000 views and 2,000
              new subscribers is more valuable than one with 500,000 views and
              500 subscribers.
            </li>
            <li>
              Returning viewers. Build an audience that watches every video, not
              one-time visitors.
            </li>
          </ul>
        </section>

        {/* Tools */}
        <section id="tools" className={s.section}>
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
                <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
              </svg>
            </span>
            Free Tools Creators Search For (Titles, Tags, Niches)
          </h2>
          <p className={s.sectionText}>
            Creators often search for tools to help with titles, tags, and niche
            research. Here's what these tools do and how to use them
            responsibly.
          </p>
          <ul className={s.list}>
            <li>
              <strong>Title generators:</strong> AI title generators can help
              brainstorm options, but don't use outputs directly. Treat them as
              starting points. The best titles come from understanding your
              specific audience, not generic AI suggestions.
            </li>
            <li>
              <strong>Tag extractors:</strong> Tools that show what tags
              competitors use. Tags matter less than they used to. Focus on
              clear titles and descriptions instead.
            </li>
            <li>
              <strong>Niche finders:</strong> Tools to research what topics are
              underserved. Helpful for new creators, but your best niche
              insights come from watching your own analytics.
            </li>
            <li>
              <strong>Channel finders:</strong> Tools to discover channels in a
              niche. Useful for competitor research. Our{" "}
              <Link href="/learn/youtube-competitor-analysis">
                competitor analysis guide
              </Link>{" "}
              explains how to analyze what you find.
            </li>
          </ul>
          <p className={s.sectionText}>
            {BRAND.name} includes features that analyze your own channel data to
            find what's working, which is often more valuable than generic
            tools.
          </p>
        </section>

        {/* Mistakes */}
        <section id="mistakes" className={s.section}>
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
              <strong>Asking for subscribers in the intro.</strong> Viewers
              haven't seen value yet. Earn the ask first.
            </li>
            <li>
              <strong>Sub4Sub schemes.</strong> These subscribers never watch
              your content and hurt your engagement metrics. YouTube may
              penalize you.
            </li>
            <li>
              <strong>Giveaway subscribers.</strong> They subscribed for prizes,
              not content. Expect high unsubscribe rates and low engagement.
            </li>
            <li>
              <strong>Inconsistent topics.</strong> Posting gaming one week and
              cooking the next confuses potential subscribers. Pick a lane.
            </li>
            <li>
              <strong>Ignoring analytics.</strong> If you don't know which
              videos convert viewers to subscribers, you can't create more of
              what works.
            </li>
            <li>
              <strong>Focusing on views over subscribers.</strong> A viral video
              with no subscriber conversion doesn't build your channel. Aim for
              videos that create returning viewers.
            </li>
            <li>
              <strong>Never asking at all.</strong> Some creators are so worried
              about being annoying that they never ask for the subscribe. A
              simple, well-timed ask makes a real difference.
            </li>
          </ul>
        </section>

        {/* Don't Buy Subscribers */}
        <section id="dont-buy-subscribers" className={s.section}>
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
                <path d="M18.36 6.64a9 9 0 11-12.73 0M12 2v10" />
              </svg>
            </span>
            Why You Should Never Buy YouTube Subscribers
          </h2>
          <p className={s.sectionText}>
            Services that promise free YouTube subscribers or let you buy
            subscribers are everywhere. They are all harmful to your channel.
            Here is why.
          </p>
          <h3 className={s.subheading}>What Actually Happens</h3>
          <ul className={s.list}>
            <li>
              <strong>Fake accounts that never watch:</strong> Purchased
              subscribers are bots or inactive accounts. They inflate your
              subscriber count but never view your videos.
            </li>
            <li>
              <strong>Engagement rate crashes:</strong> If you have 10,000
              subscribers but only 100 views per video, YouTube sees that your
              audience does not care about your content. The algorithm reduces
              your reach.
            </li>
            <li>
              <strong>YouTube removes them:</strong> YouTube regularly purges
              fake subscribers. You lose what you paid for and may face
              penalties.
            </li>
            <li>
              <strong>Monetization risk:</strong> YouTube can deny or revoke
              Partner Program access if they detect fake engagement. This means
              losing ad revenue.
            </li>
            <li>
              <strong>Account termination:</strong> Repeated violations can
              result in permanent channel termination. You lose everything.
            </li>
          </ul>
          <h3 className={s.subheading}>What to Do Instead</h3>
          <p className={s.sectionText}>
            Real growth takes longer but builds a sustainable channel. Focus on:
          </p>
          <ul className={s.list}>
            <li>
              <strong>Better content:</strong> Make videos people actually want
              to watch and share
            </li>
            <li>
              <strong>Consistent uploads:</strong> Give your audience a reason
              to subscribe by showing you will keep posting
            </li>
            <li>
              <strong>Packaging optimization:</strong> Improve titles and
              thumbnails to get more clicks from impressions you already have
            </li>
            <li>
              <strong>Community building:</strong> Respond to comments, ask for
              feedback, make viewers feel part of something
            </li>
            <li>
              <strong>Strategic CTAs:</strong> Ask for the subscribe at moments
              when you have just delivered value
            </li>
          </ul>
          <p className={s.sectionText}>
            A channel with 1,000 real subscribers who watch every video will
            outperform a channel with 100,000 fake subscribers every time. Real
            engagement is what YouTube rewards.
          </p>
        </section>

        {/* CTA Highlight */}
        <div className={s.highlight}>
          <p>
            <strong>Find which videos convert viewers to subscribers.</strong>{" "}
            {BRAND.name} analyzes your YouTube data to show you which videos
            bring in subscribers, what they have in common, and where to focus
            next. See your subscriber drivers, track conversion rates, and spot
            patterns you'd miss in YouTube Studio.
          </p>
        </div>

        {/* FAQ */}
        <section id="faq" className={s.faqSection}>
          <h2 className={s.faqTitle}>Frequently Asked Questions</h2>
          <div className={s.faqList}>
            {ARTICLE.faqs.map((faq, index) => (
              <details key={index} className={s.faqItem}>
                <summary className={s.faqQuestion}>
                  <span className={s.faqQuestionText}>{faq.question}</span>
                  <svg
                    className={s.faqChevron}
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </summary>
                <p className={s.faqAnswer}>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Related Articles */}
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
          title="See What Converts Viewers to Subscribers"
          description={`${BRAND.name} shows you which videos bring in subscribers and why. Connect your channel to find your subscriber drivers.`}
        />
      </article>
    </main>
  );
}
