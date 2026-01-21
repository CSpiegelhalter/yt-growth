/**
 * Body content for How to Get More Subscribers article.
 * Server component - no "use client" directive.
 */

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import type { BodyProps } from "./index";

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* Why Subscribers Matter */}
      <section id="why-subscribers-matter" className={s.section}>
        <h2 className={s.sectionTitle}>Why Subscribers Matter for YouTube Growth</h2>
        <p className={s.sectionText}>
          Your subscriber count is not just a vanity metric. Subscribers are people who 
          explicitly told YouTube they want to see more from you. When you upload a new video, 
          subscribers often watch it within the first few hours, giving your content the early 
          momentum that signals quality to the algorithm.
        </p>
        <p className={s.sectionText}>
          Early views from subscribers trigger a cascade effect. When YouTube sees high 
          engagement in the first 24 to 48 hours, it starts showing your video to a wider 
          audience through browse features and suggested videos. Without that initial subscriber 
          push, many videos never get the chance to find their broader audience.
        </p>
        <p className={s.sectionText}>
          Beyond the algorithm, subscribers create predictability. If you have 10,000 subscribers 
          and typically get 1,000 views from subscribers on each video, you have a reliable 
          baseline. This consistency helps you plan content, forecast growth, and build a 
          sustainable channel rather than chasing viral hits.
        </p>
        <h3 className={s.subheading}>Key Subscriber Metrics</h3>
        <ul className={s.list}>
          <li>
            <strong>Subscriber conversion rate:</strong> A healthy channel converts about 1% to 3% 
            of viewers into subscribers. That means 10 to 30 new subscribers per 1,000 views. 
            If you are under 1%, your content may not be giving viewers a clear reason to come back.
          </li>
          <li>
            <strong>Subscribers from each video:</strong> Check YouTube Studio to see which 
            videos bring in the most subscribers. These are your conversion winners. Make more 
            content like them.
          </li>
          <li>
            <strong>Returning viewers percentage:</strong> A high percentage of returning viewers 
            means your subscribers are actually watching your content. If this is low, your 
            content may have drifted from what subscribers originally signed up for.
          </li>
        </ul>
      </section>

      {/* Subscriber Checklist */}
      <section id="subscriber-checklist" className={s.section}>
        <h2 className={s.sectionTitle}>15 Minute Subscriber Audit Checklist</h2>
        <p className={s.sectionText}>
          Run through this checklist to identify what is helping or hurting your subscriber growth. 
          You can do this in about 15 minutes using YouTube Studio.
        </p>
        <ol className={s.numberedList}>
          <li>
            <strong>Check subscriber trend (2 min):</strong> Go to YouTube Studio, then Analytics, 
            then Audience. Is your subscriber count trending up, flat, or down over the last 90 days?
          </li>
          <li>
            <strong>Find your best converting video (3 min):</strong> Under Analytics, then Audience, 
            then Subscribers, click See more to find which videos brought in the most subscribers. 
            Note what they have in common.
          </li>
          <li>
            <strong>Watch your top video&apos;s first 30 seconds (2 min):</strong> Does it hook viewers? 
            Does it establish your expertise and what the channel is about?
          </li>
          <li>
            <strong>Check your subscribe ask (2 min):</strong> Watch your top video and note when 
            you ask for the subscribe. Is it after delivering value, or at the beginning before 
            earning it?
          </li>
          <li>
            <strong>Review your channel page (2 min):</strong> Visit your channel page as if you 
            were a new viewer. Is your banner clear about what the channel offers? Is your about 
            section filled out?
          </li>
          <li>
            <strong>Check recent video titles (2 min):</strong> Do your last 10 titles have a 
            consistent theme? Can a new viewer understand what your channel is about from the titles?
          </li>
          <li>
            <strong>Review end screens (1 min):</strong> Are your end screens linking to related 
            content that keeps viewers watching?
          </li>
          <li>
            <strong>Check posting consistency (1 min):</strong> Have you been posting on a predictable 
            schedule? Irregular posting makes it hard for viewers to form a habit around your content.
          </li>
        </ol>
        <p className={s.sectionText}>
          After this audit, you should have a clear picture of what is working and what needs 
          improvement. Most channels find at least two or three quick wins they can act on immediately.
        </p>
      </section>

      {/* How to See Subscribers */}
      <section id="see-subscribers" className={s.section}>
        <h2 className={s.sectionTitle}>How to See Your Subscribers on YouTube</h2>
        <p className={s.sectionText}>
          YouTube provides detailed data about your subscribers in YouTube Studio. Here is 
          where to find each piece of information:
        </p>
        <h3 className={s.subheading}>Total Subscriber Count</h3>
        <p className={s.sectionText}>
          Your current subscriber count appears on your YouTube Studio dashboard as soon as you 
          log in. For historical data, go to Analytics, then Overview and hover over the subscriber 
          graph to see counts at any point in time.
        </p>
        <h3 className={s.subheading}>Subscribers Gained Over Time</h3>
        <p className={s.sectionText}>
          In YouTube Studio, go to Analytics, then the Audience tab. Here you can see subscribers 
          gained and lost over any time period. Pay attention to days with unusual spikes or drops. 
          Spikes often correlate with videos that resonated; drops may indicate content that 
          disappointed existing subscribers.
        </p>
        <h3 className={s.subheading}>Subscribers by Video</h3>
        <p className={s.sectionText}>
          This is the most actionable data. Go to Analytics, then Audience, then Subscribers, and 
          click See more at the bottom. You can see exactly which videos drove the most 
          subscriptions. These are your conversion winners. Study what they have in common: topic, 
          format, length, hook, or packaging.
        </p>
        <h3 className={s.subheading}>Who Your Subscribers Are</h3>
        <p className={s.sectionText}>
          Under Analytics, then Audience, you can see demographic information about your subscribers: 
          age, gender, geography, and when they are most active on YouTube. Use this data to 
          optimize posting times and tailor content to your actual audience rather than who you 
          assume they are.
        </p>
      </section>

      {/* Analytics That Matter */}
      <section id="youtube-analytics" className={s.section}>
        <h2 className={s.sectionTitle}>YouTube Analytics That Predict Subscriber Growth</h2>
        <p className={s.sectionText}>
          Certain metrics in YouTube Analytics directly correlate with subscriber growth. Focus 
          on these rather than vanity metrics like total views.
        </p>
        <h3 className={s.subheading}>Subscribers Per 1,000 Views</h3>
        <p className={s.sectionText}>
          Calculate this by dividing new subscribers by total views and multiplying by 1,000. 
          If you are getting fewer than 10 subscribers per 1,000 views, your content is not 
          giving viewers a compelling reason to subscribe. Common causes include unclear channel 
          focus, no unique value proposition, or failing to ask for the subscribe at the right moment.
        </p>
        <h3 className={s.subheading}>Average View Duration</h3>
        <p className={s.sectionText}>
          Viewers who watch longer are significantly more likely to subscribe. If your average 
          view duration is below 40% of video length, work on improving retention first. See our{" "}
          <Link href="/learn/youtube-retention-analysis">retention guide</Link> for specific strategies.
        </p>
        <h3 className={s.subheading}>Click Through Rate</h3>
        <p className={s.sectionText}>
          A low CTR means fewer people see your content, which means fewer potential subscribers. 
          If your CTR is below 4%, focus on improving your thumbnails and titles before worrying 
          about subscriber growth. You cannot convert viewers who never click.
        </p>
        <h3 className={s.subheading}>Returning Viewers</h3>
        <p className={s.sectionText}>
          A high percentage of returning viewers indicates your subscribers are engaged. If 
          returning viewers are low (under 20%), your recent content may have drifted from what 
          originally attracted your subscribers.
        </p>
      </section>

      {/* What Converts Viewers */}
      <section id="what-converts" className={s.section}>
        <h2 className={s.sectionTitle}>What Actually Converts Viewers to Subscribers</h2>
        <p className={s.sectionText}>
          Understanding why people subscribe helps you create content that converts. A subscription 
          is a commitment to future content, so you need to make that future content feel valuable 
          and predictable.
        </p>
        <h3 className={s.subheading}>Demonstrated Expertise</h3>
        <p className={s.sectionText}>
          When you teach something viewers did not know, or explain something more clearly than 
          they have heard before, you establish yourself as worth following. Expertise does not 
          mean being the world&apos;s top authority. It means providing value that viewers cannot 
          easily find elsewhere. Your unique experience, perspective, or explanation style counts.
        </p>
        <h3 className={s.subheading}>Unique Perspective or Format</h3>
        <p className={s.sectionText}>
          If your content looks and sounds like everyone else in your niche, viewers have no 
          reason to follow you specifically. Develop a recognizable style, format, or angle. 
          This could be your editing style, your personality, your specific subtopic focus, or 
          the structure of your videos.
        </p>
        <h3 className={s.subheading}>Consistent Theme</h3>
        <p className={s.sectionText}>
          When viewers subscribe, they are betting that future videos will be similar to what 
          they just watched. If your channel covers cooking on Monday, gaming on Wednesday, and 
          productivity on Friday, viewers cannot predict what they are signing up for. Pick a 
          lane and stay in it, at least until you have built a substantial audience.
        </p>
        <h3 className={s.subheading}>Clear Promise of Future Value</h3>
        <p className={s.sectionText}>
          The best subscribe asks include a promise: I post a new editing tutorial every 
          Tuesday, or Subscribe if you want more breakdowns of championship games. 
          This tells viewers exactly what they get by subscribing.
        </p>
        <h3 className={s.subheading}>Personal Connection</h3>
        <p className={s.sectionText}>
          Creators who show personality build stronger subscriber relationships. This does not 
          mean being loud or performing. It means being genuine, sharing relevant stories, and 
          creating the feeling that viewers are learning from a real person rather than reading 
          a textbook.
        </p>
      </section>

      {/* Growth Strategies */}
      <section id="growth-strategies" className={s.section}>
        <h2 className={s.sectionTitle}>Proven Subscriber Growth Strategies</h2>
        <p className={s.sectionText}>
          These strategies have worked across thousands of channels. They are not shortcuts or 
          hacks. They are fundamentals that compound over time.
        </p>
        <h3 className={s.subheading}>1. Ask After Value, Not Before</h3>
        <p className={s.sectionText}>
          The worst time to ask for a subscribe is in your intro before you have delivered anything. 
          The best time is after a particularly valuable moment, when the viewer has just learned 
          something useful. A well-placed if this was helpful, consider subscribing 
          after a key insight converts much better than do not forget to subscribe 
          at the start.
        </p>
        <h3 className={s.subheading}>2. Create Series Content</h3>
        <p className={s.sectionText}>
          Multi-part series give viewers a concrete reason to subscribe: they want to see what 
          happens next or learn the next step. A Part 1 of 3 in your title creates 
          anticipation. Even if you do not number them, themed series that viewers can follow 
          work well. Subscribe to follow along as I build this project is compelling.
        </p>
        <h3 className={s.subheading}>3. Optimize Your Channel Page</h3>
        <p className={s.sectionText}>
          When someone considers subscribing, they often visit your channel page. Make sure your 
          banner clearly states what your channel is about. Have a channel trailer that hooks 
          new visitors. Organize your videos into playlists so visitors can easily find more 
          content they will enjoy.
        </p>
        <h3 className={s.subheading}>4. Use End Screens Strategically</h3>
        <p className={s.sectionText}>
          End screens should not just show random videos. Link to your best converting videos, 
          the ones that turn viewers into subscribers. Check your analytics to identify these, 
          then promote them at the end of every video.
        </p>
        <h3 className={s.subheading}>5. Double Down on What Works</h3>
        <p className={s.sectionText}>
          Most creators spread themselves thin across many topics. Instead, find the videos that 
          converted the most subscribers and make more content like them. If your tutorial on 
          Photoshop layers brought 500 subscribers, make tutorials on masks, blending modes, 
          and selection tools.
        </p>
        <h3 className={s.subheading}>6. Post Consistently</h3>
        <p className={s.sectionText}>
          Consistency matters more than frequency. Posting one video every Tuesday is better 
          than posting three videos one week and nothing for the next month. Subscribers form 
          habits around your schedule. Pick a frequency you can sustain for years, not weeks.
        </p>
        <h3 className={s.subheading}>7. Engage With Comments</h3>
        <p className={s.sectionText}>
          Replying to comments in the first few hours after upload does two things. First, it 
          signals to YouTube that your video is generating engagement. Second, it builds 
          relationships with viewers who are on the fence about subscribing. A thoughtful reply 
          can be the nudge someone needs.
        </p>
      </section>

      {/* Content That Drives Subscriptions */}
      <section id="content-types" className={s.section}>
        <h2 className={s.sectionTitle}>Content Types That Drive Subscriptions</h2>
        <p className={s.sectionText}>
          Some content formats naturally convert better than others. Consider incorporating 
          these into your content strategy.
        </p>
        <h3 className={s.subheading}>Tutorials and How-To Videos</h3>
        <p className={s.sectionText}>
          When you teach someone how to solve a problem, they often think: this person 
          probably knows other things I want to learn. Tutorials position you as a 
          resource worth following.
        </p>
        <h3 className={s.subheading}>Beginner Guides</h3>
        <p className={s.sectionText}>
          Content for beginners captures viewers at the start of their journey in your topic. 
          These viewers are looking for someone to guide them through the learning process. 
          If your beginner guide helps them, they will likely watch your intermediate and 
          advanced content too.
        </p>
        <h3 className={s.subheading}>Results and Transformations</h3>
        <p className={s.sectionText}>
          I tried X for 30 days or before and after videos show 
          tangible results. Viewers subscribe because they want those results for themselves 
          and believe you can help them get there.
        </p>
        <h3 className={s.subheading}>Deep Dives and Analyses</h3>
        <p className={s.sectionText}>
          Thorough exploration of a single topic signals expertise. When you cover something 
          in depth that others only scratch the surface of, you stand out as the go-to source 
          for that topic.
        </p>
      </section>

      {/* Mistakes */}
      <section id="mistakes" className={s.section}>
        <h2 className={s.sectionTitle}>Subscriber Growth Mistakes to Avoid</h2>
        <p className={s.sectionText}>
          These common mistakes slow down or sabotage subscriber growth. Avoid them from 
          the start.
        </p>
        <h3 className={s.subheading}>Asking for Subscribers in the Intro</h3>
        <p className={s.sectionText}>
          Before we start, make sure to subscribe is one of the least effective 
          subscribe asks. You have not earned it yet. Viewers are skeptical of being sold to 
          before receiving value. Wait until after a key insight or valuable moment.
        </p>
        <h3 className={s.subheading}>Sub4Sub Schemes</h3>
        <p className={s.sectionText}>
          Trading subscriptions with other creators gives you subscribers who have zero interest 
          in your content. These fake subscribers hurt your engagement metrics. When you post 
          a video and your subscribers do not watch, YouTube concludes your content is not 
          interesting and shows it to fewer people.
        </p>
        <h3 className={s.subheading}>Giveaway-Based Subscribers</h3>
        <p className={s.sectionText}>
          Running a giveaway that requires subscribing brings in people who want the prize, 
          not your content. After the giveaway, these subscribers do not engage. Like sub4sub, 
          this damages your engagement ratios.
        </p>
        <h3 className={s.subheading}>Inconsistent Topics</h3>
        <p className={s.sectionText}>
          If someone subscribes for your Python tutorials and you start posting vlogs, you 
          lose them. Every off-topic video confuses your audience and YouTube about what 
          your channel is. If you have multiple interests, consider separate channels.
        </p>
        <h3 className={s.subheading}>Never Asking At All</h3>
        <p className={s.sectionText}>
          Some creators feel awkward asking for subscriptions. But many viewers genuinely 
          appreciate being reminded. A well-timed ask converts viewers who enjoyed your 
          content but would have forgotten to subscribe otherwise.
        </p>
        <h3 className={s.subheading}>Ignoring Packaging</h3>
        <p className={s.sectionText}>
          If viewers do not click your thumbnails, they never see your content, and they 
          never subscribe. Many creators focus entirely on content quality while ignoring 
          packaging. Both matter. Study what works in your niche and invest time in 
          thumbnails and titles.
        </p>
      </section>

      {/* Why Not to Buy */}
      <section id="dont-buy-subscribers" className={s.section}>
        <h2 className={s.sectionTitle}>Why You Should Never Buy YouTube Subscribers</h2>
        <p className={s.sectionText}>
          Services that promise free YouTube subscribers or allow you to buy subscribers 
          seem tempting, especially when growth is slow. But they are harmful in multiple ways.
        </p>
        <h3 className={s.subheading}>Fake Subscribers Destroy Engagement</h3>
        <p className={s.sectionText}>
          Fake subscribers are bots or incentivized users who will never watch your videos. 
          When you upload, they do not engage. YouTube sees that your subscribers are not 
          interested and concludes your content is low quality. This tanks your reach.
        </p>
        <h3 className={s.subheading}>YouTube Detects and Removes Them</h3>
        <p className={s.sectionText}>
          YouTube regularly purges fake accounts. You will see your subscriber count drop, 
          sometimes dramatically. If YouTube detects that you bought subscribers, your 
          channel can be terminated.
        </p>
        <h3 className={s.subheading}>It Does Not Help Monetization</h3>
        <p className={s.sectionText}>
          The YouTube Partner Program requires 1,000 subscribers AND 4,000 watch hours. 
          Fake subscribers do not watch, so they contribute nothing to watch hours. You 
          still will not qualify for monetization.
        </p>
        <p className={s.sectionText}>
          See our{" "}
          <Link href="/learn/free-youtube-subscribers">
            detailed guide on why fake growth destroys channels
          </Link>{" "}
          for more on this topic.
        </p>
      </section>

      {/* 30 Day Plan */}
      <section id="thirty-day-plan" className={s.section}>
        <h2 className={s.sectionTitle}>30 Day Subscriber Growth Plan</h2>
        <p className={s.sectionText}>
          Follow this plan to systematically improve your subscriber conversion over the 
          next month.
        </p>
        <h3 className={s.subheading}>Week 1: Audit and Baseline</h3>
        <ul className={s.list}>
          <li>Run the 15 minute subscriber audit above</li>
          <li>Calculate your current subscribers per 1,000 views</li>
          <li>Identify your top 3 subscriber-converting videos</li>
          <li>Note what they have in common</li>
          <li>Update your channel page banner and about section</li>
        </ul>
        <h3 className={s.subheading}>Week 2: Optimize Existing Content</h3>
        <ul className={s.list}>
          <li>Update end screens on your last 10 videos to link to high-converting content</li>
          <li>Add cards at key moments linking to related videos</li>
          <li>Reply to comments on recent videos to boost engagement</li>
          <li>Create or update your channel trailer</li>
        </ul>
        <h3 className={s.subheading}>Week 3: Create Conversion-Focused Content</h3>
        <ul className={s.list}>
          <li>Plan a video similar to your top converter</li>
          <li>Script a subscribe ask after a key value moment</li>
          <li>Include a clear promise about future content</li>
          <li>Publish and promote the video</li>
        </ul>
        <h3 className={s.subheading}>Week 4: Analyze and Iterate</h3>
        <ul className={s.list}>
          <li>Check subscriber conversion on your new video after 7 days</li>
          <li>Compare to your baseline from week 1</li>
          <li>Identify what improved and what did not</li>
          <li>Plan next month based on learnings</li>
        </ul>
      </section>

      {/* Quick Wins */}
      <section id="quick-wins" className={s.section}>
        <h2 className={s.sectionTitle}>Quick Wins You Can Do Today</h2>
        <p className={s.sectionText}>
          If you only have a few minutes, do these things right now to improve your 
          subscriber growth:
        </p>
        <ol className={s.numberedList}>
          <li>
            <strong>Update your channel banner:</strong> Make sure it clearly communicates 
            what your channel is about and who it is for.
          </li>
          <li>
            <strong>Pin a comment on your most popular video:</strong> Ask viewers what they 
            want to see next and include a subscribe reminder.
          </li>
          <li>
            <strong>Add end screens to your last 5 videos:</strong> Link to your 
            highest-converting content.
          </li>
          <li>
            <strong>Reply to 10 recent comments:</strong> Build relationships with engaged 
            viewers who might subscribe.
          </li>
          <li>
            <strong>Schedule your next video:</strong> Commit to a publishing date and tell 
            your audience when to expect it.
          </li>
        </ol>
      </section>

      {/* CTA */}
      <div className={s.highlight}>
        <p>
          <strong>Find which videos convert viewers to subscribers.</strong> {BRAND.name} analyzes 
          your YouTube data to show you which videos bring in subscribers and what they have in 
          common. Make data-driven decisions about what content to create next.
        </p>
      </div>
    </>
  );
}
