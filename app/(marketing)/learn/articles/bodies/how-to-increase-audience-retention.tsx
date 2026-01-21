/**
 * Body content for How to Increase Audience Retention article.
 * Server component - no "use client" directive.
 */

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import type { BodyProps } from "./index";

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* Why Retention Matters */}
      <section id="why-retention-matters" className={s.section}>
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
          Why Retention Matters for YouTube Growth
        </h2>
        <p className={s.sectionText}>
          Audience retention is the most important signal YouTube uses to decide
          which videos to promote. When viewers watch a large percentage of your
          video, YouTube interprets this as a sign that your content is
          valuable. The result: more impressions, better placement in suggested
          videos, and more views.
        </p>
        <p className={s.sectionText}>
          The algorithm is designed to keep people on the platform. If your
          videos consistently keep viewers watching, YouTube will show your
          content to more people. This creates a compounding effect: better
          retention leads to more reach, which leads to more viewers, which
          leads to more subscribers.
        </p>
        <div className={s.statsGrid}>
          <div className={s.stat}>
            <div className={s.statValue}>50%+</div>
            <div className={s.statLabel}>Good retention target</div>
          </div>
          <div className={s.stat}>
            <div className={s.statValue}>10 sec</div>
            <div className={s.statLabel}>Critical hook window</div>
          </div>
          <div className={s.stat}>
            <div className={s.statValue}>30-60s</div>
            <div className={s.statLabel}>Pattern interrupt frequency</div>
          </div>
        </div>
        <p className={s.sectionText}>
          For a deeper dive into reading retention curves and diagnosing
          problems, see our{" "}
          <Link href="/learn/youtube-retention-analysis">
            retention analysis guide
          </Link>
          . This page focuses on actionable techniques to improve your numbers.
        </p>
      </section>

      {/* Retention Improvement Checklist */}
      <section id="retention-checklist" className={s.section}>
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
          Retention Improvement Checklist
        </h2>
        <p className={s.sectionText}>
          Use this checklist for every video you make. Each item addresses a
          common retention killer.
        </p>
        <ol className={s.numberedList}>
          <li>
            <strong>Hook in first 5 seconds:</strong> Tease the payoff, ask a
            question, or make a bold statement. No generic intros.
          </li>
          <li>
            <strong>Deliver on title promise quickly:</strong> Give viewers a
            reason to stay within the first 30 seconds.
          </li>
          <li>
            <strong>Cut the intro:</strong> If you have a branded intro, keep it
            under 3 seconds or remove it entirely.
          </li>
          <li>
            <strong>Add pattern interrupts:</strong> Change something visually
            or audibly every 30 to 60 seconds.
          </li>
          <li>
            <strong>Remove filler:</strong> Watch your video at 2x speed. Cut
            every moment where nothing happens.
          </li>
          <li>
            <strong>Build toward a payoff:</strong> Structure your video so
            viewers want to see what happens next.
          </li>
          <li>
            <strong>End before it drags:</strong> Finish strong rather than
            trailing off. Better to be too short than too long.
          </li>
        </ol>
      </section>

      {/* Hook Techniques */}
      <section id="hook-techniques" className={s.section}>
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
              <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm0 18a8 8 0 118-8 8 8 0 01-8 8z" />
              <path d="M12 6v6l4 2" />
            </svg>
          </span>
          Hook Techniques That Actually Work
        </h2>
        <p className={s.sectionText}>
          The first 10 seconds determine whether viewers stay or leave. A strong
          hook accomplishes three things: grabs attention, establishes relevance,
          and creates a reason to keep watching.
        </p>

        <h3 className={s.subheading}>The Result Tease</h3>
        <p className={s.sectionText}>
          Show or describe the end result first, then explain how to get there.
          &ldquo;By the end of this video, you will know exactly how to double
          your retention. Here is the framework I use.&rdquo;
        </p>

        <h3 className={s.subheading}>The Curiosity Gap</h3>
        <p className={s.sectionText}>
          Open a question that viewers need answered. &ldquo;There is one
          mistake killing your retention that most creators never notice. I did
          not find it until I analyzed 50 of my own videos.&rdquo;
        </p>

        <h3 className={s.subheading}>The Bold Statement</h3>
        <p className={s.sectionText}>
          Make a claim that challenges expectations. &ldquo;Everything you have
          been told about YouTube intros is wrong. Here is what actually
          works.&rdquo;
        </p>

        <h3 className={s.subheading}>The Jump-In</h3>
        <p className={s.sectionText}>
          Skip the setup entirely and start mid-action. &ldquo;Okay, so I just
          pulled up my analytics and look at this retention drop. See that
          cliff?&rdquo;
        </p>

        <h3 className={s.subheading}>What to Avoid</h3>
        <ul className={s.list}>
          <li>
            &ldquo;Hey guys, welcome back to my channel&rdquo; - generic and
            adds no value
          </li>
          <li>Long branded intros with music and logos</li>
          <li>Explaining what you are going to cover before covering it</li>
          <li>Thanking viewers for watching before they have watched anything</li>
        </ul>
      </section>

      {/* Pacing Strategies */}
      <section id="pacing-strategies" className={s.section}>
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
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </span>
          Pacing Strategies to Keep Viewers Engaged
        </h2>
        <p className={s.sectionText}>
          Pacing is the rhythm of your video. Too slow and viewers get bored.
          Too fast and they cannot follow. The goal is to maintain energy while
          giving viewers time to absorb information.
        </p>

        <h3 className={s.subheading}>Vary Your Speed</h3>
        <p className={s.sectionText}>
          Alternate between fast-paced sections and slower moments. Quick cuts
          for energy, then slow down for important points. This rhythm keeps
          viewers engaged without exhausting them.
        </p>

        <h3 className={s.subheading}>Eliminate Dead Air</h3>
        <p className={s.sectionText}>
          Remove pauses, ums, and moments where nothing happens. Watch your
          video at 2x speed. If you get bored, cut that section. Every second
          should either inform or entertain.
        </p>

        <h3 className={s.subheading}>Use Momentum Builders</h3>
        <ul className={s.list}>
          <li>
            <strong>Countdowns:</strong> &ldquo;Here are the 5 things you need
            to know&rdquo;
          </li>
          <li>
            <strong>Progress markers:</strong> &ldquo;Now that we have covered
            X, let us move to Y&rdquo;
          </li>
          <li>
            <strong>Open loops:</strong> &ldquo;I will show you the biggest
            mistake in a minute, but first&rdquo;
          </li>
          <li>
            <strong>Stakes raising:</strong> &ldquo;This next part is where most
            people fail&rdquo;
          </li>
        </ul>

        <h3 className={s.subheading}>Match Pacing to Content</h3>
        <p className={s.sectionText}>
          Entertainment content can be faster. Educational content needs
          breathing room. Match your pacing to what viewers need to understand
          and enjoy your content.
        </p>
      </section>

      {/* Pattern Interrupts */}
      <section id="pattern-interrupts" className={s.section}>
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
              <line x1="9" y1="9" x2="15" y2="15" />
              <line x1="15" y1="9" x2="9" y2="15" />
            </svg>
          </span>
          Pattern Interrupts: Reset Viewer Attention
        </h2>
        <p className={s.sectionText}>
          The human brain notices change. When something stays the same for too
          long, attention drifts. Pattern interrupts reset attention by changing
          something in your video. Use them every 30 to 90 seconds.
        </p>

        <h3 className={s.subheading}>Visual Interrupts</h3>
        <ul className={s.list}>
          <li>Camera angle changes - cut to a different shot</li>
          <li>B-roll footage - show what you are talking about</li>
          <li>On-screen graphics, text, or images</li>
          <li>Zoom in or out for emphasis</li>
          <li>Location changes or set changes</li>
        </ul>

        <h3 className={s.subheading}>Audio Interrupts</h3>
        <ul className={s.list}>
          <li>Music changes or music drops</li>
          <li>Sound effects for emphasis</li>
          <li>Voice tone or energy shifts</li>
          <li>Silence for dramatic effect</li>
        </ul>

        <h3 className={s.subheading}>Content Interrupts</h3>
        <ul className={s.list}>
          <li>Mini-stories or examples</li>
          <li>Questions to the viewer</li>
          <li>Jokes or unexpected humor</li>
          <li>Callbacks to earlier points</li>
        </ul>

        <p className={s.sectionText}>
          You do not need expensive equipment. A simple zoom, a graphic, or a
          change in your voice can work. The key is variety. Do not let any
          visual or audio element stay static for more than 60 seconds.
        </p>
      </section>

      {/* Editing Tips */}
      <section id="editing-tips" className={s.section}>
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
              <polygon points="14 2 18 6 7 17 3 17 3 13 14 2" />
              <line x1="3" y1="22" x2="21" y2="22" />
            </svg>
          </span>
          Editing Tips for Better Retention
        </h2>
        <p className={s.sectionText}>
          Good editing can significantly improve retention. The goal is to make
          your video feel tight, professional, and engaging without being
          exhausting.
        </p>

        <h3 className={s.subheading}>Cut Ruthlessly</h3>
        <ul className={s.list}>
          <li>Remove every pause, stutter, and filler word</li>
          <li>Cut sentences that repeat information</li>
          <li>Delete tangents that do not serve the main point</li>
          <li>If a section feels slow, it probably needs cutting</li>
        </ul>

        <h3 className={s.subheading}>Add Visual Interest</h3>
        <ul className={s.list}>
          <li>Use b-roll to illustrate points</li>
          <li>Add text overlays for key takeaways</li>
          <li>Include graphics, charts, or demonstrations</li>
          <li>Cut between multiple camera angles if available</li>
        </ul>

        <h3 className={s.subheading}>Audio Polish</h3>
        <ul className={s.list}>
          <li>Use background music to maintain energy (but keep it subtle)</li>
          <li>Add sound effects sparingly for emphasis</li>
          <li>Ensure consistent audio levels throughout</li>
          <li>Remove background noise and distractions</li>
        </ul>

        <h3 className={s.subheading}>The 2x Speed Test</h3>
        <p className={s.sectionText}>
          Watch your edited video at 2x speed. Every moment where you feel bored
          or want to skip is a retention risk. Cut it or add energy to it.
        </p>
      </section>

      {/* Content Structure */}
      <section id="content-structure" className={s.section}>
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
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </span>
          Content Structure for Maximum Retention
        </h2>
        <p className={s.sectionText}>
          How you structure your video affects how long viewers stay. The best
          structures create momentum and give viewers a reason to watch until
          the end.
        </p>

        <h3 className={s.subheading}>Front-Load Value</h3>
        <p className={s.sectionText}>
          Deliver your first valuable insight early. Viewers who get value in
          the first minute are more likely to stay for the rest. Do not save
          everything for the end.
        </p>

        <h3 className={s.subheading}>Build Toward a Payoff</h3>
        <p className={s.sectionText}>
          Create anticipation for something later in the video. &ldquo;I will
          show you the exact template I use at the end&rdquo; gives viewers a
          reason to keep watching.
        </p>

        <h3 className={s.subheading}>Use Open Loops</h3>
        <p className={s.sectionText}>
          Open a question or topic, then close it later. The brain wants closure,
          so viewers stick around to see the resolution. Just make sure you
          actually close every loop you open.
        </p>

        <h3 className={s.subheading}>Clear Segments</h3>
        <p className={s.sectionText}>
          Break your video into clear sections. This helps viewers follow along
          and creates natural pattern interrupts when you transition between
          segments.
        </p>
      </section>

      {/* Common Mistakes */}
      <section id="common-mistakes" className={s.section}>
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
          Common Retention Mistakes to Avoid
        </h2>
        <ul className={s.list}>
          <li>
            <strong>Slow intros.</strong> Every second before you deliver value
            is a second viewers might leave. Get to the point immediately.
          </li>
          <li>
            <strong>Thumbnail and title mismatch.</strong> If your video does not
            match what viewers expected, they will leave. Deliver on your
            promise quickly.
          </li>
          <li>
            <strong>No pattern interrupts.</strong> Talking to camera with no
            visual variety causes attention to drift. Change something every 30
            to 60 seconds.
          </li>
          <li>
            <strong>Padding for length.</strong> Adding filler to hit a time
            target hurts retention. A tight 6 minute video beats a padded 12
            minute video.
          </li>
          <li>
            <strong>Saving the best for last.</strong> Many viewers will not
            make it to the end. Put good content throughout, not just at the
            finish.
          </li>
          <li>
            <strong>Monotone delivery.</strong> Vary your energy, pace, and
            tone. Flat delivery puts viewers to sleep.
          </li>
          <li>
            <strong>Ignoring your data.</strong> Check your retention graphs.
            They tell you exactly where viewers leave and why.
          </li>
        </ul>
      </section>

      {/* Measure Progress */}
      <section id="measure-progress" className={s.section}>
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
          Measure Your Progress
        </h2>
        <p className={s.sectionText}>
          Improving retention requires tracking your data over time. Here is how
          to measure whether your changes are working.
        </p>

        <h3 className={s.subheading}>Key Metrics to Track</h3>
        <ul className={s.list}>
          <li>
            <strong>Average view duration:</strong> How long viewers watch in
            minutes and seconds
          </li>
          <li>
            <strong>Average percentage viewed:</strong> What portion of the
            video viewers complete
          </li>
          <li>
            <strong>First 30 second retention:</strong> How many viewers make it
            past your hook
          </li>
          <li>
            <strong>Retention curve shape:</strong> Gradual decline is normal,
            cliffs indicate problems
          </li>
        </ul>

        <h3 className={s.subheading}>How to Use the Data</h3>
        <ol className={s.numberedList}>
          <li>
            Check retention for each video 48 to 72 hours after publishing
          </li>
          <li>
            Look for drop-off points and note what happens at those timestamps
          </li>
          <li>
            Compare retention across similar videos to identify patterns
          </li>
          <li>
            Test one change at a time so you know what works
          </li>
        </ol>
        <p className={s.sectionText}>
          For detailed guidance on reading retention curves, see our{" "}
          <Link href="/learn/youtube-retention-analysis">
            retention analysis guide
          </Link>
          .
        </p>
      </section>

      {/* CTA */}
      <div className={s.highlight}>
        <p>
          <strong>See your retention patterns.</strong> {BRAND.name} connects to
          your YouTube analytics and shows you exactly where viewers drop off.
          Identify your retention killers and track improvement over time.
        </p>
      </div>
    </>
  );
}
