/**
 * Body content for YouTube Algorithm article.
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
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </span>
          A Quick Mental Model
        </h2>
        <p className={s.sectionText}>
          There is no single &quot;YouTube algorithm.&quot; Instead, YouTube runs multiple
          recommendation systems—one for the homepage, another for suggested videos, another
          for search, and a separate system for Shorts. Each surface has its own logic, but
          they share a common goal: match videos with viewers who will enjoy them.
        </p>
        <p className={s.sectionText}>
          YouTube&apos;s recommendation systems are not trying to reward or punish creators.
          They are trying to solve a prediction problem: given this viewer, right now, which
          video are they most likely to click, watch, and feel satisfied by? When your video
          wins that prediction for a viewer, you get the impression. When enough viewers
          respond positively, you get more impressions.
        </p>
        <p className={s.sectionText}>
          This means &quot;beating the algorithm&quot; is really just another way of saying
          &quot;make videos that viewers want to watch.&quot; The details matter, but the
          fundamental strategy is simple.
        </p>
        <div className={s.highlight}>
          <p>
            <strong>The one-sentence definition:</strong> YouTube recommends the videos it
            believes a specific viewer will click, enjoy, and keep watching.
          </p>
        </div>
      </section>

      {/* Surfaces */}
      <section id="surfaces" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
          </span>
          Where Recommendations Come From
        </h2>
        <p className={s.sectionText}>
          Understanding the four main discovery surfaces helps you think about where your
          videos can get traction—and what each surface rewards.
        </p>

        <h3 className={s.subheading}>Homepage (Browse Features)</h3>
        <p className={s.sectionText}>
          The homepage is personalized for each viewer based on their watch history, so
          two people see completely different recommendations. YouTube surfaces a mix of
          subscribed channels and new discoveries, prioritizing videos that are likely to
          be clicked and watched through. This is often the largest traffic source for
          established channels.
        </p>

        <h3 className={s.subheading}>Suggested Videos</h3>
        <p className={s.sectionText}>
          The suggested sidebar and &quot;up next&quot; queue recommend videos related to
          what a viewer is currently watching. YouTube favors videos that extend the viewing
          session, making this a powerful surface for creators in niches with binge-worthy
          content. Getting suggested alongside popular videos in your space can drive
          significant views.
        </p>

        <h3 className={s.subheading}>Search Results</h3>
        <p className={s.sectionText}>
          Search recommendations match viewer queries with relevant videos. YouTube weighs
          title, description, and actual video content to understand topic relevance, then
          layers in engagement signals. Search is the most controllable surface through{" "}
          <Link href="/learn/youtube-seo">YouTube SEO optimization</Link>, making it valuable
          for tutorials, how-tos, and answer-style content.
        </p>

        <h3 className={s.subheading}>Shorts Feed</h3>
        <p className={s.sectionText}>
          The Shorts algorithm operates separately from long-form recommendations. It
          optimizes for vertical, short-form content and measures engagement through swipes,
          loops, and repeat views. Shorts offer high discovery potential because viewers
          consume many videos per session, giving new creators more opportunities to appear.
        </p>
      </section>

      {/* Ranking Factors */}
      <section id="ranking-factors" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </span>
          What YouTube Measures
        </h2>
        <p className={s.sectionText}>
          Think of YouTube&apos;s ranking factors as a funnel with three stages: packaging,
          content, and outcomes. Each stage feeds into the next, and weakness at any stage
          limits your reach.
        </p>

        <h3 className={s.subheading}>Stage 1: Packaging (Impressions → Clicks)</h3>
        <p className={s.sectionText}>
          Before anyone watches your video, YouTube tests whether viewers will click on it.
          Your thumbnail and title work together to earn clicks from the impressions YouTube
          gives you. Click-through rate (CTR) measures this—how often viewers click when shown
          your video. A compelling package gets more clicks from the same impressions, which
          signals to YouTube that more viewers should see it.
        </p>

        <h3 className={s.subheading}>Stage 2: Content (Retention and Watch Time)</h3>
        <p className={s.sectionText}>
          Once viewers click, YouTube measures whether they actually watch. Average view
          duration and <Link href="/learn/youtube-retention-analysis">retention curves</Link>{" "}
          reveal whether your content delivers on the promise your packaging made. A video
          that hooks viewers and keeps them watching demonstrates quality. Total watch time
          accumulates as more viewers stay longer, compounding your reach.
        </p>

        <h3 className={s.subheading}>Stage 3: Outcomes (Satisfaction and Session Behavior)</h3>
        <p className={s.sectionText}>
          The final stage measures what happens after viewers watch. Do they subscribe, like,
          comment, or share? Do they keep watching more YouTube, or do they leave? Videos that
          spark engagement and extend viewing sessions signal satisfaction. Videos that end
          sessions or generate negative feedback signal the opposite.
        </p>

        <p className={s.sectionText}>
          These stages interact. A video with a great thumbnail but poor retention will get
          initial clicks but fade quickly. A video with great content but weak packaging
          never gets the chance to prove itself. You need all three stages working together.
        </p>

        <ul className={s.list}>
          <li><strong>CTR:</strong> Are viewers clicking when they see your thumbnail?</li>
          <li><strong>Average view duration:</strong> How long do viewers actually watch?</li>
          <li><strong>Subscribers per video:</strong> Does your content earn followers?</li>
          <li><strong>Returning viewers:</strong> Do people come back to watch more?</li>
          <li><strong>Session continuation:</strong> Do viewers keep watching YouTube after?</li>
        </ul>
      </section>

      {/* Viewer Satisfaction */}
      <section id="viewer-satisfaction" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </span>
          Satisfaction Beats Tricks
        </h2>
        <p className={s.sectionText}>
          Raw metrics like clicks and watch time can be gamed in the short term, so YouTube
          also tries to measure genuine viewer satisfaction. This is where manipulative
          tactics backfire and quality content wins.
        </p>
        <p className={s.sectionText}>
          YouTube looks at signals like whether viewers return to a channel, whether they
          subscribe after watching, and whether they share videos with others. These behaviors
          are hard to fake and strongly indicate that viewers actually valued the content.
          Over time, channels that generate these satisfaction signals get more favorable
          treatment in recommendations.
        </p>
        <div className={s.highlight}>
          <p>
            <strong>The clickbait tax:</strong> When your title and thumbnail promise something
            your video does not deliver, viewers click—then leave quickly. YouTube sees this
            pattern and reduces your impressions. The initial spike in CTR becomes a long-term
            penalty. Misleading packaging costs more than it earns.
          </p>
        </div>
        <p className={s.sectionText}>
          <strong>Does YouTube use surveys?</strong> Yes. YouTube occasionally asks viewers
          directly whether they were satisfied with a video. These survey responses are one
          input among many, helping YouTube calibrate its prediction models. You cannot see
          this data, and YouTube has not revealed how heavily it weighs surveys, but it is
          real. Think of it as another reason to prioritize genuine viewer satisfaction over
          metric manipulation.
        </p>
      </section>

      {/* Myths */}
      <section id="myths" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M15 9l-6 6M9 9l6 6" />
            </svg>
          </span>
          Myths Worth Busting
        </h2>
        <p className={s.sectionText}>
          The YouTube creator community circulates a lot of advice, and some of it is
          outdated or simply wrong. Here are the myths that waste the most creator time.
        </p>

        <h3 className={s.subheading}>Posting time is critical</h3>
        <p className={s.sectionText}>
          YouTube surfaces videos over days and weeks, not just at the moment of upload.
          A video posted at 3am can still reach viewers at peak hours because YouTube
          shows it when relevant viewers are online. Posting when your audience is active
          may give a slight initial boost, but it is not a major ranking factor.
        </p>

        <h3 className={s.subheading}>Longer videos rank better</h3>
        <p className={s.sectionText}>
          YouTube cares about watch time, which leads some creators to artificially pad
          their videos. But retention matters more than length. A focused 8-minute video
          that viewers watch to the end outperforms a bloated 20-minute video where half
          the audience drops off. Match your length to your content, not an arbitrary target.
        </p>

        <h3 className={s.subheading}>Tags drive discovery</h3>
        <p className={s.sectionText}>
          Tags have minimal impact on modern YouTube. The platform uses title, description,
          and actual video content (via speech recognition and visual analysis) to understand
          topics. Spending hours on tags is wasted effort—30 seconds is enough.
        </p>

        <h3 className={s.subheading}>The algorithm suppresses small channels</h3>
        <p className={s.sectionText}>
          YouTube does not penalize small channels. However, new channels lack the watch
          history data that helps YouTube understand their audience. As you publish more
          and build a viewer base, YouTube learns who enjoys your content and can recommend
          it more effectively. Growth often accelerates after this learning period.
        </p>

        <h3 className={s.subheading}>Daily posting is necessary</h3>
        <p className={s.sectionText}>
          Consistency matters more than frequency. A creator posting one great video per
          week often outperforms someone posting daily mediocre content. Find a schedule
          you can sustain without sacrificing quality, and stick to it. The algorithm
          does not punish you for posting less often—it punishes you for posting content
          viewers do not want to watch.
        </p>
      </section>

      {/* Optimization */}
      <section id="optimization" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </span>
          What to Do This Week
        </h2>
        <p className={s.sectionText}>
          Understanding the algorithm is only useful if it changes what you do. Here is a
          practical framework for improving your recommendations over time.
        </p>

        <h3 className={s.subheading}>Improve Your Packaging</h3>
        <p className={s.sectionText}>
          Your thumbnail is the most important image you create. Study thumbnails in your
          niche that earn high CTR and reverse-engineer what makes them work—usually clarity,
          contrast, emotion, and curiosity. Pair thumbnails with titles that complement rather
          than duplicate: the thumbnail shows, the title tells. Test variations and track which
          combinations perform best. This is the highest-leverage work most creators underinvest in.
        </p>

        <h3 className={s.subheading}>Improve Your Retention</h3>
        <p className={s.sectionText}>
          Open YouTube Studio and look at your{" "}
          <Link href="/learn/youtube-retention-analysis">retention graphs</Link>. Where do
          viewers drop off? The first 30 seconds usually determine whether someone stays or
          leaves, so lead with your most compelling content—not a lengthy intro. Throughout
          the video, cut anything that does not earn its runtime. Pattern interrupts
          (changes in pacing, visuals, or energy) help maintain attention. End with something
          worth staying for.
        </p>

        <h3 className={s.subheading}>Improve the Next-Video Path</h3>
        <p className={s.sectionText}>
          After someone watches your video, YouTube wants to know where to send them next.
          Make that decision easy by linking to related content. Use end screens to feature
          your most relevant video. Mention other videos naturally when the topic connects.
          Organize videos into playlists that create viewing sessions. When YouTube can
          confidently recommend another of your videos, you capture more of the session.
        </p>

        <p className={s.sectionText}>
          Here is a simple loop you can repeat each week to steadily improve your performance:
        </p>
        <ol className={s.list}>
          <li>Review your last video&apos;s CTR, retention, and traffic sources in YouTube Studio.</li>
          <li>Identify one specific weakness (weak CTR? early drop-off? no suggested traffic?).</li>
          <li>Plan one change to address it in your next video.</li>
          <li>Publish and observe whether the change moved the metric.</li>
          <li>Keep what worked, iterate on what did not, repeat.</li>
        </ol>
      </section>

      {/* What Doesn't Work */}
      <section id="what-doesnt-work" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </span>
          What Does Not Work
        </h2>
        <p className={s.sectionText}>
          Some tactics that seem clever actually hurt your channel. YouTube&apos;s systems
          have seen every trick, and the platform actively penalizes manipulation. Avoid
          these common mistakes:
        </p>
        <ul className={s.list}>
          <li><strong>Buying views or subscribers:</strong> Fake engagement tanks your metrics and violates policies.</li>
          <li><strong>Sub4sub schemes:</strong> Creates dead subscribers who never watch, hurting your ratios.</li>
          <li><strong>Misleading thumbnails:</strong> Earns clicks but destroys retention and satisfaction.</li>
          <li><strong>Artificially inflating watch time:</strong> YouTube detects abnormal patterns.</li>
          <li><strong>Keyword stuffing:</strong> Hurts readability without improving ranking.</li>
        </ul>
        <div className={s.highlight}>
          <p>
            The common thread: these tactics try to fake signals instead of earning them.
            YouTube&apos;s recommendation systems are built to find videos viewers genuinely
            want to watch. Manipulation creates a mismatch between your signals and your
            actual viewer value, and that mismatch eventually catches up with you.
          </p>
        </div>
      </section>

      {/* CTA */}
      <div className={s.highlight}>
        <p>
          <strong>You cannot control the algorithm—but you control your content.</strong> Every
          video is a chance to improve your packaging, tighten your retention, and build the
          library that makes YouTube recommend you. The creators who win are not the ones who
          found a secret hack. They are the ones who got slightly better at making videos people
          want to watch, over and over, until the numbers compounded. Start with your next video.
        </p>
      </div>
    </>
  );
}
