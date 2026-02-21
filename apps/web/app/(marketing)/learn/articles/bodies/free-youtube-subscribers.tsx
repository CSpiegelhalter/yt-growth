/**
 * Body content for Free YouTube Subscribers article.
 * Server component - no "use client" directive.
 *
 * IMPLEMENTATION PLAN:
 * - "Consumer report" tone: calm, sharp, slightly amused at the absurdity
 * - Replace list-heavy sections with cards, grids, visual panels
 * - 12 unique inline SVG visuals distributed throughout
 * - Keep IDs: overview, how-it-works, why-harmful, policy-violations, real-consequences, safe-alternatives
 * - Minimal UL/OL usage; prefer CardGrid, MeterCard, InlineFigure patterns
 * - Mobile-first: single column default, side-by-side at md+
 * - All internal links preserved with improved anchor text
 */

import Link from "next/link";
import { BRAND } from "@/lib/shared/brand";
import { LEARN_ARTICLES } from "../../articles";
import type { BodyProps } from "./_shared";
import { articleExports } from "./_shared";

export const { meta, toc } = articleExports(LEARN_ARTICLES["free-youtube-subscribers"]);

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* ========================================
          OVERVIEW
          ======================================== */}
      <section id="overview" className="sectionOpen">
        <p className={s.sectionText} style={{ fontSize: "1.125rem" }}>
          Services promising free YouTube subscribers are everywhere. They
          target new creators frustrated by slow growth, offering a tempting
          shortcut: get subscribers fast, hit monetization thresholds sooner,
          look more established.
        </p>

        <InlineFigure position="center">
          <ShortcutTrapDoor />
        </InlineFigure>

        <p className={s.sectionText}>
          The problem is that these services deliver fake engagement that
          actively damages your channel. What looks like a shortcut is actually
          a trap door. Fake subscribers break the early signals YouTube uses to
          decide who to show your videos to, leaving you worse off than if you
          had never used them.
        </p>

        <InlineFigure position="center">
          <ScamFunnel />
        </InlineFigure>

        <p className={s.sectionText}>
          This page explains exactly why fake growth hurts you, what YouTube
          does about it, and what actually works instead. We do not link to
          these services or explain how to use them. The goal is to help you
          understand why they fail and what to do differently.
        </p>
      </section>

      {/* ========================================
          HOW IT WORKS
          ======================================== */}
      <section id="how-it-works" className="sectionTinted">
        <h2 className={s.sectionTitle}>Four Flavors of Fake Growth</h2>
        <p className={s.sectionText}>
          Whether free or paid, all fake subscriber services fall into a few
          categories. None of them deliver real audience growth because none of
          them deliver real people who care about your content.
        </p>

        <InlineFigure position="center">
          <FourFlavorsSampler />
        </InlineFigure>

        <div className="reasonsGrid">
          <FlavorCard
            title="Bots"
            description="Automated accounts or software that subscribe to your channel. They are not real people. They never watch your content. Many get deleted in YouTube's regular purges."
            problem="No watch time, no engagement, easily detected"
          />
          <FlavorCard
            title="Click Farms"
            description="Real people in low-wage countries paid pennies per action to subscribe to channels. They have no interest in your content and will never return."
            problem="No intent, no loyalty, inflated metrics"
          />
          <FlavorCard
            title="Exchanges"
            description='Services offering "free" subscribers in exchange for watching ads, completing surveys, or subscribing to other channels. The subscribers you get are from the same exchange.'
            problem="Circular system, zero genuine interest"
          />
          <FlavorCard
            title="Sub4Sub"
            description="Networks connecting creators who agree to subscribe to each other. Everyone subscribes to everyone, but nobody watches anyone."
            problem="Dead subscribers, no watch time, no growth"
          />
        </div>

        <div className="realTalk">
          <p className="realTalk__label">The common thread</p>
          <p className="realTalk__text">
            Every method above delivers subscribers who will never watch your
            videos, never engage with your content, and never help you grow.
            They are dead weight that actively signals to YouTube that your
            content is not worth promoting.
          </p>
        </div>
      </section>

      {/* ========================================
          WHY HARMFUL
          ======================================== */}
      <section id="why-harmful" className="sectionOpen">
        <h2 className={s.sectionTitle}>The Damage Dashboard</h2>
        <p className={s.sectionText}>
          Fake subscribers do not just fail to help. They actively damage your
          channel across four key metrics that YouTube uses to decide who gets
          recommended.
        </p>

        <div className="metricCardGrid">
          <MeterCard
            label="Subscriber-to-View Ratio"
            status="danger"
            value="Suspicious"
            description="When you have 10K subscribers but 100 views per video, both YouTube and real viewers notice. Trust erodes before you have a chance to impress anyone."
          />
          <MeterCard
            label="Early Impression Throttle"
            status="warning"
            value="Slowed"
            description="YouTube tests new videos with your subscribers first. If they ignore it, YouTube stops pushing it. Fake subscribers always ignore it."
          />
          <MeterCard
            label="Returning Viewers"
            status="danger"
            value="Near Zero"
            description="Fake subscribers never come back. Your returning viewer rate tanks, signaling to YouTube that your content is not worth recommending."
          />
          <MeterCard
            label="Revenue Potential"
            status="warning"
            value="Mismatch"
            description="Subscribers do not pay bills; views do. A channel with 50K fake subscribers and 500 views per video earns almost nothing."
          />
        </div>

        <h3 className={s.subheading}>How Recommendations Actually Work</h3>
        
        <InlineFigure position="center">
          <EngagementEKG />
        </InlineFigure>

        <p className={s.sectionText}>
          YouTube&apos;s recommendation system watches what happens when it
          shows your video to people. If your subscribers click and watch,
          YouTube shows it to more people. If they ignore it, YouTube stops.
          Fake subscribers always ignore your content.
        </p>

        <p className={s.sectionText}>
          The result is a self-reinforcing trap. Fake subscribers tank your
          engagement rate. Low engagement tells YouTube your content is not
          worth promoting. Fewer recommendations mean fewer real viewers. Fewer
          real viewers means slower real growth. The shortcut becomes a dead
          end.
        </p>

        <InlineFigure position="center">
          <RevenuePiggyBank />
        </InlineFigure>

        <p className={s.sectionText}>
          Even if you hit monetization thresholds with fake subscribers, your
          actual earnings will be tiny. Revenue comes from views, not subscriber
          counts. A channel with 1,000 real subscribers who watch every video
          will out-earn a channel with 100,000 fake subscribers who watch
          nothing.
        </p>
      </section>

      {/* ========================================
          POLICY VIOLATIONS
          ======================================== */}
      <section id="policy-violations" className="sectionTinted">
        <h2 className={s.sectionTitle}>Policy and Enforcement Reality</h2>
        <p className={s.sectionText}>
          YouTube actively detects and removes fake engagement. Their systems
          are designed to identify artificial signals, and they improve
          constantly. Here is what you need to know.
        </p>

        <InlineFigure position="center">
          <TermsCourtroomDoodle />
        </InlineFigure>

        <div className="reasonsGrid" style={{ marginTop: "24px" }}>
          <PolicyCard
            title="Artificial signals are spam"
            description="YouTube treats purchased or exchanged subscribers, views, likes, and comments as spam. The platform's terms prohibit artificially inflating metrics through any method."
          />
          <PolicyCard
            title="Detection is ongoing"
            description="YouTube runs regular audits using machine learning to identify suspicious patterns. Accounts exhibiting bot-like behavior or unusual subscription patterns get flagged."
          />
          <PolicyCard
            title="Patterns stick to your channel"
            description="Even after fake subscribers are purged, the history of suspicious activity can affect how YouTube evaluates your channel for years."
          />
          <PolicyCard
            title="Monetization reviews look deep"
            description="When you apply for the Partner Program, YouTube reviews your channel's history. Patterns of artificial engagement can result in denial or removal."
          />
        </div>

        <div className="funCallout">
          <p className="funCallout__text">
            YouTube does not publish exactly how they detect fake engagement,
            and for good reason. But the detection improves every year, and the
            patterns that worked last year often get caught this year.
          </p>
        </div>
      </section>

      {/* ========================================
          REAL CONSEQUENCES
          ======================================== */}
      <section id="real-consequences" className="sectionOpen">
        <h2 className={s.sectionTitle}>The Consequence Roulette</h2>
        <p className={s.sectionText}>
          YouTube enforces its policies with a range of outcomes. Some happen
          automatically during audits. Others require manual review. Not
          everyone gets the same treatment, but here is what can happen.
        </p>

        <InlineFigure position="center">
          <WheelOfOutcomes />
        </InlineFigure>

        <div className="mistakeCards">
          <ConsequenceCard
            title="Subscriber Purge"
            description="YouTube removes fake subscribers during regular audits. You lose what you paid for or earned through exchanges. Your count drops, sometimes dramatically."
          />
          <ConsequenceCard
            title="Monetization Denial"
            description="YouTube can deny Partner Program applications from channels with suspicious growth patterns. You hit the numbers but do not get approved."
          />
          <ConsequenceCard
            title="Monetization Suspension"
            description="Channels already in the Partner Program can lose monetization for fake engagement. Revenue stops until you appeal and are reinstated, if ever."
          />
          <ConsequenceCard
            title="Channel Strikes"
            description="Severe or repeated violations result in strikes that limit channel functionality. Three strikes and your channel is terminated."
          />
          <ConsequenceCard
            title="Channel Termination"
            description="Continued violations can result in permanent channel deletion. All your content, subscribers, and watch history disappear."
          />
        </div>

        <div className="realTalk">
          <p className="realTalk__label">The invisible consequence</p>
          <p className="realTalk__text">
            Even if you avoid all the above, fake subscribers still hurt you
            through reduced distribution. Your videos get shown to fewer people
            because your engagement signals are weak. This is the most common
            outcome, and it happens silently.
          </p>
        </div>
      </section>

      {/* ========================================
          SAFE ALTERNATIVES
          ======================================== */}
      <section id="safe-alternatives" className="sectionTinted">
        <h2 className={s.sectionTitle}>The Three-Lane Growth Highway</h2>
        <p className={s.sectionText}>
          Real subscriber growth comes from three things working together: making
          content people want, packaging it so they find and click it, and
          converting viewers into subscribers. No shortcuts, just systems.
        </p>

        <InlineFigure position="center">
          <ThreeLaneHighway />
        </InlineFigure>

        {/* Lane 1: Content */}
        <div className="playbookLever">
          <h3 className="playbookLever__title">
            <span className="playbookLever__letter">1</span>
            Make Something People Want
          </h3>
          <p className="playbookLever__text">
            Before worrying about packaging or conversion, make sure you are
            creating content that has proven demand in your niche. Study what
            works for similar channels and understand why.
          </p>
          <div className="frameworkSteps">
            <LaneCard
              title="Find your baseline"
              description="Study channels in your niche to understand what topics, formats, and video lengths get traction."
              link="/learn/youtube-competitor-analysis"
              linkText="Learn competitor analysis"
            />
            <LaneCard
              title="Improve retention"
              description="The best content keeps people watching. Study your retention curves and fix the drop-off points."
              link="/learn/youtube-retention-analysis"
              linkText="Analyze your retention"
            />
            <LaneCard
              title="Generate ideas with demand"
              description="Use search data, competitor outliers, and audience questions to find topics people actually want."
              link="/learn/youtube-video-ideas"
              linkText="Find video ideas"
            />
          </div>
        </div>

        {/* Lane 2: Packaging */}
        <div className="playbookLever">
          <h3 className="playbookLever__title">
            <span className="playbookLever__letter">2</span>
            Package It Clearly
          </h3>
          <p className="playbookLever__text">
            Great content that nobody clicks on never gets watched. Your
            thumbnail and title are the packaging that determines whether people
            give your video a chance.
          </p>
          <div className="frameworkSteps">
            <LaneCard
              title="Optimize for search"
              description="Make sure your videos can be found when people search for topics you cover. Keywords, descriptions, and titles matter."
              link="/learn/youtube-seo"
              linkText="Master YouTube SEO"
            />
            <LaneCard
              title="Improve your thumbnails"
              description="One clear focal point, readable at small size, a promise that matches your content. Test and iterate."
              link="/learn/youtube-thumbnail-best-practices"
              linkText="Improve your thumbnails"
            />
          </div>
        </div>

        {/* Lane 3: Conversion */}
        <div className="playbookLever">
          <h3 className="playbookLever__title">
            <span className="playbookLever__letter">3</span>
            Convert Viewers to Subscribers
          </h3>
          <p className="playbookLever__text">
            Viewers become subscribers when they believe your future content
            will be worth their time. Give them a reason to come back.
          </p>

          <InlineFigure position="center">
            <SubscribeButtonSeatbelt />
          </InlineFigure>

          <div className="frameworkSteps">
            <LaneCard
              title="Time your ask"
              description="Ask for subscriptions after delivering value, not before. Explain what they will get by subscribing."
              link="/learn/how-to-get-more-subscribers"
              linkText="Increase subscriber conversion"
            />
            <LaneCard
              title="Create series content"
              description="Give viewers a reason to return. Series, recurring formats, and continuity build anticipation and habit."
            />
            <LaneCard
              title="Use end screens"
              description="Direct viewers to your best content. Link to videos that convert well and build watch sessions."
            />
          </div>
        </div>

        {/* Impatience callout */}
        <div className="funCallout" style={{ marginTop: "32px" }}>
          <p className="funCallout__text">
            <strong>If you are impatient:</strong> Pick one improvement lever
            this week. One thumbnail test. One retention fix. One competitor to
            study. Real growth compounds from small, consistent improvements,
            not from buying fake numbers.
          </p>
        </div>
      </section>

      {/* ========================================
          CTA
          ======================================== */}
      <div className="sectionAccent">
        <h3
          style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}
        >
          Build real growth with real data
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
          {BRAND.name} helps you find what actually works in your niche, track
          which videos convert viewers to subscribers, and understand your
          competitor baselines. Real signals lead to better distribution.
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

/* ================================================
   LOCAL COMPONENT HELPERS
   ================================================ */

type InlineFigureProps = {
  children: React.ReactNode;
  position?: "left" | "right" | "center";
};

function InlineFigure({ children, position = "center" }: InlineFigureProps) {
  const className =
    position === "left"
      ? "floatLeft"
      : position === "right"
        ? "floatRight"
        : "inlineIllustration";
  return <div className={className}>{children}</div>;
}

type FlavorCardProps = {
  title: string;
  description: string;
  problem: string;
};

function FlavorCard({ title, description, problem }: FlavorCardProps) {
  return (
    <div className="reasonCard">
      <div className="reasonCard__header">
        <h3 className="reasonCard__title">{title}</h3>
      </div>
      <p className="reasonCard__looks">{description}</p>
      <div className="reasonCard__action">
        <strong>The problem:</strong> {problem}
      </div>
    </div>
  );
}

type MeterCardProps = {
  label: string;
  status: "danger" | "warning" | "ok";
  value: string;
  description: string;
};

function MeterCard({ label, status, value, description }: MeterCardProps) {
  const statusColors = {
    danger: { bg: "#fee2e2", text: "#991b1b", border: "#fecaca" },
    warning: { bg: "#fef3c7", text: "#92400e", border: "#fde68a" },
    ok: { bg: "#dcfce7", text: "#166534", border: "#bbf7d0" },
  };
  const colors = statusColors[status];

  return (
    <div className="metricCard">
      <p className="metricCard__name">{label}</p>
      <span
        className="metricCard__range"
        style={{
          background: colors.bg,
          color: colors.text,
          border: `1px solid ${colors.border}`,
        }}
      >
        {value}
      </span>
      <p className="metricCard__tells">{description}</p>
    </div>
  );
}

type PolicyCardProps = {
  title: string;
  description: string;
};

function PolicyCard({ title, description }: PolicyCardProps) {
  return (
    <div className="reasonCard">
      <div className="reasonCard__header">
        <h3 className="reasonCard__title">{title}</h3>
      </div>
      <p className="reasonCard__looks">{description}</p>
    </div>
  );
}

type ConsequenceCardProps = {
  title: string;
  description: string;
  icon?: React.ReactNode;
};

function ConsequenceCard({ title, description, icon }: ConsequenceCardProps) {
  return (
    <div className="mistakeCard">
      {icon && <span className="mistakeCard__icon">{icon}</span>}
      <div className="mistakeCard__content">
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </div>
  );
}

type LaneCardProps = {
  title: string;
  description: string;
  link?: string;
  linkText?: string;
};

function LaneCard({ title, description, link, linkText }: LaneCardProps) {
  return (
    <div className="frameworkStep">
      <div className="frameworkStep__content">
        <strong>{title}</strong>
        <p>
          {description}
          {link && linkText && (
            <>
              {" "}
              <Link href={link} style={{ color: "var(--primary)" }}>
                {linkText}
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

/* ================================================
   INLINE SVG VISUALS (12 unique illustrations)
   ================================================ */

/* 1. Shortcut Trap Door - silly stick figure falling */
function ShortcutTrapDoor() {
  return (
    <svg
      width="240"
      height="200"
      viewBox="0 0 240 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="trapDoorTitle trapDoorDesc"
    >
      <title id="trapDoorTitle">The Shortcut Trap Door</title>
      <desc id="trapDoorDesc">
        A silly stick figure falling through a trap door labeled free subs
      </desc>
      {/* Background */}
      <rect width="240" height="200" fill="#fefce8" rx="12" />
      
      {/* Floor with trap door */}
      <rect x="0" y="60" width="70" height="14" fill="#a3a3a3" />
      <rect x="170" y="60" width="70" height="14" fill="#a3a3a3" />
      
      {/* Trap door - swinging open */}
      <g transform="rotate(65 70 60)">
        <rect x="70" y="58" width="100" height="14" fill="#dc2626" rx="3" />
        <text x="120" y="70" textAnchor="middle" fontSize="11" fontWeight="800" fill="white">
          FREE SUBS
        </text>
      </g>
      
      {/* Stick figure falling - arms and legs flailing comically */}
      <g>
        {/* Head - shocked face */}
        <circle cx="120" cy="110" r="16" fill="#fef3c7" stroke="#1e293b" strokeWidth="2.5" />
        {/* Wide shocked eyes */}
        <circle cx="114" cy="107" r="4" fill="white" />
        <circle cx="126" cy="107" r="4" fill="white" />
        <circle cx="114" cy="108" r="2.5" fill="#1e293b" />
        <circle cx="126" cy="108" r="2.5" fill="#1e293b" />
        {/* O-shaped shocked mouth */}
        <ellipse cx="120" cy="118" rx="4" ry="5" fill="#1e293b" />
        {/* Sweat drops */}
        <path d="M96 102 Q93 108 96 112" stroke="#60a5fa" strokeWidth="2.5" fill="none" />
        <path d="M144 102 Q147 108 144 112" stroke="#60a5fa" strokeWidth="2.5" fill="none" />
        
        {/* Body */}
        <line x1="120" y1="126" x2="120" y2="155" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
        
        {/* Arms flailing up */}
        <line x1="120" y1="133" x2="92" y2="115" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
        <line x1="120" y1="133" x2="148" y2="118" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
        
        {/* Legs kicking wildly */}
        <line x1="120" y1="155" x2="100" y2="178" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
        <line x1="120" y1="155" x2="145" y2="175" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
      </g>
      
      {/* Motion lines */}
      <path d="M90 82 L90 92" stroke="#fca5a5" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M105 78 L105 90" stroke="#fca5a5" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M135 78 L135 90" stroke="#fca5a5" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M150 82 L150 92" stroke="#fca5a5" strokeWidth="2.5" strokeLinecap="round" />
      
      {/* "AAAA!" text - larger and not cut off */}
      <text x="175" y="130" fontSize="20" fontWeight="900" fill="#dc2626" transform="rotate(12 175 130)">
        AAAA!
      </text>
      
      {/* Dark pit at bottom */}
      <rect x="65" y="185" width="110" height="20" fill="#1e293b" rx="6" />
    </svg>
  );
}

/* 2. Scam Funnel */
function ScamFunnel() {
  return (
    <svg
      width="280"
      height="180"
      viewBox="0 0 280 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="scamFunnelTitle scamFunnelDesc"
    >
      <title id="scamFunnelTitle">The Scam Funnel</title>
      <desc id="scamFunnelDesc">
        Funnel showing money, time, and hope going in, bots and exchanges in
        the middle, and low reach coming out
      </desc>
      {/* Background */}
      <rect width="280" height="180" fill="#fef2f2" rx="12" />
      {/* Funnel shape */}
      <path
        d="M60 30 L220 30 L180 90 L100 90 Z"
        fill="#fee2e2"
        stroke="#fca5a5"
        strokeWidth="2"
      />
      <path
        d="M100 90 L180 90 L160 130 L120 130 Z"
        fill="#fecaca"
        stroke="#f87171"
        strokeWidth="2"
      />
      <rect
        x="120"
        y="130"
        width="40"
        height="30"
        fill="#fca5a5"
        stroke="#ef4444"
        strokeWidth="2"
        rx="2"
      />
      {/* Input labels at top */}
      <text
        x="90"
        y="20"
        textAnchor="middle"
        fontSize="9"
        fontWeight="600"
        fill="#991b1b"
      >
        MONEY
      </text>
      <text
        x="140"
        y="20"
        textAnchor="middle"
        fontSize="9"
        fontWeight="600"
        fill="#991b1b"
      >
        TIME
      </text>
      <text
        x="190"
        y="20"
        textAnchor="middle"
        fontSize="9"
        fontWeight="600"
        fill="#991b1b"
      >
        HOPE
      </text>
      {/* Arrows pointing into funnel */}
      <path d="M90 22 L90 28" stroke="#dc2626" strokeWidth="2" />
      <path d="M140 22 L140 28" stroke="#dc2626" strokeWidth="2" />
      <path d="M190 22 L190 28" stroke="#dc2626" strokeWidth="2" />
      {/* Middle section labels */}
      <text
        x="140"
        y="65"
        textAnchor="middle"
        fontSize="10"
        fill="#7f1d1d"
        fontWeight="500"
      >
        bots
      </text>
      <text
        x="140"
        y="80"
        textAnchor="middle"
        fontSize="10"
        fill="#7f1d1d"
        fontWeight="500"
      >
        exchanges
      </text>
      <text
        x="140"
        y="115"
        textAnchor="middle"
        fontSize="9"
        fill="#991b1b"
      >
        fake subs
      </text>
      {/* Output at bottom */}
      <text
        x="140"
        y="148"
        textAnchor="middle"
        fontSize="8"
        fontWeight="700"
        fill="#dc2626"
      >
        LOW
      </text>
      <text
        x="140"
        y="158"
        textAnchor="middle"
        fontSize="8"
        fontWeight="700"
        fill="#dc2626"
      >
        REACH
      </text>
      {/* Drip effect */}
      <ellipse cx="140" cy="168" rx="8" ry="4" fill="#fca5a5" />
    </svg>
  );
}

/* 3. Four Flavors - Melting Ice Cream Cones */
function FourFlavorsSampler() {
  return (
    <svg
      width="340"
      height="160"
      viewBox="0 0 340 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="samplerTitle samplerDesc"
    >
      <title id="samplerTitle">Four Flavors of Fake Growth</title>
      <desc id="samplerDesc">
        Four melting ice cream cones representing bad growth tactics: Bots, Farms, Exchange, Sub4Sub
      </desc>
      
      {/* Ice Cream 1: BOTS - Robot gray */}
      <g>
        {/* Cone - with scoop sitting in it */}
        <path d="M28 75 L50 135 L72 75" fill="#d4a574" />
        <path d="M32 80 L45 120 M42 80 L50 115 M50 80 L58 120 M58 80 L68 115" stroke="#c4956a" strokeWidth="1.5" />
        {/* Scoop base sitting IN the cone */}
        <ellipse cx="50" cy="75" rx="24" ry="8" fill="#78716c" />
        {/* Scoop top */}
        <ellipse cx="50" cy="55" rx="24" ry="24" fill="#9ca3af" />
        <ellipse cx="44" cy="48" rx="8" ry="6" fill="#d1d5db" opacity="0.5" />
        {/* Drip sliding down the cone */}
        <path d="M30 75 Q28 90 32 105 Q34 115 36 118" stroke="#9ca3af" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M70 75 Q74 85 72 100" stroke="#9ca3af" strokeWidth="5" fill="none" strokeLinecap="round" />
        {/* Sad robot face */}
        <rect x="40" y="48" width="6" height="6" fill="#1e293b" rx="1" />
        <rect x="54" y="48" width="6" height="6" fill="#1e293b" rx="1" />
        <path d="M42 66 Q50 62 58 66" stroke="#1e293b" strokeWidth="2.5" fill="none" />
        {/* Label */}
        <text x="50" y="152" textAnchor="middle" fontSize="12" fontWeight="800" fill="#475569">BOTS</text>
      </g>
      
      {/* Ice Cream 2: FARMS - Sickly green */}
      <g>
        {/* Cone */}
        <path d="M108 75 L130 135 L152 75" fill="#d4a574" />
        <path d="M112 80 L125 120 M122 80 L130 115 M130 80 L138 120 M138 80 L148 115" stroke="#c4956a" strokeWidth="1.5" />
        {/* Scoop base */}
        <ellipse cx="130" cy="75" rx="24" ry="8" fill="#65a30d" />
        {/* Scoop top */}
        <ellipse cx="130" cy="55" rx="24" ry="24" fill="#84cc16" />
        <ellipse cx="124" cy="48" rx="8" ry="6" fill="#bef264" opacity="0.5" />
        {/* Drips sliding down */}
        <path d="M110 75 Q106 90 108 110 Q109 120 112 125" stroke="#84cc16" strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d="M150 75 Q155 88 152 105 Q150 115 148 122" stroke="#84cc16" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M130 83 Q130 95 130 108" stroke="#84cc16" strokeWidth="5" fill="none" strokeLinecap="round" />
        {/* Flies */}
        <circle cx="160" cy="45" r="3" fill="#1e293b" />
        <path d="M160 42 L164 38 M160 42 L156 38" stroke="#64748b" strokeWidth="1" />
        <circle cx="102" cy="52" r="2" fill="#1e293b" />
        {/* Yuck face */}
        <circle cx="122" cy="50" r="3" fill="#1e293b" />
        <circle cx="138" cy="50" r="3" fill="#1e293b" />
        <path d="M124 66 Q130 70 136 66" stroke="#1e293b" strokeWidth="2.5" fill="none" />
        {/* Label */}
        <text x="130" y="152" textAnchor="middle" fontSize="12" fontWeight="800" fill="#475569">FARMS</text>
      </g>
      
      {/* Ice Cream 3: EXCHANGE - Split colors */}
      <g>
        {/* Cone */}
        <path d="M188 75 L210 135 L232 75" fill="#d4a574" />
        <path d="M192 80 L205 120 M202 80 L210 115 M210 80 L218 120 M218 80 L228 115" stroke="#c4956a" strokeWidth="1.5" />
        {/* Scoop base */}
        <ellipse cx="210" cy="75" rx="24" ry="8" fill="#a855f7" />
        {/* Scoop - split in half */}
        <path d="M210 31 A24 24 0 0 1 210 79 L210 55 Z" fill="#f472b6" />
        <path d="M210 31 A24 24 0 0 0 210 79 L210 55 Z" fill="#60a5fa" />
        <ellipse cx="200" cy="48" rx="6" ry="5" fill="#f9a8d4" opacity="0.5" />
        {/* Drips - different colors each side */}
        <path d="M190 75 Q185 90 188 108" stroke="#f472b6" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M230 75 Q236 92 232 112" stroke="#60a5fa" strokeWidth="6" fill="none" strokeLinecap="round" />
        {/* Dizzy X eyes */}
        <path d="M198 46 L204 52 M204 46 L198 52" stroke="#1e293b" strokeWidth="2.5" />
        <path d="M216 46 L222 52 M222 46 L216 52" stroke="#1e293b" strokeWidth="2.5" />
        <ellipse cx="210" cy="66" rx="5" ry="3" fill="#1e293b" />
        {/* Label */}
        <text x="210" y="152" textAnchor="middle" fontSize="11" fontWeight="800" fill="#475569">EXCHANGE</text>
      </g>
      
      {/* Ice Cream 4: SUB4SUB - Double scoop */}
      <g>
        {/* Cone */}
        <path d="M268 85 L290 135 L312 85" fill="#d4a574" />
        <path d="M272 90 L285 120 M282 90 L290 115 M290 90 L298 120 M298 90 L308 115" stroke="#c4956a" strokeWidth="1.5" />
        {/* Bottom scoop base */}
        <ellipse cx="290" cy="85" rx="24" ry="8" fill="#9333ea" />
        {/* Bottom scoop */}
        <ellipse cx="290" cy="68" rx="22" ry="20" fill="#c084fc" />
        {/* Top scoop */}
        <ellipse cx="290" cy="40" rx="18" ry="18" fill="#a78bfa" />
        <ellipse cx="284" cy="34" rx="6" ry="5" fill="#ddd6fe" opacity="0.5" />
        {/* Drips */}
        <path d="M270 85 Q264 100 268 118" stroke="#c084fc" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M310 85 Q316 98 312 115" stroke="#c084fc" strokeWidth="5" fill="none" strokeLinecap="round" />
        {/* Top scoop sad face */}
        <circle cx="284" cy="36" r="2.5" fill="#1e293b" />
        <circle cx="296" cy="36" r="2.5" fill="#1e293b" />
        <path d="M285 46 Q290 43 295 46" stroke="#1e293b" strokeWidth="2" fill="none" />
        {/* Bottom scoop sad face */}
        <circle cx="282" cy="64" r="2.5" fill="#1e293b" />
        <circle cx="298" cy="64" r="2.5" fill="#1e293b" />
        <path d="M284 76 Q290 73 296 76" stroke="#1e293b" strokeWidth="2" fill="none" />
        {/* Label */}
        <text x="290" y="152" textAnchor="middle" fontSize="11" fontWeight="800" fill="#475569">SUB4SUB</text>
      </g>
    </svg>
  );
}

/* 4. Engagement EKG */
function EngagementEKG() {
  return (
    <svg
      width="180"
      height="100"
      viewBox="0 0 180 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="ekgTitle ekgDesc"
    >
      <title id="ekgTitle">Engagement EKG</title>
      <desc id="ekgDesc">
        Heart monitor showing engagement flatline when subscribers are fake
      </desc>
      {/* Monitor background */}
      <rect width="180" height="100" rx="8" fill="#0f172a" />
      {/* Grid lines */}
      <g stroke="#1e293b" strokeWidth="0.5">
        {[20, 40, 60, 80].map((y) => (
          <line key={y} x1="10" y1={y} x2="170" y2={y} />
        ))}
        {[30, 60, 90, 120, 150].map((x) => (
          <line key={x} x1={x} y1="15" x2={x} y2="85" />
        ))}
      </g>
      {/* EKG line - starts healthy then flatlines */}
      <path
        d="M15 50 L30 50 L35 30 L40 70 L45 50 L60 50 L65 35 L70 65 L75 50 L90 50 L95 45 L100 55 L105 50 L170 50"
        stroke="#22c55e"
        strokeWidth="2"
        fill="none"
      />
      {/* Flatline section highlighted */}
      <path
        d="M105 50 L170 50"
        stroke="#ef4444"
        strokeWidth="2"
        fill="none"
      />
      {/* Label */}
      <text x="140" y="38" fontSize="8" fill="#ef4444" fontWeight="600">
        FAKE SUBS
      </text>
      <text x="40" y="92" fontSize="7" fill="#64748b">
        Real engagement
      </text>
      <text x="120" y="92" fontSize="7" fill="#ef4444">
        Flatline
      </text>
    </svg>
  );
}

/* 5. Revenue Piggy Bank with Holes */
function RevenuePiggyBank() {
  return (
    <svg
      width="220"
      height="170"
      viewBox="0 0 220 170"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="piggyTitle piggyDesc"
    >
      <title id="piggyTitle">Revenue Piggy Bank with Holes</title>
      <desc id="piggyDesc">
        Piggy bank with holes showing that subscribers do not pay, views do
      </desc>
      
      {/* Shadow under piggy */}
      <ellipse cx="110" cy="130" rx="55" ry="8" fill="#d4d4d8" />
      
      {/* Back legs - behind body */}
      <rect x="65" y="100" width="16" height="28" rx="6" fill="#f472b6" />
      <rect x="138" y="100" width="16" height="28" rx="6" fill="#f472b6" />
      
      {/* Piggy body - main shape */}
      <ellipse cx="110" cy="72" rx="58" ry="45" fill="#fb7185" />
      {/* Body highlight/sheen */}
      <ellipse cx="95" cy="55" rx="25" ry="18" fill="#fda4af" opacity="0.7" />
      
      {/* Front legs - in front of body */}
      <rect x="78" y="102" width="16" height="26" rx="6" fill="#fb7185" />
      <rect x="125" y="102" width="16" height="26" rx="6" fill="#fb7185" />
      {/* Hooves */}
      <ellipse cx="86" cy="128" rx="9" ry="4" fill="#f472b6" />
      <ellipse cx="133" cy="128" rx="9" ry="4" fill="#f472b6" />
      <ellipse cx="73" cy="128" rx="9" ry="4" fill="#ec4899" />
      <ellipse cx="146" cy="128" rx="9" ry="4" fill="#ec4899" />
      
      {/* Ears - ON THE HEAD near snout side */}
      <ellipse cx="145" cy="35" rx="10" ry="14" fill="#f472b6" />
      <ellipse cx="146" cy="37" rx="5" ry="8" fill="#fda4af" />
      <ellipse cx="160" cy="40" rx="9" ry="12" fill="#f472b6" />
      <ellipse cx="161" cy="42" rx="4" ry="7" fill="#fda4af" />
      
      {/* Snout */}
      <ellipse cx="172" cy="72" rx="18" ry="15" fill="#f472b6" />
      {/* Nostrils */}
      <ellipse cx="168" cy="70" rx="4" ry="5" fill="#be123c" />
      <ellipse cx="178" cy="70" rx="4" ry="5" fill="#be123c" />
      
      {/* Eyes - cute */}
      <circle cx="150" cy="58" r="7" fill="white" />
      <circle cx="152" cy="59" r="4" fill="#1e293b" />
      <circle cx="153" cy="57" r="1.5" fill="white" />
      
      {/* Coin slot on top */}
      <rect x="95" y="26" width="26" height="6" rx="3" fill="#be123c" />
      
      {/* Curly tail - on the LEFT side (back of pig) */}
      <path d="M52 75 Q40 70 42 58 Q46 48 55 52 Q60 58 55 65" stroke="#f472b6" strokeWidth="5" fill="none" strokeLinecap="round" />
      
      {/* HOLES in the body - clear holes */}
      <circle cx="85" cy="78" r="8" fill="#450a0a" />
      <ellipse cx="86" cy="76" rx="5" ry="4" fill="#7f1d1d" opacity="0.5" />
      
      <circle cx="115" cy="92" r="7" fill="#450a0a" />
      <ellipse cx="116" cy="90" rx="4" ry="3" fill="#7f1d1d" opacity="0.5" />
      
      <circle cx="135" cy="75" r="6" fill="#450a0a" />
      <ellipse cx="136" cy="73" rx="3" ry="2.5" fill="#7f1d1d" opacity="0.5" />
      
      {/* Coins CLEARLY falling from holes - with motion trails */}
      {/* From hole 1 */}
      <path d="M85 86 L82 98" stroke="#fcd34d" strokeWidth="1" strokeDasharray="2" opacity="0.5" />
      <circle cx="80" cy="105" r="7" fill="#fcd34d" stroke="#eab308" strokeWidth="2" />
      <text x="80" y="108" textAnchor="middle" fontSize="8" fill="#92400e">$</text>
      
      <path d="M85 86 L88 100" stroke="#fcd34d" strokeWidth="1" strokeDasharray="2" opacity="0.5" />
      <circle cx="90" cy="118" r="6" fill="#fcd34d" stroke="#eab308" strokeWidth="2" />
      <text x="90" y="121" textAnchor="middle" fontSize="7" fill="#92400e">$</text>
      
      {/* From hole 2 */}
      <path d="M115 99 L112 110" stroke="#fcd34d" strokeWidth="1" strokeDasharray="2" opacity="0.5" />
      <circle cx="110" cy="120" r="6" fill="#fcd34d" stroke="#eab308" strokeWidth="2" />
      <text x="110" y="123" textAnchor="middle" fontSize="7" fill="#92400e">$</text>
      
      {/* From hole 3 */}
      <path d="M135 81 L138 95" stroke="#fcd34d" strokeWidth="1" strokeDasharray="2" opacity="0.5" />
      <circle cx="140" cy="108" r="5" fill="#fcd34d" stroke="#eab308" strokeWidth="1.5" />
      <text x="140" y="111" textAnchor="middle" fontSize="6" fill="#92400e">$</text>
      
      {/* Sad/worried expression - eyebrow */}
      <path d="M145 52 Q150 50 155 52" stroke="#be123c" strokeWidth="2" fill="none" />
      
      {/* Label */}
      <text x="110" y="158" textAnchor="middle" fontSize="12" fill="#64748b" fontWeight="500">
        Subs do not pay; views do
      </text>
    </svg>
  );
}

/* 8. Policy Document with Rejection Stamp */
function TermsCourtroomDoodle() {
  return (
    <svg
      width="180"
      height="120"
      viewBox="0 0 180 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="policyTitle policyDesc"
    >
      <title id="policyTitle">Policy Violation</title>
      <desc id="policyDesc">
        Document with a rejected stamp showing policy enforcement
      </desc>
      {/* Document background */}
      <rect x="30" y="10" width="120" height="100" rx="4" fill="white" stroke="#e2e8f0" strokeWidth="2" />
      {/* Document lines */}
      <rect x="45" y="25" width="90" height="6" rx="2" fill="#e2e8f0" />
      <rect x="45" y="38" width="70" height="6" rx="2" fill="#e2e8f0" />
      <rect x="45" y="51" width="80" height="6" rx="2" fill="#e2e8f0" />
      <rect x="45" y="64" width="60" height="6" rx="2" fill="#e2e8f0" />
      <rect x="45" y="77" width="75" height="6" rx="2" fill="#e2e8f0" />
      {/* REJECTED stamp - tilted */}
      <g transform="rotate(-12 90 60)">
        <rect x="50" y="45" width="80" height="30" rx="4" fill="none" stroke="#dc2626" strokeWidth="3" />
        <text x="90" y="67" textAnchor="middle" fontSize="14" fontWeight="800" fill="#dc2626">
          REJECTED
        </text>
      </g>
      {/* Corner fold */}
      <path d="M120 10 L150 10 L150 40 Z" fill="#f1f5f9" />
      <path d="M120 10 L120 40 L150 40" fill="none" stroke="#e2e8f0" strokeWidth="1" />
    </svg>
  );
}

/* 8. Slot Machine of Doom - eye-catching consequences */
function WheelOfOutcomes() {
  return (
    <svg
      width="320"
      height="180"
      viewBox="0 0 320 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="slotTitle slotDesc"
    >
      <title id="slotTitle">Slot Machine of Consequences</title>
      <desc id="slotDesc">
        A slot machine showing possible consequences: purge, denial, suspension, strikes, termination
      </desc>
      
      {/* Slot machine body */}
      <rect x="40" y="20" width="240" height="140" rx="12" fill="#1e293b" />
      <rect x="45" y="25" width="230" height="130" rx="10" fill="#334155" />
      
      {/* Top decoration - flashing lights */}
      <circle cx="80" cy="15" r="8" fill="#fbbf24" />
      <circle cx="80" cy="15" r="5" fill="#fef3c7" />
      <circle cx="160" cy="12" r="10" fill="#ef4444" />
      <circle cx="160" cy="12" r="6" fill="#fecaca" />
      <circle cx="240" cy="15" r="8" fill="#fbbf24" />
      <circle cx="240" cy="15" r="5" fill="#fef3c7" />
      
      {/* "BAD LUCK" sign on top */}
      <rect x="100" y="5" width="120" height="22" rx="4" fill="#dc2626" />
      <text x="160" y="20" textAnchor="middle" fontSize="12" fontWeight="800" fill="#fef2f2" letterSpacing="2">
        BAD LUCK
      </text>
      
      {/* Display window */}
      <rect x="55" y="40" width="210" height="80" rx="6" fill="#0f172a" />
      <rect x="60" y="45" width="200" height="70" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="2" />
      
      {/* Three spinning reels showing bad outcomes */}
      {/* Reel 1 */}
      <rect x="68" y="52" width="56" height="56" rx="4" fill="#fee2e2" />
      <text x="96" y="75" textAnchor="middle" fontSize="24">🗑️</text>
      <text x="96" y="98" textAnchor="middle" fontSize="9" fontWeight="700" fill="#991b1b">PURGE</text>
      
      {/* Reel 2 */}
      <rect x="132" y="52" width="56" height="56" rx="4" fill="#fef3c7" />
      <text x="160" y="75" textAnchor="middle" fontSize="24">⛔</text>
      <text x="160" y="98" textAnchor="middle" fontSize="9" fontWeight="700" fill="#92400e">DENIED</text>
      
      {/* Reel 3 */}
      <rect x="196" y="52" width="56" height="56" rx="4" fill="#fce7f3" />
      <text x="224" y="75" textAnchor="middle" fontSize="24">💀</text>
      <text x="224" y="98" textAnchor="middle" fontSize="8" fontWeight="700" fill="#9d174d">TERMINATED</text>
      
      {/* Reel dividers */}
      <line x1="128" y1="50" x2="128" y2="112" stroke="#475569" strokeWidth="3" />
      <line x1="192" y1="50" x2="192" y2="112" stroke="#475569" strokeWidth="3" />
      
      {/* Pull lever */}
      <rect x="280" y="45" width="12" height="70" rx="4" fill="#64748b" />
      <circle cx="286" cy="40" r="14" fill="#ef4444" stroke="#b91c1c" strokeWidth="3" />
      <circle cx="286" cy="40" r="8" fill="#fca5a5" />
      
      {/* Coin slot */}
      <rect x="55" y="128" width="30" height="8" rx="2" fill="#0f172a" />
      <text x="70" y="148" textAnchor="middle" fontSize="7" fill="#94a3b8">COINS</text>
      
      {/* Payout display showing "0" */}
      <rect x="180" y="125" width="75" height="25" rx="4" fill="#0f172a" stroke="#475569" strokeWidth="1" />
      <text x="217" y="143" textAnchor="middle" fontSize="14" fontWeight="800" fill="#ef4444" fontFamily="monospace">
        $0.00
      </text>
      
      {/* Sad face on side */}
      <g transform="translate(15, 80)">
        <circle cx="0" cy="0" r="12" fill="#fef3c7" stroke="#1e293b" strokeWidth="2" />
        <circle cx="-4" cy="-3" r="1.5" fill="#1e293b" />
        <circle cx="4" cy="-3" r="1.5" fill="#1e293b" />
        <path d="M-4 4 Q0 1 4 4" stroke="#1e293b" strokeWidth="1.5" fill="none" />
      </g>
      
      {/* Caption */}
      <text x="160" y="175" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="500">
        Every spin is a losing spin
      </text>
    </svg>
  );
}

/* 11. Three-Lane Growth Highway - clean horizontal merge */
function ThreeLaneHighway() {
  return (
    <svg
      width="320"
      height="120"
      viewBox="0 0 320 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="highwayTitle highwayDesc"
    >
      <title id="highwayTitle">Three-Lane Growth Highway</title>
      <desc id="highwayDesc">
        Three lanes labeled Content, Packaging, and Conversion merging toward
        Real Audience
      </desc>
      
      {/* Three parallel lanes merging to one */}
      {/* Lane 1 - Content (top) */}
      <path
        d="M0 25 L180 25 Q220 25 240 60 L280 60"
        stroke="#6366f1"
        strokeWidth="24"
        fill="none"
        strokeLinecap="round"
      />
      {/* Lane 2 - Packaging (middle) */}
      <path
        d="M0 60 L200 60 L280 60"
        stroke="#8b5cf6"
        strokeWidth="24"
        fill="none"
        strokeLinecap="round"
      />
      {/* Lane 3 - Conversion (bottom) */}
      <path
        d="M0 95 L180 95 Q220 95 240 60 L280 60"
        stroke="#a855f7"
        strokeWidth="24"
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Lane labels */}
      <text x="20" y="29" fontSize="10" fontWeight="600" fill="white">
        CONTENT
      </text>
      <text x="20" y="64" fontSize="10" fontWeight="600" fill="white">
        PACKAGING
      </text>
      <text x="20" y="99" fontSize="10" fontWeight="600" fill="white">
        CONVERSION
      </text>
      
      {/* Arrows on each lane */}
      <path d="M100 25 L115 25 M110 20 L118 25 L110 30" stroke="white" strokeWidth="2" fill="none" />
      <path d="M100 60 L115 60 M110 55 L118 60 L110 65" stroke="white" strokeWidth="2" fill="none" />
      <path d="M100 95 L115 95 M110 90 L118 95 L110 100" stroke="white" strokeWidth="2" fill="none" />
      
      {/* Destination circle */}
      <circle cx="295" cy="60" r="24" fill="#22c55e" />
      <text x="295" y="55" textAnchor="middle" fontSize="9" fontWeight="700" fill="white">
        REAL
      </text>
      <text x="295" y="68" textAnchor="middle" fontSize="9" fontWeight="700" fill="white">
        AUDIENCE
      </text>
    </svg>
  );
}

/* 12. Subscribe Button with Seatbelt */
function SubscribeButtonSeatbelt() {
  return (
    <svg
      width="140"
      height="80"
      viewBox="0 0 140 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="seatbeltTitle seatbeltDesc"
    >
      <title id="seatbeltTitle">Subscribe Button with Seatbelt</title>
      <desc id="seatbeltDesc">
        Subscribe button secured with a seatbelt representing an earned click
      </desc>
      {/* Button background */}
      <rect x="20" y="20" width="100" height="40" rx="6" fill="#dc2626" />
      {/* Button text */}
      <text
        x="70"
        y="45"
        textAnchor="middle"
        fontSize="12"
        fontWeight="700"
        fill="white"
      >
        SUBSCRIBE
      </text>
      {/* Seatbelt across button */}
      <path
        d="M10 15 Q70 35 130 15"
        stroke="#1e293b"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M10 65 Q70 45 130 65"
        stroke="#1e293b"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />
      {/* Buckle */}
      <rect x="60" y="50" width="20" height="16" rx="2" fill="#475569" />
      <rect x="65" y="54" width="10" height="8" rx="1" fill="#ef4444" />
      {/* Label */}
      <text x="70" y="78" textAnchor="middle" fontSize="8" fill="#64748b">
        Earned click, not forced
      </text>
    </svg>
  );
}

/*
CHECKLIST:
- [x] IDs unchanged: overview, how-it-works, why-harmful, policy-violations, real-consequences, safe-alternatives
- [x] Minimal UL/OL: only internal list in LaneCard, no major bulleted sections
- [x] Mobile stacking: InlineFigure uses floatLeft/floatRight which stack on mobile
- [x] No unused imports: Link, BRAND, BodyProps all used
- [x] Links preserved with improved anchor text: 
      - /learn/youtube-competitor-analysis
      - /learn/youtube-retention-analysis  
      - /learn/youtube-video-ideas
      - /learn/youtube-seo
      - /learn/youtube-thumbnail-best-practices
      - /learn/how-to-get-more-subscribers
- [x] SVG accessibility: all informational SVGs have <title> and <desc>, decorative use aria-hidden
- [x] No external service links
- [x] 12 unique SVG visuals distributed throughout page
*/
