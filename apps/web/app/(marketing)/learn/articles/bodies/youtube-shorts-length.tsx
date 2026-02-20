/**
 * Body content for YouTube Shorts Length article.
 * Server component - no "use client" directive.
 */

import Link from "next/link";
import { LEARN_ARTICLES } from "../../articles";
import type { BodyProps, ArticleMeta } from "./_shared";
import { tocFromArticle } from "./_shared";

const _article = LEARN_ARTICLES["youtube-shorts-length"];

export const meta: ArticleMeta = {
  slug: _article.slug,
  title: _article.title,
  description: _article.description,
};

export const toc = tocFromArticle(_article.toc);

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* Length Limits */}
      <section id="length-limits" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </span>
          YouTube Shorts Length Limits
        </h2>
        <p className={s.sectionText}>
          YouTube Shorts can be up to 60 seconds long. That&apos;s the hard ceiling—anything
          longer automatically becomes a regular video and won&apos;t appear in the Shorts feed.
          There&apos;s no official minimum, though clips under a few seconds rarely hold
          attention long enough to matter.
        </p>
        <p className={s.sectionText}>
          The 60-second limit exists because the format is designed for quick, swipeable
          content. When a video crosses that threshold, YouTube treats it as standard
          long-form: different discovery algorithm, different viewer expectations, different
          monetization rules. If you want the Shorts feed, stay under the line.
        </p>
        <div className={s.highlight}>
          <p>
            <strong>Don&apos;t aim for 60. Aim for replays.</strong> The best-performing Shorts
            aren&apos;t the longest ones—they&apos;re the ones viewers watch twice. A tight 22-second
            video that loops seamlessly will outperform a padded 58-second video every time.
          </p>
        </div>
      </section>

      {/* Aspect Ratio */}
      <section id="aspect-ratio" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
          </span>
          Aspect Ratio Requirements
        </h2>
        <p className={s.sectionText}>
          Vertical video (9:16) is non-negotiable for Shorts. The entire format is built
          around full-screen mobile viewing—when someone swipes through their feed, your
          video should fill their phone from edge to edge. Anything else feels like a
          compromise.
        </p>
        <p className={s.sectionText}>
          Horizontal footage can technically upload, but it appears tiny with black bars
          consuming most of the screen. Viewers instinctively swipe past it because it
          reads as &quot;not made for this.&quot; Square (1:1) performs slightly better than
          horizontal, but still wastes valuable screen real estate. If you want
          the algorithm to push your content—and viewers to stop scrolling—shoot vertical.
        </p>
        <h3 className={s.subheading}>Specs That Matter</h3>
        <ul className={s.list}>
          <li><strong>Aspect ratio:</strong> 9:16 (portrait orientation)</li>
          <li><strong>Resolution:</strong> 1080 × 1920 pixels for sharp playback</li>
          <li><strong>Safe margins:</strong> Keep text 150px from top/bottom edges</li>
          <li><strong>Subtitles:</strong> Size them for thumbs, not desktops</li>
        </ul>
        <p className={s.sectionText}>
          The safe margin rule matters more than most creators realize. YouTube overlays
          your title, like button, and comment icon on top of your video. If your
          text sits too close to the edges, it gets buried.
        </p>
      </section>

      {/* Optimal Length */}
      <section id="optimal-length" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          </span>
          Optimal Length for Engagement
        </h2>
        <p className={s.sectionText}>
          There&apos;s no universal &quot;best length&quot; for Shorts—but there is a best length for
          your idea. The right duration depends on three factors: how many ideas you&apos;re
          packing in, how fast you&apos;re moving, and whether the ending invites a rewatch.
        </p>
        <p className={s.sectionText}>
          <strong>Idea density</strong> is the simplest filter. One idea? Keep it tight.
          Multiple points or a narrative arc? You&apos;ll need more runway. Cramming three
          concepts into 15 seconds creates confusion; stretching one joke to 55 seconds
          creates boredom.
        </p>
        <p className={s.sectionText}>
          <strong>Pacing</strong> determines how long viewers tolerate any given length.
          High-energy edits with frequent cuts and visual changes can sustain attention
          for a full minute. Slower, more contemplative content needs to deliver value
          faster or risk the swipe.
        </p>
        <p className={s.sectionText}>
          <strong>Loop potential</strong> is underrated. If your last frame flows naturally
          into your first, you&apos;ll get free replays—and the algorithm notices. Design
          your ending as a beginning.
        </p>
        <h3 className={s.subheading}>Pick Your Length Based on the Job</h3>
        <ul className={s.list}>
          <li><strong>Quick tip or fact:</strong> 15–25 seconds</li>
          <li><strong>Reveal or transformation:</strong> 20–35 seconds</li>
          <li><strong>Mini tutorial:</strong> 30–45 seconds</li>
          <li><strong>Short story or narrative:</strong> 40–60 seconds</li>
          <li><strong>Reaction or commentary:</strong> 20–40 seconds</li>
        </ul>
        <p className={s.sectionText}>
          These ranges are starting points, not rules. Your analytics will tell you
          what actually works for your audience. Watch for the drop-off point in
          retention graphs—that&apos;s where your videos should end.
        </p>
      </section>

      {/* Resolution */}
      <section id="resolution" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
              <line x1="7" y1="2" x2="7" y2="22" />
              <line x1="17" y1="2" x2="17" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
            </svg>
          </span>
          Resolution and Quality
        </h2>
        <p className={s.sectionText}>
          Export at 1080 × 1920 pixels. This is the sweet spot—sharp enough to look
          professional on any phone, small enough to upload quickly. Higher resolutions
          like 4K are overkill for a format designed for mobile screens; YouTube will
          compress them anyway.
        </p>
        <p className={s.sectionText}>
          Frame rate is simpler than most guides make it sound. Use 30fps for talking-head
          content and most standard footage. Use 60fps if you&apos;re showing fast motion,
          gaming, or anything where smoothness matters. Most viewers won&apos;t consciously
          notice the difference, but choppy action footage feels wrong.
        </p>
        <p className={s.sectionText}>
          For file format, MP4 with H.264 encoding is the safe default. It&apos;s universally
          compatible and uploads reliably. If your editing software offers HEVC/H.265,
          that works too—smaller files, same quality. Avoid obscure codecs that might
          cause processing delays.
        </p>
        <p className={s.sectionText}>
          The most common quality mistake isn&apos;t resolution—it&apos;s lighting. A well-lit
          720p video looks better than a dark, noisy 4K one. If you&apos;re shooting on a
          phone, face a window. Natural light solves most problems.
        </p>
      </section>

      {/* Creating Shorts */}
      <section id="creating-shorts" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </span>
          How to Create Shorts
        </h2>
        <p className={s.sectionText}>
          You can create directly in the YouTube app or upload pre-edited content. Both
          paths work—the app is faster for quick captures, while external editing gives
          you more control. Here&apos;s the streamlined workflow for either approach.
        </p>
        <ol className={s.numberedList}>
          <li>Open the YouTube app, tap <strong>+</strong>, and select <strong>Create a Short</strong>—or upload any vertical video under 60 seconds through the normal upload flow</li>
          <li>If recording in-app, capture footage in segments (you can pause and resume) and add music, text, or filters from YouTube&apos;s built-in tools</li>
          <li>Add a clear, descriptive title—you can include <strong>#Shorts</strong> in the title or description, but YouTube usually detects the format automatically</li>
          <li>Verify your video meets the requirements: vertical orientation, under 60 seconds, and reasonable resolution</li>
          <li>Publish and monitor the first hour of performance—early engagement signals matter</li>
        </ol>
        <p className={s.sectionText}>
          Repurposing long-form content is one of the smartest Short strategies. Pull
          the most compelling 30 seconds from a longer video, reframe it for vertical
          if needed, and use it to drive viewers back to the full piece. One long video
          can fuel a week of Shorts.
        </p>
      </section>

      {/* Shorts vs Regular */}
      <section id="shorts-vs-regular" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </span>
          Shorts vs Regular Videos
        </h2>
        <p className={s.sectionText}>
          These formats serve different jobs in your channel strategy. Understanding
          when to use each helps you stop treating them as interchangeable.
        </p>
        <h3 className={s.subheading}>Discovery vs Depth</h3>
        <p className={s.sectionText}>
          Shorts excel at reaching new people. The feed pushes content to viewers who&apos;ve
          never heard of you based on topic and engagement signals. It&apos;s a top-of-funnel
          format—broad reach, shallow connection. Long-form builds the relationship.
          Viewers who watch a 15-minute video are invested; they&apos;re more likely to
          subscribe, comment, and return.
        </p>
        <h3 className={s.subheading}>Revenue Reality</h3>
        <p className={s.sectionText}>
          Long-form videos generate significantly more revenue per view through mid-roll
          ads and higher CPMs. Shorts monetization exists but pays a fraction of what
          traditional videos earn. If revenue is your goal, Shorts are marketing for
          your long-form catalog—not a replacement. See our{" "}
          <Link href="/learn/youtube-shorts-monetization">Shorts monetization guide</Link>{" "}
          for the full breakdown.
        </p>
        <h3 className={s.subheading}>Use Shorts When…</h3>
        <ul className={s.list}>
          <li>You have a single idea that doesn&apos;t need setup or context</li>
          <li>You&apos;re reacting to something trending and speed matters</li>
          <li>You want to tease a longer video and drive traffic to it</li>
          <li>You&apos;re testing content angles before investing in full production</li>
          <li>You need to maintain posting momentum between bigger projects</li>
        </ul>
        <p className={s.sectionText}>
          Use long-form when the idea needs room to breathe—tutorials, deep dives,
          storytelling, anything where rushing would undercut the value. If you find
          yourself cutting corners to hit 60 seconds, that&apos;s a sign the content wants
          to be longer.
        </p>
      </section>

      {/* Tips */}
      <section id="tips" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.9V16a1 1 0 001 1h6a1 1 0 001-1v-1.1A7 7 0 0012 2z" />
            </svg>
          </span>
          Shorts Best Practices
        </h2>
        <p className={s.sectionText}>
          The most rewatched Shorts follow a simple three-part structure: hook, payoff,
          loop. The hook grabs attention in the first two seconds—a bold claim, an
          unexpected visual, a question that demands an answer. The payoff delivers on
          that promise before the viewer loses patience. And the loop? That&apos;s the ending
          designed to flow seamlessly into the beginning, triggering an automatic replay
          that tells the algorithm your content is sticky.
        </p>
        <p className={s.sectionText}>
          You don&apos;t need fancy editing or expensive gear. You need clarity about what
          you&apos;re offering and the discipline to cut everything that doesn&apos;t serve it.
        </p>
        <h3 className={s.subheading}>Shorts That Get Rewatched Usually Have…</h3>
        <ul className={s.list}>
          <li>An opening line that creates instant curiosity or tension</li>
          <li>Text overlays that reinforce the message (many watch muted)</li>
          <li>A payoff that arrives before viewers expect to swipe</li>
          <li>An ending that feels like a beginning—smooth loop potential</li>
          <li>One clear idea, not three competing for attention</li>
        </ul>
        <p className={s.sectionText}>
          Consistency matters more than perfection. A creator posting three decent
          Shorts per week will learn faster and grow faster than someone agonizing
          over one &quot;perfect&quot; video per month. The algorithm rewards activity, and
          you&apos;ll only discover what works through volume.
        </p>
      </section>

      {/* CTA */}
      <div className={s.highlight}>
        <p>
          <strong>Pick one idea, pick one length, post 10 times, then look for the pattern.</strong>{" "}
          Your analytics will teach you more than any guide can. The only way to find
          your optimal length is to test, measure, and iterate.
        </p>
      </div>
    </>
  );
}
