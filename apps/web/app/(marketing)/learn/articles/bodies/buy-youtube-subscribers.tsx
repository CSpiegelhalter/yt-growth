/**
 * Body content for Buy YouTube Subscribers article.
 * Server component - no "use client" directive.
 *
 * Narrative-first approach: empathy → clarity → decision → safe options → better path → next steps.
 */

import Link from "next/link";
import { LEARN_ARTICLES } from "../../articles";
import type { BodyProps } from "./_shared";
import { articleExports } from "./_shared";

export const { meta, toc } = articleExports(LEARN_ARTICLES["buy-youtube-subscribers"]);

const pathNavLinkStyle: React.CSSProperties = {
  padding: "0.625rem 1rem",
  background: "var(--surface-alt)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
  fontSize: "var(--text-sm)",
  fontWeight: 500,
  color: "var(--text)",
  textDecoration: "none",
  transition: "all 0.15s",
};

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* Hook + Empathy */}
      <section id="intro" className={s.section}>
        <h2 className={s.sectionTitle}>What You're Really Looking For</h2>

        <p className={s.sectionText}>
          If you're searching for how to buy YouTube subscribers, you're probably feeling stuck.
          Maybe you've been uploading for months without much traction. Maybe you want social proof
          so your channel looks more established. Maybe you're just a few hundred away from 1,000
          and want to cross the monetization threshold already.
        </p>

        <p className={s.sectionText}>
          These are completely normal feelings. Growth on YouTube can feel glacially slow, and when
          you see channels rocket past you, it's tempting to look for a shortcut. This guide will
          walk you through your actual options—what works, what doesn't, and where to put your
          energy if you want growth that sticks.
        </p>

        {/* Truth in 30 seconds */}
        <div className={s.highlight}>
          <p>
            <strong>The short version:</strong> Buying subscribers from third-party sellers almost
            never delivers what you actually want. The subscribers don't watch, so your videos
            don't get pushed, and your channel's performance data gets noisy. If you want to pay
            for reach, YouTube's own Promotions feature (via YouTube Studio) is the legitimate
            route—but even that works best when you're amplifying a video that's already strong.
            In most cases, the money is better spent improving your content directly.
          </p>
        </div>
      </section>

      {/* Choose Your Path */}
      <section id="choose-path" className={s.section}>
        <h2 className={s.sectionTitle}>Start Here</h2>

        <p className={s.sectionText}>
          Where you are determines what you need. Pick the path that matches your situation:
        </p>

        <nav
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            marginTop: "1rem",
          }}
        >
          <Link href="#subscriber-sellers" style={pathNavLinkStyle}>
            I&apos;m considering buying subs
          </Link>
          <Link href="#youtube-promotions" style={pathNavLinkStyle}>
            I want legit paid promotion
          </Link>
          <Link href="#recovery" style={pathNavLinkStyle}>
            I already bought subs
          </Link>
        </nav>
      </section>

      {/* Path A: Subscriber Sellers */}
      <section id="subscriber-sellers" className={s.section}>
        <h2 className={s.sectionTitle}>What "Buying Subscribers" Usually Means</h2>

        <p className={s.sectionText}>
          When most people search for buying subscribers, they find services promising "1,000 real
          subscribers for $X." These come from sites, Telegram groups, or shady Fiverr gigs.
          The subscribers are typically bots, recycled accounts, click-farm workers, or people
          in "sub4sub" networks who subscribe in bulk without any intention of watching.
        </p>

        <p className={s.sectionText}>
          Here's why this rarely delivers the result you want: YouTube doesn't reward subscriber
          counts. It rewards engagement—clicks, watch time, retention, and follow-up viewing.
          If your subscriber count goes up but those subscribers never watch, your videos look
          like they're performing poorly relative to your audience size. That's a bad signal.
        </p>

        <p className={s.sectionText}>
          There's also a practical issue. When you publish a new video, YouTube tests it with a
          small slice of your audience first. If that slice includes people who subscribed but
          don't care, the initial performance data can tank—and the video never gets pushed further.
          Instead of social proof, you've added noise that makes it harder for YouTube to find
          your real audience.
        </p>

        <div className={s.highlight}>
          <p>
            <strong>The visual math doesn't help either.</strong> A channel with 10,000 subscribers
            but only 200 views per video looks suspicious to viewers and brands alike. Real social
            proof comes from healthy engagement ratios, not big numbers with hollow metrics behind them.
          </p>
        </div>

        <h3 className={s.subheading}>What about policy risk?</h3>

        <p className={s.sectionText}>
          YouTube's terms prohibit artificially inflating metrics through automated systems or
          deceptive practices. In practice, this means fake subscribers often get removed in
          periodic purges—so the count you paid for can vanish. If the pattern is severe, it
          can trigger spam flags or create problems when you apply for monetization. The
          platform's detection has improved significantly over the years, and "undetectable"
          services have a poor track record.
        </p>

        <p className={s.sectionText}>
          The bottom line: buying from subscriber-selling services costs money, adds risk, and
          usually delivers the opposite of what you wanted. It doesn't build a real audience,
          and it doesn't help your videos get recommended.
        </p>
      </section>

      {/* Path B: YouTube Promotions */}
      <section id="youtube-promotions" className={s.section}>
        <h2 className={s.sectionTitle}>The Legitimate Way to Pay for Reach</h2>

        <p className={s.sectionText}>
          If you genuinely want to spend money to accelerate discovery, YouTube offers a built-in
          option. Inside YouTube Studio, go to <strong>Content</strong>, select a video, and click
          <strong> Promotions</strong>. From there, you can run a simple ad campaign without
          leaving the Creator interface.
        </p>

        <p className={s.sectionText}>
          The flow is straightforward. You pick a goal—typically "Audience growth" (optimizes for
          subscribers) or "Video views" (optimizes for watch time). You choose the video you want
          to promote, select target countries and languages, set a daily budget, and launch.
          Behind the scenes, this creates a Google Ads campaign, but you don't need to touch
          the Ads interface unless you want more control.
        </p>

        <h3 className={s.subheading}>When this can actually help</h3>

        <p className={s.sectionText}>
          Promotions work best when you're amplifying something that's already working. If you have
          a video with strong click-through rate and retention, paid reach can help it find more
          of the right people faster. This is especially useful if you sell something—a course,
          a service, a product—and the video is part of a funnel. In that case, the math is
          different: you're not just buying vanity metrics, you're buying targeted impressions
          that can convert.
        </p>

        <p className={s.sectionText}>
          Some creators also use Promotions strategically during a launch, when they want initial
          awareness to jumpstart organic discovery. Others use it to test thumbnails and hooks
          at scale—more impressions means faster data on what's working.
        </p>

        <h3 className={s.subheading}>When it usually disappoints</h3>

        <p className={s.sectionText}>
          The trouble comes when creators use Promotions hoping to "fix" a channel that's not
          getting traction. If the underlying content doesn't hold attention, paid reach just
          delivers more people who bounce. Worse, if you optimize for cheap clicks by targeting
          low-cost countries that don't match your actual audience, you can end up with
          subscribers who never engage—creating the same hollow-metrics problem you'd have with
          bought subscribers, just through a "legit" channel.
        </p>

        <p className={s.sectionText}>
          The "audience growth" goal in particular can produce a spike in subscribers who
          don't return for future videos. YouTube counts them as subscribers, but they don't
          behave like loyal viewers. If your goal is hitting 1,000 subs for monetization,
          this might technically get you there—but it won't build the watch-time base you
          also need, and it can distort your analytics.
        </p>

        <div className={s.highlight}>
          <p>
            <strong>A useful mental model:</strong> treat Promotions like gasoline, not a spark plug.
            Gasoline amplifies a flame. If you pour it on cold wood, nothing happens. Make sure
            your video can sustain engagement before you pay to send more people to it.
          </p>
        </div>
      </section>

      {/* What to Do Instead */}
      <section id="real-growth" className={s.section}>
        <h2 className={s.sectionTitle}>Where the Money Is Better Spent</h2>

        <p className={s.sectionText}>
          Most of the time, the budget you'd spend on subscriber services or promotions will
          do more for your channel if you invest it in making your content better. This isn't
          a preachy "just be patient" message—it's math. YouTube's recommendation system
          rewards videos that keep people watching and clicking. Every improvement you make
          to those signals compounds over time.
        </p>

        <p className={s.sectionText}>
          Real growth usually comes down to five levers. <strong>First, topic selection</strong>—picking
          ideas with proven demand in your niche, not just ideas you think are interesting.
          <strong> Second, packaging</strong>—titles and thumbnails that create curiosity without
          misleading. <strong>Third, the hook</strong>—the first 30 seconds need to lock people in.
          <strong> Fourth, retention</strong>—cutting filler, re-engaging attention, giving people a
          reason to stay. <strong>Fifth, consistency</strong>—showing up regularly so the algorithm
          (and your audience) can learn what to expect.
        </p>

        <p className={s.sectionText}>
          One strong video can change everything. Creators often underestimate how much delayed
          growth is baked into YouTube. A video can sit dormant for weeks, then suddenly get
          picked up. The "breakout" video is often number 30, 50, or 100—not number 5. Early
          flops don't mean the channel is doomed; they mean you're collecting data on what works.
        </p>

        <h3 className={s.subheading}>Hiring help the right way</h3>

        <p className={s.sectionText}>
          If you want to spend money, consider hiring for the things that actually move the
          needle. Platforms like Fiverr or Upwork have freelancers who specialize in YouTube—not
          for selling subscribers, but for the craft: thumbnail design, video editing, scripting,
          channel audits. A good thumbnail designer can help you develop a consistent visual
          style that gets clicks. A skilled editor can tighten your pacing and reduce drop-off.
          A strategist can audit your channel and tell you exactly where you're losing people.
        </p>

        <p className={s.sectionText}>
          You can even hire someone to set up and manage legitimate Google Ads campaigns for
          you—promoting your best video to the right audience, with proper targeting. That's
          very different from paying a random service to inflate your subscriber count.
        </p>

        <p className={s.sectionText}>
          Avoid anyone who promises "X subscribers in Y days" as a deliverable. That's a red flag.
          Legitimate YouTube professionals talk about creative quality, strategy, and performance
          metrics—not guaranteed subscriber numbers.
        </p>
      </section>

      {/* Recovery */}
      <section id="recovery" className={s.section}>
        <h2 className={s.sectionTitle}>If You Already Bought Subscribers</h2>

        <p className={s.sectionText}>
          If you've already used one of these services, the goal now is to stop the damage and
          rebuild clean. Don't panic—channels recover from this all the time.
        </p>

        <p className={s.sectionText}>
          Start by stopping any active "subscriber" services immediately. Change passwords and
          enable two-factor authentication on your Google account, especially if you gave any
          service access to your channel. Revoke access for any third-party apps you don't
          recognize—you can check this in your Google account settings under "Security."
        </p>

        <p className={s.sectionText}>
          Next, take a look at your analytics. Watch for unusual spikes in traffic sources you
          don't recognize, sharp drops in retention on videos that previously held attention,
          or subscriber counts that don't match your engagement levels. This gives you a baseline
          for what's real.
        </p>

        <p className={s.sectionText}>
          From here, refocus on one strong content pillar and publish consistently for the next
          six to eight weeks. Over time, YouTube will purge inactive accounts, and your subscriber
          count may drop—but that's actually good. Clean data is better than inflated numbers.
          Your goal is to rebuild an audience of people who actually watch, and that starts with
          showing up consistently with content worth watching.
        </p>
      </section>

      {/* FAQ */}
      <section id="faq" className={s.section}>
        <h2 className={s.sectionTitle}>Common Questions</h2>

        <div className={s.sectionText}>
          <details>
            <summary><strong>Are YouTube Promotions the same as "buying subscribers"?</strong></summary>
            <p style={{ marginTop: "0.5rem" }}>
              Not in the harmful sense. Promotions pay YouTube to show your video to real people—if
              they subscribe, that's their choice. The tradeoff is that "ad subscribers" often don't
              become loyal viewers unless your content is exceptional and highly relevant to them.
            </p>
          </details>

          <details style={{ marginTop: "0.75rem" }}>
            <summary><strong>Will buying subscribers get me monetized faster?</strong></summary>
            <p style={{ marginTop: "0.5rem" }}>
              Rarely. Monetization requires both 1,000 subscribers and 4,000 watch hours (or 10M
              Shorts views). Fake or disengaged subscribers don't generate watch time. You can hit
              the subscriber count and still be nowhere near the watch-time threshold—and your
              analytics will be harder to interpret.
            </p>
          </details>

          <details style={{ marginTop: "0.75rem" }}>
            <summary><strong>What's the fastest legitimate way to 1,000 subscribers?</strong></summary>
            <p style={{ marginTop: "0.5rem" }}>
              Consistent publishing, better topic selection, and better packaging. Shorts can help
              with discoverability. One breakout long-form video often accelerates growth faster
              than dozens of average uploads. Focus on making something worth subscribing for.
            </p>
          </details>

          <details style={{ marginTop: "0.75rem" }}>
            <summary><strong>If I have a small budget, what should I spend it on?</strong></summary>
            <p style={{ marginTop: "0.5rem" }}>
              Thumbnails, editing, or a channel audit will almost always beat buying reach. If you
              do run Promotions, promote your strongest video—not your weakest—and watch retention
              carefully. Stop spending if the numbers tank.
            </p>
          </details>
        </div>
      </section>

      {/* CTA */}
      <div className={s.highlight}>
        <p>
          <strong>Bottom line:</strong> Subscriber services sell a number, not an audience. If you
          want to grow, invest in the work that earns attention. That means better topics, better
          packaging, and giving viewers a reason to stay.
        </p>
        <p style={{ marginTop: "0.5rem" }}>
          Ready to improve? Learn{" "}
          <Link href="/learn/how-to-get-more-subscribers">how to get more subscribers organically</Link>,
          explore{" "}
          <Link href="/learn/youtube-retention-analysis">retention strategies that work</Link>,
          or start with{" "}
          <Link href="/learn/youtube-video-ideas">finding better video ideas</Link>.
        </p>
      </div>
    </>
  );
}
