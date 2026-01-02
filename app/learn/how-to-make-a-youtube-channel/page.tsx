import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import {
  LearnStaticCTA,
  TableOfContents,
  ArticleMeta,
} from "@/components/learn";
import {
  LEARN_ARTICLES,
  learnArticles,
  generateLearnArticleSchema,
  generateFaqSchema,
  getRelatedArticles,
} from "../articles";
import { generateBreadcrumbSchema } from "@/lib/seo";
import s from "../style.module.css";

const ARTICLE = LEARN_ARTICLES["how-to-make-a-youtube-channel"];

export const metadata: Metadata = {
  title: ARTICLE.title,
  description: ARTICLE.metaDescription,
  keywords: [...ARTICLE.keywords],
  alternates: {
    canonical: `${BRAND.url}/learn/${ARTICLE.slug}`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: ARTICLE.title,
    description: ARTICLE.metaDescription,
    url: `${BRAND.url}/learn/${ARTICLE.slug}`,
    type: "article",
    publishedTime: ARTICLE.datePublished,
    modifiedTime: ARTICLE.dateModified,
    authors: [`${BRAND.name} Team`],
  },
  twitter: {
    card: "summary_large_image",
    title: ARTICLE.shortTitle,
    description: ARTICLE.metaDescription,
  },
};

const articleSchema = generateLearnArticleSchema(ARTICLE);
const faqSchema = generateFaqSchema(ARTICLE.faqs);
const breadcrumbSchema = generateBreadcrumbSchema([
  { name: "Home", url: BRAND.url },
  { name: "Learn", url: `${BRAND.url}/learn` },
  { name: ARTICLE.shortTitle, url: `${BRAND.url}/learn/${ARTICLE.slug}` },
]);

export default function HowToMakeAYouTubeChannelPage() {
  const relatedArticles = getRelatedArticles(ARTICLE.slug);

  return (
    <main className={s.page}>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Article Navigation */}
      <nav className={s.articleNav} aria-label="Learn topics">
        <span className={s.articleNavLabel}>Topics:</span>
        {learnArticles.map((article) => (
          <Link
            key={article.slug}
            href={`/learn/${article.slug}`}
            className={`${s.articleNavLink} ${
              article.slug === ARTICLE.slug ? s.articleNavLinkActive : ""
            }`}
          >
            {article.label}
          </Link>
        ))}
      </nav>

      {/* Hero */}
      <header className={s.hero}>
        <nav className={s.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Home</Link> / <Link href="/learn">Learn</Link> /{" "}
          {ARTICLE.shortTitle}
        </nav>
        <h1 className={s.title}>
          How to Make a YouTube Channel: Complete Setup Guide
        </h1>
        <p className={s.subtitle}>
          Ready to start your YouTube journey? This guide walks you through
          creating a YouTube channel step by step, from account setup to your
          first upload.
        </p>
        <ArticleMeta
          dateModified={ARTICLE.dateModified}
          readingTime={ARTICLE.readingTime}
        />
      </header>

      {/* Table of Contents */}
      <TableOfContents items={ARTICLE.toc} />

      {/* Content */}
      <article className={s.content}>
        {/* Why Start */}
        <section id="why-start" className={s.section}>
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
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </span>
            Why Start a YouTube Channel
          </h2>
          <p className={s.sectionText}>
            YouTube is the second largest search engine and the second most
            visited website in the world. It is where people go to learn, be
            entertained, and discover new creators. Starting a YouTube channel
            gives you access to this massive audience.
          </p>
          <p className={s.sectionText}>
            Whether you want to build a personal brand, grow a business, share
            your expertise, or just have fun creating content, YouTube provides
            the platform. And unlike social media posts that disappear, YouTube
            videos can bring in views for years.
          </p>
          <p className={s.sectionText}>
            The barrier to entry is low. You can start with a smartphone and an
            idea. But success requires consistency, learning, and patience. This
            guide covers the technical setup. Growing your channel requires
            ongoing work on content quality and understanding your audience.
          </p>
        </section>

        {/* Setup Checklist */}
        <section id="setup-checklist" className={s.section}>
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
            15 Minute Setup Checklist
          </h2>
          <p className={s.sectionText}>
            You can get your YouTube channel created and ready in about 15
            minutes. Here is the quick version:
          </p>
          <ol className={s.numberedList}>
            <li>
              <strong>Sign in to YouTube</strong> with a Google account (create
              one if needed)
            </li>
            <li>
              <strong>Click your profile icon</strong> in the top right corner
            </li>
            <li>
              <strong>Select &ldquo;Create a channel&rdquo;</strong> from the
              dropdown
            </li>
            <li>
              <strong>Choose a channel name</strong> (you can change this later)
            </li>
            <li>
              <strong>Upload a profile picture</strong> (at least 800x800
              pixels)
            </li>
            <li>
              <strong>Add a banner image</strong> (2560x1440 pixels recommended)
            </li>
            <li>
              <strong>Write a channel description</strong> explaining what you
              make
            </li>
            <li>
              <strong>Add channel links</strong> to your website or social media
            </li>
            <li>
              <strong>Create a channel trailer</strong> (optional, but
              recommended)
            </li>
            <li>
              <strong>Upload your first video</strong> when ready
            </li>
          </ol>
          <p className={s.sectionText}>
            The rest of this guide explains each step in detail.
          </p>
        </section>

        {/* Create Account */}
        <section id="create-account" className={s.section}>
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
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            Create Your Google Account
          </h2>
          <p className={s.sectionText}>
            YouTube channels are connected to Google accounts. If you already
            have Gmail or use any Google service, you can use that account. If
            not, you need to create one first.
          </p>
          <h3 className={s.subheading}>Personal vs Brand Account</h3>
          <p className={s.sectionText}>
            You have two options:
          </p>
          <ul className={s.list}>
            <li>
              <strong>Personal channel:</strong> Uses your Google account name.
              Simple to set up. Good for individual creators.
            </li>
            <li>
              <strong>Brand Account:</strong> Uses a separate business name.
              Allows multiple managers. Better for businesses or teams.
            </li>
          </ul>
          <p className={s.sectionText}>
            Most new creators start with a personal channel. You can switch to a
            Brand Account later if needed. The important thing is to get
            started.
          </p>
        </section>

        {/* Create Channel */}
        <section id="create-channel" className={s.section}>
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
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <path d="M12 8v8M8 12h8" />
              </svg>
            </span>
            Create Your YouTube Channel
          </h2>
          <p className={s.sectionText}>
            Here is exactly how to create a YouTube channel:
          </p>
          <ol className={s.numberedList}>
            <li>Go to youtube.com and sign in with your Google account</li>
            <li>Click your profile picture in the top right corner</li>
            <li>Click &ldquo;Create a channel&rdquo; in the dropdown menu</li>
            <li>
              For a personal channel, confirm your name. For a Brand Account,
              click &ldquo;Use a custom name&rdquo; and enter your channel name.
            </li>
            <li>Click &ldquo;Create channel&rdquo;</li>
          </ol>
          <p className={s.sectionText}>
            That is it. Your channel now exists. The next step is to customize
            it so it looks professional and communicates what your channel is
            about.
          </p>
        </section>

        {/* Channel Customization */}
        <section id="channel-customization" className={s.section}>
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
            Channel Customization
          </h2>
          <p className={s.sectionText}>
            Go to YouTube Studio and click &ldquo;Customization&rdquo; in the
            left menu. You will see three tabs: Layout, Branding, and Basic
            info.
          </p>
          <h3 className={s.subheading}>Basic Info</h3>
          <ul className={s.list}>
            <li>
              <strong>Channel name:</strong> Keep it memorable, easy to spell,
              and relevant to your content
            </li>
            <li>
              <strong>Handle:</strong> Your unique @username. Choose something
              consistent with other social media
            </li>
            <li>
              <strong>Description:</strong> Explain what your channel is about
              in 2 to 3 sentences. Include keywords naturally.
            </li>
            <li>
              <strong>Links:</strong> Add your website, social media, or other
              relevant links
            </li>
          </ul>
          <h3 className={s.subheading}>Branding</h3>
          <ul className={s.list}>
            <li>
              <strong>Profile picture:</strong> 800x800 pixels minimum. Use a
              clear image of your face or a simple logo.
            </li>
            <li>
              <strong>Banner image:</strong> 2560x1440 pixels. Shows at the top
              of your channel page. Include your upload schedule or content
              promise.
            </li>
            <li>
              <strong>Video watermark:</strong> Optional. A small logo that
              appears on your videos. Can include subscribe button
              functionality.
            </li>
          </ul>
          <h3 className={s.subheading}>Layout</h3>
          <ul className={s.list}>
            <li>
              <strong>Channel trailer:</strong> A short video introducing
              yourself to non-subscribers. Keep it under 60 seconds.
            </li>
            <li>
              <strong>Featured video:</strong> What returning subscribers see.
              Often your latest or best video.
            </li>
            <li>
              <strong>Sections:</strong> Organize your videos into playlists and
              categories on your channel page
            </li>
          </ul>
        </section>

        {/* Branding Basics */}
        <section id="branding-basics" className={s.section}>
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
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <path d="M22 6l-10 7L2 6" />
              </svg>
            </span>
            Branding Basics
          </h2>
          <p className={s.sectionText}>
            Consistent branding helps viewers recognize your content. You do not
            need to be a designer to create effective branding.
          </p>
          <h3 className={s.subheading}>Choosing a Channel Name</h3>
          <ul className={s.list}>
            <li>Easy to spell and remember</li>
            <li>Available on other platforms (check Twitter, Instagram, etc.)</li>
            <li>Hints at your content type without being too restrictive</li>
            <li>Avoid numbers, underscores, or special characters</li>
          </ul>
          <h3 className={s.subheading}>Visual Identity</h3>
          <p className={s.sectionText}>
            Pick 2 to 3 colors and 1 to 2 fonts you will use consistently. Your
            thumbnails, profile picture, and banner should feel cohesive. Free
            tools like Canva have templates specifically for YouTube.
          </p>
          <p className={s.sectionText}>
            Do not overthink it at the start. Many successful channels started
            with basic branding and refined it over time. The most important
            thing is that your content is good.
          </p>
        </section>

        {/* First Video */}
        <section id="first-video" className={s.section}>
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
                <path d="M23 7l-7 5 7 5V7z" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </span>
            Your First Video
          </h2>
          <p className={s.sectionText}>
            Your first video does not need to be perfect. It needs to exist.
            Most successful creators cringe at their early content. That is
            normal. You learn by doing.
          </p>
          <h3 className={s.subheading}>What to Make First</h3>
          <ul className={s.list}>
            <li>
              <strong>Introduction video:</strong> Who you are and what the
              channel will cover. Can double as your channel trailer.
            </li>
            <li>
              <strong>Tutorial or how to:</strong> Teach something you know.
              These are evergreen and help with search traffic.
            </li>
            <li>
              <strong>Answer a common question:</strong> What do people in your
              niche always ask about?
            </li>
          </ul>
          <h3 className={s.subheading}>Basic Equipment Checklist</h3>
          <ul className={s.list}>
            <li>
              <strong>Camera:</strong> Your smartphone is fine to start
            </li>
            <li>
              <strong>Audio:</strong> A basic external microphone improves
              quality significantly. Audio matters more than video quality.
            </li>
            <li>
              <strong>Lighting:</strong> Natural light from a window, or a cheap
              ring light
            </li>
            <li>
              <strong>Editing software:</strong> Free options like DaVinci
              Resolve or CapCut work well
            </li>
          </ul>
          <p className={s.sectionText}>
            For help with{" "}
            <Link href="/learn/youtube-video-ideas">video ideas</Link>, see our
            guide on finding topics that get views.
          </p>
        </section>

        {/* Important Settings */}
        <section id="channel-settings" className={s.section}>
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
            Important Settings
          </h2>
          <p className={s.sectionText}>
            Before you start uploading, configure these settings in YouTube
            Studio:
          </p>
          <h3 className={s.subheading}>Upload Defaults</h3>
          <p className={s.sectionText}>
            Go to Settings, then Upload defaults. Set your default visibility
            (public, unlisted, or private), category, language, and any standard
            description text you want on every video.
          </p>
          <h3 className={s.subheading}>Community Settings</h3>
          <ul className={s.list}>
            <li>
              <strong>Comment moderation:</strong> Decide whether to hold
              comments for review or allow them immediately
            </li>
            <li>
              <strong>Blocked words:</strong> Add words you want auto-filtered
              from comments
            </li>
            <li>
              <strong>Approved users:</strong> Users whose comments always
              appear without review
            </li>
          </ul>
          <h3 className={s.subheading}>Channel Permissions</h3>
          <p className={s.sectionText}>
            If you will have others help manage your channel, go to Settings,
            then Permissions to add managers with appropriate access levels.
          </p>
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
            Common Beginner Mistakes
          </h2>
          <ul className={s.list}>
            <li>
              <strong>Waiting for perfect equipment:</strong> Start with what
              you have. Upgrade as you learn what you actually need.
            </li>
            <li>
              <strong>No niche focus:</strong> Channels that try to cover
              everything struggle to build an audience. Pick a focus.
            </li>
            <li>
              <strong>Ignoring thumbnails and titles:</strong> Great content
              with bad packaging does not get clicked. Learn packaging early.
            </li>
            <li>
              <strong>Inconsistent uploads:</strong> Pick a schedule you can
              maintain and stick to it. Consistency builds audience habits.
            </li>
            <li>
              <strong>Not studying analytics:</strong> YouTube Studio tells you
              what is working. Use that data to improve.
            </li>
            <li>
              <strong>Giving up too early:</strong> Most channels take months or
              years to gain traction. Patience and persistence matter.
            </li>
            <li>
              <strong>Buying fake subscribers:</strong> This destroys your
              engagement rate and can get your channel terminated. Never do
              this. See our guide on{" "}
              <Link href="/learn/free-youtube-subscribers">
                why fake growth hurts your channel
              </Link>
              .
            </li>
          </ul>
        </section>

        {/* Next Steps */}
        <section id="next-steps" className={s.section}>
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
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
            What to Do After Setup
          </h2>
          <p className={s.sectionText}>
            Your channel is created. Now the real work begins. Here is what to
            focus on:
          </p>
          <ol className={s.numberedList}>
            <li>
              <strong>
                <Link href="/learn/youtube-video-ideas">Find video ideas</Link>:
              </strong>{" "}
              Research what your target audience wants to watch
            </li>
            <li>
              <strong>Create your first 10 videos:</strong> Focus on quality and
              consistency. These early videos help you find your style.
            </li>
            <li>
              <strong>
                <Link href="/learn/youtube-channel-audit">
                  Learn to read your analytics
                </Link>
                :
              </strong>{" "}
              Understand what is working and what needs improvement
            </li>
            <li>
              <strong>Study your niche:</strong> Watch what successful channels
              do. Learn from their{" "}
              <Link href="/learn/youtube-competitor-analysis">
                patterns without copying
              </Link>
            </li>
            <li>
              <strong>Improve your packaging:</strong> Your thumbnails and
              titles determine whether people click. Keep testing.
            </li>
            <li>
              <strong>Build toward monetization:</strong> Once you hit 1,000
              subscribers and 4,000 watch hours, you can{" "}
              <Link href="/learn/youtube-monetization-requirements">
                apply for the Partner Program
              </Link>
            </li>
          </ol>
        </section>

        {/* CTA Highlight */}
        <div className={s.highlight}>
          <p>
            <strong>Ready to grow your new channel?</strong> {BRAND.name} helps
            you find video ideas that work in your niche, track what is
            performing, and identify opportunities you might miss. Get data
            driven insights to grow faster.
          </p>
        </div>

        {/* FAQ */}
        <section id="faq" className={s.faqSection}>
          <h2 className={s.faqTitle}>Frequently Asked Questions</h2>
          <div className={s.faqList}>
            {ARTICLE.faqs.map((faq, index) => (
              <details key={index} className={s.faqItem}>
                <summary className={s.faqQuestion}>
                  <span className={s.faqQuestionText}>{faq.question}</span>
                  <svg className={s.faqChevron} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </summary>
                <p className={s.faqAnswer}>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Related Articles */}
        <nav className={s.related} aria-label="Related articles">
          <h3 className={s.relatedTitle}>Continue Learning</h3>
          <div className={s.relatedLinks}>
            {relatedArticles.map((article) => (
              <Link
                key={article.slug}
                href={`/learn/${article.slug}`}
                className={s.relatedLink}
              >
                {article.title}
              </Link>
            ))}
          </div>
        </nav>

        {/* CTA */}
        <LearnStaticCTA
          title="Get Your New Channel Growing"
          description={`${BRAND.name} shows you what works in your niche, tracks your progress, and helps you make better content decisions.`}
        />
      </article>
    </main>
  );
}
