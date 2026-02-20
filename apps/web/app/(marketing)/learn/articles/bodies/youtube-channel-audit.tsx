/**
 * Body content for YouTube Channel Audit article.
 * Server component - no "use client" directive.
 *
 * Full blog-style article: comfortable spacing, readable typography,
 * strong hierarchy, scannable sections, tasteful callouts, and clear CTAs.
 */

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { LEARN_ARTICLES } from "../../articles";
import type { BodyProps, ArticleMeta } from "./_shared";
import { tocFromArticle } from "./_shared";
import { Callout } from "../../_components";

const _article = LEARN_ARTICLES["youtube-channel-audit"];

export const meta: ArticleMeta = {
  slug: _article.slug,
  title: _article.title,
  description: _article.description,
};

export const toc = tocFromArticle(_article.toc);

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* INTRO */}
      <section id="intro" className="sectionOpen">
        <p className={s.sectionText} style={{ fontSize: "1.125rem" }}>
          If YouTube analytics have ever made you feel like you&apos;re staring
          at a cockpit full of blinking lights—welcome to the club. One tab says
          your video is a &quot;10/10,&quot; another says your click-through
          rate is &quot;too low,&quot; and your brain starts doing cartwheels:
          Do I change my thumbnail? Upload more? Shorten the intro? Switch
          niches?
        </p>

        <p className={s.sectionText}>
          Here&apos;s the problem: most creators get stuck optimizing the wrong
          numbers, or optimizing the right numbers in the wrong order. A channel
          audit isn&apos;t about obsessing over one metric (like CTR) in
          isolation. It&apos;s about understanding how your channel moves people
          through a simple story:
        </p>

        <p
          className={s.sectionText}
          style={{ fontWeight: 500, color: "var(--text)" }}
        >
          YouTube shows your video → people choose to click → they keep watching
          → they watch something else → you get momentum (and ideally,
          outcomes).
        </p>

        <p className={s.sectionText}>
          In this post, you&apos;ll learn a practical, no-drama way to audit
          your videos using the metrics that matter most—CTR, audience
          retention, and post-watch behavior—plus the supporting context that
          helps you decide what to do next.
        </p>

        <div className="funCallout">
          <p className="funCallout__text">
            If you want the faster version: {BRAND.name} connects to your
            YouTube analytics and surfaces these same signals inside your{" "}
            <Link
              href="/dashboard"
              style={{ color: "var(--primary)", fontWeight: 600 }}
            >
              dashboard
            </Link>{" "}
            and per-video pages—so you can spot the bottleneck in minutes
            instead of digging through tabs.
          </p>
        </div>
      </section>

      {/* THE ONE-METRIC MISTAKE */}
      <section id="one-metric-mistake" className="sectionOpen">
        <h2 className={s.sectionTitle}>
          The biggest mistake: judging a video by one metric
        </h2>

        <p className={s.sectionText}>
          A lot of people open Studio, see &quot;CTR is 3%,&quot; and
          immediately decide the whole upload is a failure. But one metric
          rarely tells the truth by itself—especially if you&apos;re using
          YouTube for business outcomes (clients, calls booked, leads, sales).
        </p>

        <p className={s.sectionText}>
          A video can have a &quot;low CTR&quot; and still produce meaningful
          results if it generated enough watch time, subscribers, or downstream
          conversions. That&apos;s why the first step in any real audit is
          context: <strong>What did this video actually produce?</strong>
        </p>

        <p className={s.sectionText}>
          Start every audit with a bigger picture snapshot: views, watch time or
          watch hours, subscribers gained (plus a simple viewer-to-subscriber
          ratio), traffic sources showing where viewers came from, and any
          downstream outcomes you care about—email signups, booked calls, or
          sales.
        </p>
      </section>

      {/* THE CORE GROWTH LOOP */}
      <section id="growth-loop" className="sectionTinted">
        <h2 className={s.sectionTitle}>
          The core YouTube growth loop (and why it works)
        </h2>

        <p className={s.sectionText}>
          Most small channels grow when three things work together.{" "}
          <strong>CTR</strong>: people click when YouTube shows the impression.{" "}
          <strong>Retention</strong>: people stay once they click.{" "}
          <strong>Post-watch behavior</strong>: people continue watching instead
          of bouncing.
        </p>

        <p className={s.sectionText}>
          When CTR and retention are strong, you often get a positive feedback
          loop: more impressions → more views → more watch time → more
          distribution.
        </p>

        <p className={s.sectionText}>
          Your audit shouldn&apos;t feel like an endless list of tips. It should
          feel like a diagnosis: <em>Which part of this loop is breaking?</em>
        </p>
      </section>

      {/* HOW YOUTUBE DECIDES WHAT TO PROMOTE */}
      <section id="youtube-algorithm" className="sectionOpen">
        <h2 className={s.sectionTitle}>
          How YouTube actually decides what to promote
        </h2>

        <p className={s.sectionText}>
          The YouTube algorithm doesn&apos;t respond to you—it responds to{" "}
          <strong>how people react to your videos</strong>. If people click,
          watch, and keep watching, YouTube promotes the video. If they click
          and immediately leave, YouTube pulls back distribution.
        </p>

        <p className={s.sectionText}>
          But YouTube cares about more than individual videos. It cares about{" "}
          <strong>viewing sessions</strong>:
        </p>

        <ul className={s.sectionText}>
          <li>
            <strong>What starts a session</strong>: Videos that get someone
            watching (especially from browse features and suggested videos)
          </li>
          <li>
            <strong>What continues it</strong>: Videos that lead to another
            video on YouTube
          </li>
          <li>
            <strong>How long the session lasts</strong>: Total time spent on the
            platform
          </li>
        </ul>

        <p className={s.sectionText}>
          This is why post-watch behavior matters so much. A video that keeps
          viewers on YouTube generates more ad revenue and user satisfaction
          than a video that sends them away—even if both have similar retention.
        </p>

        <p className={s.sectionText}>
          When you audit your channel, you&apos;re essentially asking:{" "}
          <em>
            Am I creating videos that start sessions, extend sessions, and keep
            viewers satisfied?
          </em>
        </p>
      </section>

      {/* DIAGNOSE CTR */}
      <section id="diagnose-ctr" className="sectionOpen">
        <h2 className={s.sectionTitle}>
          Diagnose click-through rate the right way (CTR + impressions)
        </h2>

        <h3 className={s.subheading}>What CTR means</h3>
        <p className={s.sectionText}>
          CTR is how often people click after they see your title and thumbnail.
          No click means no view, and no chance to earn watch time.
        </p>

        <h3 className={s.subheading}>Benchmarks (with nuance)</h3>
        <p className={s.sectionText}>
          A common target is 5%+ CTR, with 7% being better, and 2–4% often
          signaling weak interest. But CTR often drops as impressions scale to a
          broader audience. A tiny video can show 10–20% CTR because it&apos;s
          only being shown to the warmest audience first. High CTR at low
          impressions isn&apos;t automatically a win.
        </p>

        <p className={s.sectionText}>
          So don&apos;t ask &quot;Is my CTR good?&quot; Ask:{" "}
          <strong>
            Is my CTR good relative to my impressions volume and traffic source?
          </strong>
        </p>

        <h3 className={s.subheading}>What to change when CTR is low</h3>
        <p className={s.sectionText}>
          If CTR is underperforming, your highest-leverage change is usually
          title + thumbnail alignment. Keep thumbnails simple—two or three words
          maximum, with one clear idea. Make title and thumbnail express the
          same promise from two angles: clarity plus curiosity. And change one
          thing at a time so you can tell what moved CTR.
        </p>

        <Callout variant="tip" title="Have a backup thumbnail ready">
          <p>
            Before you publish, create a backup thumbnail variation. If CTR
            underperforms in the first 24–48 hours, you can swap it quickly
            without scrambling. This is your fastest leverage point for videos
            that aren&apos;t getting tested by YouTube.
          </p>
        </Callout>

        <p className={s.sectionText}>
          If you don&apos;t want to interpret CTR in a vacuum, {BRAND.name}{" "}
          surfaces CTR alongside context—traffic source mix, retention
          stability, and whether the video is spreading beyond your core
          audience—right in the Analytics tab on your{" "}
          <Link
            href="/dashboard"
            style={{ color: "var(--primary)", fontWeight: 600 }}
          >
            Dashboard
          </Link>
          .
        </p>
      </section>

      {/* DIAGNOSE RETENTION */}
      <section id="diagnose-retention" className="sectionTinted">
        <h2 className={s.sectionTitle}>
          Diagnose retention (and stop &quot;fixing&quot; the wrong part of the
          video)
        </h2>

        <p className={s.sectionText}>
          CTR gets the click. Retention decides whether YouTube should keep
          showing the video.
        </p>

        <h3 className={s.subheading}>How to read the retention graph</h3>
        <p className={s.sectionText}>
          A drop early is normal. What matters is how severe it is, and whether
          the line stabilizes or keeps sliding.
        </p>

        <p className={s.sectionText}>
          Useful starting targets by video length: for 4–6 minute videos, aim
          for 50–60% retention. For 8–12 minute videos, 45–47% is solid and 50%
          is excellent. For 12+ minute videos, 38–45% is a reasonable range.
        </p>

        <h3 className={s.subheading}>
          The 30-second rule: Your most important optimization window
        </h3>
        <p className={s.sectionText}>
          If you can only fix one thing about your videos,{" "}
          <strong>fix the first 30 seconds</strong>. This is where most viewers
          decide whether to stay or leave.
        </p>

        <p className={s.sectionText}>
          The pattern that works: <strong>pain point + payoff promise</strong>.
          Open with a quick statement of the problem your viewer has, then
          immediately promise the outcome they&apos;ll get by the end. No long
          intros. No &quot;Hey guys, welcome back.&quot; Just value.
        </p>

        <div className="realTalk">
          <p className="realTalk__label">Hook example</p>
          <p className="realTalk__text">
            Bad: &quot;Hey everyone, today I want to talk about thumbnails
            because they&apos;re really important for growth…&quot;
            <br />
            <br />
            Good: &quot;If your CTR is below 4%, your thumbnails are costing you
            views. Here&apos;s the three-word rule that fixed mine.&quot;
          </p>
        </div>

        <p className={s.sectionText}>
          In {BRAND.name}&apos;s Analytics tab, you can see exactly where
          viewers drop off in your retention curve—and we show you the likely
          cause (weak intro clarity, pacing issue, or topic drift) so you know
          what to fix next time.
        </p>

        <h3 className={s.subheading}>
          Use open loops to keep viewers watching
        </h3>
        <p className={s.sectionText}>
          Open loops are story cues that create curiosity about what&apos;s
          coming. They work because they make the viewer feel like leaving would
          mean missing something important.
        </p>

        <p className={s.sectionText}>Common open loop phrases:</p>
        <ul className={s.sectionText}>
          <li>&quot;and then…&quot;</li>
          <li>&quot;after that…&quot;</li>
          <li>&quot;wait until you see…&quot;</li>
          <li>&quot;in a second, I&apos;ll show you…&quot;</li>
          <li>
            &quot;Stick around for point #3—this is the one that moves the
            needle.&quot;
          </li>
        </ul>

        <p className={s.sectionText}>
          List-style videos work especially well with open loops because you can
          tease the &quot;best&quot; point coming up later.
        </p>

        <h3 className={s.subheading}>
          Pacing tactics that prevent mid-video drop-off
        </h3>
        <p className={s.sectionText}>
          Dead air is deadly. If nothing changes visually for too long, people
          check out—even if your script is solid.
        </p>

        <p className={s.sectionText}>
          The rule: <strong>change something every 30–45 seconds</strong>:
        </p>
        <ul className={s.sectionText}>
          <li>Switch to B-roll</li>
          <li>Add on-screen text or graphics</li>
          <li>Change camera angle or position</li>
          <li>Use gestures or movement</li>
          <li>Pattern interrupts (zoom in/out, quick cuts)</li>
          <li>
            Strategic pauses that add tension (&quot;…because here&apos;s the
            part most people miss&quot;)
          </li>
        </ul>

        <p className={s.sectionText}>
          When {BRAND.name} detects a mid-video retention cliff, we highlight
          the timestamp and suggest whether it&apos;s a pacing issue, unclear
          structure, or content mismatch—so you can fix the root cause, not just
          guess.
        </p>

        <h3 className={s.subheading}>
          Percentage viewed vs. average view duration
        </h3>
        <p className={s.sectionText}>
          Most creators focus on average view duration (how many minutes people
          watch). But <strong>percentage viewed</strong> is often more useful
          because it shows <em>how much</em> of the video people consume,
          regardless of length.
        </p>

        <p className={s.sectionText}>
          A 10-minute video with 50% viewed (5 minutes watched) suggests
          stronger satisfaction than a 5-minute video with 60% viewed (3 minutes
          watched)—even though the shorter video has a higher percentage. Why?
          Because viewers chose to stay for twice as long.
        </p>

        <p className={s.sectionText}>
          Higher percentage viewed signals to YouTube that viewers are satisfied
          and engaged. Track both metrics, but use percentage viewed to compare
          videos of different lengths.
        </p>

        <h3 className={s.subheading}>What to fix based on the curve</h3>
        <p className={s.sectionText}>
          A big drop in the first 15–30 seconds means your hook or value starts
          too late. Mid-video cliffs suggest pacing drift, unnecessary setup, or
          unclear structure. A slow steady decline usually means the content is
          okay—you just need to improve momentum and clarity.
        </p>

        <h3 className={s.subheading}>Fast fix for published videos</h3>
        <p className={s.sectionText}>
          If your first 10 seconds are killing retention, you can sometimes trim
          them in Studio. Go to Video Details → Editor → Trim. You can remove
          sections, but you can&apos;t add new footage—so it&apos;s best for
          cutting dead air and getting to value faster.
        </p>

        <Callout variant="tip" title="Use key moments to find re-watch spikes">
          <p>
            YouTube Studio&apos;s &quot;key moments for audience retention&quot;
            view highlights spikes and dips. Spikes show what resonated so
            strongly people re-watched it—use those patterns in future videos.
            Dips show what to remove or compress next time.
          </p>
        </Callout>
      </section>

      {/* DIAGNOSE POST-WATCH */}
      <section id="diagnose-post-watch" className="sectionOpen">
        <h2 className={s.sectionTitle}>
          Diagnose post-watch behavior (the multiplier most people ignore)
        </h2>

        <p className={s.sectionText}>
          Watch time matters—but not in the way creators usually think. YouTube
          appears to care about the viewing session: what starts it, what
          continues it, and how long it lasts.
        </p>

        <p className={s.sectionText}>
          If viewers continue watching after your video, YouTube interprets that
          as satisfaction. Your content created momentum instead of a dead end.
        </p>

        <h3 className={s.subheading}>How to improve post-watch behavior</h3>
        <p className={s.sectionText}>
          Use end screens intentionally, and <strong>verbally pitch</strong> the
          next best video. Don&apos;t just add an end screen and hope—tell
          viewers what they&apos;ll get if they click.
        </p>

        <p className={s.sectionText}>
          Link a playlist that matches the viewer&apos;s next logical step.
          Choose the &quot;perfect follow-up&quot; video that already exists
          rather than using generic &quot;latest upload&quot; end screens.
        </p>

        <h3 className={s.subheading}>
          Use playlists to extend sessions (not just organize content)
        </h3>
        <p className={s.sectionText}>
          Playlists are one of the most underused tools for increasing session
          time. When someone watches from a playlist, YouTube auto-plays the
          next video—which means your content keeps running even if they walk
          away from their phone, tablet, or TV.
        </p>

        <p className={s.sectionText}>Tactics that work:</p>
        <ul className={s.sectionText}>
          <li>
            Add <strong>playlist cards mid-video</strong>, not just at the end.
            Many viewers leave before the final seconds, so mid-video cards
            capture more clicks.
          </li>
          <li>
            Link playlists in end screens (not just individual videos) to
            maximize auto-play continuation.
          </li>
          <li>
            Structure playlists as viewer journeys: beginner → intermediate →
            advanced, or problem → solution → next step.
          </li>
        </ul>

        <div className="realTalk">
          <p className="realTalk__label">Metric to track</p>
          <p className="realTalk__text">
            Add end screen clicks to your tracking. It often correlates with
            average percentage viewed: if people don&apos;t reach the end, they
            can&apos;t click. {BRAND.name} shows end screen CTR in the Analytics
            tab on your Dashboard, so you can see which videos are driving
            session continuation.
          </p>
        </div>
      </section>

      {/* SUPPORTING CONTEXT */}
      <section id="supporting-context" className="sectionTinted">
        <h2 className={s.sectionTitle}>
          Supporting context that makes your audit smarter
        </h2>

        <p className={s.sectionText}>
          Once you&apos;ve diagnosed CTR, retention, and post-watch, use
          secondary metrics to sharpen decisions.
        </p>

        <h3 className={s.subheading}>Traffic sources</h3>
        <p className={s.sectionText}>
          Traffic sources tell you how the video is being found: browse,
          suggested, search, external. That changes what you should fix next. If
          browse is low, your thumbnail/title aren&apos;t winning on the home
          feed. If suggested is low across many videos, YouTube doesn&apos;t
          strongly associate your content with neighboring topics.
        </p>

        <h3 className={s.subheading}>Demographics</h3>
        <p className={s.sectionText}>
          Use demographics as steering, not a verdict. If your audience differs
          from your target, decide whether it&apos;s a mismatch to correct—or an
          opportunity to explore.
        </p>

        <h3 className={s.subheading}>Posting time</h3>
        <p className={s.sectionText}>
          Posting time may affect the speed of early views, but it&apos;s not a
          reliable lever for long-term performance. Consistency and quality beat
          chasing the perfect hour.
        </p>
      </section>

      {/* WHAT NOT TO OBSESS OVER */}
      <section id="misleading-metrics" className="sectionOpen">
        <h2 className={s.sectionTitle}>
          Metrics that mislead more than they help
        </h2>

        <p className={s.sectionText}>
          Not all metrics deserve your attention. Some create anxiety without
          giving you anything actionable to fix.
        </p>

        <h3 className={s.subheading}>Impressions (without CTR context)</h3>
        <p className={s.sectionText}>
          Impressions measure <strong>opportunity</strong>, not performance. If
          YouTube is testing your video, impressions should rise. But
          impressions alone don&apos;t tell you what to fix.
        </p>

        <p className={s.sectionText}>
          High impressions with low CTR means your packaging (title/thumbnail)
          isn&apos;t converting. Low impressions with high CTR means YouTube
          hasn&apos;t tested the video widely yet—or your topic has limited
          search volume.
        </p>

        <p className={s.sectionText}>
          Always look at impressions <em>and</em> CTR together. One without the
          other is incomplete.
        </p>

        <h3 className={s.subheading}>Subscribers gained (by itself)</h3>
        <p className={s.sectionText}>
          Subscribers are a <strong>lagging metric</strong>. Most viewers
          won&apos;t subscribe on the first video they watch—they&apos;ll watch
          2–3 videos, decide you&apos;re worth following, then subscribe later.
        </p>

        <p className={s.sectionText}>
          Subscriber counts can also fluctuate due to YouTube&apos;s bot
          cleanups or inactive account purges, which have nothing to do with
          your content quality.
        </p>

        <p className={s.sectionText}>
          Focus on <strong>viewer-to-subscriber conversion rate</strong>{" "}
          instead: how many unique viewers become subscribers over time. This
          tells you whether your content builds loyalty, not just curiosity.
        </p>

        <h3 className={s.subheading}>Views (without watch time context)</h3>
        <p className={s.sectionText}>
          &quot;300 views&quot; sounds impressive—until you realize people
          watched an average of 12 seconds. Views measure clicks, not
          satisfaction.
        </p>

        <p className={s.sectionText}>
          Always pair views with watch time or percentage viewed. If views are
          high but watch time is low, your title/thumbnail are clickable but the
          content isn&apos;t delivering on the promise.
        </p>
      </section>

      {/* THE EMOTIONAL TRAP */}
      <section id="emotional-trap" className="sectionOpen">
        <h2 className={s.sectionTitle}>
          The emotional trap: treating the first 48 hours as &quot;make or
          break&quot;
        </h2>

        <p className={s.sectionText}>
          The first 24–48 hours are mainly a thumbnail/title test window, not a
          final verdict. Some videos take off days, weeks, or months
          later—especially after a title/thumbnail update.
        </p>

        <p className={s.sectionText}>
          A calmer process: Early on, check CTR + impression flow. If there's a
          mismatch, swap thumbnail (have a backup ready). Otherwise, review at
          day 7 and day 28 before drawing conclusions.
        </p>

        <Callout variant="warning" title="Don't panic-edit">
          <p>
            If you&apos;re going to change anything in the first day or two,
            change thumbnail or title first—those affect whether YouTube keeps
            testing the video with new audiences. Use longer windows to judge
            overall performance.
          </p>
        </Callout>
      </section>

      {/* PATTERN DETECTION */}
      <section id="pattern-detection" className="sectionTinted">
        <h2 className={s.sectionTitle}>
          How to spot patterns that improve your next uploads
        </h2>

        <p className={s.sectionText}>
          One-off audits help. Pattern-finding helps more.
        </p>

        <p className={s.sectionText}>
          Use Advanced Mode in YouTube Analytics and group videos by format or
          topic. Compare lifetime performance and look for your channel&apos;s
          typical &quot;lift-off window.&quot; When do your videos tend to take
          off? Day 2? Day 7? Week 2? Month 1? Once you know, you stop making
          emotional decisions from day-two noise.
        </p>

        <div className="realTalk">
          <p className="realTalk__label">{BRAND.name} tie-in</p>
          <p className="realTalk__text">
            Ideally, {BRAND.name} would support pattern detection by letting you
            group videos by format/topic, compare lifetime curves, and recommend
            review checkpoints based on your channel&apos;s history. That&apos;s
            on our roadmap.
          </p>
        </div>
      </section>

      {/* AUDIT OUTPUT */}
      <section id="audit-output" className="sectionOpen">
        <h2 className={s.sectionTitle}>
          What to fix first (based on your bottleneck)
        </h2>

        <p className={s.sectionText}>
          A good audit identifies the biggest bottleneck, then gives you
          specific actions. Here&apos;s what {BRAND.name} surfaces in the
          Analytics tab when we detect each type of issue:
        </p>

        <h3 className={s.subheading}>If CTR is low</h3>
        <div
          className={s.sectionText}
          style={{
            background: "var(--surface-2)",
            padding: "1rem",
            borderRadius: "0.5rem",
            borderLeft: "3px solid var(--primary)",
          }}
        >
          <p style={{ margin: 0, marginBottom: "0.5rem" }}>
            <strong>Diagnosis:</strong> People aren&apos;t choosing your video
            when it&apos;s shown.
          </p>
          <p style={{ margin: 0, marginBottom: "0.5rem" }}>
            <strong>Fix:</strong>
          </p>
          <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
            <li>
              Simplify your thumbnail: 2–3 words max, stronger contrast, one
              clear idea
            </li>
            <li>
              Make the title and thumbnail say the same promise from two angles
            </li>
            <li>
              Aim for curiosity + clarity: enough intrigue to click, enough
              clarity to trust
            </li>
            <li>
              Test one backup thumbnail if CTR stays below 4% after 48 hours
            </li>
          </ul>
        </div>

        <h3 className={s.subheading}>If retention is low</h3>
        <div
          className={s.sectionText}
          style={{
            background: "var(--surface-2)",
            padding: "1rem",
            borderRadius: "0.5rem",
            borderLeft: "3px solid var(--primary)",
          }}
        >
          <p style={{ margin: 0, marginBottom: "0.5rem" }}>
            <strong>Diagnosis:</strong> People click but leave quickly.
          </p>
          <p style={{ margin: 0, marginBottom: "0.5rem" }}>
            <strong>Fix:</strong>
          </p>
          <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
            <li>
              Rewrite the first 15 seconds to hit a pain point and promise a
              payoff
            </li>
            <li>
              Add open loops that make the viewer want the next section
              (&quot;stick around for #3&quot;)
            </li>
            <li>
              Increase pacing: change visuals every 30–45 seconds; remove dead
              air
            </li>
            <li>
              Check the retention graph for sharp drops and remove/compress
              those sections next time
            </li>
          </ul>
        </div>

        <h3 className={s.subheading}>If post-watch behavior is low</h3>
        <div
          className={s.sectionText}
          style={{
            background: "var(--surface-2)",
            padding: "1rem",
            borderRadius: "0.5rem",
            borderLeft: "3px solid var(--primary)",
          }}
        >
          <p style={{ margin: 0, marginBottom: "0.5rem" }}>
            <strong>Diagnosis:</strong> People watch but don&apos;t continue to
            another video.
          </p>
          <p style={{ margin: 0, marginBottom: "0.5rem" }}>
            <strong>Fix:</strong>
          </p>
          <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
            <li>
              Link a playlist that matches the viewer&apos;s next logical step
            </li>
            <li>
              Use a mid-video playlist card (around 60–70% through the video),
              not only end screens
            </li>
            <li>
              Verbally pitch the next video: tell viewers what they&apos;ll get
              if they click
            </li>
            <li>
              Ask a focused question in the comments to invite engagement and
              signal satisfaction
            </li>
          </ul>
        </div>

        <p className={s.sectionText} style={{ marginTop: "1.5rem" }}>
          {BRAND.name} highlights the exact bottleneck and shows these
          recommendations in your Dashboard&apos;s Analytics tab—so you can move
          from &quot;What&apos;s wrong?&quot; to &quot;What do I fix?&quot; in
          under a minute.
        </p>
      </section>

      {/* CONCLUSION */}
      <section id="conclusion" className="sectionTinted">
        <h2 className={s.sectionTitle}>
          The audit mindset that makes growth feel inevitable
        </h2>

        <p className={s.sectionText}>
          YouTube analytics don&apos;t have to be overwhelming. Growth is
          usually a systems issue, not a motivation issue.
        </p>

        <p className={s.sectionText}>
          Audit in order: <strong>CTR</strong>—are people choosing the video
          when it&apos;s shown? <strong>Retention</strong>—are they staying once
          they click? <strong>Post-watch</strong>—are they continuing afterward?
          Then use traffic sources and patterns to decide what to double down on
          next.
        </p>

        <p className={s.sectionText}>
          The goal isn&apos;t perfection. It&apos;s clarity. When you know which
          part of the loop is breaking, you know what to fix. When you fix the
          right things in the right order, growth stops feeling random and
          starts feeling inevitable.
        </p>

        <div className="realTalk">
          <p className="realTalk__label">Key takeaways</p>
          <ul className="realTalk__text" style={{ margin: 0 }}>
            <li>
              YouTube responds to people: clicks, watch time, and session
              continuation
            </li>
            <li>
              Focus on the first 30 seconds—this is where most drop-off happens
            </li>
            <li>
              Use open loops and pacing changes to keep viewers engaged
              mid-video
            </li>
            <li>
              Post-watch behavior (playlists, end screens) extends sessions and
              signals satisfaction
            </li>
            <li>
              Avoid obsessing over impressions, subscribers, or views in
              isolation—context matters
            </li>
            <li>Fix one bottleneck at a time: CTR, retention, or post-watch</li>
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="sectionOpen">
        <h2 className={s.sectionTitle}>Frequently asked questions</h2>

        <h3 className={s.subheading}>How often should I audit my channel?</h3>
        <p className={s.sectionText}>
          Run a full audit every 3–6 months, or immediately when growth stalls
          for 4+ weeks. Between full audits, do a quick weekly check of your
          last video&apos;s retention curve and CTR. This takes 5 minutes and
          catches problems early.
        </p>

        <h3 className={s.subheading}>What&apos;s a good CTR for YouTube?</h3>
        <p className={s.sectionText}>
          Most channels see CTR between 2% and 10%. For browse and suggested
          traffic, 4–6% is common. For search traffic, 5–10% is typical. More
          important than hitting a number is watching your trend over time. If
          CTR is dropping month over month, your thumbnails or titles need work.
        </p>

        <h3 className={s.subheading}>
          Why do viewers drop off in the first 30 seconds?
        </h3>
        <p className={s.sectionText}>
          The most common causes are slow intros (too much setup before value),
          a mismatch between the thumbnail promise and the actual content, or
          weak hooks that don&apos;t create curiosity. Check your retention
          graph. If there&apos;s a cliff in the first 30 seconds, rewatch that
          segment and ask what would make you click away.
        </p>

        <h3 className={s.subheading}>
          Should I focus on impressions or CTR first?
        </h3>
        <p className={s.sectionText}>
          Focus on CTR first. Impressions are an opportunity for a click, but if
          your CTR is low, more impressions won&apos;t help—YouTube will just
          show your video to more people who won&apos;t click. Fix CTR (through
          better thumbnails and titles), then impressions tend to follow as
          YouTube tests the video with broader audiences.
        </p>

        <h3 className={s.subheading}>
          How do I know if my retention is good or bad?
        </h3>
        <p className={s.sectionText}>
          Compare your retention to video length. For 4–6 minute videos, aim for
          50–60%. For 8–12 minute videos, 45–50% is solid. For 12+ minute
          videos, 38–45% is reasonable. But retention benchmarks vary by
          niche—educational content often has higher retention than
          entertainment. The bigger question is: where are people dropping off,
          and why?
        </p>

        <h3 className={s.subheading}>
          What&apos;s the fastest way to improve a struggling video?
        </h3>
        <p className={s.sectionText}>
          If the video is still in its first 48 hours and CTR is below 4%, swap
          the thumbnail (have a backup ready before publishing). If it&apos;s
          been live longer, check the retention graph. If there&apos;s a big
          drop in the first 10–15 seconds, use YouTube Studio&apos;s trim editor
          to cut the intro and get to value faster. This can revive videos that
          are underperforming due to slow starts.
        </p>

        <h3 className={s.subheading}>
          How does {BRAND.name} make auditing faster?
        </h3>
        <p className={s.sectionText}>
          {BRAND.name} connects to your YouTube analytics and surfaces the
          metrics that matter—CTR, retention curves, post-watch behavior,
          traffic sources—in one place on your Dashboard&apos;s Analytics tab.
          Instead of hopping between Studio tabs and manually interpreting data,
          we show you the bottleneck (low CTR, retention drop-off, weak
          post-watch) and give you specific recommendations to fix it. You go
          from &quot;What&apos;s wrong?&quot; to &quot;What do I fix?&quot; in
          under a minute.
        </p>
      </section>

      {/* FINAL CTA */}
      <div className="sectionAccent">
        <h3
          style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}
        >
          If you want the audit without tab-hopping
        </h3>
        <p
          style={{
            fontSize: "1.125rem",
            marginBottom: "1.5rem",
            maxWidth: "500px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          {BRAND.name} connects to your YouTube analytics and surfaces
          what&apos;s working—and what needs attention—in one place.
        </p>
        <Link
          href="/dashboard"
          style={{
            display: "inline-block",
            padding: "0.875rem 2rem",
            background: "white",
            color: "#6366f1",
            fontWeight: 600,
            borderRadius: "0.5rem",
            textDecoration: "none",
          }}
        >
          Run your audit in {BRAND.name}
        </Link>
        <p
          style={{
            fontSize: "0.875rem",
            marginTop: "1rem",
            opacity: 0.9,
          }}
        >
          See what&apos;s working, what&apos;s not, and what to do next.
        </p>
      </div>
    </>
  );
}
