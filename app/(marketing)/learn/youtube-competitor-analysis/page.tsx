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

const ARTICLE = LEARN_ARTICLES["youtube-competitor-analysis"];

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

export default function YouTubeCompetitorAnalysisPage() {
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
          YouTube Competitor Analysis: How to Find What Works in Your Niche
        </h1>
        <p className={s.subtitle}>
          Stop guessing what to make. Learn how to find competitors on YouTube,
          spot their best performing videos, and turn those patterns into your
          own content strategy.
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
        {/* Why Competitor Analysis */}
        <section id="why-competitor-analysis" className={s.section}>
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
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            Why Competitor Analysis Matters
          </h2>
          <p className={s.sectionText}>
            Every channel in your niche is running experiments for you. They
            test topics, formats, thumbnails, and hooks. Some work. Most do not.
            Competitor analysis lets you learn from those experiments without
            spending months figuring it out yourself.
          </p>
          <p className={s.sectionText}>
            This is not about copying. Copying rarely works because context
            matters: the creator, their audience, their timing, their
            presentation. What you want are patterns. When three different
            channels in your niche all have a video on the same topic that
            outperforms their average, that tells you something about what the
            audience wants.
          </p>
          <p className={s.sectionText}>
            Competitor analysis answers questions like: What topics resonate in
            my niche? What video length works best? What thumbnail styles get
            clicks? What hooks keep people watching? When you have data on these
            questions, you stop guessing and start making informed content
            decisions.
          </p>
          <p className={s.sectionText}>
            The goal is to find repeatable patterns, not one off viral hits.
            Patterns are things you can actually apply to your own channel.
            Learning to spot them is one of the highest leverage skills you can
            develop as a creator. Once you understand how to analyze competitors
            on YouTube, you will never run out of{" "}
            <Link href="/learn/youtube-video-ideas">video ideas</Link> that have
            real demand.
          </p>
        </section>

        {/* Competitor Checklist */}
        <section id="competitor-checklist" className={s.section}>
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
            YouTube Competitor Analysis Checklist (15 Minutes)
          </h2>
          <p className={s.sectionText}>
            You do not need hours to get useful competitor insights. This
            checklist walks you through a quick analysis session that you can
            repeat weekly.
          </p>
          <ol className={s.numberedList}>
            <li>
              <strong>Pick 3 competitor channels</strong> (similar niche,
              similar size or slightly larger, active in last 30 days)
            </li>
            <li>
              <strong>Go to each channel&apos;s Videos tab</strong> and sort by
              Popular to see their all time top performers
            </li>
            <li>
              <strong>Note the top 3 videos from each channel</strong> (topic,
              title structure, thumbnail style, video length)
            </li>
            <li>
              <strong>Sort by newest</strong> and look for recent videos that
              have more views than usual for that channel
            </li>
            <li>
              <strong>Watch the first 30 seconds</strong> of any video that
              caught your attention. Note how they open.
            </li>
            <li>
              <strong>Write down 2 to 3 patterns you noticed</strong> (common
              topic themes, title formulas, thumbnail elements)
            </li>
            <li>
              <strong>Pick one pattern to test</strong> in your next video
            </li>
          </ol>
          <p className={s.sectionText}>
            Run this checklist once a week. Over time, you build a mental
            database of what works in your niche. You will start noticing
            patterns before you even sit down to analyze.
          </p>
        </section>

        {/* How to Find Competitors */}
        <section id="find-competitors" className={s.section}>
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
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
            </span>
            How to Find Competitors on YouTube
          </h2>
          <p className={s.sectionText}>
            Before you can analyze competitors, you need to find the right ones.
            Not every channel in your broad category is a competitor. You want
            channels that share your target audience and create similar content.
          </p>
          <p className={s.sectionText}>
            <strong>Method 1: YouTube Search.</strong> Search for your main
            topics and see which channels appear repeatedly. If the same
            channels keep showing up for your target keywords, those are direct
            competitors.
          </p>
          <p className={s.sectionText}>
            <strong>Method 2: Suggested Videos.</strong> Go to one of your own
            videos or a video similar to what you make. Check the suggested
            sidebar. YouTube is literally telling you which channels it
            considers related. These are channels competing for the same viewer
            attention.
          </p>
          <p className={s.sectionText}>
            <strong>Method 3: Channels Like feature.</strong> On some channel
            pages, YouTube shows a &ldquo;Channels like this&rdquo; or
            &ldquo;Similar channels&rdquo; section. This is another built in
            channel finder.
          </p>
          <p className={s.sectionText}>
            <strong>Method 4: Playlists and Communities.</strong> Search for
            playlists in your niche and see which channels get featured. Check
            Reddit, Discord, or Facebook groups where your audience hangs out
            and note which creators people recommend.
          </p>
          <p className={s.sectionText}>
            <strong>Method 5: Ask Your Audience.</strong> If you have any
            existing audience, ask them what other channels they watch. This
            gives you direct insight into your actual competition.
          </p>
          <h3 className={s.subheading}>How to Pick Comparable Channels</h3>
          <p className={s.sectionText}>
            Not all competitors are equally useful to study. A channel with 10
            million subscribers plays by different rules than a channel with 10
            thousand. For the most actionable insights, pick channels that
            match:
          </p>
          <ul className={s.list}>
            <li>
              <strong>Similar niche and audience:</strong> They make content for
              the same type of viewer you want to reach
            </li>
            <li>
              <strong>Similar or slightly larger size:</strong> Channels 1x to
              10x your subscriber count. Their strategies are more replicable.
            </li>
            <li>
              <strong>Active upload schedule:</strong> They post consistently
              and have recent videos to analyze
            </li>
            <li>
              <strong>Comparable production level:</strong> Their videos are
              achievable with your current resources
            </li>
          </ul>
          <p className={s.sectionText}>
            Keep a list of 5 to 10 competitors. Include a mix: some at your
            level, some aspirational, some slightly smaller but growing fast.
            Variety gives you different perspectives on what works.
          </p>
        </section>

        {/* Find Trending Videos */}
        <section id="find-trending" className={s.section}>
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
            How to Find Trending Videos in Your Niche
          </h2>
          <p className={s.sectionText}>
            Trending does not always mean the YouTube Trending page. In fact,
            the main Trending page is usually dominated by mainstream content
            that has nothing to do with your niche. What you want is trending
            within your niche: topics getting more attention than usual from
            your target audience.
          </p>
          <h3 className={s.subheading}>A Repeatable Process</h3>
          <ol className={s.numberedList}>
            <li>
              <strong>Start with seed topics.</strong> List 5 to 10 core topics
              in your niche that you could make videos about.
            </li>
            <li>
              <strong>Scan competitor uploads.</strong> For each competitor,
              check their last 10 to 20 videos. Look for any that have
              significantly more views than their usual performance.
            </li>
            <li>
              <strong>Spot the outliers.</strong> If a video has roughly double
              the views of their average, and it was posted recently, that topic
              is getting traction.
            </li>
            <li>
              <strong>Validate with recency.</strong> A video with high views
              from 2 years ago tells you less than one from last month. Focus on
              recent outliers.
            </li>
            <li>
              <strong>Check velocity.</strong> How fast did the video gain
              views? A video that hit 100k in a week is more interesting than
              one that took 6 months.
            </li>
            <li>
              <strong>Extract the angle.</strong> What specific angle did they
              take on the topic? What made it different from other videos on the
              same subject?
            </li>
            <li>
              <strong>Create your version.</strong> Do not copy. Find your own
              angle, add your perspective, or go deeper on a subtopic.
            </li>
          </ol>
          <p className={s.sectionText}>
            Patterns matter more than individual videos. If you see the same
            topic trending across multiple competitors, that is a strong signal.
            One channel having a hit could be a fluke. Three channels having
            hits on the same topic is a pattern worth following. For more on
            generating ideas from these patterns, see our guide on{" "}
            <Link href="/learn/youtube-video-ideas">YouTube video ideas</Link>.
          </p>
        </section>

        {/* Find Outlier Videos */}
        <section id="outliers" className={s.section}>
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
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </span>
            How to Find Outlier Videos (The Easy Way)
          </h2>
          <p className={s.sectionText}>
            Outlier videos are the gold mine of competitor analysis. These are
            videos that perform significantly better than a channel&apos;s
            typical video. They indicate topics, formats, or packaging that
            resonated unusually well with audiences.
          </p>
          <h3 className={s.subheading}>The Quick Method</h3>
          <ol className={s.numberedList}>
            <li>Go to a competitor channel and click the Videos tab</li>
            <li>
              Scroll through their recent videos (last 20 to 30) and mentally
              note the typical view count
            </li>
            <li>
              Any video with roughly double that typical count (or more) is an
              outlier worth studying
            </li>
          </ol>
          <h3 className={s.subheading}>Compare Fairly</h3>
          <p className={s.sectionText}>
            Context matters when identifying outliers. To compare fairly:
          </p>
          <ul className={s.list}>
            <li>
              <strong>Same time window:</strong> Compare videos from the same
              period. A video from 2 years ago has had more time to accumulate
              views.
            </li>
            <li>
              <strong>Same format:</strong> If a channel makes both Shorts and
              long form, compare Shorts to Shorts and long form to long form.
            </li>
            <li>
              <strong>Same upload period:</strong> Some channels have grown
              significantly. Their recent videos may have higher baselines than
              older ones.
            </li>
          </ul>
          <h3 className={s.subheading}>What to Do With Outliers</h3>
          <p className={s.sectionText}>
            Once you find an outlier, ask these questions:
          </p>
          <ul className={s.list}>
            <li>What topic did this cover that their other videos did not?</li>
            <li>What was different about the title or thumbnail?</li>
            <li>What hook did they use in the first 30 seconds?</li>
            <li>
              Was there external context (news event, trend, controversy) that
              boosted this video?
            </li>
            <li>
              Can you make a video on a related topic with your own angle?
            </li>
          </ul>
          <p className={s.sectionText}>
            Keep a spreadsheet or note of outliers you find. Over time, patterns
            emerge. You will see which topics consistently outperform, which
            title structures get clicks, and which thumbnail styles work in your
            niche.
          </p>
        </section>

        {/* What to Track */}
        <section id="what-to-track" className={s.section}>
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
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </span>
            What to Track on Competitor Channels (And Why It Matters)
          </h2>
          <p className={s.sectionText}>
            When you analyze competitors, track specific elements that you can
            actually apply to your own content. Here is what to look for and why
            each matters:
          </p>

          <h3 className={s.subheading}>Title Patterns</h3>
          <p className={s.sectionText}>
            <strong>What it signals:</strong> What promises get clicks in your
            niche. <br />
            <strong>How to spot it:</strong> Look at their top 10 videos. Do
            they use numbers? Questions? How to formats? Curiosity gaps?
            Specific results? <br />
            <strong>What to test:</strong> Try their most common title structure
            on one of your videos and compare CTR.
          </p>

          <h3 className={s.subheading}>Thumbnail Patterns</h3>
          <p className={s.sectionText}>
            <strong>What it signals:</strong> What visual styles get attention
            in your niche. <br />
            <strong>How to spot it:</strong> Look for common elements: faces vs
            no faces, text vs no text, bright colors vs dark, close ups vs wide
            shots. <br />
            <strong>What to test:</strong> Pick one element (like adding a face
            or changing background color) and A/B test it mentally or with
            actual thumbnail variants.
          </p>

          <h3 className={s.subheading}>Topics and Themes</h3>
          <p className={s.sectionText}>
            <strong>What it signals:</strong> What the audience in your niche
            actually wants to watch. <br />
            <strong>How to spot it:</strong> Categorize their videos by topic.
            Which categories have the most videos? Which have the highest
            average views? <br />
            <strong>What to test:</strong> Make a video on a topic category that
            performs well for competitors but you have not covered yet.
          </p>

          <h3 className={s.subheading}>Series and Recurring Formats</h3>
          <p className={s.sectionText}>
            <strong>What it signals:</strong> Formats that build audience habits
            and returning viewers. <br />
            <strong>How to spot it:</strong> Look for numbered episodes,
            consistent naming, or recognizable formats that repeat. <br />
            <strong>What to test:</strong> Create your own series format that
            gives viewers a reason to subscribe and come back. Series content
            often{" "}
            <Link href="/learn/how-to-get-more-subscribers">
              converts viewers into subscribers
            </Link>{" "}
            better than one off videos.
          </p>

          <h3 className={s.subheading}>Video Length</h3>
          <p className={s.sectionText}>
            <strong>What it signals:</strong> What duration the audience
            tolerates or prefers for different topics. <br />
            <strong>How to spot it:</strong> Note the length of their top
            performing videos vs their average. <br />
            <strong>What to test:</strong> If competitors do well with 15 minute
            videos on a topic, do not make yours 45 minutes unless you have a
            reason.
          </p>

          <h3 className={s.subheading}>Posting Schedule</h3>
          <p className={s.sectionText}>
            <strong>What it signals:</strong> Upload frequency that works in
            your niche. <br />
            <strong>How to spot it:</strong> Check upload dates. Are they
            weekly? Multiple times per week? Sporadic? <br />
            <strong>What to test:</strong> Match or exceed the consistency of
            successful competitors. Frequency matters less than consistency.
          </p>

          <h3 className={s.subheading}>Hooks and Openings</h3>
          <p className={s.sectionText}>
            <strong>What it signals:</strong> What keeps viewers watching past
            the first 30 seconds. <br />
            <strong>How to spot it:</strong> Watch the opening of their top
            videos. Do they tease the payoff? Ask a question? Show a result?
            Jump straight into action? <br />
            <strong>What to test:</strong> Try their hook style on your next
            video and check your{" "}
            <Link href="/learn/youtube-retention-analysis">
              retention curve
            </Link>{" "}
            for the first 30 seconds.
          </p>

          <h3 className={s.subheading}>Comment Themes</h3>
          <p className={s.sectionText}>
            <strong>What it signals:</strong> What the audience cares about,
            questions they have, topics they want more of. <br />
            <strong>How to spot it:</strong> Scroll through comments on their
            popular videos. Look for repeated questions, requests, or praise for
            specific parts. <br />
            <strong>What to test:</strong> Answer common questions in your own
            videos or create content based on what viewers are requesting.
          </p>
        </section>

        {/* YouTube Stats to Compare */}
        <section id="youtube-stats" className={s.section}>
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
                <path d="M18 20V10M12 20V4M6 20v-6" />
              </svg>
            </span>
            YouTube Stats to Compare (Without Overthinking It)
          </h2>
          <p className={s.sectionText}>
            You cannot see a competitor&apos;s full analytics. YouTube keeps
            retention, CTR, and traffic sources private. But you can see enough
            publicly to make informed decisions about what works.
          </p>
          <h3 className={s.subheading}>What You Can See</h3>
          <ul className={s.list}>
            <li>
              <strong>Views:</strong> The total view count on each video
            </li>
            <li>
              <strong>Upload date:</strong> When the video was published
            </li>
            <li>
              <strong>Likes:</strong> Public engagement signal
            </li>
            <li>
              <strong>Comments:</strong> Both count and content
            </li>
            <li>
              <strong>Subscriber count:</strong> Channel size for context
            </li>
            <li>
              <strong>Video length:</strong> Duration in the timestamp
            </li>
          </ul>
          <h3 className={s.subheading}>What You Cannot See</h3>
          <ul className={s.list}>
            <li>
              <strong>Retention curves:</strong> How long people actually watch
            </li>
            <li>
              <strong>CTR:</strong> Click through rate on thumbnails
            </li>
            <li>
              <strong>Traffic sources:</strong> Where views come from
            </li>
            <li>
              <strong>Subscriber conversion:</strong> How many viewers subscribe
            </li>
            <li>
              <strong>Revenue:</strong> What they earn per video
            </li>
          </ul>
          <h3 className={s.subheading}>A Simple Tracking Template</h3>
          <p className={s.sectionText}>
            When you find videos worth studying, record these data points:
          </p>
          <ul className={s.list}>
            <li>Video title</li>
            <li>Topic or category</li>
            <li>Hook type (first 30 seconds approach)</li>
            <li>Video length</li>
            <li>Title formula (how to, list, question, etc.)</li>
            <li>Thumbnail pattern (face, text, colors)</li>
            <li>Publish date</li>
            <li>Views at time of recording</li>
            <li>Velocity (views per day if you can estimate)</li>
            <li>Notable comment themes</li>
          </ul>
          <p className={s.sectionText}>
            You do not need fancy tools. A simple spreadsheet works. The act of
            recording forces you to notice patterns you would otherwise miss.
            For your own videos, you have access to much more detailed analytics
            in YouTube Studio, which we cover in our{" "}
            <Link href="/learn/youtube-channel-audit">channel audit guide</Link>
            .
          </p>
        </section>

        {/* Titles and Thumbnails */}
        <section id="title-thumbnail" className={s.section}>
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
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </span>
            Steal the Pattern, Not the Video: Titles and Thumbnails That Work
          </h2>
          <p className={s.sectionText}>
            Titles and thumbnails are the packaging of your video. They
            determine whether people click. Competitor analysis reveals what
            packaging works in your niche, but the goal is to understand
            patterns, not copy specific videos.
          </p>
          <h3 className={s.subheading}>Finding Title Ideas</h3>
          <p className={s.sectionText}>
            Look at the titles of competitor outlier videos and categorize them
            by structure:
          </p>
          <ul className={s.list}>
            <li>
              <strong>How to + result:</strong> &ldquo;How to [do thing] in
              [timeframe]&rdquo;
            </li>
            <li>
              <strong>Number list:</strong> &ldquo;7 [things] that [benefit or
              problem]&rdquo;
            </li>
            <li>
              <strong>Curiosity gap:</strong> &ldquo;Why [surprising thing]
              actually [works/fails]&rdquo;
            </li>
            <li>
              <strong>Direct promise:</strong> &ldquo;The [only/best/fastest]
              way to [result]&rdquo;
            </li>
            <li>
              <strong>Question:</strong> &ldquo;Is [thing] actually
              [claim]?&rdquo;
            </li>
            <li>
              <strong>Personal story:</strong> &ldquo;I tried [thing] for
              [timeframe]. Here&apos;s what happened.&rdquo;
            </li>
          </ul>
          <p className={s.sectionText}>
            Once you identify which structures perform well in your niche, you
            can apply them to your own topics. An AI title generator can help
            you brainstorm variations quickly, but always edit the output for
            your voice and audience. Generated titles often sound generic until
            you add your personality.
          </p>
          <h3 className={s.subheading}>Finding Thumbnail Ideas</h3>
          <p className={s.sectionText}>
            Thumbnails communicate faster than titles. In a split second,
            viewers decide whether your video is for them. Study competitor
            thumbnails to understand what visual language works in your niche:
          </p>
          <ul className={s.list}>
            <li>
              <strong>Face or no face:</strong> Many niches perform better with
              expressive faces. Some do not.
            </li>
            <li>
              <strong>Text amount:</strong> Some niches use minimal text, others
              use bold overlays.
            </li>
            <li>
              <strong>Color palette:</strong> Notice if successful thumbnails
              use bright, saturated colors or more muted tones.
            </li>
            <li>
              <strong>Composition:</strong> Close up face? Product shot? Before
              and after? Action shot?
            </li>
            <li>
              <strong>Contrast with feed:</strong> The best thumbnails stand out
              from surrounding videos.
            </li>
          </ul>
          <p className={s.sectionText}>
            Test one variable at a time. If you change your thumbnail style
            dramatically, you will not know which element made the difference.
            Pick one pattern you noticed in competitor thumbnails and try it on
            your next video.
          </p>
        </section>

        {/* Common Mistakes */}
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
            Common Competitor Analysis Mistakes (And What to Do Instead)
          </h2>
          <p className={s.sectionText}>
            Competitor analysis is powerful, but only if you do it right. Here
            are the mistakes that waste your time or lead you in the wrong
            direction:
          </p>
          <ul className={s.list}>
            <li>
              <strong>Copying videos directly.</strong> This rarely works.
              Context matters: the creator&apos;s personality, their existing
              audience, timing, and execution all affect performance. Learn the
              pattern, then create something original.
            </li>
            <li>
              <strong>Only studying mega channels.</strong> Channels with
              millions of subscribers play by different rules. Their brand,
              existing audience, and resources mean their strategies may not
              apply to you. Study channels closer to your size.
            </li>
            <li>
              <strong>Ignoring context behind viral videos.</strong> A video
              might have gone viral because of a news event, a collaboration, or
              external promotion. If you cannot replicate that context, the
              topic may not work for you.
            </li>
            <li>
              <strong>Focusing only on view counts.</strong> High views with low
              engagement could mean clickbait that disappoints. Check likes,
              comments, and comment sentiment. A video that builds trust and
              subscribers is more valuable than one that just racks up views.
            </li>
            <li>
              <strong>Analysis paralysis.</strong> Spending hours researching
              and never creating is a trap. Set a time limit for research (15 to
              30 minutes), extract your insights, and then make something.
            </li>
            <li>
              <strong>Tracking too many competitors.</strong> Trying to watch 50
              channels leads to overwhelm and shallow analysis. Pick 5 to 10
              competitors and study them deeply.
            </li>
            <li>
              <strong>Not comparing fairly.</strong> A 2 year old video has had
              more time to accumulate views than one posted last week. Always
              consider recency and velocity, not just total views.
            </li>
            <li>
              <strong>Ignoring formats you do not like.</strong> If a format
              performs well in your niche but you find it annoying, ask why it
              works. You might find a way to capture the same benefit with a
              style you prefer.
            </li>
            <li>
              <strong>Obsessing over tags.</strong> Tags have minimal impact on
              discovery in 2026. Do not waste time extracting competitor tags.
              Focus on titles, thumbnails, and content quality.
            </li>
            <li>
              <strong>Never testing what you learn.</strong> Insights mean
              nothing if you do not apply them. Every analysis session should
              end with one specific thing you will test in your next video.
            </li>
          </ul>
        </section>

        {/* ChannelBoost CTA */}
        <div className={s.highlight}>
          <p>
            <strong>Want to find competitor insights faster?</strong>{" "}
            {BRAND.name} helps you track competitor channels, spot outlier
            videos automatically, and get alerts when a topic gains traction in
            your niche. Stop scrolling through channels manually.
          </p>
        </div>

        {/* 30 Day Plan */}
        <section id="30-day-plan" className={s.section}>
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
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </span>
            30 Day Plan: Turn Competitor Insights Into More Views
          </h2>
          <p className={s.sectionText}>
            Competitor analysis only matters if it leads to action. This 30 day
            plan shows you how to go from research to results. Adjust the
            timeline based on your upload schedule.
          </p>

          <h3 className={s.subheading}>Week 1: Research</h3>
          <ul className={s.list}>
            <li>Identify 5 to 8 competitor channels using the methods above</li>
            <li>Run the 15 minute checklist on each channel</li>
            <li>Create a spreadsheet with outlier videos from each channel</li>
            <li>
              Note patterns: common topics, title structures, thumbnail styles
            </li>
            <li>
              Watch the first 30 seconds of 10 outlier videos, note the hooks
            </li>
          </ul>

          <h3 className={s.subheading}>Week 2: Pick Patterns</h3>
          <ul className={s.list}>
            <li>Review your spreadsheet and identify 3 clear patterns</li>
            <li>
              For each pattern, brainstorm 3 to 5 video ideas where you could
              apply it
            </li>
            <li>
              Validate ideas against search demand and your ability to execute
            </li>
            <li>
              Pick your strongest 4 ideas (one per week for the next month)
            </li>
          </ul>

          <h3 className={s.subheading}>Week 3: Create and Test</h3>
          <ul className={s.list}>
            <li>
              Produce video 1 applying the pattern you identified (topic, title
              structure, thumbnail style, or hook)
            </li>
            <li>Be intentional: know exactly which pattern you are testing</li>
            <li>
              Publish and note your baseline metrics (CTR, retention, views
              after 24h and 48h)
            </li>
          </ul>

          <h3 className={s.subheading}>Week 4: Evaluate and Iterate</h3>
          <ul className={s.list}>
            <li>
              After 7 days, check how video 1 performed compared to your recent
              average
            </li>
            <li>
              Did the pattern help? Look at CTR for packaging, retention for
              hooks, views for topic choice.
            </li>
            <li>
              Produce video 2 with the same or refined pattern, or try the next
              pattern from your list
            </li>
            <li>
              Repeat: create, publish, evaluate. Over time, you build your own
              library of what works.
            </li>
          </ul>
          <p className={s.sectionText}>
            This cycle builds a feedback loop. Each video teaches you something.
            Combined with regular competitor analysis, you continuously refine
            what works for your channel. This approach is one of the most
            reliable ways to get more views on YouTube and{" "}
            <Link href="/learn/how-to-get-more-subscribers">
              grow your subscriber base
            </Link>
            .
          </p>
        </section>

        {/* Example */}
        <section id="example" className={s.section}>
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
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
              </svg>
            </span>
            Example: Competitor Insight to Video Plan
          </h2>
          <p className={s.sectionText}>
            Here is a practical example of how competitor analysis leads to
            content decisions. This is a hypothetical scenario, but it
            illustrates the process.
          </p>

          <h3 className={s.subheading}>The Niche: Home Coffee Brewing</h3>
          <p className={s.sectionText}>
            You run a small channel (8,000 subscribers) about making better
            coffee at home. You want to grow faster and get more traffic to your
            channel.
          </p>

          <h3 className={s.subheading}>The Research</h3>
          <p className={s.sectionText}>
            You identify 6 competitor channels ranging from 5,000 to 50,000
            subscribers. You run the 15 minute checklist on each and notice:
          </p>
          <ul className={s.list}>
            <li>
              3 out of 6 channels have an outlier video on &ldquo;cheap espresso
              machines&rdquo; with roughly double their average views
            </li>
            <li>
              The titles all use a number format: &ldquo;5 Budget Espresso
              Machines Worth Buying&rdquo;, &ldquo;Best Cheap Espresso Machines
              Under $200&rdquo;, etc.
            </li>
            <li>Thumbnails show the actual machines with price overlays</li>
            <li>
              Comment themes: people asking for comparisons, specific model
              recommendations, and &ldquo;which one do you actually use?&rdquo;
            </li>
          </ul>

          <h3 className={s.subheading}>The Pattern</h3>
          <p className={s.sectionText}>
            Budget equipment roundups with specific numbers perform well. The
            audience wants concrete recommendations, not vague advice. They also
            want to know the creator&apos;s personal pick.
          </p>

          <h3 className={s.subheading}>Your Angle</h3>
          <p className={s.sectionText}>
            Instead of copying the exact video, you differentiate:
          </p>
          <ul className={s.list}>
            <li>
              You actually own 3 of these machines. You can do a real comparison
              with taste tests.
            </li>
            <li>
              Your angle: &ldquo;I bought these so you don&apos;t have to&rdquo;
              (personal experience, not just research)
            </li>
            <li>
              Hook: Show the final shot from each machine first, then reveal
              which one you kept
            </li>
          </ul>

          <h3 className={s.subheading}>5 Video Ideas From This Pattern</h3>
          <ol className={s.numberedList}>
            <li>
              &ldquo;I Tested 5 Budget Espresso Machines. Here&apos;s the Only
              One I Kept.&rdquo;
            </li>
            <li>&ldquo;The Best Coffee Grinder Under $50 (I Tried 4)&rdquo;</li>
            <li>
              &ldquo;Cheap vs Expensive Pour Over: Can You Taste the
              Difference?&rdquo;
            </li>
            <li>
              &ldquo;3 Coffee Subscriptions Compared: Which Is Actually Worth
              It?&rdquo;
            </li>
            <li>
              &ldquo;I Tried Every Milk Frother on Amazon. Most Are
              Terrible.&rdquo;
            </li>
          </ol>
          <p className={s.sectionText}>
            Each idea applies the same pattern (budget comparisons with personal
            testing) to different topics. You have a month of content from one
            competitor insight.
          </p>
        </section>

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
          title="Find Competitor Insights Faster"
          description={`${BRAND.name} tracks competitor channels automatically, surfaces outlier videos, and alerts you when topics gain traction in your niche. Spend less time scrolling and more time creating.`}
        />
      </article>
    </main>
  );
}
