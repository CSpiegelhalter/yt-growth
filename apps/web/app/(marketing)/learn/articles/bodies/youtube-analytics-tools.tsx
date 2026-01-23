/**
 * Body content for YouTube Analytics Tools article.
 * Server component - no "use client" directive.
 */

import Link from "next/link";
import type { BodyProps } from "./index";

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* Overview */}
      <section id="overview" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </span>
          Why Your Numbers Matter
        </h2>
        <p className={s.sectionText}>
          Every video you publish generates data. That data tells you whether your packaging
          convinced someone to click, whether your content kept them watching, and whether
          they came back for more. Without checking your stats, you&apos;re making content
          decisions based on gut feeling alone. With them, you can see exactly what&apos;s
          working—and what isn&apos;t—so you can do more of what grows your channel.
        </p>
        <p className={s.sectionText}>
          This guide walks you through where to find the numbers that matter, how to read them,
          and what to do once you understand them. Think of it as a practical workflow rather
          than a reference manual.
        </p>
        <div className={s.highlight}>
          <p>
            <strong>The simplest way to use analytics:</strong> Packaging tells you if people click.
            Retention tells you if they stay. Returning viewers tell you if you&apos;re building a channel.
          </p>
        </div>
      </section>

      {/* YouTube Studio */}
      <section id="youtube-studio" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </span>
          Navigating YouTube Studio
        </h2>
        <p className={s.sectionText}>
          YouTube Studio is your source of truth. Third-party tools estimate; Studio shows
          you the real numbers directly from YouTube&apos;s servers. Everything you need to
          evaluate your channel lives in the Analytics section, organized into four tabs.
        </p>

        <h3 className={s.subheading}>Overview Tab</h3>
        <p className={s.sectionText}>
          The Overview tab gives you a quick pulse: total views, watch time, and subscriber
          changes for your selected date range. You&apos;ll also see your top-performing videos
          and real-time activity from the last 48 hours. Use this as your daily check-in to
          spot anything unusual before diving deeper.
        </p>

        <h3 className={s.subheading}>Reach Tab</h3>
        <p className={s.sectionText}>
          Reach answers the question: &quot;Are people seeing my content, and are they clicking?&quot;
          Here you&apos;ll find impressions (how often your thumbnails appeared), click-through
          rate (what percentage of those impressions became views), and traffic sources (where
          your viewers came from—browse, suggested, search, external, or direct). The impressions
          funnel visualizes how views convert through each discovery stage.
        </p>

        <h3 className={s.subheading}>Engagement Tab</h3>
        <p className={s.sectionText}>
          Engagement shows whether viewers actually watch your content. Average view duration
          is front and center, along with performance data for end screens, cards, and playlists.
          The retention graph for each video reveals exactly where viewers drop off—critical
          information for improving your hooks and pacing.
        </p>

        <h3 className={s.subheading}>Audience Tab</h3>
        <p className={s.sectionText}>
          Audience tells you who&apos;s watching and how loyal they are. The returning viewers
          metric shows whether you&apos;re building a repeat audience or just getting one-time
          clicks. You&apos;ll also find demographic data (age, gender, location), subscriber
          status breakdowns, and when your audience is most active online—helpful for timing
          uploads.
        </p>
      </section>

      {/* Key Metrics */}
      <section id="key-metrics" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </span>
          The Metrics That Actually Matter
        </h2>
        <p className={s.sectionText}>
          YouTube tracks dozens of data points, but only a handful directly influence whether
          the algorithm promotes your content. Focus here first.
        </p>

        <h3 className={s.subheading}>Click-Through Rate (CTR)</h3>
        <p className={s.sectionText}>
          CTR measures how often viewers click when they see your thumbnail. It reflects the
          combined effectiveness of your title and thumbnail—your video&apos;s packaging. A higher
          CTR means more views from the same number of impressions. Typical ranges vary by
          niche and audience, so compare against your own averages rather than arbitrary benchmarks.
        </p>

        <h3 className={s.subheading}>Average View Duration and Retention</h3>
        <p className={s.sectionText}>
          This is the strongest signal of content quality. YouTube wants to keep people on
          the platform, so videos that hold attention get promoted more. Your retention curve
          shows exactly where viewers leave—use it to identify weak hooks, slow sections, or
          confusing transitions. For a deep dive on reading and improving retention,
          see our <Link href="/learn/youtube-retention-analysis">retention analysis guide</Link>.
        </p>

        <h3 className={s.subheading}>Returning Viewers</h3>
        <p className={s.sectionText}>
          Views are nice, but returning viewers indicate you&apos;re building an actual audience.
          If most of your views come from new viewers who never return, you&apos;re attracting
          clicks but not building loyalty. Track whether your returning viewer percentage
          grows over time—that&apos;s the foundation of a sustainable channel.
        </p>

        <h3 className={s.subheading}>Subscribers Per Video</h3>
        <p className={s.sectionText}>
          Some videos convert viewers into subscribers better than others. Track which topics
          and formats generate the most subscriber growth relative to views. These are the
          videos that convince people your channel is worth following long-term.
        </p>

        <h3 className={s.subheading}>Traffic Mix</h3>
        <p className={s.sectionText}>
          Where your views come from shapes your growth trajectory. Browse and Suggested
          traffic indicate the algorithm is actively promoting you. Search traffic shows
          you&apos;re capturing intent. External traffic can spike views but rarely builds
          a loyal audience. Watch how your mix shifts over time.
        </p>

        <p className={s.sectionText}>
          Each week, set aside 15 minutes to review these five numbers. They&apos;ll tell you
          whether your content strategy is working.
        </p>
        <ol className={s.list}>
          <li>CTR on recent videos (is your packaging improving?)</li>
          <li>Average view duration and retention trends</li>
          <li>Returning vs. new viewer ratio</li>
          <li>Subscribers gained per video or per 1,000 views</li>
          <li>Traffic source breakdown (browse, suggested, search)</li>
        </ol>
      </section>

      {/* Third-Party Tools */}
      <section id="third-party-tools" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </span>
          When Third-Party Tools Help
        </h2>
        <p className={s.sectionText}>
          YouTube Studio shows your own data perfectly. But there are things it can&apos;t do:
          track competitors, research keywords, or run controlled experiments on thumbnails.
          That&apos;s where external tools fill the gap.
        </p>

        <h3 className={s.subheading}>Social Blade</h3>
        <p className={s.sectionText}>
          Social Blade tracks public subscriber and view counts for any channel over time.
          It&apos;s free and useful for monitoring competitor growth trends, spotting when
          channels gain or lose momentum, and benchmarking your progress against others
          in your niche. The earnings estimates are rough—treat them as ballpark figures only.
        </p>

        <h3 className={s.subheading}>vidIQ</h3>
        <p className={s.sectionText}>
          vidIQ focuses on discovery and SEO. Its keyword research tools help you find
          search terms with good volume and manageable competition. The browser extension
          overlays useful data on YouTube pages, including competitor stats and tag analysis.
          The free tier covers basics; paid plans unlock more keyword depth.
        </p>

        <h3 className={s.subheading}>TubeBuddy</h3>
        <p className={s.sectionText}>
          TubeBuddy excels at channel management and experimentation. Its headline feature
          is thumbnail A/B testing—you can run controlled tests to see which version
          performs better. It also offers bulk editing tools, keyword research, and
          optimization checklists. Like vidIQ, it works as a browser extension with
          free and paid tiers.
        </p>

        <p className={s.sectionText}>
          One caution: third-party tools estimate certain metrics (like competitor revenue
          or exact CTR) based on public data and algorithms. These estimates can differ
          significantly from reality. Use them for directional insight, not precise numbers.
        </p>

        <p className={s.sectionText}>
          Reach for external tools when you need capabilities Studio doesn&apos;t offer:
        </p>
        <ul className={s.list}>
          <li>Researching competitor channels and their growth patterns</li>
          <li>Finding keywords and topics with search demand</li>
          <li>Running A/B tests on thumbnails or titles</li>
          <li>Tracking historical trends beyond Studio&apos;s date range</li>
        </ul>
      </section>

      {/* Competitor Tracking */}
      <section id="competitor-tracking" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 1012 0V2z" />
            </svg>
          </span>
          Learning from Competitors
        </h2>
        <p className={s.sectionText}>
          You&apos;ll never see a competitor&apos;s private stats—their CTR, retention curves,
          or revenue stay hidden. But public data reveals plenty: subscriber counts, view
          totals, upload frequency, engagement (likes and comments), and video lengths.
          More importantly, you can see their packaging and content directly.
        </p>
        <p className={s.sectionText}>
          The goal isn&apos;t to copy competitors blindly. It&apos;s to identify patterns that
          work in your niche and understand why. Look for outlier videos—content that
          performed dramatically better than a channel&apos;s average. Study the title,
          thumbnail, hook, and topic choice. What made viewers click and stay?
        </p>
        <p className={s.sectionText}>
          Pay attention to thumbnail styles that get traction, title structures that
          generate curiosity, and topics that consistently perform. Then adapt those
          patterns to your own voice and content strategy—don&apos;t replicate them exactly.
          Your audience will notice if you&apos;re simply copying someone else.
        </p>
        <p className={s.sectionText}>
          What not to copy: posting schedules that don&apos;t fit your capacity, production
          styles that require equipment you don&apos;t have, or topics outside your expertise.
          Competitors give you ideas, not a template. For a complete framework,
          see our <Link href="/learn/youtube-competitor-analysis">competitor analysis guide</Link>.
        </p>
      </section>

      {/* Growth Tracking */}
      <section id="growth-tracking" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          </span>
          Building a Tracking Routine
        </h2>
        <p className={s.sectionText}>
          Checking your stats every hour leads to anxiety, not insight. Ignoring them
          entirely means missing signals that could change your strategy. The solution
          is a consistent routine with different cadences for different purposes.
        </p>
        <p className={s.sectionText}>
          Daily, take 60 seconds to glance at real-time performance on recent uploads
          and subscriber changes. You&apos;re not analyzing—just spotting anything unusual
          that needs attention. If a new video is tanking or taking off, you want to
          know early.
        </p>
        <p className={s.sectionText}>
          Weekly, spend 15–20 minutes reviewing CTR, retention, and traffic trends across
          your recent content. Compare this week to last week. Identify which videos
          outperformed and which underperformed. Form a hypothesis about why.
        </p>
        <p className={s.sectionText}>
          Monthly, zoom out. Look at subscriber growth trajectory, returning viewer
          trends, and whether your content plan is moving the needle. This is when
          you decide whether to double down on what&apos;s working, cut what isn&apos;t, or
          test something new.
        </p>
        <p className={s.sectionText}>
          A simple routine might look like this:
        </p>
        <ol className={s.list}>
          <li>Quick daily pulse—real-time views, anything unusual</li>
          <li>Weekly deep dive—CTR, retention, traffic sources</li>
          <li>Pick one experiment based on what you learned</li>
          <li>Monthly retrospective—growth trends and strategy check</li>
          <li>Update your content plan based on the data</li>
        </ol>
      </section>

      {/* Using Data */}
      <section id="using-data" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </span>
          Turning Data into Action
        </h2>
        <p className={s.sectionText}>
          Numbers without action are just numbers. The point of tracking is to change
          something—your packaging, your pacing, your topics, your strategy. Here&apos;s
          how to read common signals and respond.
        </p>

        <h3 className={s.subheading}>Low CTR: Fix Your Packaging</h3>
        <p className={s.sectionText}>
          If impressions are healthy but click-through rate lags, viewers are seeing
          your thumbnail and deciding not to click. Test different thumbnail styles—
          faces with clear emotion, bold text, contrasting colors, or more curiosity-driven
          imagery. Rework titles to promise a clearer benefit or create more intrigue.
          Sometimes the topic is fine but the packaging undersells it.
        </p>

        <h3 className={s.subheading}>Early Drop-Off: Strengthen Your Hook</h3>
        <p className={s.sectionText}>
          If your retention graph shows a steep drop in the first 30 seconds, your
          hook isn&apos;t landing. Viewers clicked expecting something; the opening didn&apos;t
          deliver. Cut slow intros, get to the point faster, or open with a compelling
          preview of what&apos;s coming. Every second of preamble costs you viewers.
        </p>

        <h3 className={s.subheading}>High Views, Low Subscribers: Build Series and Positioning</h3>
        <p className={s.sectionText}>
          Some videos attract viewers who watch once and leave. If you&apos;re getting views
          but not subscribers, viewers don&apos;t see a reason to come back. Create content
          series that encourage return visits. Make your channel&apos;s value proposition
          clearer—who is this for, and what will they get by subscribing?
        </p>

        <h3 className={s.subheading}>Low Suggested Traffic: Improve the Next-Video Path</h3>
        <p className={s.sectionText}>
          Suggested traffic comes when YouTube recommends your video alongside or after
          other content. If this source is weak, your videos may not be connecting well
          to related content. Use end screens and cards to guide viewers to more of your
          videos. Create content that naturally relates to popular topics in your niche.
          The algorithm promotes content that keeps sessions going.
        </p>
      </section>

      {/* Mistakes */}
      <section id="mistakes" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M15 9l-6 6M9 9l6 6" />
            </svg>
          </span>
          Mistakes That Waste Your Time
        </h2>
        <p className={s.sectionText}>
          YouTube stats can become a trap if you use them wrong. The most common mistake
          is obsessing over daily fluctuations—checking every few hours, feeling anxiety
          when numbers dip, celebrating spikes that mean nothing. Daily numbers are noise.
          Weekly and monthly trends are signal.
        </p>
        <p className={s.sectionText}>
          Equally damaging is analysis paralysis: spending more time in dashboards than
          creating content. Data informs decisions; it doesn&apos;t replace the work of
          actually making videos. If your tracking routine takes longer than planning
          your next video, something&apos;s off.
        </p>
        <p className={s.sectionText}>
          Avoid these traps:
        </p>
        <ul className={s.list}>
          <li>Checking stats constantly instead of on a set schedule</li>
          <li>Ignoring retention while focusing only on views</li>
          <li>Comparing yourself to channels 10x your size</li>
          <li>Chasing subscriber counts over engaged viewers</li>
          <li>Letting data review replace content creation time</li>
        </ul>
      </section>

      {/* CTA */}
      <div className={s.highlight}>
        <p>
          <strong>You don&apos;t need to become a data scientist.</strong> You need to know
          what to look at, where to find it, and what to do next. Check your numbers
          consistently, act on what they tell you, and get back to making content.
          The best creators use data as a compass—not a destination.
        </p>
      </div>
    </>
  );
}
