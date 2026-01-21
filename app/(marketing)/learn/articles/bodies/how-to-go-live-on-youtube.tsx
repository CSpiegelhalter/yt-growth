/**
 * Body content for How to Go Live on YouTube article.
 * Server component - no "use client" directive.
 */

import Link from "next/link";
import type { BodyProps } from "./index";

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* Overview */}
      <section id="overview" className={s.section}>
        <h2 className={s.sectionTitle}>Live Streaming Overview</h2>
        <p className={s.sectionText}>
          Learning how to go live on YouTube opens up new ways to connect with your
          audience in real-time. Live streams build community, drive engagement, and
          can generate revenue through Super Chat and memberships.
        </p>
        <p className={s.sectionText}>
          This guide covers everything you need to start streaming: requirements,
          setup options, best practices, and strategies to grow your live audience.
        </p>
      </section>

      {/* Requirements */}
      <section id="requirements" className={s.section}>
        <h2 className={s.sectionTitle}>Requirements to Go Live</h2>
        <h3 className={s.subheading}>Account Requirements</h3>
        <ul className={s.list}>
          <li><strong>Verified channel:</strong> You need a verified YouTube account</li>
          <li><strong>No live streaming restrictions:</strong> No recent community guideline strikes</li>
          <li><strong>24-hour wait:</strong> First-time streamers must enable live streaming and wait 24 hours</li>
          <li><strong>Mobile requirement:</strong> 50+ subscribers needed to go live from the mobile app</li>
        </ul>
        <h3 className={s.subheading}>Equipment Basics</h3>
        <ul className={s.list}>
          <li><strong>Camera:</strong> Webcam, phone camera, or dedicated camera</li>
          <li><strong>Microphone:</strong> Built-in works but external mic improves quality significantly</li>
          <li><strong>Internet:</strong> Stable connection with at least 3 Mbps upload speed</li>
          <li><strong>Lighting:</strong> Natural light or basic lighting improves video quality</li>
        </ul>
        <h3 className={s.subheading}>Enabling Live Streaming</h3>
        <ol className={s.numberedList}>
          <li>Go to YouTube Studio</li>
          <li>Click <strong>Create</strong> then <strong>Go live</strong></li>
          <li>If prompted, verify your channel (phone verification)</li>
          <li>Wait 24 hours for live streaming to be enabled</li>
        </ol>
      </section>

      {/* Desktop Streaming */}
      <section id="desktop-streaming" className={s.section}>
        <h2 className={s.sectionTitle}>Go Live from Desktop</h2>
        <h3 className={s.subheading}>Webcam Streaming (Simplest)</h3>
        <ol className={s.numberedList}>
          <li>Go to <strong>YouTube Studio</strong></li>
          <li>Click <strong>Create</strong> (camera icon) then <strong>Go live</strong></li>
          <li>Select <strong>Webcam</strong></li>
          <li>Add a title, description, and select privacy settings</li>
          <li>Choose or upload a thumbnail</li>
          <li>Click <strong>Go live</strong> when ready</li>
        </ol>
        <h3 className={s.subheading}>Streaming Software (More Control)</h3>
        <ol className={s.numberedList}>
          <li>In YouTube Studio, click <strong>Create</strong> then <strong>Go live</strong></li>
          <li>Select <strong>Streaming software</strong></li>
          <li>Copy your <strong>Stream key</strong> (keep this private)</li>
          <li>Paste the stream key into your streaming software (OBS, Streamlabs, etc.)</li>
          <li>Configure your scenes and sources in the software</li>
          <li>Start streaming from the software</li>
        </ol>
      </section>

      {/* Mobile Streaming */}
      <section id="mobile-streaming" className={s.section}>
        <h2 className={s.sectionTitle}>Go Live from Mobile</h2>
        <p className={s.sectionText}>
          Mobile streaming is great for on-the-go content, behind-the-scenes, and
          casual Q&amp;A sessions.
        </p>
        <h3 className={s.subheading}>Requirements</h3>
        <ul className={s.list}>
          <li><strong>50+ subscribers</strong> to go live from mobile</li>
          <li>YouTube app installed</li>
          <li>Good mobile data or WiFi connection</li>
        </ul>
        <h3 className={s.subheading}>Steps to Go Live on Mobile</h3>
        <ol className={s.numberedList}>
          <li>Open the <strong>YouTube app</strong></li>
          <li>Tap the <strong>+</strong> (Create) button</li>
          <li>Select <strong>Go live</strong></li>
          <li>Add a title and description</li>
          <li>Choose privacy settings</li>
          <li>Take or upload a thumbnail</li>
          <li>Tap <strong>Go live</strong></li>
        </ol>
        <p className={s.sectionText}>
          Mobile streams are simpler but have fewer features than desktop streaming
          software. Use mobile for casual streams and software for produced content.
        </p>
      </section>

      {/* Streaming Software */}
      <section id="streaming-software" className={s.section}>
        <h2 className={s.sectionTitle}>Streaming Software Options</h2>
        <p className={s.sectionText}>
          Streaming software gives you control over scenes, overlays, and production quality.
        </p>
        <h3 className={s.subheading}>Popular Options</h3>
        <ul className={s.list}>
          <li><strong>OBS Studio:</strong> Free, powerful, open-source. Most popular choice.</li>
          <li><strong>Streamlabs:</strong> User-friendly interface with built-in alerts and themes.</li>
          <li><strong>XSplit:</strong> Paid option with professional features.</li>
          <li><strong>Ecamm Live:</strong> Mac-only, excellent for interviews and multi-camera setups.</li>
        </ul>
        <h3 className={s.subheading}>When to Use Software vs Webcam</h3>
        <ul className={s.list}>
          <li><strong>Webcam:</strong> Quick streams, talking head content, casual Q&amp;As</li>
          <li><strong>Software:</strong> Gaming, multiple scenes, professional overlays, screen sharing</li>
        </ul>
      </section>

      {/* Stream Settings */}
      <section id="stream-settings" className={s.section}>
        <h2 className={s.sectionTitle}>Optimal Stream Settings</h2>
        <h3 className={s.subheading}>Resolution and Bitrate</h3>
        <ul className={s.list}>
          <li><strong>720p at 30fps:</strong> 2,500-4,000 kbps. Works with most connections.</li>
          <li><strong>1080p at 30fps:</strong> 4,500-6,000 kbps. Requires faster upload.</li>
          <li><strong>1080p at 60fps:</strong> 4,500-9,000 kbps. Best for gaming content.</li>
        </ul>
        <h3 className={s.subheading}>Internet Requirements</h3>
        <ul className={s.list}>
          <li><strong>Minimum:</strong> 3 Mbps upload for 720p</li>
          <li><strong>Recommended:</strong> 10+ Mbps upload for reliable 1080p</li>
          <li><strong>Use wired ethernet</strong> instead of WiFi for stability</li>
          <li><strong>Test your connection</strong> before important streams</li>
        </ul>
        <h3 className={s.subheading}>Audio Settings</h3>
        <ul className={s.list}>
          <li><strong>Sample rate:</strong> 44.1 kHz or 48 kHz</li>
          <li><strong>Bitrate:</strong> 128-320 kbps for audio</li>
          <li><strong>Test audio levels</strong> before going live</li>
        </ul>
      </section>

      {/* Growing Live Audience */}
      <section id="growing-live-audience" className={s.section}>
        <h2 className={s.sectionTitle}>Growing Your Live Audience</h2>
        <p className={s.sectionText}>
          Building a live streaming audience takes different strategies than growing
          through uploaded videos.
        </p>
        <h3 className={s.subheading}>Before the Stream</h3>
        <ul className={s.list}>
          <li><strong>Announce in advance:</strong> Use community posts and social media</li>
          <li><strong>Schedule streams:</strong> YouTube lets you create scheduled live events</li>
          <li><strong>Consistent times:</strong> Stream at the same days/times so viewers know when to tune in</li>
          <li><strong>Compelling titles:</strong> Give people a reason to watch live vs later</li>
        </ul>
        <h3 className={s.subheading}>During the Stream</h3>
        <ul className={s.list}>
          <li><strong>Engage with chat:</strong> Respond to comments and questions</li>
          <li><strong>Acknowledge viewers:</strong> Greet people by name when they join</li>
          <li><strong>Create interactive moments:</strong> Polls, Q&amp;As, viewer participation</li>
          <li><strong>Provide value:</strong> Give viewers a reason to stay</li>
        </ul>
        <h3 className={s.subheading}>After the Stream</h3>
        <ul className={s.list}>
          <li><strong>Keep the archive:</strong> Live streams become videos viewers can discover</li>
          <li><strong>Edit the title/thumbnail:</strong> Optimize for search and browse</li>
          <li><strong>Create clips:</strong> Highlight moments for Shorts and social media</li>
        </ul>
      </section>

      {/* Monetization */}
      <section id="monetization" className={s.section}>
        <h2 className={s.sectionTitle}>Live Stream Monetization</h2>
        <p className={s.sectionText}>
          Live streams offer unique monetization opportunities beyond standard ads.
        </p>
        <h3 className={s.subheading}>Monetization Features</h3>
        <ul className={s.list}>
          <li><strong>Super Chat:</strong> Viewers pay to highlight their messages in chat</li>
          <li><strong>Super Stickers:</strong> Animated stickers viewers can purchase</li>
          <li><strong>Super Thanks:</strong> One-time tips on live streams</li>
          <li><strong>Channel memberships:</strong> Recurring support with perks</li>
          <li><strong>Mid-roll ads:</strong> Ads can play during longer live streams</li>
        </ul>
        <h3 className={s.subheading}>Requirements</h3>
        <ul className={s.list}>
          <li><strong>YouTube Partner Program:</strong> Must be monetized to access these features</li>
          <li><strong>Age requirements:</strong> Must be 18+ to receive Super Chat payments</li>
          <li><strong>Regional availability:</strong> Some features are not available in all countries</li>
        </ul>
        <p className={s.sectionText}>
          For more on monetization, see our{" "}
          <Link href="/learn/youtube-monetization-requirements">monetization requirements guide</Link>.
        </p>
      </section>

      {/* Mistakes */}
      <section id="mistakes" className={s.section}>
        <h2 className={s.sectionTitle}>Common Live Streaming Mistakes</h2>
        <ul className={s.list}>
          <li><strong>Poor audio quality:</strong> Viewers tolerate bad video but leave for bad audio</li>
          <li><strong>No schedule:</strong> Streaming randomly means viewers cannot plan to attend</li>
          <li><strong>Ignoring chat:</strong> Viewers come for interaction; talk to them</li>
          <li><strong>Unstable internet:</strong> Buffering and disconnects frustrate viewers</li>
          <li><strong>No preparation:</strong> Know what you will talk about or do</li>
          <li><strong>Too long without breaks:</strong> Very long streams need pacing</li>
          <li><strong>Not promoting beforehand:</strong> Your audience needs to know you are going live</li>
        </ul>
      </section>

      {/* CTA */}
      <div className={s.highlight}>
        <p>
          <strong>Ready to go live?</strong> Start simple with a webcam stream,
          engage with your chat, and improve your setup over time. Consistency
          builds a live audience faster than production quality.
        </p>
      </div>
    </>
  );
}
