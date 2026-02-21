/**
 * Body content for YouTube Tag Generator article.
 * Server component - no "use client" directive.
 */

import Link from "next/link";
import { BRAND } from "@/lib/shared/brand";
import { LEARN_ARTICLES } from "../../articles";
import type { BodyProps } from "./_shared";
import { articleExports } from "./_shared";

export const { meta, toc } = articleExports(LEARN_ARTICLES["youtube-tag-generator"]);

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* What Are Tags */}
      <section id="what-are-tags" className={s.section}>
        <h2 className={s.sectionTitle}>What Are YouTube Tags</h2>
        <p className={s.sectionText}>
          YouTube tags are keywords you add to your video to help YouTube understand 
          your content. They are metadata hidden from viewers but visible to YouTube&apos;s 
          systems. Tags appear in the Details section of your video settings in YouTube 
          Studio.
        </p>
        <p className={s.sectionText}>
          Many creators spend hours searching for a YouTube tag generator to find the 
          perfect tags, believing tags are a secret to ranking higher. The reality is 
          more nuanced: tags have minimal impact on video performance in 2026. YouTube 
          has become much better at understanding video content from titles, descriptions, 
          and the actual video itself.
        </p>
        <p className={s.sectionText}>
          This guide explains the truth about tags, when they actually help, and how to 
          use them efficiently without wasting time. We will also cover what you should 
          focus on instead to actually improve your video performance.
        </p>
      </section>

      {/* Do Tags Matter */}
      <section id="do-tags-matter" className={s.section}>
        <h2 className={s.sectionTitle}>Do YouTube Tags Still Matter in 2026</h2>
        <p className={s.sectionText}>
          YouTube&apos;s official documentation states that tags have minimal impact on 
          video discovery. According to YouTube: Tags are descriptive keywords you can 
          add to your video to help viewers find your content. Your video&apos;s title, 
          thumbnail, and description are more important pieces of metadata for your 
          video&apos;s discovery.
        </p>
        <p className={s.sectionText}>
          YouTube specifically notes that tags are most useful when your content is 
          commonly misspelled. If your topic has words that viewers frequently misspell, 
          tags can help by including those misspellings.
        </p>
        <h3 className={s.subheading}>What Tags Actually Do</h3>
        <ul className={s.list}>
          <li>
            <strong>Help YouTube categorize content:</strong> When your title and 
            description are unclear, tags provide additional context about your topic.
          </li>
          <li>
            <strong>Assist with misspellings:</strong> If your main keyword has common 
            misspellings or alternate spellings, tags help YouTube connect those searches 
            to your video.
          </li>
          <li>
            <strong>Provide minor topical signals:</strong> Tags contribute a small signal 
            to YouTube about what topics your video relates to for suggested video matching.
          </li>
        </ul>
        <h3 className={s.subheading}>What Tags Do NOT Do</h3>
        <ul className={s.list}>
          <li>
            <strong>Significantly affect search ranking:</strong> Your title, description, 
            and viewer engagement (retention, CTR) matter far more for search ranking.
          </li>
          <li>
            <strong>Boost your video in recommendations:</strong> The algorithm looks at 
            engagement signals, not tags, when deciding what to recommend.
          </li>
          <li>
            <strong>Replace good content:</strong> No amount of tag optimization can 
            overcome poor content, weak thumbnails, or unclear titles.
          </li>
          <li>
            <strong>Make up for poor retention:</strong> If viewers do not watch, YouTube 
            will not promote your video regardless of tags.
          </li>
        </ul>
        <div className={s.highlight}>
          <p>
            <strong>Reality check:</strong> A video with perfect tags and poor retention 
            will be dramatically outperformed by a video with no tags and excellent 
            retention. Tags are a minor optimization. Focus your efforts on content, 
            packaging, and engagement first.
          </p>
        </div>
      </section>

      {/* Finding Tags */}
      <section id="finding-tags" className={s.section}>
        <h2 className={s.sectionTitle}>How to Find Good Tags Efficiently</h2>
        <p className={s.sectionText}>
          Since tags have limited impact, you should spend minimal time on them. Here 
          are quick methods that work without wasting hours on research:
        </p>
        <h3 className={s.subheading}>Method 1: YouTube Autocomplete</h3>
        <p className={s.sectionText}>
          The fastest way to find relevant tags is using YouTube&apos;s own search suggestions:
        </p>
        <ol className={s.numberedList}>
          <li>Open YouTube in an incognito browser window (to avoid personalization)</li>
          <li>Type your main topic or keyword in the search bar</li>
          <li>Note the autocomplete suggestions that appear</li>
          <li>These suggestions are actual search queries that people type</li>
          <li>Select the 3 to 5 most relevant suggestions as tags</li>
        </ol>
        <p className={s.sectionText}>
          This takes about 2 minutes and gives you tags based on real search behavior 
          rather than guesswork.
        </p>
        <h3 className={s.subheading}>Method 2: Your Video Content</h3>
        <p className={s.sectionText}>
          Pull tags directly from your video content:
        </p>
        <ul className={s.list}>
          <li>Your main keyword or topic phrase</li>
          <li>Variations and synonyms of your main keyword</li>
          <li>Specific subtopics you cover in the video</li>
          <li>Your channel name (helps associate content with your brand)</li>
        </ul>
        <h3 className={s.subheading}>Method 3: Competitor Reference</h3>
        <p className={s.sectionText}>
          You can view tags on competitor videos to get ideas:
        </p>
        <ul className={s.list}>
          <li>View page source on a competitor video (Ctrl+U or Cmd+U)</li>
          <li>Search for keywords in the source</li>
          <li>Or use browser extensions that display tags</li>
        </ul>
        <p className={s.sectionText}>
          Important caveat: Copying competitor tags will not help you rank. Their 
          success comes from content quality and engagement, not tags. Use competitor 
          tags only for inspiration about terminology in your niche.
        </p>
      </section>

      {/* Tag Best Practices */}
      <section id="tag-best-practices" className={s.section}>
        <h2 className={s.sectionTitle}>YouTube Tag Best Practices</h2>
        <p className={s.sectionText}>
          Follow these best practices to use tags effectively without overthinking:
        </p>
        <h3 className={s.subheading}>How Many Tags to Use</h3>
        <ul className={s.list}>
          <li>
            <strong>Recommendation:</strong> 3 to 5 focused, relevant tags. This is 
            plenty for YouTube to understand your topic.
          </li>
          <li>
            <strong>Maximum limit:</strong> YouTube allows up to 500 characters total 
            for tags. You do not need to use all of it.
          </li>
          <li>
            <strong>More is not better:</strong> Using 30 tags does not help more than 
            using 5 relevant ones. Relevance matters more than quantity.
          </li>
        </ul>
        <h3 className={s.subheading}>What Makes a Good Tag</h3>
        <ul className={s.list}>
          <li>
            <strong>Directly relevant:</strong> The tag accurately describes something 
            in your video content.
          </li>
          <li>
            <strong>Specific:</strong> Specific tags work better than overly broad ones. 
            How to edit video in Premiere is better than video editing.
          </li>
          <li>
            <strong>Natural language:</strong> Use phrases people actually search for, 
            not awkward keyword strings.
          </li>
          <li>
            <strong>No misleading terms:</strong> Adding popular but irrelevant tags 
            to get views can result in penalties and hurts retention when viewers 
            click expecting something else.
          </li>
        </ul>
        <h3 className={s.subheading}>How to Add Tags in YouTube Studio</h3>
        <ol className={s.numberedList}>
          <li>Go to YouTube Studio at studio.youtube.com</li>
          <li>Click Content in the left menu</li>
          <li>Select the video you want to edit and click Details</li>
          <li>Scroll down and click Show More to reveal additional options</li>
          <li>Find the Tags field and enter your tags separated by commas</li>
          <li>Click Save when done</li>
        </ol>
        <p className={s.sectionText}>
          You can also set default tags in YouTube Studio settings that automatically 
          apply to all new uploads.
        </p>
      </section>

      {/* Tags vs Hashtags */}
      <section id="tags-vs-hashtags" className={s.section}>
        <h2 className={s.sectionTitle}>Tags vs Hashtags: Understanding the Difference</h2>
        <p className={s.sectionText}>
          YouTube has two different features that involve keywords, and they are often 
          confused. Here is the difference:
        </p>
        <h3 className={s.subheading}>Tags (Hidden Metadata)</h3>
        <ul className={s.list}>
          <li>Added in the Tags field in YouTube Studio video details</li>
          <li>Hidden from viewers (not visible on the video page)</li>
          <li>Help YouTube understand and categorize your video</li>
          <li>Minimal impact on discovery in 2026</li>
        </ul>
        <h3 className={s.subheading}>Hashtags (Visible Clickable Links)</h3>
        <ul className={s.list}>
          <li>Added with the # symbol in your title or description</li>
          <li>Visible to viewers and clickable</li>
          <li>Link to a results page showing videos with that hashtag</li>
          <li>First 3 hashtags from your description appear above your video title</li>
        </ul>
        <h3 className={s.subheading}>Best Practices for Hashtags</h3>
        <ul className={s.list}>
          <li>
            <strong>Use 3 to 5 hashtags:</strong> Place them in your description. The 
            first 3 appear above your title.
          </li>
          <li>
            <strong>Include your main topic:</strong> Use hashtags that describe your 
            content category and specific topic.
          </li>
          <li>
            <strong>Avoid overly broad hashtags:</strong> #YouTube has billions of videos. 
            More specific hashtags give you better visibility.
          </li>
          <li>
            <strong>Consider branded hashtags:</strong> A hashtag with your channel name 
            helps viewers find all your content.
          </li>
        </ul>
        <h3 className={s.subheading}>Hashtag Placement</h3>
        <p className={s.sectionText}>
          You can put hashtags in your title or description. When in the description, 
          place them either at the very end or grouped together. When in the title, 
          place them naturally where they make sense. Hashtags in the title take up 
          character space, so use sparingly.
        </p>
      </section>

      {/* Tag Tools */}
      <section id="tag-tools" className={s.section}>
        <h2 className={s.sectionTitle}>YouTube Tag Generator Tools</h2>
        <p className={s.sectionText}>
          Various tools claim to generate optimal tags for your videos. Here is an 
          honest assessment of when they help and when they are a waste of time:
        </p>
        <h3 className={s.subheading}>Popular Tag Generator Tools</h3>
        <ul className={s.list}>
          <li>
            <strong>RapidTags:</strong> Free web-based tag generator. Enter a keyword 
            and get related tag suggestions. Quick and simple.
          </li>
          <li>
            <strong>TubeBuddy:</strong> Browser extension with tag suggestions directly 
            in YouTube Studio. Also shows competitor tags and search volume estimates.
          </li>
          <li>
            <strong>vidIQ:</strong> Similar to TubeBuddy with tag recommendations and 
            competitor tag viewing. Includes keyword research features.
          </li>
          <li>
            <strong>Keyword Tool:</strong> Web-based tool that generates keyword ideas 
            specifically for YouTube search.
          </li>
        </ul>
        <h3 className={s.subheading}>How to Use Tag Tools Effectively</h3>
        <ol className={s.numberedList}>
          <li>Enter your main topic or keyword</li>
          <li>Review the suggestions for relevance to your specific video</li>
          <li>Select only 3 to 5 tags that genuinely describe your content</li>
          <li>Do not blindly copy all suggested tags</li>
          <li>Spend no more than 5 minutes on tag research per video</li>
        </ol>
        <h3 className={s.subheading}>Tag Extractor Tools</h3>
        <p className={s.sectionText}>
          Some tools let you extract tags from competitor videos:
        </p>
        <ul className={s.list}>
          <li>Browser extensions display tags on any video page</li>
          <li>Web-based tools analyze any video URL</li>
          <li>View page source method works without any tools</li>
        </ul>
        <p className={s.sectionText}>
          Remember: Competitor tags are not why they rank. Do not assume copying their 
          tags will help you. Their success comes from content, retention, and 
          engagement. Tags are a tiny factor.
        </p>
      </section>

      {/* What Matters More */}
      <section id="what-matters-more" className={s.section}>
        <h2 className={s.sectionTitle}>What Actually Matters More Than Tags</h2>
        <p className={s.sectionText}>
          Instead of obsessing over tags, invest your time in factors that actually 
          determine video performance:
        </p>
        <h3 className={s.subheading}>Title (Very Important)</h3>
        <p className={s.sectionText}>
          Your title is the most important piece of metadata for both YouTube and viewers:
        </p>
        <ul className={s.list}>
          <li>Include your target keyword naturally in the first 60 characters</li>
          <li>Make it clear and compelling with a specific benefit or curiosity hook</li>
          <li>Avoid clickbait that does not match your content (hurts retention)</li>
          <li>Test different title approaches and track what gets higher CTR</li>
        </ul>
        <h3 className={s.subheading}>Thumbnail (Very Important)</h3>
        <p className={s.sectionText}>
          Thumbnails determine whether people click when they see your video:
        </p>
        <ul className={s.list}>
          <li>Stand out visually in search results and browse feeds</li>
          <li>Be readable at small sizes (mobile phone screens)</li>
          <li>Complement your title rather than repeat it</li>
          <li>Use high contrast and clear focal points</li>
        </ul>
        <h3 className={s.subheading}>Retention (Most Important)</h3>
        <p className={s.sectionText}>
          How long viewers actually watch is the strongest ranking signal:
        </p>
        <ul className={s.list}>
          <li>Hook viewers in the first 10 to 30 seconds</li>
          <li>Deliver on your title and thumbnail promise</li>
          <li>Maintain engagement with pacing and pattern interrupts</li>
          <li>Cut filler content that causes drop-offs</li>
        </ul>
        <p className={s.sectionText}>
          No amount of tag optimization can compensate for poor retention. A video where 
          viewers leave in the first minute will not rank regardless of tags.
        </p>
        <h3 className={s.subheading}>Click Through Rate (Important)</h3>
        <p className={s.sectionText}>
          CTR measures how often viewers click when shown your video:
        </p>
        <ul className={s.list}>
          <li>Improve thumbnails to increase CTR</li>
          <li>Test different title approaches</li>
          <li>Study what works in your niche</li>
          <li>Match your packaging to viewer expectations</li>
        </ul>
        <h3 className={s.subheading}>Description (Moderately Important)</h3>
        <p className={s.sectionText}>
          Your description provides context and includes searchable text:
        </p>
        <ul className={s.list}>
          <li>Start with a hook and your main keyword in the first 2 sentences</li>
          <li>Include timestamps for longer videos (creates chapters)</li>
          <li>Add relevant keywords naturally throughout</li>
          <li>Include links to related content and resources</li>
        </ul>
        <p className={s.sectionText}>
          For complete optimization strategies, see our{" "}
          <Link href="/learn/youtube-seo">YouTube SEO guide</Link>.
        </p>
      </section>

      {/* Common Tag Mistakes */}
      <section id="common-mistakes" className={s.section}>
        <h2 className={s.sectionTitle}>Common Tag Mistakes to Avoid</h2>
        <p className={s.sectionText}>
          These mistakes waste time or can actually hurt your channel:
        </p>
        <h3 className={s.subheading}>Spending Too Much Time on Tags</h3>
        <p className={s.sectionText}>
          Spending an hour researching the perfect tags is almost never worth it. That 
          time would be better spent improving your thumbnail, scripting a better hook, 
          or creating more content. Tags should take 5 minutes maximum.
        </p>
        <h3 className={s.subheading}>Using Misleading or Irrelevant Tags</h3>
        <p className={s.sectionText}>
          Adding popular tags that do not relate to your content might get clicks, but 
          viewers will leave immediately when the video does not match expectations. 
          This hurts your retention metrics and can result in YouTube penalizing your 
          content.
        </p>
        <h3 className={s.subheading}>Keyword Stuffing</h3>
        <p className={s.sectionText}>
          Adding dozens of variations of the same keyword does not help. YouTube 
          understands synonyms and related terms. A few relevant tags are more effective 
          than a wall of repetitive keywords.
        </p>
        <h3 className={s.subheading}>Copying Competitor Tags Exactly</h3>
        <p className={s.sectionText}>
          If a competitor ranks well, it is because of their content quality and viewer 
          engagement, not their tags. Copying their tags will not transfer their success 
          to your video.
        </p>
        <h3 className={s.subheading}>Using Only Broad Tags</h3>
        <p className={s.sectionText}>
          Tags like tutorial or gaming are too broad to be useful. More specific tags 
          like Premiere Pro color grading tutorial or indie game development Unity 
          provide clearer signals about your content.
        </p>
        <h3 className={s.subheading}>Neglecting Other Metadata</h3>
        <p className={s.sectionText}>
          Focusing on tags while neglecting titles and descriptions misses the bigger 
          picture. Your title and description matter far more. Perfect tags cannot 
          compensate for a bad title.
        </p>
      </section>

      {/* Quick Tag Guide */}
      <section id="quick-guide" className={s.section}>
        <h2 className={s.sectionTitle}>Quick Tag Guide: What to Do in 5 Minutes</h2>
        <p className={s.sectionText}>
          Here is an efficient process for adding tags to any video:
        </p>
        <ol className={s.numberedList}>
          <li>
            <strong>Start with your main keyword:</strong> The primary topic of your 
            video should be your first tag.
          </li>
          <li>
            <strong>Add 2 to 3 related variations:</strong> Include natural variations 
            or longer-tail versions of your main keyword.
          </li>
          <li>
            <strong>Include your channel name:</strong> This helps associate content 
            with your brand.
          </li>
          <li>
            <strong>Add one broad category tag:</strong> A general topic tag like 
            photography or cooking helps with categorization.
          </li>
          <li>
            <strong>Review and save:</strong> Make sure all tags are relevant, then 
            move on.
          </li>
        </ol>
        <p className={s.sectionText}>
          That is it. Do not overthink it. Tags are a minor factor. Your time is better 
          spent on content quality and packaging.
        </p>
      </section>

      {/* CTA */}
      <div className={s.highlight}>
        <p>
          <strong>Spend your time wisely.</strong> Add 3 to 5 relevant tags in 30 seconds, 
          then move on. Your title, thumbnail, and content quality will determine your 
          video&apos;s success far more than any tag optimization. {BRAND.name} helps you 
          focus on what actually matters for YouTube growth.
        </p>
      </div>
    </>
  );
}
