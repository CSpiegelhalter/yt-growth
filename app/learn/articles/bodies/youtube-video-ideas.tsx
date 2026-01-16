/**
 * Body content for YouTube Video Ideas article.
 * Server component - no "use client" directive.
 */

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import type { BodyProps } from "./index";

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* Why Ideas Fail */}
      <section id="why-ideas-fail" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
          </span>
          Why Most Video Ideas Fail
        </h2>
        <p className={s.sectionText}>
          Most creators brainstorm ideas based on gut feeling or what they personally find interesting. The problem is that your interests do not always align with what your audience searches for or what the algorithm promotes.
        </p>
        <p className={s.sectionText}>
          Data driven idea generation flips this approach. Instead of guessing what might work, you start with what your audience already engages with.
        </p>
      </section>

      {/* Ideas Checklist */}
      <section id="ideas-checklist" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </span>
          15 Minute Ideas Checklist
        </h2>
        <ol className={s.numberedList}>
          <li><strong>Check your own analytics (3 min):</strong> Top 5 videos in the last 90 days.</li>
          <li><strong>Scan 3 competitor channels (5 min):</strong> Sort by Popular. Note topics you haven&apos;t covered.</li>
          <li><strong>YouTube search suggestions (3 min):</strong> Type 5 seed topics. Note autocomplete.</li>
          <li><strong>Comment mining (3 min):</strong> Look for questions in popular video comments.</li>
          <li><strong>Pick your top 3 (1 min):</strong> Circle ideas with clearest demand.</li>
        </ol>
      </section>

      {/* 5 Data-Driven Sources */}
      <section id="idea-sources" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </span>
          5 Data Driven Sources for Video Ideas
        </h2>
        <h3 className={s.subheading}>1. Your Own Best Performers</h3>
        <p className={s.sectionText}>Videos that got more views, subscribers, or engagement than your average.</p>
        <h3 className={s.subheading}>2. Competitor Outliers</h3>
        <p className={s.sectionText}>Videos from similar channels that performed much better than their usual content. See our <Link href="/learn/youtube-competitor-analysis">competitor analysis guide</Link>.</p>
        <h3 className={s.subheading}>3. YouTube Search Suggestions</h3>
        <p className={s.sectionText}>The autocomplete dropdown when you type in YouTube search.</p>
        <h3 className={s.subheading}>4. Comments on Popular Videos</h3>
        <p className={s.sectionText}>Questions, requests, and feedback from viewers on top videos in your niche.</p>
        <h3 className={s.subheading}>5. Trending Topics in Adjacent Niches</h3>
        <p className={s.sectionText}>Formats performing well in related niches that haven&apos;t been applied to yours.</p>
      </section>

      {/* Find Trending Videos */}
      <section id="find-trending" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </span>
          How to Find Trending Videos in Your Niche
        </h2>
        <ol className={s.numberedList}>
          <li>Start with seed topics</li>
          <li>Scan competitor uploads for outliers</li>
          <li>Spot videos with double the typical views</li>
          <li>Validate with recency (last 30 to 90 days)</li>
          <li>Check velocity</li>
          <li>Extract the angle</li>
          <li>Create your version</li>
        </ol>
      </section>

      {/* Keyword Research */}
      <section id="keyword-research" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          YouTube Keyword Research for Beginners
        </h2>
        <ol className={s.numberedList}>
          <li>Go to YouTube search (use incognito)</li>
          <li>Type a broad topic</li>
          <li>Note autocomplete suggestions</li>
          <li>Add modifiers: &ldquo;how to,&rdquo; &ldquo;for beginners,&rdquo; &ldquo;vs,&rdquo; &ldquo;best&rdquo;</li>
          <li>Use the alphabet trick (a, b, c...)</li>
        </ol>
      </section>

      {/* Shorts Ideas */}
      <section id="shorts-ideas" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="6" y="3" width="12" height="18" rx="2" />
              <path d="M9 18h6" />
            </svg>
          </span>
          YouTube Shorts Ideas
        </h2>
        <h3 className={s.subheading}>Educational Niches</h3>
        <ul className={s.list}>
          <li>One quick tip in 30 seconds</li>
          <li>Common mistake and the fix</li>
          <li>Tool or technique demonstration</li>
        </ul>
        <h3 className={s.subheading}>Entertainment Niches</h3>
        <ul className={s.list}>
          <li>Behind the scenes moment</li>
          <li>Day in the life highlight</li>
          <li>Before and after reveal</li>
        </ul>
      </section>

      {/* Niche Ideas */}
      <section id="niche-ideas" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </span>
          YouTube Niche Ideas
        </h2>
        <ul className={s.list}>
          <li>Technology (reviews, tutorials, news)</li>
          <li>Gaming (gameplay, guides, commentary)</li>
          <li>Personal finance and investing</li>
          <li>Health and fitness</li>
          <li>Cooking and food</li>
          <li>Education and explainers</li>
          <li>DIY and crafts</li>
          <li>Travel and adventure</li>
          <li>Productivity and self improvement</li>
          <li>Entertainment and commentary</li>
        </ul>
      </section>

      {/* Validation */}
      <section id="validation" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          How to Validate an Idea Before You Create
        </h2>
        <ul className={s.list}>
          <li><strong>Search volume check:</strong> Does anyone search for this topic?</li>
          <li><strong>Competition assessment:</strong> Can you compete?</li>
          <li><strong>Recency test:</strong> Have recent videos performed well?</li>
          <li><strong>Audience fit:</strong> Does this align with your subscribers&apos; expectations?</li>
          <li><strong>Packaging potential:</strong> Can you write a compelling title?</li>
          <li><strong>Production cost:</strong> Is the expected return worth the investment?</li>
        </ul>
        <p className={s.sectionText}>
          <strong>Green light:</strong> Clear demand, manageable competition, fits your audience.
        </p>
        <p className={s.sectionText}>
          <strong>Red light:</strong> No clear demand, saturated competition, or major audience mismatch.
        </p>
      </section>

      {/* Title and Thumbnail */}
      <section id="title-thumbnail" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </span>
          YouTube Title Ideas and Thumbnail Ideas
        </h2>
        <h3 className={s.subheading}>15 YouTube Title Templates</h3>
        <ol className={s.numberedList}>
          <li>How to [achieve result] in [timeframe]</li>
          <li>[Number] [things] every [audience] should know</li>
          <li>I tried [thing] for [timeframe]. Here is what happened.</li>
          <li>Why [common belief] is wrong</li>
          <li>The [only/best/fastest] way to [result]</li>
          <li>[Thing] vs [thing]: which is actually better?</li>
          <li>Stop doing [mistake] (do this instead)</li>
          <li>What nobody tells you about [topic]</li>
          <li>Is [thing] actually worth it?</li>
          <li>[Number] mistakes [audience] make</li>
        </ol>
      </section>

      {/* 30 Day Content Plan */}
      <section id="content-plan" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </span>
          30 Day Content Plan
        </h2>
        <h3 className={s.subheading}>Week 1: Research and Brainstorm</h3>
        <ul className={s.list}>
          <li>Run the 15 minute ideas checklist 3 times</li>
          <li>Build a list of 15 to 20 raw ideas</li>
          <li>Identify your top 4 ideas for the month</li>
        </ul>
        <h3 className={s.subheading}>Week 2: Pick Themes and Outline</h3>
        <ul className={s.list}>
          <li>Group ideas by theme</li>
          <li>Write title options and thumbnail concepts</li>
          <li>Schedule your production timeline</li>
        </ul>
        <h3 className={s.subheading}>Week 3: Produce and Publish</h3>
        <ul className={s.list}>
          <li>Film video 1 and 2</li>
          <li>Edit and publish video 1</li>
          <li>Monitor early performance</li>
        </ul>
        <h3 className={s.subheading}>Week 4: Evaluate and Iterate</h3>
        <ul className={s.list}>
          <li>Publish video 2</li>
          <li>Review performance of video 1 after 7 days</li>
          <li>Start research for next month</li>
        </ul>
      </section>

      {/* Mistakes */}
      <section id="mistakes" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M15 9l-6 6M9 9l6 6" />
            </svg>
          </span>
          Common Video Idea Mistakes
        </h2>
        <ul className={s.list}>
          <li><strong>Making videos only you care about.</strong> Validate demand first.</li>
          <li><strong>Copying competitor videos directly.</strong> Learn patterns, not executions.</li>
          <li><strong>Ignoring your own analytics.</strong> Make more content like your hits.</li>
          <li><strong>Chasing trends you cannot execute.</strong></li>
          <li><strong>Overthinking before starting.</strong> Limit research time, then ship.</li>
          <li><strong>Saturated topics without differentiation.</strong></li>
        </ul>
      </section>

      {/* CTA */}
      <div className={s.highlight}>
        <p>
          <strong>Want help finding video ideas?</strong> {BRAND.name} generates ideas based on what is working in your niche. See trending topics, competitor outliers, and validated ideas.
        </p>
      </div>
    </>
  );
}
