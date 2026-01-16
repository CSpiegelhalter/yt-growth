/**
 * Body content for How to Make a YouTube Channel article.
 * Server component - no "use client" directive.
 */

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import type { BodyProps } from "./index";

export function Body({ s }: BodyProps) {
  return (
    <>
      <section id="why-start" className={s.section}>
        <h2 className={s.sectionTitle}>Why Start a YouTube Channel</h2>
        <p className={s.sectionText}>
          YouTube is the second largest search engine and the second most visited website in the world. Starting a YouTube channel gives you access to this massive audience.
        </p>
        <p className={s.sectionText}>
          Unlike social media posts that disappear, YouTube videos can bring in views for years. The barrier to entry is low, but success requires consistency, learning, and patience.
        </p>
      </section>

      <section id="setup-checklist" className={s.section}>
        <h2 className={s.sectionTitle}>15 Minute Setup Checklist</h2>
        <ol className={s.numberedList}>
          <li>Sign in to YouTube with a Google account</li>
          <li>Click your profile icon in the top right corner</li>
          <li>Select &ldquo;Create a channel&rdquo;</li>
          <li>Choose a channel name</li>
          <li>Upload a profile picture (at least 800x800 pixels)</li>
          <li>Add a banner image (2560x1440 pixels recommended)</li>
          <li>Write a channel description</li>
          <li>Add channel links</li>
          <li>Create a channel trailer (optional)</li>
          <li>Upload your first video when ready</li>
        </ol>
      </section>

      <section id="create-account" className={s.section}>
        <h2 className={s.sectionTitle}>Create Your Google Account</h2>
        <h3 className={s.subheading}>Personal vs Brand Account</h3>
        <ul className={s.list}>
          <li><strong>Personal channel:</strong> Uses your Google account name. Simple to set up.</li>
          <li><strong>Brand Account:</strong> Uses a separate business name. Allows multiple managers.</li>
        </ul>
      </section>

      <section id="create-channel" className={s.section}>
        <h2 className={s.sectionTitle}>Create Your YouTube Channel</h2>
        <ol className={s.numberedList}>
          <li>Go to youtube.com and sign in</li>
          <li>Click your profile picture in the top right corner</li>
          <li>Click &ldquo;Create a channel&rdquo;</li>
          <li>Confirm your name or click &ldquo;Use a custom name&rdquo;</li>
          <li>Click &ldquo;Create channel&rdquo;</li>
        </ol>
      </section>

      <section id="channel-customization" className={s.section}>
        <h2 className={s.sectionTitle}>Channel Customization</h2>
        <h3 className={s.subheading}>Basic Info</h3>
        <ul className={s.list}>
          <li><strong>Channel name:</strong> Memorable, easy to spell, relevant to your content</li>
          <li><strong>Handle:</strong> Your unique @username</li>
          <li><strong>Description:</strong> Explain what your channel is about in 2 to 3 sentences</li>
        </ul>
        <h3 className={s.subheading}>Branding</h3>
        <ul className={s.list}>
          <li><strong>Profile picture:</strong> 800x800 pixels minimum</li>
          <li><strong>Banner image:</strong> 2560x1440 pixels</li>
          <li><strong>Video watermark:</strong> Optional small logo</li>
        </ul>
      </section>

      <section id="first-video" className={s.section}>
        <h2 className={s.sectionTitle}>Your First Video</h2>
        <h3 className={s.subheading}>What to Make First</h3>
        <ul className={s.list}>
          <li><strong>Introduction video:</strong> Who you are and what the channel covers</li>
          <li><strong>Tutorial or how to:</strong> Teach something you know</li>
          <li><strong>Answer a common question:</strong> What do people in your niche ask?</li>
        </ul>
        <h3 className={s.subheading}>Basic Equipment</h3>
        <ul className={s.list}>
          <li><strong>Camera:</strong> Your smartphone is fine to start</li>
          <li><strong>Audio:</strong> A basic external microphone improves quality significantly</li>
          <li><strong>Lighting:</strong> Natural light or a cheap ring light</li>
          <li><strong>Editing software:</strong> Free options like DaVinci Resolve work well</li>
        </ul>
        <p className={s.sectionText}>
          For help with <Link href="/learn/youtube-video-ideas">video ideas</Link>, see our guide.
        </p>
      </section>

      <section id="channel-settings" className={s.section}>
        <h2 className={s.sectionTitle}>Important Settings</h2>
        <h3 className={s.subheading}>Upload Defaults</h3>
        <p className={s.sectionText}>Set default visibility, category, language in Settings → Upload defaults.</p>
        <h3 className={s.subheading}>Community Settings</h3>
        <ul className={s.list}>
          <li>Comment moderation</li>
          <li>Blocked words</li>
          <li>Approved users</li>
        </ul>
      </section>

      <section id="mistakes" className={s.section}>
        <h2 className={s.sectionTitle}>Common Beginner Mistakes</h2>
        <ul className={s.list}>
          <li><strong>Waiting for perfect equipment:</strong> Start with what you have.</li>
          <li><strong>No niche focus:</strong> Channels that cover everything struggle.</li>
          <li><strong>Ignoring thumbnails and titles:</strong> Learn packaging early.</li>
          <li><strong>Inconsistent uploads:</strong> Consistency builds audience habits.</li>
          <li><strong>Giving up too early:</strong> Most channels take months or years.</li>
          <li><strong>Buying fake subscribers:</strong> See our guide on <Link href="/learn/free-youtube-subscribers">why fake growth hurts</Link>.</li>
        </ul>
      </section>

      <section id="next-steps" className={s.section}>
        <h2 className={s.sectionTitle}>What to Do After Setup</h2>
        <ol className={s.numberedList}>
          <li><Link href="/learn/youtube-video-ideas">Find video ideas</Link></li>
          <li>Create your first 10 videos</li>
          <li><Link href="/learn/youtube-channel-audit">Learn to read your analytics</Link></li>
          <li>Study your niche with <Link href="/learn/youtube-competitor-analysis">competitor analysis</Link></li>
          <li>Improve your packaging</li>
          <li>Build toward <Link href="/learn/youtube-monetization-requirements">monetization</Link></li>
        </ol>
      </section>

      <div className={s.highlight}>
        <p>
          <strong>Ready to grow your new channel?</strong> {BRAND.name} helps you find video ideas that work in your niche, track what is performing, and identify opportunities you might miss.
        </p>
      </div>
    </>
  );
}
