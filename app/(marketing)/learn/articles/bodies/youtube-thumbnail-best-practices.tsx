/**
 * Body content for YouTube Thumbnail Best Practices article.
 * Server component - no "use client" directive.
 */

import { BRAND } from "@/lib/brand";
import type { BodyProps } from "./index";

export function Body({ s }: BodyProps) {
  return (
    <>
      {/* Why Thumbnails Matter */}
      <section id="why-thumbnails-matter" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </span>
          Why Thumbnails Matter for YouTube Success
        </h2>
        <p className={s.sectionText}>
          Your thumbnail is the first thing viewers see. Before they read your
          title, before they know what your video is about, they see that small
          image. A great thumbnail can double your click-through rate. A bad one
          can kill a video before anyone watches it.
        </p>
        <p className={s.sectionText}>
          YouTube shows your video to potential viewers as an impression. Whether
          they click depends largely on your thumbnail. More clicks mean more
          views, and more views mean YouTube shows your video to even more
          people. Thumbnails are the gateway to everything else.
        </p>
        <div className={s.statsGrid}>
          <div className={s.stat}>
            <div className={s.statValue}>4-10%</div>
            <div className={s.statLabel}>Typical CTR range</div>
          </div>
          <div className={s.stat}>
            <div className={s.statValue}>1280×720</div>
            <div className={s.statLabel}>Recommended size (px)</div>
          </div>
          <div className={s.stat}>
            <div className={s.statValue}>2MB</div>
            <div className={s.statLabel}>Maximum file size</div>
          </div>
        </div>
        <p className={s.sectionText}>
          The best creators spend as much time on their thumbnail as they do on
          their intro. Some even create the thumbnail first to ensure the video
          delivers on its visual promise. Treat thumbnails as a critical skill,
          not an afterthought.
        </p>
      </section>

      {/* Thumbnail Checklist */}
      <section id="thumbnail-checklist" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </span>
          Thumbnail Checklist (Before You Publish)
        </h2>
        <p className={s.sectionText}>
          Run through this checklist for every thumbnail before you publish.
        </p>
        <ol className={s.numberedList}>
          <li>
            <strong>Readable at small sizes:</strong> View your thumbnail at the
            size of a mobile search result. Can you still understand it?
          </li>
          <li>
            <strong>High contrast:</strong> Elements should stand out from each
            other and from the background.
          </li>
          <li>
            <strong>Clear focal point:</strong> There should be one main element
            that draws the eye.
          </li>
          <li>
            <strong>Complements the title:</strong> Thumbnail and title should
            work together, not repeat each other.
          </li>
          <li>
            <strong>Communicates the topic:</strong> Viewers should understand
            what the video is about in a split second.
          </li>
          <li>
            <strong>Stands out:</strong> Compare to other videos in your niche.
            Does yours catch the eye?
          </li>
          <li>
            <strong>Honest representation:</strong> The thumbnail should match
            what the video actually delivers.
          </li>
        </ol>
      </section>

      {/* Design Principles */}
      <section id="design-principles" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
          </span>
          Core Design Principles
        </h2>
        <p className={s.sectionText}>
          Good thumbnail design follows predictable principles. You do not need
          to be a designer to apply these.
        </p>

        <h3 className={s.subheading}>Simplicity</h3>
        <p className={s.sectionText}>
          Thumbnails are small. Cluttered designs become unreadable. Limit your
          elements to 2 or 3 maximum: a face, a key object, and maybe some text.
          If you cannot explain what is in the thumbnail in one sentence, it is
          too complex.
        </p>

        <h3 className={s.subheading}>Hierarchy</h3>
        <p className={s.sectionText}>
          Guide the viewer&apos;s eye to the most important element first. Use
          size, contrast, and position to create a clear focal point. Everything
          else should support that main element.
        </p>

        <h3 className={s.subheading}>Contrast</h3>
        <p className={s.sectionText}>
          Elements need to stand out from each other and from the background.
          Light subjects on dark backgrounds, or vice versa. Avoid colors that
          blend together or compete for attention.
        </p>

        <h3 className={s.subheading}>Balance</h3>
        <p className={s.sectionText}>
          Distribute visual weight so the thumbnail does not feel lopsided.
          Asymmetrical balance can be dynamic, but avoid cramming everything into
          one corner.
        </p>
      </section>

      {/* Text Best Practices */}
      <section id="text-best-practices" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="4 7 4 4 20 4 20 7" />
              <line x1="9" y1="20" x2="15" y2="20" />
              <line x1="12" y1="4" x2="12" y2="20" />
            </svg>
          </span>
          Text Best Practices
        </h2>
        <p className={s.sectionText}>
          Text on thumbnails can increase clicks when done right, but it can
          also hurt when done wrong.
        </p>

        <h3 className={s.subheading}>When to Use Text</h3>
        <ul className={s.list}>
          <li>When the image alone does not communicate the topic</li>
          <li>To add information the title does not include</li>
          <li>To create curiosity or highlight a key benefit</li>
          <li>To make a number or statistic pop</li>
        </ul>

        <h3 className={s.subheading}>Text Rules</h3>
        <ul className={s.list}>
          <li>
            <strong>3 to 4 words maximum.</strong> More than this becomes
            unreadable at small sizes.
          </li>
          <li>
            <strong>Large, bold fonts.</strong> Thin fonts disappear. Use thick,
            easy-to-read typefaces.
          </li>
          <li>
            <strong>High contrast with background.</strong> White text needs a
            dark background or a stroke and shadow.
          </li>
          <li>
            <strong>Do not repeat the title.</strong> The title is already
            visible. Text should add new information.
          </li>
          <li>
            <strong>Position carefully.</strong> Avoid the bottom right corner
            where YouTube overlays the video duration.
          </li>
        </ul>

        <h3 className={s.subheading}>Text Alternatives</h3>
        <p className={s.sectionText}>
          Some niches perform better with no text at all. Test both approaches.
          If your thumbnail clearly communicates the topic visually, text may be
          unnecessary.
        </p>
      </section>

      {/* Faces and Emotions */}
      <section id="faces-and-emotions" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </span>
          Faces and Emotions
        </h2>
        <p className={s.sectionText}>
          Humans are wired to notice faces. Thumbnails with faces often
          outperform those without, but only if done right.
        </p>

        <h3 className={s.subheading}>Why Faces Work</h3>
        <ul className={s.list}>
          <li>The brain processes faces faster than other images</li>
          <li>Expressions communicate emotion instantly</li>
          <li>Viewers connect with the person, not just the topic</li>
          <li>Faces create a sense of authenticity and trust</li>
        </ul>

        <h3 className={s.subheading}>Expression Guidelines</h3>
        <ul className={s.list}>
          <li>
            <strong>Show genuine emotion.</strong> Surprise, excitement, concern,
            or curiosity. Neutral expressions are forgettable.
          </li>
          <li>
            <strong>Match the emotion to the content.</strong> A shocked face
            for a surprising reveal. A happy face for good news. A concerned
            face for a problem.
          </li>
          <li>
            <strong>Avoid over-the-top expressions.</strong> Extreme fake
            expressions can look clickbaity and turn viewers off.
          </li>
          <li>
            <strong>Eyes matter most.</strong> Wide eyes draw attention. Make
            sure eyes are visible and well-lit.
          </li>
        </ul>

        <h3 className={s.subheading}>When to Skip Faces</h3>
        <p className={s.sectionText}>
          Not every thumbnail needs a face. Product reviews, tutorials, and some
          educational content can work better with clear shots of the subject
          matter. Test what works for your specific audience.
        </p>
      </section>

      {/* Colors and Contrast */}
      <section id="colors-and-contrast" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="13.5" cy="6.5" r="2.5" />
              <circle cx="17.5" cy="10.5" r="2.5" />
              <circle cx="8.5" cy="7.5" r="2.5" />
              <circle cx="6.5" cy="12.5" r="2.5" />
              <path d="M12 22v-6M12 13l-3-3 1-4 4 4-2 3z" />
            </svg>
          </span>
          Colors and Contrast
        </h2>
        <p className={s.sectionText}>
          Color choices affect whether your thumbnail stands out in the feed and
          how viewers perceive your content.
        </p>

        <h3 className={s.subheading}>Colors That Pop</h3>
        <ul className={s.list}>
          <li>
            <strong>Yellow and orange:</strong> High visibility, associated with
            energy and optimism
          </li>
          <li>
            <strong>Blue:</strong> Stands out against YouTube&apos;s red
            interface, feels professional
          </li>
          <li>
            <strong>Green:</strong> Associated with growth, money, and positivity
          </li>
          <li>
            <strong>Bright, saturated colors:</strong> Generally outperform muted
            or pastel tones
          </li>
        </ul>

        <h3 className={s.subheading}>Colors to Use Carefully</h3>
        <ul className={s.list}>
          <li>
            <strong>Red:</strong> Can blend with YouTube&apos;s interface. Use
            strategically.
          </li>
          <li>
            <strong>White:</strong> Can look washed out. Needs strong contrast
            elements.
          </li>
          <li>
            <strong>Dark backgrounds:</strong> Can disappear in dark mode. Ensure
            borders are visible.
          </li>
        </ul>

        <h3 className={s.subheading}>Creating Contrast</h3>
        <p className={s.sectionText}>
          Contrast makes elements readable and draws the eye to important parts.
          Use light against dark, warm against cool, or saturated against muted.
          Test your thumbnail in grayscale. If it still reads clearly, you have
          good contrast.
        </p>
      </section>

      {/* Thumbnail and Title Combo */}
      <section id="thumbnail-title-combo" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
          </span>
          Thumbnail and Title: Working Together
        </h2>
        <p className={s.sectionText}>
          Your thumbnail and title are partners. They appear together and should
          communicate more together than either could alone.
        </p>

        <h3 className={s.subheading}>The Partnership Principle</h3>
        <p className={s.sectionText}>
          Do not make them say the same thing. If your title is &ldquo;5 Budget
          Camera Tips&rdquo;, your thumbnail should not say &ldquo;5 Budget
          Camera Tips&rdquo;. Instead, show a camera, a price tag, or an
          expressive face. The thumbnail shows, the title tells.
        </p>

        <h3 className={s.subheading}>Effective Combinations</h3>
        <ul className={s.list}>
          <li>
            <strong>Title: specific claim.</strong> Thumbnail: emotional
            reaction or result.
          </li>
          <li>
            <strong>Title: how-to.</strong> Thumbnail: before and after or key
            visual.
          </li>
          <li>
            <strong>Title: question.</strong> Thumbnail: curiosity-inducing
            image.
          </li>
          <li>
            <strong>Title: list.</strong> Thumbnail: featured item or number.
          </li>
        </ul>

        <h3 className={s.subheading}>Test Them Together</h3>
        <p className={s.sectionText}>
          Before publishing, view your thumbnail and title together at the size
          they will appear in search results. Do they work as a unit? Would you
          click? Show them to someone who does not know what the video is about
          and ask what they think it covers.
        </p>
      </section>

      {/* Testing Thumbnails */}
      <section id="testing-thumbnails" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
            </svg>
          </span>
          Testing and Iterating
        </h2>
        <p className={s.sectionText}>
          The best creators test their thumbnails systematically. What works in
          one niche may not work in another. Find what resonates with your
          specific audience.
        </p>

        <h3 className={s.subheading}>Built-in A/B Testing</h3>
        <p className={s.sectionText}>
          YouTube offers a Test and Compare feature for some creators. Upload
          multiple thumbnails and YouTube will show each to different viewers,
          then report which performs better. Use this when available.
        </p>

        <h3 className={s.subheading}>Manual Testing</h3>
        <ol className={s.numberedList}>
          <li>
            Upload your video with your first thumbnail choice
          </li>
          <li>
            Wait 48 to 72 hours to gather meaningful CTR data
          </li>
          <li>
            Note the CTR in YouTube Studio
          </li>
          <li>
            Change the thumbnail to a different version
          </li>
          <li>
            Wait another 48 to 72 hours
          </li>
          <li>
            Compare the CTR. Keep the winner.
          </li>
        </ol>

        <h3 className={s.subheading}>What to Test</h3>
        <ul className={s.list}>
          <li>Face vs no face</li>
          <li>Different expressions</li>
          <li>Text vs no text</li>
          <li>Different color schemes</li>
          <li>Different compositions or layouts</li>
        </ul>
        <p className={s.sectionText}>
          Test one variable at a time so you know what actually made the
          difference.
        </p>
      </section>

      {/* Tools and Specs */}
      <section id="tools-and-specs" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </span>
          Tools and Technical Specs
        </h2>

        <h3 className={s.subheading}>YouTube Thumbnail Requirements</h3>
        <ul className={s.list}>
          <li>
            <strong>Resolution:</strong> 1280 × 720 pixels (minimum 640 pixels
            wide)
          </li>
          <li>
            <strong>Aspect ratio:</strong> 16:9
          </li>
          <li>
            <strong>File size:</strong> Under 2MB
          </li>
          <li>
            <strong>Formats:</strong> JPG, GIF, or PNG
          </li>
        </ul>

        <h3 className={s.subheading}>Free Tools</h3>
        <ul className={s.list}>
          <li>
            <strong>Canva:</strong> Templates and easy-to-use editor
          </li>
          <li>
            <strong>Photopea:</strong> Free Photoshop alternative in browser
          </li>
          <li>
            <strong>Remove.bg:</strong> Remove backgrounds from photos
          </li>
          <li>
            <strong>GIMP:</strong> Free desktop image editor
          </li>
        </ul>

        <h3 className={s.subheading}>Professional Tools</h3>
        <ul className={s.list}>
          <li>
            <strong>Adobe Photoshop:</strong> Industry standard for image editing
          </li>
          <li>
            <strong>Figma:</strong> Design tool with collaboration features
          </li>
          <li>
            <strong>Affinity Photo:</strong> One-time purchase Photoshop
            alternative
          </li>
        </ul>
      </section>

      {/* Common Mistakes */}
      <section id="common-mistakes" className={s.section}>
        <h2 className={s.sectionTitle}>
          <span className={s.sectionIcon}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M15 9l-6 6M9 9l6 6" />
            </svg>
          </span>
          Common Thumbnail Mistakes
        </h2>
        <ul className={s.list}>
          <li>
            <strong>Text too small.</strong> If viewers cannot read it on a
            phone, it is too small. Test at mobile sizes.
          </li>
          <li>
            <strong>Too cluttered.</strong> More elements do not mean more
            clicks. Simplify to 2 or 3 key elements.
          </li>
          <li>
            <strong>Low contrast.</strong> Elements that blend together become
            invisible at small sizes.
          </li>
          <li>
            <strong>Repeating the title.</strong> Thumbnail text should add
            information, not duplicate what is already visible.
          </li>
          <li>
            <strong>Misleading images.</strong> Clickbait thumbnails hurt
            retention. Deliver what you promise.
          </li>
          <li>
            <strong>Inconsistent branding.</strong> Returning viewers should
            recognize your style, but not so consistent that every video looks
            identical.
          </li>
          <li>
            <strong>Ignoring the competition.</strong> Look at what appears in
            search results for your topic. Your thumbnail needs to stand out
            from those.
          </li>
          <li>
            <strong>Never testing.</strong> You cannot improve what you do not
            measure. Test different approaches and track CTR.
          </li>
        </ul>
      </section>

      {/* CTA */}
      <div className={s.highlight}>
        <p>
          <strong>Create thumbnails faster.</strong> {BRAND.name} includes a
          thumbnail generator that helps you create eye-catching designs based
          on your video topic. Generate options, test different styles, and
          improve your CTR.
        </p>
      </div>
    </>
  );
}
