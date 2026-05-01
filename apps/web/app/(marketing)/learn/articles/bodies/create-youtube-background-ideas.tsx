/**
 * Body content for "This is How to Create YouTube Background Ideas For Any Budget".
 * Server component — no "use client" directive.
 *
 * Source: apps/web/content/learn/create-youtube-background-ideas.md
 * Body text is preserved word-for-word from the source markdown.
 */

import Image from "next/image";
import Link from "next/link";

import { LEARN_ARTICLES } from "../../articles";
import type { BodyProps } from "./_shared";
import { articleExports } from "./_shared";
import u from "./create-youtube-background-ideas.module.css";

export const { meta, toc } = articleExports(
  LEARN_ARTICLES["create-youtube-background-ideas"],
);

const HERO_SRC = "/learn/create-youtube-background-ideas/hero.png";
const CTA_SRC = "/learn/create-youtube-background-ideas/cta-audit.png";

/* ================================================================
 * INLINE ICONS (decorative, inherit currentColor)
 * ================================================================ */

function SunIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function CheckSquareIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 12.5l3 3 5-6" />
    </svg>
  );
}

function CubeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
      <path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" />
    </svg>
  );
}

function BulbIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18h6M10 21h4M12 3a6 6 0 00-4 10.5c.6.6 1 1.5 1 2.5h6c0-1 .4-1.9 1-2.5A6 6 0 0012 3z" />
    </svg>
  );
}

function FrameIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <rect x="6.5" y="6.5" width="11" height="11" rx="1" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l2.6 5.6 6.1.6-4.6 4.2 1.3 6-5.4-3.1-5.4 3.1 1.3-6L3.3 9.2l6.1-.6z" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 11l9-7 9 7v9a2 2 0 01-2 2h-4v-7h-6v7H5a2 2 0 01-2-2z" />
    </svg>
  );
}

function WandIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 21l12-12M14 4l1.5 1.5M19 8l1.5 1.5M16 12l1.5 1.5M11 7l1.5 1.5" />
    </svg>
  );
}

function BadgeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="9" r="6" />
      <path d="M9 14l-2 7 5-3 5 3-2-7" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4h11a3 3 0 013 3v13H7a3 3 0 01-3-3z" />
      <path d="M4 17a3 3 0 013-3h11" />
    </svg>
  );
}

function GamepadIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 16l-2 2a3 3 0 01-4-3l2-7a4 4 0 014-3h12a4 4 0 014 3l2 7a3 3 0 01-4 3l-2-2z" />
      <path d="M7 9v4M5 11h4M16 11h.01M19 13h.01" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
    </svg>
  );
}

/* ================================================================
 * BUDGET FRAMEWORK (CSS replacement for image2)
 * ================================================================ */

interface BudgetTier {
  className: string;
  price: string;
  label: string;
  focus: string;
  icons: readonly React.ReactNode[];
  chips: readonly string[];
}

const BUDGET_TIERS: readonly BudgetTier[] = [
  {
    className: u.budgetTierZero,
    price: "$0 – $50",
    label: "Zero Budget",
    focus: "Declutter & Depth",
    icons: [<SunIcon key="sun" />, <CheckSquareIcon key="check" />, <CubeIcon key="cube" />],
    chips: ["Natural Light", "Tidy space", "Personal items"],
  },
  {
    className: u.budgetTierMid,
    price: "$50 – $250",
    label: "Mid-Range",
    focus: "Control & Personality",
    icons: [<BulbIcon key="bulb" />, <FrameIcon key="frame" />, <StarIcon key="star" />],
    chips: ["Ring light", "Simple backdrop", "Curated props"],
  },
  {
    className: u.budgetTierHigh,
    price: "$250+",
    label: "High-End",
    focus: "Customization & Branding",
    icons: [<HomeIcon key="home" />, <WandIcon key="wand" />, <BadgeIcon key="badge" />],
    chips: ["Custom shelving", "RGB lighting", "Branded elements"],
  },
];

function BudgetFramework() {
  return (
    <div
      className={u.budgetStack}
      role="list"
      aria-label="Three budget tiers for YouTube backgrounds"
    >
      {BUDGET_TIERS.map((tier) => (
        <div
          key={tier.label}
          role="listitem"
          className={`${u.budgetCard} ${tier.className}`}
        >
          <div className={u.budgetPriceBlock}>
            <p className={u.budgetPrice}>{tier.price}</p>
            <p className={u.budgetTierLabel}>{tier.label}</p>
          </div>
          <div className={u.budgetFocusBlock}>
            <p className={u.budgetFocusLabel}>
              <strong>Key Focus:</strong> {tier.focus}
            </p>
            <div className={u.budgetIconRow} aria-hidden="true">
              {tier.icons}
            </div>
          </div>
          <div className={u.budgetChipRow}>
            {tier.chips.map((chip) => (
              <span key={chip} className={u.budgetChip}>
                {chip}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================================================================
 * NICHE GRID (CSS replacement for image3)
 * ================================================================ */

interface NicheCard {
  icon: React.ReactNode;
  title: string;
  chips: readonly string[];
}

const NICHE_CARDS: readonly NicheCard[] = [
  {
    icon: <GridIcon />,
    title: "Tech Channels",
    chips: ["Pegboard", "Cool LEDs", "Minimalist desk"],
  },
  {
    icon: <BookIcon />,
    title: "Educational Channels",
    chips: ["Bookshelf", "Whiteboard", "World map"],
  },
  {
    icon: <GamepadIcon />,
    title: "Gaming Channels",
    chips: ["RGB lighting", "Sound panels", "Collectibles shelf"],
  },
  {
    icon: <SparkleIcon />,
    title: "Lifestyle & Beauty",
    chips: ["Soft lights", "Vanity setup", "Greenery"],
  },
];

function NicheGrid() {
  return (
    <div
      className={u.nicheGrid}
      role="list"
      aria-label="Background ideas grouped by channel type"
    >
      {NICHE_CARDS.map((card) => (
        <div key={card.title} role="listitem" className={u.nicheCard}>
          <div className={u.nicheCardHeader}>
            <span className={u.nicheCardIcon} aria-hidden="true">
              {card.icon}
            </span>
            <h3 className={u.nicheCardTitle}>{card.title}</h3>
          </div>
          <div className={u.nicheChipRow}>
            {card.chips.map((chip) => (
              <span key={chip} className={u.nicheChip}>
                {chip}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================================================================
 * BUDGET TIER TABLE (preserved verbatim from md)
 * ================================================================ */

function BudgetTierTable() {
  return (
    <div className={u.tableWrap}>
      <table className={u.table}>
        <thead>
          <tr>
            <th>Budget Tier</th>
            <th>Key Focus</th>
            <th>Example Elements</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>$0 - $50</td>
            <td>Declutter &amp; Depth</td>
            <td>Natural light, tidy existing space, one or two personal items.</td>
          </tr>
          <tr>
            <td>$50 - $250</td>
            <td>Control &amp; Personality</td>
            <td>Dedicated lighting, simple backdrop, curated props.</td>
          </tr>
          <tr>
            <td>$250+</td>
            <td>Customization &amp; Branding</td>
            <td>Custom-built sets, advanced lighting, branded elements.</td>
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
      {/* Hero image (replaces image1 from md) */}
      <div className={u.heroImageWrap}>
        <Image
          src={HERO_SRC}
          alt="YouTube Background Ideas for Any Budget"
          width={1200}
          height={720}
          className={u.heroImage}
          priority
          sizes="(max-width: 768px) 100vw, 720px"
        />
      </div>

      <p className={u.lastUpdated}>Last Updated: 2 March 2026</p>

      {/* Intro (lines 12-18 of md) */}
      <section id="intro" className="sectionOpen">
        <p className={s.sectionText}>
          Your YouTube background is the unsung hero of your video&apos;s
          production value. A great background makes you look professional,
          builds trust with your audience, and helps tell your story before
          you&apos;ve said a word. A bad one does the opposite: it distracts
          viewers, looks unprofessional, and can make your content feel cheap,
          even if the information you&apos;re sharing is excellent.
        </p>

        <p className={s.sectionText}>
          A good background is an essential part of{" "}
          <Link href="/learn/how-to-be-a-youtuber">becoming a YouTuber</Link>.
          Many creators believe a high-quality YouTube background requires a
          dedicated studio or an expensive setup. They see their favorite
          YouTubers with elaborate, custom-built sets and assume it&apos;s out
          of reach, so they settle for a messy bedroom or a plain, boring wall.
          This is a missed opportunity.
        </p>

        <p className={s.sectionText}>
          Your background is a powerful tool for visual branding and viewer
          engagement. It sets the tone, establishes your niche, and can be the
          difference between a viewer who clicks away and one who subscribes.
          The good news is that creating an effective YouTube background has
          very little to do with how much money you spend. It&apos;s about
          being intentional.
        </p>

        <p className={s.sectionText}>
          With the right approach, you can create a professional-looking setup
          that enhances your content, no matter your budget.
        </p>
      </section>

      {/* Why Your YouTube Background Matters */}
      <section id="why-it-matters" className="sectionTinted">
        <h2 className={s.sectionTitle}>
          Why Your YouTube Background Matters More Than You Think
        </h2>

        <p className={s.sectionText}>
          A YouTube background does more than just fill the space behind you.
          It&apos;s a critical part of{" "}
          <Link href="/learn/how-to-make-a-youtube-channel">your channel</Link>
          &apos;s visual identity and has a direct impact on how viewers
          perceive your content. A well-thought-out background adds a layer of
          professionalism that signals to viewers that you take your content
          seriously. This builds subconscious trust and authority, making them
          more likely to listen to what you have to say.
        </p>

        <p className={s.sectionText}>
          It also plays a key role in managing viewer attention. A cluttered or
          distracting background pulls focus away from you and your message. A
          clean, intentional YouTube background, however, keeps the
          viewer&apos;s attention exactly where you want it: on you.
        </p>

        <p className={s.sectionText}>
          Your YouTube background is a form of visual storytelling that
          communicates your personality, your niche, and the overall vibe of
          your channel. A tech reviewer might have shelves of organized
          gadgets, while a cozy book-focused channel might use warm lighting
          and bookshelves. Your background is working for you long before your
          video&apos;s hook is delivered.
        </p>
      </section>

      {/* The Three-Tier Budget Framework */}
      <section id="budget-framework" className="sectionOpen">
        <h2 className={s.sectionTitle}>The Three-Tier Budget Framework</h2>

        <p className={s.sectionText}>
          Creating a professional YouTube background doesn&apos;t require a
          Hollywood budget. You can achieve a polished look at any price point
          by focusing on a few key principles: depth, lighting, and
          personality. Here&apos;s how to approach it across three common
          budget tiers.
        </p>

        {/* CSS replacement for image2 */}
        <BudgetFramework />

        {/* Markdown table preserved verbatim */}
        <BudgetTierTable />
      </section>

      {/* The Zero-Budget Background */}
      <section id="zero-budget" className="sectionTinted">
        <h3 className={s.sectionTitle}>
          The Zero-Budget Background: Work With What You Have
        </h3>

        <p className={s.sectionText}>
          A professional YouTube background is achievable with absolutely no
          spending. The goal here is to be resourceful and intentional with
          your existing environment.
        </p>

        <div className={u.tipBlock}>
          <p className={u.tipTitle}>Find the Best Light</p>
          <p className={u.tipText}>
            Natural light is your best friend. Position yourself facing a
            window to get soft, even lighting on your face. Avoid having a
            window directly behind you, as this will create a silhouette and
            make you hard to see. Good lighting makes any space look better.
          </p>
        </div>

        <div className={u.tipBlock}>
          <p className={u.tipTitle}>Declutter Your Space</p>
          <p className={u.tipText}>
            This is the most important step. Remove anything from the frame
            that doesn&apos;t need to be there. A tidy, organized space
            instantly looks more professional. You&apos;re not aiming for
            sterile minimalism, just a lack of distracting clutter. Check your
            shot in the camera to see what&apos;s actually visible.
          </p>
        </div>

        <div className={u.tipBlock}>
          <p className={u.tipTitle}>Create Depth</p>
          <p className={u.tipText}>
            Don&apos;t stand right against a wall. Putting some distance
            between you and your YouTube background creates a sense of depth
            that is more visually appealing. If you&apos;re in a small room,
            even a few feet of separation can make a significant difference.
            This helps the camera focus on you, slightly blurring the
            background.
          </p>
        </div>
      </section>

      {/* The Mid-Tier Background */}
      <section id="mid-tier" className="sectionOpen">
        <h3 className={s.sectionTitle}>
          The Mid-Tier Background: Invest in Control
        </h3>

        <p className={s.sectionText}>
          With a modest budget, you can move from working with your environment
          to controlling it. This is where you can start making deliberate
          choices that enhance your brand.
        </p>

        <div className={u.tipBlock}>
          <p className={u.tipTitle}>Invest in Lighting First</p>
          <p className={u.tipText}>
            A simple three-point lighting setup (a key light, a fill light, and
            a backlight) will elevate your video quality more than any other
            purchase. You can start with a single ring light or softbox for
            your key light. Good lighting gives you consistency, meaning you
            can film at any time of day and your videos will always look the
            same.
          </p>
        </div>

        <div className={u.tipBlock}>
          <p className={u.tipTitle}>Use a Simple Backdrop</p>
          <p className={u.tipText}>
            If your natural environment isn&apos;t suitable, a simple backdrop
            is a great investment. This could be a roll of seamless paper, a
            fabric backdrop, or even a freshly painted wall in a neutral color.
            This gives you a clean canvas to build upon.
          </p>
        </div>

        <div className={u.tipBlock}>
          <p className={u.tipTitle}>Add Personality with Props</p>
          <p className={u.tipText}>
            This is where you start telling a story. Add a few intentional
            items to your YouTube background that relate to your niche. For a
            channel about productivity, you might have a clean desk with a
            stylish lamp and a few books. For a gaming channel, you could have
            some subtle, curated merchandise or collectibles on a shelf. The
            key is &quot;curated&quot; - don&apos;t just add clutter.
          </p>
        </div>
      </section>

      {/* The High-End Background */}
      <section id="high-end" className="sectionTinted">
        <h3 className={s.sectionTitle}>
          The High-End Background: Build Your Brand World
        </h3>

        <p className={s.sectionText}>
          With a larger budget, you can create a fully customized set that
          becomes synonymous with your brand. This is about creating a unique
          and memorable environment.
        </p>

        <div className={u.tipBlock}>
          <p className={u.tipTitle}>Custom-Built Sets</p>
          <p className={u.tipText}>
            This could involve building custom shelving, creating a unique wall
            texture, or designing a multi-functional space. This is your chance
            to build a world that is instantly recognizable as yours. Think
            about how you can incorporate your brand colors and logo in a
            subtle, stylish way.
          </p>
        </div>

        <div className={u.tipBlock}>
          <p className={u.tipTitle}>Advanced Lighting &amp; Color</p>
          <p className={u.tipText}>
            Go beyond basic lighting with practical lights (lamps, LEDs in the
            shot) and colored accent lights. Use RGB light strips to add a
            splash of your brand color to the background. This creates a more
            dynamic and visually interesting scene.
          </p>
        </div>

        <div className={u.tipBlock}>
          <p className={u.tipTitle}>Incorporate Your Branding</p>
          <p className={u.tipText}>
            This is where you can add neon signs with your logo, custom
            artwork, or other elements that reinforce your brand identity. The
            goal is to create a space that no one else can replicate. When
            viewers see your YouTube background, they should know instantly
            that they&apos;re watching one of your videos.
          </p>
        </div>
      </section>

      {/* Background Ideas for Different Niches */}
      <section id="niche-ideas" className="sectionOpen">
        <h2 className={s.sectionTitle}>
          Background Ideas for Different Niches
        </h2>

        <p className={s.sectionText}>
          Your YouTube background should feel authentic to your content. A tech
          reviewer and a yoga instructor will have very different needs. Here
          are some ideas to get you started.
        </p>

        {/* CSS replacement for image3 */}
        <NicheGrid />

        <div className={u.tipBlock}>
          <p className={u.tipTitle}>For Tech Channels</p>
          <p className={u.tipText}>
            Clean lines, organized technology, and a modern aesthetic work
            well. Think pegboards with neatly arranged gadgets, minimalist
            desks, or shelves with curated tech products. Use cool-toned LED
            lighting to create a futuristic feel.
          </p>
        </div>

        <div className={u.tipBlock}>
          <p className={u.tipTitle}>For Educational Channels</p>
          <p className={u.tipText}>
            A background that inspires learning and authority is key. A
            bookshelf is a classic for a reason - it works. You could also use
            a clean whiteboard, a world map, or framed diagrams. The goal is to
            create an environment that feels credible and focused.
          </p>
        </div>

        <div className={u.tipBlock}>
          <p className={u.tipTitle}>For Gaming Channels</p>
          <p className={u.tipText}>
            This is a chance to be more expressive. RGB lighting is almost a
            requirement. You can also use sound-dampening panels (which are
            both practical and look great), shelves with collectibles, or a
            green screen to project gameplay or branded graphics. Just be
            careful to avoid it looking like a teenager&apos;s messy bedroom.
          </p>
        </div>

        <div className={u.tipBlock}>
          <p className={u.tipTitle}>For Lifestyle &amp; Beauty Channels</p>
          <p className={u.tipText}>
            A background that feels aspirational and aesthetically pleasing is
            important. Think soft lighting, clean and organized vanity setups,
            and perhaps a pop of greenery with a houseplant. The background
            should reflect the lifestyle you are promoting.
          </p>
        </div>
      </section>

      {/* What to Do Next with Your Background */}
      <section id="next-steps" className="sectionTinted">
        <h2 className={s.sectionTitle}>What to Do Next with Your Background</h2>

        <p className={s.sectionText}>
          Your YouTube background is a living part of your channel, not a
          one-time setup. As your channel grows and your style evolves,
          don&apos;t be afraid to tweak and update it. Small changes, like
          swapping out a plant or adding a new piece of art, can keep your
          visual presentation feeling fresh. The most important thing is to
          create a space that you feel comfortable and confident filming in.
          Your background is a reflection of your brand, so make it one
          you&apos;re proud of.
        </p>
      </section>

      {/* Related Guides */}
      <section id="related-guides" className="sectionOpen">
        <h2 className={s.sectionTitle}>Related Guides</h2>
        <ul className={u.relatedList}>
          <li>
            <Link href="/learn/youtube-thumbnail-best-practices">
              YouTube Thumbnail Best Practices
            </Link>
          </li>
          <li>
            <Link href="/learn/how-to-be-a-youtuber">How to Be a YouTuber</Link>
          </li>
          <li>
            <Link href="/learn/youtube-algorithm">YouTube Algorithm</Link>
          </li>
        </ul>

        <p className={u.ctaCallout}>
          <strong>
            Looking to grow your faster?{" "}
            <Link href="/">Get started with ChannelBoost</Link> to track your
            channel&apos;s performance and find what&apos;s actually working.
          </strong>
        </p>

        {/* CTA banner image (replaces image4 from md) */}
        <Link
          href="/"
          className={u.ctaBannerLink}
          aria-label="Get a free YouTube channel audit with ChannelBoost"
        >
          <Image
            src={CTA_SRC}
            alt="Get a Free YouTube Channel Audit. See exactly what's holding your channel back: retention, CTR, and growth gaps."
            width={1600}
            height={400}
            className={u.ctaBannerImage}
            sizes="(max-width: 768px) 100vw, 720px"
          />
        </Link>
      </section>
    </>
  );
}
