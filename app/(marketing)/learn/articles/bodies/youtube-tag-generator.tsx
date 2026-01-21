/**
 * Body content for YouTube Tag Generator article.
 * Server component - no "use client" directive.
 */

import Link from "next/link";
import type { BodyProps } from "./index";

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* What Are Tags */}
      <section id="what-are-tags" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
          </span>
          What Are YouTube Tags
        </h2>
        <p className={s.sectionText}>
          YouTube tags are keywords you add to your video to help YouTube understand
          your content. They are metadata hidden from viewers but visible to YouTube&apos;s
          systems.
        </p>
        <p className={s.sectionText}>
          Many creators search for a YouTube tag generator to find the perfect tags,
          but the truth is that tags have minimal impact on video performance in 2026.
          This guide explains how to add tags to YouTube videos effectively without
          wasting time.
        </p>
      </section>

      {/* Do Tags Matter */}
      <section id="do-tags-matter" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </span>
          Do Tags Still Matter in 2026
        </h2>
        <p className={s.sectionText}>
          YouTube has stated that tags have minimal impact on video ranking. Their
          official documentation says tags are &quot;most useful for commonly misspelled words.&quot;
        </p>
        <h3 className={s.subheading}>What Tags Actually Do</h3>
        <ul className={s.list}>
          <li><strong>Help YouTube categorize content</strong> when title/description are unclear</li>
          <li><strong>Assist with misspellings</strong> if your topic has common variations</li>
          <li><strong>Provide minor topical signals</strong> for related video suggestions</li>
        </ul>
        <h3 className={s.subheading}>What Tags Do NOT Do</h3>
        <ul className={s.list}>
          <li><strong>Significantly affect ranking</strong> in search results</li>
          <li><strong>Boost your video</strong> in recommendations</li>
          <li><strong>Replace good content</strong> or strong packaging</li>
          <li><strong>Make up for poor retention</strong> or low engagement</li>
        </ul>
        <div className={s.highlight}>
          <p>
            <strong>Reality check:</strong> A video with perfect tags and poor retention
            will be outperformed by a video with no tags and excellent retention. Focus
            your optimization efforts accordingly.
          </p>
        </div>
      </section>

      {/* Finding Tags */}
      <section id="finding-tags" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </span>
          How to Find Good Tags
        </h2>
        <p className={s.sectionText}>
          Since tags have limited impact, spend minimal time finding them. Here are
          quick methods that work.
        </p>
        <h3 className={s.subheading}>YouTube Autocomplete</h3>
        <ol className={s.numberedList}>
          <li>Type your main topic in YouTube search</li>
          <li>Note the autocomplete suggestions</li>
          <li>These are actual search queries</li>
          <li>Use the most relevant as tags</li>
        </ol>
        <h3 className={s.subheading}>Your Video Content</h3>
        <ul className={s.list}>
          <li>Your main keyword or phrase</li>
          <li>Variations and synonyms</li>
          <li>Related topics you cover in the video</li>
          <li>Your channel name</li>
        </ul>
        <h3 className={s.subheading}>Competitor Research</h3>
        <ul className={s.list}>
          <li>You can view competitor tags via page source or extensions</li>
          <li>Note: Copying their tags will not help you rank</li>
          <li>Use for inspiration, not duplication</li>
        </ul>
      </section>

      {/* Tag Best Practices */}
      <section id="tag-best-practices" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </span>
          Tag Best Practices
        </h2>
        <h3 className={s.subheading}>How Many Tags to Use</h3>
        <ul className={s.list}>
          <li><strong>Recommendation:</strong> 3-5 focused, relevant tags</li>
          <li><strong>Maximum:</strong> YouTube allows 500 characters</li>
          <li><strong>More is not better:</strong> Relevance matters more than quantity</li>
        </ul>
        <h3 className={s.subheading}>What Makes a Good Tag</h3>
        <ul className={s.list}>
          <li><strong>Directly relevant</strong> to your video content</li>
          <li><strong>Specific</strong> rather than overly broad</li>
          <li><strong>Natural language</strong> that people actually search</li>
          <li><strong>No misleading terms</strong> just to get clicks</li>
        </ul>
        <h3 className={s.subheading}>How to Add Tags</h3>
        <ol className={s.numberedList}>
          <li>Go to YouTube Studio</li>
          <li>Click <strong>Content</strong> in the left menu</li>
          <li>Select your video and click <strong>Details</strong></li>
          <li>Click <strong>Show More</strong> to reveal the Tags field</li>
          <li>Enter tags separated by commas</li>
          <li>Click <strong>Save</strong></li>
        </ol>
      </section>

      {/* Tags vs Hashtags */}
      <section id="tags-vs-hashtags" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="9" x2="20" y2="9" />
              <line x1="4" y1="15" x2="20" y2="15" />
              <line x1="10" y1="3" x2="8" y2="21" />
              <line x1="16" y1="3" x2="14" y2="21" />
            </svg>
          </span>
          Tags vs Hashtags
        </h2>
        <p className={s.sectionText}>
          Tags and hashtags are different features with different purposes.
        </p>
        <h3 className={s.subheading}>Tags (Hidden Metadata)</h3>
        <ul className={s.list}>
          <li>Added in the Tags field in YouTube Studio</li>
          <li>Hidden from viewers</li>
          <li>Help YouTube categorize your video</li>
          <li>Minimal impact on discovery</li>
        </ul>
        <h3 className={s.subheading}>Hashtags (Visible Links)</h3>
        <ul className={s.list}>
          <li>Added with # in title or description</li>
          <li>Visible to viewers and clickable</li>
          <li>Link to a results page for that hashtag</li>
          <li>First 3 appear above your video title</li>
        </ul>
        <h3 className={s.subheading}>Best Hashtags for YouTube</h3>
        <ul className={s.list}>
          <li>Use 3-5 relevant hashtags in your description</li>
          <li>Include your main topic and niche identifiers</li>
          <li>Avoid overly broad hashtags where you will be lost</li>
          <li>Hashtags in the title are more visible</li>
        </ul>
      </section>

      {/* Tag Tools */}
      <section id="tag-tools" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
            </svg>
          </span>
          Tag Generator Tools
        </h2>
        <p className={s.sectionText}>
          Various tools can generate tags for your videos. Use them wisely.
        </p>
        <h3 className={s.subheading}>YouTube Tag Generators</h3>
        <ul className={s.list}>
          <li><strong>RapidTags:</strong> Free tag generator based on your keyword</li>
          <li><strong>TubeBuddy:</strong> Tag suggestions within YouTube Studio</li>
          <li><strong>vidIQ:</strong> Tag recommendations and competitor tag viewing</li>
          <li><strong>Keyword Tool:</strong> YouTube-specific keyword and tag research</li>
        </ul>
        <h3 className={s.subheading}>How to Use Tag Tools</h3>
        <ul className={s.list}>
          <li>Enter your main topic or keyword</li>
          <li>Review the suggestions for relevance</li>
          <li>Select 3-5 that actually fit your video</li>
          <li>Do not blindly copy all suggested tags</li>
        </ul>
        <h3 className={s.subheading}>Tag Extractor Tools</h3>
        <ul className={s.list}>
          <li>Show tags on competitor videos</li>
          <li>Browser extensions or web-based tools</li>
          <li>Remember: their tags are not why they rank</li>
        </ul>
      </section>

      {/* What Matters More */}
      <section id="what-matters-more" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </span>
          What Matters More Than Tags
        </h2>
        <p className={s.sectionText}>
          Instead of obsessing over tags, focus on these factors that actually
          determine video performance.
        </p>
        <h3 className={s.subheading}>Title (Very Important)</h3>
        <ul className={s.list}>
          <li>Include your target keyword naturally</li>
          <li>Make it compelling and clear</li>
          <li>Keep under 60 characters to avoid truncation</li>
        </ul>
        <h3 className={s.subheading}>Thumbnail (Very Important)</h3>
        <ul className={s.list}>
          <li>Stands out in search and browse</li>
          <li>Readable at small sizes</li>
          <li>Complements (not repeats) the title</li>
        </ul>
        <h3 className={s.subheading}>Retention (Most Important)</h3>
        <ul className={s.list}>
          <li>How long viewers actually watch</li>
          <li>The strongest signal for recommendations</li>
          <li>No amount of tags compensates for poor retention</li>
        </ul>
        <h3 className={s.subheading}>Engagement (Important)</h3>
        <ul className={s.list}>
          <li>Likes, comments, shares</li>
          <li>Subscriber conversion</li>
          <li>Session time (do viewers keep watching YouTube?)</li>
        </ul>
        <p className={s.sectionText}>
          For complete optimization strategies, see our{" "}
          <Link href="/learn/youtube-seo">YouTube SEO guide</Link>.
        </p>
      </section>

      {/* CTA */}
      <div className={s.highlight}>
        <p>
          <strong>Spend your time wisely.</strong> Add 3-5 relevant tags in 30 seconds,
          then move on. Your title, thumbnail, and content quality will determine your
          video&apos;s success far more than any tag optimization.
        </p>
      </div>
    </>
  );
}
