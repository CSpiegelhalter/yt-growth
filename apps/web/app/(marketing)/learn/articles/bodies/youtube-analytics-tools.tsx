/**
 * Body content for YouTube Analytics Tools article.
 * Server component - no "use client" directive.
 *
 * IMPLEMENTATION PLAN:
 * - Visual-first guided dashboard tour with unique illustrations
 * - Replaced all flywheels/stepping stones with creative alternatives
 * - Added links to internal tools (competitors, ideas, tag-generator, thumbnails)
 * - Proper 4pt spacing system throughout
 * - Section IDs unchanged for URL compatibility
 */

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import type { BodyProps } from "./index";

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* ================================================
          OVERVIEW - Analytics is a compass
          ================================================ */}
      <section id="overview" className="sectionOpen">
        <p className={s.sectionText} style={{ fontSize: "1.125rem" }}>
          Every video generates signals: did they click, did they stay, did they
          come back. YouTube Studio captures these signals in real time.
          Third-party tools offer context you cannot get from your own channel.
          Together, they form a feedback loop that makes your next video better
          than the last.
        </p>

        {/* Pull quote with proper spacing */}
        <div className="pullQuote" style={{ margin: "48px 0" }}>
          Analytics is a compass, not a scoreboard.
        </div>

        <p className={s.sectionText}>
          Think of your dashboard like a diagnostic readout. Each metric
          corresponds to a stage of the viewer journey, and each stage has a
          lever you can pull.
        </p>

        {/* Diagnostic Readout Visual */}
        <div className="inlineIllustration" style={{ margin: "32px 0" }}>
          <DiagnosticReadoutVisual />
        </div>

        <div className="realTalk">
          <p className="realTalk__label">Key insight</p>
          <p className="realTalk__text">
            Each layer of the journey has a metric. Fix the layer that is
            leaking, not the one that is easy to measure.
          </p>
        </div>
      </section>

      {/* ================================================
          YOUTUBE STUDIO - Your Source of Truth
          ================================================ */}
      <section id="youtube-studio" className="sectionTinted">
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <StudioIcon />
          </span>
          YouTube Studio: Your Source of Truth
        </h2>

        <p className={s.sectionText}>
          Studio shows you the real numbers from YouTube&apos;s servers.
          Third-party tools estimate. Studio knows. Everything you need lives in
          the Analytics section, organized into four tabs.
        </p>

        {/* Breadcrumb Navigation */}
        <div className="clickPath" style={{ margin: "24px 0" }}>
          <span className="clickPath__chip">Studio</span>
          <span className="clickPath__arrow">→</span>
          <span className="clickPath__chip">Analytics</span>
          <span className="clickPath__arrow">→</span>
          <span className="clickPath__chip">Reach / Engagement / Audience</span>
        </div>

        {/* 2x2 Tab Card Grid */}
        <CardGrid cols={2}>
          <Card
            title="Overview"
            icon={<OverviewTabIcon />}
            accentColor="#6366f1"
          >
            Your daily pulse check. Views, watch time, subscriber changes, and
            real-time activity from the last 48 hours. Spot anomalies before
            diving deeper.
          </Card>

          <Card title="Reach" icon={<ReachTabIcon />} accentColor="#f97316">
            Are they seeing and clicking? Impressions, CTR, and traffic sources.
            The funnel shows how thumbnails convert to views through each
            discovery stage.
          </Card>

          <Card
            title="Engagement"
            icon={<EngagementTabIcon />}
            accentColor="#22c55e"
          >
            Are they staying? Average view duration, retention curves, end
            screen performance. The retention graph shows exactly where viewers
            leave.
          </Card>

          <Card
            title="Audience"
            icon={<AudienceTabIcon />}
            accentColor="#8b5cf6"
          >
            Are they returning and subscribing? Returning viewer percentage,
            subscriber status, demographics, and when your audience is most
            active online.
          </Card>
        </CardGrid>
      </section>

      {/* ================================================
          KEY METRICS - Five Dials, Not Fifty
          ================================================ */}
      <section id="key-metrics" className="sectionOpen">
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <DialIcon />
          </span>
          Five Dials, Not Fifty
        </h2>

        <p className={s.sectionText}>
          YouTube tracks dozens of data points, but only five directly influence
          whether the algorithm promotes your content. Master these first.
        </p>

        {/* Unique Visual - Slot Machine / Scoreboard */}
        <div className="inlineIllustration" style={{ margin: "32px 0" }}>
          <MetricsPrescription />
        </div>

        {/* Five Metric Cards */}
        <div className="metricCardGrid">
          <div className="metricCard">
            <h4 className="metricCard__name">
              <MetricIconCTR />
              Click-Through Rate
            </h4>
            <p className="metricCard__tells">
              How often viewers click when they see your thumbnail. Measures
              packaging effectiveness.
            </p>
            <p className="metricCard__action">
              <strong>Lies when:</strong> Browse traffic inflates CTR vs search.
            </p>
            <p className="metricCard__action">
              <strong>Do next:</strong> A/B test thumbnail styles, not just
              colors.
            </p>
          </div>

          <div className="metricCard">
            <h4 className="metricCard__name">
              <MetricIconRetention />
              Average View Duration
            </h4>
            <p className="metricCard__tells">
              The strongest signal of content quality. YouTube promotes videos
              that hold attention.
            </p>
            <p className="metricCard__action">
              <strong>Lies when:</strong> Short videos have higher % but less
              total watch time.
            </p>
            <p className="metricCard__action">
              <strong>Do next:</strong> Check{" "}
              <Link href="/learn/youtube-retention-analysis">
                retention curves for drop-off points
              </Link>
              .
            </p>
          </div>

          <div className="metricCard">
            <h4 className="metricCard__name">
              <MetricIconReturning />
              Returning Viewers
            </h4>
            <p className="metricCard__tells">
              Whether you are building an audience or just getting one-time
              clicks.
            </p>
            <p className="metricCard__action">
              <strong>Lies when:</strong> Viral videos bring first-timers who
              never return.
            </p>
            <p className="metricCard__action">
              <strong>Do next:</strong> Track % over time, not absolute numbers.
            </p>
          </div>

          <div className="metricCard">
            <h4 className="metricCard__name">
              <MetricIconSubs />
              Subscribers Per Video
            </h4>
            <p className="metricCard__tells">
              Which topics convince people your channel is worth following
              long-term.
            </p>
            <p className="metricCard__action">
              <strong>Lies when:</strong> High subs from giveaways means low
              engagement later.
            </p>
            <p className="metricCard__action">
              <strong>Do next:</strong> Compare subs/1K views across topics.
            </p>
          </div>

          <div className="metricCard">
            <h4 className="metricCard__name">
              <MetricIconTraffic />
              Traffic Mix
            </h4>
            <p className="metricCard__tells">
              Where views come from shapes growth trajectory. Browse and
              Suggested signal algorithm promotion.
            </p>
            <p className="metricCard__action">
              <strong>Lies when:</strong> External spikes views but builds no
              loyalty.
            </p>
            <p className="metricCard__action">
              <strong>Do next:</strong> Watch how mix shifts video to video.
            </p>
          </div>
        </div>

        <div className="funCallout" style={{ marginTop: "32px" }}>
          <p className="funCallout__text">
            Benchmarks vary wildly by niche. Compare against your own channel
            baseline first, industry averages second.
          </p>
        </div>
      </section>

      {/* ================================================
          THIRD-PARTY TOOLS - When external tools help
          ================================================ */}
      <section id="third-party-tools" className="sectionTinted">
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <TelescopeIcon />
          </span>
          When Third-Party Tools Help
        </h2>

        <p className={s.sectionText}>
          Studio shows your private cockpit perfectly. External tools let you
          peer through a window at the public universe: competitor channels,
          keyword demand, historical trends you cannot see from inside your own
          analytics.
        </p>

        {/* Binoculars Looking Out Window - Unique Visual */}
        <div className="inlineIllustration" style={{ margin: "32px 0" }}>
          <SpyGadgetBeltVisual />
        </div>

        {/* Capability Grid with links to YOUR tools */}
        <h3 className={s.subheading}>What {BRAND.name} Unlocks</h3>
        <p className={s.sectionText} style={{ marginBottom: "24px" }}>
          Instead of juggling multiple browser extensions, {BRAND.name} combines
          these capabilities in one place:
        </p>

        <CardGrid cols={2}>
          <Card title="Competitor Discovery" accentColor="#3b82f6">
            Track competitor videos, spot outliers, and see what packaging works
            in your niche.{" "}
            <Link href="/competitors" style={{ fontWeight: 600 }}>
              Try competitor research →
            </Link>
          </Card>
          <Card title="Video Idea Generation" accentColor="#22c55e">
            Find topics with proven demand based on what is already working for
            similar channels.{" "}
            <Link href="/ideas" style={{ fontWeight: 600 }}>
              Generate video ideas →
            </Link>
          </Card>
          <Card title="Tag Optimization" accentColor="#f97316">
            Extract and analyze tags from top-performing videos. See what
            keywords actually matter.{" "}
            <Link href="/tag-generator" style={{ fontWeight: 600 }}>
              Try tag generator →
            </Link>
          </Card>
          <Card title="Thumbnail Analysis" accentColor="#8b5cf6">
            Study what makes thumbnails click-worthy. Spot patterns in
            successful packaging.{" "}
            <Link href="/thumbnails" style={{ fontWeight: 600 }}>
              Analyze thumbnails →
            </Link>
          </Card>
        </CardGrid>

        {/* Common Third-Party Tools */}
        <h3 className={s.subheading} style={{ marginTop: "32px" }}>
          Other Tools Worth Knowing
        </h3>

        <div className="tacticsGrid">
          <div className="tacticCard">
            <h4 className="tacticCard__title">Social Blade</h4>
            <p className="tacticCard__what">
              Tracks public subscriber and view counts for any channel over
              time. Free. Good for monitoring competitor momentum.
            </p>
            <p className="tacticCard__why">
              <strong>Limitation:</strong> Cannot see CTR, retention, or revenue
              (those stay private).
            </p>
          </div>

          <div className="tacticCard">
            <h4 className="tacticCard__title">vidIQ / TubeBuddy</h4>
            <p className="tacticCard__what">
              Browser extensions with keyword research, SEO scoring, and A/B
              testing features. Free tiers available.
            </p>
            <p className="tacticCard__why">
              <strong>Limitation:</strong> Scores are directional estimates, not
              exact metrics.
            </p>
          </div>
        </div>

        <div className="realTalk" style={{ marginTop: "32px" }}>
          <p className="realTalk__label">Remember</p>
          <p className="realTalk__text">
            Third-party estimates can differ significantly from reality. Use
            them for direction, not precision. Your private Studio metrics are
            always the source of truth.
          </p>
        </div>
      </section>

      {/* ================================================
          COMPETITOR TRACKING - What you can infer
          ================================================ */}
      <section id="competitor-tracking" className="sectionOpen">
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <SpyglassIcon />
          </span>
          Competitor Tracking: Public vs Private
        </h2>

        <p className={s.sectionText}>
          You will never see a competitor&apos;s private stats. But public data
          reveals patterns you can learn from. The key is knowing which signals
          are visible and which require inference.
        </p>

        {/* Public vs Private Split */}
        <div className="dataLimitsTable" style={{ margin: "24px 0" }}>
          <div className="dataLimitsTable__header">
            <span className="dataLimitsTable__col dataLimitsTable__col--public">
              Public (You Can See)
            </span>
            <span className="dataLimitsTable__col dataLimitsTable__col--private">
              Private (Hidden)
            </span>
          </div>
          <div className="dataLimitsTable__row">
            <span className="dataLimitsTable__item dataLimitsTable__item--public">
              View counts
            </span>
            <span className="dataLimitsTable__item dataLimitsTable__item--private">
              CTR
            </span>
          </div>
          <div className="dataLimitsTable__row">
            <span className="dataLimitsTable__item dataLimitsTable__item--public">
              Upload dates and frequency
            </span>
            <span className="dataLimitsTable__item dataLimitsTable__item--private">
              Retention curves
            </span>
          </div>
          <div className="dataLimitsTable__row">
            <span className="dataLimitsTable__item dataLimitsTable__item--public">
              Titles, thumbnails, descriptions
            </span>
            <span className="dataLimitsTable__item dataLimitsTable__item--private">
              Traffic source breakdown
            </span>
          </div>
          <div className="dataLimitsTable__row">
            <span className="dataLimitsTable__item dataLimitsTable__item--public">
              Comments and engagement
            </span>
            <span className="dataLimitsTable__item dataLimitsTable__item--private">
              Revenue and RPM
            </span>
          </div>
          <div className="dataLimitsTable__row">
            <span className="dataLimitsTable__item dataLimitsTable__item--public">
              Video length
            </span>
            <span className="dataLimitsTable__item dataLimitsTable__item--private">
              Subscriber conversion rate
            </span>
          </div>
        </div>

        {/* Pattern Hunt - NOT a flywheel, detective board style */}
        <h3 className={s.subheading}>The Pattern Hunt</h3>
        <p className={s.sectionText}>
          Instead of guessing at private metrics, look for patterns across
          public signals:
        </p>

        <div className="inlineIllustration" style={{ margin: "32px 0" }}>
          <DetectiveBoardVisual />
        </div>

        <p className={s.sectionText}>
          For a complete framework on extracting insights from competitors, see
          our{" "}
          <Link href="/learn/youtube-competitor-analysis">
            competitor analysis framework for YouTube niches
          </Link>
          .
        </p>
      </section>

      {/* ================================================
          GROWTH TRACKING - Routines without obsession
          ================================================ */}
      <section id="growth-tracking" className="sectionTinted">
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <CalendarIcon />
          </span>
          Routines Without Obsession
        </h2>

        <p className={s.sectionText}>
          Checking stats every hour leads to anxiety, not insight. Ignoring them
          entirely means missing signals that could change your strategy. The
          solution is a consistent rhythm with different cadences for different
          purposes.
        </p>

        {/* Calendar Visual - Centered, proper spacing */}
        <div className="inlineIllustration" style={{ margin: "32px 0" }}>
          <CalendarZoomVisual />
        </div>

        {/* 3-Card Cadence */}
        <div className="pathCards" style={{ marginTop: "32px" }}>
          <CadenceCard
            cadence="Daily"
            time="60 seconds"
            focus="Pulse"
            description="Glance at real-time performance on recent uploads. You are not analyzing, just spotting anything unusual."
          />
          <CadenceCard
            cadence="Weekly"
            time="15–20 min"
            focus="Diagnose"
            description="Review CTR, retention, and traffic trends. Compare this week to last. Identify what outperformed and why."
          />
          <CadenceCard
            cadence="Monthly"
            time="30 min"
            focus="Strategy"
            description="Zoom out. Subscriber trajectory, returning viewer trends, content plan. Decide what to double down on or cut."
          />
        </div>

        <div
          className="funCallout"
          style={{
            marginTop: "32px",
            background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
            borderColor: "#fecaca",
          }}
        >
          <p className="funCallout__text" style={{ color: "#991b1b" }}>
            <strong>Warning:</strong> Real-time view counts update constantly.
            Do not doomscroll your own dashboard. Open it once, note the pulse,
            close it. The numbers will not change faster because you are
            watching.
          </p>
        </div>
      </section>

      {/* ================================================
          USING DATA - If this, then that
          ================================================ */}
      <section id="using-data" className="sectionOpen">
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <DiagnosticIcon />
          </span>
          Turning Data into Decisions
        </h2>

        <p className={s.sectionText}>
          Numbers without action are just numbers. Here is a diagnostic
          framework: read the signal, identify the likely cause, take the move.
        </p>

        {/* Diagnostic Cards */}
        <div className="diagnosisFlow" style={{ marginTop: "24px" }}>
          <DiagnosticCard
            signal="Low CTR but impressions exist"
            cause="Packaging issue. Viewers see your thumbnail and pass."
            move="Test a completely different thumbnail style. Rewrite the title for curiosity or clarity."
          />

          <DiagnosticCard
            signal="Early drop-off in first 30 seconds"
            cause="Hook or pacing issue. The opening did not deliver on the promise."
            move="Cut slow intros. Open with the payoff or a curiosity reset. Every second of preamble costs viewers."
          />

          <DiagnosticCard
            signal="High views, low subscribers"
            cause="Positioning or series issue. Viewers watch once but see no reason to return."
            move="Create content series. Make your channel value proposition clearer. See our guide on subscriber conversion patterns."
            link="/learn/how-to-get-more-subscribers"
            linkText="subscriber conversion patterns"
          />

          <DiagnosticCard
            signal="Low Suggested traffic"
            cause="Weak session path. Videos are not connecting to related content."
            move="Use end screens and cards. Create content that naturally relates to popular topics. The algorithm promotes videos that keep sessions going."
          />
        </div>

        <div className="realTalk" style={{ marginTop: "32px" }}>
          <p className="realTalk__label">Pattern, not panic</p>
          <p className="realTalk__text">
            One bad video does not mean your channel is broken. Look for
            patterns across 5–10 uploads before changing strategy.
          </p>
        </div>
      </section>

      {/* ================================================
          MISTAKES - Hall of Mirrors
          ================================================ */}
      <section id="mistakes" className="sectionTinted">
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <MirrorIcon />
          </span>
          The Hall of Mirrors
        </h2>

        <p className={s.sectionText}>
          Analytics can become a trap if you use them wrong. These are the
          distorted reflections that waste creators&apos; time.
        </p>

        {/* Mirror Cards */}
        <div className="museumCards" style={{ marginTop: "24px" }}>
          <MirrorCard
            number={1}
            title="Hourly Checking"
            description="Opening Studio every few hours, feeling anxiety when numbers dip, celebrating spikes that mean nothing. Daily fluctuations are noise. Weekly and monthly trends are signal."
            icon={<RefreshLoopIcon />}
          />

          <MirrorCard
            number={2}
            title="Views-Only Worship"
            description="Chasing view counts while ignoring retention and returning viewers. A video with 100K views and 20% retention is worse for your channel than one with 10K views and 60% retention."
            icon={<ViewsOnlyIcon />}
          />

          <MirrorCard
            number={3}
            title="Giant Channel Comparisons"
            description="Measuring yourself against creators 1000x your size. They play by different rules: established audiences, production teams, algorithmic momentum. Compare against channels 10x your size, not 1000x."
            icon={<GiantCompareIcon />}
          />

          <MirrorCard
            number={4}
            title="Analysis Paralysis"
            description="Spending more time in dashboards than creating content. Data informs decisions; it does not replace making videos. If tracking takes longer than planning your next upload, recalibrate."
            icon={<ParalysisIcon />}
          />
        </div>
      </section>

      {/* CTA */}
      <div className={s.highlight} style={{ marginTop: "48px" }}>
        <p>
          <strong>You do not need to become a data scientist.</strong> Know what
          to look at, where to find it, and what to do next. Check your numbers
          consistently, act on what they tell you, and get back to making
          content. The best creators use data as a compass, not a destination.
        </p>
      </div>
    </>
  );
}

/* ================================================
   HELPER COMPONENTS
   ================================================ */

type CardProps = {
  title: string;
  icon?: React.ReactNode;
  accentColor?: string;
  children: React.ReactNode;
};

function Card({ title, icon, accentColor, children }: CardProps) {
  return (
    <div
      className="metricCard"
      style={accentColor ? { borderTop: `3px solid ${accentColor}` } : undefined}
    >
      <h4 className="metricCard__name">
        {icon}
        {title}
      </h4>
      <p className="metricCard__tells">{children}</p>
    </div>
  );
}

type CardGridProps = {
  cols?: 2 | 3;
  children: React.ReactNode;
};

function CardGrid({ cols = 2, children }: CardGridProps) {
  return (
    <div
      className="metricCardGrid"
      style={
        cols === 3
          ? { gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }
          : undefined
      }
    >
      {children}
    </div>
  );
}

type DiagnosticCardProps = {
  signal: string;
  cause: string;
  move: string;
  link?: string;
  linkText?: string;
};

function DiagnosticCard({ signal, cause, move, link, linkText }: DiagnosticCardProps) {
  return (
    <div className="diagnosisFlow__branch">
      <h4 className="diagnosisFlow__condition">
        <DiagnosticConditionIcon />
        {signal}
      </h4>
      <p className="diagnosisFlow__why">
        <strong>Likely cause:</strong> {cause}
      </p>
      <p className="diagnosisFlow__why" style={{ marginBottom: 0 }}>
        <strong style={{ color: "#059669" }}>Move:</strong> {move}
        {link && linkText && (
          <>
            {" "}
            <Link href={link}>{linkText}</Link>.
          </>
        )}
      </p>
    </div>
  );
}

type CadenceCardProps = {
  cadence: string;
  time: string;
  focus: string;
  description: string;
};

function CadenceCard({ cadence, time, focus, description }: CadenceCardProps) {
  return (
    <div className="pathCard">
      <h4 className="pathCard__title">
        {cadence}{" "}
        <span style={{ fontWeight: 400, color: "var(--text-secondary)" }}>
          ({time})
        </span>
      </h4>
      <p
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: "var(--primary)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginBottom: "8px",
        }}
      >
        {focus}
      </p>
      <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
        {description}
      </p>
    </div>
  );
}

type MirrorCardProps = {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
};

function MirrorCard({ number, title, description, icon }: MirrorCardProps) {
  return (
    <div className="museumCard">
      <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
        <div
          style={{
            flexShrink: 0,
            width: "48px",
            height: "48px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </div>
        <div>
          <h4 className="museumCard__title">
            Mirror {number}: {title}
          </h4>
          <p className="museumCard__text">{description}</p>
        </div>
      </div>
    </div>
  );
}

/* ================================================
   SVG ICONS - Section Headers
   ================================================ */

function StudioIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function DialIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function TelescopeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false">
      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function SpyglassIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false">
      <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 1012 0V2z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function DiagnosticIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function MirrorIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" />
      <path d="M15 9l-6 6M9 9l6 6" />
    </svg>
  );
}

function DiagnosticConditionIcon() {
  return (
    <svg className="diagnosisFlow__conditionIcon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

/* ================================================
   SVG ICONS - Tab Cards
   ================================================ */

function OverviewTabIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" aria-hidden="true" focusable="false" style={{ marginRight: "8px" }}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function ReachTabIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" aria-hidden="true" focusable="false" style={{ marginRight: "8px" }}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function EngagementTabIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" aria-hidden="true" focusable="false" style={{ marginRight: "8px" }}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function AudienceTabIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" aria-hidden="true" focusable="false" style={{ marginRight: "8px" }}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

/* ================================================
   SVG ICONS - Metric Cards
   ================================================ */

function MetricIconCTR() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" aria-hidden="true" focusable="false" style={{ marginRight: "8px", flexShrink: 0 }}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function MetricIconRetention() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" aria-hidden="true" focusable="false" style={{ marginRight: "8px", flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function MetricIconReturning() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" aria-hidden="true" focusable="false" style={{ marginRight: "8px", flexShrink: 0 }}>
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
    </svg>
  );
}

function MetricIconSubs() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" aria-hidden="true" focusable="false" style={{ marginRight: "8px", flexShrink: 0 }}>
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}

function MetricIconTraffic() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" aria-hidden="true" focusable="false" style={{ marginRight: "8px", flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  );
}

/* ================================================
   SVG ILLUSTRATIONS - Large Visuals (UNIQUE)
   ================================================ */

/** Diagnostic Readout - like a car dashboard health check */
function DiagnosticReadoutVisual() {
  return (
    <svg width="340" height="180" viewBox="0 0 340 180" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="diagReadoutTitle diagReadoutDesc">
      <title id="diagReadoutTitle">Channel Health Readout</title>
      <desc id="diagReadoutDesc">A diagnostic screen showing channel health indicators like a medical monitor</desc>

      {/* Monitor frame */}
      <rect x="10" y="10" width="320" height="160" rx="12" fill="#0f172a" stroke="#334155" strokeWidth="2" />
      
      {/* Screen bezel */}
      <rect x="20" y="20" width="300" height="140" rx="8" fill="#1e293b" />
      
      {/* Header bar */}
      <rect x="20" y="20" width="300" height="28" rx="8" fill="#334155" />
      <text x="30" y="39" fontSize="10" fontWeight="600" fill="#94a3b8">CHANNEL DIAGNOSTICS</text>
      <circle cx="300" cy="34" r="4" fill="#22c55e" />
      <circle cx="286" cy="34" r="4" fill="#fbbf24" />
      
      {/* Heartbeat line (retention) */}
      <polyline 
        points="35,90 55,90 65,70 75,110 85,90 105,90 115,75 125,105 135,90 155,90 165,80 175,100 185,90 205,90" 
        fill="none" 
        stroke="#22c55e" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      <text x="35" y="115" fontSize="9" fill="#64748b">RETENTION</text>
      <text x="35" y="128" fontSize="12" fontWeight="700" fill="#22c55e">52%</text>
      
      {/* CTR gauge */}
      <g transform="translate(230, 70)">
        <circle cx="40" cy="40" r="35" fill="none" stroke="#334155" strokeWidth="6" />
        <circle cx="40" cy="40" r="35" fill="none" stroke="#f97316" strokeWidth="6" strokeDasharray="165 220" strokeLinecap="round" transform="rotate(-90 40 40)" />
        <text x="40" y="38" textAnchor="middle" fontSize="14" fontWeight="700" fill="#f97316">7.2%</text>
        <text x="40" y="52" textAnchor="middle" fontSize="8" fill="#64748b">CTR</text>
      </g>
      
      {/* Status indicators */}
      <g transform="translate(35, 135)">
        <rect width="50" height="18" rx="4" fill="#166534" />
        <text x="25" y="13" textAnchor="middle" fontSize="8" fontWeight="600" fill="white">HEALTHY</text>
      </g>
      <g transform="translate(95, 135)">
        <rect width="60" height="18" rx="4" fill="#1e293b" stroke="#334155" />
        <text x="30" y="13" textAnchor="middle" fontSize="8" fill="#94a3b8">Returning: 34%</text>
      </g>
    </svg>
  );
}

/** Journey Layers - Stacked cards showing the viewer journey (NOT a flywheel) */
/** Doctor's Clipboard - Hilarious metrics "prescription" - BIGGER */
function MetricsPrescription() {
  return (
    <svg width="380" height="280" viewBox="0 0 380 280" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="rxTitle rxDesc">
      <title id="rxTitle">Channel Health Prescription</title>
      <desc id="rxDesc">A doctor&apos;s prescription pad listing the five metrics you need to monitor - presented as medicine for your channel</desc>

      {/* Clipboard */}
      <rect x="30" y="5" width="320" height="270" rx="10" fill="#92400e" />
      <rect x="36" y="12" width="308" height="256" rx="8" fill="#a16207" />
      
      {/* Metal clip */}
      <rect x="155" y="2" width="70" height="24" rx="5" fill="#78716c" />
      <rect x="162" y="7" width="56" height="14" rx="3" fill="#a8a29e" />
      <circle cx="190" cy="14" r="5" fill="#78716c" />
      
      {/* Paper */}
      <rect x="50" y="32" width="280" height="230" rx="4" fill="#fefce8" />
      
      {/* Rx Symbol */}
      <text x="70" y="70" fontSize="32" fontWeight="800" fill="#1e40af" fontFamily="serif">℞</text>
      <text x="110" y="62" fontSize="14" fontWeight="700" fill="#1e293b">Dr. Algorithm&apos;s Orders</text>
      <text x="110" y="80" fontSize="10" fill="#64748b">Board Certified in Viewer Psychology</text>
      
      {/* Divider line */}
      <line x1="65" y1="95" x2="315" y2="95" stroke="#d4d4d4" strokeWidth="1" strokeDasharray="4" />
      
      {/* Prescription items - handwriting style with more spacing */}
      <g>
        <text x="70" y="122" fontSize="13" fill="#1e293b" fontStyle="italic">1. CTR — take daily, watch for allergic</text>
        <text x="85" y="140" fontSize="13" fill="#1e293b" fontStyle="italic">reactions to bad thumbnails</text>
        
        <text x="70" y="166" fontSize="13" fill="#1e293b" fontStyle="italic">2. Avg View Duration — the good stuff</text>
        
        <text x="70" y="192" fontSize="13" fill="#1e293b" fontStyle="italic">3. Returning Viewers — loyalty vitamins</text>
        
        <text x="70" y="218" fontSize="13" fill="#1e293b" fontStyle="italic">4. Subs/Video — growth hormone (legal)</text>
        
        <text x="70" y="244" fontSize="13" fill="#1e293b" fontStyle="italic">5. Traffic Mix — check weekly for balance</text>
      </g>
      
      {/* Doctor signature scribble */}
      <path d="M220 252 Q235 244, 250 252 Q265 260, 280 248 Q295 238, 310 252" stroke="#1e40af" strokeWidth="2" fill="none" />
      
      {/* Refills */}
      <text x="70" y="262" fontSize="9" fill="#64748b">REFILLS: ∞ (check as often as needed, but not hourly)</text>
      
      {/* Coffee stain for realism */}
      <ellipse cx="300" cy="55" rx="22" ry="18" fill="#92400e" fillOpacity="0.12" />
    </svg>
  );
}

/** Spy Gadget Belt - Third party tools as spy equipment - BIGGER */
function SpyGadgetBeltVisual() {
  return (
    <svg width="400" height="220" viewBox="0 0 400 220" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="spyTitle spyDesc">
      <title id="spyTitle">Third-Party Tools as Spy Gadgets</title>
      <desc id="spyDesc">A spy utility belt with gadgets representing different third-party analytics capabilities</desc>

      {/* Background */}
      <rect x="5" y="5" width="390" height="210" rx="14" fill="#1e293b" />
      
      {/* Title */}
      <text x="200" y="35" textAnchor="middle" fontSize="14" fontWeight="700" fill="#fbbf24" letterSpacing="3">SECRET AGENT TOOLKIT</text>
      <text x="200" y="55" textAnchor="middle" fontSize="11" fill="#64748b">(for gathering competitive intelligence)</text>
      
      {/* Belt */}
      <rect x="25" y="75" width="350" height="70" rx="8" fill="#78716c" />
      <rect x="25" y="75" width="350" height="70" rx="8" stroke="#a8a29e" strokeWidth="2" />
      
      {/* Belt buckle */}
      <rect x="175" y="70" width="50" height="80" rx="6" fill="#fbbf24" />
      <rect x="182" y="78" width="36" height="64" rx="3" fill="#1e293b" />
      <text x="200" y="118" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fbbf24">3P</text>
      
      {/* Gadget 1: Keyword Scanner (magnifying glass) */}
      <g transform="translate(40, 78)">
        <rect x="-5" y="-3" width="55" height="70" rx="6" fill="#57534e" />
        <circle cx="22" cy="24" r="16" fill="none" stroke="#22c55e" strokeWidth="3" />
        <line x1="34" y1="36" x2="42" y2="44" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" />
        <text x="22" y="58" textAnchor="middle" fontSize="9" fill="#a8a29e">Keywords</text>
      </g>
      
      {/* Gadget 2: Competitor Tracker (radar) */}
      <g transform="translate(110, 78)">
        <rect x="-5" y="-3" width="55" height="70" rx="6" fill="#57534e" />
        <circle cx="22" cy="24" r="16" fill="#0f172a" stroke="#3b82f6" strokeWidth="3" />
        <circle cx="22" cy="24" r="8" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeOpacity="0.5" />
        <line x1="22" y1="24" x2="22" y2="10" stroke="#3b82f6" strokeWidth="2" />
        <circle cx="32" cy="18" r="3" fill="#22c55e" />
        <text x="22" y="58" textAnchor="middle" fontSize="9" fill="#a8a29e">Tracking</text>
      </g>
      
      {/* Gadget 3: Thumbnail X-Ray (glasses) */}
      <g transform="translate(240, 78)">
        <rect x="-5" y="-3" width="55" height="70" rx="6" fill="#57534e" />
        <ellipse cx="12" cy="24" rx="10" ry="8" fill="none" stroke="#f97316" strokeWidth="3" />
        <ellipse cx="32" cy="24" rx="10" ry="8" fill="none" stroke="#f97316" strokeWidth="3" />
        <line x1="20" y1="24" x2="24" y2="24" stroke="#f97316" strokeWidth="2" />
        <text x="22" y="58" textAnchor="middle" fontSize="9" fill="#a8a29e">Thumbnails</text>
      </g>
      
      {/* Gadget 4: Tag Decoder */}
      <g transform="translate(310, 78)">
        <rect x="-5" y="-3" width="55" height="70" rx="6" fill="#57534e" />
        <rect x="5" y="12" width="34" height="24" rx="3" fill="#0f172a" stroke="#8b5cf6" strokeWidth="3" />
        <text x="22" y="29" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#8b5cf6">#tag</text>
        <text x="22" y="58" textAnchor="middle" fontSize="9" fill="#a8a29e">Tags</text>
      </g>
      
      {/* Bottom text */}
      <text x="200" y="175" textAnchor="middle" fontSize="12" fill="#64748b">Studio shows your data. These show everyone else&apos;s.</text>
      
      {/* Top secret stamp */}
      <g transform="translate(330, 165) rotate(-12)">
        <rect x="-30" y="-12" width="60" height="24" rx="3" fill="none" stroke="#dc2626" strokeWidth="2" />
        <text x="0" y="5" textAnchor="middle" fontSize="10" fontWeight="800" fill="#dc2626">USEFUL</text>
      </g>
    </svg>
  );
}

/** Detective Board - Pattern hunt visual with bigger sticky notes */
function DetectiveBoardVisual() {
  return (
    <svg width="360" height="260" viewBox="0 0 360 260" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="detectiveTitle detectiveDesc">
      <title id="detectiveTitle">Pattern Hunt Board</title>
      <desc id="detectiveDesc">A detective investigation board with connected clues for finding competitor patterns</desc>

      {/* Cork board background */}
      <rect x="5" y="5" width="350" height="250" rx="6" fill="#d4a574" />
      <rect x="10" y="10" width="340" height="240" rx="4" fill="#c9956c" />
      
      {/* Wood grain texture lines */}
      <line x1="10" y1="50" x2="350" y2="50" stroke="#b8895d" strokeWidth="0.5" strokeOpacity="0.3" />
      <line x1="10" y1="120" x2="350" y2="120" stroke="#b8895d" strokeWidth="0.5" strokeOpacity="0.3" />
      <line x1="10" y1="180" x2="350" y2="180" stroke="#b8895d" strokeWidth="0.5" strokeOpacity="0.3" />
      
      {/* Card 1: Find Outliers */}
      <g transform="translate(20, 20)">
        <rect width="100" height="80" rx="3" fill="white" transform="rotate(-2)" style={{ filter: "drop-shadow(2px 2px 3px rgba(0,0,0,0.15))" }} />
        <circle cx="50" cy="6" r="6" fill="#dc2626" />
        <text x="50" y="32" textAnchor="middle" fontSize="12" fontWeight="800" fill="#1e293b">FIND</text>
        <text x="50" y="48" textAnchor="middle" fontSize="12" fontWeight="800" fill="#1e293b">OUTLIERS</text>
        <text x="50" y="68" textAnchor="middle" fontSize="10" fill="#64748b">Videos with 2x+ views</text>
      </g>
      
      {/* String 1→2 */}
      <path d="M120 60 Q170 40, 175 70" stroke="#dc2626" strokeWidth="2" fill="none" />
      
      {/* Card 2: Inspect Packaging */}
      <g transform="translate(175, 30)">
        <rect width="105" height="80" rx="3" fill="white" transform="rotate(2)" style={{ filter: "drop-shadow(2px 2px 3px rgba(0,0,0,0.15))" }} />
        <circle cx="52" cy="6" r="6" fill="#f97316" />
        <text x="52" y="32" textAnchor="middle" fontSize="12" fontWeight="800" fill="#1e293b">INSPECT</text>
        <text x="52" y="48" textAnchor="middle" fontSize="12" fontWeight="800" fill="#1e293b">PACKAGING</text>
        <text x="52" y="68" textAnchor="middle" fontSize="10" fill="#64748b">Title + Thumbnail</text>
      </g>
      
      {/* String 2→3 */}
      <path d="M280 90 Q310 140, 290 150" stroke="#f97316" strokeWidth="2" fill="none" />
      
      {/* Card 3: Compare Intros */}
      <g transform="translate(230, 140)">
        <rect width="105" height="80" rx="3" fill="white" transform="rotate(-1)" style={{ filter: "drop-shadow(2px 2px 3px rgba(0,0,0,0.15))" }} />
        <circle cx="52" cy="6" r="6" fill="#22c55e" />
        <text x="52" y="32" textAnchor="middle" fontSize="12" fontWeight="800" fill="#1e293b">COMPARE</text>
        <text x="52" y="48" textAnchor="middle" fontSize="12" fontWeight="800" fill="#1e293b">INTROS</text>
        <text x="52" y="68" textAnchor="middle" fontSize="10" fill="#64748b">First 30 seconds</text>
      </g>
      
      {/* String 3→4 */}
      <path d="M230 180 Q160 210, 135 180" stroke="#22c55e" strokeWidth="2" fill="none" />
      
      {/* Card 4: Map Patterns (yellow sticky) */}
      <g transform="translate(30, 150)">
        <rect width="105" height="80" rx="3" fill="#fef3c7" transform="rotate(2)" style={{ filter: "drop-shadow(2px 2px 3px rgba(0,0,0,0.15))" }} />
        <circle cx="52" cy="6" r="6" fill="#8b5cf6" />
        <text x="52" y="32" textAnchor="middle" fontSize="12" fontWeight="800" fill="#1e293b">MAP</text>
        <text x="52" y="48" textAnchor="middle" fontSize="12" fontWeight="800" fill="#1e293b">PATTERNS</text>
        <text x="52" y="68" textAnchor="middle" fontSize="10" fill="#64748b">What actually works</text>
      </g>
      
      {/* Magnifying glass */}
      <g transform="translate(150, 115)">
        <circle cx="25" cy="25" r="20" fill="none" stroke="#475569" strokeWidth="4" />
        <line x1="40" y1="40" x2="55" y2="55" stroke="#475569" strokeWidth="5" strokeLinecap="round" />
        <circle cx="25" cy="25" r="14" fill="#fef3c7" fillOpacity="0.3" />
      </g>
      
      {/* Question mark doodle */}
      <text x="320" y="245" fontSize="20" fill="#78716c" fillOpacity="0.4">?</text>
    </svg>
  );
}

/** Calendar with Zoom Levels - Bigger visual for routines */
function CalendarZoomVisual() {
  return (
    <svg width="400" height="250" viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="calZoomTitle calZoomDesc">
      <title id="calZoomTitle">Analytics Review Cadence</title>
      <desc id="calZoomDesc">Calendar showing daily, weekly, and monthly review rhythms with magnifying glasses of increasing size</desc>

      {/* Background */}
      <rect x="5" y="5" width="390" height="240" rx="12" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />

      {/* Daily - small quick glance */}
      <g transform="translate(20, 30)">
        <rect width="105" height="140" rx="10" fill="white" stroke="#e2e8f0" strokeWidth="2" />
        <rect width="105" height="30" rx="10" fill="#94a3b8" />
        <rect y="20" width="105" height="10" fill="#94a3b8" />
        <text x="52" y="22" textAnchor="middle" fontSize="12" fontWeight="700" fill="white">TODAY</text>
        
        {/* Mini day cells */}
        {[0,1,2,3,4].map(i => (
          <rect key={i} x={10 + i*18} y="45" width="15" height="15" rx="3" fill={i === 2 ? "#dcfce7" : "#f1f5f9"} stroke={i === 2 ? "#22c55e" : "#e2e8f0"} strokeWidth="1.5" />
        ))}
        
        <text x="52" y="88" textAnchor="middle" fontSize="15" fontWeight="700" fill="#64748b">60 seconds</text>
        <text x="52" y="108" textAnchor="middle" fontSize="11" fill="#94a3b8">Quick pulse check</text>
        <text x="52" y="128" textAnchor="middle" fontSize="10" fill="#cbd5e1">Spot anomalies only</text>
        
        {/* Small magnifier */}
        <circle cx="92" cy="85" r="14" fill="none" stroke="#94a3b8" strokeWidth="2" />
        <line x1="103" y1="96" x2="112" y2="105" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Weekly - medium review */}
      <g transform="translate(145, 20)">
        <rect width="120" height="165" rx="10" fill="white" stroke="#6366f1" strokeWidth="2" />
        <rect width="120" height="32" rx="10" fill="#6366f1" />
        <rect y="22" width="120" height="10" fill="#6366f1" />
        <text x="60" y="24" textAnchor="middle" fontSize="12" fontWeight="700" fill="white">THIS WEEK</text>
        
        {/* Week row */}
        {['M','T','W','T','F','S','S'].map((d, i) => (
          <g key={i}>
            <rect x={8 + i*16} y="48" width="13" height="13" rx="3" fill={i === 1 || i === 4 ? "#dbeafe" : "#f1f5f9"} stroke={i === 1 || i === 4 ? "#3b82f6" : "#e2e8f0"} strokeWidth="1.5" />
            <text x={14.5 + i*16} y="76" textAnchor="middle" fontSize="9" fill="#94a3b8">{d}</text>
          </g>
        ))}
        
        <text x="60" y="105" textAnchor="middle" fontSize="15" fontWeight="700" fill="#6366f1">15-20 minutes</text>
        <text x="60" y="125" textAnchor="middle" fontSize="11" fill="#94a3b8">Diagnose trends</text>
        <text x="60" y="145" textAnchor="middle" fontSize="10" fill="#cbd5e1">Compare to last week</text>
        
        {/* Medium magnifier */}
        <circle cx="105" cy="102" r="18" fill="none" stroke="#6366f1" strokeWidth="2.5" />
        <line x1="119" y1="116" x2="132" y2="129" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* Monthly - big picture */}
      <g transform="translate(285, 10)">
        <rect width="105" height="190" rx="10" fill="white" stroke="#22c55e" strokeWidth="2" />
        <rect width="105" height="34" rx="10" fill="#22c55e" />
        <rect y="24" width="105" height="10" fill="#22c55e" />
        <text x="52" y="25" textAnchor="middle" fontSize="12" fontWeight="700" fill="white">THIS MONTH</text>
        
        {/* Month grid */}
        {[0,1,2,3,4].map(row => (
          [0,1,2,3,4,5,6].map(col => (
            <rect 
              key={`${row}-${col}`} 
              x={8 + col*13} 
              y={48 + row*16} 
              width="11" 
              height="11" 
              rx="2" 
              fill={(row === 0 && col === 2) || (row === 2 && col === 5) || (row === 4 && col === 1) ? "#dcfce7" : "#f8fafc"} 
              stroke={(row === 0 && col === 2) || (row === 2 && col === 5) || (row === 4 && col === 1) ? "#22c55e" : "#e2e8f0"} 
              strokeWidth="1"
            />
          ))
        ))}
        
        <text x="52" y="145" textAnchor="middle" fontSize="15" fontWeight="700" fill="#22c55e">30 minutes</text>
        <text x="52" y="165" textAnchor="middle" fontSize="11" fill="#94a3b8">Strategy review</text>
        <text x="52" y="185" textAnchor="middle" fontSize="10" fill="#cbd5e1">Double down or cut</text>
        
        {/* Large magnifier */}
        <circle cx="92" cy="140" r="22" fill="none" stroke="#22c55e" strokeWidth="3" />
        <line x1="110" y1="158" x2="126" y2="174" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
      </g>
      
      {/* Bottom label */}
      <text x="200" y="232" textAnchor="middle" fontSize="12" fill="#64748b">Zoom out as time increases →</text>
    </svg>
  );
}

/* ================================================
   SVG ICONS - Mirror Cards
   ================================================ */

function RefreshLoopIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" aria-hidden="true" focusable="false">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  );
}

function ViewsOnlyIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" aria-hidden="true" focusable="false">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function GiantCompareIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" aria-hidden="true" focusable="false">
      <rect x="3" y="15" width="4" height="6" rx="1" />
      <rect x="10" y="10" width="4" height="11" rx="1" />
      <rect x="17" y="3" width="4" height="18" rx="1" />
    </svg>
  );
}

function ParalysisIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4l2 2" />
      <line x1="4" y1="4" x2="20" y2="20" />
    </svg>
  );
}

/*
 * CHECKLIST:
 * [x] Section IDs preserved
 * [x] Mobile stacking via responsive CSS classes
 * [x] Zero flywheels - replaced with unique visuals
 * [x] Links to internal tools: /competitors, /ideas, /tag-generator, /thumbnails
 * [x] Links to learn articles with descriptive anchor text
 * [x] 4pt spacing system followed (8, 16, 24, 32, 48)
 * [x] SVG accessibility: title/desc for informational, aria-hidden for decorative
 * [x] "vibes" removed from YouTube Studio title
 */
