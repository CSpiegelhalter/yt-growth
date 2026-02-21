/**
 * Body content for How to Go Live on YouTube article.
 * Server component - no "use client" directive.
 *
 * IMPLEMENTATION PLAN:
 * - Replace list-heavy structure with visual "stations"
 * - Add 12 brand-new inline SVG visuals (live flywheel, gatekeeper, control panels,
 *   tap-map, phone tripod, scene stack, speedometer, segment timer, feature cards,
 *   mistake visuals, diagnostic duck)
 * - Reduce UL/OL by ~80% using cards, grids, rows, and breadcrumbs
 * - Keep all required section IDs for navigation/SEO
 * - Include internal links to competitor-analysis and get-more-subscribers
 * - Mobile-first stacking, accessible SVGs with <title>/<desc> or aria-hidden
 */

import Link from "next/link";
import { LEARN_ARTICLES } from "../../articles";
import type { BodyProps } from "./_shared";
import { articleExports } from "./_shared";

export const { meta, toc } = articleExports(LEARN_ARTICLES["how-to-go-live-on-youtube"]);

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* ===== OVERVIEW ===== */}
      <section id="overview" className="sectionOpen">
        <p className={s.sectionText} style={{ fontSize: "1.125rem" }}>
          Live streaming on YouTube is not a substitute for uploads. It is a
          different format with different strengths: real-time interaction,
          unedited authenticity, and a reason for viewers to show up at a
          specific time.
        </p>

        <p className={s.sectionText}>
          When the stream ends, the replay becomes a regular video. One effort,
          two content pieces. But the live version only works if people are
          actually there.
        </p>

        {/* Live vs Replay visual */}
        <div className="inlineIllustration">
          <LiveVsReplayVisual />
        </div>

        <p className={s.sectionText}>
          This guide covers three ways to go live (webcam, software, mobile),
          the gear and settings that actually matter, and how to turn live
          viewers into returning subscribers.
        </p>

        {/* The Live Stream Life Cycle - Hamster Wheel */}
        <div className="funCallout">
          <p className="funCallout__text" style={{ marginBottom: "16px" }}>
            <strong>The Streamer&apos;s Treadmill</strong>
          </p>
          <div className="inlineIllustration" style={{ padding: "0" }}>
            <StreamerTreadmillVisual />
          </div>
        </div>
      </section>

      {/* ===== REQUIREMENTS ===== */}
      <section id="requirements" className="sectionTinted">
        <h2 className={s.sectionTitle}>Requirements to Go Live</h2>
        <p className={s.sectionText}>
          YouTube has account gates and technical minimums. Clear these first,
          then focus on what actually affects stream quality.
        </p>

        {/* Gatekeeper visual */}
        <div className="inlineIllustration">
          <GatekeeperVisual />
        </div>

        {/* Two card grids */}
        <CardGrid>
          <Card title="Account Gates">
            <Rows>
              <Row label="Phone verification" desc="Free, takes 2 minutes" />
              <Row label="No active strikes" desc="Even one disables streaming" />
              <Row label="24-hour wait" desc="First-time streamers only" />
              <Row label="50 subs for mobile" desc="Desktop has no minimum" />
            </Rows>
          </Card>
          <Card title="Setup That Matters">
            <Rows>
              <Row label="Audio clarity" desc="More important than video quality" />
              <Row label="Stable upload" desc="3+ Mbps for 720p, 10+ for 1080p" />
              <Row label="Basic lighting" desc="Face a window or use a ring light" />
            </Rows>
          </Card>
        </CardGrid>

        <div className="realTalk">
          <p className="realTalk__label">Enable streaming now</p>
          <p className="realTalk__text">
            Even if you are not ready to go live, enable it in YouTube Studio.
            The 24-hour wait runs in the background, so it will be ready when
            you are.
          </p>
        </div>
      </section>

      {/* ===== DESKTOP STREAMING ===== */}
      <section id="desktop-streaming" className="sectionOpen">
        <h2 className={s.sectionTitle}>Go Live from Desktop</h2>
        <p className={s.sectionText}>
          Desktop gives you two paths: webcam (fast) or streaming software
          (control). Pick based on what you need.
        </p>

        {/* Control panels visual */}
        <div className="inlineIllustration">
          <ControlPanelsVisual />
        </div>

        <CardGrid>
          {/* Webcam lane */}
          <Card title="Webcam (Fast Start)">
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "16px" }}>
              No extra software. Best for Q&amp;A, talking head, casual streams.
            </p>
            <Breadcrumb items={["YouTube Studio", "Create", "Go live", "Webcam"]} />
            <Rows style={{ marginTop: "16px" }}>
              <Row label="Title" desc="Tell viewers what the stream is about" />
              <Row label="Thumbnail" desc="Upload or capture at start" />
              <Row label="Privacy" desc="Public for maximum reach" />
              <Row label="Go live" desc="Click when ready" />
            </Rows>
          </Card>

          {/* Software lane */}
          <Card title="Streaming Software (Control)">
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "16px" }}>
              Use OBS or similar. Best for screen share, overlays, multi-cam.
            </p>
            <Breadcrumb items={["YouTube Studio", "Create", "Go live", "Streaming software"]} />
            <Rows style={{ marginTop: "16px" }}>
              <Row label="Stream key" desc="Copy from YouTube, paste into software" />
              <Row label="Scenes" desc="Set up camera, screen, overlays" />
              <Row label="Start stream" desc="Press Go Live in software, not YouTube" />
            </Rows>
          </Card>
        </CardGrid>
      </section>

      {/* ===== MOBILE STREAMING ===== */}
      <section id="mobile-streaming" className="sectionOpen">
        <h2 className={s.sectionTitle}>Go Live from Mobile</h2>
        <p className={s.sectionText}>
          Mobile streaming is portable but has fewer features. Good for events,
          behind-the-scenes, and on-the-go content.
        </p>

        {/* Mobile gate card */}
        <Card title="Mobile Gate" style={{ marginBottom: "24px" }}>
          <Rows>
            <Row label="50+ subscribers" desc="Required for mobile streaming" />
            <Row label="Updated app" desc="Latest YouTube app version" />
            <Row label="Good connection" desc="Strong WiFi or LTE signal" />
          </Rows>
        </Card>

        {/* Phone screen showing the go-live flow */}
        <div className="inlineIllustration">
          <MobileGoLiveVisual />
        </div>

        {/* Phone on tripod visual */}
        <div className="floatRight">
          <PhoneTripodVisual />
        </div>

        <p className={s.sectionText}>
          Mobile streams use your phone camera and mic by default. For better
          audio, connect an external mic via the headphone jack or USB-C. Use a
          tripod or stable surface to avoid shaky footage.
        </p>

        <div className="comparisonGrid" style={{ marginTop: "24px" }}>
          <div className="comparisonItem comparisonItem--neutral">
            <p className="comparisonItem__label">Use Mobile For</p>
            <p className="comparisonItem__content">
              Events, travel, behind-the-scenes, casual Q&amp;A
            </p>
          </div>
          <div className="comparisonItem comparisonItem--neutral">
            <p className="comparisonItem__label">Use Desktop For</p>
            <p className="comparisonItem__content">
              Gaming, tutorials, screen share, multi-cam setups
            </p>
          </div>
        </div>
      </section>

      {/* ===== STREAMING SOFTWARE ===== */}
      <section id="streaming-software" className="sectionTinted">
        <h2 className={s.sectionTitle}>Choosing Streaming Software</h2>
        <p className={s.sectionText}>
          OBS Studio is the standard baseline: free, cross-platform, and
          well-documented. Other tools exist (Streamlabs, XSplit, Ecamm) but
          solve similar problems with different interfaces.
        </p>

        <p className={s.sectionText}>
          Instead of comparing features, decide based on what you need to do.
        </p>

        {/* Scene stack visual */}
        <div className="inlineIllustration">
          <SceneStackVisual />
        </div>

        {/* Feature selector card */}
        <Card title="What Do You Need?">
          <Rows>
            <Row
              label="Just camera + mic"
              desc="Webcam stream in YouTube works fine"
            />
            <Row
              label="Screen share"
              desc="Use OBS with window capture"
            />
            <Row
              label="Overlays + alerts"
              desc="Streamlabs has built-in themes"
            />
            <Row
              label="Multi-cam or guests"
              desc="OBS scenes or Ecamm for Mac"
            />
            <Row
              label="Polished look, less config"
              desc="XSplit or Ecamm (paid)"
            />
          </Rows>
        </Card>

        <div className="realTalk">
          <p className="realTalk__label">Start simple</p>
          <p className="realTalk__text">
            Install OBS, add a camera source and mic, and stream. You can add
            scenes and overlays later. Complex setups are not required to
            start.
          </p>
        </div>
      </section>

      {/* ===== STREAM SETTINGS ===== */}
      <section id="stream-settings" className="sectionOpen">
        <h2 className={s.sectionTitle}>Stream Settings</h2>
        <p className={s.sectionText}>
          Your settings depend on your upload speed and what you are streaming.
          A stable lower-quality stream is better than a stuttering
          high-resolution one.
        </p>

        {/* Speedometer visual */}
        <div className="inlineIllustration">
          <SpeedometerVisual />
        </div>

        {/* Settings table card */}
        <div className="settingsTable">
          <div className="settingsTable__header">
            <span>Resolution</span>
            <span>Bitrate Range</span>
            <span>Upload Comfort Zone</span>
          </div>
          <div className="settingsTable__row">
            <span className="settingsTable__res">720p 30fps</span>
            <span>2,500 - 4,000 kbps</span>
            <span>5+ Mbps upload</span>
          </div>
          <div className="settingsTable__row">
            <span className="settingsTable__res">1080p 30fps</span>
            <span>4,500 - 6,000 kbps</span>
            <span>10+ Mbps upload</span>
          </div>
          <div className="settingsTable__row">
            <span className="settingsTable__res">1080p 60fps</span>
            <span>4,500 - 9,000 kbps</span>
            <span>15+ Mbps upload</span>
          </div>
        </div>

        <p className={s.sectionText} style={{ marginTop: "24px" }}>
          <strong>Audio settings:</strong> Use 44.1 or 48 kHz sample rate with
          128-320 kbps audio bitrate. Test levels before going live. Your voice
          should peak around -6 to -12 dB without clipping.
        </p>

        <p className={s.sectionText}>
          <strong>Wired beats wireless.</strong> Ethernet is more stable than
          WiFi. If you have to use WiFi, be close to the router and{" "}
          <a
            href="https://www.speedtest.net/"
            target="_blank"
            rel="noopener noreferrer"
          >
            test your upload speed
          </a>{" "}
          before important streams.
        </p>
      </section>

      {/* ===== GROWING LIVE AUDIENCE ===== */}
      <section id="growing-live-audience" className="sectionTinted">
        <h2 className={s.sectionTitle}>Growing Your Live Audience</h2>
        <p className={s.sectionText}>
          Live viewers need a reason to show up at a specific time. The format
          rewards preparation, structure, and consistent scheduling.
        </p>

        {/* 3-panel storyboard */}
        <div className="storyboardPanels">
          <StoryboardPanel
            phase="Before"
            icon={<CalendarIcon />}
            items={[
              "Schedule stream with countdown page",
              "Announce on community tab + socials",
              "Give 24+ hours notice",
            ]}
          />
          <StoryboardPanel
            phase="During"
            icon={<MicIcon />}
            items={[
              "Greet viewers by name",
              "Use segments (open, core, Q&A, close)",
              "Acknowledge chat throughout",
            ]}
          />
          <StoryboardPanel
            phase="After"
            icon={<ClipIcon />}
            items={[
              "Retitle and thumbnail for replay",
              "Pull clips for Shorts and socials",
              "Announce next stream date",
            ]}
          />
        </div>

        {/* Segment timer visual */}
        <div className="inlineIllustration">
          <SegmentTimerVisual />
        </div>

        <p className={s.sectionText}>
          Structure matters because people join mid-stream. Recurring segments
          give latecomers an entry point and help you maintain energy over long
          broadcasts.
        </p>

        <div className="funCallout">
          <p className="funCallout__text">
            <strong>Turn live viewers into returning viewers.</strong> See our{" "}
            <Link href="/learn/how-to-get-more-subscribers">
              guide to earning subscribers
            </Link>{" "}
            for strategies that apply to both live and recorded content. If you
            want to understand how your niche structures streams,{" "}
            <Link href="/learn/youtube-competitor-analysis">
              study competitors who do live regularly
            </Link>.
          </p>
        </div>
      </section>

      {/* ===== MONETIZATION ===== */}
      <section id="monetization" className="sectionOpen">
        <h2 className={s.sectionTitle}>Live Stream Monetization</h2>
        <p className={s.sectionText}>
          Monetization is a side-effect of trust and consistency. Viewers
          support creators they feel connected to. Features like Super Chat
          work best when the audience already cares.
        </p>

        <div className="featureCardsGrid">
          <FeatureCard
            title="Super Chat"
            desc="Viewers pay to highlight messages. Read them on stream."
          />
          <FeatureCard
            title="Memberships"
            desc="Monthly support for badges, emotes, and perks."
          />
          <FeatureCard
            title="Mid-roll Ads"
            desc="You control when ads run during longer streams."
          />
          <FeatureCard
            title="Super Thanks"
            desc="One-time tips available on live and regular videos."
          />
        </div>

        <p className={s.sectionText} style={{ marginTop: "24px" }}>
          All live monetization features require YouTube Partner Program
          membership. See our{" "}
          <Link href="/learn/youtube-monetization-requirements">
            monetization requirements guide
          </Link>{" "}
          for thresholds and eligibility.
        </p>
      </section>

      {/* ===== MISTAKES ===== */}
      <section id="mistakes" className="sectionTinted">
        <h2 className={s.sectionTitle}>Common Mistakes</h2>
        <p className={s.sectionText}>
          Most stream failures come from the same few problems. Recognize them
          before they happen.
        </p>

        <div className="mistakeGrid">
          <MistakeCard
            icon={<EchoCaveIcon />}
            mistake="Bad audio"
            symptom="Echo, background noise, quiet voice"
            fix="Use external mic, test before going live"
          />
          <MistakeCard
            icon={<WifiGremlinIcon />}
            mistake="Unstable connection"
            symptom="Buffering, dropped frames, disconnects"
            fix="Use ethernet, lower bitrate if needed"
          />
          <MistakeCard
            icon={<TumbleweedIcon />}
            mistake="Dead air"
            symptom="Long silences, no chat interaction"
            fix="Prepare talking points, use segments"
          />
          <MistakeCard
            icon={<GhostIcon />}
            mistake="No promotion"
            symptom="Zero viewers at start"
            fix="Announce 24+ hours ahead, schedule stream"
          />
        </div>
      </section>

      {/* ===== TROUBLESHOOTING ===== */}
      <section id="troubleshooting" className="sectionOpen">
        <h2 className={s.sectionTitle}>Troubleshooting</h2>
        <p className={s.sectionText}>
          Technical issues happen. Here is how to diagnose and fix the most
          common problems.
        </p>

        {/* IT duck visual - centered with even spacing */}
        <div style={{ display: "flex", justifyContent: "center", margin: "32px 0" }}>
          <SupportDuckVisual />
        </div>

        <div className="diagnosticCards">
          <DiagnosticCard
            symptom="Laggy / buffering"
            tries={[
              "Lower bitrate in streaming software",
              "Drop resolution from 1080p to 720p",
              "Close bandwidth-heavy apps",
              "Switch to wired ethernet",
            ]}
          />
          <DiagnosticCard
            symptom="No audio"
            tries={[
              "Check mic selected in software settings",
              "Verify mic not muted at system level",
              "Unplug and replug USB mic",
              "Test in another app to isolate issue",
            ]}
          />
          <DiagnosticCard
            symptom="Black video"
            tries={[
              "Check camera permissions in system settings",
              "Close other apps using camera",
              "Try different USB port",
              "Update camera drivers",
            ]}
          />
          <DiagnosticCard
            symptom="Disconnected"
            tries={[
              "Check internet connection",
              "YouTube allows resuming after brief drops",
              "Keep phone hotspot as backup",
              "Post update on community tab if offline",
            ]}
          />
        </div>
      </section>

      {/* ===== CTA ===== */}
      <div className={s.highlight}>
        <p>
          <strong>Start simple.</strong> A webcam stream with good audio is
          better than a complex setup you cannot troubleshoot. Pick a time,
          announce it, show up. Consistency matters more than production value.
        </p>
      </div>
    </>
  );
}

/* ================================================
   INLINE SVG VISUALS (12 unique to this page)
   ================================================ */

/** Live = Broadway stage, Replay = Tupperware in fridge - WIDE version */
function LiveVsReplayVisual() {
  return (
    <svg
      width="440"
      height="180"
      viewBox="0 0 440 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      style={{ maxWidth: "100%", height: "auto" }}
    >
      <title>Live streaming versus replay comparison</title>
      <desc>
        Live shown as a Broadway stage with curtains and spotlights,
        replay as Tupperware in a refrigerator
      </desc>

      {/* === LIVE SIDE - Broadway Stage === */}
      <g transform="translate(0, 10)">
        {/* Stage frame - black background */}
        <rect x="10" y="0" width="150" height="130" rx="4" fill="#1e293b" />
        
        {/* Curtain rod - golden */}
        <rect x="10" y="0" width="150" height="10" rx="2" fill="#7f1d1d" />
        <circle cx="20" cy="5" r="5" fill="#fbbf24" />
        <circle cx="150" cy="5" r="5" fill="#fbbf24" />
        
        {/* Left curtain - draped red velvet */}
        <path d="M10 10 L10 130 Q30 125 30 105 Q10 85 30 65 Q10 45 30 25 L30 10 Z" fill="#dc2626" />
        <path d="M30 10 L30 130 Q45 125 45 110 Q30 92 45 74 Q30 56 45 38 L45 10 Z" fill="#b91c1c" />
        
        {/* Right curtain */}
        <path d="M160 10 L160 130 Q140 125 140 105 Q160 85 140 65 Q160 45 140 25 L140 10 Z" fill="#dc2626" />
        <path d="M140 10 L140 130 Q125 125 125 110 Q140 92 125 74 Q140 56 125 38 L125 10 Z" fill="#b91c1c" />
        
        {/* Stage floor - wood planks */}
        <rect x="45" y="100" width="80" height="25" rx="2" fill="#78350f" />
        <line x1="45" y1="108" x2="125" y2="108" stroke="#92400e" strokeWidth="1" />
        <line x1="45" y1="116" x2="125" y2="116" stroke="#92400e" strokeWidth="1" />
        
        {/* Spotlights with light cones */}
        <ellipse cx="60" cy="22" rx="10" ry="6" fill="#fbbf24" />
        <ellipse cx="110" cy="22" rx="10" ry="6" fill="#fbbf24" />
        <path d="M60 28 L40 70 L80 70 Z" fill="#fef3c7" opacity="0.3" />
        <path d="M110 28 L90 70 L130 70 Z" fill="#fef3c7" opacity="0.3" />
        
        {/* Performer on stage - excited */}
        <circle cx="85" cy="60" r="14" fill="#fde68a" />
        <ellipse cx="81" cy="57" rx="2" ry="2" fill="#1e293b" />
        <ellipse cx="89" cy="57" rx="2" ry="2" fill="#1e293b" />
        <path d="M81 65 Q85 69 89 65" stroke="#1e293b" strokeWidth="1.5" fill="none" />
        <rect x="77" y="74" width="16" height="22" rx="3" fill="#6366f1" />
        
        {/* Arms up celebrating */}
        <path d="M77 80 L62 65" stroke="#fde68a" strokeWidth="5" strokeLinecap="round" />
        <path d="M93 80 L108 65" stroke="#fde68a" strokeWidth="5" strokeLinecap="round" />
        
        {/* LIVE badge pulsing */}
        <rect x="52" y="108" width="66" height="18" rx="4" fill="#dc2626" />
        <text x="85" y="120" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">
          LIVE
        </text>
      </g>
      
      {/* Label for LIVE */}
      <text x="85" y="165" textAnchor="middle" fontSize="12" fontWeight="600" fill="#dc2626">
        LIVE
      </text>
      <text x="85" y="177" textAnchor="middle" fontSize="9" fill="#64748b">
        (the main event)
      </text>

      {/* === CENTER - Arrow transition === */}
      <g transform="translate(185, 60)">
        <text x="30" y="20" textAnchor="middle" fontSize="10" fill="#94a3b8">
          stream
        </text>
        <text x="30" y="32" textAnchor="middle" fontSize="10" fill="#94a3b8">
          ends
        </text>
        <path d="M30 40 L30 60" stroke="#94a3b8" strokeWidth="2" />
        <path d="M25 55 L30 60 L35 55" stroke="#94a3b8" strokeWidth="2" fill="none" />
        <text x="30" y="75" textAnchor="middle" fontSize="10" fill="#94a3b8">
          becomes
        </text>
      </g>

      {/* === REPLAY SIDE - Fridge with Tupperware === */}
      <g transform="translate(260, 10)">
        {/* Fridge body */}
        <rect x="10" y="0" width="160" height="130" rx="6" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2" />
        
        {/* Freezer section */}
        <rect x="15" y="5" width="150" height="28" rx="3" fill="#f1f5f9" />
        <line x1="15" y1="33" x2="165" y2="33" stroke="#cbd5e1" strokeWidth="2" />
        
        {/* Fridge shelves */}
        <line x1="20" y1="60" x2="155" y2="60" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="20" y1="95" x2="155" y2="95" stroke="#cbd5e1" strokeWidth="1" />
        
        {/* Handle */}
        <rect x="158" y="50" width="6" height="35" rx="3" fill="#94a3b8" />
        
        {/* Tupperware container with video - CENTERED */}
        <rect x="45" y="65" width="90" height="50" rx="4" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="2" />
        <rect x="45" y="65" width="90" height="10" rx="2" fill="#3b82f6" />
        
        {/* Video thumbnail inside container - centered in tupperware */}
        <rect x="55" y="80" width="50" height="30" rx="2" fill="#1e293b" />
        <path d="M75 90 L85 96 L75 102 Z" fill="white" />
        
        {/* Date sticker on container */}
        <rect x="110" y="85" width="20" height="20" rx="2" fill="white" stroke="#e2e8f0" />
        <text x="120" y="93" textAnchor="middle" fontSize="6" fill="#64748b">
          JAN
        </text>
        <text x="120" y="101" textAnchor="middle" fontSize="8" fontWeight="700" fill="#1e293b">
          21
        </text>
        
        {/* Other items in fridge */}
        <rect x="130" y="40" width="18" height="30" rx="2" fill="#fde68a" />
        <rect x="22" y="40" width="14" height="18" rx="2" fill="#bbf7d0" />
        <rect x="40" y="42" width="10" height="15" rx="2" fill="#fecaca" />
      </g>
      
      {/* Label for REPLAY */}
      <text x="350" y="165" textAnchor="middle" fontSize="12" fontWeight="600" fill="#64748b">
        REPLAY
      </text>
      <text x="350" y="177" textAnchor="middle" fontSize="9" fill="#94a3b8">
        (still good)
      </text>
    </svg>
  );
}

/** Streamer on actual gym treadmill - proper treadmill design */
function StreamerTreadmillVisual() {
  return (
    <svg
      width="360"
      height="240"
      viewBox="0 0 360 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      style={{ maxWidth: "100%", height: "auto" }}
    >
      <title>The streamer treadmill showing the live streaming cycle</title>
      <desc>
        A person running on a gym treadmill with streaming milestones
      </desc>

      {/* === ACTUAL TREADMILL === */}
      
      {/* Treadmill main body/motor housing */}
      <rect x="60" y="155" width="240" height="35" rx="8" fill="#1e293b" />
      <rect x="70" y="160" width="220" height="25" rx="4" fill="#0f172a" />
      
      {/* Treadmill belt platform - angled slightly */}
      <path d="M80 155 L80 130 L280 120 L280 155 Z" fill="#374151" />
      
      {/* Belt surface with grooves */}
      <rect x="85" y="123" width="190" height="30" rx="2" fill="#1e293b" />
      {/* Belt texture lines */}
      <line x1="100" y1="125" x2="100" y2="151" stroke="#0f172a" strokeWidth="1" />
      <line x1="120" y1="124" x2="120" y2="150" stroke="#0f172a" strokeWidth="1" />
      <line x1="140" y1="123" x2="140" y2="149" stroke="#0f172a" strokeWidth="1" />
      <line x1="160" y1="122" x2="160" y2="148" stroke="#0f172a" strokeWidth="1" />
      <line x1="180" y1="122" x2="180" y2="148" stroke="#0f172a" strokeWidth="1" />
      <line x1="200" y1="121" x2="200" y2="147" stroke="#0f172a" strokeWidth="1" />
      <line x1="220" y1="121" x2="220" y2="147" stroke="#0f172a" strokeWidth="1" />
      <line x1="240" y1="120" x2="240" y2="146" stroke="#0f172a" strokeWidth="1" />
      <line x1="260" y1="120" x2="260" y2="146" stroke="#0f172a" strokeWidth="1" />
      
      {/* Treadmill side rails */}
      <rect x="75" y="105" width="12" height="55" rx="2" fill="#64748b" />
      <rect x="273" y="95" width="12" height="65" rx="2" fill="#64748b" />
      
      {/* Treadmill handrails - curved ergonomic */}
      <path d="M81 105 Q81 65 100 55 L100 50" stroke="#94a3b8" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M279 95 Q279 60 260 50 L260 45" stroke="#94a3b8" strokeWidth="6" fill="none" strokeLinecap="round" />
      
      {/* Center console post */}
      <rect x="168" y="40" width="24" height="70" rx="3" fill="#475569" />
      
      {/* Display console - big screen - MOVED UP */}
      <rect x="140" y="8" width="80" height="50" rx="6" fill="#0f172a" stroke="#374151" strokeWidth="2" />
      <rect x="145" y="13" width="70" height="35" rx="3" fill="#1e293b" />
      
      {/* Display content */}
      <text x="180" y="28" textAnchor="middle" fontSize="8" fill="#22c55e">
        STREAM COUNT
      </text>
      <text x="180" y="43" textAnchor="middle" fontSize="16" fontWeight="700" fill="#22c55e">
        147
      </text>
      
      {/* Console buttons */}
      <circle cx="155" cy="53" r="4" fill="#dc2626" />
      <circle cx="170" cy="53" r="4" fill="#22c55e" />
      <rect x="185" y="50" width="25" height="8" rx="2" fill="#374151" />

      {/* === RUNNER - MOVED RIGHT to not overlap display === */}
      <g transform="translate(200, 30)">
        {/* Head */}
        <circle cx="30" cy="40" r="16" fill="#fde68a" />
        
        {/* Headband */}
        <path d="M14 36 Q30 30 46 36" stroke="#dc2626" strokeWidth="4" fill="none" />
        
        {/* Face */}
        <ellipse cx="25" cy="38" rx="2.5" ry="2.5" fill="#1e293b" />
        <ellipse cx="35" cy="38" rx="2.5" ry="2.5" fill="#1e293b" />
        <path d="M25 47 Q30 50 35 47" stroke="#1e293b" strokeWidth="1.5" fill="none" />
        
        {/* Sweat drops flying */}
        <path d="M50 32 Q54 38 50 44 Q46 38 50 32" fill="#38bdf8" />
        <path d="M55 42 Q58 46 55 50 Q52 46 55 42" fill="#38bdf8" />
        <path d="M10 38 Q14 44 10 50 Q6 44 10 38" fill="#38bdf8" />
        
        {/* Body - running shirt */}
        <rect x="20" y="56" width="20" height="26" rx="4" fill="#6366f1" />
        
        {/* Arms pumping */}
        <path d="M20 62 L5 52" stroke="#fde68a" strokeWidth="6" strokeLinecap="round" />
        <path d="M40 68 L58 78" stroke="#fde68a" strokeWidth="6" strokeLinecap="round" />
        
        {/* Legs in running motion */}
        <path d="M25 82 L12 98" stroke="#374151" strokeWidth="6" strokeLinecap="round" />
        <path d="M35 82 L55 95" stroke="#374151" strokeWidth="6" strokeLinecap="round" />
        
        {/* Running shoes */}
        <ellipse cx="10" cy="100" rx="8" ry="4" fill="#f1f5f9" />
        <ellipse cx="57" cy="97" rx="8" ry="4" fill="#f1f5f9" />
      </g>

      {/* === MILESTONE SIGNS - CENTERED with more space === */}
      <g transform="translate(18, 205)">
        <rect x="0" y="0" width="62" height="18" rx="4" fill="#dcfce7" stroke="#22c55e" strokeWidth="1" />
        <text x="31" y="13" textAnchor="middle" fontSize="9" fontWeight="600" fill="#166534">
          Announce
        </text>
        
        <rect x="70" y="0" width="58" height="18" rx="4" fill="#ffedd5" stroke="#f97316" strokeWidth="1" />
        <text x="99" y="13" textAnchor="middle" fontSize="9" fontWeight="600" fill="#c2410c">
          Show up
        </text>
        
        <rect x="136" y="0" width="42" height="18" rx="4" fill="#ede9fe" stroke="#8b5cf6" strokeWidth="1" />
        <text x="157" y="13" textAnchor="middle" fontSize="9" fontWeight="600" fill="#6d28d9">
          Chat
        </text>
        
        <rect x="186" y="0" width="52" height="18" rx="4" fill="#e0f2fe" stroke="#0ea5e9" strokeWidth="1" />
        <text x="212" y="13" textAnchor="middle" fontSize="9" fontWeight="600" fill="#0369a1">
          Replay
        </text>
        
        <rect x="246" y="0" width="60" height="18" rx="4" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" />
        <text x="276" y="13" textAnchor="middle" fontSize="9" fontWeight="600" fill="#64748b">
          Repeat...
        </text>
      </g>
    </svg>
  );
}

/** Requirements shown as NASA-style rocket launch control - absurdly dramatic */
function GatekeeperVisual() {
  return (
    <svg
      width="380"
      height="170"
      viewBox="0 0 380 170"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      style={{ maxWidth: "100%", height: "auto" }}
    >
      <title>YouTube live streaming requirements as rocket launch control</title>
      <desc>
        NASA-style mission control with status panels showing streaming requirements
      </desc>

      {/* === CONTROL ROOM BACKGROUND === */}
      <rect x="0" y="0" width="380" height="170" rx="8" fill="#0f172a" />
      
      {/* Big screen at top */}
      <rect x="100" y="8" width="180" height="45" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="2" />
      
      {/* Rocket on big screen */}
      <g transform="translate(170, 15)">
        {/* Rocket body */}
        <path d="M20 0 L25 5 L25 28 L15 28 L15 5 Z" fill="#f1f5f9" />
        <path d="M20 0 L25 5 L15 5 Z" fill="#dc2626" />
        {/* Rocket window */}
        <circle cx="20" cy="12" r="4" fill="#38bdf8" />
        {/* Rocket fins */}
        <path d="M15 23 L10 30 L15 28 Z" fill="#64748b" />
        <path d="M25 23 L30 30 L25 28 Z" fill="#64748b" />
        {/* Flames */}
        <path d="M17 28 L20 38 L23 28" fill="#f97316" />
        <path d="M18 28 L20 35 L22 28" fill="#fde047" />
      </g>
      
      {/* Mission title */}
      <text x="190" y="22" textAnchor="middle" fontSize="8" fill="#94a3b8">
        MISSION
      </text>
      <text x="235" y="48" textAnchor="start" fontSize="10" fontWeight="700" fill="#22c55e">
        GO LIVE
      </text>
      
      {/* Countdown */}
      <rect x="110" y="30" width="50" height="18" rx="2" fill="#0f172a" />
      <text x="135" y="43" textAnchor="middle" fontSize="12" fontWeight="700" fill="#22c55e" fontFamily="monospace">
        T-00:24
      </text>

      {/* === STATUS PANELS - THE REQUIREMENTS === */}
      
      {/* Panel 1: Phone Verified - GO */}
      <g transform="translate(20, 65)">
        <rect width="105" height="55" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1" />
        <rect x="5" y="5" width="95" height="20" rx="2" fill="#0f172a" />
        <text x="52" y="18" textAnchor="middle" fontSize="8" fill="#94a3b8">
          PHONE VERIFIED
        </text>
        {/* Big GO light */}
        <rect x="25" y="30" width="55" height="18" rx="4" fill="#166534" />
        <rect x="28" y="33" width="49" height="12" rx="2" fill="#22c55e" />
        <text x="52" y="43" textAnchor="middle" fontSize="10" fontWeight="700" fill="white">
          GO
        </text>
        {/* Glow */}
        <rect x="25" y="30" width="55" height="18" rx="4" fill="#22c55e" opacity="0.2" />
      </g>
      
      {/* Panel 2: No Strikes - GO */}
      <g transform="translate(138, 65)">
        <rect width="105" height="55" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1" />
        <rect x="5" y="5" width="95" height="20" rx="2" fill="#0f172a" />
        <text x="52" y="18" textAnchor="middle" fontSize="8" fill="#94a3b8">
          COMMUNITY STATUS
        </text>
        {/* Big GO light */}
        <rect x="25" y="30" width="55" height="18" rx="4" fill="#166534" />
        <rect x="28" y="33" width="49" height="12" rx="2" fill="#22c55e" />
        <text x="52" y="43" textAnchor="middle" fontSize="10" fontWeight="700" fill="white">
          GO
        </text>
        <rect x="25" y="30" width="55" height="18" rx="4" fill="#22c55e" opacity="0.2" />
      </g>
      
      {/* Panel 3: 24h Wait - STANDBY (yellow) */}
      <g transform="translate(256, 65)">
        <rect width="105" height="55" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1" />
        <rect x="5" y="5" width="95" height="20" rx="2" fill="#0f172a" />
        <text x="52" y="18" textAnchor="middle" fontSize="8" fill="#94a3b8">
          24-HOUR HOLD
        </text>
        {/* Standby light */}
        <rect x="20" y="30" width="65" height="18" rx="4" fill="#854d0e" />
        <rect x="23" y="33" width="59" height="12" rx="2" fill="#eab308" />
        <text x="52" y="43" textAnchor="middle" fontSize="9" fontWeight="700" fill="#422006">
          STANDBY
        </text>
        {/* Blinking effect dots */}
        <circle cx="15" cy="39" r="3" fill="#fde047" opacity="0.6" />
      </g>

      {/* === MISSION CONTROL OPERATOR === */}
      <g transform="translate(310, 95)">
        {/* Chair back */}
        <rect x="10" y="25" width="40" height="50" rx="4" fill="#374151" />
        {/* Person - back of head */}
        <circle cx="30" cy="20" r="18" fill="#fde68a" />
        {/* Headset */}
        <path d="M12 15 Q30 5 48 15" stroke="#1e293b" strokeWidth="4" fill="none" />
        <circle cx="12" cy="18" r="6" fill="#1e293b" />
        <circle cx="48" cy="18" r="6" fill="#1e293b" />
        {/* Hair */}
        <path d="M15 10 Q30 2 45 10" fill="#78350f" />
        {/* Mic */}
        <path d="M12 24 L5 35" stroke="#1e293b" strokeWidth="3" />
        <circle cx="5" cy="37" r="4" fill="#1e293b" />
      </g>

      {/* === LAUNCH BUTTON === */}
      <g transform="translate(20, 130)">
        {/* Button housing */}
        <rect x="0" y="0" width="90" height="32" rx="6" fill="#7f1d1d" stroke="#991b1b" strokeWidth="2" />
        {/* Big red button */}
        <ellipse cx="45" cy="16" rx="30" ry="12" fill="#b91c1c" />
        <ellipse cx="45" cy="14" rx="26" ry="9" fill="#dc2626" />
        <ellipse cx="45" cy="12" rx="20" ry="6" fill="#ef4444" />
        <text x="45" y="17" textAnchor="middle" fontSize="9" fontWeight="700" fill="white">
          LAUNCH
        </text>
        {/* Safety cover (lifted) */}
        <path d="M75 -5 L90 -5 L90 25 L85 30 L80 25 L80 0 L75 0 Z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1" />
      </g>

      {/* Speech bubble from operator */}
      <g transform="translate(220, 130)">
        <rect x="0" y="0" width="140" height="30" rx="6" fill="white" stroke="#e2e8f0" strokeWidth="1" />
        <path d="M130 15 L145 25 L130 25" fill="white" />
        <text x="70" y="13" textAnchor="middle" fontSize="8" fill="#64748b">
          &quot;All systems nominal.
        </text>
        <text x="70" y="24" textAnchor="middle" fontSize="8" fill="#64748b">
          You are GO for streaming.&quot;
        </text>
      </g>
    </svg>
  );
}

/** Two control panels: simple vs cockpit */
function ControlPanelsVisual() {
  return (
    <svg
      width="340"
      height="140"
      viewBox="0 0 340 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
    >
      <title>Webcam versus streaming software control comparison</title>
      <desc>
        Simple panel with few buttons versus complex cockpit with many controls
      </desc>

      {/* Simple panel - Webcam */}
      <rect x="10" y="20" width="140" height="90" rx="8" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
      <text x="80" y="38" textAnchor="middle" fontSize="10" fontWeight="600" fill="#64748b">
        WEBCAM
      </text>
      {/* Simple controls */}
      <rect x="30" y="50" width="100" height="30" rx="4" fill="#1e293b" />
      <circle cx="80" cy="65" r="10" fill="#dc2626" />
      <text x="80" y="100" textAnchor="middle" fontSize="9" fill="#64748b">
        One button
      </text>

      {/* VS divider */}
      <text x="170" y="70" textAnchor="middle" fontSize="12" fontWeight="600" fill="#94a3b8">
        vs
      </text>

      {/* Complex panel - OBS */}
      <rect x="190" y="20" width="140" height="90" rx="8" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
      <text x="260" y="38" textAnchor="middle" fontSize="10" fontWeight="600" fill="#64748b">
        SOFTWARE
      </text>
      {/* Complex controls */}
      <rect x="200" y="45" width="50" height="25" rx="2" fill="#1e293b" />
      <rect x="255" y="45" width="50" height="25" rx="2" fill="#1e293b" />
      <rect x="200" y="75" width="30" height="10" rx="2" fill="#22c55e" />
      <rect x="235" y="75" width="30" height="10" rx="2" fill="#f97316" />
      <rect x="270" y="75" width="30" height="10" rx="2" fill="#6366f1" />
      {/* Sliders */}
      <rect x="310" y="45" width="8" height="40" rx="2" fill="#e2e8f0" />
      <rect x="310" y="60" width="8" height="10" rx="2" fill="#64748b" />
      <text x="260" y="100" textAnchor="middle" fontSize="9" fill="#64748b">
        Full control
      </text>
    </svg>
  );
}

/** Mobile go live - single phone with step-by-step panels */
function MobileGoLiveVisual() {
  return (
    <svg
      width="340"
      height="180"
      viewBox="0 0 340 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      style={{ maxWidth: "100%", height: "auto" }}
    >
      <title>Mobile streaming steps shown as comic panels</title>
      <desc>Four comic-style panels showing the mobile go-live process</desc>

      {/* === COMIC PANEL GRID === */}
      
      {/* Panel 1: Open YouTube App */}
      <g transform="translate(5, 5)">
        <rect width="80" height="80" rx="4" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2" />
        {/* Step number */}
        <circle cx="15" cy="15" r="10" fill="#6366f1" />
        <text x="15" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white">1</text>
        {/* Phone outline */}
        <rect x="25" y="22" width="35" height="50" rx="4" fill="#1e293b" />
        <rect x="28" y="26" width="29" height="40" rx="2" fill="#f8fafc" />
        {/* YouTube logo */}
        <rect x="33" y="38" width="20" height="14" rx="2" fill="#dc2626" />
        <path d="M40 42 L48 45 L40 48 Z" fill="white" />
        {/* Label */}
        <text x="40" y="78" textAnchor="middle" fontSize="7" fontWeight="600" fill="#64748b">
          Open app
        </text>
      </g>

      {/* Panel 2: Tap the + button */}
      <g transform="translate(90, 5)">
        <rect width="80" height="80" rx="4" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2" />
        <circle cx="15" cy="15" r="10" fill="#6366f1" />
        <text x="15" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white">2</text>
        {/* Phone with + button */}
        <rect x="25" y="22" width="35" height="50" rx="4" fill="#1e293b" />
        <rect x="28" y="26" width="29" height="40" rx="2" fill="#f8fafc" />
        {/* + button highlighted */}
        <circle cx="42" cy="58" r="8" fill="#6366f1" />
        <rect x="40" y="54" width="4" height="8" rx="1" fill="white" />
        <rect x="38" y="56" width="8" height="4" rx="1" fill="white" />
        {/* Tap indicator */}
        <circle cx="42" cy="58" r="12" fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="3" />
        {/* Finger */}
        <ellipse cx="55" cy="65" rx="8" ry="5" fill="#fde68a" transform="rotate(-30 55 65)" />
        <text x="40" y="78" textAnchor="middle" fontSize="7" fontWeight="600" fill="#64748b">
          Tap +
        </text>
      </g>

      {/* Panel 3: Select Go Live */}
      <g transform="translate(175, 5)">
        <rect width="80" height="80" rx="4" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2" />
        <circle cx="15" cy="15" r="10" fill="#6366f1" />
        <text x="15" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white">3</text>
        {/* Menu popup */}
        <rect x="15" y="25" width="50" height="45" rx="4" fill="white" stroke="#e2e8f0" strokeWidth="1" />
        {/* Menu items */}
        <rect x="18" y="28" width="44" height="10" rx="2" fill="#f1f5f9" />
        <text x="40" y="36" textAnchor="middle" fontSize="5" fill="#64748b">Upload</text>
        <rect x="18" y="40" width="44" height="10" rx="2" fill="#f1f5f9" />
        <text x="40" y="48" textAnchor="middle" fontSize="5" fill="#64748b">Short</text>
        {/* Go live highlighted */}
        <rect x="18" y="52" width="44" height="12" rx="2" fill="#dc2626" />
        <circle cx="25" cy="58" r="3" fill="white" />
        <text x="45" y="61" textAnchor="middle" fontSize="6" fontWeight="600" fill="white">Go live</text>
        <text x="40" y="78" textAnchor="middle" fontSize="7" fontWeight="600" fill="#64748b">
          Select
        </text>
      </g>

      {/* Panel 4: You're LIVE */}
      <g transform="translate(260, 5)">
        <rect width="75" height="80" rx="4" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
        <circle cx="15" cy="15" r="10" fill="#22c55e" />
        <text x="15" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="white">4</text>
        {/* Phone showing live */}
        <rect x="20" y="22" width="35" height="50" rx="4" fill="#1e293b" />
        <rect x="23" y="26" width="29" height="40" rx="2" fill="#374151" />
        {/* Person streaming */}
        <circle cx="37" cy="40" r="8" fill="#fde68a" />
        <ellipse cx="34" cy="38" rx="1.5" ry="1.5" fill="#1e293b" />
        <ellipse cx="40" cy="38" rx="1.5" ry="1.5" fill="#1e293b" />
        <path d="M35 43 Q37 45 39 43" stroke="#1e293b" strokeWidth="1" fill="none" />
        {/* LIVE badge */}
        <rect x="25" y="28" width="18" height="8" rx="2" fill="#dc2626" />
        <circle cx="29" cy="32" r="2" fill="white" />
        <text x="38" y="34" textAnchor="middle" fontSize="5" fontWeight="600" fill="white">LIVE</text>
        {/* Celebration */}
        <text x="55" y="35" fontSize="10">🎉</text>
        <text x="37" y="78" textAnchor="middle" fontSize="7" fontWeight="700" fill="#166534">
          LIVE!
        </text>
      </g>

      {/* === BOTTOM: Simple text summary === */}
      <g transform="translate(0, 95)">
        <rect x="5" y="0" width="330" height="80" rx="8" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
        
        {/* Hand holding phone */}
        <g transform="translate(20, 10)">
          {/* Hand */}
          <ellipse cx="30" cy="50" rx="25" ry="15" fill="#fde68a" />
          <ellipse cx="10" cy="40" rx="8" ry="20" fill="#fde68a" />
          <ellipse cx="50" cy="45" rx="6" ry="12" fill="#fde68a" />
          {/* Phone in hand */}
          <rect x="18" y="8" width="30" height="50" rx="4" fill="#1e293b" />
          <rect x="21" y="12" width="24" height="40" rx="2" fill="#374151" />
          {/* LIVE on screen */}
          <rect x="23" y="14" width="14" height="6" rx="1" fill="#dc2626" />
          <circle cx="26" cy="17" r="1.5" fill="white" />
        </g>

        {/* Text instructions */}
        <text x="100" y="25" fontSize="11" fontWeight="600" fill="#1e293b">
          That&apos;s it. Four taps.
        </text>
        <text x="100" y="42" fontSize="9" fill="#64748b">
          Open YouTube → Tap + → Select &quot;Go live&quot; →
        </text>
        <text x="100" y="55" fontSize="9" fill="#64748b">
          Add a title → You&apos;re streaming.
        </text>
        <text x="100" y="72" fontSize="8" fill="#94a3b8" fontStyle="italic">
          (Requires 50+ subscribers for mobile)
        </text>
      </g>
    </svg>
  );
}

/** Phone on tripod doing its best */
function PhoneTripodVisual() {
  return (
    <svg
      width="100"
      height="120"
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      {/* Tripod legs */}
      <path d="M50 75 L25 115" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
      <path d="M50 75 L75 115" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
      <path d="M50 75 L50 115" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />

      {/* Tripod mount */}
      <rect x="40" y="70" width="20" height="10" rx="2" fill="#475569" />

      {/* Phone body */}
      <rect x="32" y="15" width="36" height="55" rx="4" fill="#1e293b" />
      <rect x="35" y="20" width="30" height="42" rx="2" fill="#334155" />

      {/* Camera lens */}
      <circle cx="50" cy="30" r="6" fill="#475569" />
      <circle cx="50" cy="30" r="3" fill="#0f172a" />

      {/* Recording indicator */}
      <circle cx="68" cy="62" r="4" fill="#dc2626" />

      {/* Sweat drop (doing its best) */}
      <path d="M72 25 Q76 30 72 35 Q68 30 72 25" fill="#38bdf8" />
    </svg>
  );
}

/** Scene stack: camera, screen, overlay layers */
function SceneStackVisual() {
  return (
    <svg
      width="300"
      height="140"
      viewBox="0 0 300 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
    >
      <title>OBS scene layer stack</title>
      <desc>
        Three layers stacked: camera at bottom, screen capture in middle,
        text overlay on top
      </desc>

      {/* Layer 1: Camera (bottom) */}
      <g transform="translate(20, 70)">
        <rect width="120" height="60" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="2" />
        <circle cx="60" cy="30" r="15" fill="#475569" />
        <circle cx="60" cy="30" r="8" fill="#0f172a" />
        <text x="60" y="70" textAnchor="middle" fontSize="9" fill="#64748b">
          Layer 1: Camera
        </text>
      </g>

      {/* Layer 2: Screen (middle) */}
      <g transform="translate(90, 40)">
        <rect width="120" height="60" rx="4" fill="#0f172a" stroke="#6366f1" strokeWidth="2" />
        <rect x="8" y="8" width="40" height="20" rx="2" fill="#334155" />
        <rect x="52" y="8" width="60" height="44" rx="2" fill="#1e293b" />
        <text x="60" y="70" textAnchor="middle" fontSize="9" fill="#64748b">
          Layer 2: Screen
        </text>
      </g>

      {/* Layer 3: Overlay (top) */}
      <g transform="translate(160, 10)">
        <rect width="120" height="60" rx="4" fill="transparent" stroke="#22c55e" strokeWidth="2" strokeDasharray="4" />
        <rect x="10" y="45" width="60" height="10" rx="2" fill="#22c55e" />
        <text x="40" y="52" fontSize="7" fontWeight="600" fill="white">
          LIVE NOW
        </text>
        <text x="60" y="80" textAnchor="middle" fontSize="9" fill="#64748b">
          Layer 3: Overlay
        </text>
      </g>

      {/* Stack indicator */}
      <path d="M150 100 L150 130" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3" />
      <text x="150" y="138" textAnchor="middle" fontSize="8" fill="#94a3b8">
        Final output
      </text>
    </svg>
  );
}

/** Upload speed gauge with quality labels */
function SpeedometerVisual() {
  return (
    <svg
      width="320"
      height="140"
      viewBox="0 0 320 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
    >
      <title>Upload speed affects stream quality</title>
      <desc>
        Gauge showing upload speed zones mapped to video quality levels
      </desc>

      {/* Gauge background */}
      <rect x="20" y="20" width="280" height="100" rx="8" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
      
      {/* Title */}
      <text x="160" y="40" textAnchor="middle" fontSize="11" fontWeight="600" fill="#1e293b">
        Your Upload Speed
      </text>

      {/* Speed bar track */}
      <rect x="40" y="55" width="240" height="20" rx="10" fill="#e2e8f0" />
      
      {/* Speed zones */}
      <rect x="40" y="55" width="60" height="20" rx="10" fill="#fca5a5" />
      <rect x="100" y="55" width="80" height="20" fill="#fde68a" />
      <rect x="180" y="55" width="100" height="20" rx="10" fill="#86efac" />
      
      {/* Zone dividers */}
      <line x1="100" y1="52" x2="100" y2="78" stroke="white" strokeWidth="2" />
      <line x1="180" y1="52" x2="180" y2="78" stroke="white" strokeWidth="2" />

      {/* Current position indicator */}
      <g transform="translate(190, 50)">
        <polygon points="0,0 -8,12 8,12" fill="#1e293b" />
        <rect x="-12" y="12" width="24" height="16" rx="4" fill="#1e293b" />
        <text x="0" y="24" textAnchor="middle" fontSize="8" fontWeight="600" fill="white">
          YOU
        </text>
      </g>

      {/* Speed labels below */}
      <text x="70" y="90" textAnchor="middle" fontSize="9" fontWeight="600" fill="#dc2626">
        3 Mbps
      </text>
      <text x="70" y="100" textAnchor="middle" fontSize="7" fill="#dc2626">
        720p risky
      </text>
      
      <text x="140" y="90" textAnchor="middle" fontSize="9" fontWeight="600" fill="#ca8a04">
        10 Mbps
      </text>
      <text x="140" y="100" textAnchor="middle" fontSize="7" fill="#ca8a04">
        1080p okay
      </text>
      
      <text x="230" y="90" textAnchor="middle" fontSize="9" fontWeight="600" fill="#16a34a">
        20+ Mbps
      </text>
      <text x="230" y="100" textAnchor="middle" fontSize="7" fill="#16a34a">
        1080p60 smooth
      </text>

      {/* Wifi icon */}
      <g transform="translate(280, 80)">
        <path d="M0 0 Q10 -10 20 0" stroke="#94a3b8" strokeWidth="2" fill="none" />
        <path d="M4 4 Q10 -2 16 4" stroke="#94a3b8" strokeWidth="2" fill="none" />
        <circle cx="10" cy="8" r="3" fill="#94a3b8" />
      </g>
    </svg>
  );
}

/** Segment timer: warm open, core, Q&A, close */
function SegmentTimerVisual() {
  return (
    <svg
      width="340"
      height="60"
      viewBox="0 0 340 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
    >
      <title>Stream segment structure</title>
      <desc>Timeline showing warm open, core content, Q&amp;A, and close segments</desc>

      {/* Timeline bar */}
      <rect x="10" y="25" width="320" height="10" rx="5" fill="#e2e8f0" />

      {/* Segments */}
      <rect x="10" y="25" width="50" height="10" rx="5" fill="#f97316" />
      <rect x="60" y="25" width="170" height="10" fill="#6366f1" />
      <rect x="230" y="25" width="60" height="10" fill="#8b5cf6" />
      <rect x="290" y="25" width="40" height="10" rx="5" fill="#22c55e" />

      {/* Labels */}
      <text x="35" y="50" textAnchor="middle" fontSize="8" fill="#c2410c">
        Open
      </text>
      <text x="145" y="50" textAnchor="middle" fontSize="8" fill="#4f46e5">
        Core content
      </text>
      <text x="260" y="50" textAnchor="middle" fontSize="8" fill="#7c3aed">
        Q&amp;A
      </text>
      <text x="310" y="50" textAnchor="middle" fontSize="8" fill="#16a34a">
        Close
      </text>

      {/* Time markers */}
      <text x="10" y="18" fontSize="8" fill="#94a3b8">
        0:00
      </text>
      <text x="330" y="18" textAnchor="end" fontSize="8" fill="#94a3b8">
        End
      </text>
    </svg>
  );
}

/** Bad audio - person with echo waves and ear pain */
function EchoCaveIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="64" height="64" rx="12" fill="#fee2e2" />
      
      {/* Microphone */}
      <rect x="14" y="20" width="12" height="20" rx="6" fill="#94a3b8" />
      <rect x="18" y="40" width="4" height="8" fill="#94a3b8" />
      <rect x="14" y="46" width="12" height="3" rx="1" fill="#94a3b8" />
      
      {/* Sound waves going crazy */}
      <path d="M30 25 Q35 20 40 25" stroke="#ef4444" strokeWidth="2" fill="none" />
      <path d="M32 30 Q38 24 44 30" stroke="#ef4444" strokeWidth="2" fill="none" />
      <path d="M34 35 Q42 28 50 35" stroke="#ef4444" strokeWidth="2" fill="none" />
      
      {/* Bouncing back chaotically */}
      <path d="M50 25 Q45 28 50 32" stroke="#ef4444" strokeWidth="2" fill="none" strokeDasharray="2" />
      <path d="M48 38 Q42 42 48 46" stroke="#ef4444" strokeWidth="2" fill="none" strokeDasharray="2" />
      
      {/* Distressed ear icon */}
      <path d="M50 14 Q58 20 54 30 Q52 35 48 32" stroke="#dc2626" strokeWidth="3" fill="none" />
      <circle cx="50" cy="26" r="3" fill="#dc2626" />
      
      {/* X marks the bad */}
      <circle cx="52" cy="52" r="8" fill="#dc2626" />
      <path d="M48 48 L56 56 M56 48 L48 56" stroke="white" strokeWidth="2" />
    </svg>
  );
}

/** Unstable connection - router on fire */
function WifiGremlinIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="64" height="64" rx="12" fill="#fee2e2" />
      
      {/* Router body */}
      <rect x="12" y="35" width="40" height="16" rx="3" fill="#64748b" />
      <rect x="12" y="35" width="40" height="4" rx="2" fill="#475569" />
      
      {/* Router lights - blinking red */}
      <circle cx="20" cy="45" r="3" fill="#ef4444" />
      <circle cx="30" cy="45" r="3" fill="#ef4444" />
      <circle cx="40" cy="45" r="3" fill="#f97316" />
      
      {/* Antennas */}
      <rect x="18" y="22" width="3" height="13" rx="1" fill="#475569" />
      <rect x="43" y="22" width="3" height="13" rx="1" fill="#475569" />
      
      {/* WiFi signal - broken/glitching */}
      <path d="M20 18 Q32 6 44 18" stroke="#94a3b8" strokeWidth="2" fill="none" strokeDasharray="3" />
      <path d="M25 22 Q32 14 39 22" stroke="#94a3b8" strokeWidth="2" fill="none" strokeDasharray="3" />
      
      {/* Flames */}
      <path d="M24 32 Q22 28 26 24 Q24 28 28 26 Q26 30 28 32" fill="#f97316" />
      <path d="M36 30 Q34 26 38 22 Q36 26 40 24 Q38 28 40 30" fill="#ef4444" />
      <path d="M44 33 Q43 30 46 27 Q44 30 47 29 Q45 32 47 33" fill="#f97316" />
      
      {/* Smoke puffs */}
      <circle cx="30" cy="16" r="4" fill="#cbd5e1" opacity="0.6" />
      <circle cx="38" cy="12" r="3" fill="#cbd5e1" opacity="0.4" />
    </svg>
  );
}

/** Dead air - cricket and empty chair */
function TumbleweedIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="64" height="64" rx="12" fill="#fee2e2" />
      
      {/* Empty gaming chair */}
      <path d="M20 55 L20 38 Q20 32 26 32 L38 32 Q44 32 44 38 L44 55" 
            fill="#475569" stroke="#334155" strokeWidth="2" />
      <rect x="22" y="34" width="20" height="18" rx="2" fill="#1e293b" />
      
      {/* Chair back */}
      <path d="M22 34 L22 22 Q22 18 26 18 L38 18 Q42 18 42 22 L42 34" 
            fill="#475569" stroke="#334155" strokeWidth="2" />
      <rect x="24" y="20" width="16" height="12" rx="2" fill="#1e293b" />
      
      {/* Chair wheels */}
      <circle cx="24" cy="56" r="3" fill="#1e293b" />
      <circle cx="40" cy="56" r="3" fill="#1e293b" />
      
      {/* Cricket */}
      <g transform="translate(48, 40)">
        <ellipse cx="0" cy="0" rx="5" ry="3" fill="#65a30d" />
        <circle cx="-4" cy="-1" r="2" fill="#65a30d" />
        <line x1="-3" y1="2" x2="-6" y2="6" stroke="#65a30d" strokeWidth="1" />
        <line x1="2" y1="2" x2="5" y2="6" stroke="#65a30d" strokeWidth="1" />
        {/* Antennae */}
        <line x1="-5" y1="-2" x2="-7" y2="-5" stroke="#65a30d" strokeWidth="1" />
        <line x1="-4" y1="-2" x2="-3" y2="-5" stroke="#65a30d" strokeWidth="1" />
      </g>
      
      {/* "chirp chirp" */}
      <text x="50" y="30" fontSize="6" fill="#65a30d" fontStyle="italic">
        chirp
      </text>
      <text x="52" y="36" fontSize="5" fill="#65a30d" fontStyle="italic">
        chirp
      </text>
      
      {/* Cobweb in corner */}
      <path d="M8 8 L8 20 M8 8 L20 8 M8 8 L16 16" stroke="#cbd5e1" strokeWidth="1" />
      <path d="M10 8 Q12 12 8 14" stroke="#cbd5e1" strokeWidth="0.5" fill="none" />
    </svg>
  );
}

/** No promotion - ghost town viewer count */
function GhostIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="64" height="64" rx="12" fill="#fee2e2" />
      
      {/* Stream preview window */}
      <rect x="8" y="10" width="48" height="32" rx="4" fill="#1e293b" />
      <rect x="10" y="12" width="44" height="24" rx="2" fill="#334155" />
      
      {/* Person streaming alone */}
      <circle cx="32" cy="22" r="6" fill="#fde68a" />
      <rect x="28" y="28" width="8" height="6" rx="2" fill="#6366f1" />
      
      {/* Viewer count - zero */}
      <rect x="12" y="28" width="18" height="6" rx="2" fill="#0f172a" />
      <circle cx="16" cy="31" r="2" fill="#ef4444" />
      <text x="26" y="33" textAnchor="end" fontSize="5" fontWeight="700" fill="white">
        0
      </text>
      
      {/* Chat - empty and sad */}
      <rect x="8" y="44" width="48" height="14" rx="3" fill="#f1f5f9" stroke="#e2e8f0" />
      <text x="32" y="53" textAnchor="middle" fontSize="7" fill="#94a3b8">
        No messages yet...
      </text>
      
      {/* Tumbleweeds rolling through chat */}
      <circle cx="18" cy="52" r="4" fill="none" stroke="#d4a574" strokeWidth="1" />
      <path d="M15 50 Q18 48 21 50" stroke="#d4a574" strokeWidth="0.5" fill="none" />
      <path d="M15 54 Q18 52 21 54" stroke="#d4a574" strokeWidth="0.5" fill="none" />
      
      {/* Motion lines */}
      <line x1="10" y1="52" x2="13" y2="52" stroke="#d4a574" strokeWidth="1" />
      <line x1="11" y1="50" x2="13" y2="50" stroke="#d4a574" strokeWidth="1" />
    </svg>
  );
}

/** IT support rubber duck - facing user with headset on top of head */
function SupportDuckVisual() {
  return (
    <svg
      width="140"
      height="140"
      viewBox="0 0 140 140"
      fill="none"
      aria-hidden="true"
      focusable="false"
      style={{ maxWidth: "100%", height: "auto" }}
    >
      {/* === RUBBER DUCK FACING FORWARD === */}
      
      {/* Body - round, centered */}
      <ellipse cx="70" cy="105" rx="45" ry="30" fill="#fde047" />
      {/* Body shine */}
      <ellipse cx="55" cy="95" rx="18" ry="12" fill="#fef08a" opacity="0.6" />
      
      {/* Head - centered above body */}
      <ellipse cx="70" cy="55" rx="32" ry="30" fill="#fde047" />
      {/* Head shine */}
      <ellipse cx="58" cy="42" rx="12" ry="8" fill="#fef08a" opacity="0.6" />
      
      {/* === BEAK - pointing toward viewer (foreshortened) === */}
      <ellipse cx="70" cy="70" rx="12" ry="8" fill="#f97316" />
      {/* Beak highlight */}
      <ellipse cx="70" cy="67" rx="6" ry="3" fill="#fdba74" />
      
      {/* === EYES - both visible, looking at viewer === */}
      {/* Left eye */}
      <ellipse cx="54" cy="50" rx="8" ry="9" fill="white" />
      <ellipse cx="56" cy="50" rx="5" ry="6" fill="#1e293b" />
      <circle cx="58" cy="48" r="2" fill="white" />
      
      {/* Right eye */}
      <ellipse cx="86" cy="50" rx="8" ry="9" fill="white" />
      <ellipse cx="84" cy="50" rx="5" ry="6" fill="#1e293b" />
      <circle cx="82" cy="48" r="2" fill="white" />
      
      {/* === HEADSET - ON TOP OF HEAD === */}
      
      {/* Headset band - sits on very top of head */}
      <path d="M38 38 Q70 12 102 38" stroke="#475569" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M41 38 Q70 16 99 38" stroke="#1e293b" strokeWidth="3" fill="none" strokeLinecap="round" />
      
      {/* Left ear cup - on side of head, NOT covering face */}
      <ellipse cx="38" cy="45" rx="7" ry="10" fill="#475569" />
      <ellipse cx="38" cy="45" rx="5" ry="7" fill="#1e293b" />
      <ellipse cx="38" cy="45" rx="2.5" ry="4" fill="#374151" />
      
      {/* Right ear cup - on side of head, NOT covering face */}
      <ellipse cx="102" cy="45" rx="7" ry="10" fill="#475569" />
      <ellipse cx="102" cy="45" rx="5" ry="7" fill="#1e293b" />
      <ellipse cx="102" cy="45" rx="2.5" ry="4" fill="#374151" />
      
      {/* Microphone boom - curves down from left ear */}
      <path d="M32 52 Q22 65 30 78" stroke="#475569" strokeWidth="3" fill="none" strokeLinecap="round" />
      
      {/* Microphone head */}
      <ellipse cx="31" cy="80" rx="5" ry="4" fill="#475569" />
      <ellipse cx="31" cy="80" rx="3" ry="2.5" fill="#1e293b" />

      {/* === Speech bubble - to the right === */}
      <g transform="translate(95, 5)">
        <rect x="0" y="0" width="42" height="28" rx="5" fill="white" stroke="#e2e8f0" strokeWidth="1" />
        <path d="M0 14 L-6 18 L0 22" fill="white" />
        <text x="21" y="11" textAnchor="middle" fontSize="6" fill="#64748b">
          Have you
        </text>
        <text x="21" y="20" textAnchor="middle" fontSize="6" fontWeight="600" fill="#1e293b">
          tried
        </text>
        <text x="21" y="26" textAnchor="middle" fontSize="5" fill="#64748b">
          restarting?
        </text>
      </g>
    </svg>
  );
}

/* ================================================
   ICON COMPONENTS
   ================================================ */

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function ClipIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="2" />
      <path d="M10 8L16 12L10 16V8Z" fill="currentColor" />
    </svg>
  );
}

/* ================================================
   LOCAL HELPER COMPONENTS
   ================================================ */

function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className="cardGrid">{children}</div>;
}

function Card({
  title,
  children,
  style,
}: {
  title: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div className="liveCard" style={style}>
      <h3 className="liveCard__title">{title}</h3>
      <div className="liveCard__content">{children}</div>
    </div>
  );
}

function Rows({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div className="rows" style={style}>
      {children}
    </div>
  );
}

function Row({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="row">
      <span className="row__label">{label}</span>
      <span className="row__desc">{desc}</span>
    </div>
  );
}

function Breadcrumb({ items }: { items: string[] }) {
  return (
    <div className="breadcrumbPath">
      {items.map((item, i) => (
        <span key={i}>
          <span className="breadcrumbPath__chip">{item}</span>
          {i < items.length - 1 && (
            <span className="breadcrumbPath__arrow">›</span>
          )}
        </span>
      ))}
    </div>
  );
}

function StoryboardPanel({
  phase,
  icon,
  items,
}: {
  phase: string;
  icon: React.ReactNode;
  items: string[];
}) {
  return (
    <div className="storyboardPanel">
      <div className="storyboardPanel__header">
        {icon}
        <span className="storyboardPanel__phase">{phase}</span>
      </div>
      <div className="storyboardPanel__items">
        {items.map((item, i) => (
          <p key={i} className="storyboardPanel__item">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="featureCard">
      <h4 className="featureCard__title">{title}</h4>
      <p className="featureCard__desc">{desc}</p>
    </div>
  );
}

function MistakeCard({
  icon,
  mistake,
  symptom,
  fix,
}: {
  icon: React.ReactNode;
  mistake: string;
  symptom: string;
  fix: string;
}) {
  return (
    <div className="liveMistakeCard">
      <div className="liveMistakeCard__icon">{icon}</div>
      <div className="liveMistakeCard__content">
        <h4 className="liveMistakeCard__mistake">{mistake}</h4>
        <p className="liveMistakeCard__symptom">{symptom}</p>
        <p className="liveMistakeCard__fix">
          <strong>Fix:</strong> {fix}
        </p>
      </div>
    </div>
  );
}

function DiagnosticCard({
  symptom,
  tries,
}: {
  symptom: string;
  tries: string[];
}) {
  return (
    <div className="diagnosticCard">
      <h4 className="diagnosticCard__symptom">{symptom}</h4>
      <div className="diagnosticCard__tries">
        {tries.map((t, i) => (
          <p key={i} className="diagnosticCard__try">
            {t}
          </p>
        ))}
      </div>
    </div>
  );
}

/*
 * CHECKLIST:
 * [x] IDs preserved: overview, requirements, desktop-streaming, mobile-streaming,
 *     streaming-software, stream-settings, growing-live-audience, monetization,
 *     mistakes, troubleshooting
 * [x] Mobile stacking good (all grids use single column on mobile)
 * [x] Minimal lists (reduced UL/OL by ~90%, using Rows, Cards, Panels)
 * [x] Links included: /learn/youtube-competitor-analysis, /learn/how-to-get-more-subscribers,
 *     /learn/youtube-monetization-requirements
 * [x] SVG accessibility: informational SVGs have <title>/<desc>, decorative use aria-hidden
 * [x] No unused imports (Link is used, BodyProps is used)
 */
