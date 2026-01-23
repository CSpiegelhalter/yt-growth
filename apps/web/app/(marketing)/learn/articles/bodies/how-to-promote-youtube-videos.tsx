/**
 * Body content for How to Promote YouTube Videos article.
 * Server component - no "use client" directive.
 */

import Link from "next/link";
import type { BodyProps } from "./index";

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* What Promotion Actually Means */}
      <section id="what-promotion-means" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </span>
          What Promotion Actually Means
        </h2>
        <p className={s.sectionText}>
          Promotion has a bad reputation because most people do it wrong. They finish a video,
          drop links in every corner of the internet, and wonder why nothing happens. That
          approach fails because it treats promotion as distribution—getting the video in front
          of eyeballs—when it should be about discovery: helping the right people find something
          they&apos;ll genuinely enjoy.
        </p>
        <p className={s.sectionText}>
          The difference matters. Random eyeballs scroll past. The right viewers click, watch,
          and come back. YouTube notices when a video holds attention and earns engagement, and
          the algorithm responds by showing it to more people. This creates a flywheel: topic
          demand plus strong packaging leads to clicks, clicks lead to watch time, watch time
          triggers recommendations, and recommendations bring more impressions. Promotion feeds
          this flywheel. It does not replace it.
        </p>
        <p className={s.sectionText}>
          Your job is to give good content the initial momentum it needs to prove itself to
          the algorithm. Everything in this guide builds toward that goal.
        </p>
      </section>

      {/* Start Here Navigation */}
      <section id="start-here" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </span>
          Start Here
        </h2>
        <p className={s.sectionText}>
          Promotion happens in three phases. Jump to the one you need:
        </p>
        <ul className={s.list}>
          <li><Link href="#before-publish">Before you publish</Link> — set the video up to win</li>
          <li><Link href="#launch-day">Launch day</Link> — the first 24 hours</li>
          <li><Link href="#after-launch">After launch</Link> — weeks 2–6, keep it alive</li>
        </ul>
      </section>

      {/* Before You Publish */}
      <section id="before-publish" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </span>
          Before You Publish: Set the Video Up to Win
        </h2>
        <p className={s.sectionText}>
          Most promotion failures happen before the video goes live. Driving traffic to a
          poorly packaged video wastes your effort and trains the algorithm that your content
          underperforms. The best promotion is a video that earns clicks and keeps people watching.
        </p>
        <p className={s.sectionText}>
          Start with a topic that has real demand. This does not mean chasing trends you
          don&apos;t care about—it means making content that answers questions people actually ask
          or solves problems they already have. Search YouTube and Google for your topic. If
          similar videos exist and perform well, demand exists. If nothing comes up, you are
          either onto something original or nobody cares. Figure out which before you invest
          hours in production.
        </p>
        <p className={s.sectionText}>
          Packaging comes next: your title and thumbnail work together to earn the click. The
          title should promise a specific outcome or spark curiosity without being vague. The
          thumbnail should be readable at small sizes, with a clear focal point and minimal
          text. Test your thumbnail by shrinking it to mobile size—if you cannot instantly
          understand what the video is about, simplify.
        </p>
        <p className={s.sectionText}>
          Finally, make the video watchable. Front-load the value, cut anything that drags,
          and structure the content so viewers know what they are getting. A strong hook in
          the first 30 seconds determines whether someone stays or bounces. For more on the
          technical side, see our <Link href="/learn/youtube-seo">YouTube SEO guide</Link>, but
          remember: SEO follows from good content, not the other way around.
        </p>
        <div className={s.highlight}>
          <p>
            <strong>Pre-publish sanity check:</strong> Before you hit publish, confirm
            you have a title that earns clicks without lying, a thumbnail that reads at
            small sizes, keywords in your first two description lines, timestamps or chapters
            for longer videos, and end screens pointing to your next best video.
          </p>
        </div>
      </section>

      {/* Launch Day */}
      <section id="launch-day" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 3l14 9-14 9V3z" />
            </svg>
          </span>
          Launch Day: The First 24 Hours
        </h2>
        <p className={s.sectionText}>
          The first day matters more than any other. YouTube watches how your existing audience
          responds, and early signals—click-through rate, watch time, engagement—shape how
          aggressively the algorithm shows your video to new viewers. Your goal is to get your
          best content in front of your warmest audience as quickly as possible.
        </p>
        <p className={s.sectionText}>
          Publish when your audience is online. Check your analytics for the hours when your
          subscribers are most active. Then spend the first hour after upload engaging with
          anyone who shows up. Reply to every comment. Heart the good ones. Ask a question to
          spark discussion. This is not about gaming metrics—it is about signaling to YouTube
          that this video generates conversation, and signaling to viewers that you are present.
        </p>
        <p className={s.sectionText}>
          Community posts are underrated. If you have the community tab unlocked, post a quick
          announcement when the video goes live. It does not need to be elaborate—a still from
          the video, a one-line hook, and a link. This puts the video directly in front of
          subscribers who might miss it in their feed.
        </p>
        <div className={s.highlight}>
          <p>
            <strong>15-minute launch routine:</strong> Publish the video, immediately post
            a community tab announcement, share one native clip or insight on your primary
            social platform (not just a link), reply to every comment in the first hour, and
            pin a comment that adds value or invites discussion. That covers the essentials.
          </p>
        </div>
        <p className={s.sectionText}>
          Resist the urge to post links everywhere. One thoughtful share in the right place
          beats ten links dropped in random forums. If you have a specific community or platform
          where your audience gathers, make that your priority for day one.
        </p>
      </section>

      {/* After Launch */}
      <section id="after-launch" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M2 12h20" />
            </svg>
          </span>
          After Launch: Weeks 2–6
        </h2>
        <p className={s.sectionText}>
          Most creators forget about a video the day after it goes live. This is a mistake.
          Videos on YouTube have long tails—they can pick up momentum weeks or months later
          if you give them reasons to resurface.
        </p>
        <p className={s.sectionText}>
          Check your analytics after a week. Look at click-through rate and average view
          duration. If CTR is low but retention is solid, the packaging is the problem—test
          a new thumbnail or tweak the title. If CTR is decent but people drop off early, the
          content itself needs work, which is harder to fix but worth noting for future videos.
        </p>
        <p className={s.sectionText}>
          Shorts and clips are your rediscovery mechanism. A 30-second vertical clip from a
          longer video can pull new viewers back to the original. Time these strategically:
          a Short posted two weeks after the main video gives it a second life without
          cannibalizing the initial launch. Link to the full video in the Short&apos;s description
          or use a pinned comment.
        </p>
        <p className={s.sectionText}>
          Keep updating descriptions over time. Add chapters if you did not include them
          originally. Link to newer related content. Update timestamps if the video covers
          something that has changed. These small edits keep the video relevant and can
          improve its search performance months after publication.
        </p>
      </section>

      {/* Distribution Channels */}
      <section id="distribution-channels" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17l9.2-9.2M17 17V7H7" />
            </svg>
          </span>
          Distribution Channels That Work
        </h2>
        <p className={s.sectionText}>
          Not all promotion is equal. Some channels consistently drive engaged viewers; others
          waste your time. Work through these in order of leverage—start with what costs
          nothing and already reaches your audience.
        </p>

        <h3 className={s.subheading}>YouTube-Native Distribution</h3>
        <p className={s.sectionText}>
          Your existing library is your distribution network. Every video you have ever
          published can send traffic to your newest one. End screens are the highest-leverage
          tool here: when someone finishes a video, they have already proven they like your
          content. Give them an obvious next step.
        </p>
        <p className={s.sectionText}>
          Playlists keep viewers in your ecosystem longer. Group related videos so autoplay
          works in your favor. Pinned comments let you add context, ask questions, or link
          to related content without cluttering the description. Use them to guide engaged
          viewers to the next thing they should watch.
        </p>
        <div className={s.highlight}>
          <p>
            <strong>The easiest win:</strong> Add an end screen to every video pointing to
            your next best video—not your most recent, but the one most likely to hook someone
            who just watched.
          </p>
        </div>

        <h3 className={s.subheading}>Social Media</h3>
        <p className={s.sectionText}>
          The rule for social media is simple: do not post links. Post a native moment that
          earns the click. Every platform deprioritizes external links because they want users
          to stay. Work with that instead of against it.
        </p>
        <p className={s.sectionText}>
          Create promo assets that stand alone. A 20–40 second vertical clip that delivers
          value by itself, with a hook that makes people want the full version. A text post
          sharing a single strong insight from the video, written to spark conversation. A
          contrarian question that invites debate. Any of these can outperform a link dump
          because they give people a reason to engage before they click.
        </p>
        <p className={s.sectionText}>
          Where you post matters less than how you post. Twitter works if your audience is
          there and you contribute to conversations. TikTok and Instagram Reels work for
          visual content where short clips translate well. LinkedIn works for business and
          educational creators. Reddit works if you genuinely participate in relevant
          communities—otherwise it will backfire. Pick one or two platforms where your
          audience already gathers and commit to doing those well.
        </p>

        <h3 className={s.subheading}>Communities and Repeat Viewers</h3>
        <p className={s.sectionText}>
          Real growth comes from repeat viewers, not one-time clicks. Community building is
          about creating feedback loops: you publish, viewers respond, you respond back, and
          that conversation informs what you make next.
        </p>
        <p className={s.sectionText}>
          The simplest version of this is replying to comments and using community posts to
          stay visible between uploads. Ask what viewers want to see. Run polls. Share
          behind-the-scenes glimpses. These interactions make subscribers feel invested in
          your channel, which makes them more likely to watch, share, and come back.
        </p>
        <p className={s.sectionText}>
          Email lists and Discord servers are optional and only make sense if you already
          have engagement. A Discord with three people feels empty. An email list without
          content feels spammy. Build these once you have an active audience asking for more
          ways to connect—not before.
        </p>

        <h3 className={s.subheading}>Collaborations</h3>
        <p className={s.sectionText}>
          Collaborations let you borrow trust from adjacent creators. When someone else&apos;s
          audience sees you endorsed by a creator they already follow, they are far more likely
          to give you a chance than if they stumbled across you cold.
        </p>
        <p className={s.sectionText}>
          The best collabs involve creators at a similar level with complementary audiences—not
          competitors, but not completely unrelated either. You want their viewers to think,
          &ldquo;If I like this person, I&apos;ll probably like them too.&rdquo; Approach potential
          collaborators by being specific: explain what you have in mind, why it would benefit
          both audiences, and what you bring to the table. Generic &ldquo;let&apos;s collab&rdquo;
          messages get ignored.
        </p>
        <p className={s.sectionText}>
          A good collaboration does not have to be elaborate. Appearing in each other&apos;s videos,
          doing a joint livestream, or simply recommending each other&apos;s content in a genuine
          way all work. The key is authenticity—forced collabs feel off, and audiences can tell.
          To find potential partners, use our{" "}
          <Link href="/learn/youtube-competitor-analysis">guide to competitor analysis</Link>.
        </p>
      </section>

      {/* Paid Promotion */}
      <section id="paid-promotion" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          </span>
          Paid Promotion
        </h2>
        <p className={s.sectionText}>
          Paid promotion can work, but only after organic fundamentals are in place. If your
          content does not convert viewers into subscribers, paying for more viewers just
          means paying for more people who leave. Fix retention and packaging first.
        </p>
        <p className={s.sectionText}>
          Once you have videos that perform well organically, YouTube&apos;s own promotion tools
          are the safest option. In-feed ads put your video in search results and browse feeds
          where interested viewers are already looking. This is closer to legitimate discovery
          than most paid alternatives—you are paying to surface content to people who might
          actually want it, not buying fake engagement.
        </p>
        <p className={s.sectionText}>
          Start with small budgets and measure what happens. Look at subscriber conversion and
          retention for paid traffic versus organic. If paid viewers bounce immediately or never
          come back, you are wasting money. If they stick around at similar rates to organic
          viewers, you may have found a scalable channel.
        </p>
        <div className={s.highlight}>
          <p>
            <strong>Warning:</strong> Never buy fake views, subscribers, or engagement. These
            services violate YouTube&apos;s terms, damage your channel&apos;s standing with the algorithm,
            and provide zero real value. Fake engagement looks good on paper and destroys your
            growth in practice. See our guides on{" "}
            <Link href="/learn/buy-youtube-subscribers">why buying subscribers hurts channels</Link> and{" "}
            <Link href="/learn/buy-youtube-views">the problems with purchased views</Link>.
          </p>
        </div>
      </section>

      {/* Why Promotion Fails */}
      <section id="why-promotion-fails" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M15 9l-6 6M9 9l6 6" />
            </svg>
          </span>
          Why Promotion Fails
        </h2>
        <p className={s.sectionText}>
          Most promotion fails for three reasons, and they are all variations of the same
          mistake: trying to shortcut the flywheel instead of feeding it.
        </p>
        <p className={s.sectionText}>
          First, promoting content that is not ready. If your packaging is weak or your video
          loses people in the first minute, sending more traffic just teaches the algorithm
          that your content underperforms. Promotion amplifies what is already there—it cannot
          fix a bad video.
        </p>
        <p className={s.sectionText}>
          Second, treating every platform like a link dump. Dropping your video URL into forums,
          group chats, and comment sections without adding value gets you ignored at best and
          banned at worst. People can tell when you are using them as a distribution channel
          instead of engaging authentically.
        </p>
        <p className={s.sectionText}>
          Third, inconsistency. Promoting one video hard, then disappearing for weeks, then
          coming back with another burst of activity. Growth comes from compounding small
          efforts over time. The creators who win are not the ones with the best single
          promotion push—they are the ones who show up consistently and build momentum gradually.
        </p>
      </section>

      {/* CTA */}
      <div className={s.highlight}>
        <p>
          <strong>Track what works.</strong> Open YouTube Studio and check your traffic
          sources for each video. See which promotion efforts actually bring engaged viewers—the
          ones who watch, subscribe, and come back. Retention and subscriber conversion tell you
          more than raw views ever will. Feed the flywheel with what works, and stop wasting
          time on what does not.
        </p>
      </div>
    </>
  );
}
