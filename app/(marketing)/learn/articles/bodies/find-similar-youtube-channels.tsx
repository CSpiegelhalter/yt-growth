/**
 * Body content for Find Similar YouTube Channels article.
 * Server component - no "use client" directive.
 */

import Link from "next/link";
import type { BodyProps } from "./index";

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* Hook: What "similar" means */}
      <section id="what-similar-means" className={s.section}>
        <p className={s.sectionText}>
          &quot;Similar channels&quot; sounds simple, but most creators get it wrong. They
          find channels in the same general topic and call it research. That&apos;s not
          enough. A truly similar channel shares your viewer—the same person who
          watches their video would genuinely enjoy yours. They solve the same problem,
          speak to the same frustrations, and often use similar formats and video
          lengths.
        </p>
        <p className={s.sectionText}>
          This distinction matters because YouTube&apos;s algorithm groups channels by
          audience behavior, not by topic tags. If viewers bounce between your channel
          and another, YouTube notices. If they watch both of you in the same session,
          YouTube connects you. Your &quot;similar channels&quot; are the ones already sharing
          your audience—whether you know it or not.
        </p>
        <div className={s.highlight}>
          <p>
            <strong>The real test of similarity:</strong> Could this creator&apos;s best
            video appear in your &quot;suggested videos&quot; sidebar? Would their subscriber
            genuinely enjoy your content? If yes, you&apos;ve found a true peer.
          </p>
        </div>
      </section>

      {/* Mini-nav: Choose your goal */}
      <section id="choose-your-goal" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </span>
          What Do You Need Right Now?
        </h2>
        <p className={s.sectionText}>
          Different goals require different types of &quot;similar&quot; channels. Jump to the
          section that matches your current priority:
        </p>
        <nav className={s.sectionText} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Link href="#find-competitors">
            <strong>Find competitors</strong> — channels at your level to benchmark against
          </Link>
          <Link href="#find-collab-targets">
            <strong>Find collab targets</strong> — creators whose audience would love your content
          </Link>
          <Link href="#turn-research-into-action">
            <strong>Get video ideas</strong> — proven topics and formats you can adapt today
          </Link>
        </nav>
      </section>

      {/* The 3-pass method overview */}
      <section id="three-pass-method" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </span>
          The 3-Pass Method
        </h2>
        <p className={s.sectionText}>
          Finding useful similar channels isn&apos;t about collecting a massive list. It&apos;s
          about finding a short list of the right channels and actually learning from
          them. Here&apos;s the process that works:
        </p>
        <p className={s.sectionText}>
          In <strong>Pass 1</strong>, you cast a wide net to discover candidates. You&apos;ll
          use YouTube&apos;s own features—search filters, suggested videos, and channel tabs—to
          find 15-20 channels that might be relevant. Don&apos;t overthink this step; just
          gather names.
        </p>
        <p className={s.sectionText}>
          In <strong>Pass 2</strong>, you verify which channels are actually similar.
          Most won&apos;t be. You&apos;ll check for audience overlap, topic overlap, and format
          overlap. This step cuts your list down to 5-8 true peers.
        </p>
        <p className={s.sectionText}>
          In <strong>Pass 3</strong>—the part most creators skip—you extract patterns
          you can use immediately. This is where channel research becomes content
          strategy: topics that work, packaging that clicks, formats worth testing,
          and gaps nobody has filled.
        </p>
      </section>

      {/* Pass 1: Find candidates */}
      <section id="find-competitors" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </span>
          Pass 1: Discover Candidates
        </h2>
        <p className={s.sectionText}>
          Start with YouTube itself—it knows more about channel relationships than any
          third-party tool. Open YouTube in an incognito window (so your watch history
          doesn&apos;t bias results) and search for your main topic. Click &quot;Filters,&quot; then
          select &quot;Channel&quot; to see only channel results instead of videos. Scroll through
          and note any channels that cover similar ground to yours.
        </p>
        <p className={s.sectionText}>
          Next, visit a channel you already know is in your space. Click their &quot;Channels&quot;
          tab if they have one visible—creators often feature channels they collaborate
          with or admire. Then watch one of their popular videos and pay attention to
          the sidebar. YouTube&apos;s suggested videos reveal which channels share their
          audience. If you see the same creator appearing in suggestions across multiple
          videos, that&apos;s a strong signal of overlap.
        </p>
        <p className={s.sectionText}>
          Don&apos;t limit yourself to channels your exact size. You want two types: <strong>true
          peers</strong> (channels within 2x of your subscriber count, active in the last month)
          and <strong>aspirational comps</strong> (channels 5-10x your size that started where you
          are now). Peers show you what&apos;s working at your level. Aspirational comps show
          you what&apos;s possible and which paths lead to growth.
        </p>
        <p className={s.sectionText}>
          At the end of this pass, you should have 15-20 channel names. Don&apos;t worry
          about quality yet—that&apos;s what Pass 2 is for.
        </p>
      </section>

      {/* Pass 2: Verify similarity */}
      <section id="find-collab-targets" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          </span>
          Pass 2: Verify Similarity
        </h2>
        <p className={s.sectionText}>
          Now it&apos;s time to separate true peers from channels that just happen to
          exist in the same broad category. Go through your list one by one and ask:
          does this channel actually share my viewer?
        </p>
        <p className={s.sectionText}>
          Open each channel and spend five minutes scanning their recent uploads, their
          most popular videos, and a few comment sections. You&apos;re looking for overlap
          in three areas: topics (do they cover the same specific subjects?), audience
          (do commenters mention similar goals, frustrations, or skill levels?), and
          format (do they use similar video lengths, styles, or structures?).
        </p>
        <p className={s.sectionText}>
          A channel might cover the same broad topic but target a completely different
          audience. A fitness channel for competitive athletes is not similar to a
          fitness channel for busy parents—even though both are &quot;fitness.&quot; Look for
          signals that the same person would watch both channels.
        </p>
        <div className={s.highlight}>
          <p><strong>Quick similarity signals to check:</strong></p>
          <ul className={s.list}>
            <li>Their videos appear in your suggested sidebar (or vice versa)</li>
            <li>Commenters mention watching both of you</li>
            <li>You cover the same specific sub-topics, not just the same category</li>
            <li>Video length and format feel similar to your style</li>
            <li>Their audience&apos;s skill level matches yours (beginner vs. advanced)</li>
          </ul>
        </div>
        <p className={s.sectionText}>
          After this pass, you should have 5-8 channels that genuinely share your
          audience. These are your real competitors—and your best collab targets.
          Channels with overlapping audiences make natural collaboration partners
          because their viewers already have the context to appreciate your content.
        </p>
      </section>

      {/* Pass 3: Turn research into action */}
      <section id="turn-research-into-action" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </span>
          Pass 3: Turn Research Into Action
        </h2>
        <p className={s.sectionText}>
          This is where most creators stop—and where you&apos;ll pull ahead. Finding similar
          channels is useless if you don&apos;t extract patterns you can apply. The goal
          isn&apos;t to copy anyone. It&apos;s to understand what&apos;s already working for your
          shared audience and adapt those insights to your unique perspective.
        </p>
        <p className={s.sectionText}>
          Think of it as stealing the recipe, not the dish. You&apos;re not going to remake
          their video. You&apos;re going to understand why their video worked and use that
          understanding to make something distinctly yours.
        </p>

        <h3 className={s.subheading}>Extract Winning Topics</h3>
        <p className={s.sectionText}>
          Sort each competitor&apos;s channel by &quot;Most Popular&quot; and look at their top 10
          videos. What topics keep appearing? These are proven winners—subjects your
          shared audience demonstrably cares about. Now ask: have you covered this
          topic? Could you cover it better, differently, or more recently?
        </p>
        <p className={s.sectionText}>
          Look for topics that multiple competitors have succeeded with. If three
          different channels in your niche have a hit video about the same subject,
          that&apos;s not a coincidence—it&apos;s a signal. The audience wants this content.
          Your job is to figure out your unique angle.
        </p>

        <h3 className={s.subheading}>Decode Packaging Patterns</h3>
        <p className={s.sectionText}>
          Thumbnails and titles are where clicks happen or don&apos;t. Study your competitors&apos;
          best-performing videos and look for patterns. Do they use faces? Bright
          backgrounds or dark ones? Text on thumbnails or no text? Numbers in titles
          or emotional hooks? Questions or statements?
        </p>
        <p className={s.sectionText}>
          Don&apos;t just note what they do—notice what their audience responds to. A
          competitor might experiment with different styles, but their hits reveal
          what actually works. If their top 5 videos all have close-up faces with
          expressive reactions, that&apos;s data. If their titles all follow a
          &quot;How I [achieved result]&quot; pattern, that&apos;s data too.
        </p>

        <h3 className={s.subheading}>Reverse-Engineer Format Recipes</h3>
        <p className={s.sectionText}>
          Watch one or two top videos from each competitor—not for entertainment, but
          to analyze structure. How do they open? (Hook, context, promise?) How long
          before they deliver the main value? Do they use chapters? How do they handle
          the middle section where retention typically drops? How do they close?
        </p>
        <p className={s.sectionText}>
          Video format is often invisible to casual viewers but obvious once you look.
          Maybe your competitors all front-load value in the first 90 seconds. Maybe
          they use pattern interrupts every 3 minutes. Maybe they always end with a
          specific call-to-action structure. These recipes are transferable.
        </p>

        <h3 className={s.subheading}>Find the Gaps</h3>
        <p className={s.sectionText}>
          The most valuable insight isn&apos;t what competitors do well—it&apos;s what they
          don&apos;t do at all. Read comment sections on their popular videos. What
          questions do viewers ask that never get answered? What do people request
          that competitors ignore? What criticism or confusion keeps appearing?
        </p>
        <p className={s.sectionText}>
          Gaps are opportunities. If every competitor in your niche makes 20-minute
          deep dives, maybe there&apos;s room for 5-minute quick answers. If they all
          target advanced users, maybe beginners are underserved. If nobody updates
          their content when things change, maybe &quot;updated for 2025&quot; is your hook.
        </p>

        <div className={s.highlight}>
          <p><strong>Your immediate next actions:</strong></p>
          <p style={{ marginTop: "0.5rem" }}>
            Before you close this tab, open your notes app and write down three proven
            topics from your competitor research that you haven&apos;t covered yet. Draft
            three title variations for your best topic—test different hooks. Then
            sketch (even roughly) three thumbnail concepts based on the packaging
            patterns that work in your niche. You now have a week&apos;s worth of content
            direction based on real data, not guesswork.
          </p>
        </div>
      </section>

      {/* Optional accelerators */}
      <section id="tools-and-communities" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
            </svg>
          </span>
          Optional Accelerators
        </h2>
        <p className={s.sectionText}>
          Everything above uses free, native YouTube features. If you want to move
          faster, a few tools can help—but they&apos;re accelerators, not requirements.
        </p>
        <p className={s.sectionText}>
          <strong>Social Blade</strong> lets you browse channels by category and sort by
          subscriber count, which makes finding peers at your level faster. <strong>vidIQ</strong> and{" "}
          <strong>TubeBuddy</strong> offer competitor tracking features that surface related
          channels and let you compare metrics side-by-side. Both have free tiers that
          cover the basics.
        </p>
        <p className={s.sectionText}>
          For discovering channels outside YouTube, try searching Reddit or Discord
          for communities in your niche. When people ask &quot;what YouTube channels should
          I watch for [your topic]?&quot;, the answers reveal which creators your audience
          already trusts. You can also simply ask your own audience—a community post
          saying &quot;what other channels do you watch?&quot; often surfaces names you&apos;ve
          never heard of.
        </p>
      </section>

      {/* CTA */}
      <section className={s.section}>
        <p className={s.sectionText}>
          Finding similar channels is the foundation of strategic growth. Once you
          understand who shares your audience and what works for them, you can make
          content decisions based on evidence instead of intuition. For a deeper dive
          into analyzing the channels you&apos;ve found, read our{" "}
          <Link href="/learn/youtube-competitor-analysis">complete competitor analysis guide</Link>.
          When you&apos;re ready to turn competitor insights into your own videos, explore
          our guides on{" "}
          <Link href="/learn/youtube-video-ideas">generating video ideas</Link> and{" "}
          <Link href="/learn/youtube-retention-analysis">improving retention</Link>.
        </p>
        <div className={s.highlight}>
          <p>
            <strong>Start small, go deep.</strong> Five well-chosen similar channels
            will teach you more than fifty random ones. Pick your channels carefully,
            study them thoroughly, and apply what you learn to your next video.
          </p>
        </div>
      </section>
    </>
  );
}
