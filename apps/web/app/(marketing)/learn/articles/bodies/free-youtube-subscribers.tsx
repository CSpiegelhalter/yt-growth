/**
 * Body content for Free YouTube Subscribers article.
 * Server component - no "use client" directive.
 */

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import type { BodyProps } from "./index";

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* Overview */}
      <section id="overview" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </span>
          The Problem with Fake Growth
        </h2>
        <p className={s.sectionText}>
          Services promising free YouTube subscribers, free views, or the
          ability to buy subscribers are everywhere. They target new creators
          frustrated by slow growth. The promise is tempting: get subscribers
          fast, hit monetization thresholds sooner, look more established.
        </p>
        <p className={s.sectionText}>
          The reality is different. These services deliver fake engagement
          that actively harms your channel. What looks like a shortcut is
          actually a trap that can destroy your chances of success.
        </p>
        <p className={s.sectionText}>
          This page explains why fake growth hurts you and what to do instead.
          We do not provide links to these services, instructions for using
          them, or any methods to artificially inflate your metrics. Our goal
          is to help you build a real audience.
        </p>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </span>
          How These Services Work
        </h2>
        <p className={s.sectionText}>
          There are several types of fake engagement services. None of them
          deliver real audience growth:
        </p>
        <h3 className={s.subheading}>Bot Services</h3>
        <p className={s.sectionText}>
          These use automated accounts or software to subscribe to your
          channel or watch your videos. The accounts are not real people. They
          never actually watch your content. Many are created specifically for
          this purpose and get deleted in YouTube&apos;s regular purges.
        </p>
        <h3 className={s.subheading}>Click Farms</h3>
        <p className={s.sectionText}>
          Some services use real people in low-wage countries to subscribe to
          channels and watch videos. These people are paid pennies per action.
          They have no interest in your content and will never return after
          the initial action.
        </p>
        <h3 className={s.subheading}>Sub4Sub Networks</h3>
        <p className={s.sectionText}>
          These connect creators who agree to subscribe to each other.
          Everyone subscribes to everyone, but nobody watches anyone. The
          result is channels full of &ldquo;subscribers&rdquo; who never
          engage.
        </p>
        <h3 className={s.subheading}>&ldquo;Free&rdquo; Services</h3>
        <p className={s.sectionText}>
          Services offering free subscribers typically require you to either
          watch ads, complete surveys, or subscribe to other channels in
          exchange. The subscribers you get are from the same exchange system.
          None of them care about your content.
        </p>
      </section>

      {/* Why It Hurts */}
      <section id="why-harmful" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18.36 6.64a9 9 0 11-12.73 0M12 2v10" />
            </svg>
          </span>
          Why It Hurts Your Channel
        </h2>
        <p className={s.sectionText}>
          Fake subscribers and views do not just fail to help. They actively
          damage your channel in several ways:
        </p>
        <h3 className={s.subheading}>Destroyed Engagement Rate</h3>
        <p className={s.sectionText}>
          YouTube uses engagement rate to decide what to recommend. If you
          have 10,000 subscribers but only 100 people watch your videos,
          YouTube sees a 1% engagement rate. This signals that your audience
          does not care about your content. YouTube responds by showing your
          videos to fewer people.
        </p>
        <p className={s.sectionText}>
          Real channels often see 10% to 30% of subscribers watch new uploads.
          Channels with fake subscribers see 1% or less. The algorithm learns
          your content is not worth promoting.
        </p>
        <h3 className={s.subheading}>Lost Trust with Real Viewers</h3>
        <p className={s.sectionText}>
          When real potential subscribers see a channel with 50,000
          subscribers but only 500 views per video, it looks suspicious. They
          wonder why the existing audience does not watch. This erodes trust
          before you even have a chance to impress them.
        </p>
        <h3 className={s.subheading}>Wasted Monetization Potential</h3>
        <p className={s.sectionText}>
          Even if you hit monetization thresholds with fake subscribers, your
          actual earnings will be tiny. Revenue comes from real views, not
          subscriber counts. Fake subscribers do not watch videos, so they
          generate no ad revenue.
        </p>
        <h3 className={s.subheading}>No Path to Growth</h3>
        <p className={s.sectionText}>
          Fake subscribers do not share your content, do not leave comments
          that help the algorithm, and do not bring friends. They are a dead
          end. You end up worse off than if you had fewer, real subscribers.
        </p>
      </section>

      {/* Policy Violations */}
      <section id="policy-violations" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
            </svg>
          </span>
          YouTube Policy Violations
        </h2>
        <p className={s.sectionText}>
          Buying subscribers, using fake engagement services, or participating
          in sub4sub schemes violates YouTube&apos;s Terms of Service.
          Specifically:
        </p>
        <ul className={s.list}>
          <li>
            <strong>Fake Engagement Policy:</strong> YouTube prohibits
            &ldquo;using third-party services or apps that promise to add
            subscribers to your channel&rdquo;
          </li>
          <li>
            <strong>Spam, Deceptive Practices, and Scams Policy:</strong>{" "}
            Covers fake engagement, misleading metadata, and deceptive
            subscriber growth
          </li>
          <li>
            <strong>Terms of Service Section 4:</strong> Prohibits
            artificially inflating views, likes, comments, or other metrics
          </li>
        </ul>
        <p className={s.sectionText}>
          YouTube actively detects and removes fake engagement. They use
          machine learning to identify suspicious patterns. When detected, the
          consequences are real.
        </p>
      </section>

      {/* Real Consequences */}
      <section id="real-consequences" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M15 9l-6 6M9 9l6 6" />
            </svg>
          </span>
          Real Consequences
        </h2>
        <p className={s.sectionText}>
          YouTube enforces its policies. Here is what can happen:
        </p>
        <ul className={s.list}>
          <li>
            <strong>Subscriber purge:</strong> YouTube removes fake
            subscribers during regular audits. You lose what you paid for.
          </li>
          <li>
            <strong>Video removal:</strong> Videos with artificially inflated
            views can be taken down
          </li>
          <li>
            <strong>Monetization denial:</strong> YouTube can deny Partner
            Program applications from channels with suspicious growth patterns
          </li>
          <li>
            <strong>Monetization suspension:</strong> Channels already in the
            Partner Program can lose monetization for fake engagement
          </li>
          <li>
            <strong>Channel strikes:</strong> Severe or repeated violations
            result in strikes that limit channel functionality
          </li>
          <li>
            <strong>Channel termination:</strong> Continued violations can
            result in permanent channel deletion
          </li>
        </ul>
        <p className={s.sectionText}>
          Even if you do not get caught immediately, the damage to your
          engagement rate continues to hurt your channel indefinitely. There
          is no version of this that works out well.
        </p>
      </section>

      {/* Safe Alternatives */}
      <section id="safe-alternatives" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </span>
          Safe Alternatives That Actually Work
        </h2>
        <p className={s.sectionText}>
          Real growth takes longer, but it builds a sustainable channel with
          an engaged audience. Here is what actually works:
        </p>
        <h3 className={s.subheading}>Improve Your Content</h3>
        <ul className={s.list}>
          <li>
            Study what works in your niche using{" "}
            <Link href="/learn/youtube-competitor-analysis">
              competitor analysis
            </Link>
          </li>
          <li>
            Focus on{" "}
            <Link href="/learn/youtube-retention-analysis">retention</Link> to
            keep viewers watching
          </li>
          <li>
            Find{" "}
            <Link href="/learn/youtube-video-ideas">
              video ideas with proven demand
            </Link>
          </li>
        </ul>
        <h3 className={s.subheading}>Optimize Your Packaging</h3>
        <ul className={s.list}>
          <li>
            Learn{" "}
            <Link href="/learn/youtube-seo">YouTube SEO fundamentals</Link>
          </li>
          <li>Test different thumbnails to improve click through rate</li>
          <li>Write titles that clearly communicate value</li>
        </ul>
        <h3 className={s.subheading}>Post Consistently</h3>
        <ul className={s.list}>
          <li>Pick a schedule you can maintain long term</li>
          <li>
            Consistency builds audience habits and signals reliability to the
            algorithm
          </li>
          <li>One good video per week beats ten mediocre videos</li>
        </ul>
        <h3 className={s.subheading}>Promote Authentically</h3>
        <ul className={s.list}>
          <li>
            Share videos in relevant communities where self-promotion is
            allowed
          </li>
          <li>Engage genuinely in niche communities (not just dropping links)</li>
          <li>Collaborate with creators at similar levels</li>
          <li>Cross-promote on other social platforms where you have presence</li>
        </ul>
        <h3 className={s.subheading}>Focus on Converting Viewers</h3>
        <ul className={s.list}>
          <li>
            Ask for the subscribe after delivering value, not at the start
          </li>
          <li>Create content that gives viewers a reason to return</li>
          <li>
            Track{" "}
            <Link href="/learn/how-to-get-more-subscribers">
              subscriber conversion
            </Link>{" "}
            to see what works
          </li>
        </ul>
        <p className={s.sectionText}>
          Real subscribers watch your videos, engage with your content, and
          help you grow organically. A channel with 500 engaged subscribers
          has more potential than one with 50,000 fake ones.
        </p>
      </section>

      {/* CTA Highlight */}
      <div className={s.highlight}>
        <p>
          <strong>Build real growth with real data.</strong> {BRAND.name}{" "}
          helps you find what actually works in your niche, track which
          content converts viewers to subscribers, and make decisions based on
          real analytics. No shortcuts, just insights.
        </p>
      </div>
    </>
  );
}
