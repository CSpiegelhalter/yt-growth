/**
 * Body content for Find Video Inspiration article.
 * Server component - no "use client" directive.
 */

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import type { BodyProps } from "./index";

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* Why Inspiration Matters */}
      <section id="why-inspiration-matters" className={s.section}>
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
          Why Inspiration Matters for YouTube Growth
        </h2>
        <p className={s.sectionText}>
          Every creator hits the wall. You sit down to plan your next video and
          draw a blank. Your last few ideas flopped. You are not sure what your
          audience actually wants. This is normal, but it is also solvable.
        </p>
        <p className={s.sectionText}>
          The difference between creators who grow and those who stall often
          comes down to their inspiration system. Successful creators do not
          rely on random bursts of creativity. They have a repeatable process
          for finding ideas that are already proven to work.
        </p>
        <p className={s.sectionText}>
          This guide shows you how to find video inspiration by studying what is
          working in your niche, spotting patterns in successful content, and
          using tools to generate ideas based on real data. No more guessing.
        </p>
      </section>

      {/* 10 Minute Inspiration Checklist */}
      <section id="inspiration-checklist" className={s.section}>
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
          10 Minute Inspiration Checklist
        </h2>
        <p className={s.sectionText}>
          Use this checklist whenever you need fresh ideas. Set a timer for 10
          minutes and work through each step.
        </p>
        <ol className={s.numberedList}>
          <li>
            <strong>Check 3 competitor channels (4 min):</strong> Go to their
            Videos tab, sort by Popular, and note any topics that got unusually
            high views. Write down 3 to 5 ideas.
          </li>
          <li>
            <strong>Scan YouTube search suggestions (2 min):</strong> Type 3
            seed topics into YouTube search without hitting enter. Note the
            autocomplete suggestions. These are real queries.
          </li>
          <li>
            <strong>Check your own analytics (2 min):</strong> Look at your top
            5 videos by views in the last 90 days. What topics or formats worked
            best? Can you make related content?
          </li>
          <li>
            <strong>Read 5 comments (2 min):</strong> Open a popular video in
            your niche and read the top comments. Look for questions or requests
            from viewers.
          </li>
        </ol>
        <p className={s.sectionText}>
          Do this weekly. You will build a backlog of validated ideas and never
          face a blank content calendar again.
        </p>
      </section>

      {/* Study What's Working for Others */}
      <section id="study-competitors" className={s.section}>
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
          Study What's Working for Other Channels
        </h2>
        <p className={s.sectionText}>
          The fastest way to find inspiration is to see what is already
          performing well in your niche. Other creators have done the testing
          for you. Your job is to learn from their data.
        </p>

        <h3 className={s.subheading}>How to Find Competitor Outliers</h3>
        <ol className={s.numberedList}>
          <li>
            Make a list of 5 to 10 channels in your niche at various sizes
          </li>
          <li>
            Visit each channel and click the Videos tab
          </li>
          <li>
            Sort by Most Popular and note their average view count
          </li>
          <li>
            Look for videos with 2x or more their typical views. These are
            outliers.
          </li>
          <li>
            Write down the topic, title pattern, and thumbnail style
          </li>
        </ol>

        <h3 className={s.subheading}>What to Look For</h3>
        <ul className={s.list}>
          <li>
            <strong>Topics that hit across multiple channels:</strong> If 3
            different creators all have outliers on the same subject, that is
            proven demand
          </li>
          <li>
            <strong>Recent outliers:</strong> A video that popped in the last 30
            days signals current interest, not past trends
          </li>
          <li>
            <strong>Format patterns:</strong> Lists, tutorials, comparisons,
            stories. Which formats get the most engagement?
          </li>
          <li>
            <strong>Gaps:</strong> Topics that work for others but you have not
            covered yet
          </li>
        </ul>
        <p className={s.sectionText}>
          For a deeper process, see our{" "}
          <Link href="/learn/youtube-competitor-analysis">
            competitor analysis guide
          </Link>
          .
        </p>
      </section>

      {/* Spot Patterns in Successful Videos */}
      <section id="spot-patterns" className={s.section}>
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
          Spot Patterns in Successful Videos
        </h2>
        <p className={s.sectionText}>
          Inspiration is not about copying. It is about understanding why
          certain content works and applying those principles to your own ideas.
        </p>

        <h3 className={s.subheading}>Title Patterns to Notice</h3>
        <ul className={s.list}>
          <li>
            <strong>Numbers and lists:</strong> &ldquo;7 mistakes&rdquo;,
            &ldquo;5 tips&rdquo;, &ldquo;3 things I wish I knew&rdquo;
          </li>
          <li>
            <strong>How to promises:</strong> &ldquo;How to X in Y time&rdquo;,
            &ldquo;How I achieved X&rdquo;
          </li>
          <li>
            <strong>Curiosity gaps:</strong> &ldquo;Why X is wrong&rdquo;,
            &ldquo;What nobody tells you about X&rdquo;
          </li>
          <li>
            <strong>Comparisons:</strong> &ldquo;X vs Y&rdquo;, &ldquo;Which is
            better?&rdquo;
          </li>
          <li>
            <strong>Personal stories:</strong> &ldquo;I tried X for 30
            days&rdquo;, &ldquo;My journey to X&rdquo;
          </li>
        </ul>

        <h3 className={s.subheading}>Content Structure Patterns</h3>
        <ul className={s.list}>
          <li>
            <strong>Problem then solution:</strong> Identify a pain point, then
            solve it
          </li>
          <li>
            <strong>Transformation:</strong> Before and after, journey, or
            progress
          </li>
          <li>
            <strong>Ranking or rating:</strong> Best to worst, tier lists, top
            picks
          </li>
          <li>
            <strong>Deep dive:</strong> Comprehensive coverage of one topic
          </li>
          <li>
            <strong>Quick tips:</strong> Actionable advice in a short format
          </li>
        </ul>
        <p className={s.sectionText}>
          Once you identify which patterns work in your niche, apply them to
          topics you are uniquely qualified to cover. That is where inspiration
          becomes original content.
        </p>
      </section>

      {/* Use Your Own Analytics */}
      <section id="use-analytics" className={s.section}>
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
          Use Your Own Analytics for Inspiration
        </h2>
        <p className={s.sectionText}>
          Your own channel data is a goldmine of inspiration. Your audience has
          already told you what they want, you just need to listen.
        </p>

        <h3 className={s.subheading}>Find Your Best Performers</h3>
        <ol className={s.numberedList}>
          <li>
            Open YouTube Studio and go to Analytics, then Content
          </li>
          <li>
            Sort by views over the last 12 months
          </li>
          <li>
            Identify your top 10 videos by views
          </li>
          <li>
            Ask: What do they have in common? Topic? Format? Length? Title
            style?
          </li>
          <li>
            Plan content that doubles down on what already works
          </li>
        </ol>

        <h3 className={s.subheading}>Look for Subscriber Drivers</h3>
        <p className={s.sectionText}>
          Some videos get views but few subscribers. Others convert viewers into
          subscribers at a high rate. The second type tells you what makes
          people want more from you.
        </p>
        <ul className={s.list}>
          <li>
            Go to Analytics, then Audience, then See More under Subscribers
          </li>
          <li>
            View subscribers by content
          </li>
          <li>
            Note which videos drive the most new subscribers
          </li>
          <li>
            Make more content like your top subscriber drivers
          </li>
        </ul>
        <p className={s.sectionText}>
          See our{" "}
          <Link href="/learn/how-to-get-more-subscribers">subscriber guide</Link>{" "}
          for more on this metric.
        </p>
      </section>

      {/* Video Idea Generators */}
      <section id="idea-generators" className={s.section}>
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
          Video Idea Generators: Turn Data Into Ideas
        </h2>
        <p className={s.sectionText}>
          Manually researching competitors and analytics takes time. Video idea
          generators automate much of this process by analyzing what is working
          and suggesting topics based on real data.
        </p>

        <h3 className={s.subheading}>How Idea Generators Work</h3>
        <p className={s.sectionText}>
          Good idea generators analyze multiple signals:
        </p>
        <ul className={s.list}>
          <li>
            <strong>Competitor outliers:</strong> Videos that performed above
            average in your niche
          </li>
          <li>
            <strong>Trending topics:</strong> Subjects gaining momentum right
            now
          </li>
          <li>
            <strong>Search demand:</strong> What people are actively looking for
          </li>
          <li>
            <strong>Your channel strengths:</strong> Topics where you have
            demonstrated expertise
          </li>
          <li>
            <strong>Gaps:</strong> Topics competitors cover that you have not
          </li>
        </ul>

        <h3 className={s.subheading}>Using Ideas Effectively</h3>
        <p className={s.sectionText}>
          An idea generator gives you starting points, not finished titles.
          Here is how to use them:
        </p>
        <ol className={s.numberedList}>
          <li>
            Generate a batch of 10 to 20 ideas
          </li>
          <li>
            Filter for topics that match your expertise and audience
          </li>
          <li>
            Validate by checking if similar content performs well
          </li>
          <li>
            Add your unique angle, perspective, or depth
          </li>
          <li>
            Save validated ideas to your content backlog
          </li>
        </ol>

        <div className={s.highlight}>
          <p>
            <strong>Generate ideas based on what is working.</strong>{" "}
            {BRAND.name}&apos;s idea generator analyzes your niche, identifies
            trending topics and competitor outliers, and suggests video ideas
            tailored to your channel. Stop guessing, start creating content with
            proven demand.
          </p>
        </div>
      </section>

      {/* Build a Content Backlog */}
      <section id="build-backlog" className={s.section}>
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
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
          </span>
          Build a Content Backlog
        </h2>
        <p className={s.sectionText}>
          The goal of finding inspiration is not just to get one idea. It is to
          build a sustainable system where you always have more ideas than you
          can film.
        </p>

        <h3 className={s.subheading}>Your Ideal Backlog</h3>
        <ul className={s.list}>
          <li>
            <strong>15 to 25 validated ideas</strong> ready to go at any time
          </li>
          <li>
            <strong>Mix of formats:</strong> tutorials, comparisons, stories,
            lists
          </li>
          <li>
            <strong>Mix of effort levels:</strong> quick videos and deeper
            productions
          </li>
          <li>
            <strong>Sorted by priority:</strong> trending topics first,
            evergreen ideas as backup
          </li>
        </ul>

        <h3 className={s.subheading}>Maintaining Your Backlog</h3>
        <ul className={s.list}>
          <li>
            Add 3 to 5 new ideas every week from your inspiration sessions
          </li>
          <li>
            Remove ideas that no longer feel relevant
          </li>
          <li>
            Validate older ideas before filming, trends change
          </li>
          <li>
            Track which backlog ideas you actually film and which never get made
          </li>
        </ul>
        <p className={s.sectionText}>
          A healthy backlog eliminates the stress of wondering what to make
          next. You can focus your energy on execution instead of ideation.
        </p>
      </section>

      {/* Stay Inspired Long Term */}
      <section id="stay-inspired" className={s.section}>
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
          Stay Inspired Long Term
        </h2>
        <p className={s.sectionText}>
          Finding inspiration is not a one-time task. It is an ongoing habit
          that keeps your channel fresh and growing.
        </p>

        <h3 className={s.subheading}>Build Inspiration Habits</h3>
        <ul className={s.list}>
          <li>
            <strong>Weekly research session:</strong> 15 to 30 minutes scanning
            competitors and trends
          </li>
          <li>
            <strong>Save interesting videos:</strong> When you see something
            that works, save it to a playlist for reference
          </li>
          <li>
            <strong>Note ideas immediately:</strong> Use a notes app to capture
            ideas when they strike
          </li>
          <li>
            <strong>Review and refine:</strong> Monthly review of your backlog
            to update priorities
          </li>
        </ul>

        <h3 className={s.subheading}>Beyond YouTube</h3>
        <p className={s.sectionText}>
          Inspiration can come from outside the platform too:
        </p>
        <ul className={s.list}>
          <li>
            Industry news and developments in your niche
          </li>
          <li>
            Questions from your community, comments, emails, social media
          </li>
          <li>
            Trends on TikTok, Reddit, or forums related to your topic
          </li>
          <li>
            Your own experiences and experiments
          </li>
        </ul>
        <p className={s.sectionText}>
          The best creators are always paying attention. They notice what
          resonates, what triggers questions, and what makes people engage. That
          awareness feeds a constant stream of inspiration.
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
          Common Inspiration Mistakes
        </h2>
        <ul className={s.list}>
          <li>
            <strong>Copying instead of learning.</strong> Study patterns and
            principles, not specific videos. Your version needs to add unique
            value.
          </li>
          <li>
            <strong>Only looking at mega channels.</strong> Channels your size
            or slightly larger offer more relevant insights. Their success is
            more achievable.
          </li>
          <li>
            <strong>Ignoring your own data.</strong> Your analytics tell you
            what your specific audience wants. Do not overlook this in favor of
            external research.
          </li>
          <li>
            <strong>Chasing every trend.</strong> Not every trending topic fits
            your channel. Stay focused on your niche and audience.
          </li>
          <li>
            <strong>Waiting for inspiration to strike.</strong> Inspiration is a
            skill you practice, not lightning that randomly hits. Schedule your
            research.
          </li>
          <li>
            <strong>Saving ideas without validating.</strong> An idea is not
            good just because you like it. Validate that demand exists before
            committing to production.
          </li>
          <li>
            <strong>Not acting on good ideas.</strong> A backlog of 100 ideas
            you never film is worthless. Turn inspiration into action.
          </li>
        </ul>
      </section>

      {/* Final CTA */}
      <div className={s.highlight}>
        <p>
          <strong>Stop guessing what to create.</strong> {BRAND.name}&apos;s
          video idea generator analyzes what is working in your niche and
          suggests topics with proven demand. Build a content backlog based on
          data, not random inspiration.
        </p>
      </div>
    </>
  );
}
