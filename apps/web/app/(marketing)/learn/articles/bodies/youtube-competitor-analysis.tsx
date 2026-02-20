/**
 * Body content for YouTube Competitor Analysis article.
 * Server component - no "use client" directive.
 * 
 * Detective/investigation themed, magazine-style layout with visual variety.
 * Avoids "list hell" - uses diagrams, matrices, case files, galleries.
 */

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { LEARN_ARTICLES } from "../../articles";
import type { BodyProps, ArticleMeta } from "./_shared";
import { tocFromArticle } from "./_shared";

const _article = LEARN_ARTICLES["youtube-competitor-analysis"];

export const meta: ArticleMeta = {
  slug: _article.slug,
  title: _article.title,
  description: _article.description,
};

export const toc = tocFromArticle(_article.toc);

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* HERO: Competitor analysis is not copying */}
      <section id="not-copying" className="sectionOpen">
        <p className={s.sectionText} style={{ fontSize: '1.125rem' }}>
          Every successful channel in your niche is running experiments you do not have to run yourself. They test topics, formats, thumbnails, and hooks. Some work. Most do not.
        </p>
        
        <p className={s.sectionText}>
          Competitor analysis lets you learn from their results without spending months figuring it out on your own.
        </p>

        <div className="pullQuote">
          Patterns are fair game. Copying is not.
        </div>

        <p className={s.sectionText}>
          This guide teaches you how to decode what works in your niche, identify outlier videos worth studying, and adapt those patterns for your own channel without becoming a knockoff.
        </p>

        {/* What you'll be able to do row */}
        <div className="whatYoullLearn">
          <div className="whatYoullLearn__item">
            <CheckCircleIcon />
            <span>Find videos that outperform their channel average</span>
          </div>
          <div className="whatYoullLearn__item">
            <CheckCircleIcon />
            <span>Extract patterns from successful packaging</span>
          </div>
          <div className="whatYoullLearn__item">
            <CheckCircleIcon />
            <span>Generate video ideas from competitor insights</span>
          </div>
        </div>
      </section>

      {/* FRAMEWORK DIAGRAM */}
      <section id="framework" className="sectionTinted">
        <h2 className={s.sectionTitle}>The Competitor Analysis Framework</h2>
        <p className={s.sectionText}>
          Effective competitor research follows a simple loop. Most creators skip the middle steps and jump straight to copying, which never works.
        </p>
        
        <div className="inlineIllustration">
          <FrameworkDiagram />
        </div>

        <div className="frameworkSteps">
          <div className="frameworkStep">
            <span className="frameworkStep__num">1</span>
            <div className="frameworkStep__content">
              <strong>Find winners</strong>
              <p>Identify channels and videos that consistently outperform in your niche.</p>
            </div>
          </div>
          <div className="frameworkStep">
            <span className="frameworkStep__num">2</span>
            <div className="frameworkStep__content">
              <strong>Decode patterns</strong>
              <p>Study what they did with topics, thumbnails, titles, and structure.</p>
            </div>
          </div>
          <div className="frameworkStep">
            <span className="frameworkStep__num">3</span>
            <div className="frameworkStep__content">
              <strong>Adapt to your channel</strong>
              <p>Apply the pattern with your voice, examples, and angle.</p>
            </div>
          </div>
          <div className="frameworkStep">
            <span className="frameworkStep__num">4</span>
            <div className="frameworkStep__content">
              <strong>Test and measure</strong>
              <p>Publish, track results, refine. The loop never stops.</p>
            </div>
          </div>
        </div>
      </section>

      {/* WHO COUNTS AS A COMPETITOR - 2x2 MATRIX */}
      <section id="who-counts" className="sectionOpen">
        <h2 className={s.sectionTitle}>Who Counts as a Competitor?</h2>
        <p className={s.sectionText}>
          Not every channel in your space is worth studying. Use this matrix to prioritize who to watch.
        </p>

        <div className="inlineIllustration">
          <CompetitorMatrix />
        </div>

        <div className="realTalk">
          <p className="realTalk__label">Where to focus</p>
          <p className="realTalk__text">
            <strong>Quadrant 1 (same audience, same format)</strong> is your primary competition. Study them first. Quadrant 2 (same audience, different format) shows you where viewers go when they want variety. Quadrants 3 and 4 are useful for inspiration but less directly relevant.
          </p>
        </div>

        {/* Funny decoy visual */}
        <div className="decoyCallout">
          <div className="decoyCallout__icon">
            <DecoyIcon />
          </div>
          <div className="decoyCallout__content">
            <p className="decoyCallout__title">Not a competitor</p>
            <p className="decoyCallout__text">
              That viral channel with 10M subscribers making reaction compilations is not your competitor if you teach Excel tutorials. Mega channels play by different rules. Study channels 10x to 100x your size, not 1000x.
            </p>
          </div>
        </div>
      </section>

      {/* WHAT TO COLLECT - CASE FILE LAYOUT */}
      <section id="case-file" className="sectionOpen">
        <h2 className={s.sectionTitle}>Building Your Competitor Case File</h2>
        <p className={s.sectionText}>
          When you analyze a competitor, collect these five elements. Think of it like building an investigation dossier.
        </p>

        <div className="caseFileGrid">
          <CaseFileCard
            label="Channel Snapshot"
            lookFor="Niche, content promise, upload cadence, typical video length"
            whyMatters="Establishes baseline. A channel posting daily has different constraints than one posting monthly."
            doNext="Note their upload rhythm and compare to yours."
          />
          <CaseFileCard
            label="Packaging Patterns"
            lookFor="Thumbnail style (faces, text, colors), title formulas, recurring visual elements"
            whyMatters="Packaging determines whether people click. Patterns reveal what the audience responds to."
            doNext="Screenshot their top 5 thumbnails. What do they have in common?"
          />
          <CaseFileCard
            label="Topic Selection"
            lookFor="Recurring series, seasonal content, evergreen vs trending mix"
            whyMatters="Shows what topics have proven demand with your shared audience."
            doNext="List their top 3 topics by view count."
          />
          <CaseFileCard
            label="Performance Outliers"
            lookFor="Videos with 2x or more their typical views, especially recent ones"
            whyMatters="Outliers reveal what resonated unusually well. These are gold."
            doNext="Find 2 outliers per competitor you track."
          />
          <CaseFileCard
            label="Viewer Psychology"
            lookFor="Top comments, questions asked, pain points mentioned, praise patterns"
            whyMatters="Comments show what viewers actually want more of."
            doNext="Read top 10 comments on their best video."
          />
        </div>
      </section>

      {/* FINDING OUTLIERS */}
      <section id="outliers" className="sectionTinted">
        <h2 className={s.sectionTitle}>Finding Outliers: The Fastest Wins</h2>
        <p className={s.sectionText}>
          Outlier videos significantly outperform a channel&apos;s average. They reveal what resonated unexpectedly well. Finding them is the single highest-leverage part of competitor research.
        </p>

        <div className="inlineIllustration">
          <OutlierFinderMock />
        </div>

        <h3 className={s.subheading}>How to Spot an Outlier</h3>
        <div className="diagnosticStep">
          <div className="diagnosticStep__content">
            <p><strong>The 2x rule:</strong> Any video with double or more the channel&apos;s typical view count is worth investigating.</p>
            <p><strong>Velocity matters:</strong> A video that got 50K views in 2 weeks signals stronger demand than one that accumulated 50K over 2 years.</p>
            <p><strong>Compare like to like:</strong> Only compare long-form to long-form, Shorts to Shorts. Different formats have different baselines.</p>
          </div>
        </div>

        <div className="funCallout" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', borderColor: '#f59e0b' }}>
          <p className="funCallout__text" style={{ color: '#92400e' }}>
            <strong>Watch for false positives.</strong> A video might spike due to a celebrity mention, news event, or algorithm glitch. Look for patterns across multiple outliers, not single flukes.
          </p>
        </div>
      </section>

      {/* PACKAGING PATTERNS - ANNOTATED GALLERY */}
      <section id="packaging" className="sectionOpen">
        <h2 className={s.sectionTitle}>Decoding Packaging Patterns</h2>
        <p className={s.sectionText}>
          Thumbnails and titles determine whether people click. Study what works in your niche, then develop your own visual language.
        </p>

        <h3 className={s.subheading}>Thumbnail Patterns That Work</h3>
        <div className="annotatedGallery">
          <AnnotatedThumbnail
            variant="good"
            annotations={["Clear focal point", "High contrast", "Readable at small size"]}
            label="Strong hierarchy"
          />
          <AnnotatedThumbnail
            variant="good"
            annotations={["Face with expression", "Text reinforces promise", "Brand colors"]}
            label="Emotional anchor"
          />
          <AnnotatedThumbnail
            variant="good"
            annotations={["Before/after split", "Visual transformation", "Curiosity gap"]}
            label="Transformation"
          />
          <AnnotatedThumbnail
            variant="bad"
            annotations={["Too much text", "No focal point", "Cluttered"]}
            label="Information overload"
          />
          <AnnotatedThumbnail
            variant="bad"
            annotations={["Low contrast", "Illegible at small size", "Generic stock feel"]}
            label="Invisible at scale"
          />
          <AnnotatedThumbnail
            variant="bad"
            annotations={["Misleading promise", "Clickbait mismatch", "Trust erosion"]}
            label="Bait and switch"
          />
        </div>

        <p className={s.sectionText} style={{ marginTop: '24px' }}>
          For a deep dive on thumbnail design, see our <Link href="/learn/youtube-thumbnail-best-practices">thumbnail best practices guide</Link>.
        </p>

        <h3 className={s.subheading}>Title Patterns Worth Noting</h3>
        <div className="titlePatternsGrid">
          <div className="titlePattern">
            <span className="titlePattern__type">How-to + result</span>
            <span className="titlePattern__example">How to Edit Videos in Half the Time</span>
          </div>
          <div className="titlePattern">
            <span className="titlePattern__type">Number list</span>
            <span className="titlePattern__example">7 Camera Settings That Transform Your Photos</span>
          </div>
          <div className="titlePattern">
            <span className="titlePattern__type">Curiosity gap</span>
            <span className="titlePattern__example">Why Your Best Videos Get the Least Views</span>
          </div>
          <div className="titlePattern">
            <span className="titlePattern__type">Direct challenge</span>
            <span className="titlePattern__example">Is This $50 Mic Better Than a $500 One?</span>
          </div>
          <div className="titlePattern">
            <span className="titlePattern__type">Experience report</span>
            <span className="titlePattern__example">I Posted Daily for 30 Days. Here Is What Happened.</span>
          </div>
          <div className="titlePattern">
            <span className="titlePattern__type">Direct benefit</span>
            <span className="titlePattern__example">The Only Lighting Setup You Actually Need</span>
          </div>
        </div>
      </section>

      {/* CONTENT PATTERNS - FORMAT TEMPLATES */}
      <section id="content-patterns" className="sectionOpen">
        <h2 className={s.sectionTitle}>Repeatable Content Formats</h2>
        <p className={s.sectionText}>
          Beyond packaging, study how competitors structure their videos. Here are four proven formats you can adapt.
        </p>

        <div className="formatTemplates">
          <FormatTemplate
            name="Problem, Mistake, Fix"
            when="Teaching or tutorial content"
            hook="Most people get [X] wrong. Here is why, and how to fix it."
            structure={["Open with the common mistake", "Show the consequences", "Reveal the fix", "Demonstrate the result"]}
            examples={["5 Editing Mistakes Killing Your Videos", "Why Your Thumbnails Do Not Get Clicks"]}
          />
          <FormatTemplate
            name="X vs Y Comparison"
            when="Purchase decisions, tool comparisons, methodology debates"
            hook="[X] or [Y]? I tested both so you do not have to."
            structure={["Establish criteria", "Test both options", "Show results", "Declare winner with nuance"]}
            examples={["iPhone vs Android for Video in 2026", "Premiere Pro vs DaVinci: Which Should You Learn?"]}
          />
          <FormatTemplate
            name="Myth vs Truth"
            when="Challenging conventional wisdom, contrarian takes"
            hook="Everyone says [myth]. Here is what actually works."
            structure={["State the myth", "Explain why people believe it", "Present the reality", "Show proof"]}
            examples={["Posting Daily Does Not Help Growth", "The Algorithm Myth That Kills Channels"]}
          />
          <FormatTemplate
            name="Trend Reaction + Niche Application"
            when="News, updates, viral moments in your space"
            hook="[Trend] just happened. Here is what it means for [your niche]."
            structure={["Explain the trend", "Why it matters to your audience", "Your take or analysis", "Action steps"]}
            examples={["New YouTube Feature: What Creators Need to Know", "This Viral Video Technique Actually Works"]}
          />
        </div>
      </section>

      {/* REMIX MAP - DON'T COPY, ADAPT */}
      <section id="adapt-not-copy" className="sectionTinted">
        <h2 className={s.sectionTitle}>The Remix Map: Adapt, Do Not Copy</h2>
        <p className={s.sectionText}>
          When you find a pattern worth using, run it through this filter. Some elements are meant to be borrowed. Others are off limits.
        </p>

        <div className="inlineIllustration">
          <RemixMapVisual />
        </div>

        <div className="comparisonGrid">
          <div className="comparisonItem comparisonItem--good">
            <p className="comparisonItem__label">Keep (patterns)</p>
            <p className="comparisonItem__content">
              Audience problem being solved. Format skeleton. Emotional angle. Thumbnail composition style. Title formula structure.
            </p>
          </div>
          <div className="comparisonItem comparisonItem--bad">
            <p className="comparisonItem__label">Change (execution)</p>
            <p className="comparisonItem__content">
              Your story and examples. Your voice and personality. Your proof and credentials. Your visual brand. Your unique angle.
            </p>
          </div>
        </div>

        <div className="realTalk">
          <p className="realTalk__label">The ethical line</p>
          <p className="realTalk__text">
            Studying how someone structures a comparison video is research. Re-filming their exact script is theft. Patterns are universal. Execution is personal. Stay on the right side.
          </p>
        </div>
      </section>

      {/* CHANNELBOOST TIE-IN */}
      <section id="in-channelboost" className="sectionOpen">
        <h2 className={s.sectionTitle}>Competitor Research in {BRAND.name}</h2>
        <p className={s.sectionText}>
          {BRAND.name} includes a competitor discovery tool that helps you find channels and videos in your niche. Here is how to use it.
        </p>

        <div className="workflowSteps">
          <div className="workflowStep">
            <span className="workflowStep__num">1</span>
            <div className="workflowStep__content">
              <strong>Search</strong>
              <p>Enter a topic, keyword, or niche. The tool surfaces relevant channels and recent videos.</p>
            </div>
          </div>
          <div className="workflowStep">
            <span className="workflowStep__num">2</span>
            <div className="workflowStep__content">
              <strong>Filter</strong>
              <p>Narrow by date range, views per day, or video length. Focus on recent outliers.</p>
            </div>
          </div>
          <div className="workflowStep">
            <span className="workflowStep__num">3</span>
            <div className="workflowStep__content">
              <strong>Save</strong>
              <p>Bookmark videos and channels worth tracking. Build your competitor watch list.</p>
            </div>
          </div>
          <div className="workflowStep">
            <span className="workflowStep__num">4</span>
            <div className="workflowStep__content">
              <strong>Write</strong>
              <p>Use insights to draft your own video outline. Apply patterns, not copies.</p>
            </div>
          </div>
        </div>

        <div className="inlineIllustration" style={{ padding: '24px 0' }}>
          <WorkflowDiagram />
        </div>
      </section>

      {/* 20-MINUTE SPRINT */}
      <section id="sprint" className="sectionTinted">
        <h2 className={s.sectionTitle}>Quick Start Sprint</h2>
        <p className={s.sectionText}>
          No time for deep research? Run this sprint once a week to stay informed without analysis paralysis.
        </p>

        <div className="sprintSteps">
          <SprintStep
            time="0:00"
            title="Pick 3 competitors"
            why="Choose channels in your niche that are active and slightly larger than you."
          />
          <SprintStep
            time="5:00"
            title="Find 2 outliers per channel"
            why="Sort by popular, filter to recent, spot videos with 2x their typical views."
          />
          <SprintStep
            time="10:00"
            title="Extract one packaging pattern"
            why="Note a thumbnail style or title formula that appears across multiple winners."
          />
          <SprintStep
            time="14:00"
            title="Extract one topic pattern"
            why="Identify a subject or angle that resonated, not just a single video idea."
          />
          <SprintStep
            time="17:00"
            title="Write 3 adapted ideas"
            why="Apply the patterns to your channel. Use your voice, examples, and angle."
          />
          <SprintStep
            time="20:00"
            title="Choose 1 test to run"
            why="Pick one idea or packaging approach to try on your next video."
          />
        </div>

        <p className={s.sectionText} style={{ marginTop: '24px' }}>
          This sprint pairs well with a <Link href="/learn/youtube-channel-audit">channel audit</Link>. First identify what is broken on your channel, then use competitor research to find patterns that fix it.
        </p>
      </section>

      {/* YOUTUBE STATS YOU CAN/CANNOT SEE */}
      <section id="data-limits" className="sectionOpen">
        <h2 className={s.sectionTitle}>What You Can and Cannot See</h2>
        <p className={s.sectionText}>
          Understanding data limitations helps you focus on what is actually available.
        </p>

        <div className="dataLimitsTable">
          <div className="dataLimitsTable__header">
            <span className="dataLimitsTable__col dataLimitsTable__col--public">Public Data</span>
            <span className="dataLimitsTable__col dataLimitsTable__col--private">Private Data</span>
          </div>
          <div className="dataLimitsTable__row">
            <span className="dataLimitsTable__item dataLimitsTable__item--public">View counts</span>
            <span className="dataLimitsTable__item dataLimitsTable__item--private">Retention curves</span>
          </div>
          <div className="dataLimitsTable__row">
            <span className="dataLimitsTable__item dataLimitsTable__item--public">Upload dates</span>
            <span className="dataLimitsTable__item dataLimitsTable__item--private">Click-through rate</span>
          </div>
          <div className="dataLimitsTable__row">
            <span className="dataLimitsTable__item dataLimitsTable__item--public">Likes and comments</span>
            <span className="dataLimitsTable__item dataLimitsTable__item--private">Traffic sources</span>
          </div>
          <div className="dataLimitsTable__row">
            <span className="dataLimitsTable__item dataLimitsTable__item--public">Subscriber count</span>
            <span className="dataLimitsTable__item dataLimitsTable__item--private">Subscriber conversion</span>
          </div>
          <div className="dataLimitsTable__row">
            <span className="dataLimitsTable__item dataLimitsTable__item--public">Video length</span>
            <span className="dataLimitsTable__item dataLimitsTable__item--private">Revenue</span>
          </div>
          <div className="dataLimitsTable__row">
            <span className="dataLimitsTable__item dataLimitsTable__item--public">Descriptions</span>
            <span className="dataLimitsTable__item dataLimitsTable__item--private">Demographics</span>
          </div>
        </div>

        <p className={s.sectionText} style={{ marginTop: '16px' }}>
          Use public signals to make educated guesses about private metrics. High view velocity often correlates with strong CTR. High engagement often correlates with good retention.
        </p>
      </section>

      {/* COMMON MISTAKES */}
      <section id="mistakes" className="sectionOpen">
        <h2 className={s.sectionTitle}>Common Competitor Analysis Mistakes</h2>

        <div className="mistakeCards">
          <div className="mistakeCard">
            <span className="mistakeCard__icon"><XIcon /></span>
            <div className="mistakeCard__content">
              <strong>Copying videos directly</strong>
              <p>If you make the same video someone else already made, you are offering a worse version of existing content. Extract patterns, not scripts.</p>
            </div>
          </div>
          <div className="mistakeCard">
            <span className="mistakeCard__icon"><XIcon /></span>
            <div className="mistakeCard__content">
              <strong>Only studying mega channels</strong>
              <p>Channels with millions of subscribers can succeed with content that would fail for you. Study channels 10x to 100x your size, not 1000x.</p>
            </div>
          </div>
          <div className="mistakeCard">
            <span className="mistakeCard__icon"><XIcon /></span>
            <div className="mistakeCard__content">
              <strong>Ignoring context behind viral videos</strong>
              <p>A viral video might have succeeded due to timing, external promotion, or luck. Look for patterns across multiple videos, not single flukes.</p>
            </div>
          </div>
          <div className="mistakeCard">
            <span className="mistakeCard__icon"><XIcon /></span>
            <div className="mistakeCard__content">
              <strong>Analysis paralysis</strong>
              <p>Spending more time researching than creating. Set a strict time limit, extract insights, then get back to making content.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="sectionAccent">
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Ready to find what works in your niche?</h3>
        <p style={{ fontSize: '1.125rem', marginBottom: '1.5rem', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
          {BRAND.name} helps you discover competitor videos, spot outliers, and turn patterns into content ideas.
        </p>
        <Link 
          href="/dashboard" 
          style={{ 
            display: 'inline-block',
            padding: '0.875rem 2rem',
            background: 'white',
            color: '#6366f1',
            fontWeight: 600,
            borderRadius: '0.5rem',
            textDecoration: 'none'
          }}
        >
          Try {BRAND.name} Free
        </Link>
      </div>
    </>
  );
}

/* ================================================
   INLINE SVG COMPONENTS
   ================================================ */

function CheckCircleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/* Red Herring - funny detective reference */
function DecoyIcon() {
  return (
    <svg width="64" height="48" viewBox="0 0 64 48" fill="none" aria-hidden="true">
      {/* Fish body - red herring */}
      <ellipse cx="28" cy="24" rx="20" ry="12" fill="#fecaca" />
      <ellipse cx="28" cy="24" rx="16" ry="9" fill="#fca5a5" />
      {/* Fish tail */}
      <path d="M48 24 L60 14 L60 34 Z" fill="#fecaca" />
      {/* Fish eye with skeptical expression */}
      <circle cx="16" cy="21" r="4" fill="white" />
      <circle cx="17" cy="20" r="2" fill="#1e293b" />
      {/* Skeptical eyebrow */}
      <path d="M12 16 Q16 14 20 17" stroke="#991b1b" strokeWidth="2" fill="none" />
      {/* Fish mouth - unimpressed */}
      <path d="M8 26 Q10 24 8 22" stroke="#991b1b" strokeWidth="2" fill="none" />
      {/* Fins */}
      <path d="M28 12 Q32 6 36 12" fill="#f87171" />
      <path d="M28 36 Q32 42 36 36" fill="#f87171" />
      {/* X mark */}
      <circle cx="54" cy="10" r="8" fill="#dc2626" />
      <path d="M50 6 L58 14 M58 6 L50 14" stroke="white" strokeWidth="2" />
    </svg>
  );
}

/* Research Flow - Vertical timeline with breathing room */
function FrameworkDiagram() {
  return (
    <svg width="320" height="340" viewBox="0 0 320 340" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Competitor research workflow showing discovery, analysis, and application">
      {/* Vertical timeline line */}
      <line x1="40" y1="30" x2="40" y2="310" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
      
      {/* Step 1: Find Channels */}
      <circle cx="40" cy="50" r="16" fill="#6366f1" />
      <circle cx="40" cy="50" r="8" fill="none" stroke="white" strokeWidth="2" />
      <path d="M44 54 L50 60" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <text x="70" y="45" fontSize="12" fontWeight="700" fill="#1e293b">Find channels</text>
      <text x="70" y="62" fontSize="10" fill="#64748b">Search your niche, check sidebars,</text>
      <text x="70" y="76" fontSize="10" fill="#64748b">note who keeps appearing</text>
      
      {/* Step 2: Spot Outliers */}
      <circle cx="40" cy="130" r="16" fill="#f97316" />
      <text x="40" y="135" textAnchor="middle" fontSize="14" fontWeight="bold" fill="white">2x</text>
      <text x="70" y="125" fontSize="12" fontWeight="700" fill="#1e293b">Spot outliers</text>
      <text x="70" y="142" fontSize="10" fill="#64748b">Sort by popular, find videos</text>
      <text x="70" y="156" fontSize="10" fill="#64748b">with 2x+ average views</text>
      
      {/* Step 3: Mine Comments */}
      <circle cx="40" cy="210" r="16" fill="#22c55e" />
      <rect x="32" y="205" width="16" height="3" rx="1" fill="white" />
      <rect x="32" y="211" width="12" height="3" rx="1" fill="white" />
      <text x="70" y="205" fontSize="12" fontWeight="700" fill="#1e293b">Mine comments</text>
      <text x="70" y="222" fontSize="10" fill="#64748b">What do viewers love? What</text>
      <text x="70" y="236" fontSize="10" fill="#64748b">questions do they still have?</text>
      
      {/* Step 4: Note Patterns */}
      <circle cx="40" cy="290" r="16" fill="#c026d3" />
      <path d="M33 287 L47 287 M33 293 L44 293" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <text x="70" y="285" fontSize="12" fontWeight="700" fill="#1e293b">Note patterns</text>
      <text x="70" y="302" fontSize="10" fill="#64748b">Title formulas, thumbnail styles,</text>
      <text x="70" y="316" fontSize="10" fill="#64748b">topics with proven demand</text>
    </svg>
  );
}

/* Priority Ranking - Who to Study */
/* Target Lock - Radar/scope style for priority */
function CompetitorMatrix() {
  return (
    <svg width="300" height="300" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Competitor priority shown as target rings">
      {/* Radar background */}
      <rect x="0" y="0" width="300" height="300" rx="12" fill="#0f172a" />
      
      {/* Concentric rings */}
      <circle cx="150" cy="150" r="130" fill="none" stroke="#1e293b" strokeWidth="1" />
      <circle cx="150" cy="150" r="100" fill="none" stroke="#1e293b" strokeWidth="1" />
      <circle cx="150" cy="150" r="65" fill="none" stroke="#1e293b" strokeWidth="1" />
      <circle cx="150" cy="150" r="30" fill="none" stroke="#22c55e" strokeWidth="2" />
      
      {/* Crosshairs */}
      <line x1="150" y1="10" x2="150" y2="290" stroke="#334155" strokeWidth="1" />
      <line x1="10" y1="150" x2="290" y2="150" stroke="#334155" strokeWidth="1" />
      
      {/* Outer ring label - SKIP */}
      <text x="150" y="32" textAnchor="middle" fontSize="9" fill="#64748b">DIFFERENT AUDIENCE + FORMAT</text>
      <circle cx="260" cy="60" r="8" fill="#334155" />
      <text x="260" y="63" textAnchor="middle" fontSize="8" fill="#64748b">skip</text>
      
      {/* Third ring - PARALLEL */}
      <text x="255" y="150" textAnchor="start" fontSize="9" fill="#3b82f6">PARALLEL</text>
      <circle cx="230" cy="150" r="10" fill="#1e40af" />
      <text x="230" y="154" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white">3</text>
      
      {/* Second ring - ADJACENT */}
      <text x="150" y="70" textAnchor="middle" fontSize="9" fill="#eab308">ADJACENT</text>
      <circle cx="150" cy="85" r="10" fill="#854d0e" />
      <text x="150" y="89" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white">2</text>
      
      {/* Center - PRIMARY TARGET */}
      <circle cx="150" cy="150" r="28" fill="#166534" stroke="#22c55e" strokeWidth="2" />
      <text x="150" y="146" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white">PRIMARY</text>
      <text x="150" y="160" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#4ade80">1</text>
      
      {/* Target lock corners */}
      <path d="M115 115 L115 125 M115 115 L125 115" stroke="#22c55e" strokeWidth="2" />
      <path d="M185 115 L185 125 M185 115 L175 115" stroke="#22c55e" strokeWidth="2" />
      <path d="M115 185 L115 175 M115 185 L125 185" stroke="#22c55e" strokeWidth="2" />
      <path d="M185 185 L185 175 M185 185 L175 185" stroke="#22c55e" strokeWidth="2" />
      
      {/* Legend at bottom */}
      <rect x="20" y="255" width="260" height="35" rx="4" fill="#1e293b" />
      <circle cx="50" cy="272" r="8" fill="#166534" />
      <text x="65" y="276" fontSize="8" fill="#94a3b8">Same audience + format</text>
      <circle cx="175" cy="272" r="8" fill="#854d0e" />
      <text x="190" y="276" fontSize="8" fill="#94a3b8">Same audience</text>
    </svg>
  );
}

/* Outlier Signals - Views AND Comments (cleaner layout) */
function OutlierFinderMock() {
  return (
    <svg width="340" height="220" viewBox="0 0 340 220" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Outlier detection showing high views and high engagement signals">
      {/* Background */}
      <rect x="5" y="5" width="330" height="210" rx="8" fill="#0f172a" />
      
      {/* Header */}
      <rect x="5" y="5" width="330" height="30" rx="8" fill="#1e293b" />
      <rect x="5" y="25" width="330" height="10" fill="#1e293b" />
      <text x="170" y="25" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#94a3b8">Signals that a video is worth studying</text>
      
      {/* Left Panel: Views Signal */}
      <rect x="15" y="45" width="150" height="160" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1" />
      <text x="90" y="68" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#22c55e">HIGH VIEWS</text>
      
      {/* Mini bar chart */}
      <rect x="30" y="90" width="16" height="25" rx="2" fill="#475569" />
      <rect x="52" y="95" width="16" height="20" rx="2" fill="#475569" />
      <rect x="74" y="93" width="16" height="22" rx="2" fill="#475569" />
      <rect x="96" y="78" width="16" height="55" rx="2" fill="#22c55e" />
      <rect x="118" y="97" width="16" height="18" rx="2" fill="#475569" />
      
      {/* Average line */}
      <line x1="25" y1="105" x2="140" y2="105" stroke="#64748b" strokeWidth="1" strokeDasharray="3" />
      
      {/* Label */}
      <text x="90" y="155" textAnchor="middle" fontSize="10" fill="#64748b">2x+ their average</text>
      <text x="90" y="175" textAnchor="middle" fontSize="10" fill="#22c55e">Algorithm liked it</text>
      <text x="90" y="195" textAnchor="middle" fontSize="9" fill="#64748b">Study the packaging</text>
      
      {/* Right Panel: Comments Signal */}
      <rect x="175" y="45" width="150" height="160" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1" />
      <text x="250" y="68" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#f97316">HIGH COMMENTS</text>
      
      {/* Comment count visual */}
      <rect x="200" y="85" width="100" height="40" rx="6" fill="#334155" />
      <text x="250" y="110" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#f97316">847</text>
      <text x="250" y="122" textAnchor="middle" fontSize="8" fill="#64748b">vs avg of 120</text>
      
      {/* Label */}
      <text x="250" y="150" textAnchor="middle" fontSize="10" fill="#64748b">Topic hit a nerve</text>
      <text x="250" y="170" textAnchor="middle" fontSize="10" fill="#f97316">Read the comments</text>
      <text x="250" y="195" textAnchor="middle" fontSize="9" fill="#64748b">What do people want more of?</text>
    </svg>
  );
}

/* Ctrl+C Ctrl+V - but make it ethical */
function RemixMapVisual() {
  return (
    <svg width="340" height="160" viewBox="0 0 340 160" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Copying vs remixing comparison showing ethical approach">
      {/* Left side - BAD: Direct copy */}
      <rect x="10" y="10" width="130" height="140" rx="8" fill="#fef2f2" stroke="#fecaca" strokeWidth="1" />
      
      {/* Big red X */}
      <circle cx="75" cy="55" r="28" fill="none" stroke="#dc2626" strokeWidth="3" />
      <path d="M58 38 L92 72 M92 38 L58 72" stroke="#dc2626" strokeWidth="3" />
      
      {/* Label */}
      <text x="75" y="105" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#991b1b">COPYING</text>
      <text x="75" y="122" textAnchor="middle" fontSize="9" fill="#b91c1c">Their video but worse</text>
      <text x="75" y="138" textAnchor="middle" fontSize="8" fill="#dc2626">Nobody asked for this</text>
      
      {/* Middle - VS */}
      <rect x="152" y="60" width="36" height="36" rx="18" fill="#f1f5f9" />
      <text x="170" y="84" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#64748b">vs</text>
      
      {/* Right side - GOOD: Remix */}
      <rect x="200" y="10" width="130" height="140" rx="8" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1" />
      
      {/* Green checkmark */}
      <circle cx="265" cy="55" r="28" fill="#dcfce7" stroke="#22c55e" strokeWidth="3" />
      <path d="M250 55 L260 65 L282 43" stroke="#22c55e" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Label */}
      <text x="265" y="105" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#166534">REMIXING</text>
      <text x="265" y="122" textAnchor="middle" fontSize="9" fill="#15803d">Their pattern</text>
      <text x="265" y="138" textAnchor="middle" fontSize="9" fill="#15803d">+ your everything</text>
    </svg>
  );
}

/* Detective Notebook - Investigation Steps */
function WorkflowDiagram() {
  return (
    <svg width="340" height="120" viewBox="0 0 340 120" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Investigation workflow shown as notebook pages">
      {/* Notebook background */}
      <rect x="5" y="5" width="330" height="110" rx="4" fill="#fef9c3" />
      {/* Spiral binding holes */}
      <circle cx="25" cy="25" r="4" fill="#0f172a" />
      <circle cx="25" cy="60" r="4" fill="#0f172a" />
      <circle cx="25" cy="95" r="4" fill="#0f172a" />
      {/* Red margin line */}
      <line x1="45" y1="5" x2="45" y2="115" stroke="#fca5a5" strokeWidth="2" />
      {/* Blue lined paper effect */}
      <line x1="50" y1="32" x2="330" y2="32" stroke="#93c5fd" strokeWidth="0.5" opacity="0.5" />
      <line x1="50" y1="55" x2="330" y2="55" stroke="#93c5fd" strokeWidth="0.5" opacity="0.5" />
      <line x1="50" y1="78" x2="330" y2="78" stroke="#93c5fd" strokeWidth="0.5" opacity="0.5" />
      <line x1="50" y1="101" x2="330" y2="101" stroke="#93c5fd" strokeWidth="0.5" opacity="0.5" />
      
      {/* Step 1 */}
      <text x="55" y="28" fontSize="11" fill="#1e293b" fontStyle="italic">1. Search for clues</text>
      <rect x="165" y="16" width="40" height="18" rx="3" fill="#6366f1" />
      <text x="185" y="29" textAnchor="middle" fontSize="9" fill="white">topic</text>
      <rect x="280" y="16" width="14" height="14" rx="2" fill="none" stroke="#1e293b" strokeWidth="1" />
      <path d="M283 23 L286 26 L293 17" stroke="#22c55e" strokeWidth="2" />
      
      {/* Step 2 */}
      <text x="55" y="51" fontSize="11" fill="#1e293b" fontStyle="italic">2. Filter suspects</text>
      <rect x="165" y="39" width="40" height="18" rx="3" fill="#8b5cf6" />
      <text x="185" y="52" textAnchor="middle" fontSize="9" fill="white">recent</text>
      <rect x="210" y="39" width="40" height="18" rx="3" fill="#8b5cf6" />
      <text x="230" y="52" textAnchor="middle" fontSize="9" fill="white">views</text>
      <rect x="280" y="39" width="14" height="14" rx="2" fill="none" stroke="#1e293b" strokeWidth="1" />
      <path d="M283 46 L286 49 L293 40" stroke="#22c55e" strokeWidth="2" />
      
      {/* Step 3 */}
      <text x="55" y="74" fontSize="11" fill="#1e293b" fontStyle="italic">3. Save the good ones</text>
      <rect x="280" y="62" width="14" height="14" rx="2" fill="none" stroke="#1e293b" strokeWidth="1" />
      
      {/* Step 4 */}
      <text x="55" y="97" fontSize="11" fill="#1e293b" fontStyle="italic">4. Write your version</text>
      <rect x="280" y="85" width="14" height="14" rx="2" fill="none" stroke="#1e293b" strokeWidth="1" />
      
      {/* Coffee stain for character */}
      <ellipse cx="310" cy="100" rx="10" ry="8" fill="#d4a574" opacity="0.25" />
    </svg>
  );
}

/* ================================================
   COMPONENT HELPERS
   ================================================ */

type CaseFileCardProps = {
  label: string;
  lookFor: string;
  whyMatters: string;
  doNext: string;
};

function CaseFileCard({ label, lookFor, whyMatters, doNext }: CaseFileCardProps) {
  return (
    <div className="caseFileCard">
      <div className="caseFileCard__header">
        <span className="caseFileCard__label">{label}</span>
      </div>
      <div className="caseFileCard__body">
        <div className="caseFileCard__row">
          <span className="caseFileCard__key">Look for</span>
          <span className="caseFileCard__value">{lookFor}</span>
        </div>
        <div className="caseFileCard__row">
          <span className="caseFileCard__key">Why it matters</span>
          <span className="caseFileCard__value">{whyMatters}</span>
        </div>
        <div className="caseFileCard__action">
          <strong>Do next:</strong> {doNext}
        </div>
      </div>
    </div>
  );
}

type AnnotatedThumbnailProps = {
  variant: "good" | "bad";
  annotations: string[];
  label: string;
};

function AnnotatedThumbnail({ variant, annotations, label }: AnnotatedThumbnailProps) {
  const isGood = variant === "good";
  return (
    <div className="annotatedThumb">
      <div className={`annotatedThumb__mock annotatedThumb__mock--${variant}`}>
        {annotations.map((a, i) => (
          <span key={i} className="annotatedThumb__annotation">{a}</span>
        ))}
      </div>
      <span className={`annotatedThumb__label annotatedThumb__label--${variant}`}>
        {isGood ? "Works: " : "Fails: "}{label}
      </span>
    </div>
  );
}

type FormatTemplateProps = {
  name: string;
  when: string;
  hook: string;
  structure: string[];
  examples: string[];
};

function FormatTemplate({ name, when, hook, structure, examples }: FormatTemplateProps) {
  return (
    <div className="formatTemplate">
      <h4 className="formatTemplate__name">{name}</h4>
      <p className="formatTemplate__when"><strong>When to use:</strong> {when}</p>
      <div className="formatTemplate__hook">
        <span className="formatTemplate__hookLabel">Hook template</span>
        <span className="formatTemplate__hookText">{hook}</span>
      </div>
      <div className="formatTemplate__structure">
        <span className="formatTemplate__structureLabel">Structure</span>
        <ol className="formatTemplate__structureList">
          {structure.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
      </div>
      <div className="formatTemplate__examples">
        {examples.map((e, i) => (
          <span key={i} className="formatTemplate__exampleChip">{e}</span>
        ))}
      </div>
    </div>
  );
}

type SprintStepProps = {
  time: string;
  title: string;
  why: string;
};

function SprintStep({ time, title, why }: SprintStepProps) {
  return (
    <div className="sprintStep">
      <span className="sprintStep__time">{time}</span>
      <div className="sprintStep__content">
        <h4 className="sprintStep__title">{title}</h4>
        <p className="sprintStep__why">{why}</p>
      </div>
    </div>
  );
}
