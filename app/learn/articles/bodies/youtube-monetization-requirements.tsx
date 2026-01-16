/**
 * Body content for YouTube Monetization Requirements article.
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
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          </span>
          Monetization Overview
        </h2>
        <p className={s.sectionText}>
          YouTube monetization means earning money from your videos. The primary
          path is the YouTube Partner Program (YPP), which lets you earn from
          ads shown on your content.
        </p>
        <p className={s.sectionText}>
          Important: Do not try to shortcut these requirements by buying fake
          subscribers or views. See our guide on{" "}
          <Link href="/learn/free-youtube-subscribers">
            why fake growth destroys channels
          </Link>
          .
        </p>
      </section>

      {/* Requirements Checklist */}
      <section id="requirements-checklist" className={s.section}>
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
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </span>
          YouTube Monetization Requirements Checklist
        </h2>
        <ul className={s.list}>
          <li>
            <strong>1,000 subscribers</strong> on your channel
          </li>
          <li>
            <strong>
              4,000 public watch hours in the last 12 months OR 10 million
              public Shorts views in the last 90 days
            </strong>
          </li>
          <li>
            <strong>No active Community Guidelines strikes</strong>
          </li>
          <li>
            <strong>Two-step verification</strong> enabled
          </li>
          <li>
            <strong>Access to advanced features</strong> in YouTube Studio
          </li>
          <li>
            <strong>An AdSense account</strong> linked to your channel
          </li>
          <li>
            <strong>Live in an eligible country</strong>
          </li>
          <li>
            <strong>Follow YouTube monetization policies</strong>
          </li>
        </ul>
      </section>

      {/* Partner Program */}
      <section id="partner-program" className={s.section}>
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
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          </span>
          YouTube Partner Program
        </h2>
        <ul className={s.list}>
          <li>
            <strong>Ad revenue:</strong> Earn a share of advertising shown on
            your videos
          </li>
          <li>
            <strong>YouTube Premium revenue:</strong> Earn when Premium members
            watch
          </li>
          <li>
            <strong>Channel memberships:</strong> Offer paid monthly memberships
          </li>
          <li>
            <strong>Super Chat and Super Stickers:</strong> Earn from live
            streams
          </li>
          <li>
            <strong>Super Thanks:</strong> Earn from viewer tips on videos
          </li>
          <li>
            <strong>Shopping:</strong> Sell products directly from your videos
          </li>
        </ul>
        <p className={s.sectionText}>
          For actual earnings numbers, see our guide on{" "}
          <Link href="/learn/how-much-does-youtube-pay">
            how much YouTube pays
          </Link>
          .
        </p>
      </section>

      {/* How to Apply */}
      <section id="how-to-apply" className={s.section}>
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
          How to Apply for Monetization
        </h2>
        <ol className={s.numberedList}>
          <li>
            Open YouTube Studio and click <strong>Earn</strong>
          </li>
          <li>
            Click <strong>Apply</strong> if eligible
          </li>
          <li>Read and agree to Partner Program terms</li>
          <li>Sign up for Google AdSense</li>
          <li>Set your monetization preferences</li>
          <li>Submit your channel for review</li>
        </ol>
        <p className={s.sectionText}>
          YouTube typically reviews applications within 2 to 4 weeks.
        </p>
      </section>

      {/* While You Wait */}
      <section id="while-you-wait" className={s.section}>
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
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </span>
          What to Do While You Wait
        </h2>
        <h3 className={s.subheading}>For Subscribers</h3>
        <ul className={s.list}>
          <li>Create content that gives viewers a reason to come back</li>
          <li>Ask for the subscribe after delivering value</li>
          <li>Focus on your niche</li>
          <li>
            Check your{" "}
            <Link href="/learn/how-to-get-more-subscribers">
              subscriber conversion rate
            </Link>
          </li>
        </ul>
        <h3 className={s.subheading}>For Watch Hours</h3>
        <ul className={s.list}>
          <li>
            Improve{" "}
            <Link href="/learn/youtube-retention-analysis">retention</Link>
          </li>
          <li>Create longer videos if the content supports it</li>
          <li>Use playlists to encourage multiple video watches</li>
          <li>Focus on evergreen topics</li>
        </ul>
      </section>

      {/* Revenue Streams */}
      <section id="revenue-streams" className={s.section}>
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
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          </span>
          Revenue Streams Explained
        </h2>
        <h3 className={s.subheading}>Ad Revenue</h3>
        <p className={s.sectionText}>
          YouTube takes 45%, you keep 55%. Earnings vary by niche and audience
          location.
        </p>
        <h3 className={s.subheading}>Sponsorships</h3>
        <p className={s.sectionText}>
          Brands pay you directly. Does not require YPP.
        </p>
        <h3 className={s.subheading}>Affiliate Marketing</h3>
        <p className={s.sectionText}>
          Earn commission on sales through your links. Does not require YPP.
        </p>
        <h3 className={s.subheading}>Digital Products and Services</h3>
        <p className={s.sectionText}>
          Sell courses, templates, coaching related to your expertise.
        </p>
      </section>

      {/* Affiliate Basics */}
      <section id="affiliate-basics" className={s.section}>
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
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
          </span>
          Affiliate Marketing Basics
        </h2>
        <ol className={s.numberedList}>
          <li>Join affiliate programs related to your niche</li>
          <li>Mention products naturally in your content</li>
          <li>Add affiliate links in your description with disclosure</li>
          <li>Tell viewers about the links in the video</li>
          <li>Track what converts</li>
        </ol>
      </section>

      {/* Realistic Expectations */}
      <section id="realistic-expectations" className={s.section}>
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
              <path d="M18 20V10M12 20V4M6 20v-6" />
            </svg>
          </span>
          Realistic Expectations
        </h2>
        <ul className={s.list}>
          <li>
            <strong>Most channels earn little:</strong> Reaching 1,000
            subscribers is an accomplishment.
          </li>
          <li>
            <strong>Ad revenue alone is rarely enough:</strong> Successful
            creators diversify.
          </li>
          <li>
            <strong>Niche matters:</strong> Finance pays more than gaming.
          </li>
          <li>
            <strong>It takes time:</strong> Building sustainable income takes
            years.
          </li>
          <li>
            <strong>Consistency compounds:</strong> Regular uploads build
            audiences faster.
          </li>
        </ul>
      </section>

      {/* Mistakes */}
      <section id="mistakes" className={s.section}>
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
          Monetization Mistakes to Avoid
        </h2>
        <ul className={s.list}>
          <li>
            <strong>Buying fake subscribers or views:</strong> Gets your channel
            terminated.
          </li>
          <li>
            <strong>Focusing only on ad revenue:</strong> Diversify income
            streams.
          </li>
          <li>
            <strong>Ignoring community guidelines:</strong> Strikes delay
            monetization.
          </li>
          <li>
            <strong>Rushing content to hit thresholds:</strong> Low quality
            hurts long term.
          </li>
          <li>
            <strong>Not disclosing sponsorships:</strong> Required by law.
          </li>
          <li>
            <strong>Expecting immediate income:</strong> Keep improving.
          </li>
        </ul>
      </section>

      {/* CTA Highlight */}
      <div className={s.highlight}>
        <p>
          <strong>Track your path to monetization.</strong> {BRAND.name} shows
          you which videos drive subscribers and watch time, helping you reach
          thresholds faster with data driven decisions.
        </p>
      </div>
    </>
  );
}
