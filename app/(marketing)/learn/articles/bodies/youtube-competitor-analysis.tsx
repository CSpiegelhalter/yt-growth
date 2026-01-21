/**
 * Body content for YouTube Competitor Analysis article.
 * Server component - no "use client" directive.
 */

import { BRAND } from "@/lib/brand";
import type { BodyProps } from "./index";

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* Why Competitor Analysis */}
      <section id="why-competitor-analysis" className={s.section}>
        <h2 className={s.sectionTitle}>Why Competitor Analysis Matters</h2>
        <p className={s.sectionText}>
          Every channel in your niche is running experiments for you. They test topics, formats, thumbnails, and hooks. Some work. Most do not. Competitor analysis lets you learn from those experiments without spending months figuring it out yourself.
        </p>
        <p className={s.sectionText}>
          This is not about copying. What you want are patterns. When three different channels in your niche all have a video on the same topic that outperforms their average, that tells you something about what the audience wants.
        </p>
      </section>

      {/* Competitor Checklist */}
      <section id="competitor-checklist" className={s.section}>
        <h2 className={s.sectionTitle}>15 Minute Competitor Checklist</h2>
        <ol className={s.numberedList}>
          <li>Pick 3 competitor channels (similar niche, similar or slightly larger size)</li>
          <li>Go to each channel&apos;s Videos tab and sort by Popular</li>
          <li>Note the top 3 videos from each channel</li>
          <li>Sort by newest and look for recent outliers</li>
          <li>Watch the first 30 seconds of standout videos</li>
          <li>Write down 2 to 3 patterns you noticed</li>
          <li>Pick one pattern to test in your next video</li>
        </ol>
      </section>

      {/* How to Find Competitors */}
      <section id="find-competitors" className={s.section}>
        <h2 className={s.sectionTitle}>How to Find Competitors on YouTube</h2>
        <p className={s.sectionText}><strong>Method 1: YouTube Search.</strong> Search for your main topics and see which channels appear repeatedly.</p>
        <p className={s.sectionText}><strong>Method 2: Suggested Videos.</strong> Check the suggested sidebar on videos similar to yours.</p>
        <p className={s.sectionText}><strong>Method 3: Channels Like feature.</strong> Look for &ldquo;Similar channels&rdquo; sections on channel pages.</p>
        <p className={s.sectionText}><strong>Method 4: Playlists and Communities.</strong> Search for playlists in your niche.</p>
        <p className={s.sectionText}><strong>Method 5: Ask Your Audience.</strong> Ask what other channels they watch.</p>
      </section>

      {/* Find Trending Videos */}
      <section id="find-trending" className={s.section}>
        <h2 className={s.sectionTitle}>How to Find Trending Videos in Your Niche</h2>
        <ol className={s.numberedList}>
          <li>Start with seed topics (5 to 10 core topics)</li>
          <li>Scan competitor uploads for outliers</li>
          <li>Spot videos with double the typical views</li>
          <li>Validate with recency (last 30 to 90 days)</li>
          <li>Check velocity (how fast views accumulated)</li>
          <li>Extract the angle</li>
          <li>Create your own version</li>
        </ol>
      </section>

      {/* Find Outlier Videos */}
      <section id="outliers" className={s.section}>
        <h2 className={s.sectionTitle}>How to Find Outlier Videos</h2>
        <ol className={s.numberedList}>
          <li>Go to a competitor channel and click Videos tab</li>
          <li>Note their typical view count</li>
          <li>Any video with double that count is an outlier</li>
        </ol>
        <p className={s.sectionText}>Compare fairly: same time window, same format, same upload period.</p>
      </section>

      {/* What to Track */}
      <section id="what-to-track" className={s.section}>
        <h2 className={s.sectionTitle}>What to Track on Competitor Channels</h2>
        <ul className={s.list}>
          <li><strong>Title Patterns:</strong> What promises get clicks in your niche</li>
          <li><strong>Thumbnail Patterns:</strong> What visual styles get attention</li>
          <li><strong>Topics and Themes:</strong> What the audience wants to watch</li>
          <li><strong>Series and Recurring Formats:</strong> Formats that build habits</li>
          <li><strong>Video Length:</strong> What duration works for different topics</li>
          <li><strong>Hooks and Openings:</strong> What keeps viewers watching past 30 seconds</li>
          <li><strong>Comment Themes:</strong> What the audience cares about</li>
        </ul>
      </section>

      {/* YouTube Stats */}
      <section id="youtube-stats" className={s.section}>
        <h2 className={s.sectionTitle}>YouTube Stats to Compare</h2>
        <p className={s.sectionText}><strong>What You Can See:</strong> Views, upload date, likes, comments, subscriber count, video length.</p>
        <p className={s.sectionText}><strong>What You Cannot See:</strong> Retention curves, CTR, traffic sources, subscriber conversion, revenue.</p>
      </section>

      {/* Titles and Thumbnails */}
      <section id="title-thumbnail" className={s.section}>
        <h2 className={s.sectionTitle}>Steal the Pattern, Not the Video</h2>
        <ul className={s.list}>
          <li><strong>How to + result:</strong> &ldquo;How to [do thing] in [timeframe]&rdquo;</li>
          <li><strong>Number list:</strong> &ldquo;7 [things] that [benefit]&rdquo;</li>
          <li><strong>Curiosity gap:</strong> &ldquo;Why [surprising thing] actually [works]&rdquo;</li>
          <li><strong>Question:</strong> &ldquo;Is [thing] actually [claim]?&rdquo;</li>
        </ul>
      </section>

      {/* Common Mistakes */}
      <section id="mistakes" className={s.section}>
        <h2 className={s.sectionTitle}>Common Competitor Analysis Mistakes</h2>
        <ul className={s.list}>
          <li><strong>Copying videos directly.</strong> Learn patterns, create something original.</li>
          <li><strong>Only studying mega channels.</strong> Study channels closer to your size.</li>
          <li><strong>Ignoring context behind viral videos.</strong></li>
          <li><strong>Focusing only on view counts.</strong> Check engagement too.</li>
          <li><strong>Analysis paralysis.</strong> Set a time limit, then create.</li>
          <li><strong>Tracking too many competitors.</strong> Pick 5 to 10 and study them deeply.</li>
        </ul>
      </section>

      {/* 30 Day Plan */}
      <section id="30-day-plan" className={s.section}>
        <h2 className={s.sectionTitle}>30 Day Plan</h2>
        <p className={s.sectionText}><strong>Week 1: Research.</strong> Identify 5 to 8 competitor channels. Run the 15 minute checklist on each.</p>
        <p className={s.sectionText}><strong>Week 2: Pick Patterns.</strong> Identify 3 clear patterns. Brainstorm video ideas for each.</p>
        <p className={s.sectionText}><strong>Week 3: Create and Test.</strong> Produce video 1 applying a pattern. Track metrics.</p>
        <p className={s.sectionText}><strong>Week 4: Evaluate.</strong> Check performance. Iterate.</p>
      </section>

      {/* Example */}
      <section id="example" className={s.section}>
        <h2 className={s.sectionTitle}>Example: Competitor Insight to Video Plan</h2>
        <p className={s.sectionText}>
          <strong>The Niche:</strong> Home Coffee Brewing (8,000 subscribers).
        </p>
        <p className={s.sectionText}>
          <strong>The Pattern:</strong> Budget equipment roundups with specific numbers perform well.
        </p>
        <p className={s.sectionText}>
          <strong>5 Video Ideas From This Pattern:</strong>
        </p>
        <ol className={s.numberedList}>
          <li>&ldquo;I Tested 5 Budget Espresso Machines. Here&apos;s the Only One I Kept.&rdquo;</li>
          <li>&ldquo;The Best Coffee Grinder Under $50 (I Tried 4)&rdquo;</li>
          <li>&ldquo;Cheap vs Expensive Pour Over: Can You Taste the Difference?&rdquo;</li>
          <li>&ldquo;3 Coffee Subscriptions Compared: Which Is Actually Worth It?&rdquo;</li>
          <li>&ldquo;I Tried Every Milk Frother on Amazon. Most Are Terrible.&rdquo;</li>
        </ol>
      </section>

      {/* CTA */}
      <div className={s.highlight}>
        <p>
          <strong>Want to find competitor insights faster?</strong> {BRAND.name} helps you track competitor channels, spot outlier videos automatically, and get alerts when a topic gains traction in your niche.
        </p>
      </div>
    </>
  );
}
