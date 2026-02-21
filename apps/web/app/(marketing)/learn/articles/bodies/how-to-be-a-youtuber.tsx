/**
 * Body content for How to Be a YouTuber article.
 * Server component - no "use client" directive.
 *
 * IMPLEMENTATION:
 * - Visual-first, mentor-tone guide
 * - Unique SVGs with humor via visuals, not text
 * - 4pt spacing grid (4, 8, 12, 16, 24, 32, 48)
 * - Preserve all anchor IDs
 * - Required links: /learn/youtube-competitor-analysis, /learn/how-to-get-more-subscribers
 */

import Link from "next/link";
import { LEARN_ARTICLES } from "../../articles";
import type { BodyProps } from "./_shared";
import { articleExports } from "./_shared";

export const { meta, toc } = articleExports(LEARN_ARTICLES["how-to-be-a-youtuber"]);

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* ========================================
          MINDSET SECTION
          ======================================== */}
      <section id="mindset" className="sectionOpen">
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </span>
          Being a YouTuber Is a Skill, Not a Personality Type
        </h2>

        <p className={s.sectionText}>
          You don&apos;t need perfect gear, a magnetic personality, or a viral idea. 
          You need reps. The creators who succeed aren&apos;t born with it—they 
          published through the awkward phase until something clicked.
        </p>

        {/* Exaggerated humorous visual: YouTuber at the gym lifting "uploads" */}
        <div className="inlineIllustration">
          <CreatorGym />
        </div>

        <p className={s.sectionText}>
          Your first ten videos will be rough. That&apos;s not a warning—it&apos;s 
          permission. Every creator you admire has a graveyard of cringe content 
          they hope you never find. The difference? They hit publish anyway.
        </p>

        <p className={s.sectionText}>
          YouTube rewards consistency and improvement, not perfection. Your job 
          isn&apos;t to make a masterpiece on day one—it&apos;s to get through 
          the learning curve faster by shipping more.
        </p>

        <div className="funCallout">
          <p className="funCallout__text">
            <strong>Perfection is a delay tactic.</strong> Publish, learn, repeat.
          </p>
        </div>
      </section>

      {/* ========================================
          DIRECTION SECTION
          ======================================== */}
      <section id="direction" className="sectionOpen">
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </span>
          Pick a Direction That Can Survive 50 Videos
        </h2>

        <p className={s.sectionText}>
          &quot;Finding your niche&quot; sounds intimidating, but it&apos;s just 
          one question: what can you talk about for 50 videos without running 
          out of ideas or motivation?
        </p>

        <p className={s.sectionText}>
          You don&apos;t need to be an expert. You just need to know slightly 
          more than your audience—or learn alongside them. Some of the best 
          channels are curious people documenting their journey, not gurus 
          lecturing from above.
        </p>

        <h3 className={s.subheading}>Three Directions That Work</h3>

        <CardGrid cols={3}>
          <Card icon={<TeachIcon />} title="Teach">
            &quot;I help X do Y.&quot; You have a skill and help people who want 
            it. Beginners learning guitar, remote workers staying productive, 
            parents cooking faster dinners. The clearer X and Y, the easier 
            YouTube can recommend you.
          </Card>
          <Card icon={<TestIcon />} title="Test">
            &quot;I test X so you don&apos;t have to.&quot; You spend time and 
            money trying products, services, or methods so viewers can decide. 
            Budget cameras, productivity apps, meal delivery services. Works 
            because people search before they buy.
          </Card>
          <Card icon={<DocumentIcon />} title="Document">
            &quot;I&apos;m learning X, come with me.&quot; You&apos;re learning 
            publicly and bringing people along. Learning a language, building a 
            business from zero, renovating a house. Viewers root for you and 
            return to see progress.
          </Card>
        </CardGrid>

        <h3 className={s.subheading}>The 50 Ideas Test</h3>

        <div className="floatRight">
          <IdeaSlotMachine />
        </div>

        <p className={s.sectionText}>
          Before committing to a direction, brainstorm 50 video ideas in that 
          space. Don&apos;t filter—just write titles as fast as you can.
        </p>

        <p className={s.sectionText}>
          If you hit 50 easily and still feel excited, you&apos;ve found 
          something sustainable. If you stall at 15 and feel drained, that&apos;s 
          valuable information—try a different direction.
        </p>

        <p className={s.sectionText}>
          For more inspiration, see our{" "}
          <Link href="/learn/youtube-video-ideas">guide to generating video ideas</Link>.
        </p>
      </section>

      {/* ========================================
          FIRST VIDEO SECTION
          ======================================== */}
      <section id="first-video" className="sectionTinted">
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </span>
          Publishing Your First Video
        </h2>

        <p className={s.sectionText}>
          This is the section that matters most. Everything else—gear, 
          optimization, growth tactics—is noise until you&apos;ve actually 
          made something. Your first video won&apos;t be great, and that&apos;s 
          exactly right.
        </p>

        {/* -------- GEAR SETUP -------- */}
        <h3 className={s.subheading}>The Gear You Actually Need</h3>

        <p className={s.sectionText}>
          New creators overthink equipment. Here&apos;s what actually matters:
        </p>

        <CardGrid cols={2}>
          <Card title="Camera: Your Phone">
            Modern smartphones shoot better video than professional cameras from 
            a decade ago. The phone in your pocket is good enough to start. 
            Upgrade only after you&apos;ve published 20+ videos and understand 
            your actual needs.
          </Card>
          <Card title="Audio: The Real Priority">
            Viewers tolerate mediocre video far longer than bad audio. A $30 
            lavalier mic or $50 USB microphone transforms your sound quality. 
            Even wired earbuds beat your phone&apos;s built-in mic.
          </Card>
          <Card title="Lighting: Free and Effective">
            Face a window. Natural light is soft, flattering, and costs nothing. 
            Avoid overhead lights that cast shadows under your eyes. If you 
            film at night, a $20 ring light works fine.
          </Card>
          <Card title="Background: Keep It Simple">
            A clean, uncluttered background. A blank wall works. A bookshelf 
            works. What doesn&apos;t work: dirty laundry, unmade beds, or 
            chaotic spaces that distract from you.
          </Card>
        </CardGrid>

        {/* -------- PLANNING -------- */}
        <h3 className={s.subheading}>Planning Your Video</h3>

        <p className={s.sectionText}>
          You don&apos;t need a full script, but you do need a plan. The 
          simplest structure that works:
        </p>

        <div className="inlineIllustration">
          <VideoStructure />
        </div>

        <Rows
          items={[
            { label: "Hook", value: "First 10 seconds. State what they'll learn or why they should care. This is make-or-break." },
            { label: "Promise", value: "What will viewers know or be able to do after watching? Be specific." },
            { label: "Content", value: "3-5 main points. Each one should build toward the promise." },
            { label: "Proof", value: "Show your work. Demonstrate, don't just tell." },
            { label: "Next step", value: "What should they watch next? Plant the seed for another video." },
          ]}
        />

        <p className={s.sectionText}>
          For channel setup details, see our{" "}
          <Link href="/learn/how-to-make-a-youtube-channel">channel creation guide</Link>.
        </p>

        {/* -------- RECORDING -------- */}
        <h3 className={s.subheading}>Recording Without Overthinking</h3>

        <div className="floatLeft">
          <RecordingSetup />
        </div>

        <p className={s.sectionText}>
          Set up, press record, then talk like you&apos;re explaining this to a 
          friend who asked. You&apos;ll feel awkward—that&apos;s normal. The 
          camera makes everyone self-conscious at first, and the only cure is 
          exposure.
        </p>

        <p className={s.sectionText}>
          Give yourself permission to do multiple takes. Say something wrong? 
          Pause, restart that section, keep going. You&apos;ll edit out mistakes 
          later. Nobody delivers perfect monologues in a single take—not even 
          the creators you admire.
        </p>

        <div style={{ clear: "both", height: "24px" }} />

        {/* -------- EDITING -------- */}
        <h3 className={s.subheading}>Editing: Cut the Dead Weight</h3>

        <p className={s.sectionText}>
          Use free software like DaVinci Resolve, CapCut, or iMovie. Your 
          editing goal is simple: remove everything that doesn&apos;t need to 
          be there.
        </p>

        <div className="inlineIllustration">
          <EditingTimeline />
        </div>

        <p className={s.sectionText}>
          Cut the pauses. Cut the &quot;ums.&quot; Cut the false starts. Cut 
          the tangents. Watch your video back and notice where your attention 
          drifts—that&apos;s exactly where viewers will click away.
        </p>

        <p className={s.sectionText}>
          For deeper guidance, see our{" "}
          <Link href="/learn/youtube-retention-analysis">retention analysis guide</Link>.
        </p>

        {/* -------- PACKAGING -------- */}
        <h3 className={s.subheading}>Titles and Thumbnails</h3>

        <p className={s.sectionText}>
          Your video lives or dies based on whether people click. The title 
          should clearly communicate the value—what will someone get by 
          watching?
        </p>

        <p className={s.sectionText}>
          Avoid vague titles like &quot;My First Video&quot; or &quot;Quick 
          Update.&quot; These tell viewers nothing about what they&apos;ll get.
        </p>

        <p className={s.sectionText}>
          Thumbnails matter equally. Use large, readable text (3–4 words max), 
          high contrast, and a clear focal point. For more, see our{" "}
          <Link href="/learn/youtube-thumbnail-best-practices">thumbnail best practices guide</Link>.
        </p>

        <div className="realTalk">
          <p className="realTalk__label">The publish moment</p>
          <p className="realTalk__text">
            At some point, stop tweaking and let it go. Your first video 
            doesn&apos;t need to be perfect—it needs to exist. Then immediately 
            start planning your second.
          </p>
        </div>
      </section>

      {/* ========================================
          CONSISTENCY SECTION
          ======================================== */}
      <section id="consistency" className="sectionOpen">
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </span>
          Build a Sustainable System
        </h2>

        <p className={s.sectionText}>
          Consistency beats intensity. One video per week for a year outperforms 
          a burst of daily uploads followed by burnout. The creators who last 
          design a system they can actually maintain.
        </p>

        <div className="inlineIllustration">
          <ProductionCycle />
        </div>

        <h3 className={s.subheading}>Separate Ideas from Production</h3>

        <p className={s.sectionText}>
          Keep a running list of video ideas. When inspiration strikes, add to 
          the list. When it&apos;s time to create, pull from the list. This 
          prevents sitting down and wondering what to make.
        </p>

        <h3 className={s.subheading}>Pick a Sustainable Cadence</h3>

        <CardGrid cols={3}>
          <Card title="Weekly">
            Aggressive but sustainable for full-timers or highly efficient 
            creators. Builds momentum fast. Requires dedicated production time.
          </Card>
          <Card title="Every Two Weeks">
            Realistic for people with day jobs. Prioritize quality and 
            consistency over volume. Most beginners should start here.
          </Card>
          <Card title="Monthly + Shorts">
            One long video per month, plus Shorts to stay visible. Good for 
            building the habit while you learn.
          </Card>
        </CardGrid>

        <p className={s.sectionText}>
          Pick a schedule you could keep for three months without heroic effort. 
          You can always increase later once the habit is built.
        </p>
      </section>

      {/* ========================================
          GROWTH SECTION
          ======================================== */}
      <section id="growth" className="sectionTinted">
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          </span>
          The Growth Loop
        </h2>

        <p className={s.sectionText}>
          YouTube growth comes down to four things. Understanding them saves 
          you from chasing tactics that don&apos;t matter.
        </p>

        <div className="inlineIllustration">
          <GrowthLoopDiagram />
        </div>

        <CardGrid cols={2}>
          <Card title="Topic Demand">
            Are you making videos people actually search for or want? The best 
            production won&apos;t help if nobody wants what you&apos;re 
            offering. Study what&apos;s getting views in your space using a{" "}
            <Link href="/learn/youtube-competitor-analysis">
              competitor analysis framework for YouTube niches
            </Link>.
          </Card>
          <Card title="Packaging">
            Your title and thumbnail determine whether people click. Treat 
            every title and thumbnail as a tiny advertisement. Test different 
            approaches and watch your click-through rate.
          </Card>
          <Card title="Retention">
            Once someone clicks, do they keep watching? YouTube measures this 
            obsessively. Videos that hold attention get promoted; videos people 
            abandon get buried. Cut the fluff, front-load value.
          </Card>
          <Card title="Next-Video Path">
            The best growth tactic is making viewers want more. End every video 
            pointing to another. Create series that build on each other. Learn{" "}
            <Link href="/learn/how-to-get-more-subscribers">
              how to get more subscribers with conversion patterns
            </Link>.
          </Card>
        </CardGrid>

        <div className="funCallout">
          <p className="funCallout__text">
            These four levers—topic, packaging, retention, next video—are where 
            to focus your improvement energy. Everything else is secondary.
          </p>
        </div>
      </section>

      {/* ========================================
          CHALLENGES SECTION
          ======================================== */}
      <section id="challenges" className="sectionOpen">
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </span>
          When It Gets Hard
        </h2>

        <p className={s.sectionText}>
          Everyone hits walls. Here are the three most common obstacles and how 
          to navigate them.
        </p>

        <div className="inlineIllustration">
          <ObstacleRoad />
        </div>

        <div style={{ marginTop: "32px" }}>
          <CardGrid cols={3}>
            <Card title="The Slow Start">
              <div style={{ marginBottom: "12px" }}>
                <strong style={{ color: "var(--text)" }}>Feels like:</strong>{" "}
                Months of work, barely any views. Am I invisible?
              </div>
              <div>
                <strong style={{ color: "#16a34a" }}>Do this:</strong>{" "}
                Compare to last month&apos;s you, not someone else&apos;s year 
                five. The algorithm needs time to learn your content.
              </div>
            </Card>
            <Card title="The Motivation Dip">
              <div style={{ marginBottom: "12px" }}>
                <strong style={{ color: "var(--text)" }}>Feels like:</strong>{" "}
                The excitement faded. I don&apos;t feel like making anything.
              </div>
              <div>
                <strong style={{ color: "#16a34a" }}>Do this:</strong>{" "}
                Rely on your system, not inspiration. Show up on production 
                days even when you don&apos;t feel it.
              </div>
            </Card>
            <Card title="Technical Chaos">
              <div style={{ marginBottom: "12px" }}>
                <strong style={{ color: "var(--text)" }}>Feels like:</strong>{" "}
                Audio issues, software crashes, footage that looks wrong.
              </div>
              <div>
                <strong style={{ color: "#16a34a" }}>Do this:</strong>{" "}
                Each problem you solve is a skill you now have. The learning 
                curve is steep at first, then flattens.
              </div>
            </Card>
          </CardGrid>
        </div>
      </section>

      {/* ========================================
          MONETIZATION SECTION
          ======================================== */}
      <section id="monetization" className="sectionOpen">
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          </span>
          Monetization Comes Later
        </h2>

        <p className={s.sectionText}>
          Making money from YouTube is real, but it&apos;s not where your focus 
          should be early on. The YouTube Partner Program has subscriber and 
          watch-time thresholds that take most beginners months to reach—and 
          that&apos;s fine.
        </p>

        <div className="floatRight">
          <MoneyMilestone />
        </div>

        <p className={s.sectionText}>
          Monetization is a lagging indicator. When you do reach it, ad revenue 
          is just one option. Sponsorships, affiliate links, your own products, 
          memberships—these often pay better. But all require an engaged 
          audience first.
        </p>

        <p className={s.sectionText}>
          Build that audience, and the money options appear. Chase money before 
          you have viewers, and you&apos;ll burn out chasing metrics instead of 
          making good content.
        </p>

        <p className={s.sectionText}>
          For details, see our{" "}
          <Link href="/learn/youtube-monetization-requirements">
            monetization requirements guide
          </Link>.
        </p>
      </section>

      {/* ========================================
          FINAL CTA
          ======================================== */}
      <div className="sectionAccent">
        <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "16px" }}>
          Your Next Move
        </h3>

        <div className="inlineIllustration" style={{ padding: "0 0 24px" }}>
          <NextStepVisual />
        </div>

        <div style={{ maxWidth: "440px", margin: "0 auto", textAlign: "left" }}>
          <Rows
            items={[
              { label: "Step 1", value: "Write your promise: \"After watching, you'll know/be able to...\"" },
              { label: "Step 2", value: "Pick the next video it should point to (even if it doesn't exist yet)." },
            ]}
            light
          />
        </div>

        <p style={{ marginTop: "24px", fontSize: "1rem", opacity: 0.9 }}>
          That&apos;s your first real step. Start now.
        </p>
      </div>
    </>
  );
}

/* ================================================
   LOCAL HELPER COMPONENTS
   ================================================ */

type CardProps = {
  icon?: React.ReactNode;
  title: string;
  children: React.ReactNode;
};

function Card({ icon, title, children }: CardProps) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {icon && <div style={{ color: "var(--primary)" }}>{icon}</div>}
      <h4 style={{ fontSize: "15px", fontWeight: 700, margin: 0, color: "var(--text)" }}>
        {title}
      </h4>
      <div style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
        {children}
      </div>
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
      style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "16px",
        margin: "24px 0",
      }}
      className={cols === 3 ? "cardGrid--3" : "cardGrid--2"}
    >
      <style>{`
        @media (min-width: 640px) {
          .cardGrid--2 { grid-template-columns: repeat(2, 1fr) !important; }
          .cardGrid--3 { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (min-width: 900px) {
          .cardGrid--3 { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>
      {children}
    </div>
  );
}

type RowsProps = {
  items: Array<{ label: string; value: string }>;
  light?: boolean;
};

function Rows({ items, light }: RowsProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", margin: "16px 0" }}>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: "16px",
            alignItems: "flex-start",
            padding: "12px 16px",
            background: light ? "rgba(255,255,255,0.1)" : "var(--surface-alt)",
            borderRadius: "8px",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: light ? "rgba(255,255,255,0.8)" : "var(--primary)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              minWidth: "72px",
              flexShrink: 0,
            }}
          >
            {item.label}
          </span>
          <span style={{ fontSize: "14px", color: light ? "white" : "var(--text-secondary)", lineHeight: 1.6 }}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}


/* ================================================
   INLINE SVG VISUALS
   ================================================ */

/* Direction card icons */
function TeachIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function TestIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

/* HILARIOUS: Hyper-realistic person in hoodie casually lifting weights */
function CreatorGym() {
  return (
    <svg
      width="340"
      height="240"
      viewBox="0 0 340 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="gym-title gym-desc"
    >
      <title id="gym-title">Creator getting stronger</title>
      <desc id="gym-desc">A hyper-realistic person in a hoodie casually lifting weights labeled as video uploads</desc>
      
      <defs>
        {/* Chrome bar gradient */}
        <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="20%" stopColor="#cbd5e1" />
          <stop offset="40%" stopColor="#94a3b8" />
          <stop offset="60%" stopColor="#cbd5e1" />
          <stop offset="80%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        {/* 3D weight plate gradients */}
        <linearGradient id="redPlate3d" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7f1d1d" />
          <stop offset="15%" stopColor="#b91c1c" />
          <stop offset="40%" stopColor="#ef4444" />
          <stop offset="60%" stopColor="#dc2626" />
          <stop offset="85%" stopColor="#b91c1c" />
          <stop offset="100%" stopColor="#991b1b" />
        </linearGradient>
        <linearGradient id="bluePlate3d" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="15%" stopColor="#1d4ed8" />
          <stop offset="40%" stopColor="#3b82f6" />
          <stop offset="60%" stopColor="#2563eb" />
          <stop offset="85%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#1e40af" />
        </linearGradient>
        {/* Skin tone gradients */}
        <linearGradient id="skinTone" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde4d2" />
          <stop offset="50%" stopColor="#f5d0b8" />
          <stop offset="100%" stopColor="#e8c4a8" />
        </linearGradient>
        <linearGradient id="skinShadow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e8c4a8" />
          <stop offset="100%" stopColor="#d4a88a" />
        </linearGradient>
        {/* Hoodie gradient */}
        <linearGradient id="hoodieMain" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="50%" stopColor="#6d28d9" />
          <stop offset="100%" stopColor="#5b21b6" />
        </linearGradient>
        <linearGradient id="hoodieSleeve" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#5b21b6" />
          <stop offset="50%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
        {/* Jeans gradient */}
        <linearGradient id="jeansGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="30%" stopColor="#1e40af" />
          <stop offset="70%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>
      
      {/* Gym floor with rubber texture */}
      <rect x="0" y="195" width="340" height="45" fill="#1f2937" />
      <g opacity="0.15">
        {[...Array(17)].map((_, i) => (
          <line key={i} x1={i * 20} y1="195" x2={i * 20} y2="240" stroke="#475569" strokeWidth="1" />
        ))}
      </g>
      <rect x="0" y="195" width="340" height="2" fill="#374151" />
      
      {/* BARBELL BAR - behind person */}
      <rect x="25" y="68" width="290" height="9" rx="4.5" fill="url(#barGradient)" />
      {/* Bar highlight */}
      <rect x="25" y="69" width="290" height="2" rx="1" fill="#f1f5f9" opacity="0.4" />
      
      {/* LEFT WEIGHT PLATES - smaller, proper 3D */}
      {/* Red 25kg plate */}
      <g>
        <ellipse cx="52" cy="72" rx="6" ry="45" fill="#7f1d1d" />
        <ellipse cx="48" cy="72" rx="6" ry="45" fill="url(#redPlate3d)" />
        <ellipse cx="48" cy="72" rx="4" ry="35" fill="#b91c1c" />
        <ellipse cx="48" cy="72" rx="2" ry="8" fill="#1f2937" />
        <text x="48" y="50" textAnchor="middle" fontSize="8" fontWeight="800" fill="white">25</text>
      </g>
      {/* Blue 20kg plate */}
      <g>
        <ellipse cx="65" cy="72" rx="5" ry="38" fill="#1e3a8a" />
        <ellipse cx="62" cy="72" rx="5" ry="38" fill="url(#bluePlate3d)" />
        <ellipse cx="62" cy="72" rx="3" ry="28" fill="#1d4ed8" />
        <ellipse cx="62" cy="72" rx="1.5" ry="7" fill="#1f2937" />
      </g>
      {/* Collar */}
      <rect x="72" y="64" width="10" height="16" rx="2" fill="#52525b" />
      <rect x="74" y="66" width="6" height="12" rx="1" fill="#71717a" />
      
      {/* RIGHT WEIGHT PLATES */}
      {/* Collar */}
      <rect x="258" y="64" width="10" height="16" rx="2" fill="#52525b" />
      <rect x="260" y="66" width="6" height="12" rx="1" fill="#71717a" />
      {/* Blue 20kg plate */}
      <g>
        <ellipse cx="278" cy="72" rx="5" ry="38" fill="url(#bluePlate3d)" />
        <ellipse cx="281" cy="72" rx="5" ry="38" fill="#1e3a8a" />
        <ellipse cx="278" cy="72" rx="3" ry="28" fill="#1d4ed8" />
        <ellipse cx="278" cy="72" rx="1.5" ry="7" fill="#1f2937" />
      </g>
      {/* Red 25kg plate */}
      <g>
        <ellipse cx="292" cy="72" rx="6" ry="45" fill="url(#redPlate3d)" />
        <ellipse cx="296" cy="72" rx="6" ry="45" fill="#7f1d1d" />
        <ellipse cx="292" cy="72" rx="4" ry="35" fill="#b91c1c" />
        <ellipse cx="292" cy="72" rx="2" ry="8" fill="#1f2937" />
        <text x="292" y="50" textAnchor="middle" fontSize="8" fontWeight="800" fill="white">25</text>
      </g>
      
      {/* Weight labels */}
      <text x="35" y="130" fontSize="9" fontWeight="700" fill="#64748b">VID 1-10</text>
      <text x="280" y="130" fontSize="9" fontWeight="700" fill="#64748b">VID 41-50</text>
      
      {/* HYPER-REALISTIC PERSON - centered */}
      <g transform="translate(170, 0)">
        
        {/* === LEGS IN JEANS === */}
        {/* Left leg */}
        <path d="M-12 158 Q-16 175 -18 195" fill="none" stroke="url(#jeansGradient)" strokeWidth="18" strokeLinecap="round" />
        {/* Right leg */}
        <path d="M12 158 Q16 175 18 195" fill="none" stroke="url(#jeansGradient)" strokeWidth="18" strokeLinecap="round" />
        {/* Jean seams and details */}
        <path d="M-12 160 L-14 190" stroke="#1e3a8a" strokeWidth="1" opacity="0.4" />
        <path d="M12 160 L14 190" stroke="#1e3a8a" strokeWidth="1" opacity="0.4" />
        {/* Pocket stitching hint */}
        <path d="M-8 162 Q-12 165 -10 170" stroke="#1e3a8a" strokeWidth="0.5" opacity="0.3" fill="none" />
        <path d="M8 162 Q12 165 10 170" stroke="#1e3a8a" strokeWidth="0.5" opacity="0.3" fill="none" />
        
        {/* === SNEAKERS === */}
        {/* Left shoe */}
        <ellipse cx="-18" cy="198" rx="14" ry="7" fill="#f8fafc" />
        <path d="M-30 198 Q-32 195 -28 193 L-8 193 Q-4 195 -6 198" fill="#e2e8f0" />
        <path d="M-28 196 L-8 196" stroke="#cbd5e1" strokeWidth="1.5" />
        <ellipse cx="-18" cy="197" rx="10" ry="4" fill="#f1f5f9" />
        {/* Shoe details */}
        <circle cx="-22" cy="195" r="1" fill="#dc2626" />
        <circle cx="-18" cy="195" r="1" fill="#dc2626" />
        <circle cx="-14" cy="195" r="1" fill="#dc2626" />
        
        {/* Right shoe */}
        <ellipse cx="18" cy="198" rx="14" ry="7" fill="#f8fafc" />
        <path d="M30 198 Q32 195 28 193 L8 193 Q4 195 6 198" fill="#e2e8f0" />
        <path d="M28 196 L8 196" stroke="#cbd5e1" strokeWidth="1.5" />
        <ellipse cx="18" cy="197" rx="10" ry="4" fill="#f1f5f9" />
        <circle cx="22" cy="195" r="1" fill="#dc2626" />
        <circle cx="18" cy="195" r="1" fill="#dc2626" />
        <circle cx="14" cy="195" r="1" fill="#dc2626" />
        
        {/* === HOODIE TORSO === */}
        <path d="M-28 105 Q-35 125 -32 145 Q-25 165 0 168 Q25 165 32 145 Q35 125 28 105 Q18 92 0 92 Q-18 92 -28 105" fill="url(#hoodieMain)" />
        {/* Hoodie fabric folds */}
        <path d="M-20 110 Q-15 130 -18 150" stroke="#5b21b6" strokeWidth="1.5" fill="none" opacity="0.4" />
        <path d="M20 110 Q15 130 18 150" stroke="#5b21b6" strokeWidth="1.5" fill="none" opacity="0.4" />
        <path d="M-5 115 Q0 135 -3 155" stroke="#5b21b6" strokeWidth="1" fill="none" opacity="0.3" />
        <path d="M5 115 Q0 135 3 155" stroke="#5b21b6" strokeWidth="1" fill="none" opacity="0.3" />
        {/* Center zipper/seam */}
        <line x1="0" y1="100" x2="0" y2="165" stroke="#4c1d95" strokeWidth="2" opacity="0.5" />
        {/* Kangaroo pocket */}
        <path d="M-20 138 Q0 148 20 138" stroke="#4c1d95" strokeWidth="2" fill="none" />
        <path d="M-18 140 Q0 148 18 140" fill="#5b21b6" opacity="0.3" />
        {/* Drawstrings */}
        <path d="M-4 100 Q-6 110 -7 125" stroke="#ddd6fe" strokeWidth="2" strokeLinecap="round" />
        <path d="M4 100 Q6 110 7 125" stroke="#ddd6fe" strokeWidth="2" strokeLinecap="round" />
        {/* String ends */}
        <ellipse cx="-7" cy="127" rx="2" ry="3" fill="#c4b5fd" />
        <ellipse cx="7" cy="127" rx="2" ry="3" fill="#c4b5fd" />
        
        {/* === ARMS - properly attached at shoulders === */}
        {/* Shoulder joints - where arms connect */}
        <ellipse cx="-26" cy="105" rx="10" ry="8" fill="url(#hoodieMain)" />
        <ellipse cx="26" cy="105" rx="10" ry="8" fill="url(#hoodieMain)" />
        
        {/* Left arm - from shoulder to hands */}
        <path d="M-26 105 Q-42 95 -55 80 Q-62 72 -65 72" fill="none" stroke="url(#hoodieSleeve)" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
        {/* Left arm shadow/fold */}
        <path d="M-30 100 Q-45 90 -55 82" stroke="#4c1d95" strokeWidth="1" opacity="0.3" fill="none" />
        
        {/* Right arm - from shoulder to hands */}
        <path d="M26 105 Q42 95 55 80 Q62 72 65 72" fill="none" stroke="url(#hoodieSleeve)" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
        {/* Right arm shadow/fold */}
        <path d="M30 100 Q45 90 55 82" stroke="#4c1d95" strokeWidth="1" opacity="0.3" fill="none" />
        
        {/* === HANDS gripping bar === */}
        {/* Left hand */}
        <ellipse cx="-68" cy="72" rx="9" ry="11" fill="url(#skinTone)" />
        {/* Fingers wrapping around bar */}
        <path d="M-74 65 Q-74 60 -70 60 Q-66 60 -66 65" fill="url(#skinShadow)" />
        <path d="M-70 65 Q-70 58 -66 58 Q-62 58 -62 65" fill="url(#skinTone)" />
        <path d="M-66 66 Q-66 60 -62 60 Q-58 60 -58 66" fill="url(#skinTone)" />
        {/* Thumb */}
        <ellipse cx="-60" cy="76" rx="4" ry="5" fill="url(#skinTone)" />
        {/* Knuckle details */}
        <circle cx="-72" cy="68" r="1.5" fill="#d4a88a" opacity="0.4" />
        <circle cx="-68" cy="67" r="1.5" fill="#d4a88a" opacity="0.4" />
        <circle cx="-64" cy="68" r="1.5" fill="#d4a88a" opacity="0.4" />
        
        {/* Right hand */}
        <ellipse cx="68" cy="72" rx="9" ry="11" fill="url(#skinTone)" />
        {/* Fingers wrapping */}
        <path d="M74 65 Q74 60 70 60 Q66 60 66 65" fill="url(#skinShadow)" />
        <path d="M70 65 Q70 58 66 58 Q62 58 62 65" fill="url(#skinTone)" />
        <path d="M66 66 Q66 60 62 60 Q58 60 58 66" fill="url(#skinTone)" />
        {/* Thumb */}
        <ellipse cx="60" cy="76" rx="4" ry="5" fill="url(#skinTone)" />
        {/* Knuckle details */}
        <circle cx="72" cy="68" r="1.5" fill="#d4a88a" opacity="0.4" />
        <circle cx="68" cy="67" r="1.5" fill="#d4a88a" opacity="0.4" />
        <circle cx="64" cy="68" r="1.5" fill="#d4a88a" opacity="0.4" />
        
        {/* === HOOD === */}
        <ellipse cx="0" cy="72" rx="24" ry="28" fill="#7c3aed" />
        <ellipse cx="0" cy="75" rx="20" ry="22" fill="#6d28d9" />
        {/* Hood opening shadow */}
        <ellipse cx="0" cy="78" rx="17" ry="18" fill="#5b21b6" />
        
        {/* === HYPER-DETAILED FACE === */}
        {/* Face shape */}
        <ellipse cx="0" cy="80" rx="14" ry="17" fill="url(#skinTone)" />
        
        {/* Forehead highlight */}
        <ellipse cx="0" cy="68" rx="8" ry="4" fill="#fde4d2" opacity="0.5" />
        
        {/* Eyebrows - relaxed */}
        <path d="M-9 73 Q-6 71 -3 73" stroke="#78716c" strokeWidth="1.5" fill="none" />
        <path d="M9 73 Q6 71 3 73" stroke="#78716c" strokeWidth="1.5" fill="none" />
        
        {/* === GLASSES - detailed === */}
        {/* Left lens */}
        <rect x="-12" y="75" width="10" height="9" rx="2" fill="none" stroke="#292524" strokeWidth="1.5" />
        <rect x="-11" y="76" width="8" height="7" rx="1.5" fill="#f0fdfa" opacity="0.15" />
        {/* Right lens */}
        <rect x="2" y="75" width="10" height="9" rx="2" fill="none" stroke="#292524" strokeWidth="1.5" />
        <rect x="3" y="76" width="8" height="7" rx="1.5" fill="#f0fdfa" opacity="0.15" />
        {/* Bridge */}
        <path d="M-2 79 Q0 77 2 79" stroke="#292524" strokeWidth="1.5" fill="none" />
        {/* Temple arms */}
        <path d="M-12 78 L-18 76" stroke="#292524" strokeWidth="1.5" />
        <path d="M12 78 L18 76" stroke="#292524" strokeWidth="1.5" />
        
        {/* === EYES behind glasses === */}
        {/* Eye whites */}
        <ellipse cx="-7" cy="79" rx="3" ry="2.5" fill="white" />
        <ellipse cx="7" cy="79" rx="3" ry="2.5" fill="white" />
        {/* Irises */}
        <circle cx="-7" cy="79" r="2" fill="#78350f" />
        <circle cx="7" cy="79" r="2" fill="#78350f" />
        {/* Pupils */}
        <circle cx="-7" cy="79" r="1" fill="#1c1917" />
        <circle cx="7" cy="79" r="1" fill="#1c1917" />
        {/* Eye highlights */}
        <circle cx="-6" cy="78" r="0.5" fill="white" />
        <circle cx="8" cy="78" r="0.5" fill="white" />
        
        {/* Nose - subtle */}
        <path d="M0 80 L0 86 Q-2 88 0 88 Q2 88 0 88" stroke="#d4a88a" strokeWidth="1" fill="none" opacity="0.6" />
        
        {/* Slight smirk - totally casual */}
        <path d="M-5 91 Q0 94 5 91" stroke="#a78872" strokeWidth="1.5" fill="none" />
        {/* Lower lip hint */}
        <path d="M-3 93 Q0 94 3 93" stroke="#d4a88a" strokeWidth="1" fill="none" opacity="0.4" />
        
        {/* Light stubble */}
        <g fill="#a8a29e" opacity="0.2">
          <circle cx="-6" cy="94" r="0.3" />
          <circle cx="-3" cy="95" r="0.3" />
          <circle cx="0" cy="94" r="0.3" />
          <circle cx="3" cy="95" r="0.3" />
          <circle cx="6" cy="94" r="0.3" />
          <circle cx="-4" cy="96" r="0.3" />
          <circle cx="4" cy="96" r="0.3" />
        </g>
        
        {/* === HEADPHONES over hood === */}
        {/* Headband */}
        <path d="M-22 68 Q-28 45 0 38 Q28 45 22 68" stroke="#18181b" strokeWidth="5" fill="none" />
        <path d="M-22 68 Q-28 45 0 38 Q28 45 22 68" stroke="#27272a" strokeWidth="3" fill="none" />
        {/* Headband padding */}
        <path d="M-8 40 Q0 36 8 40" stroke="#3f3f46" strokeWidth="4" fill="none" />
        
        {/* Left ear cup */}
        <ellipse cx="-24" cy="72" rx="10" ry="13" fill="#18181b" />
        <ellipse cx="-24" cy="72" rx="8" ry="11" fill="#27272a" />
        <ellipse cx="-24" cy="72" rx="6" ry="8" fill="#3f3f46" />
        {/* Ear cushion */}
        <ellipse cx="-24" cy="72" rx="5" ry="7" fill="#1f1f1f" />
        
        {/* Right ear cup */}
        <ellipse cx="24" cy="72" rx="10" ry="13" fill="#18181b" />
        <ellipse cx="24" cy="72" rx="8" ry="11" fill="#27272a" />
        <ellipse cx="24" cy="72" rx="6" ry="8" fill="#3f3f46" />
        <ellipse cx="24" cy="72" rx="5" ry="7" fill="#1f1f1f" />
        
        {/* Headphone brand detail */}
        <circle cx="-24" cy="72" r="2" fill="#52525b" />
        <circle cx="24" cy="72" r="2" fill="#52525b" />
      </g>
      
      {/* Speech bubble */}
      <g>
        <path d="M215 32 L222 48 L230 32 Z" fill="white" />
        <rect x="195" y="8" width="78" height="26" rx="6" fill="white" />
        <rect x="195" y="8" width="78" height="26" rx="6" fill="none" stroke="#e2e8f0" strokeWidth="1" />
        <text x="234" y="25" textAnchor="middle" fontSize="11" fontWeight="600" fill="#374151">No big deal</text>
      </g>
      
      {/* Single tiny sweat drop */}
      <ellipse cx="145" cy="65" rx="2" ry="4" fill="#93c5fd" opacity="0.6" />
      
      {/* Caption */}
      <text x="170" y="225" textAnchor="middle" fontSize="13" fontWeight="600" fill="#6b7280">
        Getting stronger with every upload
      </text>
    </svg>
  );
}

/* UNIQUE: Idea slot machine - 50 ideas jackpot */
function IdeaSlotMachine() {
  return (
    <svg
      width="160"
      height="200"
      viewBox="0 0 160 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="slot-title slot-desc"
    >
      <title id="slot-title">Idea slot machine</title>
      <desc id="slot-desc">A slot machine displaying 50 as the winning number with video ideas on the reels</desc>
      
      {/* Machine body */}
      <rect x="15" y="30" width="130" height="150" rx="10" fill="#7c3aed" />
      <rect x="20" y="35" width="120" height="140" rx="8" fill="#6d28d9" />
      
      {/* Top decoration - "IDEAS" sign with lights */}
      <rect x="30" y="10" width="100" height="28" rx="6" fill="#fbbf24" />
      <rect x="35" y="14" width="90" height="20" rx="4" fill="#f59e0b" />
      <text x="80" y="30" textAnchor="middle" fontSize="14" fontWeight="900" fill="#1e293b">IDEAS</text>
      {/* Blinking lights */}
      <circle cx="25" cy="24" r="5" fill="#ef4444">
        <animate attributeName="opacity" values="1;0.3;1" dur="0.8s" repeatCount="indefinite" />
      </circle>
      <circle cx="135" cy="24" r="5" fill="#22c55e">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="0.8s" repeatCount="indefinite" />
      </circle>
      
      {/* Slot display window */}
      <rect x="30" y="50" width="100" height="60" rx="4" fill="#1e293b" />
      <rect x="35" y="55" width="90" height="50" rx="2" fill="#0f172a" />
      
      {/* Three reels showing 5-0-! */}
      <g>
        {/* Reel 1 */}
        <rect x="38" y="58" width="26" height="44" rx="2" fill="#f8fafc" />
        <text x="51" y="90" textAnchor="middle" fontSize="28" fontWeight="900" fill="#22c55e">5</text>
        
        {/* Reel 2 */}
        <rect x="67" y="58" width="26" height="44" rx="2" fill="#f8fafc" />
        <text x="80" y="90" textAnchor="middle" fontSize="28" fontWeight="900" fill="#22c55e">0</text>
        
        {/* Reel 3 - star */}
        <rect x="96" y="58" width="26" height="44" rx="2" fill="#f8fafc" />
        <polygon points="109,65 112,75 122,75 114,82 117,92 109,86 101,92 104,82 96,75 106,75" fill="#fbbf24" />
      </g>
      
      {/* WIN banner */}
      <rect x="45" y="115" width="70" height="20" rx="4" fill="#22c55e" />
      <text x="80" y="130" textAnchor="middle" fontSize="12" fontWeight="800" fill="white">JACKPOT!</text>
      
      {/* Lever */}
      <rect x="145" y="60" width="8" height="50" rx="4" fill="#dc2626" />
      <circle cx="149" cy="55" r="10" fill="#ef4444" stroke="#dc2626" strokeWidth="2" />
      
      {/* Coin slot */}
      <rect x="60" y="145" width="40" height="8" rx="2" fill="#1e293b" />
      <rect x="65" y="147" width="30" height="4" rx="1" fill="#475569" />
      
      {/* Coins spilling out */}
      <g>
        <circle cx="55" cy="175" r="8" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />
        <text x="55" y="179" textAnchor="middle" fontSize="8" fontWeight="700" fill="#92400e">$</text>
        
        <circle cx="75" cy="180" r="8" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />
        <text x="75" y="184" textAnchor="middle" fontSize="8" fontWeight="700" fill="#92400e">$</text>
        
        <circle cx="95" cy="178" r="8" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />
        <text x="95" y="182" textAnchor="middle" fontSize="8" fontWeight="700" fill="#92400e">$</text>
        
        <circle cx="115" cy="182" r="8" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />
        <text x="115" y="186" textAnchor="middle" fontSize="8" fontWeight="700" fill="#92400e">$</text>
      </g>
      
      {/* Sparkles */}
      <g fill="#fbbf24">
        <polygon points="25,50 27,55 32,55 28,58 30,63 25,60 20,63 22,58 18,55 23,55" />
        <polygon points="140,40 141,43 144,43 142,45 143,48 140,46 137,48 138,45 136,43 139,43" transform="scale(0.8)" />
      </g>
    </svg>
  );
}

/* Video structure diagram */
function VideoStructure() {
  return (
    <svg
      width="320"
      height="80"
      viewBox="0 0 320 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="structure-title"
    >
      <title id="structure-title">Simple video structure</title>
      
      {/* Timeline base */}
      <rect x="20" y="35" width="280" height="10" rx="5" fill="#e2e8f0" />
      
      {/* Hook section */}
      <rect x="20" y="30" width="50" height="20" rx="4" fill="#dc2626" />
      <text x="45" y="44" textAnchor="middle" fontSize="9" fontWeight="600" fill="white">HOOK</text>
      <text x="45" y="60" textAnchor="middle" fontSize="8" fill="#64748b">10 sec</text>
      
      {/* Main content */}
      <rect x="75" y="30" width="180" height="20" rx="4" fill="#6366f1" />
      <text x="165" y="44" textAnchor="middle" fontSize="9" fontWeight="600" fill="white">MAIN CONTENT</text>
      <text x="165" y="60" textAnchor="middle" fontSize="8" fill="#64748b">3-5 points</text>
      
      {/* CTA */}
      <rect x="260" y="30" width="40" height="20" rx="4" fill="#22c55e" />
      <text x="280" y="44" textAnchor="middle" fontSize="9" fontWeight="600" fill="white">CTA</text>
      <text x="280" y="60" textAnchor="middle" fontSize="8" fill="#64748b">Next</text>
    </svg>
  );
}

/* Recording setup - larger, clearer */
function RecordingSetup() {
  return (
    <svg
      width="180"
      height="140"
      viewBox="0 0 180 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="recording-title"
    >
      <title id="recording-title">Simple recording setup</title>
      
      {/* Window with light rays */}
      <rect x="20" y="20" width="60" height="80" rx="4" fill="#e0f2fe" stroke="#0ea5e9" strokeWidth="2" />
      <rect x="25" y="25" width="50" height="35" fill="#7dd3fc" />
      <rect x="25" y="65" width="50" height="30" fill="#bae6fd" />
      
      {/* Light rays */}
      <g stroke="#fbbf24" strokeWidth="2" opacity="0.7">
        <line x1="85" y1="30" x2="110" y2="45" />
        <line x1="85" y1="50" x2="115" y2="60" />
        <line x1="85" y1="70" x2="110" y2="75" />
      </g>
      
      {/* Phone on tripod */}
      <g>
        {/* Tripod legs */}
        <line x1="140" y1="130" x2="120" y2="130" stroke="#64748b" strokeWidth="3" />
        <line x1="130" y1="130" x2="130" y2="85" stroke="#64748b" strokeWidth="3" />
        <line x1="140" y1="130" x2="160" y2="130" stroke="#64748b" strokeWidth="3" />
        
        {/* Phone */}
        <rect x="115" y="40" width="30" height="50" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="2" />
        <rect x="118" y="45" width="24" height="35" rx="2" fill="#334155" />
        
        {/* Recording dot */}
        <circle cx="130" cy="60" r="6" fill="#dc2626">
          <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <text x="130" y="74" textAnchor="middle" fontSize="6" fill="#94a3b8">REC</text>
      </g>
      
      {/* Labels */}
      <text x="50" y="115" textAnchor="middle" fontSize="9" fill="#64748b">Window light</text>
      <text x="130" y="115" textAnchor="middle" fontSize="9" fill="#64748b">Phone + tripod</text>
    </svg>
  );
}

/* Editing timeline - clearer representation */
function EditingTimeline() {
  return (
    <svg
      width="320"
      height="100"
      viewBox="0 0 320 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="editing-title"
    >
      <title id="editing-title">Editing timeline showing what to cut</title>
      
      {/* Timeline track */}
      <rect x="20" y="40" width="280" height="30" rx="4" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1" />
      
      {/* Good content blocks */}
      <rect x="25" y="45" width="60" height="20" rx="3" fill="#22c55e" />
      <rect x="135" y="45" width="80" height="20" rx="3" fill="#22c55e" />
      <rect x="255" y="45" width="40" height="20" rx="3" fill="#22c55e" />
      
      {/* Bad content being cut - with X marks */}
      <g>
        <rect x="90" y="45" width="40" height="20" rx="3" fill="#fecaca" stroke="#f87171" strokeWidth="1" strokeDasharray="4" />
        <text x="110" y="58" textAnchor="middle" fontSize="8" fill="#dc2626">um...</text>
        <line x1="95" y1="50" x2="125" y2="60" stroke="#dc2626" strokeWidth="2" />
        <line x1="125" y1="50" x2="95" y2="60" stroke="#dc2626" strokeWidth="2" />
      </g>
      
      <g>
        <rect x="220" y="45" width="30" height="20" rx="3" fill="#fecaca" stroke="#f87171" strokeWidth="1" strokeDasharray="4" />
        <text x="235" y="58" textAnchor="middle" fontSize="8" fill="#dc2626">pause</text>
        <line x1="225" y1="50" x2="245" y2="60" stroke="#dc2626" strokeWidth="2" />
        <line x1="245" y1="50" x2="225" y2="60" stroke="#dc2626" strokeWidth="2" />
      </g>
      
      {/* Labels */}
      <text x="55" y="30" textAnchor="middle" fontSize="9" fontWeight="600" fill="#16a34a">Keep</text>
      <text x="110" y="30" textAnchor="middle" fontSize="9" fontWeight="600" fill="#dc2626">Cut</text>
      <text x="175" y="30" textAnchor="middle" fontSize="9" fontWeight="600" fill="#16a34a">Keep</text>
      <text x="235" y="30" textAnchor="middle" fontSize="9" fontWeight="600" fill="#dc2626">Cut</text>
      <text x="275" y="30" textAnchor="middle" fontSize="9" fontWeight="600" fill="#16a34a">Keep</text>
      
      {/* Playhead */}
      <rect x="160" y="35" width="2" height="40" fill="#6366f1" />
      <polygon points="161,35 155,28 167,28" fill="#6366f1" />
      
      {/* Result label */}
      <text x="160" y="90" textAnchor="middle" fontSize="11" fill="#64748b">
        Tighter video = better retention
      </text>
    </svg>
  );
}

/* Production cycle - simple and clear */
function ProductionCycle() {
  return (
    <svg
      width="320"
      height="120"
      viewBox="0 0 320 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="cycle-title"
    >
      <title id="cycle-title">Weekly production cycle</title>
      
      {/* Days of week */}
      {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
        <g key={i}>
          <rect
            x={25 + i * 40}
            y="30"
            width="32"
            height="50"
            rx="6"
            fill={i === 0 || i === 1 ? "#dbeafe" : i === 2 || i === 3 ? "#fef3c7" : i === 4 ? "#dcfce7" : "#f1f5f9"}
            stroke={i === 0 || i === 1 ? "#3b82f6" : i === 2 || i === 3 ? "#f59e0b" : i === 4 ? "#22c55e" : "#e2e8f0"}
            strokeWidth="2"
          />
          <text x={41 + i * 40} y="50" textAnchor="middle" fontSize="12" fontWeight="600" fill="#64748b">
            {day}
          </text>
          <text x={41 + i * 40} y="70" textAnchor="middle" fontSize="7" fill="#94a3b8">
            {i === 0 || i === 1 ? "Plan" : i === 2 || i === 3 ? "Record" : i === 4 ? "Edit" : "Rest"}
          </text>
        </g>
      ))}
      
      {/* Publish indicator on Friday */}
      <circle cx={41 + 4 * 40} cy="95" r="12" fill="#22c55e" />
      <path d="M235 92 L238 95 L245 88" stroke="white" strokeWidth="2" fill="none" />
      <text x="260" y="98" fontSize="9" fill="#64748b">Publish</text>
    </svg>
  );
}

/* Growth loop - clear diagram */
function GrowthLoopDiagram() {
  return (
    <svg
      width="300"
      height="200"
      viewBox="0 0 300 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="growth-title"
    >
      <title id="growth-title">The four pillars of YouTube growth</title>
      
      {/* Central hub */}
      <circle cx="150" cy="100" r="35" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
      <text x="150" y="96" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b">GROWTH</text>
      <text x="150" y="110" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b">LOOP</text>
      
      {/* Four pillars */}
      <g>
        {/* Topic - top */}
        <rect x="110" y="10" width="80" height="32" rx="6" fill="#6366f1" />
        <text x="150" y="31" textAnchor="middle" fontSize="12" fontWeight="600" fill="white">Topic</text>
        <line x1="150" y1="42" x2="150" y2="65" stroke="#6366f1" strokeWidth="2" />
        <polygon points="150,65 145,58 155,58" fill="#6366f1" />
      </g>
      
      <g>
        {/* Packaging - right */}
        <rect x="210" y="84" width="80" height="32" rx="6" fill="#f59e0b" />
        <text x="250" y="105" textAnchor="middle" fontSize="12" fontWeight="600" fill="white">Packaging</text>
        <line x1="210" y1="100" x2="185" y2="100" stroke="#f59e0b" strokeWidth="2" />
        <polygon points="185,100 192,95 192,105" fill="#f59e0b" />
      </g>
      
      <g>
        {/* Retention - bottom */}
        <rect x="110" y="158" width="80" height="32" rx="6" fill="#22c55e" />
        <text x="150" y="179" textAnchor="middle" fontSize="12" fontWeight="600" fill="white">Retention</text>
        <line x1="150" y1="158" x2="150" y2="135" stroke="#22c55e" strokeWidth="2" />
        <polygon points="150,135 145,142 155,142" fill="#22c55e" />
      </g>
      
      <g>
        {/* Next Video - left */}
        <rect x="10" y="84" width="80" height="32" rx="6" fill="#ec4899" />
        <text x="50" y="105" textAnchor="middle" fontSize="12" fontWeight="600" fill="white">Next Video</text>
        <line x1="90" y1="100" x2="115" y2="100" stroke="#ec4899" strokeWidth="2" />
        <polygon points="115,100 108,95 108,105" fill="#ec4899" />
      </g>
    </svg>
  );
}

/* Realistic speed bumps on creator journey */
function ObstacleRoad() {
  return (
    <svg
      width="360"
      height="160"
      viewBox="0 0 360 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="obstacle-title"
    >
      <title id="obstacle-title">Common obstacles on the creator journey</title>
      
      {/* Sky/background gradient */}
      <rect x="0" y="0" width="360" height="80" fill="#f0f9ff" />
      
      {/* Road with asphalt texture */}
      <rect x="0" y="80" width="360" height="50" fill="#374151" />
      <rect x="0" y="80" width="360" height="50" fill="#1f2937" opacity="0.3" />
      
      {/* Road shoulder */}
      <rect x="0" y="130" width="360" height="8" fill="#9ca3af" />
      <rect x="0" y="72" width="360" height="8" fill="#9ca3af" />
      
      {/* Center line dashes - yellow road markings */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <rect key={i} x={15 + i * 45} y="102" width="30" height="6" rx="1" fill="#fbbf24" />
      ))}
      
      {/* SPEED BUMP 1 - Realistic 3D bump */}
      <g>
        {/* Bump shadow */}
        <ellipse cx="75" cy="108" rx="35" ry="6" fill="#1f2937" opacity="0.4" />
        {/* Bump base */}
        <path d="M40 105 Q75 75 110 105" fill="#fbbf24" />
        {/* Bump highlight for 3D effect */}
        <path d="M45 103 Q75 78 105 103" fill="#fcd34d" />
        {/* Bump top stripe */}
        <path d="M50 100 Q75 82 100 100" fill="#f59e0b" />
        {/* White warning stripes */}
        <g fill="white" opacity="0.9">
          <rect x="52" y="88" width="4" height="12" rx="1" transform="rotate(-15, 54, 94)" />
          <rect x="64" y="85" width="4" height="14" rx="1" transform="rotate(-5, 66, 92)" />
          <rect x="76" y="84" width="4" height="14" rx="1" />
          <rect x="88" y="85" width="4" height="14" rx="1" transform="rotate(5, 90, 92)" />
          <rect x="98" y="88" width="4" height="12" rx="1" transform="rotate(15, 100, 94)" />
        </g>
        {/* Label */}
        <rect x="50" y="42" width="50" height="22" rx="4" fill="#1e293b" />
        <text x="75" y="57" textAnchor="middle" fontSize="10" fontWeight="600" fill="white">SLOW</text>
        <text x="75" y="37" textAnchor="middle" fontSize="9" fontWeight="500" fill="#64748b">Month 1-3</text>
      </g>
      
      {/* SPEED BUMP 2 - Realistic 3D bump */}
      <g>
        {/* Bump shadow */}
        <ellipse cx="180" cy="108" rx="35" ry="6" fill="#1f2937" opacity="0.4" />
        {/* Bump base */}
        <path d="M145 105 Q180 75 215 105" fill="#fbbf24" />
        {/* Bump highlight */}
        <path d="M150 103 Q180 78 210 103" fill="#fcd34d" />
        {/* Bump top stripe */}
        <path d="M155 100 Q180 82 205 100" fill="#f59e0b" />
        {/* White warning stripes */}
        <g fill="white" opacity="0.9">
          <rect x="157" y="88" width="4" height="12" rx="1" transform="rotate(-15, 159, 94)" />
          <rect x="169" y="85" width="4" height="14" rx="1" transform="rotate(-5, 171, 92)" />
          <rect x="181" y="84" width="4" height="14" rx="1" />
          <rect x="193" y="85" width="4" height="14" rx="1" transform="rotate(5, 195, 92)" />
          <rect x="203" y="88" width="4" height="12" rx="1" transform="rotate(15, 205, 94)" />
        </g>
        {/* Label */}
        <rect x="155" y="42" width="50" height="22" rx="4" fill="#1e293b" />
        <text x="180" y="57" textAnchor="middle" fontSize="10" fontWeight="600" fill="white">DIP</text>
        <text x="180" y="37" textAnchor="middle" fontSize="9" fontWeight="500" fill="#64748b">Month 4-6</text>
      </g>
      
      {/* SPEED BUMP 3 - Realistic 3D bump */}
      <g>
        {/* Bump shadow */}
        <ellipse cx="285" cy="108" rx="35" ry="6" fill="#1f2937" opacity="0.4" />
        {/* Bump base */}
        <path d="M250 105 Q285 75 320 105" fill="#fbbf24" />
        {/* Bump highlight */}
        <path d="M255 103 Q285 78 315 103" fill="#fcd34d" />
        {/* Bump top stripe */}
        <path d="M260 100 Q285 82 310 100" fill="#f59e0b" />
        {/* White warning stripes */}
        <g fill="white" opacity="0.9">
          <rect x="262" y="88" width="4" height="12" rx="1" transform="rotate(-15, 264, 94)" />
          <rect x="274" y="85" width="4" height="14" rx="1" transform="rotate(-5, 276, 92)" />
          <rect x="286" y="84" width="4" height="14" rx="1" />
          <rect x="298" y="85" width="4" height="14" rx="1" transform="rotate(5, 300, 92)" />
          <rect x="308" y="88" width="4" height="12" rx="1" transform="rotate(15, 310, 94)" />
        </g>
        {/* Label */}
        <rect x="255" y="42" width="60" height="22" rx="4" fill="#1e293b" />
        <text x="285" y="57" textAnchor="middle" fontSize="10" fontWeight="600" fill="white">TECHNICAL</text>
        <text x="285" y="37" textAnchor="middle" fontSize="9" fontWeight="500" fill="#64748b">Ongoing</text>
      </g>
      
      {/* Green success path arrow */}
      <path
        d="M10 105 C30 105 50 90 75 90 C100 90 120 105 145 105 C160 105 165 90 180 90 C195 90 210 105 240 105 C260 105 270 90 285 90 C300 90 330 105 350 105"
        stroke="#22c55e"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="8 4"
      />
      
      {/* Finish flag at end */}
      <g transform="translate(340, 75)">
        <rect x="0" y="0" width="3" height="35" fill="#475569" />
        <rect x="3" y="0" width="15" height="12" fill="white" />
        <rect x="3" y="0" width="5" height="4" fill="#1e293b" />
        <rect x="13" y="0" width="5" height="4" fill="#1e293b" />
        <rect x="8" y="4" width="5" height="4" fill="#1e293b" />
        <rect x="3" y="8" width="5" height="4" fill="#1e293b" />
        <rect x="13" y="8" width="5" height="4" fill="#1e293b" />
      </g>
      
      {/* Caption */}
      <text x="180" y="152" textAnchor="middle" fontSize="11" fontWeight="500" fill="#64748b">
        Every bump makes you a better driver
      </text>
    </svg>
  );
}

/* Money milestone - simpler visual */
function MoneyMilestone() {
  return (
    <svg
      width="120"
      height="140"
      viewBox="0 0 120 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="money-title"
    >
      <title id="money-title">Monetization comes after building an audience</title>
      
      {/* Progress bar background */}
      <rect x="30" y="20" width="24" height="100" rx="12" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2" />
      
      {/* Progress fill */}
      <rect x="34" y="70" width="16" height="46" rx="8" fill="linear-gradient(180deg, #22c55e 0%, #16a34a 100%)" />
      <rect x="34" y="70" width="16" height="46" rx="8" fill="#22c55e" />
      
      {/* Milestone markers */}
      <line x1="56" y1="30" x2="70" y2="30" stroke="#94a3b8" strokeWidth="2" />
      <text x="75" y="34" fontSize="9" fill="#64748b">YPP</text>
      
      <line x1="56" y1="60" x2="70" y2="60" stroke="#94a3b8" strokeWidth="2" />
      <text x="75" y="64" fontSize="9" fill="#16a34a">You are here</text>
      
      <line x1="56" y1="110" x2="70" y2="110" stroke="#94a3b8" strokeWidth="2" />
      <text x="75" y="114" fontSize="9" fill="#64748b">Start</text>
      
      {/* Dollar at top */}
      <circle cx="42" cy="30" r="10" fill="#f1f5f9" stroke="#22c55e" strokeWidth="2" />
      <text x="42" y="34" textAnchor="middle" fontSize="10" fontWeight="700" fill="#22c55e">$</text>
    </svg>
  );
}

/* Next step visual - clear action prompt */
function NextStepVisual() {
  return (
    <svg
      width="200"
      height="60"
      viewBox="0 0 200 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="next-title"
    >
      <title id="next-title">Your next step starts now</title>
      
      {/* Pencil */}
      <g transform="translate(30, 10)">
        <rect x="0" y="15" width="80" height="14" rx="2" fill="#fbbf24" />
        <polygon points="80,15 80,29 95,22" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1" />
        <rect x="0" y="15" width="15" height="14" rx="2" fill="#fca5a5" />
        <circle cx="95" cy="22" r="2" fill="#1e293b" />
      </g>
      
      {/* Arrow pointing right */}
      <g transform="translate(140, 20)">
        <circle cx="20" cy="10" r="18" fill="rgba(255,255,255,0.2)" />
        <path d="M12 10 L28 10 M22 4 L28 10 L22 16" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/*
 * ================================================
 * CHECKLIST:
 * - [x] IDs preserved
 * - [x] 4pt spacing grid used
 * - [x] Required links included
 * - [x] SVG accessibility (titles, descriptions)
 * - [x] No emojis
 * - [x] Mobile-first (stacking grids)
 * ================================================
 */
