/**
 * Body content for "How to Build YouTube Channel Ideas That People Actually Want to Watch".
 * Server component — no "use client" directive.
 *
 * Source: apps/web/content/learn/how-to-build-youtube-channel-ideas.md
 * Body text is preserved word-for-word from the source markdown.
 */

import Image from "next/image";
import Link from "next/link";

import { LEARN_ARTICLES } from "../../articles";
import type { BodyProps } from "./_shared";
import { articleExports } from "./_shared";
import u from "./how-to-build-youtube-channel-ideas.module.css";

export const { meta, toc } = articleExports(
  LEARN_ARTICLES["how-to-build-youtube-channel-ideas"],
);

const HERO_SRC = "/learn/how-to-build-youtube-channel-ideas/hero.png";
const DATA_SOURCES_SRC =
  "/learn/how-to-build-youtube-channel-ideas/data-sources.png";
const FORMATS_SRC = "/learn/how-to-build-youtube-channel-ideas/formats.png";
const CTA_SRC = "/learn/how-to-build-youtube-channel-ideas/cta.png";

/* ================================================================
 * IDEA SOURCES TABLE (preserved verbatim from md)
 * ================================================================ */

function IdeaSourcesTable() {
  return (
    <div className={u.tableWrap}>
      <table className={u.table}>
        <thead>
          <tr>
            <th>Idea Source</th>
            <th>What It Tells You</th>
            <th>Actionable Step</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Your Analytics</td>
            <td>
              What your <em>current</em> audience loves.
            </td>
            <td>
              Find videos with high audience retention and make follow-ups.
            </td>
          </tr>
          <tr>
            <td>Competitor Channels</td>
            <td>
              What works in your niche <em>at scale</em>.
            </td>
            <td>
              Look for a competitor’s outlier video that dramatically
              overperformed their average.
            </td>
          </tr>
          <tr>
            <td>YouTube Search</td>
            <td>
              What people are <em>actively</em> looking for.
            </td>
            <td>
              Use the search bar’s autocomplete to find long-tail keywords and
              questions.
            </td>
          </tr>
          <tr>
            <td>Community Comments</td>
            <td>
              The specific problems your audience <em>needs</em> solved.
            </td>
            <td>
              Look for questions in your comments or on competitor videos that
              start with “Can you make a video about…”
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* ================================================================
 * BODY (text preserved word-for-word from md)
 * ================================================================ */

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* Hero (image1) */}
      <div className={u.heroImageWrap}>
        <Image
          src={HERO_SRC}
          alt="YouTube Channel Ideas That People Watch"
          width={1228}
          height={780}
          className={u.heroImage}
          priority
          sizes="(max-width: 768px) 100vw, 720px"
        />
      </div>

      {/* Intro */}
      <section id="intro" className="sectionOpen">
        <p className={s.sectionText}>
          Every creator knows the feeling: you spend days scripting, filming,
          and editing a video you’re passionate about, only to see it flatline
          with a handful of views. It’s discouraging, and it’s the number one
          reason creators burn out.
        </p>

        <p className={s.sectionText}>
          The problem usually isn’t the quality of the video: it’s the idea
          itself. Most creators start with what they <em>feel</em> like
          making, hoping an audience will appear. This is a recipe for slow
          growth and frustration.
        </p>

        <p className={s.sectionText}>
          Successful channels operate differently. They don’t guess what
          people want to watch: they use data to find out. They treat idea
          generation not as a moment of creative inspiration, but as a
          systematic process of discovery. They find topics with proven
          demand, analyze why those topics resonate with viewers, and then
          apply their unique creative spin.
        </p>

        <p className={s.sectionText}>
          This shift in mindset, from passion-first to demand-first, is the
          single biggest change a creator can make to build a channel that
          grows predictably. You don’t have to abandon your creative
          interests, but success is all about finding the intersection
          between what you love to make and what a specific audience is
          actively searching for.
        </p>
      </section>

      {/* Why Most YouTube Channel Ideas Fail */}
      <section id="why-fail" className="sectionTinted">
        <h2 className={s.sectionTitle}>Why Most YouTube Channel Ideas Fail</h2>

        <p className={s.sectionText}>
          Before building a system that works, it’s important to understand
          the common traps that lead to stagnant channels. Most failed
          YouTube channel ideas fall into a few predictable categories. They
          are often born from assumptions rather than evidence, leading to a
          fundamental mismatch between the content and the audience.
        </p>

        <div className={u.tipBlock}>
          <p className={u.tipTitle}>The Passion Project Problem</p>
          <p className={u.tipText}>
            This is the most common pitfall: creating content solely based on
            your personal interests without validating if anyone else is
            looking for it. While your passion is essential for long-term
            consistency, it can’t be the only ingredient. A video about the
            intricate history of a niche video game might be fascinating to
            you, but if only 50 people are searching for it, the video’s
            growth potential is capped from the start.
          </p>
        </div>

        <div className={u.tipBlock}>
          <p className={u.tipTitle}>The Copycat Mistake</p>
          <p className={u.tipText}>
            Seeing a popular video and creating a nearly identical version is
            a strategy of diminishing returns. By the time you copy it, the
            trend may have already peaked, and you’re competing directly with
            a more established creator. The key is to deconstruct{" "}
            <em>why</em> it was successful: was it the format, the angle, or
            the emotional hook? Our guide on{" "}
            <Link href="/learn/youtube-competitor-analysis">
              YouTube Competitor Analysis
            </Link>{" "}
            shows how to borrow patterns, not just topics.
          </p>
        </div>

        <div className={u.tipBlock}>
          <p className={u.tipTitle}>The “No Niche” Dilemma</p>
          <p className={u.tipText}>
            If your last three videos were a travel vlog, a cooking tutorial,
            and a tech review, you don’t have a channel: you have a random
            collection of videos. Without a clear focus, you can’t build a
            loyal audience because viewers don’t know what to expect. A
            focused channel builds topical authority, which is a strong
            signal to the{" "}
            <Link href="/learn/youtube-algorithm">YouTube Algorithm</Link>.
          </p>
        </div>
      </section>

      {/* The Demand-First Framework */}
      <section id="demand-first" className="sectionOpen">
        <h2 className={s.sectionTitle}>
          The Demand-First Framework: Where to Find Ideas
        </h2>

        <p className={s.sectionText}>
          Great YouTube channel ideas aren’t invented: they’re discovered.
          You can find them by looking at data sources that reflect real
          viewer behavior. This process replaces guesswork with a system for
          identifying topics with a built-in audience.
        </p>

        {/* image2 */}
        <div className={u.figureWrap}>
          <Image
            src={DATA_SOURCES_SRC}
            alt="Where to Find YouTube Channel Ideas That Work — four data sources: Your Analytics, Competitor Channels, YouTube Search, Community Comments."
            width={1228}
            height={780}
            className={u.figureImage}
            sizes="(max-width: 768px) 100vw, 720px"
          />
        </div>

        <IdeaSourcesTable />
      </section>

      {/* 5 Proven Formats for Any Niche */}
      <section id="formats" className="sectionTinted">
        <h2 className={s.sectionTitle}>5 Proven Formats for Any Niche</h2>

        <p className={s.sectionText}>
          Once you have a topic with proven demand, you need a format to
          structure it. These five formats are endlessly adaptable and tap
          into core viewer psychology.
        </p>

        {/* image3 */}
        <div className={u.figureWrap}>
          <Image
            src={FORMATS_SRC}
            alt="5 Video Formats That Work in Any Niche: Expert Guide, Case Study, Comparison, Transformation, Myth-Busting."
            width={1228}
            height={780}
            className={u.figureImage}
            sizes="(max-width: 768px) 100vw, 720px"
          />
        </div>

        <div className={u.tipBlock}>
          <p className={u.tipTitle}>The Expert Guide</p>
          <p className={u.tipText}>
            This format takes a complex topic and makes it simple. It’s a
            comprehensive, A-to-Z resource that positions you as an
            authority. Our guide to{" "}
            <Link href="/learn/youtube-seo">YouTube SEO</Link> is an example
            of this, covering everything from keywords to optimization.
          </p>
        </div>

        <div className={u.tipBlock}>
          <p className={u.tipTitle}>The Case Study</p>
          <p className={u.tipText}>
            This involves analyzing a specific example of success or failure.
            It could be “Why MrBeast’s Latest Video Worked” or “The Mistake
            That Cost This Channel 90% of its Views.” It’s educational and
            provides concrete lessons.
          </p>
        </div>

        <div className={u.tipBlock}>
          <p className={u.tipTitle}>The Comparison</p>
          <p className={u.tipText}>
            This format pits two things against each other: “iPhone vs.
            Android” or “Budget Mics vs. Pro Mics.” It helps viewers make a
            decision and is highly searchable.
          </p>
        </div>

        <div className={u.tipBlock}>
          <p className={u.tipTitle}>The Transformation Journey</p>
          <p className={u.tipText}>
            This format documents a process over time: “I Learned to Code in
            30 Days” or “My 1-Year Body Transformation.” It creates a natural
            story arc that keeps viewers hooked because they want to see the
            final result.
          </p>
        </div>

        <div className={u.tipBlock}>
          <p className={u.tipTitle}>The Myth-Busting Takedown</p>
          <p className={u.tipText}>
            This format challenges a common belief in your niche: “Why Cardio
            Isn’t the Best Way to Lose Weight” or “The Investing Advice
            That’s Secretly Making You Poorer.” It’s contrarian and grabs
            attention.
          </p>
        </div>
      </section>

      {/* From Idea to Thriving Channel */}
      <section id="from-idea" className="sectionOpen">
        <h2 className={s.sectionTitle}>From Idea to Thriving Channel</h2>

        <p className={s.sectionText}>
          Finding a great YouTube channel idea is the first step. The next
          is committing to a content strategy that builds momentum over
          time.
        </p>

        <p className={s.sectionText}>
          Don’t just think about your next video: think about your next 20
          videos. A successful channel isn’t built on one viral hit, but on
          a consistent body of work that serves a specific audience. Once
          you have your niche and format, the focus shifts to execution:
          creating compelling packaging with your titles and thumbnails, and
          keeping viewers engaged from one video to the next. That
          consistency is what turns a good idea into a real channel.
        </p>

        <p className={s.sectionText}>
          The <Link href="/">ChannelBoost platform</Link> is designed for
          this. You can track your performance, analyze your audience, and
          use the Idea Generation tool to find validated topics, turning
          this entire process into a simple, repeatable workflow.
        </p>

        <p className={u.ctaCallout}>
          <strong>
            If you’re ready to move from idea to execution,{" "}
            <Link href="/">get started with ChannelBoost</Link> to track your
            performance, analyze your audience, and find the insights you
            need to grow faster.
          </strong>
        </p>

        {/* image4: CTA banner */}
        <Link
          href="/"
          className={u.ctaBannerLink}
          aria-label="Stop guessing — analyze your channel with ChannelBoost"
        >
          <Image
            src={CTA_SRC}
            alt="Stop Guessing. Start Growing. Connect your channel and get retention analysis, competitor insights, and video ideas in minutes."
            width={1600}
            height={400}
            className={u.ctaBannerImage}
            sizes="(max-width: 768px) 100vw, 720px"
          />
        </Link>
      </section>

      {/* Related Guides */}
      <section id="related-guides" className="sectionOpen">
        <h2 className={s.sectionTitle}>Related Guides</h2>
        <ul className={u.relatedList}>
          <li>
            <Link href="/learn/youtube-competitor-analysis">
              YouTube Competitor Analysis
            </Link>
          </li>
          <li>
            <Link href="/learn/how-to-be-a-youtuber">How to Be a YouTuber</Link>
          </li>
          <li>
            <Link href="/learn/youtube-algorithm">YouTube Algorithm</Link>
          </li>
        </ul>
      </section>
    </>
  );
}
