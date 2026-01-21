/**
 * Body content for How to Be a YouTuber article.
 * Server component - no "use client" directive.
 */

import Link from "next/link";
import type { BodyProps } from "./index";

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* Hook */}
      <section id="mindset" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </span>
          Being a YouTuber Is a Skill, Not a Personality Type
        </h2>
        <p className={s.sectionText}>
          You don&apos;t need perfect gear, a magnetic personality, or a viral idea to start. 
          You need reps. The creators who succeed aren&apos;t the ones who started with the best 
          equipment or the most confidence—they&apos;re the ones who kept publishing, kept 
          learning, and kept iterating until something clicked.
        </p>
        <p className={s.sectionText}>
          Your first ten videos will probably be rough. That&apos;s not a warning—it&apos;s 
          permission. Every creator you admire has a graveyard of awkward early content 
          they hope you never find. The difference between them and someone who never 
          started is simply that they hit publish anyway.
        </p>
        <div className={s.highlight}>
          <p>
            <strong>The truth:</strong> YouTube rewards consistency and improvement, not 
            perfection. Your job isn&apos;t to make a masterpiece on day one. It&apos;s to 
            get through the learning curve faster by creating more.
          </p>
        </div>
      </section>

      {/* Start Here Navigation */}
      <section className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polygon points="10 8 16 12 10 16 10 8" />
            </svg>
          </span>
          Start Here
        </h2>
        <p className={s.sectionText}>
          This guide walks you from &quot;I want to start&quot; to &quot;I know what to do this week.&quot; 
          Jump to what matters most to you right now:
        </p>
        <p className={s.sectionText}>
          <Link href="#direction" className={s.inlineLink}>Pick your channel direction</Link> → 
          <Link href="#first-video" className={s.inlineLink}> Publish your first video</Link> → 
          <Link href="#growth" className={s.inlineLink}> Grow without burning out</Link>
        </p>
      </section>

      {/* Choose Your Direction */}
      <section id="direction" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </span>
          Pick Your Channel Direction
        </h2>
        <p className={s.sectionText}>
          &quot;Finding your niche&quot; sounds intimidating, but it&apos;s really just answering 
          one question: what can you talk about for 50 videos without getting bored or 
          running out of ideas?
        </p>
        <p className={s.sectionText}>
          You don&apos;t need to be the world&apos;s expert. You just need to know slightly 
          more than your audience—or be willing to learn alongside them. Some of the 
          best channels are built by curious people documenting their journey, not 
          gurus lecturing from above.
        </p>

        <h3 className={s.subheading}>Three Starting Formulas That Work</h3>
        <p className={s.sectionText}>
          <strong>&quot;I help X do Y.&quot;</strong> The classic teaching format. You have a 
          skill or knowledge, and you help people who want it. Examples: helping 
          beginners learn guitar, helping remote workers stay productive, helping 
          parents cook faster dinners. The clearer you can define X and Y, the easier 
          it is for YouTube to recommend you to the right people.
        </p>
        <p className={s.sectionText}>
          <strong>&quot;I test X so you don&apos;t have to.&quot;</strong> Review and comparison 
          content. You spend the time and money trying products, services, or methods 
          so your audience can make informed decisions. Examples: testing budget 
          cameras, trying productivity apps for a month, comparing meal delivery 
          services. This works because people search before they buy.
        </p>
        <p className={s.sectionText}>
          <strong>&quot;I document my X journey.&quot;</strong> You&apos;re learning something 
          publicly and bringing people along. Examples: learning a language in 90 days, 
          building a business from zero, renovating a house. This format is powerful 
          because viewers root for you and return to see progress.
        </p>

        <h3 className={s.subheading}>The 50-Ideas Test</h3>
        <p className={s.sectionText}>
          Before committing to a direction, sit down and brainstorm 50 video ideas in 
          that space. Don&apos;t filter—just write titles or topics as fast as you can. If 
          you hit 50 easily and still feel excited, you&apos;ve found something sustainable. 
          If you stall at 15 and feel drained, that&apos;s valuable information too. Better 
          to discover it now than after filming 10 videos you don&apos;t care about.
        </p>
        <p className={s.sectionText}>
          For more inspiration, see our <Link href="/learn/youtube-video-ideas">video ideas guide</Link>.
        </p>
      </section>

      {/* Publish Your First Video */}
      <section id="first-video" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </span>
          Publish Your First Video
        </h2>
        <p className={s.sectionText}>
          This is the section that matters most. Everything else—gear, optimization, 
          growth hacks—is noise until you&apos;ve actually made something. Your first video 
          won&apos;t be great, and that&apos;s exactly right. The goal is to finish it, learn 
          from it, and make the next one better.
        </p>

        <h3 className={s.subheading}>Gear: Less Than You Think</h3>
        <p className={s.sectionText}>
          Your smartphone shoots better video than professional cameras from ten years 
          ago. The bottleneck for beginners is never the camera—it&apos;s lighting and 
          audio. Film near a window for soft, natural light. Use any basic microphone 
          (even wired earbuds) to get cleaner audio than your phone&apos;s built-in mic. 
          That&apos;s genuinely all you need to start.
        </p>
        <p className={s.sectionText}>
          When you&apos;re ready to upgrade, prioritize audio first—viewers will tolerate 
          mediocre video far longer than they&apos;ll tolerate bad sound. A $50 USB 
          microphone makes a bigger difference than a $500 camera.
        </p>

        <h3 className={s.subheading}>Channel Setup in Five Minutes</h3>
        <p className={s.sectionText}>
          Create a YouTube channel through your Google account. Pick a name that&apos;s 
          easy to spell and hints at what you cover. Add a simple profile picture 
          (your face or a clean logo) and write a one-sentence description of who 
          you help and how. That&apos;s enough to start—you can polish everything later 
          once you know what your channel actually becomes. For detailed setup 
          instructions, see our{" "}
          <Link href="/learn/how-to-make-a-youtube-channel">channel creation guide</Link>.
        </p>

        <h3 className={s.subheading}>Planning Without Overthinking</h3>
        <p className={s.sectionText}>
          You don&apos;t need a full script, but you do need a plan. The simplest approach: 
          write down 5-7 bullet points of what you&apos;ll cover, in order. This gives you 
          structure without locking you into reading from a teleprompter. Know your 
          opening line cold—the first 10 seconds determine whether people stay or 
          leave. After that, you can be more conversational.
        </p>
        <p className={s.sectionText}>
          The most common beginner mistake is rambling. You have something to say, but 
          you take six minutes to say what could take two. Fight this by asking: 
          &quot;What&apos;s the one thing I want viewers to walk away knowing?&quot; Everything 
          that doesn&apos;t serve that one thing is a candidate for cutting.
        </p>

        <div className={s.highlight}>
          <p>
            <strong>First video template:</strong> Open with a hook that states the 
            problem or promise (10-15 seconds). Deliver your main content in clear 
            steps or points. End with the result or takeaway and tell viewers what 
            to watch next. That&apos;s it—don&apos;t overcomplicate it.
          </p>
        </div>

        <h3 className={s.subheading}>Recording: Just Start Talking</h3>
        <p className={s.sectionText}>
          Set up your phone, check that audio is recording, and press record. Then 
          talk like you&apos;re explaining this to a friend. You&apos;ll feel awkward. 
          That&apos;s normal. The camera makes everyone self-conscious at first, but 
          the only cure is exposure. Record more, watch yourself back, and gradually 
          the awkwardness fades.
        </p>
        <p className={s.sectionText}>
          Give yourself permission to do multiple takes. Say something wrong? Just 
          pause, restart that section, and keep going. You&apos;ll edit out the mistakes 
          later. This is how every creator works—no one delivers perfect monologues 
          in a single take.
        </p>

        <h3 className={s.subheading}>Editing for Pace</h3>
        <p className={s.sectionText}>
          Use free software like DaVinci Resolve, CapCut, or iMovie. Your editing 
          goal is simple: remove everything that doesn&apos;t need to be there. Cut the 
          pauses, the &quot;um&quot;s, the false starts, and the tangents. Watch your video 
          back and notice where your attention drifts—that&apos;s where viewers will 
          click away. Tighten those sections or cut them entirely.
        </p>
        <p className={s.sectionText}>
          For deeper guidance on keeping viewers engaged, see our{" "}
          <Link href="/learn/youtube-retention-analysis">retention analysis guide</Link>.
        </p>

        <h3 className={s.subheading}>Titles and Thumbnails: Your First Impression</h3>
        <p className={s.sectionText}>
          Your video lives or dies based on whether people click. The title should 
          clearly communicate the value—what will someone get by watching? Avoid 
          vague titles like &quot;My First Video&quot; or &quot;Quick Update.&quot; Instead, lead 
          with the benefit: &quot;How to X in Y Minutes&quot; or &quot;The Mistake That&apos;s Costing 
          You Z.&quot;
        </p>
        <p className={s.sectionText}>
          Thumbnails matter equally. Use large, readable text (3-4 words max), high 
          contrast colors, and a clear focal point. If you&apos;re in the thumbnail, 
          show emotion—curiosity, surprise, excitement. Humans are drawn to faces 
          expressing something. For more on this, see our{" "}
          <Link href="/learn/youtube-thumbnail-best-practices">thumbnail guide</Link>.
        </p>

        <h3 className={s.subheading}>Hit Publish</h3>
        <p className={s.sectionText}>
          At some point, you have to stop tweaking and let it go. Your first video 
          doesn&apos;t need to be perfect—it needs to exist. Upload it, write a clear 
          description with relevant keywords, and publish. Then immediately start 
          planning your second video. Momentum matters more than perfection.
        </p>
      </section>

      {/* Build a Sustainable System */}
      <section id="consistency" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </span>
          Build a Sustainable System
        </h2>
        <p className={s.sectionText}>
          Consistency beats intensity. One video per week for a year will outperform 
          a burst of daily uploads followed by burnout. The creators who last are 
          the ones who design a system they can actually maintain.
        </p>
        <p className={s.sectionText}>
          Start by picking a schedule you could keep for three months without 
          heroic effort. If weekly feels like a stretch with your current life, 
          try every two weeks. The specific frequency matters less than your ability 
          to sustain it. You can always increase later once you&apos;ve built the habit.
        </p>

        <h3 className={s.subheading}>Your Simple Production System</h3>
        <p className={s.sectionText}>
          Build a backlog of 10-20 video ideas so you never sit down wondering what 
          to make. When inspiration strikes, add to the list. When it&apos;s time to 
          create, pull from the list. This separates ideation from production and 
          makes both easier.
        </p>
        <p className={s.sectionText}>
          Then create a repeatable production day. Maybe Saturdays are for filming 
          and Sundays are for editing. Maybe you batch-record three videos in one 
          session. The specifics depend on your life—the principle is making 
          creation a routine, not an event.
        </p>
        <div className={s.highlight}>
          <p><strong>A week might look like:</strong></p>
          <ul className={s.list}>
            <li>Monday: Outline next video, research if needed</li>
            <li>Tuesday-Wednesday: Record</li>
            <li>Thursday-Friday: Edit</li>
            <li>Saturday: Create thumbnail, write title/description, schedule</li>
            <li>Sunday: Rest, add ideas to backlog</li>
          </ul>
        </div>
        <p className={s.sectionText}>
          Adjust this to fit your schedule. The point isn&apos;t to follow someone 
          else&apos;s system—it&apos;s to have any system at all.
        </p>
      </section>

      {/* Learn the Growth Loop */}
      <section id="growth" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          </span>
          Learn the Growth Loop
        </h2>
        <p className={s.sectionText}>
          YouTube growth comes down to four things, and understanding them will save 
          you from chasing tactics that don&apos;t matter.
        </p>
        <p className={s.sectionText}>
          <strong>Topic demand:</strong> Are you making videos people are actually 
          searching for or interested in? The best production in the world won&apos;t 
          help if no one wants what you&apos;re offering. Look at what&apos;s already getting 
          views in your space. Search YouTube for your topic and study what&apos;s ranking. 
          This isn&apos;t copying—it&apos;s understanding what your potential audience already 
          watches.
        </p>
        <p className={s.sectionText}>
          <strong>Packaging:</strong> Your title and thumbnail determine whether people 
          click. You can have the best content on YouTube, but if the packaging doesn&apos;t 
          compel a click, no one sees it. Treat every title and thumbnail as a tiny 
          advertisement. Test different approaches and watch your click-through rate 
          in analytics.
        </p>
        <p className={s.sectionText}>
          <strong>Retention:</strong> Once someone clicks, do they keep watching? YouTube 
          measures this obsessively. Videos that hold attention get promoted; videos 
          that people abandon get buried. Cut the fluff. Front-load value. Give viewers 
          a reason to stay for the next section. Your{" "}
          <Link href="/learn/youtube-retention-analysis">retention curve</Link> tells 
          you exactly where people leave—study it.
        </p>
        <p className={s.sectionText}>
          <strong>Next-video intent:</strong> The best growth hack is making viewers 
          want more. End every video by pointing to another one. Create series that 
          build on each other. When someone finishes video one and immediately clicks 
          video two, YouTube notices and rewards you with more recommendations.
        </p>
        <p className={s.sectionText}>
          These four levers—topic, packaging, retention, next video—are where to 
          focus your improvement energy. Everything else is secondary.
        </p>
      </section>

      {/* Challenges */}
      <section id="challenges" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </span>
          When It Gets Hard
        </h2>
        <p className={s.sectionText}>
          Everyone hits walls. Slow growth in the first months is normal—almost 
          universal. The algorithm needs time to understand your content and find 
          your audience. Comparing your month-two numbers to a creator&apos;s year-five 
          numbers will make you miserable. Compare to last month&apos;s you instead.
        </p>
        <p className={s.sectionText}>
          Motivation fades. This is also normal. The solution isn&apos;t to wait for 
          inspiration to return—it&apos;s to rely on the system you built. Show up on 
          your production days even when you don&apos;t feel like it. Discipline carries 
          you through the valleys that enthusiasm can&apos;t.
        </p>
        <p className={s.sectionText}>
          Technical problems will frustrate you. Audio issues, software crashes, 
          footage that doesn&apos;t look right. Every creator deals with this. Each 
          problem you solve is a skill you now have. The learning curve is steep 
          at first, then flattens. Push through the early friction.
        </p>
      </section>

      {/* Monetization */}
      <section id="monetization" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          </span>
          Monetization Comes Later
        </h2>
        <p className={s.sectionText}>
          Making money from YouTube is real, but it&apos;s not where your focus should 
          be early on. The YouTube Partner Program requires 1,000 subscribers and 
          either 4,000 watch hours in 12 months or 10 million Shorts views in 90 
          days. For most beginners, that&apos;s months away—and that&apos;s fine.
        </p>
        <p className={s.sectionText}>
          When you do reach monetization, ad revenue is just one option. Sponsorships, 
          affiliate links, your own products, memberships—these often pay better than 
          ads alone. But all of them require an engaged audience first. Build that, 
          and the money options appear. Chase money before you have an audience, and 
          you&apos;ll burn out chasing metrics instead of making good content.
        </p>
        <p className={s.sectionText}>
          For detailed requirements and strategies, see our{" "}
          <Link href="/learn/youtube-monetization-requirements">monetization guide</Link>.
        </p>
      </section>

      {/* CTA */}
      <div className={s.highlight}>
        <p>
          <strong>Your next step:</strong> Pick one video idea from your brainstorm 
          list—or come up with one right now—and outline it today. Not tomorrow, not 
          this weekend. Today. Write down your hook, your main points, and how you&apos;ll 
          end it. That&apos;s all. You don&apos;t have to film yet. But that outline is your 
          first real step toward being a YouTuber, not just thinking about it.
        </p>
      </div>
    </>
  );
}
