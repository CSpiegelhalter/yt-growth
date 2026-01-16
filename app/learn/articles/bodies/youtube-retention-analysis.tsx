/**
 * Body content for YouTube Retention Analysis article.
 * Server component - no "use client" directive.
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </span>
          Why Retention Matters for YouTube Growth
        </h2>
        <p className={s.sectionText}>
          Audience retention is the most important metric for YouTube growth. It directly affects how the algorithm promotes your videos. High retention signals to YouTube that viewers find your content valuable, leading to more impressions and suggested video placements.
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
            <div className={s.statValue}>Higher</div>
            <div className={s.statLabel}>Views with Better Retention</div>
          </div>
        </div>
      </section>

      {/* Reading Retention Curves */}
      <section id="reading-curves" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </span>
          How to Read Retention Curves
        </h2>
        <p className={s.sectionText}>
          YouTube Studio shows your retention graph as a line that starts at 100% and decreases over time.
        </p>
        <ul className={s.list}>
          <li><strong>Steep initial drop (0 to 30 sec):</strong> Hook isn&apos;t compelling or doesn&apos;t match title/thumbnail</li>
          <li><strong>Gradual decline:</strong> Normal behavior. Content is engaging.</li>
          <li><strong>Sharp mid-video drops:</strong> Specific section is boring or off-topic</li>
          <li><strong>Spikes above 100%:</strong> Viewers rewatching. This content resonates!</li>
          <li><strong>Cliff at the end:</strong> Normal. Viewers leave before end screens.</li>
        </ul>
      </section>

      {/* Drop-Off Patterns */}
      <section id="drop-off-patterns" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </span>
          Common Drop-Off Patterns and Fixes
        </h2>
        <ol className={s.numberedList}>
          <li><strong>The Early Exit (0 to 30 seconds):</strong> Viewers click away immediately. Fix: Start with a stronger hook.</li>
          <li><strong>The Intro Death (30 to 60 seconds):</strong> Long intros kill retention. Fix: Cut unnecessary intro footage.</li>
          <li><strong>The Mid-Video Cliff:</strong> Sharp drop at a specific point. Fix: Review and restructure that section.</li>
          <li><strong>The Slow Bleed:</strong> Gradual decline throughout. Fix: Add pattern interrupts.</li>
          <li><strong>The Premature End:</strong> Big drop before video ends. Fix: Deliver main value earlier.</li>
        </ol>
      </section>

      {/* Strategies to Improve */}
      <section id="improvement-strategies" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </span>
          Proven Strategies to Improve Retention
        </h2>
        <ul className={s.list}>
          <li><strong>Open with a hook:</strong> State what viewers will learn in the first 5 seconds.</li>
          <li><strong>Use pattern interrupts:</strong> Change something every 30 to 60 seconds.</li>
          <li><strong>Create open loops:</strong> Tease upcoming content. &ldquo;Later I&apos;ll show you...&rdquo;</li>
          <li><strong>Deliver on your promise fast:</strong> Don&apos;t make viewers wait.</li>
          <li><strong>Cut ruthlessly:</strong> If a section doesn&apos;t add value, remove it.</li>
          <li><strong>Use chapters:</strong> Help viewers find what they want.</li>
        </ul>
        <p className={s.sectionText}>
          For more on improving your content strategy, see our <Link href="/learn/youtube-video-ideas">video ideas guide</Link> and <Link href="/learn/youtube-channel-audit">channel audit guide</Link>.
        </p>
      </section>

      {/* CTA */}
      <div className={s.highlight}>
        <p>
          <strong>{BRAND.name} analyzes your retention curves</strong> and shows you exactly where viewers drop off. Get specific, actionable insights for each video.
        </p>
      </div>
    </>
  );
}
