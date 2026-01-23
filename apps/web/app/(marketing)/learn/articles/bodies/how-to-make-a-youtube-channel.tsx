/**
 * Body content for How to Make a YouTube Channel article.
 * Server component - no "use client" directive.
 *
 * Refactored: Magazine-style layout with visual variety, setup tiles,
 * comparison panels, and playful inline SVG illustrations.
 */

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import type { BodyProps } from "./index";

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* Why Start */}
      <section id="why-start" className="sectionOpen">
        <p className={s.sectionText} style={{ fontSize: "1.125rem" }}>
          YouTube is the second largest search engine and the second most
          visited website in the world. Over 2 billion logged-in users visit
          every month. Starting a channel gives you access to this audience and
          the opportunity to build something that grows over time.
        </p>

        {/* Channel Blueprint Visual */}
        <div className="inlineIllustration">
          <ChannelBlueprintVisual />
        </div>

        <p className={s.sectionText}>
          Unlike social media posts that disappear from feeds within hours,
          YouTube videos can bring in views for years. A video you upload today
          might still be generating views, subscribers, and revenue five years
          from now. This compounding effect is what makes YouTube unique.
        </p>

        <p className={s.sectionText}>
          The barrier to entry is low. Your smartphone and decent lighting are
          enough to begin. What you need is consistency, willingness to learn,
          and patience. Most successful channels took years to build.
        </p>

        <h3 className={s.subheading}>What YouTube Can Offer</h3>
        <div className="offerGrid">
          <OfferCard
            title="Reach"
            text="Access to billions of potential viewers worldwide."
          />
          <OfferCard
            title="Revenue"
            text="Ads, sponsorships, memberships, and your own products."
          />
          <OfferCard
            title="Authority"
            text="Position yourself as an expert and attract opportunities."
          />
          <OfferCard
            title="Community"
            text="Build a loyal audience that follows your journey."
          />
          <OfferCard
            title="Longevity"
            text="Content that continues working for you years later."
          />
          <OfferCard
            title="Creative Freedom"
            text="Control your format, schedule, and message."
          />
        </div>
      </section>

      {/* Setup Checklist */}
      <section id="setup-checklist" className="sectionTinted">
        <h2 className={s.sectionTitle}>Channel Setup Checklist</h2>
        <p className={s.sectionText}>
          You can create a YouTube channel and have it ready for content
          quickly. Here is the complete setup checklist, broken into three
          phases.
        </p>

        {/* Quick Setup Clipboard Visual */}
        <div className="inlineIllustration">
          <SetupClipboardVisual />
        </div>

        {/* Phase 1: Create */}
        <div className="setupPhase">
          <h4 className="setupPhase__title">Phase 1: Create</h4>
          <div className="setupTiles">
            <SetupTile
              step={1}
              text="Sign in to YouTube with a Google account. If you do not have one, create it at accounts.google.com."
            />
            <SetupTile
              step={2}
              text="Click your profile icon in the top right corner of YouTube."
            />
            <SetupTile
              step={3}
              text="Select Create a channel from the dropdown menu."
            />
          </div>
        </div>

        {/* Phase 2: Identity */}
        <div className="setupPhase">
          <h4 className="setupPhase__title">Phase 2: Identity</h4>
          <div className="setupTiles">
            <SetupTile
              step={4}
              text="Choose your channel name. Use your name for a personal brand, or create a custom name for a topic-based channel."
            />
            <SetupTile
              step={5}
              text="Upload a profile picture (at least 800x800 pixels). A clear headshot or recognizable logo works best."
            />
            <SetupTile
              step={6}
              text="Add a banner image (2560x1440 pixels recommended). Your banner should communicate what your channel is about."
            />
            <SetupTile
              step={7}
              text="Write a channel description. Explain what viewers will find and who it is for. Include relevant keywords naturally."
            />
          </div>
        </div>

        {/* Phase 3: Ready */}
        <div className="setupPhase">
          <h4 className="setupPhase__title">Phase 3: Ready</h4>
          <div className="setupTiles">
            <SetupTile
              step={8}
              text="Add channel links to your website, social media, or other relevant pages."
            />
            <SetupTile
              step={9}
              text="Create a channel trailer (optional). A short video introducing your channel to new visitors. You can add this later."
            />
            <SetupTile
              step={10}
              text="Plan your first video. Do not wait for perfect. Your first video does not need to be great, it just needs to exist."
            />
          </div>
        </div>
      </section>

      {/* Create Account: Personal vs Brand */}
      <section id="create-account" className="sectionOpen">
        <h2 className={s.sectionTitle}>Personal vs Brand Account</h2>
        <p className={s.sectionText}>
          Every YouTube channel connects to a Google account. If you have a
          Gmail address, you already have a Google account. Here is how to
          choose between account types.
        </p>

        {/* Two-Faced Identity Visual - floated right */}
        <div className="floatRight">
          <TwoFacedIdentityVisual />
        </div>

        <div className="comparisonGrid">
          <div className="comparisonItem comparisonItem--neutral">
            <p className="comparisonItem__label">Personal Channel</p>
            <div className="comparisonItem__content">
              <p>
                <strong>Best for:</strong> Creators building a brand around
                their name and face.
              </p>
              <p>
                <strong>Pros:</strong> Simple to set up, easy to manage, default
                option.
              </p>
              <p>
                <strong>Watch out:</strong> Uses your Google account name, harder
                to transfer.
              </p>
            </div>
          </div>
          <div className="comparisonItem comparisonItem--neutral">
            <p className="comparisonItem__label">Brand Account</p>
            <div className="comparisonItem__content">
              <p>
                <strong>Best for:</strong> Business names, teams, or keeping
                personal Google separate.
              </p>
              <p>
                <strong>Pros:</strong> Custom name, multiple managers, easier to
                transfer ownership.
              </p>
              <p>
                <strong>Watch out:</strong> Slightly more setup, another account
                to track.
              </p>
            </div>
          </div>
        </div>

        <h3 className={s.subheading}>How to Create a Brand Account</h3>
        <div className="steppingStones">
          <div className="steppingStone"><span>1</span>Go to youtube.com</div>
          <div className="steppingStone"><span>2</span>Click Profile</div>
          <div className="steppingStone"><span>3</span>Open Settings</div>
          <div className="steppingStone"><span>4</span>Add/Manage Channels</div>
          <div className="steppingStone"><span>5</span>Create Channel</div>
          <div className="steppingStone steppingStone--final"><span>6</span>Enter your name</div>
        </div>

        <div className="realTalk">
          <p className="realTalk__label">Keep in mind</p>
          <p className="realTalk__text">
            You can convert a personal channel to a Brand Account later. Most
            creators start personal and migrate if needed.
          </p>
        </div>
      </section>

      {/* Create Channel Step by Step */}
      <section id="create-channel" className="sectionOpen">
        <h2 className={s.sectionTitle}>Create Your Channel Step by Step</h2>
        <p className={s.sectionText}>
          Here is the detailed process to create your channel. This takes just a
          few clicks.
        </p>

        {/* Channel Creation Flow Visual - left aligned */}
        <div className="floatLeft">
          <ChannelCreationFlowVisual />
        </div>

        <p className={s.sectionText}>
          Start at youtube.com and sign in with your Google account. Click your
          profile icon in the top right corner, then select "Create a channel"
          from the dropdown menu. Confirm your name (or use a custom name for a
          Brand Account), and click Create.
        </p>

        <div className="funCallout">
          <p className="funCallout__text">
            <strong>What matters here:</strong> A complete profile and a clear
            promise. YouTube will guide you to customize your channel right
            after creation. Do not skip this step.
          </p>
        </div>
      </section>

      {/* Channel Customization */}
      <section id="channel-customization" className="sectionTinted">
        <h2 className={s.sectionTitle}>Channel Customization Guide</h2>
        <p className={s.sectionText}>
          Your channel page is like a homepage for your content. When someone
          discovers a video and considers subscribing, they often visit your
          channel page first.
        </p>

        {/* Basic Info Panel */}
        <div className="customizationPanel">
          <h3 className="customizationPanel__title">Basic Info</h3>
          <div className="customizationPanel__cards">
            <div className="customizationCard">
              <strong>Channel Name</strong>
              <p>
                Memorable, easy to spell, relevant to your content. Avoid
                numbers and special characters.
              </p>
            </div>
            <div className="customizationCard">
              <strong>Handle (@username)</strong>
              <p>
                Short, consistent with your brand across platforms. Appears in
                URLs and mentions.
              </p>
            </div>
            <div className="customizationCard">
              <strong>Description</strong>
              <p>
                2-3 sentences explaining what viewers get if they subscribe.
                Include relevant keywords naturally.
              </p>
            </div>
          </div>
        </div>

        {/* Branding Panel */}
        <div className="customizationPanel">
          <h3 className="customizationPanel__title">Branding Elements</h3>

          {/* Crop Simulator Visual */}
          <div className="inlineIllustration">
            <CropSimulatorVisual />
          </div>

          <div className="customizationPanel__cards">
            <div className="customizationCard">
              <strong>Profile Picture</strong>
              <p>
                800x800 pixels minimum. Clear face shot or recognizable logo.
                Make sure it reads at small sizes.
              </p>
            </div>
            <div className="customizationCard">
              <strong>Banner Image</strong>
              <p>
                2560x1440 pixels. Include your channel name or upload schedule.
                Remember: cropped differently on each device.
              </p>
            </div>
            <div className="customizationCard">
              <strong>Video Watermark</strong>
              <p>
                Optional small logo on your videos. Helps with branding and can
                include a subscribe button.
              </p>
            </div>
          </div>
        </div>

        {/* Channel Trailer - Mini Script Card */}
        <div className="scriptCard">
          <h4 className="scriptCard__title">Channel Trailer Script (60-90 sec)</h4>
          <div className="scriptCard__beats">
            <div className="scriptCard__beat">
              <span className="scriptCard__beatNum">1</span>
              <div>
                <strong>Intro</strong>
                <p>Who you are and what makes this channel unique.</p>
              </div>
            </div>
            <div className="scriptCard__beat">
              <span className="scriptCard__beatNum">2</span>
              <div>
                <strong>What you will learn</strong>
                <p>The specific value viewers get from subscribing.</p>
              </div>
            </div>
            <div className="scriptCard__beat">
              <span className="scriptCard__beatNum">3</span>
              <div>
                <strong>Why subscribe</strong>
                <p>Clear call to action with your upload schedule.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* First Video */}
      <section id="first-video" className="sectionOpen">
        <h2 className={s.sectionTitle}>Your First Video</h2>
        <p className={s.sectionText}>
          Your first video is the hardest because everything is new. The good
          news: it does not need to be perfect. It just needs to exist so you
          can learn from making it.
        </p>

        <h3 className={s.subheading}>Pick Your First Format</h3>
        <div className="formatGrid">
          <FormatCard
            title="Introduction"
            desc="Who you are and what the channel covers. Can double as your trailer."
          />
          <FormatCard
            title="Tutorial"
            desc="Teach something you know. Even basics help beginners."
          />
          <FormatCard
            title="Q&A"
            desc="Answer a common question in your niche thoroughly."
          />
          <FormatCard
            title="Review"
            desc="Review something you use and have opinions about."
          />
          <FormatCard
            title="Story"
            desc="Share why you are starting and what you hope to achieve."
          />
        </div>

        <h3 className={s.subheading}>Starter Equipment</h3>

        {/* Starter Kit Visual - right aligned for variety */}
        <div className="floatRight">
          <StarterKitVisual />
        </div>

        <div className="equipmentCards">
          <div className="equipmentCard">
            <strong>Camera</strong>
            <p>
              Your smartphone is fine. Modern phones produce excellent video.
              Only upgrade when camera quality is actually limiting you.
            </p>
          </div>
          <div className="equipmentCard">
            <strong>Audio</strong>
            <p>
              A basic external mic improves quality significantly. A lavalier or
              USB mic works well and costs under $50.
            </p>
          </div>
          <div className="equipmentCard">
            <strong>Lighting</strong>
            <p>
              Natural light from a window is free and effective. Face the window
              so light falls on your face.
            </p>
          </div>
          <div className="equipmentCard">
            <strong>Editing</strong>
            <p>
              Free options like DaVinci Resolve, CapCut, or iMovie work well.
              You do not need expensive software.
            </p>
          </div>
        </div>

        <h3 className={s.subheading}>Recording Tips</h3>
        <div className="doAvoidPanel">
          <div className="doAvoidPanel__col doAvoidPanel__col--do">
            <h4>Do</h4>
            <ul>
              <li>Record in a quiet space with minimal echo</li>
              <li>Film horizontally (landscape) for standard videos</li>
              <li>Keep your phone or camera stable</li>
              <li>Speak clearly and slightly slower than natural</li>
            </ul>
          </div>
          <div className="doAvoidPanel__col doAvoidPanel__col--avoid">
            <h4>Avoid</h4>
            <ul>
              <li>Noisy backgrounds or rooms with hard echo</li>
              <li>Shaky handheld footage without stabilization</li>
              <li>Mumbling or rushing through key points</li>
              <li>Waiting for perfect conditions to start</li>
            </ul>
          </div>
        </div>

        <p className={s.sectionText}>
          For help deciding what to make, see our{" "}
          <Link href="/learn/youtube-video-ideas">video ideas guide</Link>.
        </p>
      </section>

      {/* Uploading Your Video */}
      <section id="uploading" className="sectionTinted">
        <h2 className={s.sectionTitle}>How to Upload Your First Video</h2>
        <p className={s.sectionText}>
          Once you have recorded and edited your video, uploading is
          straightforward. Think of it as a conveyor belt moving your video from
          file to published.
        </p>

        {/* Upload Rocket Launch Visual */}
        <div className="inlineIllustration">
          <UploadRocketVisual />
        </div>

        <div className="uploadStations">
          <UploadStation
            label="YouTube Studio"
            text="Click your profile picture, select YouTube Studio, or go to studio.youtube.com."
          />
          <UploadStation
            label="Upload"
            text="Click the Create button (camera icon with plus), then Upload videos. Drag your file or browse."
          />
          <UploadStation
            label="Title"
            text="Write a clear, compelling title with your main keyword. Keep under 60 characters."
          />
          <UploadStation
            label="Description"
            text="Start with a hook, explain what the video covers, include relevant keywords naturally."
          />
          <UploadStation
            label="Thumbnail"
            text="Upload a custom image. Do not use auto-generated thumbnails."
          />
          <UploadStation
            label="Publish"
            text="Select visibility (Public, Unlisted, or Scheduled) and click Publish."
          />
        </div>

        <p className={s.sectionText}>
          For thumbnail design guidance, see our{" "}
          <Link href="/learn/youtube-thumbnail-best-practices">
            thumbnail best practices guide
          </Link>
          .
        </p>
      </section>

      {/* Channel Settings */}
      <section id="channel-settings" className="sectionOpen">
        <h2 className={s.sectionTitle}>Important Channel Settings</h2>
        <p className={s.sectionText}>
          After setting up your channel, configure these settings to save time
          on future uploads and protect your channel.
        </p>

        {/* Settings Dials Visual - left aligned */}
        <div className="floatLeft">
          <SettingsDialsVisual />
        </div>

        <div className="settingsModules">
          <div className="settingsModule">
            <h4 className="settingsModule__title">Upload Defaults</h4>
            <p className="settingsModule__path">
              YouTube Studio → Settings → Upload defaults
            </p>
            <div className="settingsModule__chips">
              <span>Visibility</span>
              <span>Category</span>
              <span>Language</span>
              <span>License</span>
              <span>Comments</span>
            </div>
          </div>

          <div className="settingsModule">
            <h4 className="settingsModule__title">Permissions</h4>
            <p className="settingsModule__path">
              YouTube Studio → Settings → Permissions
            </p>
            <div className="roleBadges">
              <div className="roleBadge">
                <strong>Manager</strong>
                <span>Full access except deleting the channel</span>
              </div>
              <div className="roleBadge">
                <strong>Editor</strong>
                <span>Edit videos and playlists, not settings</span>
              </div>
              <div className="roleBadge">
                <strong>Viewer</strong>
                <span>See analytics, no changes</span>
              </div>
            </div>
          </div>

          <div className="settingsModule">
            <h4 className="settingsModule__title">Community Settings</h4>
            <p className="settingsModule__path">
              YouTube Studio → Settings → Community
            </p>
            <div className="settingsModule__chips">
              <span>Comment moderation</span>
              <span>Blocked words</span>
              <span>Approved users</span>
              <span>Hidden users</span>
            </div>
          </div>
        </div>
      </section>

      {/* Choosing Your Niche */}
      <section id="niche" className="sectionTinted">
        <h2 className={s.sectionTitle}>Choosing Your Channel Niche</h2>
        <p className={s.sectionText}>
          A niche is the specific topic your channel focuses on. Choosing a
          niche is one of the most important decisions for a new channel.
        </p>

        {/* Niche Venn Diagram Visual - right aligned */}
        <div className="floatRight">
          <NicheVennVisual />
        </div>

        <h3 className={s.subheading}>Why Niche Matters</h3>
        <div className="nicheWhyCards">
          <div className="nicheWhyCard">
            <strong>Viewer Expectations</strong>
            <p>
              When someone subscribes, they bet future videos will be similar.
              A clear niche makes this bet feel safe.
            </p>
          </div>
          <div className="nicheWhyCard">
            <strong>Algorithm Understanding</strong>
            <p>
              YouTube learns what your channel is about and who to show it to.
              Consistent content helps YouTube categorize you accurately.
            </p>
          </div>
          <div className="nicheWhyCard">
            <strong>Authority Building</strong>
            <p>
              Focusing on one area lets you build depth and become known for
              something specific.
            </p>
          </div>
        </div>

        <h3 className={s.subheading}>How to Choose</h3>
        <div className="radarChecklist">
          <div className="radarChecklist__dimension">
            <span className="radarChecklist__label">Demand</span>
            <ul>
              <li>Are there videos with views on this topic?</li>
              <li>Are channels successfully covering this?</li>
            </ul>
          </div>
          <div className="radarChecklist__dimension">
            <span className="radarChecklist__label">Competition</span>
            <ul>
              <li>How saturated is this space?</li>
              <li>Can you differentiate with a unique angle?</li>
            </ul>
          </div>
          <div className="radarChecklist__dimension">
            <span className="radarChecklist__label">Fit</span>
            <ul>
              <li>Do you genuinely enjoy this topic?</li>
              <li>Do you know more than complete beginners?</li>
            </ul>
          </div>
        </div>

        <h3 className={s.subheading}>Popular Niche Categories</h3>
        <div className="categoryGrid">
          <span className="categoryChip">Technology</span>
          <span className="categoryChip">Gaming</span>
          <span className="categoryChip">Personal Finance</span>
          <span className="categoryChip">Health & Fitness</span>
          <span className="categoryChip">Cooking & Food</span>
          <span className="categoryChip">Education</span>
          <span className="categoryChip">DIY & Crafts</span>
          <span className="categoryChip">Travel</span>
          <span className="categoryChip">Productivity</span>
          <span className="categoryChip">Entertainment</span>
        </div>
      </section>

      {/* Mistakes */}
      <section id="mistakes" className="sectionOpen">
        <h2 className={s.sectionTitle}>Common Beginner Mistakes</h2>
        <p className={s.sectionText}>
          Learn from others so you do not have to make these yourself.
        </p>

        {/* Warning Signs Visual - inline, larger and clearer */}
        <div className="inlineIllustration">
          <WarningSignsVisual />
        </div>

        <div className="museumCards">
          <MuseumCard
            title="Waiting for Perfect Equipment"
            text="Your smartphone and free editing software are enough. Better equipment will not fix weak content, and good content can overcome mediocre production."
            fix="Start with what you have. Upgrade when camera quality is the actual bottleneck."
          />
          <MuseumCard
            title="No Niche Focus"
            text="Channels that cover everything struggle to grow. Viewers subscribe expecting more of what they just watched. If your channel is unpredictable, there is no reason to subscribe."
            fix="Pick a focus and stick to it for at least 20 videos before pivoting."
          />
          <MuseumCard
            title="Ignoring Thumbnails and Titles"
            text="Your thumbnail and title determine whether people click. Many beginners spend hours on content and minutes on packaging."
            fix="Study what works in your niche and invest real time in compelling thumbnails."
          />
          <MuseumCard
            title="Inconsistent Uploads"
            text="Posting three videos in one week then nothing for two months confuses viewers and the algorithm."
            fix="Pick a realistic schedule you can maintain. Once a week beats random bursts."
          />
          <MuseumCard
            title="Giving Up Too Early"
            text="Most successful channels took months or years of consistent uploading before gaining traction. The first 50-100 videos are often a learning period."
            fix="Set a goal to reach 50 videos before evaluating whether to continue."
          />
          <MuseumCard
            title="Copying Others Exactly"
            text="Learning from successful creators is good. Copying them exactly produces a worse version of what already exists."
            fix="Find your own voice, format, and perspective. What makes you different is valuable."
          />
        </div>

        {/* Fake Subscribers - Sketchy Vending Machine Visual */}
        <div className="fakeGrowthWarning">
          <div className="inlineIllustration">
            <FakeGrowthVendingVisual />
          </div>
          <div className="fakeGrowthWarning__content">
            <h4>Buying Fake Subscribers or Views</h4>
            <p>
              This destroys your channel. Fake engagement tanks your metrics,
              YouTube detects and penalizes it, and you learn nothing about what
              actually works.
            </p>
            <p>
              See our guide on{" "}
              <Link href="/learn/free-youtube-subscribers">
                why fake growth destroys channels
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section id="next-steps" className="sectionTinted">
        <h2 className={s.sectionTitle}>What to Do After Setup</h2>
        <p className={s.sectionText}>
          Your channel is set up. Here is a roadmap for your first months.
        </p>

        {/* Mountain Climb Roadmap Visual */}
        <div className="inlineIllustration">
          <MountainClimbVisual />
        </div>

        <div className="roadmapCards">
          <div className="roadmapCard">
            <h4 className="roadmapCard__title">This Week</h4>
            <ul className="roadmapCard__list">
              <li>
                <Link href="/learn/youtube-video-ideas">Find video ideas</Link>{" "}
                by researching your niche
              </li>
              <li>Create and upload your first video</li>
              <li>Set up upload defaults to save time</li>
            </ul>
          </div>

          <div className="roadmapCard">
            <h4 className="roadmapCard__title">First Month</h4>
            <ul className="roadmapCard__list">
              <li>Upload 4-8 videos (one to two per week)</li>
              <li>Start learning to read your analytics</li>
              <li>Pay attention to which videos perform better</li>
              <li>Improve your thumbnails with each upload</li>
            </ul>
          </div>

          <div className="roadmapCard">
            <h4 className="roadmapCard__title">First Three Months</h4>
            <ul className="roadmapCard__list">
              <li>
                <Link href="/learn/youtube-channel-audit">
                  Audit your channel
                </Link>{" "}
                to identify what is working
              </li>
              <li>
                Study your niche with{" "}
                <Link href="/learn/youtube-competitor-analysis">
                  competitor analysis
                </Link>
              </li>
              <li>Refine your niche and content focus based on data</li>
            </ul>
          </div>

          <div className="roadmapCard">
            <h4 className="roadmapCard__title">First Year</h4>
            <ul className="roadmapCard__list">
              <li>
                Work toward{" "}
                <Link href="/learn/youtube-monetization-requirements">
                  monetization
                </Link>{" "}
                requirements
              </li>
              <li>Develop your unique style and voice</li>
              <li>Build a library of content that continues attracting viewers</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="sectionAccent">
        <h3
          style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}
        >
          Ready to grow your new channel?
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
          {BRAND.name} helps you find video ideas that work in your niche, track
          what is performing, and identify opportunities you might miss.
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
   INLINE SVG VISUALS
   ================================================ */

/** Channel Blueprint - shows the key components of a channel plan */
function ChannelBlueprintVisual() {
  return (
    <svg
      width="340"
      height="180"
      viewBox="0 0 340 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Channel blueprint showing key components: Name, Promise, Upload Rhythm, Packaging, Community"
    >
      {/* Blueprint background */}
      <rect x="5" y="5" width="330" height="170" rx="8" fill="#1e3a5f" />
      {/* Grid lines */}
      <g stroke="#2d4a6f" strokeWidth="1">
        <line x1="5" y1="45" x2="335" y2="45" />
        <line x1="5" y1="85" x2="335" y2="85" />
        <line x1="5" y1="125" x2="335" y2="125" />
        <line x1="118" y1="5" x2="118" y2="175" />
        <line x1="228" y1="5" x2="228" y2="175" />
      </g>
      {/* Title */}
      <text x="170" y="30" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#60a5fa">
        CHANNEL BLUEPRINT
      </text>
      {/* Box 1: Name */}
      <rect x="20" y="55" width="85" height="22" rx="4" fill="#3b82f6" opacity="0.3" />
      <text x="62" y="70" textAnchor="middle" fontSize="10" fontWeight="600" fill="#93c5fd">
        NAME
      </text>
      {/* Box 2: Promise */}
      <rect x="130" y="55" width="85" height="22" rx="4" fill="#3b82f6" opacity="0.3" />
      <text x="172" y="70" textAnchor="middle" fontSize="10" fontWeight="600" fill="#93c5fd">
        PROMISE
      </text>
      {/* Box 3: Rhythm */}
      <rect x="240" y="55" width="85" height="22" rx="4" fill="#3b82f6" opacity="0.3" />
      <text x="282" y="70" textAnchor="middle" fontSize="10" fontWeight="600" fill="#93c5fd">
        RHYTHM
      </text>
      {/* Box 4: Packaging */}
      <rect x="75" y="95" width="85" height="22" rx="4" fill="#8b5cf6" opacity="0.3" />
      <text x="117" y="110" textAnchor="middle" fontSize="10" fontWeight="600" fill="#c4b5fd">
        PACKAGING
      </text>
      {/* Box 5: Community */}
      <rect x="185" y="95" width="85" height="22" rx="4" fill="#8b5cf6" opacity="0.3" />
      <text x="227" y="110" textAnchor="middle" fontSize="10" fontWeight="600" fill="#c4b5fd">
        COMMUNITY
      </text>
      {/* Dashed lines showing connections */}
      <path d="M62 77 L117 95" stroke="#60a5fa" strokeWidth="1" strokeDasharray="3" />
      <path d="M172 77 L172 95" stroke="#60a5fa" strokeWidth="1" strokeDasharray="3" />
      <path d="M282 77 L227 95" stroke="#60a5fa" strokeWidth="1" strokeDasharray="3" />
      {/* Footer text */}
      <text x="170" y="155" textAnchor="middle" fontSize="9" fill="#64748b">
        Define these before your first video
      </text>
    </svg>
  );
}

/** Quick Setup Clipboard - shows a checklist clipboard */
function SetupClipboardVisual() {
  return (
    <svg
      width="200"
      height="120"
      viewBox="0 0 200 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Setup checklist clipboard"
    >
      {/* Clipboard body */}
      <rect x="40" y="20" width="120" height="90" rx="6" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
      {/* Clipboard clip */}
      <rect x="70" y="12" width="60" height="16" rx="3" fill="#d97706" />
      <rect x="85" y="8" width="30" height="10" rx="2" fill="#92400e" />
      {/* Checklist lines */}
      <rect x="55" y="40" width="10" height="10" rx="2" fill="none" stroke="#92400e" strokeWidth="1.5" />
      <path d="M57 45 L60 48 L64 42" stroke="#22c55e" strokeWidth="2" fill="none" />
      <rect x="70" y="42" width="70" height="6" rx="2" fill="#fde68a" />
      <rect x="55" y="58" width="10" height="10" rx="2" fill="none" stroke="#92400e" strokeWidth="1.5" />
      <path d="M57 63 L60 66 L64 60" stroke="#22c55e" strokeWidth="2" fill="none" />
      <rect x="70" y="60" width="55" height="6" rx="2" fill="#fde68a" />
      <rect x="55" y="76" width="10" height="10" rx="2" fill="none" stroke="#92400e" strokeWidth="1.5" />
      <rect x="70" y="78" width="65" height="6" rx="2" fill="#fde68a" />
      {/* Title */}
      <text x="100" y="108" textAnchor="middle" fontSize="9" fill="#92400e" fontWeight="600">
        Quick Setup
      </text>
    </svg>
  );
}

/** Two-Faced Identity - Personal (face) vs Brand (building) */
function TwoFacedIdentityVisual() {
  return (
    <svg
      width="210"
      height="170"
      viewBox="0 0 210 170"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Two-faced identity showing personal face vs brand building"
    >
      {/* Left side - Personal (Face) - centered at x=45 */}
      <g>
        {/* Face circle */}
        <circle cx="45" cy="50" r="30" fill="#dbeafe" stroke="#3b82f6" strokeWidth="3" />
        {/* Eyes */}
        <circle cx="37" cy="45" r="4" fill="#1e3a5f" />
        <circle cx="53" cy="45" r="4" fill="#1e3a5f" />
        {/* Smile */}
        <path d="M35 58 Q45 66 55 58" stroke="#1e3a5f" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* Hair */}
        <path d="M19 38 Q23 18 45 14 Q67 18 71 38" stroke="#1e3a5f" strokeWidth="3" fill="none" />
        {/* Label */}
        <text x="45" y="100" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#3b82f6">
          Personal
        </text>
        <text x="45" y="118" textAnchor="middle" fontSize="10" fill="#64748b">
          Your name
        </text>
      </g>
      
      {/* VS badge - centered at x=105 (equal distance: 45 to 105 = 60, 105 to 165 = 60) */}
      <g>
        <circle cx="105" cy="50" r="16" fill="white" stroke="#e2e8f0" strokeWidth="2" />
        <text x="105" y="55" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#64748b">
          vs
        </text>
      </g>
      
      {/* Right side - Brand (Building/Logo) - centered at x=165 */}
      <g>
        {/* Building shape */}
        <rect x="142" y="28" width="46" height="48" rx="4" fill="#f3e8ff" stroke="#8b5cf6" strokeWidth="3" />
        {/* Windows */}
        <rect x="149" y="38" width="10" height="10" rx="2" fill="#8b5cf6" />
        <rect x="171" y="38" width="10" height="10" rx="2" fill="#8b5cf6" />
        <rect x="149" y="56" width="10" height="10" rx="2" fill="#8b5cf6" />
        <rect x="171" y="56" width="10" height="10" rx="2" fill="#8b5cf6" />
        {/* Roof/Flag */}
        <path d="M165 28 L165 14 L182 21 L165 28" fill="#8b5cf6" />
        {/* Label */}
        <text x="165" y="100" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#8b5cf6">
          Brand
        </text>
        <text x="165" y="118" textAnchor="middle" fontSize="10" fill="#64748b">
          Custom name
        </text>
      </g>
      
      {/* Note */}
      <text x="105" y="158" textAnchor="middle" fontSize="9" fill="#94a3b8">
        You can switch later
      </text>
    </svg>
  );
}

/** Channel Creation Flow - visual steps */
function ChannelCreationFlowVisual() {
  return (
    <svg
      width="120"
      height="145"
      viewBox="0 0 120 145"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Channel creation flow showing steps from sign in to create"
    >
      {/* Step 1 - YouTube icon */}
      <g>
        <rect x="35" y="5" width="50" height="30" rx="6" fill="#ff0000" />
        <path d="M55 13 L65 20 L55 27 Z" fill="white" />
        <text x="60" y="46" textAnchor="middle" fontSize="9" fill="#64748b">Sign in</text>
      </g>
      
      {/* Arrow down */}
      <path d="M60 50 L60 56 M56 53 L60 58 L64 53" stroke="#cbd5e1" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Step 2 - Profile icon */}
      <g>
        <circle cx="60" cy="74" r="14" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
        <circle cx="60" cy="71" r="5" fill="#94a3b8" />
        <path d="M50 83 Q60 77 70 83" stroke="#94a3b8" strokeWidth="2" fill="none" />
        <text x="60" y="100" textAnchor="middle" fontSize="9" fill="#64748b">Profile</text>
      </g>
      
      {/* Arrow down */}
      <path d="M60 104 L60 110 M56 107 L60 112 L64 107" stroke="#cbd5e1" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Step 3 - Create button */}
      <g>
        <rect x="25" y="118" width="70" height="24" rx="12" fill="#22c55e" />
        <text x="60" y="134" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white">
          + Create
        </text>
      </g>
    </svg>
  );
}


/** Crop Simulator - shows how banner crops on different devices */
function CropSimulatorVisual() {
  return (
    <svg
      width="300"
      height="130"
      viewBox="0 0 300 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Banner cropping preview across desktop, tablet, and mobile"
    >
      {/* Title */}
      <text x="150" y="14" textAnchor="middle" fontSize="10" fill="#94a3b8">
        Keep key info in the safe zone
      </text>
      
      {/* Desktop frame */}
      <g>
        <rect x="10" y="25" width="120" height="70" rx="4" fill="#1e293b" />
        <rect x="14" y="29" width="112" height="50" rx="2" fill="#60a5fa" opacity="0.3" />
        {/* Safe zone */}
        <rect x="30" y="40" width="80" height="28" rx="2" fill="none" stroke="#22c55e" strokeWidth="1" strokeDasharray="3" />
        <text x="70" y="58" textAnchor="middle" fontSize="7" fill="#22c55e">
          SAFE ZONE
        </text>
        <text x="70" y="108" textAnchor="middle" fontSize="9" fill="#64748b">
          Desktop
        </text>
      </g>
      
      {/* Tablet frame */}
      <g>
        <rect x="145" y="25" width="50" height="70" rx="4" fill="#1e293b" />
        <rect x="149" y="29" width="42" height="50" rx="2" fill="#60a5fa" opacity="0.3" />
        <rect x="155" y="40" width="30" height="28" rx="2" fill="none" stroke="#22c55e" strokeWidth="1" strokeDasharray="3" />
        <text x="170" y="108" textAnchor="middle" fontSize="9" fill="#64748b">
          Tablet
        </text>
      </g>
      
      {/* Mobile frame */}
      <g>
        <rect x="215" y="25" width="38" height="70" rx="4" fill="#1e293b" />
        <rect x="219" y="29" width="30" height="50" rx="2" fill="#60a5fa" opacity="0.3" />
        <rect x="222" y="40" width="24" height="28" rx="2" fill="none" stroke="#22c55e" strokeWidth="1" strokeDasharray="3" />
        <text x="234" y="108" textAnchor="middle" fontSize="9" fill="#64748b">
          Mobile
        </text>
      </g>
    </svg>
  );
}

/** Starter Kit - equipment grid style */
function StarterKitVisual() {
  return (
    <svg
      width="140"
      height="140"
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Starter equipment: Phone, Light, Mic, Tripod"
    >
      {/* Background box */}
      <rect x="5" y="5" width="130" height="130" rx="12" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
      
      {/* Grid dividers */}
      <line x1="70" y1="15" x2="70" y2="125" stroke="#e2e8f0" strokeWidth="1" />
      <line x1="15" y1="70" x2="125" y2="70" stroke="#e2e8f0" strokeWidth="1" />
      
      {/* Phone - top left */}
      <g>
        <rect x="27" y="18" width="20" height="32" rx="3" fill="#1e293b" />
        <rect x="29" y="22" width="16" height="22" rx="1" fill="#60a5fa" />
        <text x="37" y="60" textAnchor="middle" fontSize="9" fontWeight="500" fill="#475569">Phone</text>
      </g>
      
      {/* Light - top right */}
      <g>
        <circle cx="105" cy="35" r="14" fill="none" stroke="#eab308" strokeWidth="5" />
        <circle cx="105" cy="35" r="6" fill="#fef08a" />
        <text x="105" y="60" textAnchor="middle" fontSize="9" fontWeight="500" fill="#475569">Light</text>
      </g>
      
      {/* Mic - bottom left */}
      <g>
        <rect x="32" y="80" width="10" height="22" rx="5" fill="#1e293b" />
        <rect x="34" y="102" width="6" height="8" fill="#475569" />
        <text x="37" y="122" textAnchor="middle" fontSize="9" fontWeight="500" fill="#475569">Mic</text>
      </g>
      
      {/* Tripod - bottom right */}
      <g>
        <rect x="101" y="80" width="8" height="16" rx="2" fill="#475569" />
        <path d="M95 94 L105 110 M115 94 L105 110 M105 94 L105 110" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
        <text x="105" y="122" textAnchor="middle" fontSize="9" fontWeight="500" fill="#475569">Tripod</text>
      </g>
    </svg>
  );
}

/** Upload Rocket Launch - video taking off */
function UploadRocketVisual() {
  return (
    <svg
      width="300"
      height="180"
      viewBox="0 0 300 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Video rocket launching from draft to published"
    >
      {/* Launch pad */}
      <rect x="20" y="145" width="100" height="15" rx="4" fill="#334155" />
      <rect x="35" y="140" width="70" height="10" rx="2" fill="#475569" />
      
      {/* Rocket body */}
      <g transform="translate(45, 30)">
        {/* Main body */}
        <path d="M25 0 L35 25 L35 80 L25 95 L15 80 L15 25 Z" fill="#6366f1" />
        {/* Nose cone */}
        <path d="M25 0 L35 25 L15 25 Z" fill="#8b5cf6" />
        {/* Window */}
        <circle cx="25" cy="45" r="8" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" />
        {/* Play button in window */}
        <path d="M22 42 L30 45 L22 48 Z" fill="#3b82f6" />
        {/* Fins */}
        <path d="M15 70 L5 90 L15 85 Z" fill="#a855f7" />
        <path d="M35 70 L45 90 L35 85 Z" fill="#a855f7" />
        {/* Flames */}
        <path d="M18 95 L25 120 L32 95" fill="#f97316" />
        <path d="M20 95 L25 110 L30 95" fill="#fbbf24" />
      </g>
      
      {/* Checklist labels floating up */}
      <g>
        <rect x="130" y="130" width="60" height="20" rx="4" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1" />
        <text x="160" y="144" textAnchor="middle" fontSize="9" fill="#64748b">File</text>
        <path d="M195 140 L200 140" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2" />
        
        <rect x="130" y="100" width="60" height="20" rx="4" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1" />
        <text x="160" y="114" textAnchor="middle" fontSize="9" fill="#3b82f6">Title</text>
        
        <rect x="130" y="70" width="60" height="20" rx="4" fill="#f3e8ff" stroke="#8b5cf6" strokeWidth="1" />
        <text x="160" y="84" textAnchor="middle" fontSize="9" fill="#8b5cf6">Description</text>
        
        <rect x="130" y="40" width="60" height="20" rx="4" fill="#fce7f3" stroke="#ec4899" strokeWidth="1" />
        <text x="160" y="54" textAnchor="middle" fontSize="9" fill="#ec4899">Thumbnail</text>
      </g>
      
      {/* Published badge at top */}
      <g transform="translate(200, 10)">
        <rect x="0" y="0" width="80" height="30" rx="15" fill="#22c55e" />
        <text x="40" y="20" textAnchor="middle" fontSize="11" fontWeight="bold" fill="white">
          Published!
        </text>
      </g>
      
      {/* Stars/sparkles */}
      <circle cx="220" cy="60" r="2" fill="#fbbf24" />
      <circle cx="250" cy="80" r="3" fill="#fbbf24" />
      <circle cx="235" cy="100" r="2" fill="#fbbf24" />
    </svg>
  );
}

/** Settings Dials - three horizontal control dials */
function SettingsDialsVisual() {
  return (
    <svg
      width="160"
      height="100"
      viewBox="0 0 160 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Settings dials for Defaults, Permissions, and Comments"
    >
      {/* Panel background */}
      <rect x="5" y="5" width="150" height="90" rx="10" fill="#1e293b" />
      
      {/* LED indicators */}
      <circle cx="18" cy="18" r="3" fill="#22c55e">
        <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="142" cy="18" r="3" fill="#3b82f6" />
      
      {/* Dial 1: Defaults */}
      <g transform="translate(35, 45)">
        <circle cx="0" cy="0" r="18" fill="#334155" stroke="#475569" strokeWidth="2" />
        <circle cx="0" cy="0" r="12" fill="#1e293b" />
        <line x1="0" y1="-4" x2="0" y2="-14" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
        <text x="0" y="30" textAnchor="middle" fontSize="8" fontWeight="500" fill="#94a3b8">
          Defaults
        </text>
      </g>
      
      {/* Dial 2: Permissions */}
      <g transform="translate(80, 45)">
        <circle cx="0" cy="0" r="18" fill="#334155" stroke="#475569" strokeWidth="2" />
        <circle cx="0" cy="0" r="12" fill="#1e293b" />
        <line x1="0" y1="-4" x2="8" y2="-10" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" />
        <text x="0" y="30" textAnchor="middle" fontSize="8" fontWeight="500" fill="#94a3b8">
          Permissions
        </text>
      </g>
      
      {/* Dial 3: Comments */}
      <g transform="translate(125, 45)">
        <circle cx="0" cy="0" r="18" fill="#334155" stroke="#475569" strokeWidth="2" />
        <circle cx="0" cy="0" r="12" fill="#1e293b" />
        <line x1="0" y1="-4" x2="-6" y2="-12" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
        <text x="0" y="30" textAnchor="middle" fontSize="8" fontWeight="500" fill="#94a3b8">
          Comments
        </text>
      </g>
    </svg>
  );
}

/** Niche Venn Diagram - three overlapping circles */
function NicheVennVisual() {
  return (
    <svg
      width="160"
      height="150"
      viewBox="0 0 160 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Venn diagram showing intersection of Interest, Demand, and Skill"
    >
      {/* Circle 1: Interest (top) - centered at 80, 45 */}
      <circle cx="80" cy="45" r="38" fill="#dbeafe" fillOpacity="0.6" stroke="#3b82f6" strokeWidth="2" />
      <text x="80" y="28" textAnchor="middle" fontSize="10" fontWeight="600" fill="#1d4ed8">
        Interest
      </text>
      
      {/* Circle 2: Demand (bottom left) - centered at 55, 90 */}
      <circle cx="55" cy="90" r="38" fill="#dcfce7" fillOpacity="0.6" stroke="#22c55e" strokeWidth="2" />
      <text x="35" y="115" textAnchor="middle" fontSize="10" fontWeight="600" fill="#166534">
        Demand
      </text>
      
      {/* Circle 3: Skill (bottom right) - centered at 105, 90 */}
      <circle cx="105" cy="90" r="38" fill="#fef3c7" fillOpacity="0.6" stroke="#f59e0b" strokeWidth="2" />
      <text x="125" y="115" textAnchor="middle" fontSize="10" fontWeight="600" fill="#b45309">
        Skill
      </text>
      
      {/* Center sweet spot */}
      <circle cx="80" cy="72" r="14" fill="#6366f1" />
      <text x="80" y="76" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white">
        Niche
      </text>
      
      {/* Arrow pointing to sweet spot */}
      <g transform="translate(115, 35)">
        <path d="M0 0 Q-8 12 -22 24" stroke="#6366f1" strokeWidth="2" fill="none" strokeDasharray="4" />
        <text x="5" y="5" fontSize="8" fill="#6366f1">Sweet spot</text>
      </g>
    </svg>
  );
}

/** Warning Signs - red flag style cards */
function WarningSignsVisual() {
  return (
    <svg
      width="300"
      height="90"
      viewBox="0 0 300 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Warning flags showing common beginner mistakes"
    >
      {/* Card 1: Waiting for Gear */}
      <g>
        <rect x="5" y="10" width="90" height="70" rx="8" fill="#fef2f2" stroke="#fecaca" strokeWidth="2" />
        <circle cx="50" cy="35" r="15" fill="#fee2e2" />
        <text x="50" y="40" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#dc2626">!</text>
        <text x="50" y="62" textAnchor="middle" fontSize="10" fontWeight="600" fill="#991b1b">
          Waiting
        </text>
        <text x="50" y="74" textAnchor="middle" fontSize="9" fill="#b91c1c">
          for gear
        </text>
      </g>
      
      {/* Card 2: No Niche */}
      <g>
        <rect x="105" y="10" width="90" height="70" rx="8" fill="#fef2f2" stroke="#fecaca" strokeWidth="2" />
        <circle cx="150" cy="35" r="15" fill="#fee2e2" />
        <line x1="140" y1="35" x2="160" y2="35" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
        <text x="150" y="62" textAnchor="middle" fontSize="10" fontWeight="600" fill="#991b1b">
          No niche
        </text>
        <text x="150" y="74" textAnchor="middle" fontSize="9" fill="#b91c1c">
          focus
        </text>
      </g>
      
      {/* Card 3: Skipping Thumbnails */}
      <g>
        <rect x="205" y="10" width="90" height="70" rx="8" fill="#fef2f2" stroke="#fecaca" strokeWidth="2" />
        <circle cx="250" cy="35" r="15" fill="#fee2e2" />
        <text x="250" y="40" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#dc2626">X</text>
        <text x="250" y="62" textAnchor="middle" fontSize="10" fontWeight="600" fill="#991b1b">
          Skipping
        </text>
        <text x="250" y="74" textAnchor="middle" fontSize="9" fill="#b91c1c">
          packaging
        </text>
      </g>
    </svg>
  );
}

/** Fake Growth Vending Machine - sketchy vending machine */
function FakeGrowthVendingVisual() {
  return (
    <svg
      width="120"
      height="160"
      viewBox="0 0 120 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Sketchy vending machine selling fake views with out of order sign"
    >
      {/* Machine body */}
      <rect x="10" y="10" width="100" height="140" rx="8" fill="#1e293b" />
      {/* Glass panel */}
      <rect x="20" y="25" width="80" height="70" rx="4" fill="#334155" />
      {/* Fake products */}
      <rect x="28" y="35" width="25" height="20" rx="2" fill="#475569" />
      <text x="40" y="48" textAnchor="middle" fontSize="6" fill="#94a3b8">
        Views
      </text>
      <rect x="58" y="35" width="25" height="20" rx="2" fill="#475569" />
      <text x="70" y="48" textAnchor="middle" fontSize="6" fill="#94a3b8">
        Subs
      </text>
      <rect x="28" y="60" width="25" height="20" rx="2" fill="#475569" />
      <text x="40" y="73" textAnchor="middle" fontSize="6" fill="#94a3b8">
        Likes
      </text>
      <rect x="58" y="60" width="25" height="20" rx="2" fill="#475569" />
      <text x="70" y="73" textAnchor="middle" fontSize="6" fill="#94a3b8">
        Bot
      </text>
      {/* Out of order sign */}
      <g transform="translate(25, 100) rotate(-10)">
        <rect x="0" y="0" width="70" height="30" rx="2" fill="#fef2f2" stroke="#dc2626" strokeWidth="2" />
        <text x="35" y="14" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#dc2626">
          OUT OF
        </text>
        <text x="35" y="25" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#dc2626">
          ORDER
        </text>
      </g>
      {/* X mark */}
      <circle cx="95" cy="25" r="12" fill="#dc2626" />
      <path d="M89 19 L101 31 M101 19 L89 31" stroke="white" strokeWidth="2" />
    </svg>
  );
}

/** Mountain Climb Visual - staircase to success */
function MountainClimbVisual() {
  return (
    <svg
      width="320"
      height="180"
      viewBox="0 0 320 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Mountain climb showing growth journey from Week 1 to Year 1"
    >
      {/* Mountain/staircase path */}
      <path 
        d="M30 160 L30 140 L90 140 L90 110 L160 110 L160 70 L240 70 L240 30 L290 30" 
        stroke="#e2e8f0" 
        strokeWidth="4" 
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Step 1: Week 1 */}
      <g>
        <circle cx="30" cy="155" r="18" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
        <text x="30" y="152" textAnchor="middle" fontSize="7" fontWeight="600" fill="#166534">Week</text>
        <text x="30" y="162" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#166534">1</text>
        {/* Hiker figure */}
        <circle cx="55" cy="130" r="6" fill="#475569" />
        <line x1="55" y1="136" x2="55" y2="148" stroke="#475569" strokeWidth="2" />
        <line x1="55" y1="140" x2="48" y2="145" stroke="#475569" strokeWidth="2" />
        <line x1="55" y1="140" x2="62" y2="145" stroke="#475569" strokeWidth="2" />
        <line x1="55" y1="148" x2="50" y2="158" stroke="#475569" strokeWidth="2" />
        <line x1="55" y1="148" x2="60" y2="158" stroke="#475569" strokeWidth="2" />
      </g>
      
      {/* Step 2: Month 1 */}
      <g>
        <circle cx="90" cy="125" r="18" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" />
        <text x="90" y="122" textAnchor="middle" fontSize="7" fontWeight="600" fill="#1d4ed8">Month</text>
        <text x="90" y="132" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1d4ed8">1</text>
      </g>
      
      {/* Step 3: Month 3 */}
      <g>
        <circle cx="160" cy="85" r="18" fill="#f3e8ff" stroke="#a855f7" strokeWidth="2" />
        <text x="160" y="82" textAnchor="middle" fontSize="7" fontWeight="600" fill="#7e22ce">Month</text>
        <text x="160" y="92" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#7e22ce">3</text>
      </g>
      
      {/* Step 4: Year 1 - with flag */}
      <g>
        <circle cx="240" cy="45" r="22" fill="#fef3c7" stroke="#f59e0b" strokeWidth="3" />
        <text x="240" y="42" textAnchor="middle" fontSize="7" fontWeight="600" fill="#b45309">Year</text>
        <text x="240" y="54" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#b45309">1</text>
        {/* Flag at summit */}
        <line x1="275" y1="30" x2="275" y2="5" stroke="#6366f1" strokeWidth="2" />
        <path d="M275 5 L295 12 L275 19" fill="#6366f1" />
      </g>
      
      {/* Motivational text */}
      <text x="290" y="58" textAnchor="start" fontSize="8" fill="#64748b">
        Monetized!
      </text>
    </svg>
  );
}

/* ================================================
   COMPONENT HELPERS
   ================================================ */

function OfferCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="offerCard">
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

function SetupTile({ step, text }: { step: number; text: string }) {
  return (
    <div className="setupTile">
      <span className="setupTile__step">{step}</span>
      <p className="setupTile__text">{text}</p>
    </div>
  );
}

function FormatCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="formatCard">
      <strong>{title}</strong>
      <p>{desc}</p>
    </div>
  );
}

function UploadStation({ label, text }: { label: string; text: string }) {
  return (
    <div className="uploadStation">
      <span className="uploadStation__label">{label}</span>
      <p className="uploadStation__text">{text}</p>
    </div>
  );
}

function MuseumCard({
  title,
  text,
  fix,
}: {
  title: string;
  text: string;
  fix: string;
}) {
  return (
    <div className="museumCard">
      <h4 className="museumCard__title">{title}</h4>
      <p className="museumCard__text">{text}</p>
      <p className="museumCard__fix">
        <strong>Fix:</strong> {fix}
      </p>
    </div>
  );
}
