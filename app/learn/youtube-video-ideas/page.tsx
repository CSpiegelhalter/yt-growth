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
          YouTube Video Ideas: How to Find Topics That Actually Get Views
        </h1>
        <p className={s.subtitle}>
          Stuck staring at a blank content calendar? This guide shows you how to
          find video ideas for YouTube using methods that work, so you always
          know what to make next.
        </p>
        <ArticleMeta
          dateModified={ARTICLE.dateModified}
          readingTime={ARTICLE.readingTime}
        />

        {/* Quick Summary */}
        <div className={s.quickSummaryBox}>
          <div className={s.quickSummaryHeader}>
            <p className={s.quickSummaryLabel}>Quick Summary</p>
            <div className={s.quickSummaryMeta}>
              <span className={s.quickSummaryMetaItem}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {ARTICLE.readingTime}
              </span>
            </div>
          </div>
          <ul className={s.quickSummaryList}>
            <li className={s.quickSummaryPoint}>
              Use your analytics, competitors, and search suggestions to find
              proven video ideas
            </li>
            <li className={s.quickSummaryPoint}>
              Validate ideas with a scorecard before filming to avoid wasting
              time
            </li>
            <li className={s.quickSummaryPoint}>
              Turn one topic into multiple videos using the expansion method
            </li>
            <li className={s.quickSummaryPoint}>
              Build a 30 day content plan so you never run out of ideas
            </li>
          </ul>
        </div>
      </header>

      {/* Article Layout with Sidebar */}
      <div className={s.articleLayout}>
        {/* Sidebar TOC (Desktop only) */}
        <aside className={s.articleSidebar}>
          <nav className={s.sidebarToc} aria-label="Table of contents">
            <p className={s.sidebarTocTitle}>In this guide</p>
            <ol className={s.sidebarTocList}>
              {ARTICLE.toc.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} className={s.sidebarTocLink}>
                    {item.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        {/* Main Content */}
        <div className={s.articleMain}>
          {/* Mobile TOC */}
          <div className={s.mobileToc}>
            <TableOfContents items={ARTICLE.toc} />
          </div>

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
                You have a list of video ideas. Some you are excited about, some
                you think should work. You film one, edit it, upload it.
                Crickets. Meanwhile, a creator in your niche posts something
                similar and gets ten times the views. The difference usually is
                not production quality or luck. It is idea selection.
              </p>
              <p className={s.sectionText}>
                Most creators brainstorm ideas based on gut feeling or what they
                personally find interesting. The problem is that your interests
                do not always align with what your audience searches for or what
                the algorithm promotes. A great idea for you might be a dud for
                your viewers.
              </p>
              <p className={s.sectionText}>
                Data driven idea generation flips this approach. Instead of
                guessing what might work, you start with what your audience
                already engages with. You find proven demand, then create
                content that meets it.
              </p>
              <h3 className={s.subheading}>What This Guide Gives You</h3>
              <ul className={s.list}>
                <li>
                  A repeatable system to find YouTube video ideas whenever you
                  need them
                </li>
                <li>
                  Methods to spot trending topics before they get saturated
                </li>
                <li>
                  A validation scorecard so you stop wasting time on ideas that
                  will not perform
                </li>
                <li>Title and thumbnail patterns you can apply to any topic</li>
                <li>A 30 day content plan template you can use and repeat</li>
              </ul>
            </section>

            {/* Ideas Checklist */}
            <section id="ideas-checklist" className={s.section}>
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
                YouTube Video Ideas Checklist (15 Minutes)
              </h2>
              <p className={s.sectionText}>
                Run this checklist whenever you feel stuck or need fresh content
                ideas. Set a timer for 15 minutes and work through each step.
              </p>
              <ol className={s.numberedList}>
                <li>
                  <strong>Check your own analytics (3 min):</strong> Open
                  YouTube Studio, go to Content, sort by views. What are your
                  top 5 videos in the last 90 days? Write down the topics.
                </li>
                <li>
                  <strong>Scan 3 competitor channels (5 min):</strong> Visit the
                  Videos tab on 3 competitors. Sort by Popular. Note any topics
                  you have not covered. Look for recent videos with unusually
                  high views.
                </li>
                <li>
                  <strong>YouTube search suggestions (3 min):</strong> Type 5
                  seed topics related to your niche into YouTube search. Do not
                  hit enter. Write down the autocomplete suggestions.
                </li>
                <li>
                  <strong>Comment mining (3 min):</strong> Open 2 popular videos
                  in your niche. Scroll through comments. Note any questions,
                  requests, or complaints.
                </li>
                <li>
                  <strong>Pick your top 3 (1 min):</strong> From everything you
                  wrote down, circle the 3 ideas with the clearest demand and
                  best fit for your channel.
                </li>
              </ol>
              <p className={s.sectionText}>
                Do this weekly. You will never run out of YouTube content ideas
                if you have a regular research habit.
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
                5 Data Driven Sources for Video Ideas
              </h2>

              <h3 className={s.subheading}>1. Your Own Best Performers</h3>
              <p className={s.sectionText}>
                <strong>What it is:</strong> Videos on your channel that got
                more views, subscribers, or engagement than your average.
              </p>
              <p className={s.sectionText}>
                <strong>How to use it:</strong> In YouTube Studio, go to
                Analytics, then Content. Sort by views, watch time, or
                subscribers gained. Look at your top 10 videos over the last
                year. Ask: what topic, format, or angle made these work?
              </p>
              <p className={s.sectionText}>
                <strong>Good signal:</strong> A video that got significantly
                more subscribers per view than your average. This means the
                topic attracted the right audience.
              </p>
              <p className={s.sectionText}>
                <strong>Example:</strong> Your video on &ldquo;budget camera
                settings&rdquo; got 50k views while your average is 10k. Create
                a sequel: &ldquo;budget audio setup&rdquo; or &ldquo;budget
                lighting for beginners.&rdquo;
              </p>

              <h3 className={s.subheading}>2. Competitor Outliers</h3>
              <p className={s.sectionText}>
                <strong>What it is:</strong> Videos from similar channels that
                performed much better than their usual content.
              </p>
              <p className={s.sectionText}>
                <strong>How to use it:</strong> Go to a competitor&apos;s
                channel, click Videos, and mentally note their typical view
                count. Any video with roughly double that count (or more) is an
                outlier worth studying. For a deeper process, see our{" "}
                <Link href="/learn/youtube-competitor-analysis">
                  competitor analysis guide
                </Link>
                .
              </p>
              <p className={s.sectionText}>
                <strong>Good signal:</strong> Multiple competitors have outlier
                videos on the same topic. That pattern indicates proven demand.
              </p>
              <p className={s.sectionText}>
                <strong>Example:</strong> Three cooking channels all have a top
                video on &ldquo;one pot meals.&rdquo; You make recipe content
                but have never covered this. Add it to your list.
              </p>

              <h3 className={s.subheading}>3. YouTube Search Suggestions</h3>
              <p className={s.sectionText}>
                <strong>What it is:</strong> The autocomplete dropdown that
                appears when you type in YouTube search.
              </p>
              <p className={s.sectionText}>
                <strong>How to use it:</strong> Type a seed topic, then add
                letters (a, b, c...) or words (for beginners, vs, how to) to see
                more suggestions. These are real queries people search for.
              </p>
              <p className={s.sectionText}>
                <strong>Good signal:</strong> A suggestion that is specific
                enough to target, but broad enough to have demand. Long tail
                queries often have less competition.
              </p>
              <p className={s.sectionText}>
                <strong>Example:</strong> You type &ldquo;guitar&rdquo; and see
                &ldquo;guitar for beginners,&rdquo; &ldquo;guitar songs
                easy,&rdquo; &ldquo;guitar vs ukulele.&rdquo; Each is a
                potential video idea.
              </p>

              <h3 className={s.subheading}>4. Comments on Popular Videos</h3>
              <p className={s.sectionText}>
                <strong>What it is:</strong> Questions, requests, and feedback
                left by viewers on top videos in your niche.
              </p>
              <p className={s.sectionText}>
                <strong>How to use it:</strong> Open a popular video in your
                niche. Sort comments by Top or Newest. Look for repeated
                questions (&ldquo;Can you do a video on...&rdquo;), complaints
                (&ldquo;I wish you covered...&rdquo;), or praise for specific
                parts.
              </p>
              <p className={s.sectionText}>
                <strong>Good signal:</strong> The same question appears multiple
                times, or a comment has lots of likes asking for something
                specific.
              </p>
              <p className={s.sectionText}>
                <strong>Example:</strong> On a video about iPhone photography,
                50 comments ask about editing apps. Make a video answering that
                question.
              </p>

              <h3 className={s.subheading}>
                5. Trending Topics in Adjacent Niches
              </h3>
              <p className={s.sectionText}>
                <strong>What it is:</strong> Formats or topics performing well
                in related niches that have not been applied to yours yet.
              </p>
              <p className={s.sectionText}>
                <strong>How to use it:</strong> Look at niches that share your
                audience or content style. What formats are working there? Can
                you adapt them? This is often how new trends start.
              </p>
              <p className={s.sectionText}>
                <strong>Good signal:</strong> A format (like &ldquo;day in the
                life&rdquo; or &ldquo;I tried X for 30 days&rdquo;) is blowing
                up in one niche but barely exists in yours.
              </p>
              <p className={s.sectionText}>
                <strong>Example:</strong> &ldquo;Ranking every [item] from worst
                to best&rdquo; is huge in food content. You make tech reviews.
                Try &ldquo;Ranking every budget phone from worst to best.&rdquo;
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
                The main YouTube Trending page is mostly mainstream
                entertainment. What you want is trending within your niche:
                topics getting more attention than usual from your target
                audience.
              </p>
              <h3 className={s.subheading}>A Repeatable Process</h3>
              <ol className={s.numberedList}>
                <li>
                  <strong>Start with seed topics.</strong> List 5 to 10 core
                  topics you could make videos about.
                </li>
                <li>
                  <strong>Scan competitor uploads.</strong> For each of 3 to 5
                  competitors, check their last 20 videos. Look for any with
                  significantly more views than their average.
                </li>
                <li>
                  <strong>Spot outliers.</strong> A video with roughly double
                  the typical views, posted recently, signals a trending topic.
                  For more detail on identifying outliers, see our{" "}
                  <Link href="/learn/youtube-competitor-analysis">
                    competitor analysis guide
                  </Link>
                  .
                </li>
                <li>
                  <strong>Validate with recency.</strong> Focus on videos from
                  the last 30 to 90 days. Old hits may indicate saturated
                  topics, not current trends.
                </li>
                <li>
                  <strong>Check velocity.</strong> A video that hit high views
                  quickly (first week) is more interesting than one that took 6
                  months.
                </li>
                <li>
                  <strong>Extract the angle.</strong> What specific approach did
                  they take? What made it different from other videos on the
                  same subject?
                </li>
                <li>
                  <strong>Create your version.</strong> Do not copy. Find your
                  own angle, add your perspective, or go deeper on a subtopic.
                </li>
              </ol>
              <p className={s.sectionText}>
                Patterns beat individual videos. If multiple competitors have
                recent hits on the same topic, that is a strong signal. One
                viral video could be a fluke. Three is a pattern.
              </p>
            </section>

            {/* Keyword Research */}
            <section id="keyword-research" className={s.section}>
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
                YouTube Keyword Research for Beginners
              </h2>
              <p className={s.sectionText}>
                YouTube keyword research means finding what your audience
                actually searches for. Unlike Google, YouTube does not show
                search volume directly. But you can infer demand from
                autocomplete, results, and competitor performance.
              </p>
              <h3 className={s.subheading}>Using YouTube Search Suggestions</h3>
              <ol className={s.numberedList}>
                <li>
                  Go to YouTube and make sure you are signed out (or use
                  incognito) to avoid personalized results
                </li>
                <li>Type a broad topic related to your niche</li>
                <li>
                  Note the autocomplete suggestions. These are queries people
                  actually search for.
                </li>
                <li>
                  Add modifiers: &ldquo;how to [topic],&rdquo; &ldquo;[topic]
                  for beginners,&rdquo; &ldquo;[topic] vs,&rdquo; &ldquo;best
                  [topic]&rdquo;
                </li>
                <li>
                  Try the alphabet trick: type your topic followed by a, b, c...
                  to discover more specific queries
                </li>
              </ol>
              <h3 className={s.subheading}>Evaluating the Results Page</h3>
              <p className={s.sectionText}>
                After finding a promising query, search for it and analyze the
                results:
              </p>
              <ul className={s.list}>
                <li>
                  <strong>Who ranks?</strong> If only mega channels (1M+
                  subscribers) show up, the topic may be too competitive. If
                  smaller channels appear, you have a chance.
                </li>
                <li>
                  <strong>How recent?</strong> If top results are years old,
                  either the topic is evergreen or nobody is making fresh
                  content. Test with a recent upload.
                </li>
                <li>
                  <strong>View counts:</strong> High views on multiple videos
                  confirm demand. Low views might mean the phrasing is wrong or
                  the topic is too niche.
                </li>
                <li>
                  <strong>Title variety:</strong> If all titles are similar,
                  there may be room for a different angle.
                </li>
              </ul>
              <h3 className={s.subheading}>Avoiding Saturated Topics</h3>
              <p className={s.sectionText}>
                A topic is saturated when every angle has been covered by bigger
                channels. Signs of saturation: only large channels rank, results
                are recent and high quality, and there is no clear gap in
                coverage. If you find a saturated topic, go more specific (long
                tail) or find a fresh angle.
              </p>
            </section>

            {/* Shorts Ideas */}
            <section id="shorts-ideas" className={s.section}>
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
                    <rect x="6" y="3" width="12" height="18" rx="2" />
                    <path d="M9 18h6" />
                  </svg>
                </span>
                YouTube Shorts Ideas That Turn Into Long Form Views
              </h2>
              <p className={s.sectionText}>
                Shorts can drive discovery and{" "}
                <Link href="/learn/how-to-get-more-subscribers">
                  subscriber growth
                </Link>
                , but the best Shorts connect back to your main content. Here
                are idea formats grouped by niche type.
              </p>
              <h3 className={s.subheading}>Educational and How To Niches</h3>
              <ul className={s.list}>
                <li>One quick tip in 30 seconds</li>
                <li>Common mistake and the fix</li>
                <li>Tool or technique demonstration</li>
                <li>&ldquo;Did you know?&rdquo; surprising fact</li>
              </ul>
              <h3 className={s.subheading}>
                Entertainment and Lifestyle Niches
              </h3>
              <ul className={s.list}>
                <li>Behind the scenes moment</li>
                <li>Day in the life highlight</li>
                <li>Reaction to a comment or trend</li>
                <li>Before and after reveal</li>
              </ul>
              <h3 className={s.subheading}>Product and Review Niches</h3>
              <ul className={s.list}>
                <li>30 second product verdict</li>
                <li>&ldquo;One thing I love / one thing I hate&rdquo;</li>
                <li>Unboxing first impressions</li>
                <li>Side by side comparison clip</li>
              </ul>
              <h3 className={s.subheading}>Connecting Shorts to Long Form</h3>
              <p className={s.sectionText}>
                The best Shorts strategy is to create clips that tease or
                complement your longer videos:
              </p>
              <ul className={s.list}>
                <li>
                  <strong>Teaser:</strong> Share the most interesting 30 seconds
                  of an upcoming video
                </li>
                <li>
                  <strong>Expansion:</strong> Answer a question from comments
                  with a Short, then mention the full video
                </li>
                <li>
                  <strong>Clip:</strong> Pull a compelling moment from an
                  existing long video
                </li>
                <li>
                  <strong>Series:</strong> Create a Shorts series that builds
                  toward a comprehensive long form video
                </li>
              </ul>
              <p className={s.sectionText}>
                Shorts viewers who want more will check your channel. If they
                find related long form content, they are more likely to
                subscribe.
              </p>
            </section>

            {/* Niche Ideas */}
            <section id="niche-ideas" className={s.section}>
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
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </span>
                YouTube Niche Ideas and How to Pick One
              </h2>
              <p className={s.sectionText}>
                If you are just starting or thinking about pivoting, picking the
                right niche makes everything easier. The right niche has built
                in demand, manageable competition, and enough depth for you to
                create content for years.
              </p>
              <h3 className={s.subheading}>Niche Selection Framework</h3>
              <ul className={s.list}>
                <li>
                  <strong>Audience:</strong> Who are you making videos for? Can
                  you describe them specifically? Vague audiences lead to vague
                  content.
                </li>
                <li>
                  <strong>Problem:</strong> What problem do you help them solve,
                  or what desire do you help them fulfill? The clearer the
                  problem, the easier to make compelling content.
                </li>
                <li>
                  <strong>Proof:</strong> Are other creators succeeding in this
                  niche? No successful creators might mean no demand. Many
                  successful creators means proven demand (and competition).
                </li>
                <li>
                  <strong>Repeatability:</strong> Can you come up with 50+ video
                  ideas without running dry? If you struggle to list 20, the
                  niche may be too narrow or you may not have enough knowledge
                  yet.
                </li>
                <li>
                  <strong>Monetization (optional):</strong> Does the audience
                  have spending power? Are there sponsors, affiliates, or
                  products that fit? This matters more later, but worth
                  considering.
                </li>
              </ul>
              <h3 className={s.subheading}>Popular Niche Categories</h3>
              <p className={s.sectionText}>
                These broad categories have proven demand, but you will need to
                find your specific angle within them:
              </p>
              <ul className={s.list}>
                <li>Technology (reviews, tutorials, news)</li>
                <li>Gaming (gameplay, guides, commentary)</li>
                <li>Personal finance and investing</li>
                <li>Health and fitness</li>
                <li>Cooking and food</li>
                <li>Education and explainers</li>
                <li>DIY and crafts</li>
                <li>Travel and adventure</li>
                <li>Productivity and self improvement</li>
                <li>Entertainment and commentary</li>
              </ul>
              <p className={s.sectionText}>
                The best niche is specific enough to have a clear audience, but
                broad enough to sustain years of content. Once you have a niche,
                the idea generation methods in this guide become much easier.
              </p>
            </section>

            {/* Validation */}
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
                Not every idea is worth filming. Before you spend hours on
                production, validate that the idea has demand and that you can
                compete.
              </p>
              <h3 className={s.subheading}>Quick Validation Checks</h3>
              <ul className={s.list}>
                <li>
                  <strong>Search volume check:</strong> Does anyone search for
                  this topic? Type it into YouTube and see if autocomplete
                  suggests it. No suggestions might mean low demand.
                </li>
                <li>
                  <strong>Competition assessment:</strong> How many videos
                  exist? Are they from channels your size or only mega channels?
                  Can you offer something different or better?
                </li>
                <li>
                  <strong>Recency test:</strong> Have recent videos on this
                  topic performed well? Recent success is a stronger signal than
                  old hits.
                </li>
                <li>
                  <strong>Audience fit:</strong> Does this align with what your
                  current subscribers expect? A mismatch can hurt both
                  performance and subscriber quality.
                </li>
                <li>
                  <strong>Packaging potential:</strong> Can you write a
                  compelling title and visualize an eye catching thumbnail? If
                  packaging is hard, the idea might be too abstract.
                </li>
                <li>
                  <strong>Production cost:</strong> How much time and resources
                  will this take? Is the expected return worth the investment?
                </li>
              </ul>
              <h3 className={s.subheading}>Green / Yellow / Red Light</h3>
              <p className={s.sectionText}>
                <strong>Green light:</strong> Clear demand, manageable
                competition, fits your audience, easy to package. Start
                production.
              </p>
              <p className={s.sectionText}>
                <strong>Yellow light:</strong> Some demand, but competition is
                strong or audience fit is unclear. Find a more specific angle or
                test with a simpler version first.
              </p>
              <p className={s.sectionText}>
                <strong>Red light:</strong> No clear demand, saturated
                competition, or major audience mismatch. Skip this idea or save
                it for later.
              </p>
            </section>

            {/* Idea Validation Scorecard */}
            <section id="idea-validation-scorecard" className={s.section}>
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
                Idea Validation Scorecard You Can Reuse
              </h2>
              <p className={s.sectionText}>
                Use this scorecard to evaluate any video idea. Score each factor
                from 1 (poor) to 5 (excellent). A total score helps you
                prioritize which ideas to pursue first.
              </p>
              <h3 className={s.subheading}>The Scorecard</h3>
              <ul className={s.list}>
                <li>
                  <strong>Demand (1 to 5):</strong> Is there search volume? Do
                  competitor videos on this topic get views?
                </li>
                <li>
                  <strong>Competition (1 to 5):</strong> Can you compete? Are
                  there gaps you can fill? (5 = low competition, 1 = saturated)
                </li>
                <li>
                  <strong>Freshness (1 to 5):</strong> Is this topic current or
                  getting stale? (5 = trending now, 1 = overdone)
                </li>
                <li>
                  <strong>Audience fit (1 to 5):</strong> Does this match what
                  your subscribers expect?
                </li>
                <li>
                  <strong>Packaging potential (1 to 5):</strong> Can you write a
                  great title and create an eye catching thumbnail?
                </li>
                <li>
                  <strong>Production cost (1 to 5):</strong> Is the effort
                  reasonable for the expected return? (5 = easy, 1 = very hard)
                </li>
              </ul>
              <h3 className={s.subheading}>Example: Scoring an Idea</h3>
              <p className={s.sectionText}>
                <strong>Idea:</strong> &ldquo;5 budget cameras for beginners in
                2026&rdquo;
              </p>
              <ul className={s.list}>
                <li>
                  Demand: 4 (autocomplete suggests it, competitor videos get
                  views)
                </li>
                <li>
                  Competition: 3 (several videos exist, but most are outdated)
                </li>
                <li>Freshness: 5 (the 2026 angle is timely)</li>
                <li>Audience fit: 5 (my audience is beginner photographers)</li>
                <li>
                  Packaging potential: 4 (clear title, thumbnail can show
                  cameras)
                </li>
                <li>
                  Production cost: 3 (need to research and possibly rent gear)
                </li>
              </ul>
              <p className={s.sectionText}>
                <strong>Total: 24 / 30</strong>
              </p>
              <p className={s.sectionText}>
                This is a strong idea. The competition is manageable, freshness
                gives an edge, and audience fit is excellent. Proceed with
                production.
              </p>
            </section>

            {/* Title and Thumbnail */}
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
                YouTube Title Ideas and Thumbnail Ideas That Get Clicks
              </h2>
              <p className={s.sectionText}>
                Titles and thumbnails are the packaging of your video. Even a
                great idea fails if nobody clicks. Study what works in your
                niche, then apply those patterns to your content.
              </p>
              <h3 className={s.subheading}>15 YouTube Title Templates</h3>
              <ol className={s.numberedList}>
                <li>How to [achieve result] in [timeframe]</li>
                <li>[Number] [things] every [audience] should know</li>
                <li>I tried [thing] for [timeframe]. Here is what happened.</li>
                <li>Why [common belief] is wrong</li>
                <li>The [only/best/fastest] way to [result]</li>
                <li>[Thing] vs [thing]: which is actually better?</li>
                <li>Stop doing [mistake] (do this instead)</li>
                <li>What nobody tells you about [topic]</li>
                <li>Is [thing] actually worth it?</li>
                <li>[Number] mistakes [audience] make</li>
                <li>The truth about [topic]</li>
                <li>How I [achieved result] (step by step)</li>
                <li>Watch this before you [action]</li>
                <li>[Year] [topic] guide for beginners</li>
                <li>[Number] [things] under [price/time]</li>
              </ol>
              <h3 className={s.subheading}>10 Thumbnail Concept Patterns</h3>
              <ol className={s.numberedList}>
                <li>
                  <strong>Face with emotion:</strong> Expressive face matching
                  the video emotion (surprised, excited, frustrated)
                </li>
                <li>
                  <strong>Before and after:</strong> Split image showing
                  transformation
                </li>
                <li>
                  <strong>Product focus:</strong> Clean shot of the main subject
                  with minimal text
                </li>
                <li>
                  <strong>Contrast colors:</strong> Bold background color that
                  pops in the feed
                </li>
                <li>
                  <strong>Big number:</strong> Large number overlay indicating a
                  list or result
                </li>
                <li>
                  <strong>Question visual:</strong> Visual that creates a
                  question in the viewer&apos;s mind
                </li>
                <li>
                  <strong>Comparison:</strong> Two items or options side by side
                </li>
                <li>
                  <strong>Action shot:</strong> Mid motion capture showing
                  something happening
                </li>
                <li>
                  <strong>Text callout:</strong> 2 to 4 word overlay that
                  communicates the key benefit
                </li>
                <li>
                  <strong>Unexpected element:</strong> Something unusual that
                  stops the scroll
                </li>
              </ol>
              <h3 className={s.subheading}>Using AI Title Generators</h3>
              <p className={s.sectionText}>
                An AI YouTube title generator can help you brainstorm angles
                quickly. The process: feed it your topic and a style you have
                seen work, generate 10 to 20 options, then manually refine the
                best ones. AI output often sounds generic. Add specificity,
                numbers, and your voice before publishing.
              </p>
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
                A validated idea needs to become a packaged, structured video.
                Here is a template to move from idea to content.
              </p>
              <h3 className={s.subheading}>Title Formula</h3>
              <p className={s.sectionText}>
                Before you film, write 5 to 10 title options. If you cannot
                write a compelling title, reconsider the idea. Pick the title
                with the clearest benefit and strongest curiosity.
              </p>
              <h3 className={s.subheading}>Thumbnail Concept Checklist</h3>
              <ul className={s.list}>
                <li>What is the main visual element?</li>
                <li>Does it communicate the video promise?</li>
                <li>
                  Will it stand out in the feed next to competitor thumbnails?
                </li>
                <li>Is the text (if any) readable at small sizes?</li>
                <li>Does it complement the title without repeating it?</li>
              </ul>
              <h3 className={s.subheading}>First 15 Seconds Hook Outline</h3>
              <p className={s.sectionText}>
                The opening determines{" "}
                <Link href="/learn/youtube-retention-analysis">retention</Link>.
                Plan your hook before filming:
              </p>
              <ul className={s.list}>
                <li>
                  <strong>Option 1 (Tease the payoff):</strong> Show or describe
                  the end result, then say &ldquo;Here is how.&rdquo;
                </li>
                <li>
                  <strong>Option 2 (Ask a question):</strong> Pose a question
                  your audience has, then promise the answer.
                </li>
                <li>
                  <strong>Option 3 (Challenge a belief):</strong> State
                  something surprising or counterintuitive to create curiosity.
                </li>
                <li>
                  <strong>Option 4 (Jump into action):</strong> Start mid
                  process with energy, then quickly orient the viewer.
                </li>
              </ul>
              <h3 className={s.subheading}>Payoff Planning</h3>
              <p className={s.sectionText}>
                Every video needs a satisfying payoff. Before filming, answer:
              </p>
              <ul className={s.list}>
                <li>What will viewers know or be able to do after watching?</li>
                <li>
                  What is the one thing they will remember and tell others?
                </li>
                <li>How will you signal the video delivered on its promise?</li>
              </ul>
            </section>

            {/* ChannelBoost CTA */}
            <div className={s.highlight}>
              <p>
                <strong>Want help finding video ideas?</strong> {BRAND.name}{" "}
                generates ideas based on what is working in your niche. See
                trending topics, competitor outliers, and validated ideas you
                can use for your next video.
              </p>
            </div>

            {/* 30 Day Content Plan */}
            <section id="content-plan" className={s.section}>
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
                30 Day Content Plan: Never Run Out of YouTube Ideas
              </h2>
              <p className={s.sectionText}>
                Knowing how to come up with YouTube video ideas is one thing.
                Turning that into a sustainable content calendar is another.
                Here is a 30 day plan you can repeat.
              </p>

              <h3 className={s.subheading}>Week 1: Research and Brainstorm</h3>
              <ul className={s.list}>
                <li>
                  Run the 15 minute ideas checklist 3 times this week (different
                  days)
                </li>
                <li>Build a list of 15 to 20 raw ideas</li>
                <li>Use the validation scorecard to rank each idea</li>
                <li>Identify your top 4 ideas for the month</li>
              </ul>

              <h3 className={s.subheading}>Week 2: Pick Themes and Outline</h3>
              <ul className={s.list}>
                <li>
                  Group your top ideas by theme if possible (series potential)
                </li>
                <li>Write title options and thumbnail concepts for each</li>
                <li>Outline each video: hook, main points, payoff</li>
                <li>Schedule your production timeline</li>
              </ul>

              <h3 className={s.subheading}>Week 3: Produce and Publish</h3>
              <ul className={s.list}>
                <li>Film video 1 and 2</li>
                <li>Edit and publish video 1</li>
                <li>Monitor early performance: CTR, retention, engagement</li>
                <li>Note what is working and what is not</li>
              </ul>

              <h3 className={s.subheading}>Week 4: Evaluate and Iterate</h3>
              <ul className={s.list}>
                <li>Publish video 2</li>
                <li>Review performance of video 1 after 7 days</li>
                <li>
                  Analyze: Did the idea perform as expected? What can you learn
                  from the{" "}
                  <Link href="/learn/youtube-retention-analysis">
                    retention curve
                  </Link>
                  ?
                </li>
                <li>
                  Start research for next month using insights from this month
                </li>
                <li>Repeat the cycle</li>
              </ul>
              <p className={s.sectionText}>
                Consistency beats volume. Publishing 4 well researched videos is
                better than 12 random ones. Each cycle teaches you what works
                for your channel. Over time, your hit rate improves. This
                approach is how creators get more views on YouTube and{" "}
                <Link href="/learn/how-to-get-more-subscribers">
                  build a subscriber base
                </Link>{" "}
                that actually watches.
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
                Example: Turning One Topic Into 12 Video Ideas
              </h2>
              <p className={s.sectionText}>
                Here is a practical example of how one validated topic can
                become a month of content.
              </p>

              <h3 className={s.subheading}>
                The Niche: Home Office Productivity
              </h3>
              <p className={s.sectionText}>
                You run a small channel about working from home. Your research
                shows that &ldquo;desk setup&rdquo; topics consistently get
                views across competitor channels.
              </p>

              <h3 className={s.subheading}>The Seed Topic: Desk Setup</h3>
              <p className={s.sectionText}>
                Competitor analysis shows: desk tour videos perform well, budget
                setups get more engagement than expensive ones, and
                &ldquo;before/after&rdquo; transformations have high click
                rates.
              </p>

              <h3 className={s.subheading}>12 Video Ideas From This Pattern</h3>
              <ol className={s.numberedList}>
                <li>
                  <strong>
                    &ldquo;My $300 Home Office Setup (Everything You
                    Need)&rdquo;
                  </strong>{" "}
                  — Budget focused, comprehensive
                </li>
                <li>
                  <strong>
                    &ldquo;5 Desk Setup Mistakes That Kill Your
                    Productivity&rdquo;
                  </strong>{" "}
                  — Problem focused, list format
                </li>
                <li>
                  <strong>
                    &ldquo;I Upgraded My Desk for $50. Here is What
                    Changed.&rdquo;
                  </strong>{" "}
                  — Personal story, before/after
                </li>
                <li>
                  <strong>
                    &ldquo;The Best Desk Under $200 for Working From Home&rdquo;
                  </strong>{" "}
                  — Product recommendation
                </li>
                <li>
                  <strong>
                    &ldquo;Stop Buying These Desk Accessories (Waste of
                    Money)&rdquo;
                  </strong>{" "}
                  — Contrarian angle
                </li>
                <li>
                  <strong>
                    &ldquo;How to Organize Your Desk in 15 Minutes&rdquo;
                  </strong>{" "}
                  — Quick tutorial
                </li>
                <li>
                  <strong>
                    &ldquo;Standing Desk vs Sitting Desk: Which is
                    Better?&rdquo;
                  </strong>{" "}
                  — Comparison format
                </li>
                <li>
                  <strong>
                    &ldquo;Desk Setup for Small Spaces (Under 50 sq ft)&rdquo;
                  </strong>{" "}
                  — Specific constraint
                </li>
                <li>
                  <strong>
                    &ldquo;My Desk Setup for Long Video Editing Sessions&rdquo;
                  </strong>{" "}
                  — Use case specific
                </li>
                <li>
                  <strong>
                    &ldquo;3 Desk Lamps That Actually Reduce Eye Strain&rdquo;
                  </strong>{" "}
                  — Specific product category
                </li>
                <li>
                  <strong>
                    &ldquo;I Tried 5 Desk Chairs. Only One Was Worth It.&rdquo;
                  </strong>{" "}
                  — Personal testing format
                </li>
                <li>
                  <strong>
                    &ldquo;Desk Setup Tour: What Changed After 1 Year of
                    WFH&rdquo;
                  </strong>{" "}
                  — Evolution story
                </li>
              </ol>
              <p className={s.sectionText}>
                Each video uses a different angle on the same proven topic. This
                builds topical authority and gives you a content series. Link
                videos together in descriptions and end screens to keep viewers
                on your channel.
              </p>
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
                Tools Creators Search For (Titles, Tags, Ideas)
              </h2>
              <p className={s.sectionText}>
                Creators often search for tools to help with idea generation,
                titles, and tags. Here is honest guidance on what actually
                matters.
              </p>

              <h3 className={s.subheading}>AI YouTube Title Generators</h3>
              <p className={s.sectionText}>
                These tools can speed up brainstorming. Input your topic and
                desired style, generate many options, then manually edit the
                best ones. Never publish AI output directly. It lacks your voice
                and often sounds generic.
              </p>
              <p className={s.sectionText}>
                Use generators for inspiration, not final copy. The best titles
                come from understanding your audience plus testing what gets
                clicks in your niche.
              </p>

              <h3 className={s.subheading}>YouTube Tag Extractors</h3>
              <p className={s.sectionText}>
                Tag extractors show the hidden tags on any YouTube video. While
                these tools work, tags have minimal impact on discovery in 2026.
                YouTube&apos;s own documentation says tags are most useful for
                commonly misspelled words.
              </p>
              <p className={s.sectionText}>
                Your title, thumbnail, and retention matter far more than tags.
                Spend your time on those instead. If you do use tags, keep them
                simple and relevant. Do not stuff 50 variations.
              </p>

              <h3 className={s.subheading}>
                What Actually Matters for Discovery
              </h3>
              <ul className={s.list}>
                <li>
                  <strong>Title:</strong> Clear, specific, creates curiosity or
                  promises a clear benefit
                </li>
                <li>
                  <strong>Thumbnail:</strong> Stands out, communicates the
                  promise, readable at small sizes
                </li>
                <li>
                  <strong>
                    <Link href="/learn/youtube-retention-analysis">
                      Retention
                    </Link>
                    :
                  </strong>{" "}
                  How long viewers watch determines how much YouTube promotes
                  the video
                </li>
                <li>
                  <strong>CTR:</strong> Click through rate signals whether your
                  packaging appeals to the audience YouTube shows it to
                </li>
              </ul>
              <p className={s.sectionText}>
                Focus on these fundamentals. Tools can help, but they do not
                replace understanding your audience.
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
                Common Video Idea Mistakes (And What to Do Instead)
              </h2>
              <ul className={s.list}>
                <li>
                  <strong>Making videos only you care about.</strong> Passion
                  matters, but demand matters more. Validate that others want to
                  watch the topic, not just that you want to make it.
                </li>
                <li>
                  <strong>Copying competitor videos directly.</strong> Learn
                  patterns, do not copy executions. Your version needs a unique
                  angle or better execution to stand out.
                </li>
                <li>
                  <strong>Ignoring your own analytics.</strong> Your best
                  performing videos are data about what your audience wants.
                  Make more content like your hits.
                </li>
                <li>
                  <strong>Chasing trends you cannot execute.</strong> A trending
                  topic only helps if you can make quality content on it. Skip
                  trends outside your expertise.
                </li>
                <li>
                  <strong>Overthinking before starting.</strong> Analysis
                  paralysis is real. Limit research time, pick an idea, and
                  ship. You learn more from publishing than planning.
                </li>
                <li>
                  <strong>No research at all.</strong> The opposite extreme:
                  filming whatever comes to mind without any validation. A few
                  minutes of research can save hours of wasted production.
                </li>
                <li>
                  <strong>Saturated topics without differentiation.</strong> If
                  50 channels already covered a topic, you need a unique angle,
                  not a copy.
                </li>
                <li>
                  <strong>Too broad topics.</strong> &ldquo;Photography
                  tips&rdquo; is vague. &ldquo;3 portrait lighting setups with
                  one light&rdquo; is specific and searchable.
                </li>
                <li>
                  <strong>Too narrow topics.</strong> If search suggestions do
                  not show it and competitors have not covered it, demand may be
                  too low. Balance specificity with demand.
                </li>
                <li>
                  <strong>Poor packaging on good ideas.</strong> A great topic
                  with a bad title and thumbnail will fail. If you cannot
                  package the idea compellingly, rethink it.
                </li>
                <li>
                  <strong>Never reviewing performance.</strong> Publishing
                  without checking results means you cannot learn what works.
                  Spend 10 minutes reviewing each video&apos;s performance after
                  7 days.
                </li>
              </ul>
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
              title="Find Your Next Video Idea"
              description={`${BRAND.name} helps you discover ideas based on what is working in your niche. See trending topics, competitor outliers, and validated ideas you can use.`}
            />
          </article>
        </div>
      </div>
    </main>
  );
}
