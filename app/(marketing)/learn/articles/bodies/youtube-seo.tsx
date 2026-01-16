/**
 * Body content for YouTube SEO article.
 * Server component - no "use client" directive.
 */

import Link from "next/link";
import type { BodyProps } from "./index";

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* What is YouTube SEO */}
      <section id="what-is-youtube-seo" className={s.section}>
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
          What is YouTube SEO
        </h2>
        <p className={s.sectionText}>
          YouTube SEO is the process of optimizing your videos to rank higher
          in YouTube search results and get recommended more often. Unlike
          traditional website SEO, YouTube heavily weights engagement signals
          alongside metadata.
        </p>
        <p className={s.sectionText}>
          A video with perfect metadata but poor retention will not rank well.
          YouTube cares most about whether viewers watch your content and
          whether they stay on the platform afterward. Metadata helps YouTube
          understand what your video is about, but engagement determines how
          much YouTube promotes it.
        </p>
        <p className={s.sectionText}>
          This guide covers both: how to optimize your metadata so YouTube
          understands your content, and how to improve engagement signals so
          YouTube promotes it.
        </p>
      </section>

      {/* SEO Checklist */}
      <section id="seo-checklist" className={s.section}>
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
          15 Minute SEO Checklist
        </h2>
        <p className={s.sectionText}>
          Before publishing any video, run through this checklist:
        </p>
        <ol className={s.numberedList}>
          <li>
            <strong>Title includes main keyword</strong> in the first 60
            characters
          </li>
          <li>
            <strong>Title is clear and compelling</strong> with a specific
            benefit or curiosity hook
          </li>
          <li>
            <strong>Thumbnail is readable</strong> at small sizes and stands
            out from competitors
          </li>
          <li>
            <strong>Description starts strong</strong> with keyword and hook
            in first 2 sentences
          </li>
          <li>
            <strong>Description includes timestamps</strong> for videos over 5
            minutes
          </li>
          <li>
            <strong>3 to 5 relevant tags</strong> added (do not overthink
            this)
          </li>
          <li>
            <strong>Video delivers on title promise</strong> to maintain
            retention
          </li>
          <li>
            <strong>Hook grabs attention</strong> in first 10 seconds
          </li>
          <li>
            <strong>End screen links</strong> to related content
          </li>
          <li>
            <strong>Cards added</strong> at relevant moments if applicable
          </li>
        </ol>
      </section>

      {/* How YouTube Ranks */}
      <section id="how-youtube-ranks" className={s.section}>
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
          How YouTube Ranks Videos
        </h2>
        <p className={s.sectionText}>
          YouTube decides which videos to show based on two questions: Is this
          video relevant to what the viewer wants? Will this video satisfy the
          viewer and keep them on YouTube?
        </p>
        <h3 className={s.subheading}>Relevance Signals</h3>
        <ul className={s.list}>
          <li>
            <strong>Title:</strong> Does it match what viewers search for?
          </li>
          <li>
            <strong>Description:</strong> Does it provide context about the
            content?
          </li>
          <li>
            <strong>Tags:</strong> Minor signal for understanding topic
          </li>
          <li>
            <strong>Closed captions:</strong> YouTube reads auto-generated and
            manual captions
          </li>
        </ul>
        <h3 className={s.subheading}>Engagement Signals (More Important)</h3>
        <ul className={s.list}>
          <li>
            <strong>Click through rate:</strong> How often do viewers click
            when shown your video?
          </li>
          <li>
            <strong>Watch time:</strong> How long do viewers actually watch?
          </li>
          <li>
            <strong>Average view duration:</strong> What percentage of the
            video do viewers complete?
          </li>
          <li>
            <strong>Session time:</strong> Do viewers continue watching YouTube
            after your video?
          </li>
          <li>
            <strong>Engagement:</strong> Likes, comments, shares, and
            subscribers gained
          </li>
        </ul>
        <p className={s.sectionText}>
          The bottom line: YouTube promotes videos that keep people watching.
          Metadata helps you get discovered, but retention determines how far
          your video spreads.
        </p>
      </section>

      {/* Title Optimization */}
      <section id="title-optimization" className={s.section}>
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
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </span>
          Title Optimization
        </h2>
        <p className={s.sectionText}>
          Your title is the most important piece of metadata. It tells YouTube
          what your video is about and convinces viewers to click.
        </p>
        <h3 className={s.subheading}>Title Best Practices</h3>
        <ul className={s.list}>
          <li>
            <strong>Include your main keyword</strong> in the first 60
            characters to avoid truncation
          </li>
          <li>
            <strong>Be specific about what the video delivers.</strong>{" "}
            &ldquo;5 iPhone Camera Settings&rdquo; is clearer than
            &ldquo;iPhone Camera Tips&rdquo;
          </li>
          <li>
            <strong>Create curiosity or promise a clear benefit.</strong>{" "}
            Viewers should know why to click.
          </li>
          <li>
            <strong>Avoid all caps and excessive punctuation.</strong> They
            look spammy.
          </li>
          <li>
            <strong>Do not repeat keywords.</strong> Once is enough.
          </li>
        </ul>
        <h3 className={s.subheading}>Title Formulas That Work</h3>
        <ul className={s.list}>
          <li>How to [achieve result] in [timeframe]</li>
          <li>[Number] [things] every [audience] needs to know</li>
          <li>Why [common belief] is wrong</li>
          <li>I tried [thing] for [timeframe]. Here is what happened.</li>
          <li>[Topic] for beginners: [specific focus]</li>
        </ul>
        <p className={s.sectionText}>
          For more title patterns, see our{" "}
          <Link href="/learn/youtube-video-ideas">video ideas guide</Link>.
        </p>
      </section>

      {/* Thumbnail Optimization */}
      <section id="thumbnail-optimization" className={s.section}>
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
          Thumbnail Optimization
        </h2>
        <p className={s.sectionText}>
          Thumbnails are visual SEO. They determine whether people click when
          they see your video. A great thumbnail can double your CTR.
        </p>
        <h3 className={s.subheading}>Thumbnail Best Practices</h3>
        <ul className={s.list}>
          <li>
            <strong>Readable at small sizes:</strong> Test your thumbnail at
            phone screen sizes
          </li>
          <li>
            <strong>High contrast:</strong> Make sure elements stand out from
            each other
          </li>
          <li>
            <strong>Limited text:</strong> 3 to 4 words maximum if using text
          </li>
          <li>
            <strong>Faces with emotion:</strong> Expressive faces often
            outperform faceless thumbnails
          </li>
          <li>
            <strong>Consistent brand elements:</strong> Help returning viewers
            recognize your videos
          </li>
          <li>
            <strong>Complement, do not repeat, the title:</strong> Thumbnail
            and title should work together
          </li>
        </ul>
        <h3 className={s.subheading}>Testing Thumbnails</h3>
        <p className={s.sectionText}>
          If a video underperforms, try changing the thumbnail. YouTube allows
          you to update thumbnails anytime. Watch your CTR in Analytics before
          and after changes. Give it at least a few days before judging
          results.
        </p>
      </section>

      {/* Description Best Practices */}
      <section id="description-optimization" className={s.section}>
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
          Description Best Practices
        </h2>
        <p className={s.sectionText}>
          Descriptions help YouTube understand your video and give viewers
          information. The first 2 to 3 sentences are most important since
          they appear in search results.
        </p>
        <h3 className={s.subheading}>How to Write Descriptions</h3>
        <ol className={s.numberedList}>
          <li>
            <strong>First 2 sentences:</strong> Hook the viewer and include
            your main keyword naturally
          </li>
          <li>
            <strong>Expand on the video topic:</strong> What will viewers
            learn? Why should they watch?
          </li>
          <li>
            <strong>Add timestamps</strong> for videos over 5 minutes. This
            creates chapters.
          </li>
          <li>
            <strong>Include relevant links:</strong> Related videos, your
            website, social media
          </li>
          <li>
            <strong>Call to action:</strong> Subscribe, check out related
            content, etc.
          </li>
        </ol>
        <p className={s.sectionText}>
          Descriptions can be 200 to 500 words. Front-load the important
          information since most viewers never click &ldquo;Show more.&rdquo;
        </p>
      </section>

      {/* Tags Explained */}
      <section id="tags-explained" className={s.section}>
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
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
          </span>
          Do Tags Still Matter
        </h2>
        <p className={s.sectionText}>
          Tags have minimal impact on YouTube ranking in 2026. YouTube&apos;s
          own documentation says tags are &ldquo;most useful for commonly
          misspelled words.&rdquo;
        </p>
        <h3 className={s.subheading}>What Tags Do</h3>
        <p className={s.sectionText}>
          Tags help YouTube understand your video topic when the title and
          description are unclear. They do not significantly affect ranking
          for most videos.
        </p>
        <h3 className={s.subheading}>Tag Best Practices</h3>
        <ul className={s.list}>
          <li>Use 3 to 5 relevant tags</li>
          <li>Include your main keyword</li>
          <li>Add common misspellings if relevant</li>
          <li>Do not stuff dozens of variations</li>
          <li>Spend 30 seconds on tags, not 30 minutes</li>
        </ul>
        <p className={s.sectionText}>
          A tag extractor can show what tags competitors use, but copying
          their tags will not help you rank. Focus your optimization time on
          titles, thumbnails, and retention instead.
        </p>
      </section>

      {/* Engagement Signals */}
      <section id="engagement-signals" className={s.section}>
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
              <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
            </svg>
          </span>
          Engagement Signals
        </h2>
        <p className={s.sectionText}>
          YouTube cares most about keeping viewers on the platform. Videos
          that achieve this get promoted more. Here is how to improve
          engagement:
        </p>
        <h3 className={s.subheading}>Retention</h3>
        <p className={s.sectionText}>
          <Link href="/learn/youtube-retention-analysis">Retention</Link> is
          the most important engagement signal. High retention tells YouTube
          your content is worth watching. To improve retention:
        </p>
        <ul className={s.list}>
          <li>Hook viewers in the first 10 seconds</li>
          <li>Cut slow intros and filler</li>
          <li>Deliver on your title promise early</li>
          <li>Create pattern interrupts to maintain interest</li>
          <li>Structure content to build toward a payoff</li>
        </ul>
        <h3 className={s.subheading}>Click Through Rate</h3>
        <p className={s.sectionText}>
          CTR measures how often viewers click when shown your video. Higher
          CTR leads to more impressions over time. To improve CTR:
        </p>
        <ul className={s.list}>
          <li>Test different thumbnails</li>
          <li>Make titles more specific or curious</li>
          <li>Study what works in your niche</li>
          <li>Avoid misleading packaging (hurts retention)</li>
        </ul>
        <h3 className={s.subheading}>Engagement Actions</h3>
        <p className={s.sectionText}>
          Likes, comments, shares, and subscribes signal that viewers found
          value. Ask for engagement at appropriate moments, not at the start.
          Respond to comments to encourage more.
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
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </span>
          YouTube Keyword Research
        </h2>
        <p className={s.sectionText}>
          Keyword research helps you find what people actually search for on
          YouTube. Here is a simple process:
        </p>
        <h3 className={s.subheading}>Using YouTube Autocomplete</h3>
        <ol className={s.numberedList}>
          <li>Go to YouTube search (use incognito to avoid personalization)</li>
          <li>Type your topic and note the autocomplete suggestions</li>
          <li>Try adding modifiers: &ldquo;how to,&rdquo; &ldquo;for beginners,&rdquo; &ldquo;vs,&rdquo; &ldquo;best&rdquo;</li>
          <li>Use the alphabet trick: type your topic + a, b, c... for more ideas</li>
        </ol>
        <h3 className={s.subheading}>Evaluating Keywords</h3>
        <p className={s.sectionText}>
          After finding potential keywords, search for them and check:
        </p>
        <ul className={s.list}>
          <li>
            <strong>Competition:</strong> Do smaller channels rank, or only
            mega channels?
          </li>
          <li>
            <strong>Recency:</strong> Are top results recent or years old?
          </li>
          <li>
            <strong>View counts:</strong> Are similar videos getting views?
          </li>
          <li>
            <strong>Gaps:</strong> Is there an angle no one has covered?
          </li>
        </ul>
        <p className={s.sectionText}>
          For detailed keyword and topic research, see our{" "}
          <Link href="/learn/youtube-video-ideas">video ideas guide</Link>.
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
          SEO Mistakes to Avoid
        </h2>
        <ul className={s.list}>
          <li>
            <strong>Keyword stuffing:</strong> Repeating keywords unnaturally
            hurts readability and does not help ranking
          </li>
          <li>
            <strong>Obsessing over tags:</strong> Tags are a minor factor.
            Spend your time on content quality instead.
          </li>
          <li>
            <strong>Clickbait that disappoints:</strong> Misleading titles get
            clicks but destroy retention. The net effect is negative.
          </li>
          <li>
            <strong>Ignoring thumbnails:</strong> Many creators spend hours on
            content and minutes on thumbnails. Invert this.
          </li>
          <li>
            <strong>Copying competitor metadata exactly:</strong> You need
            unique value, not identical packaging
          </li>
          <li>
            <strong>Forgetting retention:</strong> No amount of SEO
            optimization fixes boring content
          </li>
          <li>
            <strong>Not updating underperformers:</strong> You can change
            titles and thumbnails. Test and iterate.
          </li>
          <li>
            <strong>Trying to game the system:</strong> YouTube continuously
            updates. Focus on making good content for humans, not algorithms.
          </li>
        </ul>
      </section>

      {/* CTA Highlight */}
      <div className={s.highlight}>
        <p>
          <strong>See what is working.</strong> Connect your channel to get
          data driven SEO insights and find opportunities to improve your
          video performance.
        </p>
      </div>
    </>
  );
}
