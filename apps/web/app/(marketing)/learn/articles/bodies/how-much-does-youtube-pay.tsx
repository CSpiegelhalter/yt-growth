/**
 * Body content for How Much Does YouTube Pay article.
 * Server component - no "use client" directive.
 *
 * Implementation plan:
 * - Remove list-heavy sections, replace with cards/grids
 * - Add 12 unique inline SVG visuals distributed throughout
 * - Use local helper components: InlineFigure, CardGrid, Callout, FormulaRow
 * - Maintain section IDs for SEO continuity
 * - Mobile-first responsive design
 * - Human-sounding copy, no "AI slop" phrasing
 */

import Link from "next/link";
import { LEARN_ARTICLES } from "../../articles";
import type { BodyProps } from "./_shared";
import { articleExports } from "./_shared";

export const { meta, toc } = articleExports(LEARN_ARTICLES["how-much-does-youtube-pay"]);

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* Overview */}
      <section id="overview" className="sectionOpen">
        <h2 className={s.sectionTitle}>How YouTube Pay Works</h2>

        <div className="floatRight">
          <CreatorCashRegister />
        </div>

        <p className={s.sectionText}>
          YouTube does not pay a fixed rate per view. Your earnings depend on
          your niche, where your audience lives, the time of year, and how
          viewers interact with ads. This makes "how much does YouTube pay" a
          question with no single answer.
        </p>

        <p className={s.sectionText}>
          To earn money from ads, you must first join the{" "}
          <Link href="/learn/youtube-monetization-requirements">
            YouTube Partner Program requirements
          </Link>
          . Once accepted, YouTube shows ads on your videos and shares a portion
          of that revenue with you.
        </p>

        <div className="inlineIllustration">
          <RevenuePlumbing />
        </div>

        <p className={s.sectionText}>
          YouTube keeps 45% of ad revenue. You receive 55%. But not every view
          generates ad revenue—some viewers use ad blockers, some watch from
          regions with low ad spend, and some videos have limited advertiser
          appeal.
        </p>
      </section>

      {/* RPM vs CPM */}
      <section id="rpm-vs-cpm" className="sectionTinted">
        <h2 className={s.sectionTitle}>RPM vs CPM Explained</h2>

        <div className="inlineIllustration">
          <SplitFlapBoard />
        </div>

        <div className="comparisonGrid">
          <MetricCard
            label="CPM"
            title="Cost Per Mille"
            description="What advertisers pay for 1,000 ad impressions. This appears in YouTube Studio but is not what you earn."
            accent="amber"
          />
          <MetricCard
            label="RPM"
            title="Revenue Per Mille"
            description="What you actually earn per 1,000 video views. This accounts for YouTube's cut, views without ads, and all revenue sources."
            accent="green"
          />
        </div>

        <h3 className={s.subheading}>Why They Differ</h3>
        <div className="chipRow">
          <span className="chip">Not every view has ads</span>
          <span className="chip">45% share to YouTube</span>
          <span className="chip">Ad skips</span>
          <span className="chip">Ad blockers</span>
        </div>

        <div className="realTalk">
          <p className="realTalk__label">Key insight</p>
          <p className="realTalk__text">
            CPM might be $10, but your RPM could be $3. When estimating
            earnings, always use RPM.
          </p>
        </div>
      </section>

      {/* Pay Per View */}
      <section id="pay-per-view" className="sectionOpen">
        <h2 className={s.sectionTitle}>How Much Does YouTube Pay Per View</h2>

        <div className="floatRight">
          <PennyJar />
        </div>

        <p className={s.sectionText}>
          There is no fixed per-view rate. Most views earn fractions of a cent,
          with occasional high-value views worth more. Think of it like a jar
          where most views drop tiny coins and a few drop quarters.
        </p>

        <div className="earningsTable">
          <div className="earningsTable__row">
            <span className="earningsTable__rpm earningsTable__rpm--low">
              Low RPM ($1)
            </span>
            <span className="earningsTable__value">~$0.001/view</span>
            <span className="earningsTable__note">0.1 cents</span>
          </div>
          <div className="earningsTable__row">
            <span className="earningsTable__rpm earningsTable__rpm--mid">
              Typical RPM ($3)
            </span>
            <span className="earningsTable__value">~$0.003/view</span>
            <span className="earningsTable__note">0.3 cents</span>
          </div>
          <div className="earningsTable__row">
            <span className="earningsTable__rpm earningsTable__rpm--high">
              High RPM ($10)
            </span>
            <span className="earningsTable__value">~$0.01/view</span>
            <span className="earningsTable__note">1 cent</span>
          </div>
        </div>

        <p className={s.sectionText}>
          A finance video with US viewers might earn $0.02 per view, while a
          gaming compilation might earn $0.001. The range is wide because the
          factors that drive ad rates vary dramatically by content type and
          audience.
        </p>
      </section>

      {/* Pay Per Million */}
      <section id="pay-per-million" className="sectionTinted">
        <h2 className={s.sectionTitle}>
          How Much Does YouTube Pay for 1 Million Views
        </h2>

        <div className="inlineIllustration">
          <ShippingLabel />
        </div>

        <p className={s.sectionText}>
          For 1 million views, multiply your RPM by 1,000. The formula is
          straightforward, but the output varies widely by niche and audience.
        </p>

        <div className="millionViewsGrid">
          <MillionViewsCard
            tier="Low RPM"
            rpm="$1–2"
            earnings="$1,000–$2,000"
            example="Gaming, vlogs"
          />
          <MillionViewsCard
            tier="Average"
            rpm="$3–5"
            earnings="$3,000–$5,000"
            example="Education, cooking"
          />
          <MillionViewsCard
            tier="High RPM"
            rpm="$8–15"
            earnings="$8,000–$15,000"
            example="Finance, software"
          />
        </div>

        <FormulaRow
          label="Example calculation"
          parts={["1,000,000 views", "x", "($4 / 1,000)", "=", "$4,000"]}
        />

        <div className="seasonalityRow">
          <p className={s.sectionText}>
            Actual earnings depend on which videos got the views, audience
            demographics, and the time of year. Q4 (October through December)
            typically pays more due to holiday advertising.
          </p>
          <WeatherCard />
        </div>
      </section>

      {/* What Affects Pay */}
      <section id="what-affects-pay" className="sectionOpen">
        <h2 className={s.sectionTitle}>What Affects Your Earnings</h2>

        <div className="inlineIllustration">
          <ControlPanel />
        </div>

        <div className="factorGrid">
          <FactorCard
            title="Niche"
            description="Finance, business, and software pay more because advertisers bid higher for those audiences. Entertainment and gaming pay less."
          />
          <FactorCard
            title="Audience Location"
            description="Viewers in the US, UK, Canada, and Australia generate higher ad rates than viewers in lower-income countries."
          />
          <FactorCard
            title="Video Length"
            description="Videos over 8 minutes can have multiple ad breaks, increasing revenue per view."
          />
          <FactorCard
            title="Seasonality"
            description="Q4 pays more due to holiday ad spend. January often sees a drop as advertisers reset budgets."
          />
          <FactorCard
            title="Content Type"
            description="Advertiser-friendly topics get more ads. Controversial or sensitive content may get limited or no ads."
          />
          <FactorCard
            title="Engagement"
            description="Videos with higher watch time can show more ads and often have engaged viewers who do not skip."
          />
        </div>
      </section>

      {/* Niche Differences */}
      <section id="niche-differences" className="sectionTinted">
        <h2 className={s.sectionTitle}>Earnings by Niche</h2>

        <p className={s.sectionText}>
          RPM varies significantly by niche. These are estimates based on
          publicly reported data—your results may differ based on audience
          quality and content specifics.
        </p>

        <div className="inlineIllustration">
          <PayLadder />
        </div>

        <p className={s.sectionText}>
          Lower RPM does not mean you cannot make money. Gaming channels can
          earn well through volume, sponsorships, and streaming. Niche matters,
          but it is one factor among many—and often not the most important one
          for total income.
        </p>
      </section>

      {/* Realistic Numbers */}
      <section id="realistic-numbers" className="sectionOpen">
        <h2 className={s.sectionTitle}>Realistic Expectations</h2>

        <p className={s.sectionText}>
          How much do YouTubers actually make? It varies enormously by channel
          size, niche, and business model.
        </p>

        <div className="inlineIllustration">
          <BudgetTable />
        </div>

        <div className="stageCards">
          <StageCard
            stage="Small"
            subs="1K–10K"
            income="$0–$100/month"
            insight="At this stage, ads are a signal that your content has commercial appeal, not a salary. Most income comes from other sources."
          />
          <StageCard
            stage="Growing"
            subs="10K–100K"
            income="$100–$1,000/month"
            insight="Revenue becomes meaningful but still inconsistent. Focus on improving packaging and retention rather than optimizing ad revenue."
          />
          <StageCard
            stage="Established"
            subs="100K+"
            income="$1,000–$10,000+/month"
            insight="Ads become a real income stream. But top creators earn more from diversified revenue than from ads alone."
          />
        </div>

        <div className="funCallout">
          <p className="funCallout__text">
            Many creators earn more from sponsorships, affiliate marketing,
            merchandise, and their own products than from ads. Diversifying
            income is important since ad revenue alone rarely supports full-time
            creation until you have substantial, consistent views.
          </p>
        </div>
      </section>

      {/* Beyond Ads */}
      <section id="beyond-ads" className="sectionTinted">
        <h2 className={s.sectionTitle}>Income Beyond Ads</h2>

        <p className={s.sectionText}>
          Smart creators do not rely only on ad revenue. Other income streams
          often pay better and are more predictable.
        </p>

        <div className="inlineIllustration">
          <LayerCake />
        </div>

        <div className="incomeGrid">
          <IncomeCard
            title="Sponsorships"
            description="Brands pay creators directly. Rates vary from $20 to $50+ per 1,000 views. A 100K view video could earn $2,000–$5,000 from a single sponsor."
          />
          <IncomeCard
            title="Affiliate Marketing"
            description="Commission on products you recommend. No subscriber threshold required. Works especially well for review and tutorial content."
          />
          <IncomeCard
            title="Merchandise"
            description="Sell branded products to your audience. Works best with engaged communities who identify with your brand."
          />
          <IncomeCard
            title="Memberships"
            description="Monthly support from dedicated fans. Even 100 members at $5 is $500 monthly—often more stable than ad revenue."
          />
          <IncomeCard
            title="Digital Products"
            description="Courses, templates, or ebooks related to your expertise. High margins, no inventory, and you keep most of the revenue."
          />
          <IncomeCard
            title="Services"
            description="Consulting, coaching, or freelance work related to your niche. Your channel becomes a lead generation engine."
          />
        </div>

        <p className={s.sectionText}>
          For more on building multiple income streams, see our{" "}
          <Link href="/learn/youtube-monetization-requirements">
            complete monetization guide
          </Link>
          .
        </p>
      </section>

      {/* Mistakes */}
      <section id="mistakes" className="sectionOpen">
        <h2 className={s.sectionTitle}>Common Misconceptions</h2>

        <div className="inlineIllustration">
          <BadTakesMuseum />
        </div>

        <div className="museumGrid">
          <MuseumPlaque
            myth="Everyone can make money on YouTube"
            reality="Most channels never reach monetization thresholds. Of those that do, most earn modest amounts. Success requires consistent effort over months or years."
          />
          <MuseumPlaque
            myth="Views equal money"
            reality="Views from non-monetized regions or with ad blockers generate little revenue. Engagement quality and audience location matter as much as view count."
          />
          <MuseumPlaque
            myth="More subscribers means more money"
            reality="Revenue comes from views, not subscriber count. A channel with fewer subscribers but more views earns more than a dormant channel with a large subscriber base."
          />
          <MuseumPlaque
            myth="YouTube pay is consistent"
            reality="RPM fluctuates monthly. January pays less than December. Some months are simply better than others, regardless of your content quality."
          />
          <MuseumPlaque
            myth="Buying views or subscribers helps earnings"
            reality="Fake engagement destroys your channel. YouTube detects it and may terminate your account. It also tanks your real metrics."
          />
        </div>

        <div className="warningCallout">
          <div className="warningCallout__icon">
            <FoamFinger />
          </div>
          <div className="warningCallout__content">
            <p className="warningCallout__title">
              Fake growth is not a shortcut
            </p>
            <p className="warningCallout__text">
              Purchased views and subscribers do not watch your content, click
              your ads, or buy your products. They actively harm your
              channel&apos;s performance signals. See our{" "}
              <Link href="/learn/free-youtube-subscribers">
                guide on why fake growth destroys channels
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* CTA Highlight */}
      <div className={s.highlight}>
        <p>
          <strong>Track what actually earns.</strong> Connect your channel to
          see your real RPM, identify which videos drive revenue, and understand
          where your best traffic comes from.
        </p>
      </div>
    </>
  );
}

/* ================================================
   LOCAL HELPER COMPONENTS
   ================================================ */

type MetricCardProps = {
  label: string;
  title: string;
  description: string;
  accent: "amber" | "green";
};

function MetricCard({ label, title, description, accent }: MetricCardProps) {
  const colors =
    accent === "amber"
      ? { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" }
      : { bg: "#dcfce7", border: "#22c55e", text: "#166534" };

  return (
    <div
      style={{
        background: colors.bg,
        border: `2px solid ${colors.border}`,
        borderRadius: "12px",
        padding: "20px",
      }}
    >
      <span
        style={{
          fontSize: "11px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: colors.text,
        }}
      >
        {label}
      </span>
      <h4
        style={{
          fontSize: "18px",
          fontWeight: 700,
          color: "#1e293b",
          margin: "8px 0",
        }}
      >
        {title}
      </h4>
      <p
        style={{
          fontSize: "14px",
          color: "#475569",
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        {description}
      </p>
    </div>
  );
}

type MillionViewsCardProps = {
  tier: string;
  rpm: string;
  earnings: string;
  example: string;
};

function MillionViewsCard({
  tier,
  rpm,
  earnings,
  example,
}: MillionViewsCardProps) {
  return (
    <div className="millionViewsCard">
      <span className="millionViewsCard__tier">{tier}</span>
      <span className="millionViewsCard__rpm">{rpm} RPM</span>
      <span className="millionViewsCard__earnings">{earnings}</span>
      <span className="millionViewsCard__example">{example}</span>
    </div>
  );
}

type FormulaRowProps = {
  label: string;
  parts: string[];
};

function FormulaRow({ label, parts }: FormulaRowProps) {
  return (
    <div className="formulaRow">
      <span className="formulaRow__label">{label}</span>
      <div className="formulaRow__formula">
        {parts.map((part, i) => (
          <span
            key={i}
            className={
              part === "=" || part === "x"
                ? "formulaRow__op"
                : "formulaRow__part"
            }
          >
            {part}
          </span>
        ))}
      </div>
    </div>
  );
}

type FactorCardProps = {
  title: string;
  description: string;
};

function FactorCard({ title, description }: FactorCardProps) {
  return (
    <div className="factorCard">
      <h4 className="factorCard__title">{title}</h4>
      <p className="factorCard__desc">{description}</p>
    </div>
  );
}

type StageCardProps = {
  stage: string;
  subs: string;
  income: string;
  insight: string;
};

function StageCard({ stage, subs, income, insight }: StageCardProps) {
  return (
    <div className="stageCard">
      <div className="stageCard__header">
        <span className="stageCard__stage">{stage}</span>
        <span className="stageCard__subs">{subs} subs</span>
      </div>
      <span className="stageCard__income">{income}</span>
      <p className="stageCard__insight">{insight}</p>
    </div>
  );
}

type IncomeCardProps = {
  title: string;
  description: string;
};

function IncomeCard({ title, description }: IncomeCardProps) {
  return (
    <div className="incomeCard">
      <h4 className="incomeCard__title">{title}</h4>
      <p className="incomeCard__desc">{description}</p>
    </div>
  );
}

type MuseumPlaqueProps = {
  myth: string;
  reality: string;
};

function MuseumPlaque({ myth, reality }: MuseumPlaqueProps) {
  return (
    <div className="museumPlaque">
      <p className="museumPlaque__myth">&ldquo;{myth}&rdquo;</p>
      <p className="museumPlaque__reality">{reality}</p>
    </div>
  );
}

/* ================================================
   INLINE SVG COMPONENTS
   ================================================ */

function CreatorCashRegister() {
  return (
    <svg
      width="140"
      height="120"
      viewBox="0 0 140 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Cash register showing ads as the primary revenue source"
    >
      <title>Creator Cash Register</title>
      {/* Register body */}
      <rect x="20" y="40" width="100" height="60" rx="6" fill="#1e293b" />
      <rect x="25" y="45" width="90" height="30" rx="4" fill="#0f172a" />
      {/* Display text */}
      <text
        x="70"
        y="65"
        textAnchor="middle"
        fontSize="12"
        fontWeight="bold"
        fill="#22c55e"
      >
        Ads (mostly)
      </text>
      {/* Buttons */}
      <rect x="30" y="80" width="20" height="12" rx="2" fill="#475569" />
      <rect x="55" y="80" width="20" height="12" rx="2" fill="#475569" />
      <rect x="80" y="80" width="30" height="12" rx="2" fill="#22c55e" />
      {/* Receipt printer */}
      <rect x="95" y="20" width="35" height="25" rx="3" fill="#64748b" />
      <rect x="100" y="15" width="25" height="8" rx="2" fill="#f8fafc" />
      {/* Receipt */}
      <rect x="102" y="8" width="21" height="20" fill="#f8fafc" />
      <text x="112" y="16" textAnchor="middle" fontSize="5" fill="#64748b">
        RPM
      </text>
      <text x="112" y="22" textAnchor="middle" fontSize="4" fill="#94a3b8">
        not CPM
      </text>
      {/* Dollar sign decoration */}
      <circle cx="35" cy="25" r="12" fill="#fef3c7" />
      <text x="35" y="30" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#d97706">
        $
      </text>
    </svg>
  );
}

function RevenuePlumbing() {
  return (
    <svg
      width="340"
      height="100"
      viewBox="0 0 340 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Revenue flow diagram showing money path from advertiser through YouTube to creator"
    >
      <title>Revenue Plumbing Diagram</title>
      {/* Advertiser */}
      <rect x="10" y="30" width="70" height="40" rx="6" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" />
      <text x="45" y="55" textAnchor="middle" fontSize="11" fontWeight="600" fill="#1e40af">
        Advertiser
      </text>
      {/* Pipe to YouTube */}
      <rect x="80" y="45" width="50" height="10" rx="2" fill="#94a3b8" />
      <path d="M95 40 L105 50 L95 60" fill="#22c55e" />
      {/* YouTube (with valve) */}
      <rect x="130" y="20" width="80" height="60" rx="8" fill="#fef2f2" stroke="#ef4444" strokeWidth="2" />
      <text x="170" y="45" textAnchor="middle" fontSize="11" fontWeight="600" fill="#dc2626">
        YouTube
      </text>
      {/* Valve */}
      <circle cx="170" cy="60" r="12" fill="#f87171" />
      <text x="170" y="64" textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">
        45%
      </text>
      {/* Pipe to Creator */}
      <rect x="210" y="45" width="50" height="10" rx="2" fill="#94a3b8" />
      <path d="M225 40 L235 50 L225 60" fill="#22c55e" />
      {/* Creator */}
      <rect x="260" y="30" width="70" height="40" rx="6" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
      <text x="295" y="48" textAnchor="middle" fontSize="11" fontWeight="600" fill="#166534">
        Creator
      </text>
      <text x="295" y="62" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#22c55e">
        55%
      </text>
    </svg>
  );
}

function SplitFlapBoard() {
  return (
    <svg
      width="300"
      height="100"
      viewBox="0 0 300 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Split-flap board showing CPM and RPM metrics"
    >
      <title>Split-Flap Board comparing CPM and RPM</title>
      {/* Board background */}
      <rect x="10" y="10" width="280" height="80" rx="4" fill="#1e293b" />
      {/* CPM flap */}
      <g>
        <rect x="25" y="20" width="110" height="60" rx="3" fill="#0f172a" />
        <rect x="25" y="20" width="110" height="28" rx="3" fill="#334155" />
        <line x1="25" y1="50" x2="135" y2="50" stroke="#1e293b" strokeWidth="2" />
        <text x="80" y="42" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#f59e0b">
          CPM
        </text>
        <text x="80" y="68" textAnchor="middle" fontSize="9" fill="#94a3b8">
          Advertiser pays
        </text>
      </g>
      {/* RPM flap */}
      <g>
        <rect x="165" y="20" width="110" height="60" rx="3" fill="#0f172a" />
        <rect x="165" y="20" width="110" height="28" rx="3" fill="#334155" />
        <line x1="165" y1="50" x2="275" y2="50" stroke="#1e293b" strokeWidth="2" />
        <text x="220" y="42" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#22c55e">
          RPM
        </text>
        <text x="220" y="68" textAnchor="middle" fontSize="9" fill="#94a3b8">
          You receive
        </text>
      </g>
      {/* Arrow */}
      <path d="M145 50 L155 50 M152 46 L158 50 L152 54" stroke="#64748b" strokeWidth="2" fill="none" />
    </svg>
  );
}

function PennyJar() {
  return (
    <svg
      width="100"
      height="110"
      viewBox="0 0 100 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Jar of coins representing view earnings distribution"
    >
      <title>View Penny Jar showing most views earn small amounts</title>
      {/* Jar */}
      <path
        d="M25 30 Q20 30 20 35 L20 95 Q20 105 30 105 L70 105 Q80 105 80 95 L80 35 Q80 30 75 30"
        fill="#f8fafc"
        stroke="#cbd5e1"
        strokeWidth="2"
      />
      {/* Jar opening */}
      <ellipse cx="50" cy="30" rx="28" ry="6" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
      {/* Lid */}
      <rect x="35" y="18" width="30" height="8" rx="2" fill="#94a3b8" />
      {/* Pennies (many small coins at bottom) */}
      <circle cx="35" cy="90" r="6" fill="#f59e0b" opacity="0.7" />
      <circle cx="50" cy="93" r="5" fill="#f59e0b" opacity="0.6" />
      <circle cx="62" cy="88" r="5" fill="#f59e0b" opacity="0.7" />
      <circle cx="40" cy="77" r="4" fill="#fcd34d" opacity="0.6" />
      <circle cx="55" cy="80" r="4" fill="#fcd34d" opacity="0.5" />
      <circle cx="68" cy="75" r="4" fill="#fcd34d" opacity="0.6" />
      <circle cx="32" cy="65" r="3" fill="#fef3c7" opacity="0.5" />
      <circle cx="45" cy="67" r="3" fill="#fef3c7" opacity="0.4" />
      <circle cx="58" cy="63" r="3" fill="#fef3c7" opacity="0.5" />
      <circle cx="70" cy="60" r="3" fill="#fef3c7" opacity="0.4" />
      {/* Quarter (rare high value) */}
      <circle cx="45" cy="50" r="9" fill="#22c55e" />
      <text x="45" y="54" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white">
        $
      </text>
    </svg>
  );
}

function ShippingLabel() {
  return (
    <svg
      width="200"
      height="100"
      viewBox="0 0 200 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Shipping label showing million views calculation"
    >
      <title>Million Views Shipping Label showing the RPM formula</title>
      {/* Label background */}
      <rect x="10" y="10" width="180" height="80" rx="4" fill="#fef9c3" stroke="#eab308" strokeWidth="2" strokeDasharray="8 4" />
      {/* Barcode decoration */}
      <g>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
          <rect
            key={i}
            x={20 + i * 6}
            y="65"
            width={i % 3 === 0 ? 3 : 2}
            height="18"
            fill="#1e293b"
          />
        ))}
      </g>
      {/* Main formula */}
      <text x="100" y="32" textAnchor="middle" fontSize="10" fill="#78350f">
        CONTENTS:
      </text>
      <text x="100" y="52" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1e293b">
        1M views x RPM
      </text>
      {/* Ship to */}
      <text x="140" y="78" textAnchor="start" fontSize="8" fill="#92400e">
        = earnings
      </text>
    </svg>
  );
}

function WeatherCard() {
  return (
    <svg
      width="140"
      height="90"
      viewBox="0 0 140 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Weather forecast showing Q4 high ad spend and January low"
    >
      <title>Seasonality Weather Report</title>
      {/* Card */}
      <rect x="5" y="5" width="130" height="80" rx="8" fill="#0f172a" />
      <rect x="5" y="5" width="130" height="24" rx="8" fill="#1e293b" />
      <rect x="5" y="21" width="130" height="8" fill="#1e293b" />
      <text x="70" y="20" textAnchor="middle" fontSize="9" fontWeight="600" fill="#94a3b8">
        AD SPEND FORECAST
      </text>
      {/* Q4 */}
      <g>
        <circle cx="40" cy="55" r="14" fill="#fef3c7" />
        <circle cx="40" cy="55" r="10" fill="#f59e0b" />
        <text x="40" y="59" textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">
          Q4
        </text>
        <text x="40" y="78" textAnchor="middle" fontSize="7" fill="#22c55e">
          High
        </text>
      </g>
      {/* January */}
      <g>
        <circle cx="100" cy="55" r="14" fill="#e0f2fe" />
        <path d="M92 50 L108 50 M92 55 L108 55 M92 60 L108 60" stroke="#0ea5e9" strokeWidth="2" />
        <text x="100" y="78" textAnchor="middle" fontSize="7" fill="#dc2626">
          Jan: Low
        </text>
      </g>
    </svg>
  );
}

function ControlPanel() {
  return (
    <svg
      width="320"
      height="120"
      viewBox="0 0 320 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Control panel with levers for factors affecting YouTube earnings"
    >
      <title>Earnings Control Panel</title>
      {/* Panel */}
      <rect x="10" y="10" width="300" height="100" rx="8" fill="#1e293b" />
      <rect x="10" y="10" width="300" height="25" rx="8" fill="#334155" />
      <rect x="10" y="27" width="300" height="8" fill="#334155" />
      <text x="160" y="27" textAnchor="middle" fontSize="10" fontWeight="600" fill="#94a3b8">
        EARNINGS CONTROL PANEL
      </text>
      {/* Knobs/toggles */}
      {[
        { x: 45, label: "Niche", on: true },
        { x: 100, label: "Geo", on: true },
        { x: 155, label: "Length", on: false },
        { x: 210, label: "Season", on: true },
        { x: 265, label: "Safe", on: true },
      ].map((knob, i) => (
        <g key={i}>
          <rect x={knob.x - 15} y={50} width={30} height={14} rx={7} fill={knob.on ? "#22c55e" : "#475569"} />
          <circle cx={knob.on ? knob.x + 8 : knob.x - 8} cy={57} r={5} fill="white" />
          <text x={knob.x} y={78} textAnchor="middle" fontSize="8" fill="#94a3b8">
            {knob.label}
          </text>
        </g>
      ))}
      {/* Status lights */}
      <circle cx="30" y="95" r="4" fill="#22c55e" />
      <text x="40" y="98" fontSize="7" fill="#64748b">
        More factors ON = higher potential
      </text>
    </svg>
  );
}

function PayLadder() {
  return (
    <svg
      width="320"
      height="200"
      viewBox="0 0 320 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Ladder showing niche RPM tiers from low to high"
    >
      <title>Niche Pay Ladder</title>
      {/* Ladder rails */}
      <rect x="30" y="20" width="8" height="170" rx="2" fill="#475569" />
      <rect x="282" y="20" width="8" height="170" rx="2" fill="#475569" />
      {/* High tier rung */}
      <rect x="30" y="35" width="260" height="40" rx="4" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
      <text x="50" y="52" fontSize="10" fontWeight="700" fill="#166534">
        Higher ($5–15+ RPM)
      </text>
      <g>
        {["Finance", "Business", "Software", "Legal", "Real Estate"].map((niche, i) => (
          <rect key={i} x={50 + i * 50} y={58} width={45} height={14} rx={7} fill="#bbf7d0">
            <title>{niche}</title>
          </rect>
        ))}
        {["Finance", "Business", "Software", "Legal", "Real Estate"].map((niche, i) => (
          <text key={i} x={72 + i * 50} y={68} textAnchor="middle" fontSize="7" fill="#166534">
            {niche}
          </text>
        ))}
      </g>
      {/* Medium tier rung */}
      <rect x="30" y="90" width="260" height="40" rx="4" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
      <text x="50" y="107" fontSize="10" fontWeight="700" fill="#92400e">
        Medium ($2–5 RPM)
      </text>
      <g>
        {["Education", "Cooking", "Travel", "Fitness", "DIY"].map((niche, i) => (
          <rect key={i} x={50 + i * 50} y={113} width={45} height={14} rx={7} fill="#fde68a">
            <title>{niche}</title>
          </rect>
        ))}
        {["Education", "Cooking", "Travel", "Fitness", "DIY"].map((niche, i) => (
          <text key={i} x={72 + i * 50} y={123} textAnchor="middle" fontSize="7" fill="#92400e">
            {niche}
          </text>
        ))}
      </g>
      {/* Lower tier rung */}
      <rect x="30" y="145" width="260" height="40" rx="4" fill="#fee2e2" stroke="#f87171" strokeWidth="2" />
      <text x="50" y="162" fontSize="10" fontWeight="700" fill="#991b1b">
        Lower ($1–3 RPM)
      </text>
      <g>
        {["Gaming", "Comedy", "Music", "Vlogs", "Kids"].map((niche, i) => (
          <rect key={i} x={50 + i * 50} y={168} width={45} height={14} rx={7} fill="#fecaca">
            <title>{niche}</title>
          </rect>
        ))}
        {["Gaming", "Comedy", "Music", "Vlogs", "Kids"].map((niche, i) => (
          <text key={i} x={72 + i * 50} y={178} textAnchor="middle" fontSize="7" fill="#991b1b">
            {niche}
          </text>
        ))}
      </g>
    </svg>
  );
}

function BudgetTable() {
  return (
    <svg
      width="340"
      height="120"
      viewBox="0 0 340 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Table with three placemats representing small, growing, and established creator earnings"
    >
      <title>Creator Budget Table</title>
      {/* Table */}
      <rect x="10" y="60" width="320" height="50" rx="4" fill="#78350f" />
      <rect x="15" y="65" width="310" height="40" rx="2" fill="#92400e" />
      {/* Placemats */}
      <g>
        {/* Small */}
        <rect x="25" y="25" width="90" height="55" rx="4" fill="#f1f5f9" />
        <text x="70" y="42" textAnchor="middle" fontSize="9" fontWeight="600" fill="#64748b">
          Small
        </text>
        <text x="70" y="55" textAnchor="middle" fontSize="7" fill="#94a3b8">
          1K-10K subs
        </text>
        <rect x="40" y="62" width="50" height={12} rx="2" fill="white" stroke="#e2e8f0" strokeWidth="1" />
        <text x="65" y="71" textAnchor="middle" fontSize="7" fill="#94a3b8">
          $0-$100
        </text>
      </g>
      <g>
        {/* Growing */}
        <rect x="125" y="25" width="90" height="55" rx="4" fill="#dbeafe" />
        <text x="170" y="42" textAnchor="middle" fontSize="9" fontWeight="600" fill="#1e40af">
          Growing
        </text>
        <text x="170" y="55" textAnchor="middle" fontSize="7" fill="#3b82f6">
          10K-100K subs
        </text>
        <rect x="140" y="62" width="50" height={12} rx="2" fill="white" stroke="#bfdbfe" strokeWidth="1" />
        <text x="165" y="71" textAnchor="middle" fontSize="7" fill="#3b82f6">
          $100-$1K
        </text>
      </g>
      <g>
        {/* Established */}
        <rect x="225" y="25" width="90" height="55" rx="4" fill="#dcfce7" />
        <text x="270" y="42" textAnchor="middle" fontSize="9" fontWeight="600" fill="#166534">
          Established
        </text>
        <text x="270" y="55" textAnchor="middle" fontSize="7" fill="#22c55e">
          100K+ subs
        </text>
        <rect x="240" y="62" width="50" height={12} rx="2" fill="white" stroke="#bbf7d0" strokeWidth="1" />
        <text x="265" y="71" textAnchor="middle" fontSize="7" fill="#22c55e">
          $1K-$10K+
        </text>
      </g>
    </svg>
  );
}

function LayerCake() {
  return (
    <svg
      width="200"
      height="180"
      viewBox="0 0 200 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Layered cake representing different income streams"
    >
      <title>Income Layer Cake showing diversified revenue</title>
      {/* Plate */}
      <ellipse cx="100" cy="165" rx="80" ry="10" fill="#e2e8f0" />
      {/* Layer 1 - Ads (base) */}
      <path d="M30 145 Q30 155 100 155 Q170 155 170 145 L170 130 Q170 140 100 140 Q30 140 30 130 Z" fill="#fecaca" />
      <text x="100" y="150" textAnchor="middle" fontSize="9" fill="#991b1b">
        Ads
      </text>
      {/* Layer 2 - Sponsors */}
      <path d="M35 125 Q35 135 100 135 Q165 135 165 125 L165 110 Q165 120 100 120 Q35 120 35 110 Z" fill="#fde68a" />
      <text x="100" y="130" textAnchor="middle" fontSize="9" fill="#92400e">
        Sponsors
      </text>
      {/* Layer 3 - Affiliate */}
      <path d="M40 105 Q40 115 100 115 Q160 115 160 105 L160 90 Q160 100 100 100 Q40 100 40 90 Z" fill="#bbf7d0" />
      <text x="100" y="110" textAnchor="middle" fontSize="9" fill="#166534">
        Affiliate
      </text>
      {/* Layer 4 - Products */}
      <path d="M45 85 Q45 95 100 95 Q155 95 155 85 L155 70 Q155 80 100 80 Q45 80 45 70 Z" fill="#bfdbfe" />
      <text x="100" y="90" textAnchor="middle" fontSize="9" fill="#1e40af">
        Products
      </text>
      {/* Layer 5 - Memberships (top) */}
      <ellipse cx="100" cy="65" rx="50" ry="10" fill="#e9d5ff" />
      <path d="M50 55 Q50 65 100 65 Q150 65 150 55 L150 45 Q150 55 100 55 Q50 55 50 45 Z" fill="#c4b5fd" />
      <text x="100" y="60" textAnchor="middle" fontSize="9" fill="#6b21a8">
        Memberships
      </text>
      {/* Cherry on top */}
      <circle cx="100" cy="35" r="8" fill="#ef4444" />
      <path d="M100 27 Q105 20 110 25" stroke="#22c55e" strokeWidth="2" fill="none" />
    </svg>
  );
}

function BadTakesMuseum() {
  return (
    <svg
      width="280"
      height="75"
      viewBox="0 0 280 75"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Museum gallery wall with framed misconceptions"
    >
      <title>Museum of Bad Takes</title>
      {/* Wall */}
      <rect x="10" y="20" width="260" height="55" fill="#f8fafc" />
      {/* Wainscoting */}
      <rect x="10" y="55" width="260" height="20" fill="#e2e8f0" />
      {/* Picture frames */}
      <g>
        <rect x="30" y="28" width="35" height="25" fill="#fef2f2" stroke="#fca5a5" strokeWidth="2" />
        <text x="47" y="43" textAnchor="middle" fontSize="5" fill="#dc2626">
          MYTH
        </text>
      </g>
      <g>
        <rect x="80" y="28" width="35" height="25" fill="#fef2f2" stroke="#fca5a5" strokeWidth="2" />
        <text x="97" y="43" textAnchor="middle" fontSize="5" fill="#dc2626">
          MYTH
        </text>
      </g>
      <g>
        <rect x="130" y="28" width="35" height="25" fill="#fef2f2" stroke="#fca5a5" strokeWidth="2" />
        <text x="147" y="43" textAnchor="middle" fontSize="5" fill="#dc2626">
          MYTH
        </text>
      </g>
      <g>
        <rect x="180" y="28" width="35" height="25" fill="#fef2f2" stroke="#fca5a5" strokeWidth="2" />
        <text x="197" y="43" textAnchor="middle" fontSize="5" fill="#dc2626">
          MYTH
        </text>
      </g>
      <g>
        <rect x="230" y="28" width="35" height="25" fill="#fef2f2" stroke="#fca5a5" strokeWidth="2" />
        <text x="247" y="43" textAnchor="middle" fontSize="5" fill="#dc2626">
          MYTH
        </text>
      </g>
      {/* Museum sign */}
      <rect x="90" y="5" width="100" height="18" rx="2" fill="#1e293b" />
      <text x="140" y="17" textAnchor="middle" fontSize="8" fontWeight="600" fill="white">
        MUSEUM OF BAD TAKES
      </text>
    </svg>
  );
}

function FoamFinger() {
  return (
    <svg
      width="50"
      height="60"
      viewBox="0 0 50 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Foam finger pointing */}
      <path
        d="M10 55 L10 30 Q10 25 15 25 L25 25 L25 10 Q25 5 30 5 Q35 5 35 10 L35 25 L40 25 Q45 25 45 30 L45 55 Q45 58 40 58 L15 58 Q10 58 10 55 Z"
        fill="#fef3c7"
        stroke="#f59e0b"
        strokeWidth="2"
      />
      {/* Text on finger */}
      <text
        x="27"
        y="45"
        textAnchor="middle"
        fontSize="5"
        fontWeight="bold"
        fill="#92400e"
        transform="rotate(-5 27 45)"
      >
        BRAND
      </text>
      <text
        x="27"
        y="52"
        textAnchor="middle"
        fontSize="5"
        fontWeight="bold"
        fill="#92400e"
        transform="rotate(-5 27 52)"
      >
        SAFE
      </text>
    </svg>
  );
}
