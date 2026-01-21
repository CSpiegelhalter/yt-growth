/**
 * Body content for YouTube Retention Analysis article.
 * Server component - no "use client" directive.
 * Significantly expanded for better text-to-HTML ratio and SEO.
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </span>
          Why Retention Matters for YouTube Growth
        </h2>
        <p className={s.sectionText}>
          Audience retention is arguably the single most important metric for YouTube growth in 2026. It directly affects how the algorithm promotes your videos. When viewers watch a large percentage of your video, YouTube interprets this as a strong signal that your content is valuable. The result: more impressions, better placement in suggested videos, and ultimately more views and subscribers.
        </p>
        <p className={s.sectionText}>
          YouTube&apos;s recommendation system is designed to keep people on the platform. If your videos consistently keep viewers watching, YouTube will show your content to more people. This creates a compounding effect: better retention leads to more reach, which leads to more potential viewers, which leads to more subscribers. The opposite is also true—low retention means YouTube will stop promoting your videos.
        </p>
        <div className={s.statsGrid}>
          <div className={s.stat}>
            <div className={s.statValue}>50%+</div>
            <div className={s.statLabel}>Good Retention Target</div>
          </div>
          <div className={s.stat}>
            <div className={s.statValue}>30 sec</div>
            <div className={s.statLabel}>Critical Hook Window</div>
          </div>
          <div className={s.stat}>
            <div className={s.statValue}>2-3×</div>
            <div className={s.statLabel}>More Views with Better Retention</div>
          </div>
        </div>
        <p className={s.sectionText}>
          Many creators obsess over subscriber counts and view counts, but retention is the metric that actually determines whether those numbers grow. A video with 1,000 views and 60% retention will often outperform a video with 10,000 views and 20% retention in the long run—because YouTube will continue promoting the first video while suppressing the second.
        </p>
      </section>

      {/* Reading Retention Curves */}
      <section id="reading-curves" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </span>
          How to Read Retention Curves
        </h2>
        <p className={s.sectionText}>
          YouTube Studio shows your retention graph as a line that starts at 100% and decreases over time. Understanding how to interpret this graph is the first step to improving your videos. Here&apos;s what different patterns mean and what they tell you about your content:
        </p>
        <ul className={s.list}>
          <li><strong>Steep initial drop (0 to 30 seconds):</strong> Your hook isn&apos;t compelling enough, or your content doesn&apos;t match the promise in your title and thumbnail. Viewers clicked expecting one thing and got something different. This is the most common and most damaging retention problem.</li>
          <li><strong>Gradual, steady decline:</strong> This is actually normal and healthy behavior. All videos lose viewers over time. A slow, consistent decline means your content is engaging. Don&apos;t panic if your line goes down—it&apos;s only a problem if it drops too fast or too steeply.</li>
          <li><strong>Sharp mid-video drops (cliffs):</strong> A sudden drop at a specific timestamp indicates a specific section that&apos;s boring, confusing, or off-topic. Viewers are consciously deciding to leave. You need to review that exact section and restructure or remove it.</li>
          <li><strong>Spikes above 100%:</strong> When your retention goes above 100%, it means viewers are rewatching that section. This is valuable data—whatever you did there resonated strongly. Study these moments and replicate them in future videos.</li>
          <li><strong>Cliff at the end:</strong> A steep drop in the last 10-20% of your video is completely normal. Viewers leave before end screens and outros. Don&apos;t try to fix this—it&apos;s expected behavior.</li>
        </ul>
        <h3 className={s.subheading}>Finding Your Retention Graph in YouTube Studio</h3>
        <p className={s.sectionText}>
          To access your retention data, open YouTube Studio, click on a specific video, then go to Analytics. Select the Engagement tab, and you&apos;ll see your audience retention graph. You can also access this from the main Analytics section by clicking on any video. Compare retention across multiple videos to identify patterns in what keeps your specific audience engaged.
        </p>
      </section>

      {/* Drop-Off Patterns */}
      <section id="drop-off-patterns" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </span>
          Common Drop-Off Patterns and How to Fix Them
        </h2>
        <p className={s.sectionText}>
          After analyzing thousands of retention curves, certain patterns emerge repeatedly. Each pattern has specific causes and specific fixes. Here are the most common drop-off patterns and exactly how to address them:
        </p>
        <ol className={s.numberedList}>
          <li>
            <strong>The Early Exit (0 to 30 seconds)</strong><br />
            Viewers click away immediately after the video starts. This usually means your hook doesn&apos;t grab attention, your intro is too slow, or your content doesn&apos;t match what viewers expected from the title and thumbnail. Fix: Start with your strongest hook in the first 5 seconds. State what viewers will learn or experience. Cut any &quot;hey guys, welcome back to my channel&quot; type intros—they kill retention.
          </li>
          <li>
            <strong>The Intro Death (30 to 60 seconds)</strong><br />
            Viewers make it past the initial hook but leave during a long intro or background explanation. This happens when creators spend too much time on setup before delivering value. Fix: Get to the main content within 30 seconds. If you need context, weave it into the content rather than front-loading it. Use &quot;just-in-time&quot; explanations—give information right before it becomes relevant.
          </li>
          <li>
            <strong>The Mid-Video Cliff</strong><br />
            A sharp, sudden drop at a specific timestamp indicates a particular segment is causing viewers to leave. Common causes: tangential content, confusing explanations, drop in energy, or a section that doesn&apos;t match the video&apos;s promise. Fix: Review the exact timestamp where the drop occurs. Watch 30 seconds before and after. Ask: what changed? Then either cut that section, restructure it, or replace it with more engaging content.
          </li>
          <li>
            <strong>The Slow Bleed</strong><br />
            Gradual but consistent decline throughout the video, with no specific drop-off point. This often indicates the video lacks variety or the pacing is too monotonous. Viewers aren&apos;t leaving at any particular moment—they&apos;re just gradually losing interest. Fix: Add pattern interrupts every 30-60 seconds (more on this below). Vary your pacing, visuals, and energy. Give viewers micro-reasons to keep watching throughout.
          </li>
          <li>
            <strong>The Premature End</strong><br />
            A significant portion of viewers leave before the video ends, often missing the main payoff or conclusion. This happens when videos are too long for their content, or when viewers believe they&apos;ve gotten what they came for. Fix: Deliver your main value earlier in the video. Use open loops to tease what&apos;s coming. If the best part of your video is at the end, consider restructuring to move it earlier or create anticipation throughout.
          </li>
        </ol>
      </section>

      {/* Hook Frameworks */}
      <section id="hook-frameworks" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 0112.728 0" />
            </svg>
          </span>
          Hook Frameworks That Keep Viewers Watching
        </h2>
        <p className={s.sectionText}>
          The first 30 seconds of your video determine whether viewers stay or leave. A strong hook creates curiosity, establishes relevance, and gives viewers a reason to invest their time. Here are proven hook frameworks you can adapt for any niche:
        </p>
        <ul className={s.twoColList}>
          <li>
            <strong>The Problem-Solution Hook</strong>
            Start by articulating a problem your viewer has, then promise to solve it. Example: &quot;If your YouTube videos aren&apos;t getting views, you&apos;re probably making one of these three mistakes. Let me show you how to fix them.&quot;
          </li>
          <li>
            <strong>The Curiosity Gap</strong>
            Open with an intriguing statement or question that viewers can&apos;t answer without watching. Example: &quot;I increased my retention by 40% with one simple change that took 5 minutes.&quot; Then deliver the answer.
          </li>
          <li>
            <strong>The Result Tease</strong>
            Show the end result upfront, then explain how you got there. Works especially well for tutorials and transformations. Example: &quot;This video went viral with 500K views. Here&apos;s exactly what I did differently.&quot;
          </li>
          <li>
            <strong>The Contrarian Statement</strong>
            Challenge a commonly held belief to grab attention. Example: &quot;Everything you&apos;ve been told about YouTube SEO is wrong. Here&apos;s what actually matters.&quot; Make sure you can back up the claim.
          </li>
          <li>
            <strong>The Stakes Setup</strong>
            Explain what viewers will gain by watching or lose by not watching. Example: &quot;If you don&apos;t understand retention analysis, you&apos;re leaving thousands of views on the table.&quot;
          </li>
          <li>
            <strong>The Direct Promise</strong>
            Sometimes simple works best. Tell viewers exactly what they&apos;ll learn. Example: &quot;By the end of this video, you&apos;ll know exactly where viewers drop off and how to fix it.&quot;
          </li>
        </ul>
        <p className={s.sectionText}>
          The best hooks combine multiple frameworks. A strong hook might create a curiosity gap while also establishing stakes and promising a specific outcome. Test different approaches and check your retention curves to see which hooks work best for your audience.
        </p>
      </section>

      {/* Pacing and Structure */}
      <section id="pacing-structure" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </span>
          Video Pacing and Structure for Maximum Retention
        </h2>
        <p className={s.sectionText}>
          Even with a great hook, poor pacing will cause viewers to leave. Retention isn&apos;t just about the beginning—it&apos;s about maintaining engagement throughout the entire video. Here&apos;s how to structure your content for sustained attention:
        </p>
        <h3 className={s.subheading}>The Retention-Optimized Video Structure</h3>
        <ol className={s.numberedList}>
          <li><strong>Hook (0-30 seconds):</strong> Grab attention and establish relevance. Create a reason to keep watching.</li>
          <li><strong>Context (30-60 seconds):</strong> Brief background—only what&apos;s necessary. Don&apos;t overexplain.</li>
          <li><strong>Core Value (1-3 minutes for short videos, longer for tutorials):</strong> Deliver your main content. Break into digestible segments.</li>
          <li><strong>Pattern Interrupts (every 30-90 seconds):</strong> Change something to reset viewer attention.</li>
          <li><strong>Secondary Value (optional):</strong> Bonus tips, examples, or related content. Signal that this is extra value.</li>
          <li><strong>Call to Action (final 30 seconds):</strong> Subscribe prompt, related video recommendation, or engagement request.</li>
        </ol>
        <h3 className={s.subheading}>Open Loops for Sustained Engagement</h3>
        <p className={s.sectionText}>
          Open loops are promises of future content that keep viewers watching. The human brain naturally wants closure, so when you create an open loop, viewers feel compelled to keep watching until it&apos;s resolved. Examples: &quot;In a minute, I&apos;ll show you the one change that doubled my watch time.&quot; Or: &quot;I&apos;ll share my biggest mistake at the end—it&apos;s something most creators never realize.&quot;
        </p>
        <p className={s.sectionText}>
          Place open loops strategically: one in your hook, one at each potential drop-off point, and one before any section that might feel slow. But always close your loops—viewers who feel tricked won&apos;t come back.
        </p>
      </section>

      {/* Pattern Interrupts */}
      <section id="pattern-interrupts" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </span>
          Pattern Interrupts: The Secret to Holding Attention
        </h2>
        <p className={s.sectionText}>
          The human brain is wired to notice change. When something in your video changes—the visual, the audio, the pacing, the topic—viewer attention resets. These changes are called pattern interrupts, and they&apos;re one of the most powerful tools for maintaining retention. Here are specific pattern interrupts you can use:
        </p>
        <ul className={s.list}>
          <li><strong>Visual changes:</strong> Cut to a different camera angle, add b-roll footage, show a screen recording, display text on screen, or zoom in/out. Even small visual changes reset attention.</li>
          <li><strong>Audio changes:</strong> Add music, change background music, use sound effects, vary your speaking pace or volume, or pause for emphasis. Silence can be a powerful pattern interrupt.</li>
          <li><strong>Topic shifts:</strong> Move from explanation to example, from problem to solution, or from theory to application. Signpost these transitions: &quot;Now let&apos;s look at a real example.&quot;</li>
          <li><strong>Energy shifts:</strong> Alternate between high-energy and calm delivery. Build toward key points, then slow down to let them land. Monotone delivery kills retention.</li>
          <li><strong>Questions:</strong> Ask your viewer a question, even if they can&apos;t respond. &quot;Have you ever wondered why some videos just feel more engaging?&quot; This creates mental engagement.</li>
          <li><strong>Humor and personality:</strong> A well-placed joke, self-deprecating comment, or moment of genuine personality resets attention and builds connection.</li>
        </ul>
        <p className={s.sectionText}>
          Aim for some form of pattern interrupt every 30-90 seconds, depending on your content style. Study your favorite creators and notice how often they change something. You&apos;ll find the most engaging videos are constantly shifting while still feeling cohesive.
        </p>
      </section>

      {/* Retention Audit Workflow */}
      <section id="retention-audit" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </span>
          15-Minute Retention Audit Workflow
        </h2>
        <p className={s.sectionText}>
          Use this checklist to systematically analyze and improve retention for any video. Run this audit on your last 5-10 videos to identify patterns across your content.
        </p>
        <ol className={s.numberedList}>
          <li><strong>Open YouTube Studio Analytics:</strong> Go to your video&apos;s Engagement tab. Note the average view duration and average percentage viewed.</li>
          <li><strong>Identify the first major drop:</strong> Look at where your retention curve first dips significantly. This is usually in the first 30 seconds. Note the exact timestamp.</li>
          <li><strong>Watch that section:</strong> Rewatch from 15 seconds before the drop to 15 seconds after. Ask: what might have caused viewers to leave?</li>
          <li><strong>Find additional drop points:</strong> Scan the entire curve for other steep drops. Note each timestamp.</li>
          <li><strong>Identify retention peaks:</strong> Look for moments where retention holds steady or spikes. What were you doing during those moments?</li>
          <li><strong>Compare to your best videos:</strong> Open your highest-retention video. Compare the curve shape. What&apos;s different about the first 30 seconds?</li>
          <li><strong>List specific fixes:</strong> For each drop point, write down one concrete change you could make. For peaks, note what to replicate.</li>
          <li><strong>Plan your next video:</strong> Incorporate at least 3 retention improvements into your next script or outline.</li>
        </ol>

        {/* CTA for tool */}
        <div className={s.highlight}>
          <p>
            <strong>{BRAND.name} automates this analysis</strong> and shows you exactly where viewers drop off across all your videos. Get specific, actionable insights without manual spreadsheet work.
          </p>
        </div>
      </section>

      {/* Strategies to Improve */}
      <section id="improvement-strategies" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </span>
          Proven Strategies to Improve Retention
        </h2>
        <p className={s.sectionText}>
          Here are the most effective strategies for improving audience retention, based on what works for top-performing channels across niches:
        </p>
        <ul className={s.list}>
          <li><strong>Open with a hook:</strong> State what viewers will learn or experience in the first 5 seconds. Don&apos;t waste time with greetings or channel intros.</li>
          <li><strong>Match your title and thumbnail:</strong> Deliver exactly what you promised in your packaging. Mismatches cause immediate drop-offs.</li>
          <li><strong>Use pattern interrupts:</strong> Change something every 30-60 seconds: visuals, audio, pacing, or topic angle.</li>
          <li><strong>Create open loops:</strong> Tease upcoming content to keep viewers watching. &quot;Later I&apos;ll show you the one thing that changed everything.&quot;</li>
          <li><strong>Deliver value fast:</strong> Don&apos;t make viewers wait for the main content. Front-load value, then go deeper.</li>
          <li><strong>Cut ruthlessly:</strong> Every second that doesn&apos;t add value should be removed. Watch your video at 2x speed—if you&apos;re bored, your viewers are too.</li>
          <li><strong>Use chapters:</strong> Break your video into clear sections with timestamps. This helps viewers find what they want and often improves total watch time.</li>
          <li><strong>Script your first 30 seconds:</strong> Even if you improvise the rest, have your opening word-for-word planned. It&apos;s too important to wing.</li>
          <li><strong>Study your best videos:</strong> Your highest-retention videos contain clues about what your audience wants. Analyze them and replicate the patterns.</li>
        </ul>
        <p className={s.sectionText}>
          For more on improving your content strategy, see our <Link href="/learn/youtube-video-ideas">video ideas guide</Link> and <Link href="/learn/youtube-channel-audit">channel audit guide</Link>.
        </p>
      </section>

      {/* Retention Benchmarks */}
      <section id="benchmarks" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M3 3v18h18" />
              <path d="M18 9l-5 5-4-4-3 3" />
            </svg>
          </span>
          Retention Benchmarks by Video Length
        </h2>
        <p className={s.sectionText}>
          What counts as &quot;good&quot; retention depends on your video length. Longer videos naturally have lower percentage retention but can still have excellent absolute watch time. Here are general benchmarks:
        </p>
        <ul className={s.twoColList}>
          <li>
            <strong>Shorts (under 60 seconds)</strong>
            Target: 80-100% retention. Shorts need to hook instantly and maintain attention throughout. Any significant drop is problematic.
          </li>
          <li>
            <strong>Short videos (2-5 minutes)</strong>
            Target: 50-70% average view duration. These videos should be tight and focused. Cut anything that doesn&apos;t serve the main topic.
          </li>
          <li>
            <strong>Medium videos (8-15 minutes)</strong>
            Target: 40-60% average view duration. Strong structure and pattern interrupts are essential. Use chapters to help navigation.
          </li>
          <li>
            <strong>Long videos (20+ minutes)</strong>
            Target: 30-50% average view duration. High retention on long videos is rare but valuable. Break content into clear segments.
          </li>
        </ul>
        <p className={s.sectionText}>
          Remember: compare your retention to your own past videos, not to arbitrary benchmarks. If your retention is improving over time, you&apos;re on the right track regardless of the absolute numbers.
        </p>
      </section>

      {/* Common Mistakes */}
      <section id="common-mistakes" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </span>
          Common Retention Mistakes to Avoid
        </h2>
        <p className={s.sectionText}>
          Even creators who understand retention concepts often make these mistakes. Check your videos for these common issues:
        </p>
        <ul className={s.list}>
          <li><strong>Starting with &quot;Hey guys, welcome back&quot;:</strong> Generic channel intros kill retention. Start with your hook, not a greeting.</li>
          <li><strong>Overexplaining context:</strong> Most viewers need less background than you think. Get to the point faster.</li>
          <li><strong>Monotone delivery:</strong> Vocal variety keeps people engaged. Record yourself and listen for flat sections.</li>
          <li><strong>No visual variety:</strong> A static talking head for 10 minutes straight loses viewers. Add b-roll, graphics, or camera changes.</li>
          <li><strong>Burying the lead:</strong> If your best content is at the end, most viewers will never see it. Front-load value or tease it upfront.</li>
          <li><strong>Clickbait without payoff:</strong> Promising something in your title/thumbnail that you don&apos;t deliver destroys trust and retention.</li>
          <li><strong>Ignoring your own data:</strong> Your analytics tell you exactly what works and what doesn&apos;t. Stop guessing and start analyzing.</li>
        </ul>
      </section>

      {/* Tools and Resources */}
      <section id="tools" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
            </svg>
          </span>
          Tools for Analyzing Retention
        </h2>
        <p className={s.sectionText}>
          Several tools can help you analyze and improve retention:
        </p>
        <ul className={s.list}>
          <li><strong>YouTube Studio:</strong> The primary source for retention data. Free and built into YouTube. Check the Engagement tab for any video.</li>
          <li><strong>{BRAND.name}:</strong> Automates retention analysis across your entire channel, identifies patterns, and provides specific recommendations for improvement.</li>
          <li><strong>VidIQ / TubeBuddy:</strong> Browser extensions that add additional analytics overlays and comparisons to YouTube Studio.</li>
          <li><strong>Spreadsheets:</strong> Track your retention over time by logging average view duration and percentage viewed for each video.</li>
        </ul>

        {/* Final CTA */}
        <div className={s.highlight}>
          <p>
            <strong>Ready to improve your retention?</strong> <Link href="/dashboard">{BRAND.name}</Link> analyzes your retention curves automatically and shows you exactly what to fix. Get personalized insights for every video on your channel.
          </p>
        </div>
      </section>
    </>
  );
}
