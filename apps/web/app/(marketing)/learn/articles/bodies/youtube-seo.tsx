/**
 * Body content for YouTube SEO article.
 * Server component - no "use client" directive.
 *
 * IMPLEMENTATION PLAN:
 * - Two-engine SEO concept: Relevance + Satisfaction working together
 * - Convert walls of lists into card grids, panels, and visual callouts
 * - 12 brand-new inline SVG visuals distributed throughout
 * - Mobile-first layouts that stack cleanly
 * - Keep existing section IDs for SEO anchors
 * - Minimal UL/OL usage; prefer cards and pills
 *
 * CHECKLIST:
 * - [x] IDs unchanged
 * - [x] Minimal UL/OL
 * - [x] Mobile stacking via existing CSS classes
 * - [x] No unused imports
 * - [x] Links preserved with descriptive anchor text
 * - [x] SVG accessibility: title/desc for informational, aria-hidden for decorative
 */

import Link from "next/link";
import { LEARN_ARTICLES } from "../../articles";
import type { BodyProps, ArticleMeta } from "./_shared";
import { tocFromArticle } from "./_shared";

const _article = LEARN_ARTICLES["youtube-seo"];

export const meta: ArticleMeta = {
  slug: _article.slug,
  title: _article.title,
  description: _article.description,
};

export const toc = tocFromArticle(_article.toc);

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* What is YouTube SEO */}
      <section id="what-is-youtube-seo" className="sectionOpen">
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          What is YouTube SEO
        </h2>

        <p className={s.sectionText}>
          YouTube SEO is the practice of making your videos easy to find and
          hard to ignore. Unlike website SEO where keywords dominate, YouTube
          runs on two engines working together: <strong>relevance</strong> and{" "}
          <strong>satisfaction</strong>.
        </p>

        <div className="inlineIllustration">
          <TwoEngineSEO />
        </div>

        <p className={s.sectionText}>
          Relevance comes from metadata: your title, description, and captions
          tell YouTube what your video is about. Satisfaction comes from viewer
          behavior: do people click, watch, and stay on the platform? A video
          with perfect metadata but poor retention will not rank. A video that
          keeps viewers watching but has unclear metadata will not be discovered.
        </p>

        <p className={s.sectionText}>
          This guide covers both systems and how to make them work for you.
        </p>
      </section>

      {/* SEO Checklist - Preflight Panel */}
      <section id="seo-checklist" className="sectionTinted">
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </span>
          Preflight: What to Check Before You Publish
        </h2>

        <p className={s.sectionText}>
          Run through these checks before every upload. Each one addresses
          either relevance (helping YouTube understand your content) or
          satisfaction (helping viewers get value).
        </p>

        <div className="inlineIllustration">
          <TitleTapeMeasure />
        </div>

        <div className="frameworkSteps">
          <PreflightCard
            label="Packaging"
            checks="Title under 60 characters with keyword early. Thumbnail readable at phone size. Title and thumbnail work together."
          />
          <PreflightCard
            label="Topic Clarity"
            checks="Description opens with the topic. Captions accurate. Keyword appears naturally in speech."
          />
          <PreflightCard
            label="Viewer Promise"
            checks="Video delivers what title promises. Payoff arrives early, not at the end."
          />
          <PreflightCard
            label="Navigation"
            checks="End screen links to relevant next video. Cards placed at natural transition points."
          />
          <PreflightCard
            label="Chapters"
            checks="Timestamps added for videos over 5 minutes. Labels describe what each section covers."
          />
          <PreflightCard
            label="Hook"
            checks="First 10 seconds establish the value. No slow intros or unnecessary setup."
          />
        </div>
      </section>

      {/* How YouTube Ranks */}
      <section id="how-youtube-ranks" className="sectionOpen">
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M18 20V10M12 20V4M6 20v-6" />
            </svg>
          </span>
          How YouTube Ranks Videos
        </h2>

        <p className={s.sectionText}>
          YouTube asks two questions about every video: Is this relevant to what
          the viewer wants? Will this video satisfy them and keep them watching?
        </p>

        <div className="inlineIllustration">
          <RankingVendingMachine />
        </div>

        <div className="comparisonGrid">
          <div className="comparisonItem comparisonItem--neutral">
            <p className="comparisonItem__label">Relevance Signals</p>
            <div className="comparisonItem__content">
              <p>
                <strong>Title match:</strong> Does it align with search queries?
              </p>
              <p>
                <strong>Description context:</strong> Does it explain the topic?
              </p>
              <p>
                <strong>Captions:</strong> What words appear in the video?
              </p>
              <p>
                <strong>Tags:</strong> Minor signal for ambiguous topics.
              </p>
            </div>
          </div>
          <div className="comparisonItem comparisonItem--neutral">
            <p className="comparisonItem__label">Satisfaction Signals</p>
            <div className="comparisonItem__content">
              <p>
                <strong>Click-through rate:</strong> How often do people click?
              </p>
              <p>
                <strong>Watch time:</strong> How long do they stay?
              </p>
              <p>
                <strong>Session time:</strong> Do they keep watching YouTube?
              </p>
              <p>
                <strong>Engagement:</strong> Likes, comments, shares.
              </p>
            </div>
          </div>
        </div>

        <div className="realTalk">
          <p className="realTalk__label">The bottom line</p>
          <p className="realTalk__text">
            Metadata helps you get discovered. Retention determines how far your
            video spreads. You need both.
          </p>
        </div>
      </section>

      {/* Title Optimization */}
      <section id="title-optimization" className="sectionOpen">
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </span>
          Title Optimization
        </h2>

        <p className={s.sectionText}>
          Your title does two jobs: it tells YouTube what your video is about,
          and it convinces viewers to click. Both matter.
        </p>

        <div className="inlineIllustration">
          <MetadataMagnifyingGlass />
        </div>

        <div className="funCallout">
          <p className="funCallout__text">
            <strong>The 60-character rule:</strong> YouTube truncates titles
            around 60 characters on most surfaces. Put your main keyword and
            hook in the first half.
          </p>
        </div>

        <h3 className={s.subheading}>Title Lab: Before and After</h3>

        <div className="titlePatternsGrid">
          <TitleExample
            label="Vague"
            bad="iPhone Camera Tips"
            good="5 iPhone Camera Settings You Should Change Today"
          />
          <TitleExample
            label="Keyword buried"
            bad="My Experience Learning This Amazing Skill"
            good="Photoshop for Beginners: 10 Tools You Need First"
          />
          <TitleExample
            label="No benefit"
            bad="Editing Tutorial Part 3"
            good="Edit Videos 2x Faster With These Shortcuts"
          />
          <TitleExample
            label="Spam signals"
            bad="BEST TIPS YOU MUST SEE!!!"
            good="Why Your Best Videos Get the Least Views"
          />
        </div>

        <div className="realTalk">
          <p className="realTalk__label">Quick rules</p>
          <p className="realTalk__text">
            Keyword early. Be specific about the payoff. Create curiosity or
            promise a clear benefit. No all caps. No keyword stuffing.
          </p>
        </div>

        <p className={s.sectionText}>
          For more title patterns and ideation frameworks, see our{" "}
          <Link href="/learn/youtube-video-ideas">
            guide to generating video ideas
          </Link>
          .
        </p>
      </section>

      {/* Thumbnail Optimization */}
      <section id="thumbnail-optimization" className="sectionTinted">
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </span>
          Thumbnail Optimization
        </h2>

        <p className={s.sectionText}>
          Thumbnails determine whether people click. A strong thumbnail can
          double your CTR. Most creators spend hours on content and minutes on
          thumbnails. Invert this ratio.
        </p>

        <div className="inlineIllustration">
          <ThumbnailShelfTest />
        </div>

        <h3 className={s.subheading}>Four Principles</h3>

        <div className="frameworkSteps">
          <div className="frameworkStep">
            <span className="frameworkStep__num">1</span>
            <div className="frameworkStep__content">
              <strong>Readable at phone size</strong>
              <p>
                Shrink your thumbnail to 100px wide. If you cannot tell what it
                is about, simplify.
              </p>
            </div>
          </div>
          <div className="frameworkStep">
            <span className="frameworkStep__num">2</span>
            <div className="frameworkStep__content">
              <strong>One focal point</strong>
              <p>
                Your eye should land on one thing: a face, a product, a result.
                Cluttered thumbnails lose.
              </p>
            </div>
          </div>
          <div className="frameworkStep">
            <span className="frameworkStep__num">3</span>
            <div className="frameworkStep__content">
              <strong>High contrast</strong>
              <p>
                Make elements pop against each other. Test in grayscale to check
                visual hierarchy.
              </p>
            </div>
          </div>
          <div className="frameworkStep">
            <span className="frameworkStep__num">4</span>
            <div className="frameworkStep__content">
              <strong>Complement the title</strong>
              <p>
                Thumbnail and title should work together, not repeat each other.
                Show what the title tells.
              </p>
            </div>
          </div>
        </div>

        <div className="funCallout">
          <p className="funCallout__text">
            <strong>Test relentlessly.</strong> If a video underperforms, change
            the thumbnail first. YouTube allows updates anytime. Give changes a
            few days before judging.
          </p>
        </div>
      </section>

      {/* Description Optimization */}
      <section id="description-optimization" className="sectionOpen">
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
            </svg>
          </span>
          Description Optimization
        </h2>

        <p className={s.sectionText}>
          Descriptions help YouTube understand your video and give viewers
          context. The first two sentences appear in search results. Everything
          else hides behind &ldquo;Show more.&rdquo;
        </p>

        <div className="inlineIllustration">
          <DescriptionSandwich />
        </div>

        <div className="frameworkSteps">
          <div className="frameworkStep">
            <span className="frameworkStep__num">1</span>
            <div className="frameworkStep__content">
              <strong>Top slice: Hook and keyword</strong>
              <p>
                First two sentences state what the video covers and why it
                matters. Include your main keyword naturally.
              </p>
            </div>
          </div>
          <div className="frameworkStep">
            <span className="frameworkStep__num">2</span>
            <div className="frameworkStep__content">
              <strong>Middle: Context and expansion</strong>
              <p>
                Explain what viewers will learn. Use natural language. Related
                keywords fit here without stuffing.
              </p>
            </div>
          </div>
          <div className="frameworkStep">
            <span className="frameworkStep__num">3</span>
            <div className="frameworkStep__content">
              <strong>Bottom slice: Utility</strong>
              <p>
                Timestamps for chapters, links to related videos, social links.
                This section serves returning viewers.
              </p>
            </div>
          </div>
        </div>

        <div className="realTalk">
          <p className="realTalk__label">Front-load everything</p>
          <p className="realTalk__text">
            Most viewers never click &ldquo;Show more.&rdquo; Put your most
            important information in the first 150 characters.
          </p>
        </div>
      </section>

      {/* Tags Explained */}
      <section id="tags-explained" className="sectionOpen">
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
          </span>
          Do Tags Still Matter
        </h2>

        <p className={s.sectionText}>
          Tags are a rounding error. YouTube&apos;s documentation describes them
          as &ldquo;most useful for commonly misspelled words.&rdquo; If you
          spend more than a minute on tags, you are optimizing the wrong thing.
        </p>

        <div className="inlineIllustration">
          <TagSpiceShaker />
        </div>

        <p className={s.sectionText}>
          That said, there are two cases where tags provide marginal value:
          misspellings your audience might use, and ambiguous terms where
          context helps (like &ldquo;Python&rdquo; the snake vs. the programming
          language).
        </p>

        <div className="funCallout">
          <p className="funCallout__text">
            <strong>Tag rules:</strong> 3 to 5 relevant tags. Include your main
            keyword. Add common misspellings if any. Done. Move on to things
            that matter.
          </p>
        </div>

        <p className={s.sectionText}>
          Copying competitor tags will not help you rank. The algorithm reads
          your title, description, captions, and watches how viewers behave.
          Tags are barely in the mix.
        </p>

        <p className={s.sectionText}>
          Need tags quickly? Use our{" "}
          <Link href="/tags/generator">Tag Generator</Link> to create relevant
          tags in seconds, or the{" "}
          <Link href="/tags/extractor">Tag Extractor</Link> to see what tags
          top-ranking videos use (for research, not copying).
        </p>
      </section>

      {/* Engagement Signals */}
      <section id="engagement-signals" className="sectionTinted">
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
            </svg>
          </span>
          Engagement Signals
        </h2>

        <p className={s.sectionText}>
          YouTube promotes videos that keep people watching. Two metrics
          dominate: click-through rate and retention. Everything else is
          secondary.
        </p>

        <div className="comparisonGrid">
          <EngagementPanel
            title="CTR: Getting the Click"
            visual={<CTRBillboard />}
            techniques={[
              "Test different thumbnail styles",
              "Make titles more specific or curious",
              "Study what works in your niche",
            ]}
          />
          <EngagementPanel
            title="Retention: Keeping Attention"
            visual={<RetentionCouch />}
            techniques={[
              "Hook viewers in the first 10 seconds",
              "Cut slow intros and filler",
              "Use pattern interrupts to reset attention",
            ]}
          />
        </div>

        <p className={s.sectionText}>
          For a deep dive on improving retention, see our{" "}
          <Link href="/learn/youtube-retention-analysis">
            guide to YouTube retention analysis
          </Link>
          .
        </p>

        <div className="inlineIllustration">
          <EndScreenExitSign />
        </div>

        <div className="realTalk">
          <p className="realTalk__label">Session time matters</p>
          <p className="realTalk__text">
            YouTube rewards videos that lead to more watching. End screens and
            cards that direct viewers to your next video help your channel and
            help the algorithm.
          </p>
        </div>
      </section>

      {/* Keyword Research */}
      <section id="keyword-research" className="sectionOpen">
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </span>
          YouTube Keyword Research
        </h2>

        <p className={s.sectionText}>
          Keyword research helps you find what people actually search for. The
          goal is not to chase volume but to find topics where you can provide
          value and compete.
        </p>

        <div className="inlineIllustration">
          <AutocompleteSlotMachine />
        </div>

        <h3 className={s.subheading}>Discovery Process</h3>

        <div className="frameworkSteps">
          <div className="frameworkStep">
            <span className="frameworkStep__num">1</span>
            <div className="frameworkStep__content">
              <strong>Mine autocomplete</strong>
              <p>
                Type your topic in YouTube search (incognito to avoid
                personalization). Note every suggestion that matches your
                expertise.
              </p>
            </div>
          </div>
          <div className="frameworkStep">
            <span className="frameworkStep__num">2</span>
            <div className="frameworkStep__content">
              <strong>Expand with modifiers</strong>
              <p>
                Add &ldquo;how to,&rdquo; &ldquo;for beginners,&rdquo;
                &ldquo;vs,&rdquo; &ldquo;best&rdquo; before your topic. Try the
                alphabet trick: topic + a, b, c...
              </p>
            </div>
          </div>
          <div className="frameworkStep">
            <span className="frameworkStep__num">3</span>
            <div className="frameworkStep__content">
              <strong>Sanity-check the SERP</strong>
              <p>
                Search your keyword. Check competition, recency, view counts,
                and gaps. Can you add something these videos do not?
              </p>
            </div>
          </div>
        </div>

        <div className="inlineIllustration">
          <SearchResultsBookcase />
        </div>

        <div className="frameworkGrid">
          <SERPSignalCard
            label="Competition"
            signal="Who ranks?"
            insight="If only mega-channels rank, pick a more specific angle."
          />
          <SERPSignalCard
            label="Recency"
            signal="How old are results?"
            insight="Old results = opportunity for fresh content."
          />
          <SERPSignalCard
            label="View counts"
            signal="Are views healthy?"
            insight="Low views across all results may signal low demand."
          />
          <SERPSignalCard
            label="Gaps"
            signal="What is missing?"
            insight="The best opportunity is a question no one answers well."
          />
        </div>

        <p className={s.sectionText}>
          For detailed ideation techniques and topic validation, see our{" "}
          <Link href="/learn/youtube-video-ideas">
            comprehensive video ideas guide
          </Link>
          .
        </p>
      </section>

      {/* Mistakes */}
      <section id="mistakes" className="sectionOpen">
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M15 9l-6 6M9 9l6 6" />
            </svg>
          </span>
          Museum of Unforced Errors
        </h2>

        <p className={s.sectionText}>
          These mistakes cost creators views every day. Each one is avoidable.
        </p>

        <div className="inlineIllustration">
          <MuseumPlaque />
        </div>

        <div className="museumCards">
          <MuseumCard
            title="Keyword stuffing"
            fix="Use your keyword once in the title, once early in description. Natural language wins."
          />
          <MuseumCard
            title="Tag obsession"
            fix="Tags are a minor signal. Spend that time improving your hook instead."
          />
          <MuseumCard
            title="Clickbait that disappoints"
            fix="Misleading titles get clicks but destroy retention. Net result: negative."
          />
          <MuseumCard
            title="Thumbnail neglect"
            fix="Spend as much time on your thumbnail as you do on your intro. Maybe more."
          />
          <MuseumCard
            title="Copying competitor metadata"
            fix="You need unique value, not identical packaging. Extract patterns, not text."
          />
          <MuseumCard
            title="Ignoring retention"
            fix="No amount of SEO fixes boring content. Check your retention graph first."
          />
        </div>
      </section>

      {/* CTA Highlight */}
      <div className={s.highlight}>
        <p>
          <strong>See what is working.</strong> Connect your channel to get a
          baseline on your current performance. Learn how to{" "}
          <Link href="/learn/youtube-competitor-analysis">
            analyze competitor strategies
          </Link>{" "}
          and understand{" "}
          <Link href="/learn/how-to-get-more-subscribers">
            what drives subscriber conversion
          </Link>
          .
        </p>
      </div>
    </>
  );
}

/* ================================================
   INLINE SVG COMPONENTS - Unique to this page
   ================================================ */

/** Two bouncers at a VIP club - your video needs approval from both */
function TwoEngineSEO() {
  return (
    <svg
      width="500"
      height="310"
      viewBox="0 0 500 310"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="twoEngineTitle twoEngineDesc"
    >
      <title id="twoEngineTitle">YouTube SEO needs both relevance and satisfaction</title>
      <desc id="twoEngineDesc">
        Two bouncers at a VIP club - your video needs approval from both to get in
      </desc>

      {/* Night sky background */}
      <rect x="0" y="0" width="500" height="260" rx="12" fill="#0f172a" />
      
      {/* Stars */}
      <circle cx="50" cy="30" r="2" fill="white" opacity="0.6" />
      <circle cx="120" cy="50" r="1.5" fill="white" opacity="0.5" />
      <circle cx="380" cy="25" r="2" fill="white" opacity="0.7" />
      <circle cx="450" cy="60" r="1.5" fill="white" opacity="0.5" />

      {/* VIP Club sign */}
      <g transform="translate(150, 10)">
        <rect x="0" y="0" width="200" height="50" rx="8" fill="#dc2626" />
        <rect x="5" y="5" width="190" height="40" rx="5" fill="#1e293b" stroke="#fbbf24" strokeWidth="2" />
        <text x="100" y="32" textAnchor="middle" fontSize="20" fontWeight="900" fill="#fbbf24">
          YOUTUBE VIP
        </text>
      </g>

      {/* Velvet rope */}
      <rect x="200" y="200" width="8" height="50" fill="#fbbf24" />
      <circle cx="204" cy="200" r="8" fill="#fcd34d" />
      <rect x="292" y="200" width="8" height="50" fill="#fbbf24" />
      <circle cx="296" cy="200" r="8" fill="#fcd34d" />
      <path d="M212 205 Q250 220 288 205" stroke="#dc2626" strokeWidth="8" fill="none" />

      {/* LEFT BOUNCER: Relevance */}
      <g transform="translate(35, 65)">
        {/* Body */}
        <rect x="20" y="55" width="80" height="100" rx="8" fill="#22c55e" />
        {/* Suit collar/lapels */}
        <path d="M60 55 L45 75 L60 90 L75 75 Z" fill="#166534" />
        {/* Tie */}
        <rect x="56" y="72" width="8" height="30" fill="#1e293b" />
        
        {/* Arms crossed - actual arm shapes */}
        <path d="M25 85 Q15 100 20 115 Q25 130 45 130 L75 130 Q95 130 100 115 Q105 100 95 85" fill="#166534" />
        {/* Hands visible */}
        <ellipse cx="30" cy="115" rx="10" ry="8" fill="#d4a574" />
        <ellipse cx="90" cy="115" rx="10" ry="8" fill="#d4a574" />
        
        {/* Head */}
        <circle cx="60" cy="35" r="30" fill="#d4a574" />
        {/* Ears */}
        <ellipse cx="30" cy="38" rx="5" ry="8" fill="#c4956a" />
        <ellipse cx="90" cy="38" rx="5" ry="8" fill="#c4956a" />
        {/* Hair - buzzcut */}
        <path d="M34 18 Q60 5 86 18 Q88 22 86 28 Q60 18 34 28 Q32 22 34 18" fill="#3d2914" />
        {/* Sunglasses */}
        <rect x="38" y="28" width="18" height="12" rx="2" fill="#1e293b" />
        <rect x="62" y="28" width="18" height="12" rx="2" fill="#1e293b" />
        <line x1="56" y1="34" x2="62" y2="34" stroke="#1e293b" strokeWidth="2" />
        {/* Nose */}
        <path d="M60 38 L58 46 L62 46 Z" fill="#c4956a" />
        {/* Stern mouth */}
        <line x1="52" y1="52" x2="68" y2="52" stroke="#8b5a3c" strokeWidth="2" />
        
        {/* Label - positioned lower */}
        <rect x="5" y="165" width="110" height="30" rx="6" fill="#166534" />
        <text x="60" y="185" textAnchor="middle" fontSize="14" fontWeight="700" fill="white">RELEVANCE</text>
      </g>

      {/* RIGHT BOUNCER: Satisfaction */}
      <g transform="translate(345, 65)">
        {/* Body */}
        <rect x="20" y="55" width="80" height="100" rx="8" fill="#f97316" />
        {/* Suit collar/lapels */}
        <path d="M60 55 L45 75 L60 90 L75 75 Z" fill="#c2410c" />
        {/* Tie */}
        <rect x="56" y="72" width="8" height="30" fill="#1e293b" />
        
        {/* Arms crossed - actual arm shapes */}
        <path d="M25 85 Q15 100 20 115 Q25 130 45 130 L75 130 Q95 130 100 115 Q105 100 95 85" fill="#c2410c" />
        {/* Hands visible */}
        <ellipse cx="30" cy="115" rx="10" ry="8" fill="#d4a574" />
        <ellipse cx="90" cy="115" rx="10" ry="8" fill="#d4a574" />
        
        {/* Head */}
        <circle cx="60" cy="35" r="30" fill="#d4a574" />
        {/* Ears */}
        <ellipse cx="30" cy="38" rx="5" ry="8" fill="#c4956a" />
        <ellipse cx="90" cy="38" rx="5" ry="8" fill="#c4956a" />
        {/* Hair - buzzcut */}
        <path d="M34 18 Q60 5 86 18 Q88 22 86 28 Q60 18 34 28 Q32 22 34 18" fill="#1e293b" />
        {/* Sunglasses */}
        <rect x="38" y="28" width="18" height="12" rx="2" fill="#1e293b" />
        <rect x="62" y="28" width="18" height="12" rx="2" fill="#1e293b" />
        <line x1="56" y1="34" x2="62" y2="34" stroke="#1e293b" strokeWidth="2" />
        {/* Nose */}
        <path d="M60 38 L58 46 L62 46 Z" fill="#c4956a" />
        {/* Stern mouth */}
        <line x1="52" y1="52" x2="68" y2="52" stroke="#8b5a3c" strokeWidth="2" />
        
        {/* Label - positioned lower */}
        <rect x="0" y="165" width="120" height="30" rx="6" fill="#c2410c" />
        <text x="60" y="185" textAnchor="middle" fontSize="13" fontWeight="700" fill="white">SATISFACTION</text>
      </g>

      {/* Video trying to get in - in the middle */}
      <g transform="translate(215, 100)">
        <rect x="0" y="0" width="70" height="50" rx="8" fill="#6366f1" />
        <polygon points="22,12 22,38 50,25" fill="white" />
        {/* Speech bubble */}
        <g transform="translate(50, -35)">
          <path d="M0 0 L40 0 L40 25 L25 25 L20 35 L20 25 L0 25 Z" fill="white" rx="4" />
          <text x="20" y="16" textAnchor="middle" fontSize="8" fontWeight="600" fill="#1e293b">Let me in!</text>
        </g>
      </g>

      {/* Bottom message - BELOW the visual */}
      <rect x="0" y="260" width="500" height="50" fill="#f8fafc" />
      <text x="250" y="290" textAnchor="middle" fontSize="14" fontWeight="600" fill="#1e293b">
        You need both to rank well
      </text>
    </svg>
  );
}

/** Slot machine - you need three matching symbols to win */
function RankingVendingMachine() {
  return (
    <svg
      width="460"
      height="300"
      viewBox="0 0 460 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="slotTitle slotDesc"
    >
      <title id="slotTitle">How YouTube Ranks Videos</title>
      <desc id="slotDesc">
        Like a slot machine - you need all three to win
      </desc>

      {/* Casino background */}
      <rect x="0" y="0" width="460" height="300" rx="12" fill="#1e1e2e" />

      {/* Slot machine body */}
      <rect x="80" y="30" width="300" height="220" rx="20" fill="#dc2626" />
      <rect x="90" y="40" width="280" height="200" rx="15" fill="#b91c1c" />
      
      {/* Top banner */}
      <rect x="110" y="15" width="240" height="35" rx="8" fill="#fbbf24" />
      <text x="230" y="40" textAnchor="middle" fontSize="16" fontWeight="900" fill="#1e293b">
        YOUTUBE JACKPOT
      </text>

      {/* Display window */}
      <rect x="110" y="60" width="240" height="100" rx="10" fill="#0f172a" />
      <rect x="115" y="65" width="230" height="90" rx="8" fill="#1e293b" />

      {/* Three reels */}
      {/* Reel 1: Title */}
      <g transform="translate(125, 75)">
        <rect x="0" y="0" width="65" height="70" rx="6" fill="white" />
        <text x="32" y="30" textAnchor="middle" fontSize="24">📝</text>
        <text x="32" y="50" textAnchor="middle" fontSize="9" fontWeight="700" fill="#1e293b">TITLE</text>
        <text x="32" y="63" textAnchor="middle" fontSize="8" fill="#64748b">keyword</text>
      </g>

      {/* Reel 2: Thumbnail */}
      <g transform="translate(197, 75)">
        <rect x="0" y="0" width="65" height="70" rx="6" fill="white" />
        <text x="32" y="30" textAnchor="middle" fontSize="24">🖼️</text>
        <text x="32" y="50" textAnchor="middle" fontSize="9" fontWeight="700" fill="#1e293b">THUMB</text>
        <text x="32" y="63" textAnchor="middle" fontSize="8" fill="#64748b">clicks</text>
      </g>

      {/* Reel 3: Content */}
      <g transform="translate(269, 75)">
        <rect x="0" y="0" width="65" height="70" rx="6" fill="white" />
        <text x="32" y="30" textAnchor="middle" fontSize="24">🎬</text>
        <text x="32" y="50" textAnchor="middle" fontSize="9" fontWeight="700" fill="#1e293b">CONTENT</text>
        <text x="32" y="63" textAnchor="middle" fontSize="8" fill="#64748b">retention</text>
      </g>

      {/* Lever */}
      <g transform="translate(385, 80)">
        <rect x="0" y="0" width="15" height="100" rx="4" fill="#64748b" />
        <circle cx="7" cy="0" r="15" fill="#ef4444" stroke="#b91c1c" strokeWidth="3" />
        <circle cx="7" cy="0" r="8" fill="#dc2626" />
      </g>

      {/* Payout display */}
      <rect x="130" y="170" width="200" height="55" rx="8" fill="#0f172a" />
      <rect x="135" y="175" width="190" height="45" rx="6" fill="#064e3b" />
      
      {/* Jackpot text */}
      <text x="230" y="195" textAnchor="middle" fontSize="11" fill="#4ade80">JACKPOT:</text>
      <text x="230" y="213" textAnchor="middle" fontSize="14" fontWeight="900" fill="#22c55e">PAGE 1 RANKING</text>

      {/* Coins slot */}
      <rect x="200" y="230" width="60" height="15" rx="4" fill="#0f172a" />
      <rect x="215" y="232" width="30" height="4" rx="2" fill="#374151" />

      {/* Bottom message */}
      <rect x="80" y="260" width="300" height="30" rx="6" fill="#fef3c7" />
      <text x="230" y="280" textAnchor="middle" fontSize="12" fontWeight="600" fill="#92400e">
        All three must line up to win
      </text>
    </svg>
  );
}

/** Movie theater marquee showing title truncation - the audience only sees the first part */
function MetadataMagnifyingGlass() {
  return (
    <svg
      width="500"
      height="280"
      viewBox="0 0 500 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="marqueeTitle"
    >
      <title id="marqueeTitle">Your title is like a movie marquee - front-load the good stuff</title>

      {/* Night sky */}
      <rect x="0" y="0" width="500" height="280" rx="12" fill="#0f172a" />
      
      {/* Stars */}
      <circle cx="40" cy="25" r="1.5" fill="white" opacity="0.6" />
      <circle cx="460" cy="35" r="2" fill="white" opacity="0.5" />
      <circle cx="200" cy="20" r="1" fill="white" opacity="0.4" />
      <circle cx="350" cy="15" r="1.5" fill="white" opacity="0.5" />

      {/* Theater building */}
      <rect x="50" y="80" width="400" height="180" fill="#374151" />
      <rect x="60" y="90" width="380" height="60" fill="#1e293b" />
      
      {/* Decorative top trim */}
      <rect x="40" y="70" width="420" height="15" fill="#fbbf24" />
      <rect x="35" y="65" width="430" height="10" fill="#f59e0b" />

      {/* MARQUEE - the main event */}
      <g transform="translate(70, 95)">
        {/* Marquee background with lights */}
        <rect x="0" y="0" width="360" height="50" rx="4" fill="#1e293b" stroke="#fbbf24" strokeWidth="3" />
        
        {/* Light bulbs around marquee */}
        {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map((i) => (
          <circle key={`top-${i}`} cx={15 + i * 22} cy="-5" r="5" fill={i < 10 ? "#fbbf24" : "#64748b"} />
        ))}
        {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map((i) => (
          <circle key={`bot-${i}`} cx={15 + i * 22} cy="55" r="5" fill={i < 10 ? "#fbbf24" : "#64748b"} />
        ))}

        {/* Title text - visible part is bright, cut-off part is dim */}
        <text x="15" y="32" fontSize="16" fontWeight="700" fill="#fbbf24">5 iPhone Settings That</text>
        <text x="245" y="32" fontSize="16" fontWeight="700" fill="#475569">Double Your...</text>
        
        {/* Cutoff line */}
        <line x1="240" y1="5" x2="240" y2="45" stroke="#dc2626" strokeWidth="2" strokeDasharray="4" />
        <rect x="242" y="5" width="115" height="40" fill="#1e293b" opacity="0.7" />
      </g>

      {/* Character count indicator */}
      <g transform="translate(310, 150)">
        <rect x="0" y="0" width="80" height="25" rx="4" fill="#dc2626" />
        <text x="40" y="17" textAnchor="middle" fontSize="11" fontWeight="600" fill="white">CHAR 60</text>
        <path d="M40 25 L40 70" stroke="#dc2626" strokeWidth="2" strokeDasharray="4" />
      </g>

      {/* Audience looking up */}
      <g transform="translate(100, 195)">
        {/* Person 1 - can see */}
        <circle cx="50" cy="30" r="20" fill="#fcd34d" />
        <circle cx="43" cy="25" r="4" fill="white" />
        <circle cx="57" cy="25" r="4" fill="white" />
        <circle cx="44" cy="26" r="2" fill="#1e293b" />
        <circle cx="58" cy="26" r="2" fill="#1e293b" />
        <path d="M40 38 Q50 45 60 38" stroke="#1e293b" strokeWidth="2" fill="none" />
        {/* Speech bubble */}
        <g transform="translate(65, -15)">
          <path d="M0 20 L0 0 L60 0 L60 20 L15 20 L10 30 L10 20 Z" fill="white" rx="4" />
          <text x="30" y="14" textAnchor="middle" fontSize="8" fontWeight="600" fill="#22c55e">I get it!</text>
        </g>
      </g>

      <g transform="translate(250, 195)">
        {/* Person 2 - wondering */}
        <circle cx="50" cy="30" r="20" fill="#fcd34d" />
        <circle cx="43" cy="25" r="4" fill="white" />
        <circle cx="57" cy="25" r="4" fill="white" />
        <circle cx="44" cy="26" r="2" fill="#1e293b" />
        <circle cx="58" cy="26" r="2" fill="#1e293b" />
        <ellipse cx="50" cy="40" rx="5" ry="4" fill="#1e293b" />
        {/* Speech bubble */}
        <g transform="translate(65, -15)">
          <path d="M0 20 L0 0 L80 0 L80 20 L15 20 L10 30 L10 20 Z" fill="white" rx="4" />
          <text x="40" y="14" textAnchor="middle" fontSize="8" fontWeight="600" fill="#f97316">Double what??</text>
        </g>
      </g>

      {/* Bottom message */}
      <rect x="120" y="250" width="260" height="24" rx="6" fill="#fef3c7" />
      <text x="250" y="267" textAnchor="middle" fontSize="12" fontWeight="600" fill="#92400e">
        Front-load keywords in first 60 characters
      </text>
    </svg>
  );
}

/** Simple checklist for preflight - spaced out properly */
function TitleTapeMeasure() {
  return (
    <svg
      width="500"
      height="200"
      viewBox="0 0 500 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="checklistTitle"
    >
      <title id="checklistTitle">Pre-publish checklist</title>

      {/* Background */}
      <rect x="0" y="0" width="500" height="200" rx="12" fill="#f8fafc" />

      {/* Clipboard shape */}
      <rect x="20" y="15" width="460" height="170" rx="12" fill="white" stroke="#e2e8f0" strokeWidth="2" />
      <rect x="200" y="5" width="100" height="20" rx="6" fill="#64748b" />

      {/* Title */}
      <text x="250" y="45" textAnchor="middle" fontSize="16" fontWeight="700" fill="#1e293b">Pre-Publish Checklist</text>

      {/* Checklist items - 3 columns, more spacing */}
      <g transform="translate(40, 65)">
        {/* Column 1 */}
        <g transform="translate(0, 0)">
          <rect x="0" y="0" width="18" height="18" rx="4" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
          <path d="M4 9 L7 13 L14 5" stroke="#22c55e" strokeWidth="2" fill="none" />
          <text x="26" y="14" fontSize="11" fill="#1e293b">Title under 60</text>
        </g>
        <g transform="translate(0, 38)">
          <rect x="0" y="0" width="18" height="18" rx="4" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
          <path d="M4 9 L7 13 L14 5" stroke="#22c55e" strokeWidth="2" fill="none" />
          <text x="26" y="14" fontSize="11" fill="#1e293b">Keyword front</text>
        </g>
        <g transform="translate(0, 76)">
          <rect x="0" y="0" width="18" height="18" rx="4" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
          <path d="M4 9 L7 13 L14 5" stroke="#22c55e" strokeWidth="2" fill="none" />
          <text x="26" y="14" fontSize="11" fill="#1e293b">Clear benefit</text>
        </g>
      </g>

      <g transform="translate(180, 65)">
        {/* Column 2 */}
        <g transform="translate(0, 0)">
          <rect x="0" y="0" width="18" height="18" rx="4" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
          <path d="M4 9 L7 13 L14 5" stroke="#22c55e" strokeWidth="2" fill="none" />
          <text x="26" y="14" fontSize="11" fill="#1e293b">Thumb readable</text>
        </g>
        <g transform="translate(0, 38)">
          <rect x="0" y="0" width="18" height="18" rx="4" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
          <path d="M4 9 L7 13 L14 5" stroke="#22c55e" strokeWidth="2" fill="none" />
          <text x="26" y="14" fontSize="11" fill="#1e293b">Desc hook</text>
        </g>
        <g transform="translate(0, 76)">
          <rect x="0" y="0" width="18" height="18" rx="4" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
          <path d="M4 9 L7 13 L14 5" stroke="#22c55e" strokeWidth="2" fill="none" />
          <text x="26" y="14" fontSize="11" fill="#1e293b">Strong hook</text>
        </g>
      </g>

      <g transform="translate(340, 65)">
        {/* Column 3 */}
        <g transform="translate(0, 0)">
          <rect x="0" y="0" width="18" height="18" rx="4" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
          <path d="M4 9 L7 13 L14 5" stroke="#22c55e" strokeWidth="2" fill="none" />
          <text x="26" y="14" fontSize="11" fill="#1e293b">End screens</text>
        </g>
        <g transform="translate(0, 38)">
          <rect x="0" y="0" width="18" height="18" rx="4" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
          <path d="M4 9 L7 13 L14 5" stroke="#22c55e" strokeWidth="2" fill="none" />
          <text x="26" y="14" fontSize="11" fill="#1e293b">Chapters</text>
        </g>
        <g transform="translate(0, 76)">
          <rect x="0" y="0" width="18" height="18" rx="4" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
          <path d="M4 9 L7 13 L14 5" stroke="#22c55e" strokeWidth="2" fill="none" />
          <text x="26" y="14" fontSize="11" fill="#1e293b">Cards placed</text>
        </g>
      </g>
    </svg>
  );
}

/** Side-by-side thumbnail comparison with clear readable text */
function ThumbnailShelfTest() {
  return (
    <svg
      width="520"
      height="260"
      viewBox="0 0 520 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="thumbTitle thumbDesc"
    >
      <title id="thumbTitle">Good vs bad thumbnail comparison</title>
      <desc id="thumbDesc">
        Clear focused thumbnail versus cluttered confusing thumbnail
      </desc>

      {/* Background */}
      <rect x="0" y="0" width="520" height="260" rx="12" fill="#f8fafc" />

      {/* BAD THUMBNAIL */}
      <g transform="translate(30, 25)">
        <text x="100" y="15" textAnchor="middle" fontSize="14" fontWeight="700" fill="#dc2626">CLUTTERED</text>
        
        {/* Thumbnail frame */}
        <rect x="0" y="25" width="200" height="115" rx="8" fill="#64748b" stroke="#94a3b8" strokeWidth="2" />
        
        {/* Too much stuff - shapes only, no text inside */}
        <circle cx="35" cy="55" r="18" fill="#475569" />
        <rect x="65" y="40" width="35" height="22" fill="#475569" />
        <rect x="110" y="35" width="45" height="30" fill="#475569" />
        <rect x="165" y="40" width="22" height="22" fill="#475569" />
        <rect x="25" y="85" width="70" height="18" fill="#475569" />
        <rect x="105" y="80" width="60" height="25" fill="#475569" />
        <circle cx="140" cy="95" r="10" fill="#334155" />
        
        {/* X badge */}
        <circle cx="185" cy="40" r="16" fill="#dc2626" />
        <path d="M178 33 L192 47 M192 33 L178 47" stroke="white" strokeWidth="3" />
        
        {/* Problems listed - with more space */}
        <text x="100" y="160" textAnchor="middle" fontSize="12" fill="#64748b">Too many elements</text>
        <text x="100" y="178" textAnchor="middle" fontSize="12" fill="#64748b">No clear focus</text>
        <text x="100" y="196" textAnchor="middle" fontSize="12" fill="#64748b">Hard to read small</text>
      </g>

      {/* VS divider */}
      <g transform="translate(243, 85)">
        <circle cx="15" cy="15" r="18" fill="#e2e8f0" />
        <text x="15" y="21" textAnchor="middle" fontSize="13" fontWeight="700" fill="#64748b">VS</text>
      </g>

      {/* GOOD THUMBNAIL */}
      <g transform="translate(290, 25)">
        <text x="100" y="15" textAnchor="middle" fontSize="14" fontWeight="700" fill="#22c55e">CLEAR</text>
        
        {/* Thumbnail frame */}
        <rect x="0" y="25" width="200" height="115" rx="8" fill="#6366f1" stroke="#818cf8" strokeWidth="2" />
        
        {/* One clear face - focal point */}
        <circle cx="100" cy="75" r="38" fill="#fcd34d" />
        <circle cx="85" cy="65" r="7" fill="white" />
        <circle cx="115" cy="65" r="7" fill="white" />
        <circle cx="86" cy="67" r="3.5" fill="#1e293b" />
        <circle cx="116" cy="67" r="3.5" fill="#1e293b" />
        <path d="M82 88 Q100 102 118 88" stroke="#1e293b" strokeWidth="3" fill="none" />
        
        {/* Simple bold text on thumbnail */}
        <rect x="15" y="115" width="70" height="20" rx="4" fill="white" />
        <text x="50" y="130" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b">WOW</text>
        
        {/* Check badge */}
        <circle cx="185" cy="40" r="16" fill="#22c55e" />
        <path d="M176 40 L182 46 L194 34" stroke="white" strokeWidth="3" fill="none" />
        
        {/* Benefits listed - with more space */}
        <text x="100" y="160" textAnchor="middle" fontSize="12" fill="#64748b">One focal point</text>
        <text x="100" y="178" textAnchor="middle" fontSize="12" fill="#64748b">High contrast</text>
        <text x="100" y="196" textAnchor="middle" fontSize="12" fill="#64748b">Readable at any size</text>
      </g>

      {/* Bottom tip - with proper spacing */}
      <rect x="150" y="230" width="220" height="24" rx="6" fill="#fef3c7" />
      <text x="260" y="247" textAnchor="middle" fontSize="12" fontWeight="600" fill="#92400e">
        Shrink your thumbnail to test it
      </text>
    </svg>
  );
}

/** Clean iceberg illustration - top connects to bottom */
function DescriptionSandwich() {
  return (
    <svg
      width="500"
      height="340"
      viewBox="0 0 500 340"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="icebergTitle"
    >
      <title id="icebergTitle">Your description is an iceberg - most is hidden</title>

      {/* Sky */}
      <rect x="0" y="0" width="500" height="110" fill="#7dd3fc" />
      
      {/* Sun */}
      <circle cx="420" cy="45" r="30" fill="#fbbf24" />
      
      {/* Clouds */}
      <ellipse cx="80" cy="40" rx="35" ry="15" fill="white" opacity="0.8" />
      <ellipse cx="60" cy="45" rx="25" ry="12" fill="white" opacity="0.8" />
      <ellipse cx="150" cy="55" rx="30" ry="12" fill="white" opacity="0.6" />

      {/* Water */}
      <rect x="0" y="110" width="500" height="230" fill="#0369a1" />
      
      {/* Water surface wave */}
      <path d="M0 110 Q60 105 120 110 T240 110 T360 110 T480 110 L500 110" fill="none" stroke="#0ea5e9" strokeWidth="3" />

      {/* SINGLE CONNECTED ICEBERG - above AND below water */}
      {/* Above water tip */}
      <path
        d="M200 110 L220 70 L250 50 L280 70 L300 110"
        fill="#e0f2fe"
        stroke="#bae6fd"
        strokeWidth="2"
      />
      {/* Snow/ice highlight on tip */}
      <path d="M230 75 L250 55 L270 75" fill="white" opacity="0.7" />

      {/* Below water - deeper blue, starts at same width as tip */}
      <path
        d="M200 110 
           L190 140 
           L175 180 
           L170 220 
           L185 270 
           L220 300 
           L250 310 
           L280 300 
           L315 270 
           L330 220 
           L325 180 
           L310 140 
           L300 110 
           Z"
        fill="#1e3a5f"
        opacity="0.85"
      />
      
      {/* Ice cracks/texture - subtle lighter lines */}
      <path d="M220 140 L235 190 L215 250" stroke="#3b6a99" strokeWidth="2" fill="none" opacity="0.6" />
      <path d="M280 145 L265 200 L285 260" stroke="#3b6a99" strokeWidth="2" fill="none" opacity="0.6" />
      <path d="M250 120 L250 170" stroke="#3b6a99" strokeWidth="2" fill="none" opacity="0.5" />

      {/* Bubbles */}
      <circle cx="400" cy="150" r="5" fill="white" opacity="0.3" />
      <circle cx="420" cy="190" r="4" fill="white" opacity="0.25" />
      <circle cx="100" cy="170" r="4" fill="white" opacity="0.3" />
      <circle cx="80" cy="220" r="5" fill="white" opacity="0.25" />

      {/* ABOVE WATER LABEL */}
      <g transform="translate(330, 25)">
        <rect x="0" y="0" width="150" height="70" rx="10" fill="white" stroke="#22c55e" strokeWidth="3" />
        <text x="75" y="25" textAnchor="middle" fontSize="14" fontWeight="700" fill="#166534">FIRST 2 LINES</text>
        <text x="75" y="45" textAnchor="middle" fontSize="12" fill="#64748b">Hook + keyword</text>
        <text x="75" y="62" textAnchor="middle" fontSize="13" fill="#22c55e" fontWeight="700">VISIBLE</text>
      </g>
      {/* Arrow to tip */}
      <line x1="330" y1="60" x2="295" y2="70" stroke="#22c55e" strokeWidth="3" />

      {/* BELOW WATER LABEL */}
      <g transform="translate(15, 180)">
        <rect x="0" y="0" width="130" height="95" rx="10" fill="white" stroke="#f97316" strokeWidth="3" />
        <text x="65" y="25" textAnchor="middle" fontSize="14" fontWeight="700" fill="#c2410c">EVERYTHING</text>
        <text x="65" y="42" textAnchor="middle" fontSize="14" fontWeight="700" fill="#c2410c">ELSE</text>
        <text x="65" y="60" textAnchor="middle" fontSize="10" fill="#64748b">Context, chapters,</text>
        <text x="65" y="73" textAnchor="middle" fontSize="10" fill="#64748b">links, timestamps</text>
        <text x="65" y="90" textAnchor="middle" fontSize="12" fill="#c2410c" fontWeight="700">HIDDEN</text>
      </g>
      {/* Arrow to underwater - orange so it's visible against blue water */}
      <line x1="145" y1="230" x2="180" y2="220" stroke="#f97316" strokeWidth="3" />

      {/* Percentage indicators */}
      <rect x="310" y="75" width="45" height="22" rx="5" fill="#dcfce7" />
      <text x="333" y="91" textAnchor="middle" fontSize="13" fontWeight="700" fill="#166534">10%</text>
      
      <rect x="340" y="195" width="45" height="22" rx="5" fill="white" />
      <text x="363" y="211" textAnchor="middle" fontSize="13" fontWeight="700" fill="#c2410c">90%</text>
    </svg>
  );
}

/** Bar chart showing tag impact is tiny - clean and clear */
function TagSpiceShaker() {
  return (
    <svg
      width="460"
      height="270"
      viewBox="0 0 460 270"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="tagBarTitle"
    >
      <title id="tagBarTitle">Tags are a tiny part of ranking factors</title>

      {/* Background */}
      <rect x="0" y="0" width="460" height="270" rx="12" fill="#f8fafc" />

      {/* Title */}
      <text x="230" y="30" textAnchor="middle" fontSize="16" fontWeight="700" fill="#1e293b">
        What Actually Affects Your Ranking
      </text>

      {/* Bar chart */}
      <g transform="translate(40, 50)">
        {/* Watch Time */}
        <g transform="translate(0, 0)">
          <text x="0" y="15" fontSize="12" fill="#1e293b">Watch Time</text>
          <rect x="120" y="2" width="280" height="20" rx="4" fill="#22c55e" />
          <text x="410" y="16" fontSize="11" fontWeight="600" fill="#166534">HIGH</text>
        </g>

        {/* CTR */}
        <g transform="translate(0, 32)">
          <text x="0" y="15" fontSize="12" fill="#1e293b">Click-Through Rate</text>
          <rect x="120" y="2" width="250" height="20" rx="4" fill="#16a34a" />
          <text x="380" y="16" fontSize="11" fontWeight="600" fill="#166534">HIGH</text>
        </g>

        {/* Title & Description */}
        <g transform="translate(0, 64)">
          <text x="0" y="15" fontSize="12" fill="#1e293b">Title + Description</text>
          <rect x="120" y="2" width="180" height="20" rx="4" fill="#6366f1" />
          <text x="310" y="16" fontSize="11" fontWeight="600" fill="#4f46e5">MEDIUM</text>
        </g>

        {/* Thumbnails */}
        <g transform="translate(0, 96)">
          <text x="0" y="15" fontSize="12" fill="#1e293b">Thumbnail</text>
          <rect x="120" y="2" width="160" height="20" rx="4" fill="#8b5cf6" />
          <text x="290" y="16" fontSize="11" fontWeight="600" fill="#7c3aed">MEDIUM</text>
        </g>

        {/* Tags - tiny! */}
        <g transform="translate(0, 128)">
          <text x="0" y="15" fontSize="12" fontWeight="700" fill="#dc2626">Tags</text>
          <rect x="120" y="2" width="15" height="20" rx="4" fill="#f87171" />
          <text x="145" y="16" fontSize="11" fontWeight="700" fill="#dc2626">LOW</text>
        </g>
      </g>

      {/* Bottom message - with more space above */}
      <rect x="100" y="230" width="260" height="28" rx="6" fill="#fef2f2" stroke="#fecaca" strokeWidth="2" />
      <text x="230" y="249" textAnchor="middle" fontSize="13" fontWeight="600" fill="#991b1b">
        Spend 1 minute on tags, not 1 hour
      </text>
    </svg>
  );
}

/** CTR: Simple cursor clicking on irresistible thumbnail */
function CTRBillboard() {
  return (
    <svg
      width="200"
      height="140"
      viewBox="0 0 200 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Background */}
      <rect x="0" y="0" width="200" height="140" rx="8" fill="#f8fafc" />
      
      {/* Thumbnail */}
      <rect x="30" y="20" width="140" height="80" rx="8" fill="#6366f1" stroke="#818cf8" strokeWidth="2" />
      
      {/* Clear face in thumbnail */}
      <circle cx="100" cy="50" r="25" fill="#fcd34d" />
      <circle cx="90" cy="45" r="5" fill="white" />
      <circle cx="110" cy="45" r="5" fill="white" />
      <circle cx="91" cy="46" r="2.5" fill="#1e293b" />
      <circle cx="111" cy="46" r="2.5" fill="#1e293b" />
      <path d="M88 60 Q100 72 112 60" stroke="#1e293b" strokeWidth="3" fill="none" />
      
      {/* Bold text on thumbnail */}
      <rect x="40" y="80" width="60" height="15" rx="3" fill="white" />
      <text x="70" y="91" textAnchor="middle" fontSize="8" fontWeight="700" fill="#1e293b">WOW!</text>

      {/* Cursor pointing at thumbnail */}
      <g transform="translate(145, 60)">
        <path d="M0 0 L0 24 L6 18 L12 28 L16 26 L10 16 L18 16 Z" fill="white" stroke="#1e293b" strokeWidth="2" />
      </g>

      {/* Click ripple effect */}
      <circle cx="150" cy="65" r="12" fill="none" stroke="#22c55e" strokeWidth="2" opacity="0.6" />
      <circle cx="150" cy="65" r="18" fill="none" stroke="#22c55e" strokeWidth="1" opacity="0.3" />

      {/* Label */}
      <text x="100" y="125" textAnchor="middle" fontSize="12" fontWeight="600" fill="#22c55e">CLICK!</text>
    </svg>
  );
}

/** Retention: Progress bar showing viewer staying through video */
function RetentionCouch() {
  return (
    <svg
      width="200"
      height="140"
      viewBox="0 0 200 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Background */}
      <rect x="0" y="0" width="200" height="140" rx="8" fill="#f8fafc" />
      
      {/* Video player frame */}
      <rect x="20" y="15" width="160" height="90" rx="8" fill="#1e293b" />
      <rect x="25" y="20" width="150" height="70" rx="4" fill="#6366f1" />
      <polygon points="85,40 85,70 115,55" fill="white" />
      
      {/* Progress bar showing high retention */}
      <rect x="25" y="92" width="150" height="8" rx="4" fill="#374151" />
      <rect x="25" y="92" width="120" height="8" rx="4" fill="#22c55e" />
      
      {/* Playhead */}
      <circle cx="145" cy="96" r="6" fill="white" stroke="#22c55e" strokeWidth="2" />
      
      {/* Retention percentage */}
      <rect x="60" y="108" width="80" height="25" rx="6" fill="#dcfce7" />
      <text x="100" y="125" textAnchor="middle" fontSize="12" fontWeight="700" fill="#166534">80% retained</text>
    </svg>
  );
}

/** Simple flow diagram: Video 1 ends -> Arrow -> Video 2 starts */
function EndScreenExitSign() {
  return (
    <svg
      width="420"
      height="140"
      viewBox="0 0 420 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="endScreenTitle"
    >
      <title id="endScreenTitle">End screens keep viewers watching</title>

      {/* Background */}
      <rect x="0" y="0" width="420" height="140" rx="10" fill="#f8fafc" />

      {/* Video 1 - ending */}
      <g transform="translate(30, 25)">
        <rect x="0" y="0" width="110" height="70" rx="8" fill="#64748b" />
        <text x="55" y="40" textAnchor="middle" fontSize="14" fontWeight="600" fill="white">VIDEO 1</text>
        <text x="55" y="58" textAnchor="middle" fontSize="10" fill="#e2e8f0">ending...</text>
        
        {/* Progress bar nearly complete */}
        <rect x="10" y="72" width="90" height="6" rx="3" fill="#475569" />
        <rect x="10" y="72" width="80" height="6" rx="3" fill="#f97316" />
      </g>

      {/* Arrow with end screen label */}
      <g transform="translate(155, 45)">
        <rect x="0" y="-10" width="110" height="50" rx="8" fill="#22c55e" />
        <text x="55" y="8" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">END SCREEN</text>
        <text x="55" y="22" textAnchor="middle" fontSize="9" fill="#dcfce7">directs to...</text>
        
        {/* Arrow */}
        <path d="M90 15 L105 15 M98 8 L105 15 L98 22" stroke="white" strokeWidth="3" fill="none" />
      </g>

      {/* Video 2 - next */}
      <g transform="translate(280, 25)">
        <rect x="0" y="0" width="110" height="70" rx="8" fill="#6366f1" stroke="#22c55e" strokeWidth="3" />
        <polygon points="40,22 40,52 75,37" fill="white" />
        <text x="55" y="85" textAnchor="middle" fontSize="11" fontWeight="600" fill="#22c55e">YOUR NEXT VIDEO</text>
      </g>

      {/* Bottom label */}
      <rect x="130" y="115" width="160" height="22" rx="6" fill="#dcfce7" />
      <text x="210" y="130" textAnchor="middle" fontSize="11" fontWeight="600" fill="#166534">
        Session time increases
      </text>
    </svg>
  );
}

/** Simple YouTube search bar with autocomplete dropdown */
function AutocompleteSlotMachine() {
  return (
    <svg
      width="440"
      height="220"
      viewBox="0 0 440 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="autocompleteTitle"
    >
      <title id="autocompleteTitle">YouTube autocomplete reveals what people search</title>

      {/* Background */}
      <rect x="0" y="0" width="440" height="220" rx="12" fill="#f8fafc" />

      {/* Title */}
      <text x="220" y="30" textAnchor="middle" fontSize="16" fontWeight="700" fill="#1e293b">
        YouTube Autocomplete = Free Keyword Research
      </text>

      {/* Browser frame */}
      <rect x="40" y="50" width="360" height="150" rx="8" fill="white" stroke="#e2e8f0" strokeWidth="2" />
      
      {/* Browser dots */}
      <circle cx="60" cy="65" r="5" fill="#ef4444" />
      <circle cx="78" cy="65" r="5" fill="#fbbf24" />
      <circle cx="96" cy="65" r="5" fill="#22c55e" />

      {/* Search bar */}
      <rect x="60" y="85" width="320" height="40" rx="20" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2" />
      
      {/* Search icon */}
      <circle cx="85" cy="105" r="10" fill="none" stroke="#64748b" strokeWidth="2" />
      <line x1="93" y1="113" x2="100" y2="120" stroke="#64748b" strokeWidth="2" />
      
      {/* Search text */}
      <text x="115" y="110" fontSize="14" fill="#1e293b">how to edit videos</text>
      
      {/* Cursor blinking */}
      <rect x="248" y="95" width="2" height="20" fill="#6366f1" />

      {/* Autocomplete dropdown */}
      <rect x="60" y="128" width="320" height="68" rx="8" fill="white" stroke="#e2e8f0" strokeWidth="2" />
      
      {/* Suggestion 1 */}
      <rect x="65" y="133" width="310" height="28" rx="4" fill="#f8fafc" />
      <text x="80" y="152" fontSize="13" fill="#64748b">how to edit videos for beginners</text>
      
      {/* Suggestion 2 - highlighted as opportunity */}
      <rect x="65" y="163" width="310" height="28" rx="4" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
      <text x="80" y="182" fontSize="13" fontWeight="600" fill="#166534">how to edit videos on phone</text>
      <text x="340" y="182" fontSize="11" fontWeight="600" fill="#22c55e">IDEA!</text>

      {/* Bottom tip */}
      <text x="220" y="212" textAnchor="middle" fontSize="12" fill="#64748b">
        Type your topic. Every suggestion is a potential video.
      </text>
    </svg>
  );
}

/** Clean search results analysis - showing what to look for */
function SearchResultsBookcase() {
  return (
    <svg
      width="500"
      height="250"
      viewBox="0 0 500 250"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="serpTitle"
    >
      <title id="serpTitle">Analyze search results to find opportunities</title>

      {/* Background */}
      <rect x="0" y="0" width="500" height="250" rx="12" fill="#f8fafc" />

      {/* Title */}
      <text x="250" y="25" textAnchor="middle" fontSize="16" fontWeight="700" fill="#1e293b">
        Analyze the Search Results
      </text>

      {/* Search results mockup */}
      <rect x="20" y="40" width="460" height="170" rx="10" fill="white" stroke="#e2e8f0" strokeWidth="2" />

      {/* Result 1 - Big channel (hard to beat) */}
      <g transform="translate(35, 55)">
        <rect x="0" y="0" width="200" height="60" rx="6" fill="#f8fafc" stroke="#fca5a5" strokeWidth="2" />
        <rect x="10" y="10" width="70" height="40" rx="4" fill="#64748b" />
        <text x="45" y="35" textAnchor="middle" fontSize="11" fill="white">10M views</text>
        <text x="90" y="25" fontSize="11" fontWeight="600" fill="#1e293b">Big Channel</text>
        <text x="90" y="42" fontSize="10" fill="#64748b">Hard to beat</text>
        
        {/* Warning icon - positioned outside card */}
        <rect x="170" y="5" width="25" height="18" rx="4" fill="#dc2626" />
        <text x="182" y="18" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">!</text>
      </g>

      {/* Result 2 - Old video (opportunity!) */}
      <g transform="translate(260, 55)">
        <rect x="0" y="0" width="200" height="60" rx="6" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
        <rect x="10" y="10" width="70" height="40" rx="4" fill="#92400e" />
        <text x="45" y="35" textAnchor="middle" fontSize="11" fill="white">OLD 2019</text>
        <text x="90" y="25" fontSize="11" fontWeight="600" fill="#1e293b">Outdated</text>
        <text x="90" y="42" fontSize="10" fill="#92400e">Opportunity!</text>
        
        {/* Opportunity icon */}
        <rect x="170" y="5" width="25" height="18" rx="4" fill="#f59e0b" />
        <text x="182" y="17" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">?</text>
      </g>

      {/* Result 3 - Small channel succeeding (you can too) */}
      <g transform="translate(35, 125)">
        <rect x="0" y="0" width="200" height="60" rx="6" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
        <rect x="10" y="10" width="70" height="40" rx="4" fill="#166534" />
        <text x="45" y="35" textAnchor="middle" fontSize="11" fill="white">50K views</text>
        <text x="90" y="25" fontSize="11" fontWeight="600" fill="#1e293b">Small Creator</text>
        <text x="90" y="42" fontSize="10" fill="#166534">You can compete!</text>
        
        {/* Target icon */}
        <rect x="170" y="5" width="25" height="18" rx="4" fill="#22c55e" />
        <text x="182" y="17" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">*</text>
      </g>

      {/* Gap indicator */}
      <g transform="translate(260, 125)">
        <rect x="0" y="0" width="200" height="60" rx="6" fill="white" stroke="#22c55e" strokeWidth="3" strokeDasharray="8" />
        <text x="100" y="30" textAnchor="middle" fontSize="14" fontWeight="700" fill="#166534">YOUR VIDEO</text>
        <text x="100" y="48" textAnchor="middle" fontSize="11" fill="#22c55e">could go here</text>
      </g>

      {/* Bottom tip */}
      <rect x="90" y="218" width="320" height="24" rx="6" fill="#fef3c7" />
      <text x="250" y="235" textAnchor="middle" fontSize="11" fill="#92400e">
        Look for old content, small channels winning, and gaps
      </text>
    </svg>
  );
}

/** Simple warning cards for common mistakes - no museum theme */
function MuseumPlaque() {
  return (
    <svg
      width="500"
      height="160"
      viewBox="0 0 500 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="mistakesTitle"
    >
      <title id="mistakesTitle">Common SEO mistakes to avoid</title>

      {/* Background */}
      <rect x="0" y="0" width="500" height="160" rx="12" fill="#fef2f2" />

      {/* Title */}
      <text x="250" y="28" textAnchor="middle" fontSize="16" fontWeight="700" fill="#991b1b">
        Common Mistakes
      </text>

      {/* Mistake cards */}
      {/* Card 1: Keyword Stuffing */}
      <g transform="translate(25, 45)">
        <rect x="0" y="0" width="140" height="100" rx="10" fill="white" stroke="#fca5a5" strokeWidth="2" />
        <circle cx="120" cy="20" r="14" fill="#dc2626" />
        <path d="M113 13 L127 27 M127 13 L113 27" stroke="white" strokeWidth="3" />
        
        <text x="70" y="30" textAnchor="middle" fontSize="12" fontWeight="700" fill="#991b1b">Keyword</text>
        <text x="70" y="45" textAnchor="middle" fontSize="12" fontWeight="700" fill="#991b1b">Stuffing</text>
        
        <text x="70" y="65" textAnchor="middle" fontSize="9" fill="#64748b">iPhone iPhone Tips</text>
        <text x="70" y="78" textAnchor="middle" fontSize="9" fill="#64748b">iPhone Camera iPhone</text>
        <text x="70" y="91" textAnchor="middle" fontSize="9" fill="#dc2626">Looks spammy</text>
      </g>

      {/* Card 2: Misleading Titles */}
      <g transform="translate(180, 45)">
        <rect x="0" y="0" width="140" height="100" rx="10" fill="white" stroke="#fca5a5" strokeWidth="2" />
        <circle cx="120" cy="20" r="14" fill="#dc2626" />
        <path d="M113 13 L127 27 M127 13 L113 27" stroke="white" strokeWidth="3" />
        
        <text x="70" y="30" textAnchor="middle" fontSize="12" fontWeight="700" fill="#991b1b">Misleading</text>
        <text x="70" y="45" textAnchor="middle" fontSize="12" fontWeight="700" fill="#991b1b">Clickbait</text>
        
        <text x="70" y="65" textAnchor="middle" fontSize="9" fill="#64748b">YOU WONT BELIEVE</text>
        <text x="70" y="78" textAnchor="middle" fontSize="9" fill="#64748b">WHAT HAPPENED!!!</text>
        <text x="70" y="91" textAnchor="middle" fontSize="9" fill="#dc2626">Kills retention</text>
      </g>

      {/* Card 3: Tag Obsession */}
      <g transform="translate(335, 45)">
        <rect x="0" y="0" width="140" height="100" rx="10" fill="white" stroke="#fca5a5" strokeWidth="2" />
        <circle cx="120" cy="20" r="14" fill="#dc2626" />
        <path d="M113 13 L127 27 M127 13 L113 27" stroke="white" strokeWidth="3" />
        
        <text x="70" y="30" textAnchor="middle" fontSize="12" fontWeight="700" fill="#991b1b">Tag</text>
        <text x="70" y="45" textAnchor="middle" fontSize="12" fontWeight="700" fill="#991b1b">Obsession</text>
        
        <text x="70" y="65" textAnchor="middle" fontSize="9" fill="#64748b">500 tags copied</text>
        <text x="70" y="78" textAnchor="middle" fontSize="9" fill="#64748b">from competitors</text>
        <text x="70" y="91" textAnchor="middle" fontSize="9" fill="#dc2626">Waste of time</text>
      </g>
    </svg>
  );
}

/* ================================================
   COMPONENT HELPERS
   ================================================ */

type PreflightCardProps = {
  label: string;
  checks: string;
};

function PreflightCard({ label, checks }: PreflightCardProps) {
  return (
    <div className="frameworkStep">
      <span className="frameworkStep__num" style={{ background: "#22c55e" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
      <div className="frameworkStep__content">
        <strong>{label}</strong>
        <p>{checks}</p>
      </div>
    </div>
  );
}

type TitleExampleProps = {
  label: string;
  bad: string;
  good: string;
};

function TitleExample({ label, bad, good }: TitleExampleProps) {
  return (
    <div className="titlePattern">
      <span className="titlePattern__type">{label}</span>
      <span
        className="titlePattern__example"
        style={{ textDecoration: "line-through", color: "#94a3b8", fontSize: "12px" }}
      >
        {bad}
      </span>
      <span className="titlePattern__example" style={{ color: "#166534", fontWeight: 600 }}>
        {good}
      </span>
    </div>
  );
}

type EngagementPanelProps = {
  title: string;
  visual: React.ReactNode;
  techniques: string[];
};

function EngagementPanel({ title, visual, techniques }: EngagementPanelProps) {
  return (
    <div className="playbookLever" style={{ marginBottom: 0 }}>
      <h3 className="playbookLever__title" style={{ marginBottom: "12px", fontSize: "16px" }}>
        {title}
      </h3>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
        {visual}
      </div>
      <div className="playbookLever__actions" style={{ margin: 0 }}>
        <strong>Improve it:</strong>
        <ul>
          {techniques.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

type SERPSignalCardProps = {
  label: string;
  signal: string;
  insight: string;
};

function SERPSignalCard({ label, signal, insight }: SERPSignalCardProps) {
  return (
    <div className="frameworkCard" style={{ borderTopColor: "#6366f1" }}>
      <h4 className="frameworkCard__title">{label}</h4>
      <p className="frameworkCard__example">{signal}</p>
      <p className="frameworkCard__text">{insight}</p>
    </div>
  );
}

type MuseumCardProps = {
  title: string;
  fix: string;
};

function MuseumCard({ title, fix }: MuseumCardProps) {
  return (
    <div className="museumCard">
      <h4 className="museumCard__title">{title}</h4>
      <p className="museumCard__fix">
        <strong>Fix:</strong> {fix}
      </p>
    </div>
  );
}
