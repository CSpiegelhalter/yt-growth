/**
 * ArticleShell - Reusable page shell for all marketing articles.
 *
 * Layout (desktop >= 1100px):
 *   3-column grid: TOC (col 1) | Content (col 2) | Social (col 3)
 *   Footer sits below the grid, spanning TOC + Content width.
 *   Sticky sidebars are constrained to the grid (stop before footer).
 *
 * Layout (mobile):
 *   Collapsible TOC -> Content -> Social bar -> Footer
 *   (Controlled via CSS order on flex children.)
 *
 * Server component - ActiveToc and SocialShare are the client pieces.
 */

import type { StaticImageData } from "next/image";
import Image from "next/image";

import styles from "../../style.module.css";
import { ActiveToc } from "./ActiveToc";
import { SocialShare } from "./SocialShare";

interface TocItem {
  readonly id: string;
  readonly label: string;
  readonly level?: number;
}

interface ArticleShellProps {
  heroImage?: string | StaticImageData;
  heroAlt?: string;
  title: string;
  description: string;
  toc: readonly TocItem[];
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function ArticleShell({
  heroImage,
  heroAlt = "",
  title,
  description,
  toc,
  footer,
  children,
}: ArticleShellProps) {
  return (
    <>
      {/* Body grid: sticky sidebars are constrained to this container */}
      <div className={styles.shellLayout}>
        {/* Desktop col 1 sticky sidebar + mobile accordion */}
        <ActiveToc items={toc} />

        {/* Desktop col 2: main content */}
        <div className={styles.shellMain}>
          {heroImage && (
            <div className={styles.shellHero}>
              <Image
                src={heroImage}
                alt={heroAlt}
                width={960}
                height={540}
                className={styles.shellHeroImage}
                priority
                sizes="(max-width: 768px) 100vw, 720px"
              />
            </div>
          )}

          <h1 className={styles.shellTitle}>{title}</h1>
          <p className={styles.shellDescription}>{description}</p>

          <hr className={styles.shellSeparator} />

          <div className={styles.shellContent}>{children}</div>
        </div>

        {/* Desktop col 3 sticky sidebar + mobile bar */}
        <SocialShare title={title} />
      </div>

      {/* Footer outside grid so sticky sidebars stop before it */}
      {footer && <div className={styles.shellFooter}>{footer}</div>}
    </>
  );
}
