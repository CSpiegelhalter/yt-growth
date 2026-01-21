/**
 * Body content for YouTube Competitor Analysis article.
 * Server component - no "use client" directive.
 */

import { BRAND } from "@/lib/brand";
import type { BodyProps } from "./index";

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* Why Competitor Analysis */}
      <section id="why-competitor-analysis" className={s.section}>
        <h2 className={s.sectionTitle}>Why Competitor Analysis Matters</h2>
        <p className={s.sectionText}>
          Every channel in your niche is running experiments for you. They test topics, 
          formats, thumbnails, hooks, video lengths, and upload schedules. Some experiments 
          work. Most do not. Competitor analysis lets you learn from their results without 
          spending months figuring it out yourself.
        </p>
        <p className={s.sectionText}>
          This is not about copying. Copying produces a worse version of what already exists. 
          What you want are patterns. When three different channels in your niche all have 
          videos on the same topic that outperform their average, that tells you something 
          important about what the audience wants. When certain thumbnail styles consistently 
          get more clicks, that is a pattern worth noting.
        </p>
        <p className={s.sectionText}>
          Competitor analysis also helps you identify gaps. What topics are underserved? 
          What questions are viewers asking in comments that no one has answered well? 
          Where is there room for a better explanation, a different angle, or a more 
          thorough treatment?
        </p>
        <h3 className={s.subheading}>What You Can Learn from Competitors</h3>
        <ul className={s.list}>
          <li>
            <strong>Topics that resonate:</strong> Which subjects get the most engagement 
            in your niche?
          </li>
          <li>
            <strong>Title formulas:</strong> What patterns of titles get clicks?
          </li>
          <li>
            <strong>Thumbnail styles:</strong> What visual approaches stand out?
          </li>
          <li>
            <strong>Video formats:</strong> What structures and lengths work?
          </li>
          <li>
            <strong>Content gaps:</strong> What is missing or poorly covered?
          </li>
          <li>
            <strong>Audience questions:</strong> What do viewers want that is not being 
            delivered?
          </li>
        </ul>
      </section>

      {/* Competitor Checklist */}
      <section id="competitor-checklist" className={s.section}>
        <h2 className={s.sectionTitle}>15 Minute Competitor Analysis Checklist</h2>
        <p className={s.sectionText}>
          Use this checklist to quickly analyze competitors and extract actionable insights. 
          You can complete this in about 15 minutes per batch of channels.
        </p>
        <ol className={s.numberedList}>
          <li>
            <strong>Pick 3 competitor channels (2 min):</strong> Choose channels in your 
            niche that are similar size or slightly larger. Mega channels with millions 
            of subscribers play by different rules.
          </li>
          <li>
            <strong>Sort by Popular (1 min per channel):</strong> Go to each channel&apos;s 
            Videos tab and sort by Popular to see their all-time top performers.
          </li>
          <li>
            <strong>Note the top 3 videos from each (3 min):</strong> Write down the titles, 
            view counts, and what topics they cover. Look for common themes.
          </li>
          <li>
            <strong>Sort by newest and find outliers (3 min):</strong> Look for recent 
            videos that performed much better than the channel&apos;s average. These are 
            outliers that caught audience interest.
          </li>
          <li>
            <strong>Watch the first 30 seconds of standout videos (4 min):</strong> How 
            do they hook viewers? What do they promise? How quickly do they deliver value?
          </li>
          <li>
            <strong>Note patterns (1 min):</strong> Write down 2 to 3 patterns you noticed 
            across the successful videos. These could be topic types, title formulas, 
            thumbnail styles, or content structures.
          </li>
          <li>
            <strong>Pick one pattern to test (1 min):</strong> Choose one pattern you 
            will apply to your next video. Do not try to implement everything at once.
          </li>
        </ol>
      </section>

      {/* How to Find Competitors */}
      <section id="find-competitors" className={s.section}>
        <h2 className={s.sectionTitle}>How to Find Competitors on YouTube</h2>
        <p className={s.sectionText}>
          Finding the right competitors to study is crucial. You want channels that share 
          your audience, not just your topic. Here are methods to find them:
        </p>
        <h3 className={s.subheading}>Method 1: YouTube Search</h3>
        <p className={s.sectionText}>
          Search for your main topics on YouTube. Note which channels appear repeatedly 
          in the results. These are channels YouTube considers relevant to topics you 
          want to cover. Pay attention to both the top results and videos further down 
          from smaller channels.
        </p>
        <h3 className={s.subheading}>Method 2: Suggested Videos Sidebar</h3>
        <p className={s.sectionText}>
          Watch videos similar to what you make. The suggested sidebar shows what YouTube 
          thinks viewers would watch next. These channels are competing for the same 
          audience attention you want.
        </p>
        <h3 className={s.subheading}>Method 3: Channels Tab</h3>
        <p className={s.sectionText}>
          Many channels have a Channels tab showing other creators they recommend. Check 
          this on channels you admire. These curated recommendations often lead to high 
          quality similar content.
        </p>
        <h3 className={s.subheading}>Method 4: Community Playlists</h3>
        <p className={s.sectionText}>
          Search for playlists in your niche created by viewers. Phrases like best cooking 
          channels or top productivity YouTubers often surface community-curated lists of 
          competitors.
        </p>
        <h3 className={s.subheading}>Method 5: Ask Your Audience</h3>
        <p className={s.sectionText}>
          If you already have some audience, ask what other channels they watch. Post in 
          your community tab or mention it in a video. This gives you direct insight into 
          who your viewers also follow.
        </p>
        <h3 className={s.subheading}>Choosing the Right Competitors</h3>
        <ul className={s.list}>
          <li>
            <strong>Similar niche:</strong> They should cover topics you want to cover.
          </li>
          <li>
            <strong>Reachable size:</strong> Study channels with 10x to 100x your subscribers, 
            not 1000x. Their strategies are more applicable to your stage.
          </li>
          <li>
            <strong>Active uploading:</strong> Channels that stopped uploading years ago 
            may have outdated strategies.
          </li>
          <li>
            <strong>Variety:</strong> Study 5 to 10 channels with different styles to see 
            what approaches work.
          </li>
        </ul>
      </section>

      {/* Find Trending Videos */}
      <section id="find-trending" className={s.section}>
        <h2 className={s.sectionTitle}>How to Find Trending Videos in Your Niche</h2>
        <p className={s.sectionText}>
          Trending videos reveal what audiences are currently interested in. Finding these 
          early lets you create timely content before topics become oversaturated.
        </p>
        <ol className={s.numberedList}>
          <li>
            <strong>Start with seed topics:</strong> List 5 to 10 core topics in your niche. 
            These are your starting points for exploration.
          </li>
          <li>
            <strong>Scan competitor uploads:</strong> Check what your tracked competitors 
            uploaded in the last 30 to 90 days. Sort their videos by most recent.
          </li>
          <li>
            <strong>Spot outliers:</strong> Look for videos with double or more the typical 
            view count for that channel. If a channel averages 10,000 views and one video 
            has 50,000, that is an outlier worth studying.
          </li>
          <li>
            <strong>Validate with recency:</strong> Make sure the outlier performance happened 
            recently. A video from 3 years ago may not reflect current audience interests.
          </li>
          <li>
            <strong>Check velocity:</strong> How fast did the views accumulate? A video that 
            got 50,000 views in 2 weeks signals stronger demand than one that accumulated 
            50,000 over 2 years.
          </li>
          <li>
            <strong>Extract the angle:</strong> What made this video different? Was it the 
            topic, the title framing, the thumbnail style, or the format?
          </li>
          <li>
            <strong>Create your version:</strong> Do not copy. Take the insight and apply it 
            with your unique perspective, expertise, or approach.
          </li>
        </ol>
      </section>

      {/* Find Outlier Videos */}
      <section id="outliers" className={s.section}>
        <h2 className={s.sectionTitle}>How to Find Outlier Videos</h2>
        <p className={s.sectionText}>
          Outliers are videos that significantly outperformed a channel&apos;s average. 
          They reveal what resonated unusually well with the audience.
        </p>
        <h3 className={s.subheading}>Manual Method</h3>
        <ol className={s.numberedList}>
          <li>Go to a competitor channel and click the Videos tab</li>
          <li>
            Scroll through recent videos (last 3 to 6 months) and mentally note their 
            typical view count
          </li>
          <li>
            Any video with 2x or more than that typical count is an outlier worth analyzing
          </li>
          <li>
            Consider the video length and format when comparing. Shorts and long-form have 
            different baselines.
          </li>
        </ol>
        <h3 className={s.subheading}>What Makes Fair Comparisons</h3>
        <ul className={s.list}>
          <li>
            <strong>Same time window:</strong> Compare videos uploaded in similar periods. 
            Channels grow, so older videos had less initial audience.
          </li>
          <li>
            <strong>Same format:</strong> Compare long-form to long-form, Shorts to Shorts.
          </li>
          <li>
            <strong>Account for virality decay:</strong> A video that went viral 6 months 
            ago may not indicate current audience interest.
          </li>
        </ul>
        <h3 className={s.subheading}>Analyzing Outliers</h3>
        <p className={s.sectionText}>
          When you find an outlier, ask these questions:
        </p>
        <ul className={s.list}>
          <li>What topic does it cover? Is this topic underserved elsewhere?</li>
          <li>What does the title promise? How does it create curiosity or value?</li>
          <li>What makes the thumbnail stand out? Colors, faces, text, composition?</li>
          <li>How does the video start? What hook keeps viewers watching?</li>
          <li>What are viewers saying in the comments? What resonated?</li>
        </ul>
      </section>

      {/* What to Track */}
      <section id="what-to-track" className={s.section}>
        <h2 className={s.sectionTitle}>What to Track on Competitor Channels</h2>
        <p className={s.sectionText}>
          Effective competitor analysis requires tracking specific elements. Here is what 
          to pay attention to:
        </p>
        <h3 className={s.subheading}>Title Patterns</h3>
        <p className={s.sectionText}>
          What title formulas work in your niche? Common patterns include how-to titles, 
          number lists, question titles, curiosity gaps, and direct benefit promises. Note 
          which patterns appear in top-performing videos.
        </p>
        <h3 className={s.subheading}>Thumbnail Patterns</h3>
        <p className={s.sectionText}>
          What visual styles get clicks? Look at face placement, text usage, color schemes, 
          composition, and contrast. Some niches favor faces, others favor product shots 
          or graphics.
        </p>
        <h3 className={s.subheading}>Topics and Themes</h3>
        <p className={s.sectionText}>
          What subjects does the audience engage with most? Track which topics appear in 
          top performers across multiple channels. These are proven audience interests.
        </p>
        <h3 className={s.subheading}>Video Length and Format</h3>
        <p className={s.sectionText}>
          What video lengths work for different topics? Some niches prefer longer deep 
          dives, others favor shorter focused content. Track what lengths correlate with 
          strong performance.
        </p>
        <h3 className={s.subheading}>Hooks and Openings</h3>
        <p className={s.sectionText}>
          How do successful videos start? Watch the first 30 seconds of top performers. 
          Do they open with a question, a promise, a shocking statement, or a preview of 
          what is coming?
        </p>
        <h3 className={s.subheading}>Series and Recurring Formats</h3>
        <p className={s.sectionText}>
          Do competitors have recurring series or formats? Successful series indicate 
          content that builds viewer habits. Note which formats have multiple installments.
        </p>
        <h3 className={s.subheading}>Comment Themes</h3>
        <p className={s.sectionText}>
          What are viewers saying? Comments reveal what resonated, what questions remain, 
          and what viewers want more of. Sort by Top comments for the most engaged responses.
        </p>
      </section>

      {/* YouTube Stats */}
      <section id="youtube-stats" className={s.section}>
        <h2 className={s.sectionTitle}>YouTube Stats You Can and Cannot See</h2>
        <p className={s.sectionText}>
          Understanding what data is publicly visible helps you focus your analysis on 
          available information.
        </p>
        <h3 className={s.subheading}>Public Data (What You Can See)</h3>
        <ul className={s.list}>
          <li>
            <strong>View counts:</strong> Total views on any video.
          </li>
          <li>
            <strong>Upload dates:</strong> When videos were published.
          </li>
          <li>
            <strong>Likes:</strong> Number of likes on each video.
          </li>
          <li>
            <strong>Comments:</strong> Number and content of comments.
          </li>
          <li>
            <strong>Subscriber count:</strong> Total channel subscribers (unless hidden).
          </li>
          <li>
            <strong>Video length:</strong> Duration of each video.
          </li>
          <li>
            <strong>Descriptions:</strong> Full video descriptions with links and keywords.
          </li>
        </ul>
        <h3 className={s.subheading}>Private Data (What You Cannot See)</h3>
        <ul className={s.list}>
          <li>
            <strong>Retention curves:</strong> How long viewers actually watch. This is only 
            visible to the channel owner.
          </li>
          <li>
            <strong>Click-through rate:</strong> What percentage of impressions become clicks.
          </li>
          <li>
            <strong>Traffic sources:</strong> Where views come from (search, suggested, browse).
          </li>
          <li>
            <strong>Subscriber conversion:</strong> How many subscribers each video generates.
          </li>
          <li>
            <strong>Revenue:</strong> How much the channel earns.
          </li>
          <li>
            <strong>Demographics:</strong> Age, gender, and location of viewers.
          </li>
        </ul>
        <p className={s.sectionText}>
          Focus your analysis on public data while making reasonable inferences about 
          private metrics based on visible performance.
        </p>
      </section>

      {/* Titles and Thumbnails */}
      <section id="title-thumbnail" className={s.section}>
        <h2 className={s.sectionTitle}>Steal the Pattern, Not the Video</h2>
        <p className={s.sectionText}>
          The goal is to learn patterns you can apply to your own original content, not 
          to copy videos directly. Here are common title patterns that work across niches:
        </p>
        <h3 className={s.subheading}>Title Pattern Examples</h3>
        <ul className={s.list}>
          <li>
            <strong>How to + result:</strong> How to [achieve thing] in [timeframe or constraint]. 
            Example: How to Edit Videos in Half the Time.
          </li>
          <li>
            <strong>Number list:</strong> [Number] [things] that [benefit]. Example: 7 Camera 
            Settings That Will Transform Your Photos.
          </li>
          <li>
            <strong>Curiosity gap:</strong> Why [surprising thing] actually [works or does not work]. 
            Example: Why Your Best Videos Get the Least Views.
          </li>
          <li>
            <strong>Question:</strong> Is [thing] actually [claim]? Example: Is This $50 Mic 
            Really Better Than a $500 One?
          </li>
          <li>
            <strong>Direct benefit:</strong> The [only/fastest/easiest] way to [result]. 
            Example: The Only Lighting Setup You Actually Need.
          </li>
          <li>
            <strong>Experience:</strong> I tried [thing] for [timeframe]. Here is what happened. 
            Example: I Posted Daily for 30 Days. Here is What Happened.
          </li>
        </ul>
        <h3 className={s.subheading}>Thumbnail Pattern Examples</h3>
        <ul className={s.list}>
          <li>
            <strong>Before/after:</strong> Split images showing transformation.
          </li>
          <li>
            <strong>Face + emotion:</strong> Expressive face conveying the video&apos;s tone.
          </li>
          <li>
            <strong>Product focus:</strong> Clean shot of the main subject with minimal text.
          </li>
          <li>
            <strong>Text + image:</strong> Bold text overlaid on relevant imagery.
          </li>
          <li>
            <strong>Contrast:</strong> Bright colors against dark backgrounds or vice versa.
          </li>
        </ul>
      </section>

      {/* Common Mistakes */}
      <section id="mistakes" className={s.section}>
        <h2 className={s.sectionTitle}>Common Competitor Analysis Mistakes</h2>
        <p className={s.sectionText}>
          Avoid these common mistakes that make competitor analysis less effective:
        </p>
        <h3 className={s.subheading}>Copying Videos Directly</h3>
        <p className={s.sectionText}>
          If you make the same video someone else already made, you are offering a worse 
          version of existing content. Extract patterns and apply them to original ideas. 
          Your perspective, expertise, or approach should make your version different and 
          valuable.
        </p>
        <h3 className={s.subheading}>Only Studying Mega Channels</h3>
        <p className={s.sectionText}>
          Channels with millions of subscribers can succeed with content that would fail 
          for smaller creators. They have built-in audiences, brand recognition, and 
          algorithmic momentum. Study channels closer to your size for applicable lessons.
        </p>
        <h3 className={s.subheading}>Ignoring Context Behind Viral Videos</h3>
        <p className={s.sectionText}>
          A viral video might have succeeded due to timing, external promotion, or a 
          celebrity mention, not just the content itself. Look for patterns across multiple 
          videos, not single outliers that might be flukes.
        </p>
        <h3 className={s.subheading}>Focusing Only on View Counts</h3>
        <p className={s.sectionText}>
          Views matter, but engagement (likes, comments) indicates content quality. A video 
          with fewer views but high engagement might be more worth emulating than a 
          high-view, low-engagement video that got lucky.
        </p>
        <h3 className={s.subheading}>Analysis Paralysis</h3>
        <p className={s.sectionText}>
          Spending too much time analyzing and not enough time creating. Set a time limit 
          for research (15 to 30 minutes), extract insights, then create content. You 
          learn more from publishing than from endless research.
        </p>
        <h3 className={s.subheading}>Tracking Too Many Competitors</h3>
        <p className={s.sectionText}>
          Following 50 channels means you cannot study any of them deeply. Pick 5 to 10 
          channels and know them well. Track their uploads, notice patterns, and understand 
          their strategies.
        </p>
      </section>

      {/* 30 Day Plan */}
      <section id="30-day-plan" className={s.section}>
        <h2 className={s.sectionTitle}>30 Day Competitor Analysis Plan</h2>
        <p className={s.sectionText}>
          Follow this plan to build a competitor analysis habit that informs your content 
          strategy:
        </p>
        <h3 className={s.subheading}>Week 1: Research and Setup</h3>
        <ul className={s.list}>
          <li>Identify 5 to 8 competitor channels using the methods above</li>
          <li>Run the 15 minute analysis checklist on each channel</li>
          <li>Create a document or spreadsheet to track insights</li>
          <li>Note initial patterns you observe across channels</li>
        </ul>
        <h3 className={s.subheading}>Week 2: Pick Patterns and Plan</h3>
        <ul className={s.list}>
          <li>Review your notes and identify 3 clear patterns</li>
          <li>Brainstorm 5 to 10 video ideas that apply these patterns</li>
          <li>Validate ideas by checking if similar content performs well</li>
          <li>Select the best idea for your next video</li>
        </ul>
        <h3 className={s.subheading}>Week 3: Create and Test</h3>
        <ul className={s.list}>
          <li>Produce your video applying the learned pattern</li>
          <li>Craft title and thumbnail based on what works in your niche</li>
          <li>Publish and track initial performance</li>
          <li>Compare to your recent videos for context</li>
        </ul>
        <h3 className={s.subheading}>Week 4: Evaluate and Iterate</h3>
        <ul className={s.list}>
          <li>Review performance after 7 days</li>
          <li>Note what worked and what did not</li>
          <li>Check competitor channels for new uploads and outliers</li>
          <li>Plan next month&apos;s content based on learnings</li>
        </ul>
      </section>

      {/* Example */}
      <section id="example" className={s.section}>
        <h2 className={s.sectionTitle}>Example: From Competitor Insight to Video Plan</h2>
        <p className={s.sectionText}>
          Here is a concrete example of turning competitor analysis into a content plan:
        </p>
        <h3 className={s.subheading}>The Scenario</h3>
        <p className={s.sectionText}>
          You run a Home Coffee Brewing channel with 8,000 subscribers. You want to find 
          your next video topic using competitor analysis.
        </p>
        <h3 className={s.subheading}>The Analysis</h3>
        <p className={s.sectionText}>
          You analyze 5 similar channels and notice a pattern: Budget equipment comparison 
          videos with specific numbers consistently outperform other content types. Videos 
          like Best Espresso Machine Under $200 and I Tested 5 Budget Grinders get 3x to 
          5x more views than average.
        </p>
        <h3 className={s.subheading}>The Pattern</h3>
        <p className={s.sectionText}>
          The pattern is: Budget equipment + specific number + testing/comparison format. 
          Viewers want help making purchase decisions without breaking the bank.
        </p>
        <h3 className={s.subheading}>Video Ideas From This Pattern</h3>
        <ol className={s.numberedList}>
          <li>I Tested 5 Budget Espresso Machines. Here is the Only One I Kept.</li>
          <li>The Best Coffee Grinder Under $50 (I Tried 4)</li>
          <li>Cheap vs Expensive Pour Over: Can You Taste the Difference?</li>
          <li>3 Coffee Subscriptions Compared: Which Is Actually Worth It?</li>
          <li>I Tried Every Milk Frother on Amazon. Most Are Terrible.</li>
        </ol>
        <h3 className={s.subheading}>Applying Your Unique Angle</h3>
        <p className={s.sectionText}>
          Each of these applies the pattern but allows for your unique perspective. Maybe 
          you focus on a specific criteria others ignore. Maybe your testing methodology 
          is more thorough. Maybe you bring humor or storytelling that competitors lack. 
          The pattern is the foundation; your execution makes it yours.
        </p>
      </section>

      {/* Building a System */}
      <section id="building-system" className={s.section}>
        <h2 className={s.sectionTitle}>Building a Competitor Analysis System</h2>
        <p className={s.sectionText}>
          Turn competitor analysis from a one-time task into an ongoing practice:
        </p>
        <h3 className={s.subheading}>Weekly Check-In (15 minutes)</h3>
        <ul className={s.list}>
          <li>Check what your tracked competitors uploaded this week</li>
          <li>Note any videos that seem to be performing unusually well</li>
          <li>Save promising ideas or patterns to your idea bank</li>
        </ul>
        <h3 className={s.subheading}>Monthly Deep Dive (1 hour)</h3>
        <ul className={s.list}>
          <li>Run the full 15 minute checklist on each tracked channel</li>
          <li>Review outliers from the past month</li>
          <li>Update your list of tracked channels if needed</li>
          <li>Plan next month&apos;s content based on patterns</li>
        </ul>
        <h3 className={s.subheading}>Quarterly Review (2 hours)</h3>
        <ul className={s.list}>
          <li>Assess which competitor-inspired videos performed best for you</li>
          <li>Look for new competitors emerging in your niche</li>
          <li>Identify macro trends across the quarter</li>
          <li>Refine your analysis process based on what produces results</li>
        </ul>
      </section>

      {/* CTA */}
      <div className={s.highlight}>
        <p>
          <strong>Want to find competitor insights faster?</strong> {BRAND.name} helps you 
          track competitor channels, spot outlier videos automatically, and identify 
          trending topics in your niche. Stop guessing what to make next.
        </p>
      </div>
    </>
  );
}
