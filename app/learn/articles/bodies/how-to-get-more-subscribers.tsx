/**
 * Body content for How to Get More Subscribers article.
 * Server component - no "use client" directive.
 */

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import type { BodyProps } from "./index";

export function Body({ s }: BodyProps) {
  return (
    <>
      <section id="why-subscribers-matter" className={s.section}>
        <h2 className={s.sectionTitle}>Why Subscribers Matter for YouTube Growth</h2>
        <p className={s.sectionText}>
          Your subscriber count is not just a vanity metric. Subscribers are people who told YouTube they want to see more from you. When you upload a new video, subscribers often watch it first, giving your content early momentum.
        </p>
        <div className={s.statsGrid}>
          <div className={s.stat}><div className={s.statValue}>Early Views</div><div className={s.statLabel}>Subscribers often watch within 24 hours</div></div>
          <div className={s.stat}><div className={s.statValue}>1 to 3%</div><div className={s.statLabel}>Typical viewer to subscriber rate</div></div>
          <div className={s.stat}><div className={s.statValue}>Predictable</div><div className={s.statLabel}>Subscribers create baseline views</div></div>
        </div>
      </section>

      <section id="subscriber-checklist" className={s.section}>
        <h2 className={s.sectionTitle}>15 Minute Subscriber Checklist</h2>
        <ol className={s.numberedList}>
          <li>Check your subscriber count trend in YouTube Studio</li>
          <li>Find your best converting video under Analytics → Audience → Subscribers</li>
          <li>Watch your top video&apos;s first 30 seconds</li>
          <li>Check if you ask for the subscribe after delivering value</li>
          <li>Review your channel page banner and about section</li>
          <li>Look at your recent video titles for consistency</li>
          <li>Check your end screens</li>
          <li>Review your posting consistency</li>
        </ol>
      </section>

      <section id="see-subscribers" className={s.section}>
        <h2 className={s.sectionTitle}>How to See Your Subscribers on YouTube</h2>
        <ul className={s.list}>
          <li><strong>Total subscriber count:</strong> YouTube Studio dashboard</li>
          <li><strong>Subscribers gained over time:</strong> Analytics → Audience tab</li>
          <li><strong>Subscribers by video:</strong> Analytics → Audience → See more under Subscribers</li>
        </ul>
      </section>

      <section id="youtube-analytics" className={s.section}>
        <h2 className={s.sectionTitle}>Analytics That Predict Subscriber Growth</h2>
        <ul className={s.list}>
          <li><strong>Subscribers per 1,000 views:</strong> Below 10 suggests content doesn&apos;t give viewers a reason to return.</li>
          <li><strong>Returning viewers:</strong> High percentage means subscribers are watching.</li>
          <li><strong>Average view duration:</strong> Viewers who watch longer are more likely to subscribe. See <Link href="/learn/youtube-retention-analysis">retention guide</Link>.</li>
          <li><strong>Click through rate:</strong> Low CTR means fewer people see your content.</li>
        </ul>
      </section>

      <section id="what-converts" className={s.section}>
        <h2 className={s.sectionTitle}>What Actually Converts Viewers to Subscribers</h2>
        <ul className={s.list}>
          <li><strong>Demonstrated expertise:</strong> Videos that teach something valuable</li>
          <li><strong>Unique perspective:</strong> Your own angle, format, or style</li>
          <li><strong>Consistent theme:</strong> Viewers know what future videos will be about</li>
          <li><strong>Clear promise:</strong> &ldquo;I post a new editing tutorial every Tuesday&rdquo;</li>
          <li><strong>Personal connection:</strong> Creators who show personality</li>
        </ul>
      </section>

      <section id="growth-strategies" className={s.section}>
        <h2 className={s.sectionTitle}>Proven Subscriber Growth Strategies</h2>
        <ol className={s.numberedList}>
          <li><strong>Ask after value, not before.</strong> Wait until you&apos;ve delivered something useful.</li>
          <li><strong>Create series content.</strong> Multi-part series give viewers a reason to subscribe.</li>
          <li><strong>Optimize your channel page.</strong> Update your channel trailer every few months.</li>
          <li><strong>Use end screens strategically.</strong> Promote your best converting videos.</li>
          <li><strong>Double down on what works.</strong> Make more content like your hits.</li>
          <li><strong>Post consistently.</strong> Pick a schedule you can maintain.</li>
        </ol>
      </section>

      <section id="mistakes" className={s.section}>
        <h2 className={s.sectionTitle}>Subscriber Growth Mistakes to Avoid</h2>
        <ul className={s.list}>
          <li><strong>Asking for subscribers in the intro.</strong> Earn the ask first.</li>
          <li><strong>Sub4Sub schemes.</strong> They hurt your engagement metrics.</li>
          <li><strong>Giveaway subscribers.</strong> They subscribed for prizes, not content.</li>
          <li><strong>Inconsistent topics.</strong> Pick a lane.</li>
          <li><strong>Never asking at all.</strong> A well-timed ask makes a difference.</li>
        </ul>
      </section>

      <section id="dont-buy-subscribers" className={s.section}>
        <h2 className={s.sectionTitle}>Why You Should Never Buy YouTube Subscribers</h2>
        <p className={s.sectionText}>
          Services that promise free YouTube subscribers or let you buy subscribers are harmful. See our <Link href="/learn/free-youtube-subscribers">detailed guide on why fake growth hurts your channel</Link>.
        </p>
      </section>

      <div className={s.highlight}>
        <p>
          <strong>Find which videos convert viewers to subscribers.</strong> {BRAND.name} analyzes your YouTube data to show you which videos bring in subscribers and what they have in common.
        </p>
      </div>
    </>
  );
}
