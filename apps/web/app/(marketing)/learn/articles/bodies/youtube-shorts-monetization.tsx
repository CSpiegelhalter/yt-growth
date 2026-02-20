/**
 * Body content for YouTube Shorts Monetization article.
 * Server component - no "use client" directive.
 *
 * Focused on monetization setup and eligibility:
 * - Eligibility tiers (early access vs full ads)
 * - Revenue model (pooled, music impact, engaged views)
 * - Original + transformative content requirements
 * - Common approval blockers
 * - Step-by-step path to monetization
 * 
 * Strategy/creation content lives in youtube-shorts-strategy.tsx
 */

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { LEARN_ARTICLES } from "../../articles";
import type { BodyProps, ArticleMeta } from "./_shared";
import { tocFromArticle } from "./_shared";

const _article = LEARN_ARTICLES["youtube-shorts-monetization"];

export const meta: ArticleMeta = {
  slug: _article.slug,
  title: _article.title,
  description: _article.description,
};

export const toc = tocFromArticle(_article.toc);

/* ================================================
   INLINE SVG VISUALS
   ================================================ */


function RevenuePizzaSvg() {
  return (
    <svg
      width="280"
      height="200"
      viewBox="0 0 280 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Pie chart showing 45% creator share, 55% YouTube share"
    >
      <title>Revenue Split Pizza</title>
      {/* Pizza/Pie background */}
      <circle cx="140" cy="90" r="70" fill="#fef3c7" stroke="#f59e0b" strokeWidth="3" />
      
      {/* YouTube's 55% slice */}
      <path d="M140 90 L140 20 A70 70 0 0 1 210 90 A70 70 0 0 1 182 147 Z" fill="#ef4444" />
      
      {/* Creator's 45% slice */}
      <path d="M140 90 L182 147 A70 70 0 0 1 70 90 A70 70 0 0 1 140 20 Z" fill="#22c55e" />
      
      {/* Slice labels */}
      <text x="175" y="75" textAnchor="middle" fontSize="14" fontWeight="800" fill="white">55%</text>
      <text x="175" y="90" textAnchor="middle" fontSize="9" fontWeight="600" fill="white">YouTube</text>
      
      <text x="105" y="95" textAnchor="middle" fontSize="16" fontWeight="800" fill="white">45%</text>
      <text x="105" y="110" textAnchor="middle" fontSize="10" fontWeight="600" fill="white">You</text>
      
      {/* Legend */}
      <g>
        <rect x="50" y="175" width="14" height="14" rx="2" fill="#22c55e" />
        <text x="70" y="186" fontSize="10" fill="#374151">Your share: 45%</text>
      </g>
      <g>
        <rect x="160" y="175" width="14" height="14" rx="2" fill="#ef4444" />
        <text x="180" y="186" fontSize="10" fill="#374151">YouTube: 55%</text>
      </g>
    </svg>
  );
}

function MusicTaxSvg() {
  return (
    <svg
      width="400"
      height="200"
      viewBox="0 0 400 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Music track reducing creator revenue share"
    >
      <title>Music Track Tax</title>
      
      {/* Title */}
      <text x="200" y="25" textAnchor="middle" fontSize="16" fontWeight="700" fill="#1e293b">
        How Music Affects Your Earnings
      </text>
      
      {/* Background panel */}
      <rect x="15" y="40" width="370" height="125" rx="10" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
      
      {/* No music scenario */}
      <g>
        <text x="80" y="65" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1e293b">No Music</text>
        <rect x="30" y="75" width="100" height="30" rx="6" fill="#22c55e" />
        <text x="80" y="96" textAnchor="middle" fontSize="12" fontWeight="700" fill="white">100% to Pool</text>
        <text x="80" y="120" textAnchor="middle" fontSize="11" fill="#16a34a" fontWeight="600">Full share</text>
      </g>
      
      {/* 1 track scenario */}
      <g>
        <text x="200" y="65" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1e293b">1 Track</text>
        <rect x="150" y="75" width="50" height="30" rx="6" fill="#22c55e" />
        <rect x="200" y="75" width="50" height="30" rx="6" fill="#f59e0b" />
        <text x="175" y="96" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">50%</text>
        <text x="225" y="96" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">50%</text>
        <text x="200" y="120" textAnchor="middle" fontSize="11" fill="#d97706" fontWeight="600">Half to music</text>
      </g>
      
      {/* 2 tracks scenario */}
      <g>
        <text x="320" y="65" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1e293b">2 Tracks</text>
        <rect x="270" y="75" width="33" height="30" rx="6" fill="#22c55e" />
        <rect x="303" y="75" width="67" height="30" rx="6" fill="#f59e0b" />
        <text x="286" y="96" textAnchor="middle" fontSize="10" fontWeight="700" fill="white">33%</text>
        <text x="336" y="96" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">67%</text>
        <text x="320" y="120" textAnchor="middle" fontSize="11" fill="#b45309" fontWeight="600">More to music</text>
      </g>
      
      {/* Legend */}
      <g>
        <rect x="110" y="145" width="16" height="16" rx="3" fill="#22c55e" />
        <text x="132" y="158" fontSize="12" fill="#374151" fontWeight="500">Creator Pool</text>
        <rect x="230" y="145" width="16" height="16" rx="3" fill="#f59e0b" />
        <text x="252" y="158" fontSize="12" fill="#374151" fontWeight="500">Music Licensing</text>
      </g>
    </svg>
  );
}


/* ================================================
   HELPER COMPONENTS
   ================================================ */

type IncomeStreamCardProps = {
  title: string;
  description: string;
};

function IncomeStreamCard({ title, description }: IncomeStreamCardProps) {
  return (
    <div className="incomeCard">
      <h4 className="incomeCard__title">{title}</h4>
      <p className="incomeCard__desc">{description}</p>
    </div>
  );
}

type BlockerCardProps = {
  title: string;
  description: string;
};

function BlockerCard({ title, description }: BlockerCardProps) {
  return (
    <div className="blockerCard">
      <h4 className="blockerCard__title">{title}</h4>
      <p className="blockerCard__desc">{description}</p>
    </div>
  );
}

type ToolCtaCardProps = {
  title: string;
  description: string;
  href: string;
  bestFor?: string;
};

function ToolCtaCard({ title, description, href, bestFor }: ToolCtaCardProps) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "20px",
        marginTop: "24px",
      }}
    >
      {bestFor && (
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--text-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {bestFor}
        </span>
      )}
      <h4
        style={{
          fontSize: "15px",
          fontWeight: 700,
          color: "var(--text)",
          margin: bestFor ? "6px 0 8px" : "0 0 8px",
        }}
      >
        {title}
      </h4>
      <p
        style={{
          fontSize: "14px",
          color: "var(--text-secondary)",
          margin: "0 0 16px",
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>
      <Link
        href={href}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "14px",
          fontWeight: 600,
          color: "var(--primary)",
          textDecoration: "none",
          padding: "8px 16px",
          background: "white",
          borderRadius: "8px",
          border: "1px solid var(--border)",
          transition: "all 0.15s ease",
        }}
      >
        Try it free
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}

/* ================================================
   BODY COMPONENT
   ================================================ */

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* Overview */}
      <section id="overview" className="sectionOpen">
        <p className={s.sectionText} style={{ fontSize: "1.125rem", fontWeight: 500 }}>
          Shorts monetization is confusing because it works nothing like long-form YouTube.
        </p>

        <p className={s.sectionText}>
          Your view count doesn&apos;t match your paid views. Your RPM looks tiny compared to
          regular videos. And half the advice out there is outdated or wrong.
        </p>

        <p className={s.sectionText}>
          This guide explains how Shorts payouts actually work, what &quot;views&quot; YouTube
          pays you for (spoiler: not all of them), why your numbers might look weird, and
          what to do while you&apos;re still growing toward eligibility.
        </p>

        <p className={s.sectionText}>
          No hype. Just the mechanics, with real math you can use.
        </p>
      </section>

      {/* How Much Does Shorts Pay */}
      <section id="how-much-shorts-pay" className="sectionTinted">
        <h2 className={s.sectionTitle}>How Much Does YouTube Shorts Pay?</h2>

        <p className={s.sectionText}>
          You&apos;ve probably seen Google&apos;s official range: $0.01 to $0.06 per 1,000 views.
        </p>

        <p className={s.sectionText}>
          That number is accurate if your audience is mostly in low ad-spend regions like
          India or the Philippines. But if you&apos;re reaching Tier 1 countries (USA, Canada,
          UK, Australia), creators report RPMs in the $0.15 to $0.25+ range.
        </p>

        <p className={s.sectionText}>
          Let&apos;s do the math with a realistic example.
        </p>

        <div className="realTalk">
          <p className="realTalk__label">Example: RPM of $0.20</p>
          <p className="realTalk__text">
            <strong>15 million views</strong> at $0.20 RPM = <strong>$3,000</strong>
          </p>
          <p className="realTalk__text" style={{ marginTop: "0.5rem" }}>
            If you want to hit <strong>$10,000/month</strong>, you need roughly
            {" "}<strong>33 million views per month</strong> at that RPM. That&apos;s about
            1.1 million views per day, consistently.
          </p>
        </div>

        <p className={s.sectionText}>
          Some real examples from creator analytics show the range in action:
        </p>

        <ul className={s.bulletList}>
          <li>3.5 million views → roughly $700 at $0.21 RPM</li>
          <li>7.5 million views → roughly $920</li>
          <li>10.3 million views → roughly $1,192</li>
          <li>24.2 million views → roughly $2,853</li>
          <li>43 million views → roughly $4,780</li>
        </ul>

        <p className={s.sectionText}>
          Notice something? The per-view rate stays relatively stable when the audience
          geography stays consistent. What changes your earnings most is where your viewers
          are located and how many views you can sustain over time.
        </p>

        <h3 className={s.subheading}>What Changes Your RPM</h3>

        <div className="factorGrid">
          <div className="factorCard">
            <h4 className="factorCard__title">Audience Geography</h4>
            <p className="factorCard__desc">
              Viewers in the US, Canada, UK, and Australia generate higher ad rates than
              viewers in regions with lower advertiser spend. This is the biggest factor.
            </p>
          </div>
          <div className="factorCard">
            <h4 className="factorCard__title">Niche and Content Type</h4>
            <p className="factorCard__desc">
              Some niches attract higher-value audiences. Motivation content, for example,
              can see RPMs of $0.30+ per 1,000 views compared to generic entertainment.
            </p>
          </div>
          <div className="factorCard">
            <h4 className="factorCard__title">Seasonality</h4>
            <p className="factorCard__desc">
              Q4 (October through December) typically pays better because advertisers
              spend more. January often dips as budgets reset.
            </p>
          </div>
          <div className="factorCard">
            <h4 className="factorCard__title">Music Usage</h4>
            <p className="factorCard__desc">
              Using licensed music changes how revenue is split. More on this below.
            </p>
          </div>
        </div>
      </section>

      {/* Engaged Views vs Displayed Views */}
      <section id="engaged-views" className="sectionOpen">
        <h2 className={s.sectionTitle}>The Metric YouTube Pays On Isn&apos;t Always the &quot;Views&quot; You See</h2>

        <p className={s.sectionText}>
          Here&apos;s something that confuses almost every creator: the view count you see
          in your analytics is not necessarily the number YouTube pays you for.
        </p>

        <p className={s.sectionText}>
          YouTube pays on <strong>engaged views</strong>, not total views. After a platform
          update, the displayed view count can be higher than the engagement number used
          for payment calculations.
        </p>

        <div className="realTalk">
          <p className="realTalk__label">What This Looks Like in Practice</p>
          <p className="realTalk__text">
            A Short might show 14-15 million views in your analytics, but the engagement
            number used for payouts might be closer to 9.6 million. That&apos;s not a bug.
            That&apos;s YouTube separating &quot;someone scrolled past this&quot; from &quot;someone
            actually watched this.&quot;
          </p>
        </div>

        <p className={s.sectionText}>
          This explains a common frustration: a Short with <em>more</em> views can sometimes
          earn <em>less</em> than one with fewer views. If the engaged portion is smaller,
          the payout is smaller.
        </p>

        <h3 className={s.subheading}>The Good News</h3>

        <p className={s.sectionText}>
          Before this update, creators reported RPMs around $0.09 to $0.16. After the update,
          RPMs climbed to the $0.20 to $0.25 range.
        </p>

        <p className={s.sectionText}>
          You get paid for fewer counted views, but you get paid <em>more per thousand</em>
          on the views that qualify. The meaningful change is higher pay per engaged view.
        </p>

        <p className={s.sectionText}>
          So if your view count looks different from what you expected to get paid on,
          you&apos;re not crazy. The measurement changed. Focus on making Shorts that people
          actually watch through, not just scroll past.
        </p>
      </section>

      {/* How Revenue Is Calculated */}
      <section id="revenue-model" className="sectionTinted">
        <h2 className={s.sectionTitle}>How Shorts Ad Revenue Is Actually Calculated</h2>

        <p className={s.sectionText}>
          Unlike long-form videos where ads play on <em>your</em> video, Shorts ads play
          between videos as people scroll the feed. You don&apos;t have &quot;your&quot; ad. You have
          a share of all the ads.
        </p>

        <p className={s.sectionText}>
          All ad revenue from the Shorts feed goes into a monthly pool. That pool gets
          divided among monetizing creators based on their share of total engaged views.
          Your slice depends on how many engaged views you contributed relative to everyone else.
        </p>

        <div className="floatRight" style={{ marginTop: "1rem" }}>
          <RevenuePizzaSvg />
        </div>

        <p className={s.sectionText}>
          From your allocated share, you keep 45%. YouTube keeps 55%. This split is fixed
          regardless of whether you use music or not.
        </p>

        <h3 className={s.subheading}>What This Means for You</h3>

        <p className={s.sectionText}>
          The main thing you can control is your share of engaged views. That comes down to:
        </p>

        <ul className={s.bulletList}>
          <li>Making Shorts people actually watch (not just see in the feed)</li>
          <li>Strong hooks that prevent the swipe-away</li>
          <li>Retention that keeps viewers watching to the end</li>
          <li>Publishing consistently so you&apos;re always contributing to the pool</li>
        </ul>

        <p className={s.sectionText}>
          You can&apos;t control the total pool size, advertiser demand, or what other creators
          are doing. But you can make Shorts that earn a larger percentage of whatever the
          pool happens to be.
        </p>
      </section>

      {/* Music Impact */}
      <section id="music-impact" className="sectionOpen">
        <h2 className={s.sectionTitle}>Music Changes Your Earnings (And There&apos;s More to the Story)</h2>

        <p className={s.sectionText}>
          Using music in your Shorts changes how revenue flows. When you add a licensed track,
          part of the revenue goes to music licensing instead of the Creator Pool.
        </p>

        <div className="inlineIllustration">
          <MusicTaxSvg />
        </div>

        <div className="realTalk">
          <p className="realTalk__label">The Basic Math</p>
          <p className="realTalk__text">
            No music: 100% of revenue goes to the Creator Pool. One track: roughly 50%
            to Creator Pool, 50% to music licensing. Two tracks: about 33% to Creator Pool,
            67% to music. Your 45% cut applies to whatever reaches the Creator Pool.
          </p>
        </div>

        <p className={s.sectionText}>
          So using music doesn&apos;t change your split percentage, but it does shrink the pie
          you&apos;re splitting.
        </p>

        <h3 className={s.subheading}>The Music Program Angle</h3>

        <p className={s.sectionText}>
          There&apos;s another side to this that some creators are using to their advantage.
        </p>

        <p className={s.sectionText}>
          Certain music deals and programs pay creators a percentage of earnings when they
          use specific music in their Shorts. Some creators report this can add $0.10+ RPM
          on top of normal earnings. In some cases, the incremental value can reportedly
          range from $0.10 CPM on the low end to significantly higher on the high end.
        </p>

        <p className={s.sectionText}>
          One creator claimed earning $124,000 USD over 9 months from a combination of
          YouTube ad revenue and music program revenue. Another reported a highest single
          month of $50,000 CAD with this approach.
        </p>

        <div className="funCallout" style={{ marginTop: "1rem" }}>
          <p className="funCallout__text">
            <strong>Important:</strong> These programs typically require meeting certain
            view thresholds (like 1 million+ views in the last 30 days) to apply. The
            results vary widely by creator and niche.
          </p>
        </div>

        <h3 className={s.subheading}>When to Use Music vs. Original Audio</h3>

        <div className="comparisonGrid" style={{ marginTop: "1rem" }}>
          <div className="comparisonItem comparisonItem--good">
            <p className="comparisonItem__label">When Music Can Help</p>
            <p className="comparisonItem__content">
              Chasing eligibility views and need reach. Your format naturally fits a
              trending sound. Building momentum matters more than per-view payout right now.
              You have access to a music program that pays on usage.
            </p>
          </div>
          <div className="comparisonItem comparisonItem--good">
            <p className="comparisonItem__label">When Original Audio Wins</p>
            <p className="comparisonItem__content">
              Already monetizing and optimizing per-view payout. Voiceover or talking head
              format. Building a recognizable audio brand. You want maximum Creator Pool
              share per engaged view.
            </p>
          </div>
        </div>
      </section>

      {/* Eligibility */}
      <section id="eligibility" className="sectionTinted">
        <h2 className={s.sectionTitle}>Eligibility and Getting Approved</h2>

        <p className={s.sectionText}>
          For Shorts ad revenue, you need to hit the full YouTube Partner Program requirements:
        </p>

        <div className="realTalk">
          <p className="realTalk__label">The Threshold</p>
          <p className="realTalk__text">
            <strong>1,000 subscribers</strong> plus <strong>10 million valid public
            Shorts views in the last 90 days</strong> (or the watch hours path: 4,000
            hours in the last 12 months).
          </p>
        </div>

        <p className={s.sectionText}>
          Hitting the numbers is just step one. YouTube also reviews your channel for
          policy compliance and content quality signals before approving you.
        </p>

        <h3 className={s.subheading}>What Delays or Blocks Approval</h3>

        <div className="blockerGrid">
          <BlockerCard
            title="Reused Content"
            description="Unedited clips from other sources, compilations without meaningful transformation, or reuploads from other platforms. YouTube explicitly checks for this."
          />
          <BlockerCard
            title="Low Effort / Mass-Produced Feel"
            description="Content that looks templated, AI-generated without human creative input, or duplicative of what other channels are doing with no differentiation."
          />
          <BlockerCard
            title="Copyright and Content ID Issues"
            description="Active copyright strikes or too many Content ID claims. Resolve these before applying."
          />
          <BlockerCard
            title="Policy Violations"
            description="Community Guidelines strikes, misleading metadata, or spam behavior on the channel."
          />
        </div>

        <div className="realTalk" style={{ marginTop: "1.5rem" }}>
          <p className="realTalk__label">After Approval: Don&apos;t Forget This Step</p>
          <p className="realTalk__text">
            Once you&apos;re in the Partner Program, you still need to separately accept the{" "}
            <strong>Shorts Monetization Module</strong> in YouTube Studio. Revenue sharing
            starts from the date you accept, not before. Views before that earn nothing.
          </p>
        </div>

        <p className={s.sectionText}>
          For complete eligibility details, see our{" "}
          <Link href="/learn/youtube-monetization-requirements">
            monetization requirements guide
          </Link>
          .
        </p>
      </section>

      {/* Original Content Requirements */}
      <section id="original-content" className="sectionOpen">
        <h2 className={s.sectionTitle}>What &quot;Original&quot; Means for Shorts</h2>

        <p className={s.sectionText}>
          This trips up a lot of creators, especially those using AI tools or working
          with source material. YouTube requires content to be &quot;original&quot; for
          monetization. What does that actually mean?
        </p>

        <p className={s.sectionText}>
          The test is whether you&apos;re adding transformative value. Not just downloading
          something and posting it, but adding something that wouldn&apos;t exist without
          your creative input.
        </p>

        <div className="realTalk">
          <p className="realTalk__label">The Practical Test</p>
          <p className="realTalk__text">
            Ask yourself: if I removed my voiceover, my editing decisions, and my narrative,
            what&apos;s left? If the answer is &quot;just someone else&apos;s content,&quot;
            you&apos;re probably not adding enough value.
          </p>
        </div>

        <h3 className={s.subheading}>What Gets Channels Flagged</h3>

        <ul className={s.bulletList}>
          <li>Downloading podcast clips and adding gameplay + subtitles only (cited as insufficient)</li>
          <li>Unedited clips from movies, TV, or other creators</li>
          <li>Compilations without original commentary or framing</li>
          <li>Content that looks templated or mass-produced</li>
          <li>AI-generated content with no meaningful human creative direction</li>
        </ul>

        <h3 className={s.subheading}>What Counts as Transformative</h3>

        <ul className={s.bulletList}>
          <li>Your own voiceover explaining, reacting to, or contextualizing content</li>
          <li>Original scripting that adds perspective or narrative</li>
          <li>Meaningful editing decisions (not just auto-captioning)</li>
          <li>A recognizable style or series format you&apos;ve developed</li>
          <li>Commentary that adds value viewers couldn&apos;t get from the source alone</li>
        </ul>

        <p className={s.sectionText}>
          Using AI to assist your creation is fine. The final product just needs your
          creative direction running through it.
        </p>
      </section>

      {/* Why Views Spike Then Tank */}
      <section id="views-spike-tank" className="sectionTinted">
        <h2 className={s.sectionTitle}>Why Shorts Views Spike... Then Suddenly Tank</h2>

        <p className={s.sectionText}>
          You upload a Short. A few hours of nothing. Then suddenly it spikes. You think
          it&apos;s about to go viral. Then... it flatlines. Every creator has experienced this.
        </p>

        <p className={s.sectionText}>
          This pattern has a name: the Shorts surge. And it&apos;s not a bug or shadow ban.
          It&apos;s how the algorithm tests your content.
        </p>

        <h3 className={s.subheading}>Explore vs. Exploit</h3>

        <p className={s.sectionText}>
          The Shorts algorithm operates in two stages. First, it <strong>explores</strong>:
          your Short gets shown to a small &quot;seed audience&quot; to see how they react.
          If they engage well, the algorithm <strong>exploits</strong> that signal by
          pushing to a larger audience.
        </p>

        <p className={s.sectionText}>
          If the seed audience doesn&apos;t engage strongly, distribution drops fast.
          The graph flattens. Your Short looks like it &quot;died.&quot;
        </p>

        <div className="realTalk">
          <p className="realTalk__label">Why Small Channels Get Hit Harder</p>
          <p className="realTalk__text">
            For small or new creators, YouTube doesn&apos;t know you well yet. The seed audience
            it picks may not be a great match for your actual intended audience. The Short
            might &quot;die&quot; not because it&apos;s bad, but because the test group wasn&apos;t right.
          </p>
        </div>

        <h3 className={s.subheading}>What This Means for Monetization</h3>

        <p className={s.sectionText}>
          Your revenue depends on sustained engaged views, not one early burst. If your
          Shorts consistently spike then tank, you&apos;re getting explore phases but failing
          to trigger exploit phases. That limits your share of the revenue pool.
        </p>

        <p className={s.sectionText}>
          The fix isn&apos;t to re-upload hoping for a better seed audience. (YouTube may flag
          that as spam behavior.) The fix is to make Shorts that hold attention regardless
          of who sees them first.
        </p>

        <div className="funCallout" style={{ marginTop: "1rem" }}>
          <p className="funCallout__text">
            <strong>Patience note:</strong> Some creators report it took roughly a year and
            100+ Shorts before the algorithm consistently found the right audience for their
            content. The learning curve is real.
          </p>
        </div>
      </section>

      {/* Earning While Growing */}
      <section id="earning-while-growing" className="sectionOpen">
        <h2 className={s.sectionTitle}>Earning While You&apos;re Still Growing</h2>

        <p className={s.sectionText}>
          Waiting for 10 million Shorts views to start earning? You don&apos;t have to.
          The fastest money from Shorts often comes from paths that don&apos;t require
          Partner Program eligibility at all.
        </p>

        <h3 className={s.subheading}>Paths That Don&apos;t Require Ad Eligibility</h3>

        <div className="incomeGrid" style={{ marginTop: "1.5rem" }}>
          <IncomeStreamCard
            title="Merch Store"
            description="Sell niche-relevant products your audience actually wants. Football channel? Jerseys. Fitness? Gear. Keep the store link short and brand-aligned. Works from day one."
          />
          <IncomeStreamCard
            title="Brand Deals"
            description="Brands pay for integrated mentions once you have consistent reach. A single deal can outpay months of ad revenue. They look for consistent niche and stable averages, not one viral hit."
          />
          <IncomeStreamCard
            title="Separate Long-Form Channel"
            description="Don't post long-form on your Shorts channel (performance often suffers). Create a separate long-form channel documenting your journey or strategy. Monetize that independently."
          />
        </div>

        <div className="realTalk" style={{ marginTop: "1.5rem" }}>
          <p className="realTalk__label">What Small Creators Can Do This Month</p>
          <p className="realTalk__text">
            Pick one non-ad income path and set it up properly. If you&apos;re in a product-friendly
            niche, test a merch store. If you&apos;re building a skill, document it on a long-form
            channel. The goal is to have money flowing while you grind toward eligibility.
          </p>
        </div>

        <ToolCtaCard
          title="Find What&apos;s Working in Your Niche"
          description="See which channels in your space are getting brand deals and what content formats perform best."
          href="/competitors"
          bestFor="Best for niche research"
        />
      </section>

      {/* Views That Don't Count */}
      <section id="ineligible-views" className="sectionTinted">
        <h2 className={s.sectionTitle}>Views That Don&apos;t Count for Payment</h2>

        <p className={s.sectionText}>
          Not every view earns you money. YouTube calculates Shorts payments using
          eligible engaged views, and certain views are filtered out entirely.
        </p>

        <div className="factorGrid">
          <div className="factorCard">
            <h4 className="factorCard__title">Non-Original Content</h4>
            <p className="factorCard__desc">
              Unedited clips from movies, TV, or other creators. Reuploads from YouTube
              or other platforms. Compilations without meaningful original content added.
            </p>
          </div>
          <div className="factorCard">
            <h4 className="factorCard__title">Artificial or Fake Views</h4>
            <p className="factorCard__desc">
              Views from automated clicks, scroll bots, or view-buying services.
              These get filtered out of payment calculations entirely.
            </p>
          </div>
          <div className="factorCard">
            <h4 className="factorCard__title">Not Advertiser-Friendly</h4>
            <p className="factorCard__desc">
              Content inconsistent with advertiser-friendly guidelines. Inappropriate
              language, violence, or sensitive topics that violate content policies.
            </p>
          </div>
          <div className="factorCard">
            <h4 className="factorCard__title">Swipe-Past Views</h4>
            <p className="factorCard__desc">
              Someone seeing your Short in the feed isn&apos;t the same as watching it.
              The engaged views metric filters for actual watch behavior.
            </p>
          </div>
        </div>

        <div className="realTalk" style={{ marginTop: "1.5rem" }}>
          <p className="realTalk__label">Protect Your Eligibility</p>
          <p className="realTalk__text">
            Originality and advertiser-friendly content are non-negotiable. Violations
            can result in losing monetization access entirely, not just filtered views.
          </p>
        </div>
      </section>

      {/* What to Do Next */}
      <section id="next-steps" className="sectionOpen">
        <h2 className={s.sectionTitle}>What to Do Next</h2>

        <p className={s.sectionText}>
          If you&apos;ve made it this far, here&apos;s what you now understand that most
          creators don&apos;t:
        </p>

        <ul className={s.bulletList}>
          <li>
            <strong>The view count you see isn&apos;t what you get paid on.</strong>{" "}
            YouTube pays on engaged views, which is often lower than displayed views.
            But RPM improved after this change.
          </li>
          <li>
            <strong>RPM varies wildly based on audience geography.</strong>{" "}
            $0.01 RPM for low ad-spend regions, $0.20+ for Tier 1 countries. Same video,
            totally different earnings.
          </li>
          <li>
            <strong>The spike-then-tank pattern is normal.</strong>{" "}
            It&apos;s the explore/exploit system testing your content. Consistency over time
            helps the algorithm find your audience.
          </li>
        </ul>

        <p className={s.sectionText}>
          The path forward: keep publishing Shorts that hold attention. Focus on hooks
          that prevent the swipe-away and content that people watch through. That&apos;s
          what drives engaged views, which is what drives your revenue share.
        </p>

        <div
          style={{
            background: "linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)",
            border: "2px solid #6366f1",
            borderRadius: "12px",
            padding: "24px",
            marginTop: "24px",
          }}
        >
          <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1e40af", margin: "0 0 12px" }}>
            YouTube Shorts Strategy Guide
          </h3>
          <p style={{ fontSize: "15px", color: "#3730a3", margin: "0 0 16px", lineHeight: 1.6 }}>
            Now that you understand how monetization works, the next question is: how do
            you make Shorts that actually get engaged views? Our strategy guide covers
            hooks, retention, niche selection, and what to study from competitors.
          </p>
          <Link
            href="/learn/youtube-shorts-strategy"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "15px",
              fontWeight: 600,
              color: "white",
              textDecoration: "none",
              padding: "12px 20px",
              background: "#6366f1",
              borderRadius: "8px",
              transition: "all 0.15s ease",
            }}
          >
            Read Shorts Strategy Guide
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <ToolCtaCard
          title="Find Ideas That Work in Your Niche"
          description="Get video ideas based on what is performing for channels like yours."
          href="/ideas"
          bestFor="Best for idea generation"
        />
      </section>

      {/* CTA */}
      <div className="sectionAccent">
        <h3
          style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}
        >
          Track what&apos;s actually working
        </h3>
        <p
          style={{
            fontSize: "1.125rem",
            marginBottom: "1.5rem",
            maxWidth: "500px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          {BRAND.name} helps you see which Shorts drive subscribers, identify
          your best-performing content patterns, and find opportunities in your niche.
        </p>
        <Link
          href="/dashboard"
          style={{
            display: "inline-block",
            padding: "0.875rem 2rem",
            background: "white",
            color: "#6366f1",
            fontWeight: 600,
            borderRadius: "0.5rem",
            textDecoration: "none",
          }}
        >
          Try {BRAND.name} Free
        </Link>
      </div>
    </>
  );
}
