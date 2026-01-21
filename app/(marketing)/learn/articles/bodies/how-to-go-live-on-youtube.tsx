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
          can generate revenue through Super Chat and memberships. Unlike pre-recorded 
          videos, live streams create a sense of urgency and exclusivity that keeps 
          viewers engaged.
        </p>
        <p className={s.sectionText}>
          Live streaming also provides unique algorithmic benefits. YouTube often promotes 
          live content in the Explore tab and sends notifications to your subscribers. 
          After your stream ends, the replay becomes a regular video that continues 
          generating views. This means one live stream can work double duty: engaging 
          your community live and attracting new viewers later.
        </p>
        <p className={s.sectionText}>
          This guide covers everything you need to start streaming: requirements,
          setup options, best practices, and strategies to grow your live audience.
          Whether you are a complete beginner or looking to improve your existing 
          streams, you will find actionable advice here.
        </p>
      </section>

      {/* Requirements */}
      <section id="requirements" className={s.section}>
        <h2 className={s.sectionTitle}>Requirements to Go Live</h2>
        <p className={s.sectionText}>
          Before you can start streaming, you need to meet YouTube&apos;s requirements 
          and have the basic equipment ready. Here is what you need:
        </p>
        <h3 className={s.subheading}>Account Requirements</h3>
        <ul className={s.list}>
          <li>
            <strong>Verified channel:</strong> You need a verified YouTube account, which 
            requires phone verification. This is free and takes just a few minutes.
          </li>
          <li>
            <strong>No live streaming restrictions:</strong> Your channel must not have any 
            recent community guideline strikes. Even one active strike can disable live 
            streaming temporarily.
          </li>
          <li>
            <strong>24-hour wait:</strong> First-time streamers must enable live streaming 
            and wait 24 hours before they can actually go live. Plan ahead and enable this 
            before you need it.
          </li>
          <li>
            <strong>Mobile requirement:</strong> To go live from the YouTube mobile app, 
            you need at least 50 subscribers. Desktop streaming has no subscriber requirement.
          </li>
        </ul>
        <h3 className={s.subheading}>Equipment Basics</h3>
        <p className={s.sectionText}>
          You do not need expensive equipment to start streaming. Here is what actually 
          matters:
        </p>
        <ul className={s.list}>
          <li>
            <strong>Camera:</strong> Your webcam, phone camera, or any camera that can 
            connect to your computer works. Built-in laptop webcams are fine for starting 
            out. Upgrade only when your audience grows and you want better quality.
          </li>
          <li>
            <strong>Microphone:</strong> Audio quality matters more than video quality. 
            Viewers will tolerate lower resolution video but will leave if audio is hard 
            to hear. A basic USB microphone dramatically improves quality over built-in 
            laptop mics.
          </li>
          <li>
            <strong>Internet:</strong> You need a stable connection with at least 3 Mbps 
            upload speed for 720p streaming. For 1080p, aim for 10 Mbps or higher. Use 
            a wired ethernet connection instead of WiFi whenever possible.
          </li>
          <li>
            <strong>Lighting:</strong> Good lighting makes more difference than an expensive 
            camera. Face a window for natural light, or use a simple ring light. Avoid 
            having bright light sources behind you.
          </li>
        </ul>
        <h3 className={s.subheading}>How to Enable Live Streaming</h3>
        <p className={s.sectionText}>
          Follow these steps to enable live streaming on your YouTube channel:
        </p>
        <ol className={s.numberedList}>
          <li>Go to YouTube Studio at studio.youtube.com</li>
          <li>Click the Create button (camera icon with plus), then Go live</li>
          <li>If prompted, verify your channel by entering your phone number</li>
          <li>Wait 24 hours for live streaming to be fully enabled</li>
          <li>After 24 hours, return to Go live to start your first stream</li>
        </ol>
        <p className={s.sectionText}>
          Enable live streaming now, even if you do not plan to stream immediately. 
          That way the 24-hour waiting period is already complete when you are ready.
        </p>
      </section>

      {/* Desktop Streaming */}
      <section id="desktop-streaming" className={s.section}>
        <h2 className={s.sectionTitle}>Go Live from Desktop</h2>
        <p className={s.sectionText}>
          Desktop streaming gives you the most options and control. You can stream 
          directly through YouTube or use external streaming software for more features.
        </p>
        <h3 className={s.subheading}>Webcam Streaming (Simplest Option)</h3>
        <p className={s.sectionText}>
          This is the fastest way to go live. No extra software needed.
        </p>
        <ol className={s.numberedList}>
          <li>Go to YouTube Studio at studio.youtube.com</li>
          <li>Click the Create button (camera icon with plus), then Go live</li>
          <li>Select Webcam as your streaming method</li>
          <li>Add a compelling title that tells viewers what the stream is about</li>
          <li>Write a description with relevant keywords for discoverability</li>
          <li>Select your privacy settings (Public for maximum reach)</li>
          <li>Choose or upload a custom thumbnail</li>
          <li>Click Go live when you are ready to start</li>
        </ol>
        <p className={s.sectionText}>
          Webcam streaming is perfect for casual streams, Q&amp;A sessions, talking 
          head content, and when you want to go live quickly without technical setup.
        </p>
        <h3 className={s.subheading}>Streaming Software (More Control)</h3>
        <p className={s.sectionText}>
          Streaming software like OBS gives you control over scenes, overlays, 
          multiple cameras, and professional production features.
        </p>
        <ol className={s.numberedList}>
          <li>In YouTube Studio, click Create, then Go live</li>
          <li>Select Streaming software as your method</li>
          <li>Copy your Stream key (keep this private; it is like a password)</li>
          <li>Open your streaming software (OBS, Streamlabs, etc.)</li>
          <li>Paste the stream key into the software settings</li>
          <li>Configure your scenes and sources in the software</li>
          <li>Start streaming from the software (not from YouTube)</li>
        </ol>
        <p className={s.sectionText}>
          Use streaming software when you need screen sharing, multiple camera angles, 
          overlays, alerts, or any production features beyond a simple webcam stream.
        </p>
      </section>

      {/* Mobile Streaming */}
      <section id="mobile-streaming" className={s.section}>
        <h2 className={s.sectionTitle}>Go Live from Mobile</h2>
        <p className={s.sectionText}>
          Mobile streaming is great for on-the-go content, behind-the-scenes footage,
          events, and casual Q&amp;A sessions. It requires less setup but offers 
          fewer production features than desktop.
        </p>
        <h3 className={s.subheading}>Mobile Requirements</h3>
        <ul className={s.list}>
          <li>
            <strong>50+ subscribers</strong> to go live from the YouTube mobile app. 
            This requirement helps prevent spam and ensures you have some audience.
          </li>
          <li>
            <strong>YouTube app</strong> installed and updated to the latest version.
          </li>
          <li>
            <strong>Good connection:</strong> Strong mobile data or WiFi. Test your 
            connection before important streams.
          </li>
        </ul>
        <h3 className={s.subheading}>Steps to Go Live on Mobile</h3>
        <ol className={s.numberedList}>
          <li>Open the YouTube app on your phone</li>
          <li>Tap the plus button (Create) at the bottom of the screen</li>
          <li>Select Go live from the options</li>
          <li>Add a title that describes your stream</li>
          <li>Write a brief description</li>
          <li>Choose privacy settings (Public, Unlisted, or Private)</li>
          <li>Take a photo or upload a thumbnail</li>
          <li>Tap Go live to start streaming</li>
        </ol>
        <p className={s.sectionText}>
          Mobile streams are simpler but have fewer features than desktop. The camera 
          faces you by default, but you can flip it to show your surroundings. Audio 
          uses your phone&apos;s microphone unless you connect an external mic.
        </p>
        <h3 className={s.subheading}>When to Use Mobile vs Desktop</h3>
        <ul className={s.list}>
          <li>
            <strong>Use mobile for:</strong> Outdoor content, events, travel vlogs, 
            quick Q&amp;A sessions, casual behind-the-scenes content.
          </li>
          <li>
            <strong>Use desktop for:</strong> Gaming, tutorials, screen sharing, 
            professional production, multi-camera setups, content with overlays.
          </li>
        </ul>
      </section>

      {/* Streaming Software */}
      <section id="streaming-software" className={s.section}>
        <h2 className={s.sectionTitle}>Streaming Software Options</h2>
        <p className={s.sectionText}>
          Streaming software gives you control over scenes, overlays, transitions, and 
          production quality. Here are the most popular options:
        </p>
        <h3 className={s.subheading}>OBS Studio (Free)</h3>
        <p className={s.sectionText}>
          OBS (Open Broadcaster Software) is free, open-source, and the most widely used 
          streaming software. It works on Windows, Mac, and Linux. The learning curve is 
          moderate, but countless tutorials are available online. OBS is highly customizable 
          and supports plugins for additional features.
        </p>
        <h3 className={s.subheading}>Streamlabs (Free with Paid Features)</h3>
        <p className={s.sectionText}>
          Streamlabs is built on OBS but adds a more user-friendly interface, built-in 
          alerts, themes, and donation features. It is popular with gaming streamers. 
          The free version works well for most creators, with premium features available 
          for advanced needs.
        </p>
        <h3 className={s.subheading}>XSplit (Paid)</h3>
        <p className={s.sectionText}>
          XSplit is a paid option with a polished interface and professional features. 
          It is known for stability and ease of use. Good for creators who want reliable 
          software without extensive configuration.
        </p>
        <h3 className={s.subheading}>Ecamm Live (Mac Only, Paid)</h3>
        <p className={s.sectionText}>
          Ecamm Live is designed specifically for Mac users. It excels at interviews, 
          multi-camera setups, and professional-looking productions. The interface is 
          intuitive for Mac users familiar with Apple software.
        </p>
        <h3 className={s.subheading}>Which Software to Choose</h3>
        <ul className={s.list}>
          <li>
            <strong>Start with OBS Studio</strong> if you want free, powerful software 
            and are willing to learn.
          </li>
          <li>
            <strong>Try Streamlabs</strong> if you want easier setup with built-in 
            alerts and themes.
          </li>
          <li>
            <strong>Consider paid options</strong> once you are streaming regularly and 
            want specific features or support.
          </li>
        </ul>
      </section>

      {/* Stream Settings */}
      <section id="stream-settings" className={s.section}>
        <h2 className={s.sectionTitle}>Optimal Stream Settings</h2>
        <p className={s.sectionText}>
          The right settings balance video quality with your internet connection and 
          computer capabilities. Here are recommended settings for different scenarios:
        </p>
        <h3 className={s.subheading}>Resolution and Bitrate</h3>
        <ul className={s.list}>
          <li>
            <strong>720p at 30fps:</strong> Use 2,500 to 4,000 kbps bitrate. This works 
            with most internet connections and is good for talking head content.
          </li>
          <li>
            <strong>1080p at 30fps:</strong> Use 4,500 to 6,000 kbps bitrate. Requires 
            faster upload speed but looks sharper on larger screens.
          </li>
          <li>
            <strong>1080p at 60fps:</strong> Use 4,500 to 9,000 kbps bitrate. Best for 
            gaming content where smooth motion matters.
          </li>
        </ul>
        <p className={s.sectionText}>
          If you experience buffering or dropped frames, lower your bitrate or resolution. 
          A stable 720p stream is better than a stuttering 1080p stream.
        </p>
        <h3 className={s.subheading}>Internet Requirements</h3>
        <ul className={s.list}>
          <li>
            <strong>Minimum:</strong> 3 Mbps upload speed for stable 720p streaming.
          </li>
          <li>
            <strong>Recommended:</strong> 10 Mbps or higher upload for reliable 1080p.
          </li>
          <li>
            <strong>Use wired ethernet</strong> instead of WiFi whenever possible. WiFi 
            is more prone to interference and drops.
          </li>
          <li>
            <strong>Test before important streams</strong> using a speed test and a 
            short test stream.
          </li>
        </ul>
        <h3 className={s.subheading}>Audio Settings</h3>
        <ul className={s.list}>
          <li>
            <strong>Sample rate:</strong> Use 44.1 kHz or 48 kHz. Both work well.
          </li>
          <li>
            <strong>Audio bitrate:</strong> 128 to 320 kbps for clear audio.
          </li>
          <li>
            <strong>Test audio levels</strong> before going live. Your voice should be 
            clearly audible without peaking into distortion.
          </li>
          <li>
            <strong>Monitor with headphones</strong> to catch audio issues before your 
            audience does.
          </li>
        </ul>
      </section>

      {/* Growing Live Audience */}
      <section id="growing-live-audience" className={s.section}>
        <h2 className={s.sectionTitle}>Growing Your Live Audience</h2>
        <p className={s.sectionText}>
          Building a live streaming audience requires different strategies than growing 
          through uploaded videos. Live viewers need to know when to show up.
        </p>
        <h3 className={s.subheading}>Before the Stream</h3>
        <ul className={s.list}>
          <li>
            <strong>Announce in advance:</strong> Use community posts, social media, and 
            your video outros to tell viewers when your next stream will be. Give at 
            least 24 hours notice.
          </li>
          <li>
            <strong>Schedule streams:</strong> YouTube lets you create scheduled live 
            events. This creates a countdown page that viewers can set reminders for.
          </li>
          <li>
            <strong>Stream at consistent times:</strong> Pick a day and time, then stick 
            to it. Viewers will build a habit of tuning in if they know when to expect you.
          </li>
          <li>
            <strong>Write compelling titles:</strong> Give people a reason to watch live 
            rather than catching the replay. Exclusive reveals, live Q&amp;A, special 
            guests, or limited-time content all create urgency.
          </li>
        </ul>
        <h3 className={s.subheading}>During the Stream</h3>
        <ul className={s.list}>
          <li>
            <strong>Engage with chat:</strong> This is the main reason people watch live. 
            Respond to comments, answer questions, and make viewers feel heard.
          </li>
          <li>
            <strong>Acknowledge viewers by name:</strong> When someone joins, greet them. 
            When someone asks a question, use their name in your response. This builds 
            personal connection.
          </li>
          <li>
            <strong>Create interactive moments:</strong> Polls, live Q&amp;A segments, 
            viewer challenges, and collaborative decisions keep viewers engaged.
          </li>
          <li>
            <strong>Provide value:</strong> Even casual streams should give viewers a 
            reason to stay. Entertainment, information, community, or exclusive access 
            all count as value.
          </li>
          <li>
            <strong>Encourage sharing:</strong> Ask viewers to invite friends or share 
            in communities where the content would be relevant.
          </li>
        </ul>
        <h3 className={s.subheading}>After the Stream</h3>
        <ul className={s.list}>
          <li>
            <strong>Keep the archive:</strong> Your live stream automatically becomes a 
            video that viewers can discover later. This extends the value of your effort.
          </li>
          <li>
            <strong>Edit the title and thumbnail:</strong> The live title might not work 
            for the replay. Optimize for search and browse discovery.
          </li>
          <li>
            <strong>Create clips:</strong> Pull out highlights for YouTube Shorts and 
            social media. This promotes your streams to new audiences.
          </li>
          <li>
            <strong>Announce the next stream:</strong> In the video description or 
            pinned comment, tell viewers when to catch the next live.
          </li>
        </ul>
      </section>

      {/* Monetization */}
      <section id="monetization" className={s.section}>
        <h2 className={s.sectionTitle}>Live Stream Monetization</h2>
        <p className={s.sectionText}>
          Live streams offer unique monetization opportunities beyond standard video ads.
          These features turn engaged viewers into direct supporters.
        </p>
        <h3 className={s.subheading}>Monetization Features</h3>
        <ul className={s.list}>
          <li>
            <strong>Super Chat:</strong> Viewers pay to highlight their messages in chat. 
            The message appears pinned and colored based on the amount. This is the most 
            common live monetization feature.
          </li>
          <li>
            <strong>Super Stickers:</strong> Animated stickers viewers can purchase during 
            streams. These are less common than Super Chat but add fun to streams.
          </li>
          <li>
            <strong>Super Thanks:</strong> One-time tips viewers can send during live 
            streams or on regular videos.
          </li>
          <li>
            <strong>Channel memberships:</strong> Recurring monthly support from viewers 
            in exchange for member perks like badges, emotes, and exclusive content.
          </li>
          <li>
            <strong>Mid-roll ads:</strong> Ads can play during longer live streams. You 
            control when to run ad breaks.
          </li>
        </ul>
        <h3 className={s.subheading}>Monetization Requirements</h3>
        <ul className={s.list}>
          <li>
            <strong>YouTube Partner Program:</strong> You must be accepted into YPP to 
            access these monetization features. This requires 1,000 subscribers and 
            4,000 watch hours.
          </li>
          <li>
            <strong>Age requirements:</strong> You must be 18 or older to receive Super 
            Chat and Super Sticker payments.
          </li>
          <li>
            <strong>Regional availability:</strong> Some features are not available in 
            all countries. Check YouTube&apos;s documentation for your region.
          </li>
        </ul>
        <p className={s.sectionText}>
          For more on monetization thresholds and strategies, see our{" "}
          <Link href="/learn/youtube-monetization-requirements">
            monetization requirements guide
          </Link>.
        </p>
        <h3 className={s.subheading}>Tips for Earning from Streams</h3>
        <ul className={s.list}>
          <li>
            <strong>Acknowledge supporters:</strong> When someone sends a Super Chat, 
            read their message and thank them by name. This encourages others to 
            participate.
          </li>
          <li>
            <strong>Create Super Chat moments:</strong> Some streamers run segments 
            where they answer Super Chat questions first. This creates an incentive.
          </li>
          <li>
            <strong>Offer member perks:</strong> If you have channel memberships, remind 
            viewers of the benefits during streams without being pushy.
          </li>
        </ul>
      </section>

      {/* Stream Ideas */}
      <section id="stream-ideas" className={s.section}>
        <h2 className={s.sectionTitle}>Live Stream Ideas for Any Niche</h2>
        <p className={s.sectionText}>
          Not sure what to stream? Here are ideas that work across different content types:
        </p>
        <h3 className={s.subheading}>Educational Niches</h3>
        <ul className={s.list}>
          <li>Live tutorials where viewers can ask questions in real-time</li>
          <li>Office hours or Q&amp;A sessions on your topic</li>
          <li>Live project building or demonstrations</li>
          <li>Review and feedback sessions on viewer submissions</li>
          <li>Explaining news or updates in your field</li>
        </ul>
        <h3 className={s.subheading}>Entertainment Niches</h3>
        <ul className={s.list}>
          <li>Behind-the-scenes of your content creation process</li>
          <li>Live reactions to new releases or events</li>
          <li>Gaming with viewers or challenges</li>
          <li>Casual hangouts and conversation</li>
          <li>Collaborations with other creators</li>
        </ul>
        <h3 className={s.subheading}>Creative Niches</h3>
        <ul className={s.list}>
          <li>Live creating sessions: drawing, coding, cooking, crafting</li>
          <li>Process breakdowns and tutorials</li>
          <li>Viewer-suggested projects or challenges</li>
          <li>Portfolio or work reviews</li>
        </ul>
      </section>

      {/* Mistakes */}
      <section id="mistakes" className={s.section}>
        <h2 className={s.sectionTitle}>Common Live Streaming Mistakes</h2>
        <p className={s.sectionText}>
          Avoid these common mistakes that hurt live stream quality and growth:
        </p>
        <h3 className={s.subheading}>Poor Audio Quality</h3>
        <p className={s.sectionText}>
          Viewers tolerate lower video quality, but they leave immediately for bad audio. 
          Echoing rooms, background noise, and quiet microphones are stream killers. 
          Test your audio before every stream and invest in a basic external microphone.
        </p>
        <h3 className={s.subheading}>No Consistent Schedule</h3>
        <p className={s.sectionText}>
          Streaming randomly means viewers cannot plan to attend. Pick a time and stick 
          to it. Even once a week at the same time builds viewer habits better than 
          three random streams per week.
        </p>
        <h3 className={s.subheading}>Ignoring Chat</h3>
        <p className={s.sectionText}>
          The main reason people watch live instead of waiting for the replay is 
          interaction. If you ignore chat, viewers have no reason to watch live. 
          Dedicate attention to reading and responding to comments throughout your stream.
        </p>
        <h3 className={s.subheading}>Unstable Internet</h3>
        <p className={s.sectionText}>
          Buffering and disconnections frustrate viewers and hurt your reputation for 
          reliability. Test your connection before streaming, use wired ethernet when 
          possible, and have a backup plan for technical issues.
        </p>
        <h3 className={s.subheading}>No Preparation</h3>
        <p className={s.sectionText}>
          Going live without a plan leads to awkward silences and unfocused content. 
          Even casual streams benefit from a loose outline. Know what you will talk 
          about or do, and have backup topics ready.
        </p>
        <h3 className={s.subheading}>Not Promoting Beforehand</h3>
        <p className={s.sectionText}>
          Your audience needs to know you are going live. Post announcements on your 
          community tab, social media, and at the end of your recent videos. Schedule 
          streams in advance so viewers can set reminders.
        </p>
        <h3 className={s.subheading}>Streaming Too Long Without Structure</h3>
        <p className={s.sectionText}>
          Very long streams need pacing and segments. Viewers drift in and out. Create 
          natural break points, recurring segments, or milestones to maintain energy 
          and give viewers entry points.
        </p>
      </section>

      {/* Technical Troubleshooting */}
      <section id="troubleshooting" className={s.section}>
        <h2 className={s.sectionTitle}>Technical Troubleshooting</h2>
        <p className={s.sectionText}>
          Technical issues happen to everyone. Here is how to handle common problems:
        </p>
        <h3 className={s.subheading}>Stream Is Buffering or Laggy</h3>
        <ul className={s.list}>
          <li>Lower your bitrate in streaming software settings</li>
          <li>Reduce resolution from 1080p to 720p</li>
          <li>Close other programs using internet bandwidth</li>
          <li>Switch to wired ethernet if using WiFi</li>
          <li>Restart your router if issues persist</li>
        </ul>
        <h3 className={s.subheading}>Audio Is Not Working</h3>
        <ul className={s.list}>
          <li>Check that your microphone is selected in streaming software</li>
          <li>Verify the microphone is not muted in software or system settings</li>
          <li>Unplug and replug USB microphones</li>
          <li>Restart streaming software</li>
          <li>Test audio in another application to isolate the issue</li>
        </ul>
        <h3 className={s.subheading}>Video Is Black or Frozen</h3>
        <ul className={s.list}>
          <li>Check camera permissions in your system settings</li>
          <li>Ensure no other application is using the camera</li>
          <li>Try a different USB port for USB cameras</li>
          <li>Restart streaming software</li>
          <li>Update camera drivers if available</li>
        </ul>
        <h3 className={s.subheading}>Stream Disconnected</h3>
        <ul className={s.list}>
          <li>Check your internet connection immediately</li>
          <li>YouTube allows you to resume a stream after disconnection</li>
          <li>Consider having a phone hotspot as backup</li>
          <li>Inform viewers via community post if you cannot resume</li>
        </ul>
      </section>

      {/* CTA */}
      <div className={s.highlight}>
        <p>
          <strong>Ready to go live?</strong> Start simple with a webcam stream,
          engage with your chat, and improve your setup over time. Consistency
          builds a live audience faster than production quality. Pick a time, 
          announce it, and show up.
        </p>
      </div>
    </>
  );
}
