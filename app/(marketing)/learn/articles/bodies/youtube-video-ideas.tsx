/**
 * Body content for YouTube Video Ideas article.
 * Server component - no "use client" directive.
 */

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import type { BodyProps } from "./index";

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* Why Ideas Fail */}
      <section id="why-ideas-fail" className={s.section}>
        <h2 className={s.sectionTitle}>Why Most Video Ideas Fail</h2>
        <p className={s.sectionText}>
          Most creators brainstorm ideas based on gut feeling or what they personally
          find interesting. The problem is that your interests do not always align
          with what your audience searches for or what the algorithm promotes.
        </p>
        <p className={s.sectionText}>
          Data driven idea generation flips this approach. Instead of guessing what
          might work, you start with what your audience already engages with. You
          study what performs well in your niche, identify patterns, and create
          content where demand is proven.
        </p>
        <p className={s.sectionText}>
          The difference between a 500 view video and a 50,000 view video often
          is not production quality or effort. It is whether you picked a topic
          people actually want to watch. A mediocre video on a great topic will
          outperform an excellent video on a topic nobody cares about.
        </p>
        <h3 className={s.subheading}>Common Idea Generation Mistakes</h3>
        <ul className={s.list}>
          <li>Making videos only you care about without validating demand</li>
          <li>Copying competitor videos directly instead of learning patterns</li>
          <li>Ignoring your own analytics and what already works for you</li>
          <li>Chasing trends you cannot execute well or quickly enough</li>
          <li>Overthinking and researching instead of publishing and learning</li>
          <li>Picking saturated topics without any differentiation</li>
        </ul>
      </section>

      {/* Ideas Checklist */}
      <section id="ideas-checklist" className={s.section}>
        <h2 className={s.sectionTitle}>15 Minute Ideas Checklist</h2>
        <p className={s.sectionText}>
          Use this repeatable process whenever you need video ideas. Set a timer
          for 15 minutes and work through each step. The constraint forces you to
          make decisions instead of endlessly researching.
        </p>
        <ol className={s.numberedList}>
          <li>
            <strong>Check your own analytics (3 min):</strong> Open YouTube Studio
            and look at your top 5 videos from the last 90 days. What topics
            performed best? What formats? Note any patterns.
          </li>
          <li>
            <strong>Scan 3 competitor channels (5 min):</strong> Visit three
            channels similar to yours. Sort their videos by Popular. Note topics
            you have not covered yet. Look for outliers in their recent uploads.
          </li>
          <li>
            <strong>YouTube search suggestions (3 min):</strong> Type 5 seed
            topics related to your niche into YouTube search. Write down every
            autocomplete suggestion. These are real queries from real viewers.
          </li>
          <li>
            <strong>Comment mining (3 min):</strong> Open 2 to 3 popular videos
            in your niche. Read the top comments. Look for questions, requests,
            or complaints that suggest video ideas.
          </li>
          <li>
            <strong>Pick your top 3 (1 min):</strong> Review everything you
            wrote down. Circle the 3 ideas with clearest demand and best fit
            for your channel. These are your next video candidates.
          </li>
        </ol>
        <p className={s.sectionText}>
          Run this checklist weekly to maintain a backlog of validated ideas.
          You should never stare at a blank page wondering what to make next.
        </p>
      </section>

      {/* Idea Framework */}
      <section id="idea-framework" className={s.section}>
        <h2 className={s.sectionTitle}>The Video Idea Framework</h2>
        <p className={s.sectionText}>
          Every strong video idea has four components. When evaluating potential
          topics, check that each element is present and compelling.
        </p>
        <h3 className={s.subheading}>1. Viewer Promise</h3>
        <p className={s.sectionText}>
          What will the viewer get from watching? This should be specific and
          valuable. Not just learn about cameras but choose the right camera
          for your budget without wasting money. The promise answers why someone
          should spend their time on your video.
        </p>
        <h3 className={s.subheading}>2. Stakes</h3>
        <p className={s.sectionText}>
          Why does this matter? What happens if viewers do not know this
          information? Stakes create urgency. A video about camera settings
          becomes more compelling when framed as the settings that are ruining
          your photos without you knowing.
        </p>
        <h3 className={s.subheading}>3. Novelty</h3>
        <p className={s.sectionText}>
          What makes your angle different? If 50 videos already cover this topic,
          what is your unique take? Novelty can come from a new method, a
          contrarian opinion, a specific constraint, personal experience, or a
          fresh combination of ideas.
        </p>
        <h3 className={s.subheading}>4. Constraints</h3>
        <p className={s.sectionText}>
          Constraints make ideas specific and clickable. Compare learn photography
          with learn portrait photography in 7 days with just your phone. The
          second version is more compelling because constraints create a clear,
          achievable outcome.
        </p>
      </section>

      {/* 5 Data-Driven Sources */}
      <section id="idea-sources" className={s.section}>
        <h2 className={s.sectionTitle}>5 Data Driven Sources for Video Ideas</h2>
        <p className={s.sectionText}>
          These sources provide validated ideas based on real viewer behavior,
          not guesswork. Use them in combination for best results.
        </p>
        <h3 className={s.subheading}>1. Your Own Best Performers</h3>
        <p className={s.sectionText}>
          Your analytics show what your specific audience wants. Look for videos
          that got more views, subscribers, or engagement than your average.
          These topics resonate with your audience. Make related content, follow
          up videos, or approach the same topic from a different angle.
        </p>
        <p className={s.sectionText}>
          Pay attention to which videos have high impressions click-through rate
          even if total views are modest. High CTR means your packaging worked.
          The topic has potential that better promotion or timing might unlock.
        </p>
        <h3 className={s.subheading}>2. Competitor Outliers</h3>
        <p className={s.sectionText}>
          Videos from similar channels that performed much better than their usual
          content reveal proven demand. If a channel averaging 10,000 views has a
          video with 100,000, that topic has unusual pull. Study what made it work.
        </p>
        <p className={s.sectionText}>
          See our <Link href="/learn/youtube-competitor-analysis">competitor
          analysis guide</Link> for detailed methods to find and analyze outliers.
        </p>
        <h3 className={s.subheading}>3. YouTube Search Suggestions</h3>
        <p className={s.sectionText}>
          The autocomplete dropdown when you type in YouTube search shows real
          queries people actually search for. These are not guesses. YouTube
          suggests terms based on search volume. Every suggestion represents
          viewers actively looking for that content.
        </p>
        <p className={s.sectionText}>
          Use the alphabet trick: type your topic followed by a, then b, then c.
          Each letter surfaces different autocomplete suggestions, expanding your
          list of validated topics.
        </p>
        <h3 className={s.subheading}>4. Comments on Popular Videos</h3>
        <p className={s.sectionText}>
          Questions, requests, and feedback from viewers on top videos in your
          niche are gold. When someone comments can you make a video about X or
          I wish you covered Y, they are telling you exactly what they want.
        </p>
        <p className={s.sectionText}>
          Look for comments with many likes. High engagement on a comment
          suggests other viewers share that interest. A question with 200 likes
          represents demand from hundreds of potential viewers.
        </p>
        <h3 className={s.subheading}>5. Trending Topics in Adjacent Niches</h3>
        <p className={s.sectionText}>
          Formats performing well in related niches that have not been applied to
          yours represent opportunities. If day in the life videos are trending
          in fitness, could that format work for your cooking channel? Cross
          pollinating formats from adjacent niches can make your content feel
          fresh while using a proven structure.
        </p>
      </section>

      {/* Find Trending Videos */}
      <section id="find-trending" className={s.section}>
        <h2 className={s.sectionTitle}>How to Find Trending Videos in Your Niche</h2>
        <p className={s.sectionText}>
          Trending topics represent current viewer interest. Finding them early
          lets you create timely content before topics become oversaturated.
        </p>
        <ol className={s.numberedList}>
          <li>
            <strong>Start with seed topics:</strong> List 5 to 10 core topics
            in your niche. These are your starting points for exploration.
          </li>
          <li>
            <strong>Scan competitor uploads for outliers:</strong> Check what
            channels in your niche uploaded in the last 30 to 90 days. Look for
            videos performing better than usual.
          </li>
          <li>
            <strong>Spot videos with double the typical views:</strong> If a
            channel normally gets 20,000 views and a recent video has 50,000,
            that is a signal worth investigating.
          </li>
          <li>
            <strong>Validate with recency:</strong> Make sure the strong
            performance happened recently. A viral video from last year may
            not reflect current interest.
          </li>
          <li>
            <strong>Check velocity:</strong> How fast did views accumulate? A
            video getting 50,000 views in one week indicates stronger demand
            than one that took six months.
          </li>
          <li>
            <strong>Extract the angle:</strong> What made this video different?
            Was it the topic, title framing, thumbnail, or format? Identify the
            pattern you can apply.
          </li>
          <li>
            <strong>Create your version:</strong> Do not copy. Take the insight
            and apply it with your unique perspective, expertise, or approach.
          </li>
        </ol>
      </section>

      {/* Keyword Research */}
      <section id="keyword-research" className={s.section}>
        <h2 className={s.sectionTitle}>YouTube Keyword Research for Beginners</h2>
        <p className={s.sectionText}>
          Keyword research helps you understand what viewers actually search for.
          This is especially valuable for search-driven content where ranking for
          specific queries brings consistent long-term views.
        </p>
        <ol className={s.numberedList}>
          <li>
            <strong>Go to YouTube search in incognito:</strong> Use a private
            browser window so your search history does not influence suggestions.
          </li>
          <li>
            <strong>Type a broad topic:</strong> Enter the main subject you want
            to cover. Do not press enter yet.
          </li>
          <li>
            <strong>Note autocomplete suggestions:</strong> Write down every
            suggestion YouTube shows. These are real searches with real volume.
          </li>
          <li>
            <strong>Add modifiers:</strong> Try your topic with how to, for
            beginners, vs, best, worst, and review. Each modifier surfaces
            different intent.
          </li>
          <li>
            <strong>Use the alphabet trick:</strong> Type your topic followed by
            each letter of the alphabet. Photography a, photography b, and so on.
            Each letter reveals different suggestions.
          </li>
        </ol>
        <h3 className={s.subheading}>Evaluating Keyword Competition</h3>
        <p className={s.sectionText}>
          After finding keywords, check the competition. Search for your target
          phrase and look at the results. If only mega channels with millions of
          subscribers rank, that keyword may be too competitive for a smaller
          channel. Look for keywords where smaller channels still appear in results.
        </p>
        <p className={s.sectionText}>
          For more SEO strategies, see our <Link href="/learn/youtube-seo">YouTube
          SEO guide</Link>.
        </p>
      </section>

      {/* Idea Frameworks */}
      <section id="idea-frameworks" className={s.section}>
        <h2 className={s.sectionTitle}>8 Video Idea Frameworks That Work</h2>
        <p className={s.sectionText}>
          These frameworks are proven structures you can apply to any niche.
          Each one works because it taps into fundamental viewer motivations.
        </p>
        <h3 className={s.subheading}>1. Comparison Framework</h3>
        <p className={s.sectionText}>
          X vs Y videos help viewers make decisions. iPhone vs Android, Budget
          vs Expensive, Old Way vs New Way. Comparisons work because viewers
          often search when deciding between options. Structure: introduce both
          options, test them on specific criteria, declare a winner for different
          use cases.
        </p>
        <h3 className={s.subheading}>2. Challenge Framework</h3>
        <p className={s.sectionText}>
          I tried X for Y days creates natural story structure with stakes.
          I tried waking up at 5am for 30 days, I ate only protein for a week,
          I used AI to edit all my videos for a month. Challenges are engaging
          because viewers want to see the outcome.
        </p>
        <h3 className={s.subheading}>3. Speedrun Framework</h3>
        <p className={s.sectionText}>
          How fast can you achieve a result? Learning piano in 24 hours, Building
          an app in one day, Going from zero to 1000 subscribers. Time pressure
          creates urgency and proves that goals are achievable.
        </p>
        <h3 className={s.subheading}>4. Teardown Framework</h3>
        <p className={s.sectionText}>
          Analyze and critique existing work. Why this video went viral, Breaking
          down the best sales page, What makes this restaurant successful. Viewers
          learn through your analysis and get to see inside successful examples.
        </p>
        <h3 className={s.subheading}>5. Myth Busting Framework</h3>
        <p className={s.sectionText}>
          Challenge common beliefs. Things everyone gets wrong about X, The lie
          about Y that is costing you money, Why the common advice about Z is
          outdated. Contrarian content stands out and makes viewers curious.
        </p>
        <h3 className={s.subheading}>6. Beginner to Pro Framework</h3>
        <p className={s.sectionText}>
          Show the progression from novice to expert. Complete beginner guide,
          What I wish I knew when I started, The path from zero to hero. This
          framework serves viewers at all skill levels and positions you as
          an authority who has made the journey.
        </p>
        <h3 className={s.subheading}>7. Ranking Framework</h3>
        <p className={s.sectionText}>
          Rank items from worst to best or 1 to 10. Every camera ranked, Rating
          every fast food burger, Tier list of productivity apps. Rankings create
          debate and encourage engagement as viewers agree or disagree with your
          assessments.
        </p>
        <h3 className={s.subheading}>8. Behind the Scenes Framework</h3>
        <p className={s.sectionText}>
          Show the process others do not see. How I actually edit my videos, A
          day in my life running a business, The real cost of making content.
          Transparency builds trust and satisfies viewer curiosity about how
          things really work.
        </p>
      </section>

      {/* Idea Validation Scorecard */}
      <section id="idea-validation-scorecard" className={s.section}>
        <h2 className={s.sectionTitle}>Idea Validation Scorecard</h2>
        <p className={s.sectionText}>
          Before committing to a video idea, score it on these criteria. Each
          factor is rated 1 to 5. Ideas scoring 20 or higher are strong candidates.
          Below 15 suggests the idea needs refinement or should be skipped.
        </p>
        <h3 className={s.subheading}>Scoring Criteria</h3>
        <ul className={s.list}>
          <li>
            <strong>Demand (1-5):</strong> Is there proven interest? Do search
            suggestions exist? Have similar videos performed well?
          </li>
          <li>
            <strong>Competition (1-5):</strong> Can you compete? Are results
            dominated by mega channels or is there room for you?
          </li>
          <li>
            <strong>Audience fit (1-5):</strong> Does this match what your
            subscribers expect? Will it attract your target viewer?
          </li>
          <li>
            <strong>Packaging potential (1-5):</strong> Can you write a compelling
            title? Can you create a clickable thumbnail?
          </li>
          <li>
            <strong>Production feasibility (1-5):</strong> Can you execute this
            well with your resources and skills?
          </li>
          <li>
            <strong>Series potential (1-5):</strong> Could this become multiple
            videos? Does it have follow-up potential?
          </li>
        </ul>
        <h3 className={s.subheading}>Using the Scorecard</h3>
        <p className={s.sectionText}>
          Score your top 3 ideas from the 15 minute checklist. The highest scoring
          idea becomes your next video. If scores are close, pick the one you are
          most excited to make. Enthusiasm affects quality.
        </p>
        <p className={s.sectionText}>
          <strong>Green light:</strong> Score 20 or higher. Clear demand,
          manageable competition, good audience fit. Proceed with confidence.
        </p>
        <p className={s.sectionText}>
          <strong>Yellow light:</strong> Score 15 to 19. Potential but has
          weaknesses. Consider how to improve the weak areas before proceeding.
        </p>
        <p className={s.sectionText}>
          <strong>Red light:</strong> Score below 15. Major issues like no clear
          demand, overwhelming competition, or poor audience fit. Find a
          different idea.
        </p>
      </section>

      {/* Shorts Ideas */}
      <section id="shorts-ideas" className={s.section}>
        <h2 className={s.sectionTitle}>YouTube Shorts Ideas</h2>
        <p className={s.sectionText}>
          Shorts require different thinking than long-form content. You have
          under 60 seconds to deliver value. The best Shorts ideas are single
          concepts executed quickly and memorably.
        </p>
        <h3 className={s.subheading}>Educational Niches</h3>
        <ul className={s.list}>
          <li>One quick tip that solves a specific problem in 30 seconds</li>
          <li>Common mistake and the fix shown side by side</li>
          <li>Tool or technique demonstration with immediate results</li>
          <li>Surprising fact that challenges common assumptions</li>
          <li>Quick transformation or before and after reveal</li>
        </ul>
        <h3 className={s.subheading}>Entertainment Niches</h3>
        <ul className={s.list}>
          <li>Behind the scenes moment from longer content</li>
          <li>Day in the life highlight or unexpected moment</li>
          <li>Before and after reveal with dramatic transformation</li>
          <li>Hot take or opinion that sparks discussion</li>
          <li>Teaser clip from upcoming or existing long-form video</li>
        </ul>
        <h3 className={s.subheading}>Shorts to Long-Form Pipeline</h3>
        <p className={s.sectionText}>
          The best Shorts strategy connects short content to long-form videos.
          Create Shorts that introduce a concept, then link to a detailed video
          that goes deeper. This turns casual Short viewers into channel
          subscribers who watch your longer content.
        </p>
      </section>

      {/* Niche Ideas */}
      <section id="niche-ideas" className={s.section}>
        <h2 className={s.sectionTitle}>YouTube Niche Ideas</h2>
        <p className={s.sectionText}>
          If you are starting a channel and need niche direction, these categories
          have proven audiences. Success depends on finding a specific angle
          within these broad areas.
        </p>
        <ul className={s.list}>
          <li><strong>Technology:</strong> Reviews, tutorials, tech news, app recommendations</li>
          <li><strong>Gaming:</strong> Gameplay, guides, commentary, esports analysis</li>
          <li><strong>Personal finance:</strong> Investing, budgeting, credit, side hustles</li>
          <li><strong>Health and fitness:</strong> Workouts, nutrition, wellness, transformation</li>
          <li><strong>Cooking and food:</strong> Recipes, restaurant reviews, food science</li>
          <li><strong>Education:</strong> Explainers, study tips, skill tutorials, language learning</li>
          <li><strong>DIY and crafts:</strong> Home improvement, woodworking, art, handmade items</li>
          <li><strong>Travel:</strong> Destinations, travel tips, cultural experiences, budget travel</li>
          <li><strong>Productivity:</strong> Time management, tools, habits, work optimization</li>
          <li><strong>Entertainment:</strong> Commentary, reactions, analysis, pop culture</li>
        </ul>
        <p className={s.sectionText}>
          The key is specificity. Cooking is too broad. Budget meal prep for
          college students is specific enough to build an audience. Find the
          intersection of a category, an audience, and a unique angle.
        </p>
      </section>

      {/* From Idea to Video */}
      <section id="idea-to-video" className={s.section}>
        <h2 className={s.sectionTitle}>From Idea to Video: The Process</h2>
        <p className={s.sectionText}>
          Once you have a validated idea, follow this process to turn it into
          a video efficiently. This workflow prevents overthinking and keeps
          production moving.
        </p>
        <ol className={s.numberedList}>
          <li>
            <strong>Write 5 title options:</strong> Before scripting, write 5
            different titles for your video. This forces you to clarify the core
            promise and find the most compelling angle.
          </li>
          <li>
            <strong>Sketch thumbnail concepts:</strong> Rough sketch 2 to 3
            thumbnail ideas. If you cannot imagine a clickable thumbnail, the
            idea may need refinement.
          </li>
          <li>
            <strong>Outline the structure:</strong> Write bullet points for each
            section. Include your hook, main points, and conclusion. Keep it
            high level.
          </li>
          <li>
            <strong>Write the hook first:</strong> Spend extra time on your first
            30 seconds. This determines whether viewers stay. Write it out word
            for word.
          </li>
          <li>
            <strong>Produce and edit:</strong> Film the video, edit it, and review
            for pacing. Cut anything that does not serve the viewer promise.
          </li>
          <li>
            <strong>Finalize packaging:</strong> Create the thumbnail, finalize
            the title, and write the description. Your packaging should match
            the content.
          </li>
          <li>
            <strong>Publish and analyze:</strong> Upload the video and track its
            performance. After 48 hours and again after 7 days, check analytics
            to learn what worked.
          </li>
        </ol>
      </section>

      {/* Title and Thumbnail */}
      <section id="title-thumbnail" className={s.section}>
        <h2 className={s.sectionTitle}>YouTube Title Ideas and Thumbnail Ideas</h2>
        <p className={s.sectionText}>
          Your title and thumbnail determine whether people click. The best
          video idea fails if packaging does not compel viewers to watch.
        </p>
        <h3 className={s.subheading}>15 YouTube Title Templates</h3>
        <ol className={s.numberedList}>
          <li>How to [achieve result] in [timeframe]</li>
          <li>[Number] [things] every [audience] should know</li>
          <li>I tried [thing] for [timeframe]. Here is what happened.</li>
          <li>Why [common belief] is wrong</li>
          <li>The [only/best/fastest] way to [result]</li>
          <li>[Thing] vs [thing]: which is actually better?</li>
          <li>Stop doing [mistake] (do this instead)</li>
          <li>What nobody tells you about [topic]</li>
          <li>Is [thing] actually worth it?</li>
          <li>[Number] mistakes [audience] make</li>
          <li>The truth about [controversial topic]</li>
          <li>[Result] without [common requirement]</li>
          <li>Why I stopped [common practice]</li>
          <li>[Impressive result] with just [minimal input]</li>
          <li>Everything you need to know about [topic]</li>
        </ol>
        <h3 className={s.subheading}>Thumbnail Best Practices</h3>
        <p className={s.sectionText}>
          Thumbnails must be readable at small sizes, stand out in the feed, and
          communicate the video promise instantly. See our{" "}
          <Link href="/learn/youtube-thumbnail-best-practices">thumbnail guide</Link>
          {" "}for detailed strategies.
        </p>
        <ul className={s.list}>
          <li>Use high contrast colors that stand out</li>
          <li>Keep text to 3 words or less</li>
          <li>Show faces with clear emotions when relevant</li>
          <li>Avoid clutter and busy backgrounds</li>
          <li>Test at small sizes to ensure readability</li>
        </ul>
      </section>

      {/* 30 Day Content Plan */}
      <section id="content-plan" className={s.section}>
        <h2 className={s.sectionTitle}>30 Day Content Plan</h2>
        <p className={s.sectionText}>
          This template helps you maintain consistent uploads without scrambling
          for ideas. Adapt the timeline to your upload frequency.
        </p>
        <h3 className={s.subheading}>Week 1: Research and Brainstorm</h3>
        <ul className={s.list}>
          <li>Run the 15 minute ideas checklist 3 times on different days</li>
          <li>Build a list of 15 to 20 raw ideas</li>
          <li>Score each idea using the validation scorecard</li>
          <li>Identify your top 4 ideas for the month</li>
        </ul>
        <h3 className={s.subheading}>Week 2: Pick Themes and Outline</h3>
        <ul className={s.list}>
          <li>Group ideas by theme or content type</li>
          <li>Write title options and sketch thumbnail concepts for top ideas</li>
          <li>Create outlines for your first 2 videos</li>
          <li>Schedule your production timeline for the month</li>
        </ul>
        <h3 className={s.subheading}>Week 3: Produce and Publish</h3>
        <ul className={s.list}>
          <li>Film video 1 and 2</li>
          <li>Edit and publish video 1</li>
          <li>Create thumbnails and finalize titles</li>
          <li>Monitor early performance of published content</li>
        </ul>
        <h3 className={s.subheading}>Week 4: Evaluate and Iterate</h3>
        <ul className={s.list}>
          <li>Publish video 2 and begin work on video 3</li>
          <li>Review performance of video 1 after 7 days</li>
          <li>Note what worked and what to improve</li>
          <li>Start research for next month using your learnings</li>
        </ul>
      </section>

      {/* Example: One Topic to 12 Ideas */}
      <section id="example" className={s.section}>
        <h2 className={s.sectionTitle}>Example: One Topic to 12 Ideas</h2>
        <p className={s.sectionText}>
          Here is how to expand a single topic into multiple video ideas using
          different frameworks. Starting topic: Coffee Brewing.
        </p>
        <ol className={s.numberedList}>
          <li>
            <strong>Comparison:</strong> French Press vs Pour Over: Which Makes
            Better Coffee?
          </li>
          <li>
            <strong>Challenge:</strong> I Made Coffee 4 Different Ways Every Day
            for a Week
          </li>
          <li>
            <strong>Speedrun:</strong> How Fast Can I Learn to Make Latte Art?
          </li>
          <li>
            <strong>Teardown:</strong> Why This Coffee Shop Makes the Best Espresso
            in the City
          </li>
          <li>
            <strong>Myth busting:</strong> 5 Coffee Myths That Are Ruining Your
            Morning Brew
          </li>
          <li>
            <strong>Beginner guide:</strong> Complete Coffee Brewing Guide for
            Absolute Beginners
          </li>
          <li>
            <strong>Ranking:</strong> I Ranked Every Coffee Brewing Method from
            Worst to Best
          </li>
          <li>
            <strong>Behind the scenes:</strong> My Morning Coffee Routine and Why
            It Costs $0.50
          </li>
          <li>
            <strong>How to:</strong> How to Make Cafe Quality Coffee at Home for
            Under $100
          </li>
          <li>
            <strong>Mistakes:</strong> 7 Mistakes Ruining Your Home Brewed Coffee
          </li>
          <li>
            <strong>Gear review:</strong> The Only Coffee Equipment You Actually
            Need
          </li>
          <li>
            <strong>Transformation:</strong> I Upgraded My Coffee Setup for $50.
            Here is What Changed.
          </li>
        </ol>
        <p className={s.sectionText}>
          One topic becomes 12 distinct videos, each serving different viewer
          intents. Apply this expansion technique to your own niche topics.
        </p>
      </section>

      {/* 50 Video Ideas */}
      <section id="video-ideas-list" className={s.section}>
        <h2 className={s.sectionTitle}>50 Video Idea Starters</h2>
        <p className={s.sectionText}>
          Use these templates as starting points. Replace the brackets with
          specifics from your niche. Each idea includes the viewer promise in
          parentheses.
        </p>
        <h3 className={s.subheading}>How-To Ideas</h3>
        <ul className={s.list}>
          <li>How to [skill] in [time constraint] (learn faster)</li>
          <li>How to [result] without [common requirement] (achieve easier)</li>
          <li>How I [impressive result] and how you can too (proven method)</li>
          <li>How to fix [common problem] in [time] (quick solution)</li>
          <li>How to [skill] like a professional (level up)</li>
        </ul>
        <h3 className={s.subheading}>List Ideas</h3>
        <ul className={s.list}>
          <li>[Number] things I wish I knew before [activity] (avoid mistakes)</li>
          <li>[Number] [tools/products] that actually work (save research time)</li>
          <li>[Number] mistakes killing your [result] (diagnose problems)</li>
          <li>[Number] habits of successful [people in niche] (model success)</li>
          <li>[Number] [things] you should never [do] (avoid pitfalls)</li>
        </ul>
        <h3 className={s.subheading}>Story Ideas</h3>
        <ul className={s.list}>
          <li>How I went from [starting point] to [end point] (transformation)</li>
          <li>What happened when I [did unusual thing] (curiosity)</li>
          <li>I tried [challenge] for [time period] (experiment results)</li>
          <li>The real reason I [made big decision] (authentic insight)</li>
          <li>Why I quit [popular thing] after [time] (contrarian view)</li>
        </ul>
        <h3 className={s.subheading}>Opinion and Analysis Ideas</h3>
        <ul className={s.list}>
          <li>Why [popular advice] is wrong (challenge assumptions)</li>
          <li>The problem with [trend] that nobody talks about (hidden insight)</li>
          <li>What [successful example] gets right that others miss (learn from best)</li>
          <li>Is [popular thing] actually worth it? (help decision making)</li>
          <li>[Topic] is changing. Here is what it means for you. (stay informed)</li>
        </ul>
        <h3 className={s.subheading}>Resource and Guide Ideas</h3>
        <ul className={s.list}>
          <li>The complete guide to [topic] for [audience] (comprehensive resource)</li>
          <li>Everything you need to start [activity] (beginner roadmap)</li>
          <li>My exact [process/system] for [result] (copy what works)</li>
          <li>[Timeframe] plan to achieve [goal] (actionable steps)</li>
          <li>The [only/essential] [things] you need for [goal] (simplify choices)</li>
        </ul>
      </section>

      {/* Tools */}
      <section id="tools" className={s.section}>
        <h2 className={s.sectionTitle}>Tools for Ideas and Titles</h2>
        <p className={s.sectionText}>
          These tools can accelerate your idea research. None replace the
          fundamental work of understanding your audience, but they can surface
          data faster.
        </p>
        <h3 className={s.subheading}>Free Tools</h3>
        <ul className={s.list}>
          <li><strong>YouTube Search:</strong> Autocomplete suggestions show real queries</li>
          <li><strong>YouTube Studio:</strong> Your own analytics are the best data source</li>
          <li><strong>Google Trends:</strong> Compare topic interest over time</li>
          <li><strong>Reddit and Quora:</strong> See what questions people ask in your niche</li>
        </ul>
        <h3 className={s.subheading}>AI Title Generators</h3>
        <p className={s.sectionText}>
          AI tools can help brainstorm title variations quickly. Feed them a
          topic and examples of titles that work in your niche. However, always
          edit AI output. Generated titles often sound generic until you add
          personality and specificity.
        </p>
        <h3 className={s.subheading}>Caution About Tools</h3>
        <p className={s.sectionText}>
          Do not let tools replace thinking. A tool might show search volume for
          a topic, but it cannot tell you if you can execute it well or if it
          fits your audience. Use tools to gather data, then apply judgment.
        </p>
      </section>

      {/* Mistakes */}
      <section id="mistakes" className={s.section}>
        <h2 className={s.sectionTitle}>Common Video Idea Mistakes</h2>
        <p className={s.sectionText}>
          Avoid these mistakes that cause video ideas to fail even when the
          underlying concept has potential.
        </p>
        <ul className={s.list}>
          <li>
            <strong>Making videos only you care about.</strong> Validate demand
            first. Your interests matter but audience interest determines views.
          </li>
          <li>
            <strong>Copying competitor videos directly.</strong> Learn patterns,
            not executions. Your version should be different and better.
          </li>
          <li>
            <strong>Ignoring your own analytics.</strong> Make more content like
            your hits. Your past successes show what your audience wants.
          </li>
          <li>
            <strong>Chasing trends you cannot execute.</strong> A trending topic
            only helps if you can make quality content on it quickly.
          </li>
          <li>
            <strong>Overthinking before starting.</strong> Limit research time,
            then ship. You learn more from publishing than from planning.
          </li>
          <li>
            <strong>Saturated topics without differentiation.</strong> If 1000
            videos exist on your topic, you need a unique angle to stand out.
          </li>
          <li>
            <strong>Weak packaging on good ideas.</strong> A great idea with a
            boring title and thumbnail still fails to get clicks.
          </li>
          <li>
            <strong>Inconsistent topics confusing your audience.</strong> Jumping
            between unrelated topics makes it hard to build a subscriber base.
          </li>
        </ul>
      </section>

      {/* CTA */}
      <div className={s.highlight}>
        <p>
          <strong>Want help finding video ideas?</strong> {BRAND.name} generates
          ideas based on what is working in your niche. See trending topics,
          competitor outliers, and validated ideas without hours of manual
          research. Stop guessing what to make next and start with proven demand.
        </p>
      </div>
    </>
  );
}
