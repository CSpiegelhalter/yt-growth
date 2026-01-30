/**
 * Body content for YouTube Channel Audit article.
 * Server component - no "use client" directive.
 *
 * Full blog-style article: comfortable spacing, readable typography,
 * strong hierarchy, scannable sections, tasteful callouts, and clear CTAs.
 */

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import type { BodyProps } from "./index";
import { Callout } from "../../_components";


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

        <Callout variant="tip" title="Test one change at a time">
          <p>
            Change thumbnail OR title—not both at once. That way you actually
            learn what helped.
          </p>
        </Callout>

        <p className={s.sectionText}>
          If you don&apos;t want to interpret CTR in a vacuum, {BRAND.name}{" "}
          surfaces CTR alongside context—traffic source mix, retention
          stability, and whether the video is spreading beyond your core
          audience.{" "}
          <Link
            href="/dashboard"
            style={{ color: "var(--primary)", fontWeight: 600 }}
          >
            Try it in your dashboard
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

        <Callout variant="tip" title="Use key moments">
          <p>
            YouTube Studio&apos;s &quot;key moments for audience retention&quot;
            view highlights spikes and dips. Spikes show what to repeat; dips
            show what to remove or compress next time.
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
          Use end screens intentionally, and verbally pitch the next best video.
          Link a playlist that matches the viewer&apos;s next step. Consider a
          mid-video playlist card, not only end screens—many viewers leave
          before the final seconds.
        </p>


        <div className="realTalk">
          <p className="realTalk__label">Metric to track</p>
          <p className="realTalk__text">
            Add end screen clicks to your tracking. It often correlates with
            average percentage viewed: if people don&apos;t reach the end, they
            can&apos;t click. {BRAND.name} shows end screen CTR in expanded
            metrics.
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
          What a high-quality channel audit output looks like
        </h2>

        <p className={s.sectionText}>A good audit output does three things:</p>

        <p className={s.sectionText}>
          <strong>First</strong>, it identifies the biggest bottleneck—CTR vs
          retention vs post-watch. <strong>Second</strong>, it gives 1–3
          specific fixes tied to that bottleneck. <strong>Third</strong>, it
          recommends a simple experiment for the next upload.
        </p>

        <p className={s.sectionText}>
          That&apos;s how you turn analytics into momentum.
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
