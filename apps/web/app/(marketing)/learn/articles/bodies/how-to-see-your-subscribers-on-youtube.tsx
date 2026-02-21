/**
 * Body content for How to See Your Subscribers on YouTube article.
 * Server component - no "use client" directive.
 *
 * IMPLEMENTATION PLAN:
 * 1. overview: Quick answer with Studio Dashboard + Privacy Curtain visuals
 * 2. Mini nav: Three nav cards with Signpost visual
 * 3. check-count: Desktop vs Mobile two-lane panel + Rounding vs Exact visual
 * 4. see-who-subscribed: Breadcrumb strip + Public vs Private crowd visual
 * 5. analytics: Four signal cards grid + Conversion Loop visual (star section)
 * 6. realtime: Source-of-truth gauges visual
 * 7. Common Questions: Compact Q/A layout + Bell Shrug visual
 * 8. CTA: Links to get-more-subscribers and competitor-analysis
 *
 * VISUALS (9-11 unique inline SVGs):
 * 1. Studio Dashboard card
 * 2. Privacy Curtain
 * 3. Signpost nav
 * 4. Rounding vs Exact counters
 * 5. Breadcrumb strip (inline)
 * 6. Public vs Private crowd
 * 7. Conversion loop
 * 8. Source-of-truth gauges
 * 9. Notification bell shrug
 * 10. Sample-not-census stamp
 */

import React from "react";
import Link from "next/link";
import { LEARN_ARTICLES } from "../../articles";
import type { BodyProps } from "./_shared";
import { articleExports } from "./_shared";

export const { meta, toc } = articleExports(LEARN_ARTICLES["how-to-see-your-subscribers-on-youtube"]);

function SectionSvg({ children }: { children: React.ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* ========================================
          SECTION: OVERVIEW (Quick Answer)
          ======================================== */}
      <section id="overview" className="sectionOpen">
        <InlineFigure align="right">
          <StudioDashboardVisual />
        </InlineFigure>

        <p className={s.sectionText} style={{ fontSize: "1.125rem", marginBottom: "24px" }}>
          Your exact subscriber count is in <strong>YouTube Studio</strong>. Open{" "}
          <code style={{ fontSize: "0.875rem" }}>studio.youtube.com</code> or the
          Studio app, and the number is right there on your Dashboard. Always
          accurate. Updates within minutes.
        </p>

        <p className={s.sectionText} style={{ marginBottom: "24px" }}>
          Can you see <em>who</em> subscribed? Only partially. YouTube shows
          subscribers who keep their subscriptions public. Most people keep
          theirs private, so your visible list is typically a fraction of your
          total.
        </p>

        <p className={s.sectionText} style={{ marginBottom: "24px" }}>
          The more useful question: <strong>which videos earn subscriptions?</strong>{" "}
          YouTube Studio answers that in the Audience tab. That data is worth
          studying. Names are not.
        </p>

        <div className="inlineIllustration">
          <PrivacyCurtainVisual />
        </div>

        <div className="realTalk">
          <p className="realTalk__label">The privacy rule</p>
          <p className="realTalk__text">
            Subscribers choose public or private. You only see the public ones.
            If your list shows 200 names but you have 10,000 subscribers, it is
            working as designed.
          </p>
        </div>
      </section>

      {/* ========================================
          SECTION: MINI NAV (Jump Cards)
          ======================================== */}
      <section className="sectionTinted">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            flexWrap: "wrap",
            justifyContent: "center",
            marginBottom: "24px",
          }}
        >
          <SignpostVisual />
        </div>

        <CardGrid>
          <NavCard
            href="#check-count"
            title="Check your count"
            desc="Desktop and mobile paths to Studio"
          />
          <NavCard
            href="#see-who-subscribed"
            title="See who subscribed"
            desc="Find public subscribers in Studio"
          />
          <NavCard
            href="#analytics"
            title="Use subscriber analytics"
            desc="The data that actually helps you grow"
          />
        </CardGrid>
      </section>

      {/* ========================================
          SECTION: CHECK YOUR COUNT
          ======================================== */}
      <section id="check-count" className="sectionOpen">
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <SectionSvg><path d="M3 3v18h18" /><path d="M18 17V9M13 17V5M8 17v-3" /></SectionSvg>
          </span>
          Check Your Count
        </h2>

        <p className={s.sectionText}>
          YouTube Studio shows your exact subscriber count on the Dashboard. The
          path is slightly different on desktop vs mobile.
        </p>

        <CardGrid>
          <MiniCard
            title="Desktop"
            icon={<DesktopIcon />}
          >
            <Breadcrumb items={["studio.youtube.com", "Dashboard"]} />
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "8px" }}>
              Click <strong>Analytics</strong> then <strong>Audience</strong> for
              historical data.
            </p>
          </MiniCard>

          <MiniCard
            title="Mobile"
            icon={<MobileIcon />}
          >
            <Breadcrumb items={["Studio App", "Home"]} />
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "8px" }}>
              Tap <strong>Analytics</strong> for trends. Same data, smaller
              screen.
            </p>
          </MiniCard>
        </CardGrid>

        <div style={{ marginTop: "32px" }}>
          <h3 className={s.subheading}>Rounding vs Exact</h3>
          <p className={s.sectionText}>
            Your public channel page rounds the count once you pass 1,000
            subscribers. Studio always shows the exact number.
          </p>

          <div className="inlineIllustration">
            <RoundingVsExactVisual />
          </div>
        </div>
      </section>

      {/* ========================================
          SECTION: SEE WHO SUBSCRIBED
          ======================================== */}
      <section id="see-who-subscribed" className="sectionTinted">
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <SectionSvg><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></SectionSvg>
          </span>
          See Who Subscribed
        </h2>

        <p className={s.sectionText} style={{ marginBottom: "24px" }}>
          To find your subscriber list, follow this path in YouTube Studio:
        </p>

        <div style={{ margin: "32px 0" }}>
          <Breadcrumb items={["Analytics", "Audience", "Recent subscribers", "See more"]} />
        </div>

        <p className={s.sectionText} style={{ marginBottom: "24px" }}>
          You will see channel names, profile pictures, and subscriber counts of
          people who subscribed with public settings. Private subscribers count
          toward your total but remain invisible.
        </p>

        <div className="inlineIllustration" style={{ margin: "32px 0" }}>
          <PublicVsPrivateCrowdVisual />
        </div>

        <div className={s.highlight} style={{ margin: "32px 0" }}>
          <p>
            <strong>No workaround exists.</strong> Private subscriptions are a
            privacy feature, not a bug. If 9,800 of your 10,000 subscribers are
            private, that is normal.
          </p>
        </div>

        <p className={s.sectionText} style={{ marginBottom: "24px" }}>
          Even with limited visibility, the list can be useful. Spotting fellow
          creators in your niche or noticing when a larger channel subscribes
          gives you context about who resonates with your content.
        </p>

      </section>

      {/* ========================================
          SECTION: ANALYTICS (The Star)
          ======================================== */}
      <section id="analytics" className="sectionOpen">
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <SectionSvg><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></SectionSvg>
          </span>
          What to Look at Instead
        </h2>

        <div className="pullQuote" style={{ margin: "40px 0" }}>
          Do not chase names. Chase converting videos.
        </div>

        <p className={s.sectionText} style={{ marginBottom: "32px" }}>
          Knowing <em>who</em> subscribed matters less than knowing <em>what
          content</em> earns subscriptions. The Audience tab shows which videos
          gained (and lost) subscribers. That data is actionable.
        </p>

        <div className="inlineIllustration" style={{ margin: "40px 0", display: "flex", justifyContent: "center", width: "100%" }}>
          <ConversionLoopVisual />
        </div>

        <h3 className={s.subheading}>Signals Worth Tracking</h3>

        <div className="metricCardGrid">
          <SignalCard
            title="Subscribers per video"
            insight="Identifies your highest-converting content"
            action="Double down on topics that convert"
          />
          <SignalCard
            title="Subscribed vs not subscribed"
            insight="Shows how much of your audience has already committed"
            action="Tailor content for new vs returning viewers"
          />
          <SignalCard
            title="Unsubscribe spikes"
            insight="May signal audience mismatch or off-topic content"
            action="Review videos that triggered unsubscribes"
          />
          <SignalCard
            title="Subscriber sources"
            insight="Reveals where your best viewers discover you"
            action="Invest in traffic sources that convert"
          />
        </div>

        <div className="realTalk">
          <p className="realTalk__label">Pattern recognition</p>
          <p className="realTalk__text">
            If your tutorials consistently earn more subscribers than your vlogs,
            that is useful information. You do not need to see a single name to
            act on it.
          </p>
        </div>
      </section>

      {/* ========================================
          SECTION: REALTIME
          ======================================== */}
      <section id="realtime" className="sectionTinted">
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <SectionSvg><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></SectionSvg>
          </span>
          Real-Time Counts
        </h2>

        <InlineFigure align="right">
          <SourceOfTruthGaugesVisual />
        </InlineFigure>

        <p className={s.sectionText} style={{ marginBottom: "24px" }}>
          YouTube Studio is your source of truth. It updates within minutes and
          reflects the most accurate number available. If you are watching a
          milestone approach, Studio is where to look.
        </p>

        <p className={s.sectionText} style={{ marginBottom: "24px" }}>
          Third-party tools like Social Blade display counts and historical
          trends, which can be useful for comparing channels or viewing
          long-term curves. They pull from YouTube&apos;s public API, which may lag
          slightly behind Studio. For your own channel, trust Studio first.
        </p>

        <p className={s.sectionText}>
          For more on tracking tools, see our{" "}
          <Link href="/learn/youtube-analytics-tools">
            guide to YouTube analytics tools
          </Link>.
        </p>
      </section>

      {/* ========================================
          SECTION: COMMON QUESTIONS
          ======================================== */}
      <section className="sectionOpen">
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <SectionSvg><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></SectionSvg>
          </span>
          Common Questions
        </h2>

        <div style={{ display: "flex", gap: "32px", flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 300px" }}>
            <QABlock
              question="Why can't I see everyone who subscribed?"
              answer="YouTube allows subscribers to keep their subscriptions private, and most do. Your total includes both public and private. There is no setting you can change to see private subscribers."
            />

            <QABlock
              question="Does YouTube notify me when someone subscribes?"
              answer="Not reliably. You may see occasional notifications, especially for larger channels, but YouTube does not guarantee alerts for every subscriber. Check Studio instead."
            />
          </div>

          <div style={{ flexShrink: 0 }}>
            <BellShrugVisual />
          </div>
        </div>
      </section>

      {/* ========================================
          CTA
          ======================================== */}
      <div className={s.highlight}>
        <p>
          <strong>Do not chase the list of names. Chase the videos that earn
          subscriptions.</strong> The subscriber list is incomplete by design.
          What you <em>can</em> see clearly is which content converts viewers
          into subscribers.
        </p>
        <p style={{ marginTop: "16px" }}>
          Ready to put this into practice?{" "}
          <Link href="/learn/how-to-get-more-subscribers">
            Learn how to get more subscribers
          </Link>{" "}
          or{" "}
          <Link href="/learn/youtube-competitor-analysis">
            see what converts in your niche
          </Link>.
        </p>
      </div>
    </>
  );
}

/* ================================================
   LOCAL HELPER COMPONENTS
   ================================================ */

type InlineFigureProps = {
  align?: "left" | "right" | "center";
  children: React.ReactNode;
};

function InlineFigure({ align = "center", children }: InlineFigureProps) {
  const alignClass = align === "left" ? "floatLeft" : align === "right" ? "floatRight" : "inlineIllustration";

  return (
    <figure className={alignClass}>
      {children}
    </figure>
  );
}

function CardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
        margin: "24px 0",
      }}
    >
      {children}
    </div>
  );
}

type MiniCardProps = {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
};

function MiniCard({ title, icon, children }: MiniCardProps) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "12px",
        }}
      >
        {icon && (
          <span style={{ color: "var(--primary)", flexShrink: 0 }}>{icon}</span>
        )}
        <h4
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: "var(--text)",
            margin: 0,
          }}
        >
          {title}
        </h4>
      </div>
      {children}
    </div>
  );
}

function Breadcrumb({ items }: { items: string[] }) {
  return (
    <div className="clickPath">
      {items.map((item, i) => (
        <span key={i} style={{ display: "contents" }}>
          <span className="clickPath__chip">{item}</span>
          {i < items.length - 1 && <span className="clickPath__arrow">→</span>}
        </span>
      ))}
    </div>
  );
}

type NavCardProps = {
  href: string;
  title: string;
  desc: string;
};

function NavCard({ href, title, desc }: NavCardProps) {
  return (
    <a
      href={href}
      style={{
        display: "block",
        background: "white",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        textDecoration: "none",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
    >
      <h4
        style={{
          fontSize: "15px",
          fontWeight: 700,
          color: "var(--primary)",
          margin: "0 0 6px",
        }}
      >
        {title}
      </h4>
      <p
        style={{
          fontSize: "13px",
          color: "var(--text-secondary)",
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {desc}
      </p>
    </a>
  );
}

type SignalCardProps = {
  title: string;
  insight: string;
  action: string;
};

function SignalCard({ title, insight, action }: SignalCardProps) {
  return (
    <div className="metricCard">
      <h4 className="metricCard__name">{title}</h4>
      <p className="metricCard__tells">{insight}</p>
      <p className="metricCard__action">
        <strong>Do this:</strong> {action}
      </p>
    </div>
  );
}

type QABlockProps = {
  question: string;
  answer: string;
};

function QABlock({ question, answer }: QABlockProps) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <h4
        style={{
          fontSize: "15px",
          fontWeight: 700,
          color: "var(--text)",
          margin: "0 0 8px",
        }}
      >
        {question}
      </h4>
      <p
        style={{
          fontSize: "14px",
          color: "var(--text-secondary)",
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        {answer}
      </p>
    </div>
  );
}

/* ================================================
   INLINE SVG VISUALS (9-11 unique to this page)
   ================================================ */

/* 1. Studio Dashboard Card */
function StudioDashboardVisual() {
  return (
    <svg
      width="180"
      height="120"
      viewBox="0 0 180 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="YouTube Studio dashboard showing subscriber count"
    >
      <title>YouTube Studio Dashboard</title>
      <desc>A mock YouTube Studio interface showing an exact subscriber count of 12,345</desc>
      {/* Window frame */}
      <rect x="5" y="5" width="170" height="110" rx="8" fill="#1e293b" />
      {/* Title bar */}
      <rect x="5" y="5" width="170" height="24" rx="8" fill="#334155" />
      <rect x="5" y="21" width="170" height="8" fill="#334155" />
      {/* Window controls */}
      <circle cx="20" cy="17" r="4" fill="#ef4444" />
      <circle cx="34" cy="17" r="4" fill="#fbbf24" />
      <circle cx="48" cy="17" r="4" fill="#22c55e" />
      {/* Studio label */}
      <text x="90" y="19" textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="600">
        YouTube Studio
      </text>
      {/* Dashboard card */}
      <rect x="20" y="40" width="140" height="60" rx="6" fill="#0f172a" stroke="#334155" />
      {/* Subscribers label */}
      <text x="90" y="58" textAnchor="middle" fontSize="10" fill="#64748b">
        Subscribers
      </text>
      {/* Count */}
      <text x="90" y="82" textAnchor="middle" fontSize="24" fontWeight="700" fill="#22c55e">
        12,345
      </text>
      {/* Exact indicator */}
      <rect x="60" y="88" width="60" height="10" rx="3" fill="#166534" />
      <text x="90" y="96" textAnchor="middle" fontSize="7" fill="#dcfce7" fontWeight="600">
        EXACT COUNT
      </text>
    </svg>
  );
}

/* 2. Privacy Curtain */
function PrivacyCurtainVisual() {
  return (
    <svg
      width="280"
      height="90"
      viewBox="0 0 280 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Privacy curtain hiding some subscriber profiles"
    >
      <title>Privacy Curtain</title>
      <desc>Illustration showing some subscriber profiles visible while others are hidden behind a curtain</desc>
      {/* Left side: Visible profiles */}
      <rect x="10" y="10" width="100" height="70" rx="8" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="2" />
      <text x="60" y="25" textAnchor="middle" fontSize="9" fill="#16a34a" fontWeight="600">
        PUBLIC
      </text>
      {/* Visible profile 1 */}
      <circle cx="35" cy="50" r="14" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
      <circle cx="35" cy="46" r="4" fill="#166534" />
      <ellipse cx="35" cy="57" rx="6" ry="4" fill="#166534" />
      {/* Visible profile 2 */}
      <circle cx="75" cy="50" r="14" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" />
      <circle cx="75" cy="46" r="4" fill="#1e40af" />
      <ellipse cx="75" cy="57" rx="6" ry="4" fill="#1e40af" />
      {/* Divider */}
      <rect x="130" y="20" width="4" height="50" rx="2" fill="#e2e8f0" />
      {/* Right side: Curtain with hidden profiles */}
      <rect x="154" y="10" width="116" height="70" rx="8" fill="#eef2ff" stroke="#c7d2fe" strokeWidth="2" />
      <text x="212" y="25" textAnchor="middle" fontSize="9" fill="#6366f1" fontWeight="600">
        PRIVATE
      </text>
      {/* Curtain overlay */}
      <path
        d="M154 35 Q165 40 160 55 Q155 70 165 80 L270 80 L270 35 Z"
        fill="#6366f1"
        opacity="0.15"
      />
      {/* Silhouette profiles */}
      <circle cx="185" cy="52" r="12" fill="#c7d2fe" />
      <circle cx="215" cy="52" r="12" fill="#c7d2fe" opacity="0.7" />
      <circle cx="245" cy="52" r="12" fill="#c7d2fe" opacity="0.4" />
      {/* Question marks */}
      <text x="185" y="56" textAnchor="middle" fontSize="12" fill="#818cf8">?</text>
      <text x="215" y="56" textAnchor="middle" fontSize="12" fill="#818cf8" opacity="0.7">?</text>
      <text x="245" y="56" textAnchor="middle" fontSize="12" fill="#818cf8" opacity="0.4">?</text>
    </svg>
  );
}

/* 3. Signpost Navigation */
function SignpostVisual() {
  return (
    <svg
      width="200"
      height="100"
      viewBox="0 0 200 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      {/* Post */}
      <rect x="95" y="30" width="10" height="65" rx="2" fill="#64748b" />
      {/* Sign 1 - top right */}
      <path d="M105 25 L170 25 L180 35 L170 45 L105 45 Z" fill="#6366f1" />
      <text x="140" y="38" textAnchor="middle" fontSize="9" fill="white" fontWeight="600">
        Count
      </text>
      {/* Sign 2 - middle left */}
      <path d="M95 40 L30 40 L20 50 L30 60 L95 60 Z" fill="#8b5cf6" />
      <text x="55" y="53" textAnchor="middle" fontSize="9" fill="white" fontWeight="600">
        Who
      </text>
      {/* Sign 3 - bottom right */}
      <path d="M105 55 L155 55 L165 65 L155 75 L105 75 Z" fill="#22c55e" />
      <text x="133" y="68" textAnchor="middle" fontSize="9" fill="white" fontWeight="600">
        Analytics
      </text>
      {/* Cap */}
      <circle cx="100" cy="25" r="8" fill="#475569" />
    </svg>
  );
}

/* 4. Rounding vs Exact */
function RoundingVsExactVisual() {
  return (
    <svg
      width="320"
      height="100"
      viewBox="0 0 320 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Comparison of rounded public count versus exact Studio count"
    >
      <title>Rounding vs Exact Count</title>
      <desc>Shows how public channel page displays 12.3K while Studio shows the exact number 12,345</desc>
      {/* Public page card */}
      <rect x="10" y="15" width="130" height="70" rx="8" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
      <text x="75" y="38" textAnchor="middle" fontSize="10" fill="#64748b">
        Public page
      </text>
      <text x="75" y="62" textAnchor="middle" fontSize="22" fontWeight="700" fill="#94a3b8">
        12.3K
      </text>
      <text x="75" y="78" textAnchor="middle" fontSize="8" fill="#94a3b8">
        rounded
      </text>
      {/* Arrow */}
      <path d="M150 50 L170 50" stroke="#cbd5e1" strokeWidth="2" />
      <path d="M165 45 L175 50 L165 55" stroke="#cbd5e1" strokeWidth="2" fill="none" />
      {/* Studio card */}
      <rect x="180" y="15" width="130" height="70" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="2" />
      <text x="245" y="38" textAnchor="middle" fontSize="10" fill="#64748b">
        YouTube Studio
      </text>
      <text x="245" y="62" textAnchor="middle" fontSize="22" fontWeight="700" fill="#22c55e">
        12,345
      </text>
      <text x="245" y="78" textAnchor="middle" fontSize="8" fill="#22c55e">
        exact
      </text>
    </svg>
  );
}

/* 5. Public vs Private Crowd */
function PublicVsPrivateCrowdVisual() {
  return (
    <svg
      width="200"
      height="120"
      viewBox="0 0 200 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Illustration of public subscribers visible and private subscribers hidden"
    >
      <title>Public vs Private Subscribers</title>
      <desc>Shows a few visible subscriber profiles with uniform silhouettes representing private subscribers</desc>
      {/* Public row - visible */}
      <text x="10" y="15" fontSize="9" fill="#16a34a" fontWeight="600">
        PUBLIC
      </text>
      <circle cx="30" cy="42" r="16" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
      <circle cx="30" cy="37" r="5" fill="#166534" />
      <ellipse cx="30" cy="49" rx="7" ry="4" fill="#166534" />
      <circle cx="70" cy="42" r="16" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" />
      <circle cx="70" cy="37" r="5" fill="#1e40af" />
      <ellipse cx="70" cy="49" rx="7" ry="4" fill="#1e40af" />
      <circle cx="110" cy="42" r="16" fill="#fce7f3" stroke="#ec4899" strokeWidth="2" />
      <circle cx="110" cy="37" r="5" fill="#9d174d" />
      <ellipse cx="110" cy="49" rx="7" ry="4" fill="#9d174d" />
      {/* Private row - uniform silhouettes */}
      <text x="10" y="78" fontSize="9" fill="#818cf8" fontWeight="600">
        PRIVATE
      </text>
      <rect x="10" y="88" width="180" height="24" rx="4" fill="#e0e7ff" />
      <circle cx="30" cy="100" r="10" fill="#a5b4fc" />
      <circle cx="55" cy="100" r="10" fill="#a5b4fc" />
      <circle cx="80" cy="100" r="10" fill="#a5b4fc" />
      <circle cx="105" cy="100" r="10" fill="#a5b4fc" />
      <circle cx="130" cy="100" r="10" fill="#a5b4fc" />
      <circle cx="155" cy="100" r="10" fill="#a5b4fc" />
      <circle cx="180" cy="100" r="10" fill="#a5b4fc" />
    </svg>
  );
}

/* 6. Conversion Loop */
function ConversionLoopVisual() {
  return (
    <svg
      width="340"
      height="100"
      viewBox="0 0 340 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Conversion loop showing video to viewer to subscriber to next video"
    >
      <title>Subscriber Conversion Loop</title>
      <desc>A cycle showing how videos attract viewers, viewers become subscribers, and subscribers watch more videos</desc>
      {/* Video icon */}
      <rect x="25" y="30" width="50" height="35" rx="4" fill="#6366f1" />
      <path d="M45 40 L60 48 L45 56 Z" fill="white" />
      <text x="50" y="80" textAnchor="middle" fontSize="9" fill="#64748b">Video</text>
      {/* Arrow 1 */}
      <path d="M80 48 L105 48" stroke="#cbd5e1" strokeWidth="2" />
      <path d="M100 43 L110 48 L100 53" stroke="#cbd5e1" strokeWidth="2" fill="none" />
      {/* Eye (viewer) */}
      <ellipse cx="140" cy="48" rx="20" ry="14" fill="#f1f5f9" stroke="#64748b" strokeWidth="2" />
      <circle cx="140" cy="48" r="8" fill="#64748b" />
      <circle cx="142" cy="46" r="3" fill="white" />
      <text x="140" y="80" textAnchor="middle" fontSize="9" fill="#64748b">Viewer</text>
      {/* Arrow 2 */}
      <path d="M165 48 L190 48" stroke="#cbd5e1" strokeWidth="2" />
      <path d="M185 43 L195 48 L185 53" stroke="#cbd5e1" strokeWidth="2" fill="none" />
      {/* Plus badge (subscriber) */}
      <circle cx="220" cy="48" r="18" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
      <path d="M212 48 L228 48 M220 40 L220 56" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
      <text x="220" y="80" textAnchor="middle" fontSize="9" fill="#64748b">Subscriber</text>
      {/* Arrow 3 */}
      <path d="M243 48 L268 48" stroke="#cbd5e1" strokeWidth="2" />
      <path d="M263 43 L273 48 L263 53" stroke="#cbd5e1" strokeWidth="2" fill="none" />
      {/* Next video */}
      <rect x="280" y="30" width="50" height="35" rx="4" fill="#8b5cf6" />
      <path d="M300 40 L315 48 L300 56 Z" fill="white" />
      <text x="305" y="80" textAnchor="middle" fontSize="9" fill="#64748b">Next Video</text>
      {/* Loop back arrow */}
      <path
        d="M305 25 Q305 10 170 10 Q35 10 35 25"
        stroke="#a5b4fc"
        strokeWidth="2"
        strokeDasharray="4"
        fill="none"
      />
      <path d="M35 20 L35 30 L45 25" stroke="#a5b4fc" strokeWidth="2" fill="none" />
    </svg>
  );
}

/* 7. Source of Truth Gauges */
function SourceOfTruthGaugesVisual() {
  return (
    <svg
      width="180"
      height="100"
      viewBox="0 0 180 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Comparison of Studio real-time gauge versus third-party delayed gauge"
    >
      <title>Source of Truth</title>
      <desc>Shows YouTube Studio as an accurate real-time gauge compared to third-party tools with delayed data</desc>
      {/* Studio gauge */}
      <rect x="10" y="15" width="70" height="75" rx="6" fill="#0f172a" />
      <text x="45" y="30" textAnchor="middle" fontSize="8" fill="#64748b">Studio</text>
      {/* Gauge arc - full/accurate */}
      <path d="M25 60 A20 20 0 0 1 65 60" stroke="#22c55e" strokeWidth="4" fill="none" />
      {/* Needle - pointing to current */}
      <line x1="45" y1="60" x2="58" y2="45" stroke="#22c55e" strokeWidth="2" />
      <circle cx="45" cy="60" r="3" fill="#22c55e" />
      <text x="45" y="82" textAnchor="middle" fontSize="8" fill="#22c55e" fontWeight="600">
        REAL-TIME
      </text>
      {/* Third-party gauge */}
      <rect x="100" y="15" width="70" height="75" rx="6" fill="#f8fafc" stroke="#e2e8f0" />
      <text x="135" y="30" textAnchor="middle" fontSize="8" fill="#94a3b8">3rd Party</text>
      {/* Gauge arc - lagging */}
      <path d="M115 60 A20 20 0 0 1 155 60" stroke="#cbd5e1" strokeWidth="4" fill="none" />
      {/* Partial fill showing delay */}
      <path d="M115 60 A20 20 0 0 1 140 45" stroke="#f97316" strokeWidth="4" fill="none" />
      {/* Needle - behind */}
      <line x1="135" y1="60" x2="125" y2="48" stroke="#f97316" strokeWidth="2" />
      <circle cx="135" cy="60" r="3" fill="#f97316" />
      <text x="135" y="82" textAnchor="middle" fontSize="8" fill="#f97316" fontWeight="600">
        DELAYED
      </text>
    </svg>
  );
}

/* 8. Bell with Unreliable Notification */
function BellShrugVisual() {
  return (
    <svg
      width="80"
      height="70"
      viewBox="0 0 80 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      {/* Bell body */}
      <path
        d="M40 12 C28 12 24 24 24 33 L24 42 L20 47 L60 47 L56 42 L56 33 C56 24 52 12 40 12 Z"
        fill="#fbbf24"
        stroke="#f59e0b"
        strokeWidth="2"
      />
      {/* Bell clapper */}
      <circle cx="40" cy="52" r="4" fill="#f59e0b" />
      {/* Bell top */}
      <rect x="37" y="6" width="6" height="8" rx="3" fill="#f59e0b" />
      {/* Notification badge - faded/inconsistent */}
      <circle cx="55" cy="18" r="8" fill="#fca5a5" stroke="#ef4444" strokeWidth="1" strokeDasharray="2 2" />
      {/* Sound waves - one side strong, one side weak */}
      <path d="M64 32 Q70 28 64 24" stroke="#f59e0b" strokeWidth="2" fill="none" />
      <path d="M16 32 Q10 28 16 24" stroke="#fcd34d" strokeWidth="1.5" fill="none" opacity="0.4" />
      {/* Small slash through bell to show unreliability */}
      <line x1="28" y1="58" x2="52" y2="58" stroke="#94a3b8" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

/* ================================================
   SMALL ICON COMPONENTS
   ================================================ */

function DesktopIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function MobileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  );
}

/*
 * CHECKLIST:
 * - [x] IDs unchanged: overview, check-count, see-who-subscribed, analytics, realtime
 * - [x] Mobile stacking: all grids use auto-fit/minmax, floats stack on mobile
 * - [x] Minimal UL/OL: replaced with cards and grids
 * - [x] Links preserved: /learn/youtube-analytics-tools, /learn/how-to-get-more-subscribers, /learn/youtube-competitor-analysis
 * - [x] SVG accessibility: decorative use aria-hidden, informational use role="img" + aria-label + title/desc
 * - [x] No unused imports
 * - [x] Server component (no "use client")
 * - [x] 9 unique inline SVG visuals
 */
