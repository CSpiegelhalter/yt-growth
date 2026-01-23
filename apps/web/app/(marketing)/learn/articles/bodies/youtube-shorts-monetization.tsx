/**
 * Body content for YouTube Shorts Monetization article.
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
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          </span>
          How Shorts Monetization Works
        </h2>
        <p className={s.sectionText}>
          YouTube Shorts monetization runs on a pooled revenue model: ads play between
          videos in the Shorts feed, the money goes into a shared pool, and creators
          receive a cut based on their share of total views.
        </p>
        <p className={s.sectionText}>
          Revenue from Shorts is typically modest compared to long-form—but it adds up
          at scale, and the real value often lies in audience growth rather than direct
          payouts. This guide covers how the system works, what you can realistically
          expect to earn, and how to think strategically about Shorts as part of a
          larger channel strategy.
        </p>
      </section>

      {/* Eligibility */}
      <section id="eligibility" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </span>
          Eligibility Requirements
        </h2>
        <p className={s.sectionText}>
          To earn from Shorts, you need to be accepted into the YouTube Partner Program.
          The requirements are designed to ensure creators have an established audience
          and follow platform guidelines.
        </p>
        <h3 className={s.subheading}>You need:</h3>
        <ul className={s.list}>
          <li>1,000 subscribers</li>
          <li>4,000 public watch hours in the last 12 months, OR 10 million public Shorts views in the last 90 days</li>
          <li>No active community guideline strikes</li>
          <li>Residence in an eligible country</li>
          <li>A linked AdSense account</li>
        </ul>
        <p className={s.sectionText}>
          The 10-million-views path is significant for creators who focus primarily on
          short-form content. If you're building a Shorts-first channel, you don't need
          to produce long-form videos to reach monetization—though views alone don't
          guarantee acceptance. YouTube still reviews your channel for policy compliance.
        </p>
        <p className={s.sectionText}>
          For complete details on the YouTube Partner Program, see our{" "}
          <Link href="/learn/youtube-monetization-requirements">monetization requirements guide</Link>.
        </p>
      </section>

      {/* Revenue Model */}
      <section id="revenue-model" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          </span>
          The Shorts Revenue Model
        </h2>
        <p className={s.sectionText}>
          Unlike long-form videos where ads play on your specific content, Shorts use
          a pooled system. Ads appear between videos as viewers scroll the feed, and
          that revenue gets distributed across all creators whose Shorts were watched.
          Your share depends on how many views you contributed to the total pool.
        </p>
        <h3 className={s.subheading}>How pooled revenue works:</h3>
        <ul className={s.list}>
          <li>Ads run between Shorts in the feed, not during individual videos</li>
          <li>All ad revenue from the feed gets combined into a shared pool</li>
          <li>Each creator receives a portion based on their percentage of total views</li>
          <li>If you use licensed music, the rights holders receive their cut first</li>
          <li>YouTube takes 55% of what remains; you keep 45%</li>
        </ul>
        <div className={s.highlight}>
          <p>
            <strong>The music trade-off:</strong> Using trending sounds from Creator Music
            or licensed tracks can help a Short perform better—but your per-view payout
            shrinks because rights holders take a portion before your 45% is calculated.
            Original audio and voiceovers keep your full share intact.
          </p>
        </div>
      </section>

      {/* Earning Potential */}
      <section id="earning-potential" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </span>
          Realistic Earning Potential
        </h2>
        <p className={s.sectionText}>
          Shorts RPM—the revenue per thousand views—is considerably lower than long-form.
          The exact amount varies based on viewer geography, music usage, time of year,
          and the overall size of the revenue pool. Creators in the same niche can see
          different numbers depending on where their audience is located.
        </p>
        <h3 className={s.subheading}>Typical earnings range:</h3>
        <ul className={s.list}>
          <li><strong>Shorts RPM:</strong> Commonly $0.01–$0.05 per 1,000 views, with $0.02–$0.03 being typical</li>
          <li><strong>Long-form RPM:</strong> Often $2–$10 per 1,000 views depending on niche</li>
          <li><strong>The gap:</strong> Long-form can pay 50–500× more per view</li>
          <li><strong>Geography matters:</strong> Views from higher-CPM countries (US, UK, Canada) pay more</li>
        </ul>
        <div className={s.highlight}>
          <p>
            <strong>Rough earnings examples:</strong> 100,000 Shorts views might earn $2–$5.
            One million views often lands in the $20–$50 range. Even 10 million views—the
            threshold for monetization—typically yields somewhere around $200–$500. These
            are approximations; your results will vary.
          </p>
        </div>
      </section>

      {/* Maximizing Earnings */}
      <section id="maximizing-earnings" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          </span>
          Maximizing Your Earnings
        </h2>
        <p className={s.sectionText}>
          Since Shorts revenue is tied to total views, the levers you can pull are
          straightforward: get more views, keep more of the revenue per view, and
          publish consistently enough that momentum compounds. Audience geography
          matters too—creators with viewers in high-CPM regions naturally earn more—but
          that's largely outside your control. Focus on what you can influence.
        </p>
        <h3 className={s.subheading}>Moves that usually help:</h3>
        <ul className={s.list}>
          <li>Create content that loops well or encourages rewatches—watch time still matters</li>
          <li>Develop repeatable formats or series so viewers recognize your style and come back</li>
          <li>Use original audio or voiceover when it makes sense, preserving your full revenue share</li>
          <li>Publish consistently to build momentum and increase your share of the pool over time</li>
          <li>Bridge to other revenue: long-form content, memberships, sponsorships, or products</li>
        </ul>
        <p className={s.sectionText}>
          The last point is often undervalued. Direct Shorts revenue is modest, but a
          Short that drives subscribers to your long-form content or leads viewers to
          a product can be worth far more than its RPM suggests.
        </p>
      </section>

      {/* Shorts vs Long */}
      <section id="shorts-vs-long" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
              <line x1="12" y1="2" x2="12" y2="22" />
            </svg>
          </span>
          Shorts vs Long-Form Revenue
        </h2>
        <p className={s.sectionText}>
          The revenue gap between Shorts and long-form isn't a flaw—it reflects how ads
          work on each format. Long videos can run multiple mid-roll ads, attract
          higher-intent viewers, and offer advertisers more context for targeting.
          Shorts are quick, skippable, and monetized through a shared pool rather than
          direct ad placements.
        </p>
        <h3 className={s.subheading}>Why long-form pays more:</h3>
        <ul className={s.list}>
          <li>Multiple ad slots per video (pre-roll, mid-roll, post-roll)</li>
          <li>Ads are placed on your specific video, not pooled across everyone</li>
          <li>Longer watch sessions signal higher intent, which advertisers pay more for</li>
          <li>Better targeting options for sponsors and brand deals</li>
        </ul>
        <p className={s.sectionText}>
          This doesn't mean Shorts are a waste of time. Think of them as serving
          different purposes: Shorts excel at discovery and audience building—they
          reach people who might never click on a longer video. Long-form is
          where you convert that attention into meaningful ad revenue. The creators
          who do best often use both: Shorts to grow, long-form to earn.
        </p>
      </section>

      {/* Strategy */}
      <section id="strategy" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </span>
          Shorts Monetization Strategy
        </h2>
        <p className={s.sectionText}>
          The most effective approach treats Shorts as the top of a funnel rather than
          a standalone income source. A Short that earns $5 directly but brings 100 new
          subscribers—who then watch your long-form content and join your membership—is
          worth far more than its RPM implies.
        </p>
        <h3 className={s.subheading}>The funnel in practice:</h3>
        <ol className={s.numberedList}>
          <li><strong>Shorts:</strong> Capture attention with quick, compelling content that showcases your style</li>
          <li><strong>Subscribe:</strong> Give viewers a reason to follow—consistency, personality, value</li>
          <li><strong>Long-form:</strong> Deliver deeper content that earns more per view and builds loyalty</li>
          <li><strong>Off-platform revenue:</strong> Memberships, sponsorships, products, or services</li>
        </ol>
        <p className={s.sectionText}>
          Balancing effort matters. Shorts can be faster to produce, especially if you
          repurpose clips from longer videos. That makes them efficient for reach without
          requiring a separate production pipeline. Some creators batch-record Shorts;
          others extract highlights from streams or podcasts. Find the workflow that
          lets you stay consistent without burning out on two completely separate content
          strategies.
        </p>
        <p className={s.sectionText}>
          For tips on creating effective Shorts, see our{" "}
          <Link href="/learn/youtube-shorts-length">Shorts length and specs guide</Link>.
        </p>
      </section>

      {/* CTA */}
      <div className={s.highlight}>
        <p>
          <strong>Use Shorts to earn attention. Use long-form to earn revenue.</strong> The
          creators who thrive treat Shorts as a discovery engine, not a paycheck. Your
          next step: publish 15 Shorts over the next 30 days and track which ones drive
          returning viewers and new subscribers. That data tells you where to double down.
        </p>
      </div>
    </>
  );
}
