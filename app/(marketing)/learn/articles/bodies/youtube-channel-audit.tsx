/**
 * Body content for YouTube Channel Audit article.
 * Server component - no "use client" directive.
 */

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import type { BodyProps } from "./index";

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* What is a Channel Audit */}
      <section id="what-is-audit" className={s.section}>
        <h2 className={s.sectionTitle}>What is a YouTube Channel Audit?</h2>
        <p className={s.sectionText}>
          You&apos;re posting consistently, your content is good, but your views are flat and subscribers aren&apos;t growing. Sound familiar? A channel audit is how you figure out exactly what&apos;s going wrong and what to fix first.
        </p>
        <p className={s.sectionText}>
          An audit is a systematic review of your YouTube analytics to find the specific bottleneck holding you back. Maybe your thumbnails aren&apos;t getting clicks. Maybe viewers are leaving in the first 30 seconds. Maybe YouTube isn&apos;t showing your videos to anyone. Each problem has a different fix, and the only way to know which one applies to you is to look at the data.
        </p>
        <p className={s.sectionText}>
          This guide gives you a complete framework. You&apos;ll learn which metrics actually matter, where to find them in YouTube Studio, what healthy numbers look like, how to diagnose your specific problem, and what to do about it.
        </p>
      </section>

      {/* Key Metrics */}
      <section id="key-metrics" className={s.section}>
        <h2 className={s.sectionTitle}>The 6 Metrics That Actually Matter</h2>
        <p className={s.sectionText}>
          YouTube tracks dozens of numbers, but only a handful tell you what&apos;s actually happening with your channel. Focus on these six.
        </p>
        <ul className={s.list}>
          <li><strong>Impressions:</strong> How many times YouTube showed your thumbnail. Under 1,000 per video after a week means YouTube isn&apos;t recommending your content.</li>
          <li><strong>Click Through Rate (CTR):</strong> Percentage who clicked your thumbnail. Below 4% indicates packaging problems.</li>
          <li><strong>Average View Duration:</strong> How long viewers watch. Under 40% of video length means content isn&apos;t holding attention.</li>
          <li><strong>Retention Curve:</strong> Graph showing when viewers leave. Cliffs = weak hooks. Gradual decline = normal.</li>
          <li><strong>Traffic Sources:</strong> Where views come from. Heavy search = titles work but YouTube isn&apos;t recommending broadly.</li>
          <li><strong>Subscribers Per 1K Views:</strong> How many viewers become subscribers. Healthy: 10 to 30. Under 10 = content doesn&apos;t signal ongoing value.</li>
        </ul>
      </section>

      {/* YouTube Studio Guide */}
      <section id="youtube-studio-guide" className={s.section}>
        <h2 className={s.sectionTitle}>Where to Find Each Metric in YouTube Studio</h2>
        <ol className={s.numberedList}>
          <li><strong>Open YouTube Studio:</strong> Go to studio.youtube.com</li>
          <li><strong>Impressions and CTR:</strong> Analytics → Reach tab</li>
          <li><strong>Average View Duration:</strong> Analytics → Engagement tab</li>
          <li><strong>Retention Curves:</strong> Content → select video → Analytics → Engagement</li>
          <li><strong>Traffic Sources:</strong> Analytics → Reach tab → scroll to Traffic source types</li>
          <li><strong>Subscribers Per Video:</strong> Analytics → Audience tab → See More under subscribers</li>
        </ol>
      </section>

      {/* What Good Looks Like */}
      <section id="what-good-looks-like" className={s.section}>
        <h2 className={s.sectionTitle}>What Good Looks Like (Benchmarks)</h2>
        <div className={s.statsGrid}>
          <div className={s.stat}>
            <div className={s.statValue}>4-10%</div>
            <div className={s.statLabel}>Click Through Rate</div>
          </div>
          <div className={s.stat}>
            <div className={s.statValue}>40-60%</div>
            <div className={s.statLabel}>Avg View Duration</div>
          </div>
          <div className={s.stat}>
            <div className={s.statValue}>10-30</div>
            <div className={s.statLabel}>Subs per 1K Views</div>
          </div>
        </div>
      </section>

      {/* Diagnose Your Problem */}
      <section id="diagnose-problem" className={s.section}>
        <h2 className={s.sectionTitle}>Diagnose Your Problem</h2>
        <ul className={s.list}>
          <li><strong>Low Impressions + Low CTR:</strong> Focus on CTR first with better thumbnails/titles.</li>
          <li><strong>High Impressions + Low CTR:</strong> Packaging problem. Test new thumbnail styles.</li>
          <li><strong>Good CTR + Low Retention:</strong> Thumbnail/title mismatch or weak hooks. See <Link href="/learn/youtube-retention-analysis">retention fixes</Link>.</li>
          <li><strong>Good CTR + Good Retention + Low Views:</strong> Content is solid but needs time. Double down on search content.</li>
          <li><strong>Good Metrics + Few Subscribers:</strong> Not asking for subscribe at right time. See <Link href="/learn/how-to-get-more-subscribers">subscriber strategies</Link>.</li>
        </ul>
      </section>

      {/* 15 Minute Checklist */}
      <section id="checklist" className={s.section}>
        <h2 className={s.sectionTitle}>15 Minute Channel Audit Checklist</h2>
        <ol className={s.numberedList}>
          <li>Compare last 28 days vs previous 28 days</li>
          <li>Check impressions trend</li>
          <li>Check channel CTR (is it above 4%?)</li>
          <li>Review top 5 videos by views</li>
          <li>Review bottom 5 videos</li>
          <li>Open most recent video&apos;s retention graph</li>
          <li>Check traffic sources</li>
          <li>Check subscriber source</li>
          <li>Check returning viewers percentage</li>
          <li>Review upload consistency</li>
        </ol>
      </section>

      {/* Common Issues */}
      <section id="common-issues" className={s.section}>
        <h2 className={s.sectionTitle}>Why Your YouTube Channel Isn&apos;t Growing</h2>
        <ul className={s.list}>
          <li><strong>Hooks are too slow:</strong> 40%+ retention drop in first 30 seconds. Fix: Start with the payoff.</li>
          <li><strong>Thumbnails don&apos;t stand out:</strong> Low CTR. Fix: High contrast, emotion on faces.</li>
          <li><strong>Title/thumbnail don&apos;t match content:</strong> High CTR, low retention. Fix: Deliver promise in first 30 seconds.</li>
          <li><strong>Content too scattered:</strong> Pick one topic for at least 20 videos.</li>
          <li><strong>Videos drag in middle:</strong> Watch at 2x, cut every moment you&apos;d skip.</li>
          <li><strong>Not asking for subscribers:</strong> Ask after delivering value, explain future videos.</li>
          <li><strong>Inconsistent posting:</strong> Pick a realistic schedule and stick to it.</li>
        </ul>
      </section>

      {/* Quick Wins */}
      <section id="quick-wins" className={s.section}>
        <h2 className={s.sectionTitle}>Quick Wins You Can Fix Today</h2>
        <ul className={s.list}>
          <li><strong>Update 3 worst-performing thumbnails</strong></li>
          <li><strong>Add end screens to last 10 videos</strong></li>
          <li><strong>Add cards at retention drop points</strong></li>
          <li><strong>Rewrite 5 most-viewed video titles</strong></li>
          <li><strong>Update channel description</strong></li>
          <li><strong>Create/update channel trailer</strong></li>
          <li><strong>Organize videos into playlists</strong></li>
          <li><strong>Pin subscriber-driving comment</strong></li>
        </ul>
      </section>

      {/* Common Mistakes */}
      <section id="common-mistakes" className={s.section}>
        <h2 className={s.sectionTitle}>Mistakes Creators Make During Audits</h2>
        <ul className={s.list}>
          <li><strong>Looking at too short a time period.</strong> Look at 28 or 90 day trends.</li>
          <li><strong>Focusing on views instead of leading indicators.</strong> Focus on CTR, retention, impressions.</li>
          <li><strong>Making multiple changes at once.</strong> Test one variable at a time.</li>
          <li><strong>Ignoring your successful videos.</strong> Study your top 10%.</li>
          <li><strong>Expecting immediate results.</strong> Give changes 2 weeks to show true impact.</li>
        </ul>
      </section>

      {/* 30 Day Action Plan */}
      <section id="action-plan" className={s.section}>
        <h2 className={s.sectionTitle}>30 Day Action Plan</h2>
        <div className={s.highlight}>
          <p><strong>Week 1: Fix your packaging.</strong> Update thumbnails on 5 lowest CTR videos. Rewrite titles on 5 most-viewed videos.</p>
        </div>
        <div className={s.highlight}>
          <p><strong>Week 2: Fix your hooks.</strong> Watch first 60 seconds of 5 most recent videos. Write 3 hook options for next video.</p>
        </div>
        <div className={s.highlight}>
          <p><strong>Week 3: Optimize back catalog.</strong> Add end screens, create playlists, add cards at drop points.</p>
        </div>
        <div className={s.highlight}>
          <p><strong>Week 4: Review and plan.</strong> Compare metrics. Plan next month based on learnings.</p>
        </div>
      </section>

      {/* YouTube SEO Basics */}
      <section id="youtube-seo" className={s.section}>
        <h2 className={s.sectionTitle}>YouTube SEO Basics</h2>
        <p className={s.sectionText}>
          YouTube SEO is different from website SEO. While keywords matter, YouTube heavily weights engagement signals.
        </p>
        <ol className={s.numberedList}>
          <li><strong>Retention and watch time:</strong> Most important factor.</li>
          <li><strong>Click through rate:</strong> Higher CTR leads to more impressions.</li>
          <li><strong>Title optimization:</strong> Include target keyword in first 60 characters.</li>
          <li><strong>Description:</strong> First 2 to 3 sentences matter most.</li>
        </ol>
        <p className={s.sectionText}>
          For deeper SEO strategy, see our <Link href="/learn/youtube-seo">complete YouTube SEO guide</Link>.
        </p>
      </section>

      {/* CTA Highlight */}
      <div className={s.highlight}>
        <p>
          <strong>Want help with your audit?</strong> {BRAND.name} connects to your YouTube analytics and automatically surfaces what is working and what needs attention.
        </p>
      </div>
    </>
  );
}
