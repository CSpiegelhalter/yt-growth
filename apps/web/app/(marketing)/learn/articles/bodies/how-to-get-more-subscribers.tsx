/**
 * Body content for How to Get More YouTube Subscribers article.
 * Server component - no "use client" directive.
 *
 * Source of truth: docs/get_subs/subs_1.md ... subs_7.md
 * Do not introduce tactics outside that knowledge base.
 */

import Link from "next/link";
import type { BodyProps } from "./index";
import { Callout } from "../../_components/Callout";

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* =========================================================
          Intro
         ========================================================= */}
      <section id="subscribers-byproduct" className="sectionOpen">
        <p className={s.sectionText} style={{ fontSize: "1.125rem" }}>
          If you want to <strong>get more subscribers on YouTube</strong>, you'll grow faster when
          you stop treating "subscribe" like a button you need to push and start treating it like a
          decision a viewer makes after you've earned it. Most people don't subscribe because you
          asked. They subscribe because they watched, felt understood, got the result they came for,
          and then thought: "I want more of this."
        </p>

        <p className={s.sectionText}>
          That decision usually happens after a viewer watches more than one video. So this guide is
          built around one practical goal: make it easy for the right viewer to enjoy the first
          video, and then give them a clear reason to watch the next one. When that happens,
          subscriptions follow naturally.
        </p>

        <div className={s.highlight}>
          <p>
            <strong>The core idea:</strong> repeated viewers create subscribers. Your job is to
            attract the same type of viewer again and again, then guide them to a second video that
            feels like the obvious next step.
          </p>
        </div>

        <p className={s.sectionText}>
          Everything below comes only from the subscriber growth notes in our docs. No generic
          "guru" advice - just the patterns the docs emphasize: consistent viewer targeting, stronger
          first minutes, better end-of-video routing, a channel page that passes the confidence
          check, and a publish process that doesn't weaken your early performance signals.
        </p>

        <p className={s.sectionText}>
          Want the broader library? Browse <Link href="/learn">all Learn guides</Link>.
        </p>
      </section>

      {/* =========================================================
          Audience match
         ========================================================= */}
      <section id="audience-match" className="sectionTinted">
        <h2 className={s.sectionTitle}>Make every upload feel like it's for the same person</h2>

        <p className={s.sectionText}>
          One of the biggest reasons channels stall is that YouTube can't confidently answer a
          simple question: "Who is this video for?" When you consistently make videos for the same
          type of viewer, YouTube gets better at finding that viewer and testing your next upload
          with them. When you rotate who you're serving, the system has less confidence, and it
          becomes harder for your videos to get momentum.
        </p>

        <p className={s.sectionText}>
          This is what our docs call audience matching. You're not matching "a niche." You're
          matching a specific viewer: their identity, what they want, and what they struggle with.
          When you do it well, your uploads start stacking on top of each other—because the same
          people who liked the last one are the same people who are likely to like the next one.
        </p>

        <h3 className={s.subheading}>Write an "audience sentence" you can repeat for months</h3>

        <p className={s.sectionText}>
          Use this format and make it concrete: "I make videos for [type of person] who wants
          [outcome] but struggles with [problem]."
        </p>

        <ul className={s.list}>
          <li>
            "I make videos for new creators who want to grow a YouTube channel but struggle to
            choose topics that people actually click."
          </li>
          <li>
            "I make videos for busy professionals who want to get in shape but struggle to stay
            consistent when life gets chaotic."
          </li>
          <li>
            "I make videos for beginner home cooks who want to make great dinners but struggle with
            timing, confidence, and planning."
          </li>
        </ul>

        <p className={s.sectionText}>
          The important part isn't the wording. The important part is that the same viewer should
          happily watch your next 30 videos. If you can't imagine making 50 videos for that sentence
          without drifting, the sentence is too broad or too vague.
        </p>

        <h3 className={s.subheading}>Keep the viewer constant even when you change the format</h3>

        <p className={s.sectionText}>
          The docs frame this as "same dartboard, different darts." That means: keep the same viewer
          and their needs constant, but change angles and formats to stay fresh. You can do a
          tutorial one week, a breakdown the next, and a reaction the next—while still serving the
          same person.
        </p>

        <Callout variant="warning" title="A small topic change to you can be a big viewer change to YouTube">
          <p>
            A topic shift can feel minor when you're the creator—especially if the videos are "in
            the same general niche." But if the last few uploads are aimed at different viewer
            identities, YouTube has less confidence about who to test your next video with. And when
            a viewer clicks your channel page, mixed audiences make it harder for them to think,
            "This channel is for me."
          </p>
        </Callout>
      </section>

      {/* =========================================================
          Subscriber rate
         ========================================================= */}
      <section id="subscriber-rate" className="sectionOpen">
        <h2 className={s.sectionTitle}>Understand what "good growth" actually looks like</h2>

        <p className={s.sectionText}>
          Subscriber growth isn't mysterious. It's math. You need enough views from the right
          people, and you need enough of those people to decide they want to come back. That's why
          the docs emphasize subscriber rate: it helps you see whether your videos are building an
          audience or just collecting one-off views.
        </p>

        <h3 className={s.subheading}>The number to track: subscriber rate</h3>

        <div className={s.highlight}>
          <p>
            <strong>Subscriber rate</strong> = (subscribers gained ÷ views) × 100.
            <br />
            Example: 100,000 views/month at a 3% subscriber rate = 3,000 subscribers/month
            (~100/day).
          </p>
        </div>

        <p className={s.sectionText}>
          The docs frame a 3% subscriber rate as "amazing," and many channels live closer to ~1% or
          even less. The point isn't to worship a benchmark—it's to compare your own videos. Two
          videos can get the same views and produce totally different subscriber outcomes. That
          difference is your map.
        </p>

        <h3 className={s.subheading}>How to use it without overthinking</h3>

        <ul className={s.list}>
          <li>
            <strong>Find your top converters:</strong> sort recent videos by subscriber rate and
            identify the ones that turn viewers into subscribers most efficiently.
          </li>
          <li>
            <strong>Ask "what promise did I keep?":</strong> look at the title/thumbnail promise and
            the first minute. High converters usually make the right viewer feel understood quickly.
          </li>
          <li>
            <strong>Repeat the win for the same viewer:</strong> don't chase a new audience because
            one video did well. Make the next video for the same person, with a closely related
            promise.
          </li>
        </ul>

        <p className={s.sectionText}>
          Subscriber rate also keeps you honest about "hot topics." A trendy upload might spike
          views but convert poorly if it attracts people who won't care about your next video. The
          docs warn about subscriber quality: not all subscribers help your channel equally. The
          best subscribers are the ones who want what you plan to publish next.
        </p>
      </section>

      {/* =========================================================
          Title + thumbnail
         ========================================================= */}
      <section id="title-thumbnail" className="sectionTinted">
        <h2 className={s.sectionTitle}>Your title and thumbnail decide whether you get a chance</h2>

        <p className={s.sectionText}>
          Before retention, before comments, before anything else—someone has to choose your video.
          The docs repeatedly treat your title and thumbnail as the gate that decides whether
          YouTube can even test your content properly. If you don't earn the click from the right
          viewer, the rest of the video doesn't matter.
        </p>

        <p className={s.sectionText}>
          This is also why "sloppy uploads" are so costly. If you publish and then "fix" the title
          or thumbnail later, you may already have burned your earliest test with weaker signals.
          The docs emphasize going public only when your title and thumbnail are locked.
        </p>

        <h3 className={s.subheading}>What "good" looks like in practice</h3>

        <p className={s.sectionText}>
          Good doesn't mean fancy. Good means clear and compelling at small sizes, and aligned with
          what the video delivers. The fastest way to lose trust is to promise one thing in the
          title/thumbnail and deliver something else in the first minute.
        </p>

        <h3 className={s.subheading}>Make one promise, then keep it</h3>

        <p className={s.sectionText}>
          Write your title and thumbnail so a viewer can answer, "What will I get from this?" in one
          second. Then make sure the opening of the video confirms that exact promise. When the
          promise and payoff match, you keep the right people watching—and the people who watch more
          are the people who subscribe.
        </p>

        <Callout variant="tip" title="Lock the title and thumbnail before you go public">
          <p>
            The docs emphasize that YouTube starts measuring immediately. Publish after your title
            and thumbnail are final so your first test isn't working against you.
          </p>
        </Callout>
      </section>

      {/* =========================================================
          First 30 seconds
         ========================================================= */}
      <section id="first-30-seconds" className="sectionOpen">
        <h2 className={s.sectionTitle}>
          The first 30 seconds answer one question: "Did I click the right thing?"
        </h2>

        <p className={s.sectionText}>
          A viewer clicks and immediately looks for confirmation. The docs describe this as click
          confirmation: the viewer is checking whether the video is actually going to deliver what
          was promised. If they feel misled—or if the intro takes too long to get to the point—they
          leave. And early exits teach YouTube to stop pushing the video.
        </p>

        <p className={s.sectionText}>
          This is why subscriber growth often improves when your openings improve. People don't
          subscribe to videos they barely watched. They subscribe after they've seen enough to trust
          you.
        </p>

        <h3 className={s.subheading}>A simple opening pattern the docs emphasize</h3>

        <p className={s.sectionText}>
          Start by naming the belief or problem your viewer already has. Then contrast it with the
          truth your video will prove. That contrast creates curiosity and keeps the right people
          watching long enough to get value.
        </p>

        <p className={s.sectionText}>
          Example: "So there's an upload sequence that YouTube rewards, and there's also one that
          kills your videos before anybody gets a chance to watch them. I wish I was joking…"
        </p>

        <h3 className={s.subheading}>Don't delay the payoff</h3>

        <p className={s.sectionText}>
          If your video promises a result, show the viewer quickly that you're actually going to
          deliver it. You can still tell a story, but the viewer needs to feel "I'm in the right
          place" early.
        </p>

        <Callout variant="warning" title="Long intros don't just feel annoying—they change your data">
          <p>
            The docs repeatedly criticize slow openings. If viewers leave early, your retention
            drops, YouTube tests the video less, and fewer qualified viewers ever reach the
            subscribe decision.
          </p>
        </Callout>
      </section>

      {/* =========================================================
          Session depth
         ========================================================= */}
      <section id="session-depth" className="sectionTinted">
        <h2 className={s.sectionTitle}>Subscriptions usually happen after video #2</h2>

        <p className={s.sectionText}>
          A viewer can enjoy a single video and still never subscribe. The docs emphasize a more
          reliable pattern: subscriptions tend to happen after a viewer watches multiple videos and
          decides they want your perspective again. That means your real conversion job isn't only
          "get the subscribe." It's "earn the next view."
        </p>

        <p className={s.sectionText}>
          When someone watches 2–3 videos, they've basically pre-qualified themselves. In their head
          they're thinking, "I like this. I want more." Subscribing becomes the natural next step.
        </p>

        <h3 className={s.subheading}>Put "watch this next" where people actually use it</h3>

        <ul className={s.list}>
          <li>
            <strong>End screen + a spoken pointer to one specific next video:</strong> say what the
            next video will help them do, and tell them exactly where to click.
          </li>
          <li>
            <strong>Description:</strong> link one tightly related playlist (or two max) so bingeing
            is effortless.
          </li>
          <li>
            <strong>Pinned comment:</strong> people scroll comments even when they don't
            comment—give them a reason to click deeper.
          </li>
        </ul>

        <Callout variant="example" title='A clean "watch next" line that does not feel pushy'>
          <p>
            "Now that you've got the basics, go watch the advanced version next. Click the video
            right here—this is where most people mess it up after they learn this part."
          </p>
        </Callout>

        <Callout variant="tip" title="Pick the best next step, not the newest upload">
          <p>
            The docs point out that the end screen should continue the viewer's journey. If the
            newest upload isn't the logical next step, don't force it.
          </p>
        </Callout>
      </section>

      {/* =========================================================
          Subscribe ask
         ========================================================= */}
      <section id="subscribe-ask" className="sectionOpen">
        <h2 className={s.sectionTitle}>Ask after you've earned it</h2>

        <p className={s.sectionText}>
          The docs are clear: asking can help, but timing matters. If you ask before you've
          delivered value, it feels like a stranger asking for a favor. If you ask after you've
          helped, it feels like an invitation.
        </p>

        <h3 className={s.subheading}>Say what they'll get from future videos</h3>

        <p className={s.sectionText}>
          A good subscribe ask is specific: who it's for and what they'll gain. That clarity also
          reinforces audience matching—because you're reminding the right viewer that this channel
          is made for them.
        </p>

        <Callout variant="example" title="A strong subscribe ask (simple and direct)">
          <p>
            "If this helped you with [topic], subscribe. This channel helps [your viewer] get
            [result] with practical breakdowns like this."
          </p>
        </Callout>

        <p className={s.sectionText}>
          Don't worry about placing the ask perfectly. The docs note most viewers won't notice every
          call-to-action. Using end screens, pinned comments, and descriptions makes it more likely
          the viewer sees at least one prompt to continue watching or subscribe.
        </p>
      </section>

      {/* =========================================================
          Channel page conversion
         ========================================================= */}
      <section id="channel-page" className="sectionTinted">
        <h2 className={s.sectionTitle}>Your channel page is a confidence check</h2>

        <p className={s.sectionText}>
          The docs highlight something most creators underestimate: subscribers don't only come from
          the watch page. They also come from your channel page. When a viewer likes a video, they
          often click your profile and ask a simple question: "Do they make more videos like this?"
          If your page answers "yes" quickly, subscriptions rise.
        </p>

        <h3 className={s.subheading}>Make the promise obvious</h3>

        <p className={s.sectionText}>
          Your banner should communicate a clear promise. The docs give a simple pattern: "If you
          want [outcome], subscribe." That sentence should match the viewer you're targeting in your
          videos.
        </p>

        <h3 className={s.subheading}>Use a trailer that earns the next click</h3>

        <p className={s.sectionText}>
          The docs recommend a short channel trailer for new visitors (30–60 seconds). Keep it
          tight: who the channel is for, what they can expect, and what they'll get by subscribing.
          No long intro. It should feel like, "You're in the right place."
        </p>

        <h3 className={s.subheading}>Organize the page so bingeing is easy</h3>

        <p className={s.sectionText}>
          Homepage playlists prove depth and reduce friction. If your channel has a clear set of
          related videos, a viewer can watch a second video without searching.
        </p>

        <Callout variant="tip" title="Don't let settings quietly block your growth">
          <p>
            The docs mention verifying key channel setup items in YouTube Studio (country, phone
            verification, feature eligibility) and turning on newer features where available (like
            Hype). Small setup gaps can quietly limit your reach.
          </p>
        </Callout>
      </section>

      {/* =========================================================
          Clean publishing
         ========================================================= */}
      <section id="publish-clean" className="sectionOpen">
        <h2 className={s.sectionTitle}>Go public when everything is ready</h2>

        <p className={s.sectionText}>
          When you publish a video, YouTube starts learning immediately. The docs are blunt about
          this: going public before your title, thumbnail, and description are ready can weaken your
          earliest signals—and you don't always get a clean second chance later.
        </p>

        <h3 className={s.subheading}>Upload early, publish later</h3>

        <p className={s.sectionText}>
          The docs recommend uploading while the video is processing (private or unlisted), and
          using that time to finalize the public-facing parts. Treat "publish" as the final step,
          not the first one.
        </p>

        <h3 className={s.subheading}>The parts that must be finished before you publish</h3>

        <ol className={s.numberedList}>
          <li>
            <strong>Title and thumbnail are final.</strong> Your earliest test depends on them.
          </li>
          <li>
            <strong>The first lines of the description explain what the viewer will get.</strong>{" "}
            YouTube uses those lines for context and search previews.
          </li>
          <li>
            <strong>The video is placed into the right playlist(s) before it goes public</strong> so
            YouTube and viewers can find related videos easily.
          </li>
          <li>
            <strong>Your end screen points to the most logical next video,</strong> not
            automatically the newest one.
          </li>
        </ol>

        <h3 className={s.subheading}>Be present right after you publish</h3>

        <p className={s.sectionText}>
          The docs emphasize the first hour. Reply early, pin a comment that encourages replies, and
          route people toward the next video when it makes sense. Early engagement helps the video
          feel alive and gives viewers a reason to stick around.
        </p>

        <Callout variant="warning" title="Be careful with external promotion early">
          <p>
            The docs warn that posting a direct YouTube link on fast-scrolling platforms can bring
            low-intent viewers who bounce quickly, and clicks may not get credited the way they do
            inside YouTube. If you promote, the docs mention a safer approach: share the thumbnail
            and tell people to search the video on YouTube. Email can be different because
            consumption speed is slower.
          </p>
        </Callout>
      </section>

      {/* =========================================================
          Topic opportunity
         ========================================================= */}
      <section id="topic-opportunities" className="sectionTinted">
        <h2 className={s.sectionTitle}>Choose topics where viewers are already hungry</h2>

        <p className={s.sectionText}>
          The docs describe a practical way to grow: stop guessing what people want and start
          looking for proof. There are topics that consistently pull big views because the demand is
          real. Your job is to find those opportunities and make a version that serves the viewer
          better.
        </p>

        <h3 className={s.subheading}>Use outlier videos to find demand</h3>

        <p className={s.sectionText}>
          Look for videos that perform far beyond what you'd expect based on the channel size. The
          docs describe a "5:1" kind of signal for smaller channels: a video getting multiples more
          views than the channel's subscribers. When you see that pattern, it often means viewers
          want that topic badly.
        </p>

        <h3 className={s.subheading}>"Better" means clearer and more satisfying</h3>

        <p className={s.sectionText}>
          The goal is not copying. It's choosing a proven topic and executing it with a clearer
          promise, a stronger opening, and a video that actually delivers. If you attract the right
          viewer and keep them watching, you've created the conditions where they'll watch another
          video—and that's where subscribers come from.
        </p>

        <Callout variant="warning" title="Don't trade long-term subscribers for a one-time spike">
          <p>
            The docs warn about audience drift. If a topic brings in viewers who don't care about
            your next video, it can inflate one upload while making your next ten harder to
            recommend. Stay aligned with the same viewer.
          </p>
        </Callout>

        <p className={s.sectionText}>
          Related: <Link href="/learn/youtube-competitor-analysis">competitor analysis</Link> and{" "}
          <Link href="/learn/youtube-algorithm">how the algorithm thinks about viewers</Link>.
        </p>
      </section>

      {/* =========================================================
          How subscriber growth compounds
         ========================================================= */}
      <section id="three-this-week" className="sectionOpen">
        <h2 className={s.sectionTitle}>How subscriber growth actually compounds</h2>

        <p className={s.sectionText}>
          The docs point to a simple reality: subscriber growth is the result of repeated good
          experiences with the same viewer. When the same person clicks your videos, stays, watches
          a second one, and sees a channel page that clearly fits them, subscribing becomes a
          logical move—not something you have to force.
        </p>

        <p className={s.sectionText}>
          If you want to diagnose why subscribers aren't rising, don't start by blaming the
          algorithm. Start by asking where the viewer is getting lost:
        </p>

        <ul className={s.list}>
          <li>
            Are you attracting the right person consistently, or does each upload target a different
            viewer?
          </li>
          <li>
            Do your title and thumbnail promise something your opening actually confirms?
          </li>
          <li>
            Are viewers still watching past the first 30 seconds, or are they leaving before they
            get value?
          </li>
          <li>
            When the video ends, do you give them a clear next step, or do you make them decide what
            to do?
          </li>
          <li>
            If they click your channel page, does it immediately look like "more of what I just
            liked"?
          </li>
        </ul>

        <p className={s.sectionText}>
          Fixing any one of those areas can improve subscriber growth. Fixing them together is where
          the docs suggest the biggest change happens—because each improvement makes the others more
          effective. Better targeting brings better viewers. Better openings keep them watching.
          Better "watch next" paths create multi-video sessions. And multi-video sessions are where
          subscriptions become the obvious choice.
        </p>

        <p className={s.sectionText}>
          If you want to go deeper, browse the rest of the{" "}
          <Link href="/learn">Learn library</Link>. Next steps:{" "}
          <Link href="/learn/youtube-thumbnail-best-practices">thumbnail best practices</Link>,{" "}
          <Link href="/learn/youtube-seo">YouTube SEO</Link>, and{" "}
          <Link href="/learn/youtube-channel-audit">a channel audit</Link>.
        </p>
      </section>
    </>
  );
}
