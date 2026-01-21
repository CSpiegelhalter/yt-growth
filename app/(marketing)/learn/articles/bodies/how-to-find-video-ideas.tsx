/**
 * Body content for How to Find Video Ideas article.
 * Server component - no "use client" directive.
 */

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import type { BodyProps } from "./index";

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* The Research Mindset */}
      <section id="research-mindset" className={s.section}>
        <h2 className={s.sectionTitle}>The Research Mindset</h2>
        <p className={s.sectionText}>
          Most creators approach video ideas backwards. They sit down, try to
          think of something interesting, and hope it resonates. This works
          occasionally but fails consistently. A better approach treats idea
          finding as research—a process with methods, signals, and repeatable
          steps.
        </p>
        <p className={s.sectionText}>
          The shift is subtle but significant. Instead of asking &ldquo;what do
          I want to make?&rdquo; you ask &ldquo;what do viewers already want
          that I can deliver?&rdquo; This does not mean abandoning your
          interests. It means finding the overlap between what excites you and
          what has demonstrated audience demand.
        </p>
        <p className={s.sectionText}>
          Research does not replace creativity. It focuses creativity on
          fertile ground. When you know a topic has an audience, your energy
          goes into execution rather than hoping anyone cares.
        </p>
      </section>

      {/* Recognizing Demand Signals */}
      <section id="demand-signals" className={s.section}>
        <h2 className={s.sectionTitle}>Recognizing Demand Signals</h2>
        <p className={s.sectionText}>
          Before diving into specific research methods, learn to recognize what
          demand looks like. Not every signal is obvious, and some apparent
          signals are misleading.
        </p>

        <h3 className={s.subheading}>Strong Demand Signals</h3>
        <p className={s.sectionText}>
          <strong>Multiple channels, similar results.</strong> When three or
          more channels in your niche have above-average performance on the same
          topic, that is not coincidence. The topic has proven pull regardless
          of the specific creator.
        </p>
        <p className={s.sectionText}>
          <strong>Consistent search suggestions.</strong> YouTube autocomplete
          reflects real searches. If a query consistently appears across related
          seed terms, people are actively looking for that content.
        </p>
        <p className={s.sectionText}>
          <strong>High engagement relative to views.</strong> Videos where
          viewers comment with questions, share experiences, or debate points
          indicate genuine interest—not just passive watching.
        </p>
        <p className={s.sectionText}>
          <strong>Recurring questions.</strong> When the same question appears
          in comments across multiple videos, it represents unmet demand. Viewers
          are looking for something the existing videos do not fully provide.
        </p>

        <h3 className={s.subheading}>Weak or Misleading Signals</h3>
        <p className={s.sectionText}>
          <strong>One viral video.</strong> A single outlier could be luck,
          timing, or thumbnail magic unrelated to the topic itself. Look for
          patterns across multiple videos.
        </p>
        <p className={s.sectionText}>
          <strong>High views from mega-channels only.</strong> If only creators
          with millions of subscribers succeed on a topic, the views might come
          from their audience rather than topic demand. Can smaller channels
          get traction?
        </p>
        <p className={s.sectionText}>
          <strong>Your own enthusiasm alone.</strong> Passion matters, but it is
          not evidence of audience demand. Validate even topics you love before
          committing production resources.
        </p>
      </section>

      {/* Mining Competitor Channels */}
      <section id="competitor-mining" className={s.section}>
        <h2 className={s.sectionTitle}>Mining Competitor Channels</h2>
        <p className={s.sectionText}>
          Other creators have already run experiments for you. Their video
          performance is public data. Your job is to extract insights from
          that data without simply copying their work.
        </p>

        <h3 className={s.subheading}>Building Your Research List</h3>
        <p className={s.sectionText}>
          Start with 8 to 12 channels in or adjacent to your niche. Include a
          range of sizes—some larger than you, some similar, some smaller but
          growing. Each size offers different insights. Larger channels show
          what topics have broad appeal. Similar-sized channels show what is
          achievable for you now. Smaller but growing channels show what is
          currently working for newcomers.
        </p>

        <h3 className={s.subheading}>Finding Outliers</h3>
        <p className={s.sectionText}>
          For each channel, visit their Videos tab and sort by Most Popular.
          Note their typical view count—what is normal for this channel? Then
          look for videos that significantly exceed that average. A video with
          3x or 5x typical views is an outlier worth examining.
        </p>
        <p className={s.sectionText}>
          When you find an outlier, ask: What made this one different? Sometimes
          it is the topic itself. Sometimes it is the angle, the title framing,
          or the thumbnail approach. Sometimes it is timing—they caught a trend
          early. Understanding why matters as much as noting what.
        </p>

        <h3 className={s.subheading}>Recent vs. All-Time</h3>
        <p className={s.sectionText}>
          All-time popular videos show evergreen topics with lasting appeal.
          Recent outliers (last 3 to 6 months) show current demand. Both matter.
          Evergreen topics are safer long-term bets. Recent hits might indicate
          emerging trends or shifts in viewer interest. Check both views.
        </p>

        <h3 className={s.subheading}>Reading the Patterns</h3>
        <p className={s.sectionText}>
          After reviewing 8 to 12 channels, step back and look for patterns.
          Which topics appear as outliers across multiple channels? Which
          formats consistently perform? Which angles get traction? These
          cross-channel patterns are more reliable than any single video&apos;s
          performance.
        </p>
        <p className={s.sectionText}>
          For a deeper process on competitive research, see our{" "}
          <Link href="/learn/youtube-competitor-analysis">
            competitor analysis guide
          </Link>.
        </p>
      </section>

      {/* YouTube Search as Research */}
      <section id="search-research" className={s.section}>
        <h2 className={s.sectionTitle}>YouTube Search as a Research Tool</h2>
        <p className={s.sectionText}>
          YouTube&apos;s search autocomplete is a window into actual viewer
          queries. People type these exact phrases looking for content. This is
          not speculation about what viewers might want—it is evidence of what
          they actively seek.
        </p>

        <h3 className={s.subheading}>The Basic Technique</h3>
        <p className={s.sectionText}>
          Open YouTube in an incognito window to avoid personalization
          skewing your results. Type a broad topic related to your niche but
          stop before hitting enter. Watch what autocomplete suggests. These
          suggestions are ordered by search volume—the top suggestions get
          more searches.
        </p>
        <p className={s.sectionText}>
          Write down the suggestions that surprise you or that you have not
          considered. Then try variations: add &ldquo;how to&rdquo; before your
          topic, or &ldquo;for beginners&rdquo; after it. Each variation reveals
          different queries.
        </p>

        <h3 className={s.subheading}>The Alphabet Technique</h3>
        <p className={s.sectionText}>
          Type your topic followed by a space and a letter. Start with
          &ldquo;a&rdquo; and work through the alphabet. Each letter triggers
          different autocomplete suggestions. This systematic approach surfaces
          queries you would never think to check directly. It is tedious but
          reveals hidden pockets of demand.
        </p>

        <h3 className={s.subheading}>Evaluating Search Results</h3>
        <p className={s.sectionText}>
          After noting a promising query, search for it and examine the results.
          How many videos exist on this topic? How old are the top results?
          What view counts do they have? Old videos with high views suggest
          evergreen demand. Few results suggest opportunity—or possibly lack of
          interest. High-view recent videos suggest active current demand.
        </p>
        <p className={s.sectionText}>
          Pay attention to the quality of existing results. If the top videos
          are mediocre, dated, or incomplete, you have an opportunity to
          provide something better. If the results are excellent and
          comprehensive, you need a strong differentiator to compete.
        </p>
      </section>

      {/* Comment Section Hunting */}
      <section id="comment-hunting" className={s.section}>
        <h2 className={s.sectionTitle}>Comment Section Hunting</h2>
        <p className={s.sectionText}>
          Comments are underrated as a research source. Viewers explicitly tell
          creators what they want, ask questions that reveal knowledge gaps,
          and request follow-up content. Most creators never read competitor
          comments—which means this is an advantage if you do.
        </p>

        <h3 className={s.subheading}>What to Look For</h3>
        <p className={s.sectionText}>
          <strong>Questions that go unanswered.</strong> When viewers ask
          questions in comments that the video did not cover, they are
          identifying gaps. Multiple questions on the same point indicate
          significant demand.
        </p>
        <p className={s.sectionText}>
          <strong>Requests for more depth.</strong> Comments like &ldquo;I wish
          you went deeper on X&rdquo; or &ldquo;Can you do a full video about
          Y?&rdquo; are explicit requests. These viewers want content that does
          not exist yet—or does not exist in a form that satisfies them.
        </p>
        <p className={s.sectionText}>
          <strong>Confusion or misconceptions.</strong> When viewers express
          confusion or share wrong information in comments, it signals an
          opportunity to provide clarity. Educational content that corrects
          common misconceptions has built-in appeal.
        </p>
        <p className={s.sectionText}>
          <strong>Personal stories that need addressing.</strong> Sometimes
          viewers share their specific situations: &ldquo;I tried this but
          my situation is different because...&rdquo; These variations
          represent potential sub-topics or specialized angles.
        </p>

        <h3 className={s.subheading}>Efficient Comment Mining</h3>
        <p className={s.sectionText}>
          You cannot read every comment on every video. Be strategic. Focus on
          high-performing videos in your niche—videos that got lots of views
          and engagement. Sort comments by &ldquo;Top&rdquo; first to see what
          resonated most. Spend 10 to 15 minutes per session, not hours. Keep
          a running note of ideas and questions you discover.
        </p>
      </section>

      {/* Borrowing from Adjacent Niches */}
      <section id="adjacent-niches" className={s.section}>
        <h2 className={s.sectionTitle}>Borrowing from Adjacent Niches</h2>
        <p className={s.sectionText}>
          Some of the best video ideas come from outside your immediate niche.
          Formats, angles, and approaches that work in related spaces often
          translate well—and your audience may never have seen them applied to
          your topic.
        </p>

        <h3 className={s.subheading}>Finding Adjacent Niches</h3>
        <p className={s.sectionText}>
          Adjacent niches share audience overlap or content similarity without
          being direct competition. A personal finance channel might look at
          productivity content, career advice, or entrepreneurship. A cooking
          channel might look at food science, nutrition, or travel food content.
          Think about what else your viewers watch.
        </p>

        <h3 className={s.subheading}>What to Borrow</h3>
        <p className={s.sectionText}>
          <strong>Formats that perform.</strong> If &ldquo;day in the
          life&rdquo; videos crush in a related niche but nobody in your niche
          does them, you might have an opportunity. Same with challenges,
          reviews, comparisons, or behind-the-scenes content.
        </p>
        <p className={s.sectionText}>
          <strong>Title and thumbnail patterns.</strong> Packaging techniques
          often transfer across niches. A title structure that creates
          curiosity in tech content might work equally well for fitness content.
          Borrow the principle, adapt the specifics.
        </p>
        <p className={s.sectionText}>
          <strong>Topic angles.</strong> How do creators in adjacent niches
          approach similar themes? A different framing or perspective might
          give you a fresh angle on a familiar topic in your space.
        </p>

        <h3 className={s.subheading}>Avoiding Failed Transplants</h3>
        <p className={s.sectionText}>
          Not everything transfers well. Before committing to an idea borrowed
          from another niche, ask: Does my audience have the same underlying
          need? Will this format feel natural for my content? Has anyone else
          in my niche tried this—and if so, how did it perform? Borrowed ideas
          still need validation.
        </p>
      </section>

      {/* Evaluating What You Find */}
      <section id="idea-evaluation" className={s.section}>
        <h2 className={s.sectionTitle}>Evaluating What You Find</h2>
        <p className={s.sectionText}>
          Research generates candidates. Not every candidate becomes a video.
          You need a way to filter and prioritize what you discover. Evaluation
          turns a messy list of possibilities into a focused backlog of
          validated ideas.
        </p>

        <h3 className={s.subheading}>The Three-Filter Test</h3>
        <p className={s.sectionText}>
          <strong>Filter 1: Demand evidence.</strong> What suggests viewers want
          this? Multiple competitor outliers on the topic? High search volume?
          Repeated questions in comments? The more evidence sources, the
          stronger the signal.
        </p>
        <p className={s.sectionText}>
          <strong>Filter 2: Capability fit.</strong> Can you actually deliver on
          this topic? Do you have the knowledge, experience, or perspective to
          create something valuable? If not, can you acquire it in reasonable
          time? Ideas outside your capability are not ideas—they are fantasies.
        </p>
        <p className={s.sectionText}>
          <strong>Filter 3: Differentiation potential.</strong> What would make
          your version worth watching over what exists? Better depth? Different
          angle? Updated information? Personal experience? If you cannot
          articulate your edge, the idea needs more development or should be
          dropped.
        </p>

        <h3 className={s.subheading}>Quick Scoring</h3>
        <p className={s.sectionText}>
          For each candidate idea, score it 1 to 3 on each filter. Ideas that
          score high across all three go to your active backlog. Ideas that
          score high on one or two go to a &ldquo;maybe later&rdquo; list. Ideas
          that score low everywhere get cut. This is not science—it is a
          structured way to think through your options quickly.
        </p>
      </section>

      {/* Building a Research System */}
      <section id="research-system" className={s.section}>
        <h2 className={s.sectionTitle}>Building a Research System</h2>
        <p className={s.sectionText}>
          One-off research sessions help. A consistent system transforms your
          content strategy. The goal is to make idea research a sustainable
          habit that keeps your backlog healthy without consuming excessive
          time.
        </p>

        <h3 className={s.subheading}>The Weekly Research Rhythm</h3>
        <p className={s.sectionText}>
          Set aside 20 to 30 minutes weekly for idea research. Same day, same
          time works best—it becomes automatic. During this session, rotate
          through your research methods: one week focus on competitor mining,
          the next on search research, the next on comment hunting. Rotation
          prevents staleness and ensures you are drawing from multiple sources.
        </p>

        <h3 className={s.subheading}>Capturing What You Find</h3>
        <p className={s.sectionText}>
          Have a consistent place to store ideas. A simple document or
          spreadsheet works. For each idea, note: the topic, the evidence of
          demand (where you found it), your initial angle, and the date added.
          Ideas without context get forgotten or lose meaning over time.
        </p>

        <h3 className={s.subheading}>Regular Review</h3>
        <p className={s.sectionText}>
          Once a month, review your full backlog. Remove ideas that no longer
          excite you or seem relevant. Re-evaluate ideas that have aged—has the
          landscape changed? Promote strong candidates to &ldquo;ready to
          film&rdquo; status. Demote weak ones. A living backlog requires
          maintenance.
        </p>

        <h3 className={s.subheading}>Tracking Results</h3>
        <p className={s.sectionText}>
          After publishing videos, track which research-sourced ideas performed
          well and which missed. Over time, you will learn which research
          methods surface your best ideas and which sources to weight more
          heavily. Your system should evolve based on what actually works for
          your channel.
        </p>
      </section>

      {/* Common Research Traps */}
      <section id="common-traps" className={s.section}>
        <h2 className={s.sectionTitle}>Common Research Traps</h2>
        <p className={s.sectionText}>
          Research can go wrong in predictable ways. Recognizing these traps
          helps you avoid them.
        </p>

        <p className={s.sectionText}>
          <strong>Analysis paralysis.</strong> Research should inform action,
          not replace it. If you spend more time researching than creating, the
          ratio is off. Set time limits on research sessions and commit to
          decisions even with imperfect information. Good enough ideas executed
          well beat perfect ideas that never get made.
        </p>
        <p className={s.sectionText}>
          <strong>Copying instead of learning.</strong> Research reveals
          patterns and opportunities, not scripts to follow. If your video
          would be essentially the same as an existing one, you are copying.
          If you are applying principles to create something with your own
          perspective and value, you are learning. There is a difference.
        </p>
        <p className={s.sectionText}>
          <strong>Chasing every trend.</strong> Not every trending topic fits
          your channel. Research should filter as much as it discovers. A trend
          that does not match your audience, expertise, or channel direction is
          not an opportunity for you—even if it is blowing up elsewhere.
        </p>
        <p className={s.sectionText}>
          <strong>Ignoring your own data.</strong> External research is
          valuable, but do not overlook what your own channel tells you. Your
          analytics reveal what your specific audience responds to. Combine
          external research with internal data for the most reliable signals.
        </p>
        <p className={s.sectionText}>
          <strong>Overweighting recency.</strong> Recent trends are exciting but
          ephemeral. Balance trending topics with evergreen ideas that will
          still be relevant months or years from now. A healthy backlog
          includes both.
        </p>
      </section>

      {/* CTA */}
      <div className={s.highlight}>
        <p>
          <strong>Research meets action.</strong> {BRAND.name} helps you find
          video ideas by analyzing what is working in your niche. See trending
          topics, competitor outliers, and gaps in your content—all in one
          place. Turn research into results.
        </p>
      </div>
    </>
  );
}
