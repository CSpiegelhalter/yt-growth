/**
 * Body content for How to Make a YouTube Channel article.
 * Server component - no "use client" directive.
 */

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import type { BodyProps } from "./index";

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* Why Start */}
      <section id="why-start" className={s.section}>
        <h2 className={s.sectionTitle}>Why Start a YouTube Channel</h2>
        <p className={s.sectionText}>
          YouTube is the second largest search engine and the second most visited website 
          in the world. Over 2 billion logged-in users visit YouTube each month. Starting 
          a YouTube channel gives you access to this massive audience and the opportunity 
          to build something that grows over time.
        </p>
        <p className={s.sectionText}>
          Unlike social media posts that disappear from feeds within hours, YouTube videos 
          can bring in views for years. A video you upload today might still be generating 
          views, subscribers, and revenue five years from now. This compounding effect is 
          what makes YouTube unique as a platform for creators.
        </p>
        <p className={s.sectionText}>
          The barrier to entry is low. You do not need expensive equipment, a professional 
          studio, or technical expertise to start. Your smartphone and decent lighting are 
          enough to begin. What you do need is consistency, willingness to learn, and 
          patience. Most successful channels took years to build.
        </p>
        <h3 className={s.subheading}>What YouTube Can Offer</h3>
        <ul className={s.list}>
          <li>
            <strong>Reach:</strong> Access to billions of potential viewers worldwide.
          </li>
          <li>
            <strong>Revenue:</strong> Multiple monetization options including ads, 
            sponsorships, memberships, and selling your own products.
          </li>
          <li>
            <strong>Authority:</strong> Position yourself as an expert in your field 
            and attract opportunities.
          </li>
          <li>
            <strong>Community:</strong> Build a loyal audience that follows your journey.
          </li>
          <li>
            <strong>Longevity:</strong> Content that continues working for you years 
            after you create it.
          </li>
        </ul>
      </section>

      {/* Setup Checklist */}
      <section id="setup-checklist" className={s.section}>
        <h2 className={s.sectionTitle}>15 Minute Channel Setup Checklist</h2>
        <p className={s.sectionText}>
          You can create a YouTube channel and have it ready for content in about 15 
          minutes. Here is the complete setup checklist:
        </p>
        <ol className={s.numberedList}>
          <li>
            <strong>Sign in to YouTube with a Google account:</strong> If you do not 
            have a Google account, create one first at accounts.google.com.
          </li>
          <li>
            <strong>Click your profile icon</strong> in the top right corner of YouTube.
          </li>
          <li>
            <strong>Select Create a channel:</strong> You will see this option in the 
            dropdown menu.
          </li>
          <li>
            <strong>Choose your channel name:</strong> Use your name for a personal 
            brand, or create a custom name for a topic-based channel.
          </li>
          <li>
            <strong>Upload a profile picture:</strong> Use at least 800x800 pixels. 
            A clear headshot or recognizable logo works best.
          </li>
          <li>
            <strong>Add a banner image:</strong> The recommended size is 2560x1440 
            pixels. Your banner should communicate what your channel is about.
          </li>
          <li>
            <strong>Write a channel description:</strong> Explain what viewers will 
            find on your channel and who it is for. Include relevant keywords naturally.
          </li>
          <li>
            <strong>Add channel links:</strong> Link to your website, social media, 
            or other relevant pages.
          </li>
          <li>
            <strong>Create a channel trailer (optional):</strong> A short video 
            introducing your channel to new visitors. You can add this later.
          </li>
          <li>
            <strong>Plan your first video:</strong> Do not wait for perfect. Your 
            first video does not need to be great, it just needs to exist.
          </li>
        </ol>
      </section>

      {/* Create Account */}
      <section id="create-account" className={s.section}>
        <h2 className={s.sectionTitle}>Create Your Google Account</h2>
        <p className={s.sectionText}>
          Every YouTube channel is connected to a Google account. If you already have 
          a Gmail address, you have a Google account. Here is how to choose between 
          account types:
        </p>
        <h3 className={s.subheading}>Personal Channel</h3>
        <p className={s.sectionText}>
          A personal channel uses your Google account name. It is simple to set up and 
          manage. This is the default option and works well for most creators, especially 
          if you are building a personal brand around your name and face.
        </p>
        <h3 className={s.subheading}>Brand Account</h3>
        <p className={s.sectionText}>
          A Brand Account lets you use a different name than your personal Google account. 
          It also allows multiple people to manage the channel without sharing login 
          credentials. Choose a Brand Account if you want a business name, plan to have 
          team members, or want to keep your personal Google account separate.
        </p>
        <h3 className={s.subheading}>How to Create a Brand Account</h3>
        <ol className={s.numberedList}>
          <li>Go to youtube.com and sign in with your Google account</li>
          <li>Click your profile picture, then Settings</li>
          <li>Click Add or manage your channel(s)</li>
          <li>Click Create a channel</li>
          <li>Enter your desired channel name (this becomes a Brand Account)</li>
          <li>Click Create</li>
        </ol>
        <p className={s.sectionText}>
          You can always convert a personal channel to a Brand Account later, so do not 
          stress about this decision. Most creators start with a personal channel and 
          migrate if needed.
        </p>
      </section>

      {/* Create Channel */}
      <section id="create-channel" className={s.section}>
        <h2 className={s.sectionTitle}>Create Your YouTube Channel Step by Step</h2>
        <p className={s.sectionText}>
          Here is the detailed process to create your channel:
        </p>
        <ol className={s.numberedList}>
          <li>
            <strong>Go to youtube.com</strong> and make sure you are signed in with 
            your Google account.
          </li>
          <li>
            <strong>Click your profile picture</strong> in the top right corner.
          </li>
          <li>
            <strong>Click Create a channel:</strong> If you already have a channel, 
            you will see Your channel instead. Click it to access your existing channel.
          </li>
          <li>
            <strong>Confirm your name</strong> or click Use a custom name to create 
            a Brand Account with a different name.
          </li>
          <li>
            <strong>Click Create channel:</strong> Your channel now exists. You can 
            start customizing it immediately.
          </li>
        </ol>
        <p className={s.sectionText}>
          After creation, YouTube will guide you to customize your channel. Do not 
          skip this step. A complete channel profile looks more professional and 
          helps viewers understand what to expect.
        </p>
      </section>

      {/* Channel Customization */}
      <section id="channel-customization" className={s.section}>
        <h2 className={s.sectionTitle}>Channel Customization Guide</h2>
        <p className={s.sectionText}>
          Your channel page is like a homepage for your content. When someone discovers 
          a video and considers subscribing, they often visit your channel page first. 
          Make sure it represents you well.
        </p>
        <h3 className={s.subheading}>Basic Info</h3>
        <ul className={s.list}>
          <li>
            <strong>Channel name:</strong> Choose something memorable, easy to spell, 
            and relevant to your content. Avoid numbers and special characters that 
            make it hard to search for.
          </li>
          <li>
            <strong>Handle:</strong> Your unique @username. This appears in URLs and 
            mentions. Keep it short and consistent with your brand across platforms.
          </li>
          <li>
            <strong>Description:</strong> Explain what your channel is about in 2 to 3 
            sentences. Answer the question: What will viewers get if they subscribe? 
            Include relevant keywords naturally.
          </li>
        </ul>
        <h3 className={s.subheading}>Branding Elements</h3>
        <ul className={s.list}>
          <li>
            <strong>Profile picture:</strong> Use at least 800x800 pixels. It appears 
            next to your videos and comments. A clear face shot or recognizable logo 
            works best. Make sure it is readable at small sizes.
          </li>
          <li>
            <strong>Banner image:</strong> The recommended size is 2560x1440 pixels. 
            This appears at the top of your channel page. Include your channel name, 
            upload schedule, or what viewers can expect. Remember that it will be 
            cropped differently on desktop, tablet, and mobile.
          </li>
          <li>
            <strong>Video watermark:</strong> A small logo that appears on your videos. 
            Optional but helps with branding and can include a subscribe button.
          </li>
        </ul>
        <h3 className={s.subheading}>Channel Trailer</h3>
        <p className={s.sectionText}>
          A channel trailer is a short video (60 to 90 seconds) that plays for 
          unsubscribed visitors. Use it to introduce yourself, explain what your 
          channel offers, and give viewers a taste of your content and personality. 
          End with a clear call to subscribe.
        </p>
      </section>

      {/* First Video */}
      <section id="first-video" className={s.section}>
        <h2 className={s.sectionTitle}>Your First Video: What to Make and How</h2>
        <p className={s.sectionText}>
          Your first video is the hardest because everything is new. The good news is 
          that it does not need to be perfect. It just needs to exist so you can learn 
          from making it. Here is how to approach it:
        </p>
        <h3 className={s.subheading}>Good First Video Ideas</h3>
        <ul className={s.list}>
          <li>
            <strong>Introduction video:</strong> Who you are and what the channel will 
            cover. This can also serve as your channel trailer.
          </li>
          <li>
            <strong>Tutorial or how-to:</strong> Teach something you know. Even basic 
            tutorials help beginners and establish your expertise.
          </li>
          <li>
            <strong>Answer a common question:</strong> What do people in your niche 
            frequently ask? Create a video answering that question thoroughly.
          </li>
          <li>
            <strong>Tool or product review:</strong> Review something you use and 
            have opinions about in your area of expertise.
          </li>
          <li>
            <strong>Your story or journey:</strong> Share why you are starting the 
            channel and what you hope to achieve.
          </li>
        </ul>
        <h3 className={s.subheading}>Basic Equipment to Start</h3>
        <ul className={s.list}>
          <li>
            <strong>Camera:</strong> Your smartphone is absolutely fine to start. 
            Modern phone cameras produce excellent video quality. Only upgrade when 
            you have consistent uploads and camera quality is limiting you.
          </li>
          <li>
            <strong>Audio:</strong> A basic external microphone improves quality 
            significantly over built-in phone or laptop mics. A simple lavalier 
            (clip-on) mic or USB microphone works well and costs under $50.
          </li>
          <li>
            <strong>Lighting:</strong> Natural light from a window is free and 
            effective. Face the window so light falls on your face. If natural 
            light is not available, a basic ring light improves quality dramatically.
          </li>
          <li>
            <strong>Editing software:</strong> Free options like DaVinci Resolve, 
            CapCut, or iMovie work well for beginners. You do not need expensive 
            software to make good videos.
          </li>
        </ul>
        <h3 className={s.subheading}>Recording Tips for Beginners</h3>
        <ul className={s.list}>
          <li>Record in a quiet space with minimal echo</li>
          <li>Film horizontally (landscape) unless making Shorts</li>
          <li>Keep your phone or camera stable using a tripod or stack of books</li>
          <li>Do multiple takes if needed and edit together the best parts</li>
          <li>Speak clearly and slightly slower than feels natural</li>
        </ul>
        <p className={s.sectionText}>
          For help deciding what to make, see our{" "}
          <Link href="/learn/youtube-video-ideas">video ideas guide</Link>.
        </p>
      </section>

      {/* Uploading Your Video */}
      <section id="uploading" className={s.section}>
        <h2 className={s.sectionTitle}>How to Upload Your First Video</h2>
        <p className={s.sectionText}>
          Once you have recorded and edited your video, uploading is straightforward:
        </p>
        <ol className={s.numberedList}>
          <li>
            <strong>Go to YouTube Studio:</strong> Click your profile picture and 
            select YouTube Studio, or go directly to studio.youtube.com.
          </li>
          <li>
            <strong>Click Create:</strong> The camera icon with a plus sign in the 
            top right.
          </li>
          <li>
            <strong>Select Upload videos:</strong> This opens the upload interface.
          </li>
          <li>
            <strong>Drag your video file</strong> or click Select files to browse.
          </li>
          <li>
            <strong>Add title:</strong> Write a clear, compelling title that includes 
            your main keyword. Keep it under 60 characters to avoid truncation.
          </li>
          <li>
            <strong>Write description:</strong> Start with a hook, explain what the 
            video covers, and include relevant keywords naturally.
          </li>
          <li>
            <strong>Upload thumbnail:</strong> Click Upload thumbnail and select a 
            custom image. Do not use auto-generated thumbnails.
          </li>
          <li>
            <strong>Add tags:</strong> Include 3 to 5 relevant tags. Do not overthink 
            this; tags have minimal impact.
          </li>
          <li>
            <strong>Select visibility:</strong> Choose Public to make it available to 
            everyone, or Schedule to set a future publish time.
          </li>
          <li>
            <strong>Click Publish:</strong> Your video is now live.
          </li>
        </ol>
      </section>

      {/* Channel Settings */}
      <section id="channel-settings" className={s.section}>
        <h2 className={s.sectionTitle}>Important Channel Settings</h2>
        <p className={s.sectionText}>
          After setting up your channel, configure these settings to save time on 
          future uploads and protect your channel:
        </p>
        <h3 className={s.subheading}>Upload Defaults</h3>
        <p className={s.sectionText}>
          In YouTube Studio, go to Settings then Upload defaults. Here you can set 
          default values that apply to every new upload:
        </p>
        <ul className={s.list}>
          <li>Default visibility (Public, Unlisted, Private)</li>
          <li>Default category</li>
          <li>Default language</li>
          <li>License and distribution settings</li>
          <li>Comments and ratings preferences</li>
        </ul>
        <h3 className={s.subheading}>Channel Permissions</h3>
        <p className={s.sectionText}>
          Under Settings then Permissions, you can invite others to help manage your 
          channel with different access levels:
        </p>
        <ul className={s.list}>
          <li>Manager: Full access except deleting the channel</li>
          <li>Editor: Can edit videos and playlists but not settings</li>
          <li>Viewer: Can see analytics but not make changes</li>
        </ul>
        <h3 className={s.subheading}>Community Settings</h3>
        <p className={s.sectionText}>
          Configure how comments work on your channel:
        </p>
        <ul className={s.list}>
          <li>
            <strong>Comment moderation:</strong> Hold all comments for review, or 
            let most through with increased moderation for potentially inappropriate 
            content.
          </li>
          <li>
            <strong>Blocked words:</strong> Add words or phrases that automatically 
            hold comments for review.
          </li>
          <li>
            <strong>Approved users:</strong> Whitelist specific users whose comments 
            always appear.
          </li>
          <li>
            <strong>Hidden users:</strong> Block specific users from commenting.
          </li>
        </ul>
      </section>

      {/* Choosing Your Niche */}
      <section id="niche" className={s.section}>
        <h2 className={s.sectionTitle}>Choosing Your Channel Niche</h2>
        <p className={s.sectionText}>
          A niche is the specific topic or area your channel focuses on. Choosing a 
          niche is one of the most important decisions for a new channel. Here is how 
          to think about it:
        </p>
        <h3 className={s.subheading}>Why Niche Matters</h3>
        <ul className={s.list}>
          <li>
            <strong>Viewer expectations:</strong> When someone subscribes, they are 
            betting future videos will be similar to what they just watched. A clear 
            niche makes this bet feel safe.
          </li>
          <li>
            <strong>Algorithm understanding:</strong> YouTube learns what your channel 
            is about and who to show it to. Consistent content helps YouTube categorize 
            and recommend you accurately.
          </li>
          <li>
            <strong>Authority building:</strong> Focusing on one area lets you build 
            depth and become known for something specific.
          </li>
        </ul>
        <h3 className={s.subheading}>How to Choose</h3>
        <ul className={s.list}>
          <li>
            <strong>Interest:</strong> Pick something you genuinely enjoy. You will 
            be creating content about it for years.
          </li>
          <li>
            <strong>Knowledge:</strong> You do not need to be an expert, but you should 
            know more than complete beginners or be willing to learn publicly.
          </li>
          <li>
            <strong>Demand:</strong> Search YouTube for your topic. Are there videos 
            with views? Are there channels successfully covering this?
          </li>
          <li>
            <strong>Competition:</strong> Very competitive niches are harder but not 
            impossible. Very obscure niches may not have enough audience.
          </li>
        </ul>
        <h3 className={s.subheading}>Popular Niche Categories</h3>
        <ul className={s.list}>
          <li>Technology: Reviews, tutorials, tech news</li>
          <li>Gaming: Gameplay, guides, commentary</li>
          <li>Personal finance: Investing, budgeting, money management</li>
          <li>Health and fitness: Workouts, nutrition, wellness</li>
          <li>Cooking and food: Recipes, restaurant reviews, food science</li>
          <li>Education: Explanations, tutorials, skill building</li>
          <li>DIY and crafts: Projects, tutorials, home improvement</li>
          <li>Travel: Destinations, tips, vlogs</li>
          <li>Productivity: Systems, tools, personal development</li>
          <li>Entertainment: Commentary, reactions, storytelling</li>
        </ul>
      </section>

      {/* Mistakes */}
      <section id="mistakes" className={s.section}>
        <h2 className={s.sectionTitle}>Common Beginner Mistakes to Avoid</h2>
        <p className={s.sectionText}>
          Learn from others&apos; mistakes so you do not have to make them yourself:
        </p>
        <h3 className={s.subheading}>Waiting for Perfect Equipment</h3>
        <p className={s.sectionText}>
          Your smartphone and free editing software are enough to start. Creators who 
          wait for the perfect setup often never start. Better equipment will not fix 
          weak content, and good content can overcome mediocre production quality.
        </p>
        <h3 className={s.subheading}>No Niche Focus</h3>
        <p className={s.sectionText}>
          Channels that cover everything struggle to grow. Viewers subscribe expecting 
          more of what they just watched. If your channel is unpredictable, there is 
          no reason to subscribe. Pick a focus and stick to it.
        </p>
        <h3 className={s.subheading}>Ignoring Thumbnails and Titles</h3>
        <p className={s.sectionText}>
          Your thumbnail and title determine whether people click. Many beginners spend 
          hours on content and minutes on packaging. Both matter. Study what works in 
          your niche and invest real time in creating compelling thumbnails.
        </p>
        <h3 className={s.subheading}>Inconsistent Uploads</h3>
        <p className={s.sectionText}>
          Posting three videos in one week then nothing for two months confuses both 
          viewers and the algorithm. Pick a realistic schedule you can maintain and 
          stick to it. Once a week is better than random bursts.
        </p>
        <h3 className={s.subheading}>Giving Up Too Early</h3>
        <p className={s.sectionText}>
          Most successful channels took months or years of consistent uploading before 
          gaining traction. The first 50 to 100 videos are often a learning period. 
          If you expect results in the first month, you will quit before seeing what 
          is possible.
        </p>
        <h3 className={s.subheading}>Buying Fake Subscribers or Views</h3>
        <p className={s.sectionText}>
          This destroys your channel. Fake engagement tanks your metrics, YouTube 
          detects and penalizes it, and you learn nothing about what actually works. 
          See our guide on{" "}
          <Link href="/learn/free-youtube-subscribers">
            why fake growth destroys channels
          </Link>.
        </p>
        <h3 className={s.subheading}>Copying Others Exactly</h3>
        <p className={s.sectionText}>
          Learning from successful creators is good. Copying them exactly produces a 
          worse version of what already exists. Find your own voice, format, and 
          perspective. What makes you different is what makes you valuable.
        </p>
      </section>

      {/* Next Steps */}
      <section id="next-steps" className={s.section}>
        <h2 className={s.sectionTitle}>What to Do After Setup</h2>
        <p className={s.sectionText}>
          Your channel is set up. Now what? Here is a roadmap for your first months:
        </p>
        <h3 className={s.subheading}>Immediate (This Week)</h3>
        <ol className={s.numberedList}>
          <li>
            <Link href="/learn/youtube-video-ideas">Find video ideas</Link> by 
            researching what works in your niche
          </li>
          <li>Create and upload your first video, even if it is not perfect</li>
          <li>Set up upload defaults to save time on future videos</li>
        </ol>
        <h3 className={s.subheading}>First Month</h3>
        <ul className={s.list}>
          <li>Aim to upload 4 to 8 videos (one to two per week)</li>
          <li>Start learning to read your analytics</li>
          <li>Pay attention to which videos perform better</li>
          <li>Improve your thumbnails with each upload</li>
        </ul>
        <h3 className={s.subheading}>First Three Months</h3>
        <ul className={s.list}>
          <li>
            <Link href="/learn/youtube-channel-audit">Learn to audit your channel</Link>{" "}
            and identify what is working
          </li>
          <li>
            Study your niche with{" "}
            <Link href="/learn/youtube-competitor-analysis">competitor analysis</Link>
          </li>
          <li>Refine your niche and content focus based on data</li>
          <li>Build toward consistency and quality improvement</li>
        </ul>
        <h3 className={s.subheading}>First Year</h3>
        <ul className={s.list}>
          <li>Work toward{" "}
            <Link href="/learn/youtube-monetization-requirements">monetization</Link>{" "}
            requirements
          </li>
          <li>Develop your unique style and voice</li>
          <li>Build a library of content that continues attracting viewers</li>
          <li>Consider upgrading equipment once you have proven consistency</li>
        </ul>
      </section>

      {/* CTA */}
      <div className={s.highlight}>
        <p>
          <strong>Ready to grow your new channel?</strong> {BRAND.name} helps you find 
          video ideas that work in your niche, track what is performing, and identify 
          opportunities you might miss. Start making data-driven decisions from day one.
        </p>
      </div>
    </>
  );
}
